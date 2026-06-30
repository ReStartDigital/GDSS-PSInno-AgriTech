import { userRepository } from "../user/user.repository.js";
import { otpRepository } from "./otp.repository.js";
import { arkeselClient } from "../../infrastructure/arkesel/arkesel.client.js";
import { redisService } from "../../infrastructure/redis/redis.client.js";
import { AppException } from "../../common/exceptions/app.exceptions.js";
import { ErrorCode } from "../../common/constants/error-codes.enum.js";
import { UserRole } from "../../common/constants/roles.enums.js";
import { User } from "../../database/entities/User.js";
import { AUTH_CONSTANTS } from "../../common/constants/auth.constants.js";
import { logger } from "../../common/utils/logger.js";
import * as HashUtil from "../../common/utils/hash.util.js";
import * as JwtUtil from "../../infrastructure/jwt/jwt.util.js";

import type {
  LoginDto,
  RegisterDto,
  ResendOtpDto,
  SetPinDto,
  VerifyOtpDto,
} from "./auth.schemas.js";
import { UnprocessableException, ConflictException } from "../../common/exceptions/index.js";

export class AuthService {
  private userRepository = userRepository;
  private otpRepository = otpRepository;
  private arkeselService = arkeselClient;
  private redisService = redisService;
  public async register(
    dto: RegisterDto,
  ): Promise<{ message: string; expires_in_seconds: number }> {
    const { phone, firstName, middleName, lastName, role, email, location } =
      dto;

    const existingUser = await this.findByPhone(phone);

    if (existingUser && existingUser.phoneVerifiedAt) {
      throw new AppException(
        409,
        ErrorCode.PHONE_ALREADY_REGISTERED,
        "This phone number is already registered.",
      );
    }

    // Cooldown verification barrier to prevent SMS spamming
    const isOnCooldown = await this.otpRepository.isOnCooldown(phone);
    if (isOnCooldown) {
      throw new AppException(
        429,
        ErrorCode.RATE_LIMIT_EXCEEDED,
        "Please wait before requesting another verification code.",
      );
    }

    const fullName = `${firstName} ${middleName ?? ""} ${lastName}`
      .replace(/\s+/g, " ")
      .trim();

    // 1. Deliver the OTP challenge code to the device via Arkesel Gateway
    // try {
    //   await this.arkeselService.generateOtp(
    //     phone,
    //     AUTH_CONSTANTS.OTP.LENGTH,
    //     Math.floor(AUTH_CONSTANTS.OTP.EXPIRY_SECONDS / 60),
    //     fullName,
    //   );
    // } catch (smsError) {
    //   logger.error(
    //     `Arkesel gateway delivery rejection for ${phone}:`,
    //     smsError,
    //   );
    //   throw new AppException(
    //     422,
    //     ErrorCode.PHONE_CANNOT_BE_VERIFIED,
    //     "We could not send a verification code to this number. Please check and try again.",
    //   );
    // }
    await this.sendOtpOrThrow(phone, fullName);

    // 2. Log configuration and track security attempt limits in Redis
    const redisKey = `otp:${phone}`;
    await this.redisService.set(
      redisKey,
      JSON.stringify({ attempts: 0 }),
      AUTH_CONSTANTS.OTP.EXPIRY_SECONDS,
    );
    await this.otpRepository.setCooldown(phone);

    // 3. Perform an idempotent write operation into PostgreSQL using clean schemas
    if (existingUser) {
      await this.updateUnverifiedUser(existingUser.id, {
        firstName,
        middleName,
        lastName,
        role,
        email,
        location,
      });
      logger.info(
        `Registration context mapping updated for existing profile: ${phone}`,
      );
    } else {
      await this.createUnverifiedUser({
        phone,
        firstName,
        middleName,
        lastName,
        role,
        email,
        location,
      });
      logger.info(`New unverified database entity initialized for: ${phone}`);
    }

    return {
      message: existingUser
        ? "OTP code resent successfully."
        : "Verification code dispatched successfully.",
      expires_in_seconds: AUTH_CONSTANTS.OTP.EXPIRY_SECONDS,
    };
  }

