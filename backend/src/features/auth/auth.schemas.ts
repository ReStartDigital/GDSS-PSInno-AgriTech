import { z } from "zod";
import { AUTH_CONSTANTS } from "../../common/constants/auth.constants.js";
import { normalizePhone } from "../../common/utils/phone.util.js";
import { UserRole } from "../../common/constants/roles.enums.js";
/**
 * Shared phone field — normalises whatever format the user typed into
 * consistent E.164 (+233XXXXXXXXX) before any downstream logic ever sees it.
 * Rejects anything that doesn't resolve to a valid Ghanaian mobile number.
 */
const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .transform((val, ctx) => {
    const normalized = normalizePhone(val);
    if (!normalized) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Enter a valid Ghanaian phone number in E.164 format, e.g. +233244123456",
      });
      return z.NEVER;
    }
    return normalized;
  });

const emailRules = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: "Invalid email address format" })
  .optional()
  .nullable();
const pinSchema = z
  .string()
  .min(
    AUTH_CONSTANTS.PIN.MIN_LENGTH,
    `PIN must be at least ${AUTH_CONSTANTS.PIN.MIN_LENGTH} digits`,
  )
  .max(
    AUTH_CONSTANTS.PIN.MAX_LENGTH,
    `PIN must be at most ${AUTH_CONSTANTS.PIN.MAX_LENGTH} digits`,
  )
  .regex(/^\d+$/, "PIN must contain only digits");

const otpSchema = z
  .string()
  .length(
    AUTH_CONSTANTS.OTP.LENGTH,
    `Verification code must be ${AUTH_CONSTANTS.OTP.LENGTH} digits`,
  )
  .regex(/^\d+$/, "Verification code must contain only digits");

/**
 * 🌍 PostGIS Coordinate validation parser
 * Supports explicit structural validation matching frontend inputs
 */
const locationSchema = z
  .object({
    longitude: z.number().min(-180).max(180),
    latitude: z.number().min(-90).max(90),
  })
  .optional()
  .nullable();

// ── Step 1: POST /auth/register ───────────────────────────────────────────────
// Deliberately does NOT include a pin field — see design rationale in the
// project documentation. Registration only ever proves "I want to create an
// account with this name/role for this phone", verified by OTP possession.
// The PIN (the actual login credential) is set in a separate step, after
// the phone has been proven reachable, never before.
export const registerSchema = z.object({
  phone: phoneSchema,
  firstName: z.string().trim().min(1, "First name is required").max(255),
  middleName: z.string().trim().max(255).optional().nullable(),
  lastName: z.string().trim().min(1, "Last name is required").max(255),
  region: z.string().trim().max(255).default("Ashanti"),
  language: z.string().trim().max(255).default("en"),
  role: z.nativeEnum(UserRole, {
    message: "Invalid platform group role provided.",
  }),
  email: emailRules,
  location: locationSchema,
});
export type RegisterDto = z.infer<typeof registerSchema>;

// ── Step 2: POST /auth/verify-otp ─────────────────────────────────────────────
// Only verifies phone possession. No pin field here either — verifying an
// OTP and setting a credential are two unrelated concerns and must not be
// conflated into a single request/response cycle.
export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
});
export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;

// ── Resend OTP (used by both initial register retry and explicit resend) ─────
export const resendOtpSchema = z.object({
  phone: phoneSchema,
});
export type ResendOtpDto = z.infer<typeof resendOtpSchema>;

// ── Step 3: POST /auth/set-pin ────────────────────────────────────────────────
// Requires a valid registration token (Bearer header, checked by middleware,
// not part of the body schema). Body only carries the new credential.
export const setPinSchema = z.object({
  pin: pinSchema,
});
export type SetPinDto = z.infer<typeof setPinSchema>;

// ── POST /auth/login ───────────────────────────────────────────────────────────
export const loginSchema = z.object({
  phone: phoneSchema,
  pin: pinSchema,
});
export type LoginDto = z.infer<typeof loginSchema>;

// ── POST /auth/refresh — no body, refresh token comes from httpOnly cookie ───
// No schema needed; included here only for completeness/documentation.

// ── POST /auth/logout — no body, access token comes from Authorization header ─
// No schema needed.
