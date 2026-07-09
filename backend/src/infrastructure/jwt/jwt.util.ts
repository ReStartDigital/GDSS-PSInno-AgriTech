import jwt, { type JwtPayload } from "jsonwebtoken";
import fs from "fs";
import crypto from "crypto";
import { AUTH_CONSTANTS } from "../../common/constants/auth.constants.js";
import { UserRole } from "../../common/constants/roles.enums.js";
import type {
  AccessTokenPayload,
  RegistrationTokenPayload,
} from "../../common/types/express.js";

const node_env = process.env.NODE_ENV ?? "production";

let privateKey = "";
let publicKey = "";

if (node_env !== "development") {
  privateKey = process.env.JWT_PRIVATE_KEY_PATH ?? "";
  publicKey = process.env.JWT_PUBLIC_KEY_PATH ?? "";
} else {
  privateKey = fs.readFileSync(
    process.env.JWT_PRIVATE_KEY_PATH || "./keys/private.pem",
    "utf8",
  );
  publicKey = fs.readFileSync(
    process.env.JWT_PUBLIC_KEY_PATH || "./keys/public.pem",
    "utf8",
  );
}

const ALGORITHM = "RS256";

export function signAccessToken(userId: string, role: UserRole): string {
  const payload: Omit<AccessTokenPayload, never> = {
    sub: userId,
    role,
    type: "access",
  };
  return jwt.sign(payload, privateKey, {
    algorithm: ALGORITHM,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN.EXPIRY as any,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, publicKey, {
    algorithms: [ALGORITHM],
  }) as JwtPayload & AccessTokenPayload;
  if (decoded.type !== "access") {
    throw new Error("Token is not an access token");
  }
  return decoded;
}

/**
 * Short-lived, single-purpose token issued after successful OTP verification.
 * Proves "this caller just verified possession of this phone number" without
 * granting full account access — the only thing it can be used for is
 * POST /auth/set-pin. It deliberately cannot be used as a Bearer token on
 * any other authenticated route because `authenticate` middleware checks
 * `type === 'access'` and rejects anything else.
 */
export function signRegistrationToken(userId: string, phone: string): string {
  const payload: Omit<RegistrationTokenPayload, never> = {
    sub: userId,
    phone,
    type: "registration",
  };
  return jwt.sign(payload, privateKey, {
    algorithm: ALGORITHM,
    expiresIn: AUTH_CONSTANTS.REGISTRATION_TOKEN.EXPIRY_SECONDS,
  });
}

export function verifyRegistrationToken(
  token: string,
): RegistrationTokenPayload {
  const decoded = jwt.verify(token, publicKey, {
    algorithms: [ALGORITHM],
  }) as JwtPayload & RegistrationTokenPayload;
  if (decoded.type !== "registration") {
    throw new Error("Token is not a registration token");
  }
  return decoded;
}

/** Generates a new opaque refresh token (random, not a JWT) — stored hashed in DB. */
export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString("hex");
}