  public async verifyOtp(
    dto: VerifyOtpDto,
  ): Promise<{ message: string; registration_token: string }> {
    const { phone, otp } = dto;
    const redisKey = `otp:${phone}`;

    const cachedOtpData = await this.redisService.get(redisKey);
    if (!cachedOtpData) {
      throw new AppException(
        410,
        ErrorCode.OTP_EXPIRED,
        "Verification code has expired or was never requested.",
      );
    }

    const otpRecord = JSON.parse(cachedOtpData);

    if (otpRecord.attempts >= AUTH_CONSTANTS.OTP.MAX_VERIFY_ATTEMPTS) {
      await this.redisService.del(redisKey);
      throw new AppException(
        429,
        ErrorCode.RATE_LIMIT_EXCEEDED,
        "Max validation attempts exceeded. Please restart registration.",
      );
    }

    // Direct transaction verification verification using Arkesel proxy
    try {
      const response = await this.arkeselService.verifyOtp(phone, otp);
      if (!response.success) {
        otpRecord.attempts += 1;
        await this.redisService.set(
          redisKey,
          JSON.stringify(otpRecord),
          AUTH_CONSTANTS.OTP.EXPIRY_SECONDS,
        );
        throw new AppException(
          422,
          ErrorCode.INVALID_OTP,
          "Incorrect verification code.",
        );
      }
    } catch (smsError) {
      if (smsError instanceof AppException) throw smsError;
      logger.error(`Third-party OTP verification pipeline error:`, smsError);
      throw new AppException(
        422,
        ErrorCode.INVALID_OTP,
        "OTP is not valid. Please check and try again.",
      );
    }

    const user = await this.findByPhone(phone);
    if (!user) {
      throw new AppException(
        404,
        ErrorCode.NOT_FOUND,
        "Registration profile missing during verification sequence.",
      );
    }

    // Promote row status parameters and sweep ephemeral operational records
    await this.markPhoneAsVerified(phone);
    await this.redisService.del(redisKey);

    const registrationToken = JwtUtil.signRegistrationToken(user.id, phone);
    logger.info(`Device possession handshake verified successfully: ${phone}`);

    return {
      message:
        "Phone verified successfully. Proceed to credentials assignment.",
      registration_token: registrationToken,
    };
  }

  public async setPin(
    phone: string,
    dto: SetPinDto,
  ): Promise<{
    user: Partial<User>;
    accessToken: string;
    refreshToken: string;
  }> {
    const { pin } = dto;

    const pinHash = await HashUtil.hashSecret(pin);
    const user = await this.completeRegistration(phone, pinHash);

    // Issue standard long-term production session token authorization blocks
    const accessToken = JwtUtil.signAccessToken(user.id, user.role);
    const refreshToken = JwtUtil.generateRefreshToken();

    // 💾 MUST SAVE TO REDIS SO THE REFRESH METHOD ABOVE CAN FIND IT LATER:
    await this.redisService.set(
      `session:refresh:${refreshToken}`,
      JSON.stringify({ userId: user.id, role: user.role }),
      AUTH_CONSTANTS.REFRESH_TOKEN.EXPIRY_SECONDS,
    );
    logger.info(
      `Profile credentials linked. Registration flow completed for ${phone} as [${user.role}]`,
    );

    return {
      user: { id: user.id, phone: user.phone, role: user.role },
      accessToken,
      refreshToken,
    };
  }

