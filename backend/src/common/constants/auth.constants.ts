import dotenv from 'dotenv';
// Ensure env vars are loaded if this file is imported early in the lifecycle
dotenv.config();

/**
 * Centralised tunables driven dynamically by environment variables 
 * to support multi-environment configurations (Dev, Test, Prod).
 */
export const AUTH_CONSTANTS = {
  OTP: {
    LENGTH: Number(process.env.AUTH_OTP_LENGTH) || 6,
    EXPIRY_SECONDS: Number(process.env.AUTH_OTP_EXPIRY_SECONDS) || 600, // Default: 10 minutes
    MAX_VERIFY_ATTEMPTS: Number(process.env.AUTH_OTP_MAX_ATTEMPTS) || 3,
    RESEND_COOLDOWN_SECONDS: Number(process.env.AUTH_OTP_COOLDOWN_SECONDS) || 60, // Prevent spamming resend buttons
  },
  REGISTRATION_TOKEN: {
    EXPIRY_SECONDS: Number(process.env.AUTH_REG_TOKEN_EXPIRY_SECONDS) || 300, // Default: 5 minutes (OTP verify -> PIN setup window)
  },
  ACCESS_TOKEN: {
    EXPIRY: process.env.AUTH_ACCESS_TOKEN_EXPIRY || '15m',
  },
  REFRESH_TOKEN: {
    EXPIRY: process.env.AUTH_REFRESH_TOKEN_EXPIRY || '7d',
    EXPIRY_SECONDS: Number(process.env.AUTH_REFRESH_TOKEN_EXPIRY_SECONDS) || 7 * 24 * 60 * 60, // Default: 7 days
  },
  PIN: {
    MIN_LENGTH: Number(process.env.AUTH_PIN_MIN_LENGTH) || 4,
    MAX_LENGTH: Number(process.env.AUTH_PIN_MAX_LENGTH) || 6,
  },
  RATE_LIMIT: {
    AUTH_WINDOW_MS: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // Default: 15 minutes
    AUTH_MAX_REQUESTS: Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 5, // Strictly blocks Arkesel gateway abuse
    GENERAL_WINDOW_MS: Number(process.env.RATE_LIMIT_GEN_WINDOW_MS) || 15 * 60 * 1000,
    GENERAL_MAX_REQUESTS: Number(process.env.RATE_LIMIT_GEN_MAX_REQUESTS) || 100,
  },
  UNVERIFIED_REGISTRATION_TTL_HOURS: Number(process.env.AUTH_UNVERIFIED_USER_TTL_HOURS) || 24, // Threshold for the database cleanup cron job
} as const;