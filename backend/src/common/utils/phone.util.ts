/**
 * Strictly validates and returns a Ghanaian phone number in E.164 string
 * format (+233XXXXXXXXX).
 *
 * Rejects any format other than +233XXXXXXXXX.
 */
export function normalizePhone(raw: string): string | null {
  // Only accept exact E.164 with Ghana country code
  if (/^\+233\d{9}$/.test(raw)) {
    return raw;
  }

  return null; // Reject all other formats
}

/** Generates VegeLink's Paystack-compatible virtual email for users without one. */
export function virtualEmailFromPhone(phone: string, domain: string): string {
  const digitsOnly = phone.replace(/\D/g, "");
  return `user_${digitsOnly}@${domain}`;
}