  public async login(
    dto: LoginDto,
  ): Promise<{
    user: Partial<User>;
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await this.findByPhone(dto.phone);
    if (!user || !user.isActive || !user.pinHash) {
      throw new AppException(
        401,
        ErrorCode.UNAUTHORIZED,
        "Invalid phone number or PIN configuration.",
      );
    }

    const isMatch = await HashUtil.verifySecret(dto.pin, user.pinHash);
    if (!isMatch) {
      throw new AppException(
        401,
        ErrorCode.UNAUTHORIZED,
        "Invalid phone number or PIN configuration.",
      );
    }

    const accessToken = JwtUtil.signAccessToken(user.id, user.role);
    const refreshToken = JwtUtil.generateRefreshToken();

    // 💾 MUST SAVE TO REDIS SO THE REFRESH METHOD ABOVE CAN FIND IT LATER:
    await this.redisService.set(
      `session:refresh:${refreshToken}`,
      JSON.stringify({ userId: user.id, role: user.role }),
      AUTH_CONSTANTS.REFRESH_TOKEN.EXPIRY_SECONDS,
    );

    return {
      user: { id: user.id, phone: user.phone, role: user.role },
      accessToken,
      refreshToken,
    };
  }
  private async sendOtpOrThrow(phone: string, full_name: string | null = null): Promise<void> {

    const sendResult = await arkeselClient.generateOtp(phone, AUTH_CONSTANTS.OTP.LENGTH, AUTH_CONSTANTS.OTP.EXPIRY_SECONDS / 60, full_name);

    if (!sendResult.success) {
      logger.warn('Failed to send OTP via Arkesel', { phone, reason: sendResult.errorReason });
      throw new UnprocessableException(
        'We could not send a verification code to this number. Please check the number and try again.',
        ErrorCode.PHONE_CANNOT_BE_VERIFIED,
      );
    }

    // VegeLink keeps its own hashed copy in Redis as the source of truth
    // for verification (see otp.repository.ts) — Arkesel's role here is
    // purely as the delivery channel and as the upfront validity check on
    // the phone number itself.
    await otpRepository.setCooldown(phone);
  }
    public resendOtp = async (dto: ResendOtpDto): Promise<{ message: string; expiresInSeconds: number }>  => {
      const existing = await userRepository.findByPhone(dto.phone);
  
      if (!existing) {
        // Nothing to resend to — do not reveal whether a row exists, just
        // treat it generically as "cannot verify" to avoid phone enumeration.
        throw new UnprocessableException(
          'We could not send a verification code to this number.',
          ErrorCode.PHONE_CANNOT_BE_VERIFIED,
        );
      }
  
      if (existing.phoneVerifiedAt) {
        throw new ConflictException(
          'This phone number is already registered. Try logging in instead.',
          ErrorCode.PHONE_ALREADY_REGISTERED,
        );
      }
  
      if (await otpRepository.isOnCooldown(dto.phone)) {
        throw new UnprocessableException(
          'Please wait a moment before requesting another code.',
          ErrorCode.RATE_LIMIT_EXCEEDED,
        );
      }
  
      await this.sendOtpOrThrow(dto.phone);
      return { message: 'OTP resent', expiresInSeconds: AUTH_CONSTANTS.OTP.EXPIRY_SECONDS };
    }
  /**
   * POST /auth/refresh
   * Implements secure single-use token rotation for mobile apps.
   * Validates the opaque refresh string against Redis, rotates it, and issues a new pair.
   */
  public async refresh(
    rawRefreshToken: string | undefined,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (!rawRefreshToken) {
      throw new AppException(
        401,
        ErrorCode.UNAUTHORIZED,
        "Session signature missing.",
      );
    }

    // 1. Look up the token in Redis to verify it's active and fetch the associated session data
    const redisKey = `session:refresh:${rawRefreshToken}`;
    const sessionDataStr = await this.redisService.get(redisKey);

    if (!sessionDataStr) {
      throw new AppException(
        401,
        ErrorCode.UNAUTHORIZED,
        "Session has expired or has been revoked. Please log in again.",
      );
    }

    const session = JSON.parse(sessionDataStr) as {
      userId: string;
      role: UserRole;
    };

    // 2. Enforce strict single-use token rotation (RTR) by instantly destroying the used token
    await this.redisService.del(redisKey);

    // 3. Issue a fresh stateless access token and a brand-new stateful refresh token
    const newAccessToken = JwtUtil.signAccessToken(
      session.userId,
      session.role,
    );
    const newRefreshToken = JwtUtil.generateRefreshToken();
    const newRedisKey = `session:refresh:${newRefreshToken}`;

    // 4. Save the new session state back to the whitelist cache with a rolling TTL window
    await this.redisService.set(
      newRedisKey,
      JSON.stringify({ userId: session.userId, role: session.role }),
      AUTH_CONSTANTS.REFRESH_TOKEN.EXPIRY_SECONDS,
    );

    logger.info(
      `Session rotated successfully via token swap for user: ${session.userId}`,
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * POST /auth/logout
   * Explicitly evicts the token whitelist pointer from Redis, instantly killing the session.
   */
  public async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (rawRefreshToken) {
      const redisKey = `session:refresh:${rawRefreshToken}`;

      // Pull session metadata for clean logging audit trail before deletion
      const sessionData = await this.redisService.get(redisKey);
      if (sessionData) {
        const { userId } = JSON.parse(sessionData);
        logger.info(
          `Evicting active session whitelist key for user: ${userId}`,
        );
      }

      // Evict the key from memory. Even if a bad actor has this token, it is now useless.
      await this.redisService.del(redisKey);
    }

    logger.info("Session context torn down successfully.");
  }

  /**
   * Delegates the unique phone lookup to the database abstraction repository layer.
   */
  public async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findByPhone(phone);
  }

