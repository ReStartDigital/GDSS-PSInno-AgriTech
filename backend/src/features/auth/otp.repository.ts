import { redisService } from "../../infrastructure/redis/redis.client.js";
import { hashSecret, verifySecret } from "../../common/utils/hash.util.js";
import {
  otpRedisKey,
  otpAttemptsRedisKey,
  otpCooldownRedisKey,
} from "../../common/utils/otp.util.js";
import { AUTH_CONSTANTS } from "../../common/constants/auth.constants.js";

/**
 * All OTP state lives in Redis, never in Postgres. It is inherently
 * short-lived (10-minute TTL), high-write, and has zero value once expired
 * or consumed — exactly the access pattern Redis is built for, and it keeps
 * the relational schema free of churn-heavy verification noise.
 */
export class OtpRepository {
  /** Stores a bcrypt-hashed OTP with a TTL. Overwrites any previous OTP for this phone. */
  async store(phone: string, otp: string): Promise<void> {
    const hash = await hashSecret(otp);
    await redisService.set(
      otpRedisKey(phone),
      hash,
      AUTH_CONSTANTS.OTP.EXPIRY_SECONDS,
    );
    // Reset the attempt counter whenever a fresh OTP is issued.
    await redisService.del(otpAttemptsRedisKey(phone));
  }

  /** Returns true if an OTP currently exists (not yet expired) for this phone. */
  async exists(phone: string): Promise<boolean> {
    const result = await redisService.exists(otpRedisKey(phone));
    return result !== null;
  }

  /**
   * Verifies a submitted OTP against the stored hash.
   * Returns 'valid' | 'invalid' | 'expired' | 'locked' — locked means the
   * attempt cap has been hit and the user must request a new OTP.
   */
  async verify(
    phone: string,
    submitted: string,
  ): Promise<"valid" | "invalid" | "expired" | "locked"> {
    const storedHash = await redisService.get(otpRedisKey(phone));
    if (!storedHash) {
      // No active OTP for this phone — expired or never requested. Checked
      // before incrementing attempts so a stale request can't accidentally
      // burn through the attempt budget for a code that no longer exists.
      return "expired";
    }

    const attempts = await this.incrementAttempts(phone);
    if (attempts > AUTH_CONSTANTS.OTP.MAX_VERIFY_ATTEMPTS) {
      return "locked";
    }

    const isMatch = await verifySecret(submitted, storedHash);
    if (!isMatch) {
      return "invalid";
    }

    // Consume the OTP on successful verification — a code can only ever be used once.
    await redisService.del(otpRedisKey(phone));
    await redisService.del(otpAttemptsRedisKey(phone));
    return "valid";
  }

  private async incrementAttempts(phone: string): Promise<number> {
    const key = otpAttemptsRedisKey(phone);
    const count = await redisService.incr(key);
    if (count === 1) {
      // First attempt on this OTP — set the same expiry as the OTP itself
      // so the attempt counter doesn't outlive the code it's guarding.
      await redisService.expire(key, AUTH_CONSTANTS.OTP.EXPIRY_SECONDS);
    }
    return count;
  }

  /** Cooldown guard so a user can't spam the resend button. */
  async isOnCooldown(phone: string): Promise<boolean> {
    const result = await redisService.exists(otpCooldownRedisKey(phone));
    return result;
  }

  async setCooldown(phone: string): Promise<void> {
    await redisService.set(
      otpCooldownRedisKey(phone),
      "1",
      AUTH_CONSTANTS.OTP.RESEND_COOLDOWN_SECONDS,
    );
  }
}

export const otpRepository = new OtpRepository();
