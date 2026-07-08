import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../../infrastructure/jwt/jwt.util.js";
import { UnauthorizedException } from "../exceptions/index.js";
import { ErrorCode } from "../constants/error-codes.enum.js";

export interface CustomRequest extends Request {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  token?: string | any;
}
/**
 * Validates the `Authorization: Bearer <token>` header as a full access
 * token (type === 'access'). Populates req.user. Used on every route that
 * requires a logged-in account.
 *
 * Deliberately rejects registration tokens (see jwt.util.ts) even though
 * both are RS256-signed by the same key pair — the `type` claim is checked
 * inside verifyAccessToken so a registration token can never be replayed
 * here to gain a real session.
 */
export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  console.log(header);

  if (!header || !header.startsWith("Bearer ")) {
    throw new UnauthorizedException(
      "Missing or malformed Authorization header",
      ErrorCode.UNAUTHORIZED,
    );
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    throw new UnauthorizedException(
      "Invalid or expired access token",
      ErrorCode.UNAUTHORIZED,
    );
  }
}