  /**
   * Auto-generates a synthetic email and formats spatial fields before
   * storing unverified user details into Postgres via TypeORM.
   */
  public async createUnverifiedUser(data: {
    phone: string;
    firstName: string;
    middleName?: string | null | undefined;
    lastName: string;
    role: UserRole;
    email?: string | null | undefined;
    location?: { longitude: number; latitude: number } | null | undefined;
  }): Promise<User> {
    // Normalizes phone string to strip special characters for the virtual email domain
    const cleanPhone = data.phone.replace(/[^0-9]/g, "");
    const virtualEmail = data.email || `user_${cleanPhone}@vegelink.app`;

    // Format coordinates into a PostGIS Well-Known Text (WKT) POINT string
    const wktLocation = data.location
      ? {
          type: "Point" as const,
          coordinates: [data.location.longitude, data.location.latitude] as [number, number], // [X, Y] / [Lng, Lat]
        }
      : null;

    return this.userRepository.createUnverified({
      phone: data.phone,
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      role: data.role,
      email: virtualEmail,
      location: wktLocation,
    });
  }

  /**
   * Updates an existing unverified record allowing idempotent registration retries.
   */
  public async updateUnverifiedUser(
    id: string,
    data: {
      firstName: string;
      middleName?: string | null | undefined;
      lastName: string;
      role: UserRole;
      email?: string | null | undefined;
      location?: { longitude: number; latitude: number } | null | undefined;
    },
  ): Promise<User> {
    const user = await this.userRepository.findById(id);

    // Safety block: Check using our TypeORM timestamp field 'phoneVerifiedAt'
    if (!user || user.phoneVerifiedAt !== null) {
      throw new AppException(
        400,
        ErrorCode.BAD_REQUEST,
        "Cannot modify profile state for a verified user context.",
      );
    }

    const wktLocation = data.location
      ? {
          type: "Point" as const,
          coordinates: [data.location.longitude, data.location.latitude] as [number, number], // [X, Y] / [Lng, Lat]
        }
      : null;

    return this.userRepository.updateUnverifiedDetails(id, {
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      role: data.role,
      ...(data.email && { email: data.email }),
      location: wktLocation,
    });
  }

  /**
   * Promotes the user's phone verification status upon successful OTP checking.
   */
  public async markPhoneAsVerified(phone: string): Promise<void> {
    const user = await this.userRepository.findByPhone(phone);

    if (!user) {
      throw new AppException(
        404,
        ErrorCode.NOT_FOUND,
        "No registration profile found matching this phone number.",
      );
    }

    if (user.phoneVerifiedAt !== null) {
      return; // Already verified safely
    }

    await this.userRepository.markPhoneVerified(user.id);
  }

  /**
   * Finalizes the account registration by linking the securely hashed credential PIN.
   */
  public async completeRegistration(
    phone: string,
    pinHash: string,
  ): Promise<User> {
    const user = await this.userRepository.findByPhone(phone);

    if (!user || user.phoneVerifiedAt === null) {
      throw new AppException(
        422,
        ErrorCode.BAD_REQUEST,
        "Registration flow out of sync. Verify phone number first.",
      );
    }

    return this.userRepository.setPinHash(user.id, pinHash);
  }
}
