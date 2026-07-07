import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import type { Request, Response } from "express";
import { redisService } from "../../infrastructure/redis/redis.client.js";
import { AUTH_CONSTANTS } from "../constants/auth.constants.js";
import { sendError } from "../dto/api-response.dto.js";
import { ErrorCode } from "../constants/error-codes.enum.js";

/**
 * Shared handler so every rate-limited route returns the same response
 * envelope shape as the rest of the API instead of express-rate-limit's
 * default plain-text body.
 */
function rateLimitHandler(req: Request, res: Response) {
  sendError(
    res,
    429,
    ErrorCode.RATE_LIMIT_EXCEEDED,
    "Too many requests. Please try again later.",
  );
}

/**
 * Strict limiter for auth endpoints — register, verify-otp, set-pin, login.
 * 5 requests per 15 minutes per IP. This is the primary defence against
 * OTP brute-forcing and credential stuffing.
 */
export const authRateLimiter = rateLimit({
  windowMs: AUTH_CONSTANTS.RATE_LIMIT.AUTH_WINDOW_MS,
  max:
    process.env.NODE_ENV === "development"
      ? 100
      : AUTH_CONSTANTS.RATE_LIMIT.AUTH_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  store: new RedisStore({
    sendCommand: async (command: string, ...args: string[]) =>
      redisService.call(command, ...args),
    prefix: "rl:auth:",
  }),
});

/** General-purpose limiter for everything else. 100 requests / 15 minutes per IP. */
export const generalRateLimiter = rateLimit({
  windowMs: AUTH_CONSTANTS.RATE_LIMIT.GENERAL_WINDOW_MS,
  max: AUTH_CONSTANTS.RATE_LIMIT.GENERAL_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  store: new RedisStore({
    sendCommand: async (command: string, ...args: string[]) =>
      redisService.call(command, ...args),
    prefix: "rl:general:",
  }),
});
