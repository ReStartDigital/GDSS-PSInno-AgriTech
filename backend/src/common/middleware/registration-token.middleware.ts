import type { Request, Response, NextFunction } from "express";
import { verifyRegistrationToken } from "../../infrastructure/jwt/jwt.util.js";
import { UnauthorizedException } from "../exceptions/index.js";
import { ErrorCode } from "../constants/error-codes.enum.js";

/**
 * Validates the Authorization header as a short-lived registration token
 * (type === 'registration'), issued only by POST /auth/verify-otp.
 *
 * This is intentionally a SEPARATE middleware from `authenticate` — a
 * registration token proves "phone just verified" and nothing else. It
 * must never be accepted on any route guarded by `authenticate`, and a
 * full access token must never be accepted here. Two distinct token types,
 * two distinct middlewares, zero ambiguity about what a given Bearer token
 * is allowed to do.
 */
export function requireRegistrationToken(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw new UnauthorizedException(
      "Missing registration token. Verify your OTP first.",
      ErrorCode.REGISTRATION_TOKEN_INVALID,
    );
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    req.registration = verifyRegistrationToken(token);
    next();
  } catch (err) {
    const message =
      err instanceof Error && err.name === "TokenExpiredError"
        ? "Your verification has expired. Please verify your OTP again."
        : "Invalid registration token.";
    const code =
      err instanceof Error && err.name === "TokenExpiredError"
        ? ErrorCode.REGISTRATION_TOKEN_EXPIRED
        : ErrorCode.REGISTRATION_TOKEN_INVALID;
    throw new UnauthorizedException(message, code);
  }
}
