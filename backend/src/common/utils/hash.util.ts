import bcrypt from "bcrypt";
import crypto from "crypto";

const BCRYPT_COST_FACTOR = 12; // ~300ms per hash — deliberately slow to resist brute force

export async function hashSecret(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST_FACTOR);
}

export async function verifySecret(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** SHA-256 hex digest — used for refresh tokens, which need exact-match lookup, not bcrypt's slow compare. */
export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}
