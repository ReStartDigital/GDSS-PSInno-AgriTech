/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  jest,
  describe,
  beforeEach,
  afterAll,
  it,
  expect,
} from "@jest/globals";
import { AuthService } from "../../src/features/auth/auth.service.js";
import { userRepository } from "../../src/features/user/user.repository.js";
import { otpRepository } from "../../src/features/auth/otp.repository.js";
import { arkeselClient } from "../../src/infrastructure/arkesel/arkesel.client.js";
import { redisService } from "../../src/infrastructure/redis/redis.client.js";
import { AppException } from "../../src/common/exceptions/app.exceptions.js";
import { UserRole } from "../../src/common/constants/roles.enums.js";
import { User } from "../../src/database/entities/User.js";
import { hashSecret } from "../../src/common/utils/hash.util.js";

// 1. Stub the JWT and Hash utilities to keep things fast and stateless
jest.mock("../../src/infrastructure/jwt/jwt.util.js", () => ({
  signRegistrationToken: () => "mock-registration-token",
  signAccessToken: () => "mock-access-token",
  generateRefreshToken: () => "mock-refresh-token",
}));

jest.mock("../../src/common/utils/hash.util.js", () => ({
  hashSecret: () => Promise.resolve("hashed-pin"),
  verifySecret: (secret: unknown) => Promise.resolve(secret === "1234"),
}));

const authService = new AuthService();
const basePhone = "+233244123456";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    phone: basePhone,
    firstName: "Abena",
    middleName: null,
    lastName: "Mensah",
    role: UserRole.FARMER,
    email: "user_233244123456@vegelink.app",
    pinHash: null,
    phoneVerifiedAt: null,
    isActive: true,
    ...overrides,
  } as unknown as User;
}

// References to hold our Jest Spies
let mockUserRepo: Record<string, any> = {};
let mockOtpRepo: Record<string, any> = {};
let mockArkesel: Record<string, any> = {};
let mockRedis: Record<string, any> = {};

