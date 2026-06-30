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
}
