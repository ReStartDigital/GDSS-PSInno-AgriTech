import crypto from "crypto";
import { AUTH_CONSTANTS } from "../constants/auth.constants.js";

/**
 * Generates a cryptographically secure numeric OTP.
 *
 * Math.random() is NOT used here deliberately — it is not a CSPRNG and its
 * output is predictable enough to be a real attack surface for something as
 * sensitive as an account-verification code. crypto.randomInt is.
 */
export function generateOtp(
  length: number = AUTH_CONSTANTS.OTP.LENGTH,
): string {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return crypto.randomInt(min, max + 1).toString();
}

/** Builds the Redis key for an OTP record, scoped by phone number. */
export function otpRedisKey(phone: string): string {
  return `otp:${phone}`;
}

/** Builds the Redis key tracking failed verify attempts, scoped by phone number. */
export function otpAttemptsRedisKey(phone: string): string {
  return `otp:attempts:${phone}`;
}

/** Builds the Redis key for the resend cooldown guard. */
export function otpCooldownRedisKey(phone: string): string {
  return `otp:cooldown:${phone}`;
}