describe("AuthService Integration Suite", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // 2. ESM Fix: Use jest.spyOn to dynamically hijack repository functions
    mockUserRepo = {
      findByPhone: jest.spyOn(userRepository, "findByPhone"),
      findById: jest.spyOn(userRepository, "findById"),
      createUnverified: jest.spyOn(userRepository, "createUnverified"),
      updateUnverifiedDetails: jest.spyOn(
        userRepository,
        "updateUnverifiedDetails",
      ),
      markPhoneVerified: jest.spyOn(userRepository, "markPhoneVerified"),
      setPinHash: jest.spyOn(userRepository, "setPinHash"),
    };

    mockOtpRepo = {
      isOnCooldown: jest.spyOn(otpRepository, "isOnCooldown"),
      setCooldown: jest.spyOn(otpRepository, "setCooldown"),
    };

    mockArkesel = {
      generateOtp: jest.spyOn(arkeselClient, "generateOtp"),
      verifyOtp: jest.spyOn(arkeselClient, "verifyOtp"),
    };

    mockRedis = {
      get: jest.spyOn(redisService, "get"),
      set: jest.spyOn(redisService, "set"),
      del: jest.spyOn(redisService, "del"),
    };
  });

  // 3. Fix Hanging Process: Disconnect live background services after tests finish
  afterAll(async () => {
    if (redisService) {
      // If your RedisService wrapper exposes a disconnect or raw client, use that.
      // Otherwise, calling disconnect directly on the underlying client avoids ECONNRESET.
      if (typeof redisService.disconnect === "function") {
        await redisService.disconnect();
      } else if (typeof redisService.quit === "function") {
        await redisService.quit();
      }
    }
  });

  describe("AuthService.register", () => {
    it("CASE A: no existing row — sends OTP then creates an unverified user", async () => {
      mockUserRepo.findByPhone.mockResolvedValue(null);
      mockOtpRepo.isOnCooldown.mockResolvedValue(false);
      mockArkesel.generateOtp.mockResolvedValue({ success: true });
      mockUserRepo.createUnverified.mockResolvedValue(buildUser());
      mockRedis.set.mockResolvedValue("OK");
      mockOtpRepo.setCooldown.mockResolvedValue(undefined);

      const result = await authService.register({
        phone: basePhone,
        firstName: "Abena",
        lastName: "Mensah",
        role: UserRole.FARMER,
      });

      expect(mockArkesel.generateOtp).toHaveBeenCalledTimes(1);
      expect(mockUserRepo.createUnverified).toHaveBeenCalledTimes(1);
      expect(result.message).toBe("Verification code dispatched successfully.");
    });

    it("CASE B: existing verified row — throws Conflict Exception", async () => {
      mockUserRepo.findByPhone.mockResolvedValue(
        buildUser({ phoneVerifiedAt: new Date() }),
      );

      await expect(
        authService.register({
          phone: basePhone,
          firstName: "Abena",
          lastName: "Mensah",
          role: UserRole.FARMER,
        }),
      ).rejects.toBeInstanceOf(AppException);

      expect(mockArkesel.generateOtp).not.toHaveBeenCalled();
    });

    it("CASE C: existing unverified row — resends OTP and updates details inline", async () => {
      mockUserRepo.findByPhone.mockResolvedValue(
        buildUser({ phoneVerifiedAt: null }),
      );
      mockOtpRepo.isOnCooldown.mockResolvedValue(false);
      mockArkesel.generateOtp.mockResolvedValue({ success: true });
      mockUserRepo.updateUnverifiedDetails.mockResolvedValue(buildUser());
      mockUserRepo.findById.mockResolvedValue(buildUser());
      mockRedis.set.mockResolvedValue("OK");
      mockOtpRepo.setCooldown.mockResolvedValue(undefined);

      const result = await authService.register({
        phone: basePhone,
        firstName: "Abena Updated",
        lastName: "Mensah",
        role: UserRole.AGENT,
      });
      console.log(result);

      expect(mockUserRepo.createUnverified).not.toHaveBeenCalled();
      expect(mockUserRepo.updateUnverifiedDetails).toHaveBeenCalled();
      expect(result.message).toBe("OTP code resent successfully.");
    });

    it("Arkesel send failure: breaks operational logic flow and writes nothing", async () => {
      mockUserRepo.findByPhone.mockResolvedValue(null);
      mockOtpRepo.isOnCooldown.mockResolvedValue(false);
      mockArkesel.generateOtp.mockResolvedValue({
        success: false,
        errorReason: "INSUFFICIENT_BALANCE",
      });

      await expect(
        authService.register({
          phone: basePhone,
          firstName: "Abena",
          lastName: "Mensah",
          role: UserRole.FARMER,
        }),
      ).rejects.toBeInstanceOf(AppException);

      expect(mockUserRepo.createUnverified).not.toHaveBeenCalled();
      expect(mockRedis.set).not.toHaveBeenCalled();
    });
  });

  describe("AuthService.verifyOtp", () => {
    it("valid OTP marks user as verified", async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({ attempts: 0 }));
      mockArkesel.verifyOtp.mockResolvedValue({ success: true });
      mockUserRepo.findByPhone.mockResolvedValue(buildUser());
      mockUserRepo.markPhoneVerified.mockResolvedValue(undefined);
      mockRedis.del.mockResolvedValue(1);

      const result = await authService.verifyOtp({
        phone: basePhone,
        otp: "123456",
      });

      expect(mockUserRepo.markPhoneVerified).toHaveBeenCalledWith("user-1");
      expect(result.registration_token).toBeDefined();
      expect(result.registration_token).toContain("eyJ");
    });
  });

  describe("AuthService.setPin", () => {
    it("sets pin and issues authentication keys", async () => {
      mockUserRepo.findByPhone.mockResolvedValue(
        buildUser({ phoneVerifiedAt: new Date() }),
      );
      mockUserRepo.setPinHash.mockResolvedValue(
        buildUser({ pinHash: "hashed-pin" }),
      );
      mockRedis.set.mockResolvedValue("OK");

      const result = await authService.setPin(basePhone, { pin: "1234" });
      expect(mockUserRepo.setPinHash).toHaveBeenCalledWith(
        "user-1",
        expect.stringMatching(/^\$2[aby]\$\d{2}\$/),
      );

      // Check that tokens are returned (using our loose prefix check or just existence checks)
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });
  });

  describe("AuthService.login", () => {
    it("validates pin verification and yields access tokens", async () => {
      const token = await hashSecret("1234");
      mockUserRepo.findByPhone.mockResolvedValue(
        buildUser({ pinHash: token, isActive: true }),
      );
      mockRedis.set.mockResolvedValue("OK");

      const result = await authService.login({ phone: basePhone, pin: "1234" });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });
    it("validates wrong pin verification and yields access tokens", async () => {
      mockUserRepo.findByPhone.mockResolvedValue(
        buildUser({ pinHash: "hash-ping", isActive: true }),
      );
      mockRedis.set.mockResolvedValue("OK");

      await expect(
        authService.login({ phone: basePhone, pin: "1234" }),
      ).rejects.toBeInstanceOf(AppException);
    });
  });
});
