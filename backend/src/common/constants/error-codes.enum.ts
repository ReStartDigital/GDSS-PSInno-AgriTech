/**
 * Central registry of every error code the API can return.
 * Keeping these in one file prevents typos like "PHONE_ALREADY_REGISTERD"
 * silently breaking frontend error handling.
 */
export enum ErrorCode {
  // ── Generic ──────────────────────────────────────────────────────────────
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  BAD_REQUEST = "BAD_REQUEST",

  // ── Auth: registration ───────────────────────────────────────────────────
  PHONE_ALREADY_REGISTERED = "PHONE_ALREADY_REGISTERED",
  PHONE_CANNOT_BE_VERIFIED = "PHONE_CANNOT_BE_VERIFIED",

  // ── Auth: OTP ────────────────────────────────────────────────────────────
  INVALID_OTP = "INVALID_OTP",
  OTP_EXPIRED = "OTP_EXPIRED",
  OTP_ATTEMPTS_EXCEEDED = "OTP_ATTEMPTS_EXCEEDED",
  OTP_NOT_REQUESTED = "OTP_NOT_REQUESTED",

  // ── Auth: registration token / pin ──────────────────────────────────────
  REGISTRATION_TOKEN_INVALID = "REGISTRATION_TOKEN_INVALID",
  REGISTRATION_TOKEN_EXPIRED = "REGISTRATION_TOKEN_EXPIRED",
  PHONE_NOT_VERIFIED = "PHONE_NOT_VERIFIED",
  PIN_ALREADY_SET = "PIN_ALREADY_SET",

  // ── Auth: login ──────────────────────────────────────────────────────────
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  ACCOUNT_SUSPENDED = "ACCOUNT_SUSPENDED",
  ACCOUNT_NOT_VERIFIED = "ACCOUNT_NOT_VERIFIED",

  // ── Auth: tokens ─────────────────────────────────────────────────────────
  REFRESH_TOKEN_MISSING = "REFRESH_TOKEN_MISSING",
  REFRESH_TOKEN_INVALID = "REFRESH_TOKEN_INVALID",
  REFRESH_TOKEN_EXPIRED = "REFRESH_TOKEN_EXPIRED",
  REFRESH_TOKEN_REUSE = "REFRESH_TOKEN_REUSE",

  // ── Users — profile ───────────────────────────────────────────────────────
  USER_NOT_FOUND = "USER_NOT_FOUND",
  INVALID_CURRENT_PIN = "INVALID_CURRENT_PIN",
  SAME_PIN_AS_CURRENT = "SAME_PIN_AS_CURRENT",
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  INVALID_FILE_TYPE = "INVALID_FILE_TYPE",

  // ── Users — payment details ───────────────────────────────────────────────
  PAYMENT_DETAILS_NOT_SET = "PAYMENT_DETAILS_NOT_SET",
  PAYSTACK_SUBACCOUNT_FAILED = "PAYSTACK_SUBACCOUNT_FAILED",
  UNSUPPORTED_MOBILE_NETWORK = "UNSUPPORTED_MOBILE_NETWORK",
  PAYMENT_DETAILS_ROLE_FORBIDDEN = "PAYMENT_DETAILS_ROLE_FORBIDDEN",

  // ── Agent ─────────────────────────────────────────────────────────────────
  NOT_AN_AGENT = "NOT_AN_AGENT",
  CLIENT_NOT_FOUND = "CLIENT_NOT_FOUND",
  ALREADY_HAS_ACTIVE_AGENT = "ALREADY_HAS_ACTIVE_AGENT",
  CANNOT_ASSIGN_SELF = "CANNOT_ASSIGN_SELF",
  CLIENT_ALREADY_REGISTERED = "CLIENT_ALREADY_REGISTERED",
}
