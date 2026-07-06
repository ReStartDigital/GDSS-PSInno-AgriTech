/**
 * Normalises a Ghanaian phone number into a consistent E.164 string
 * (+233XXXXXXXXX) regardless of how the user typed it.
 *
 * Accepts: 0244123456, 244123456, +233244123456, 233244123456
 */
export function normalizePhone(raw: string): string | null {
  const digitsOnly = raw.replace(/[^\d+]/g, "");

  // Already E.164 with Ghana country code
  if (/^\+233\d{9}$/.test(digitsOnly)) {
    return digitsOnly;
  }

  // 233XXXXXXXXX without the plus
  if (/^233\d{9}$/.test(digitsOnly)) {
    return `+${digitsOnly}`;
  }

  // Local format: 0XXXXXXXXX -> drop leading 0, prefix +233
  if (/^0\d{9}$/.test(digitsOnly)) {
    return `+233${digitsOnly.slice(1)}`;
  }

  // Bare 9-digit subscriber number
  if (/^\d{9}$/.test(digitsOnly)) {
    return `+233${digitsOnly}`;
  }

  return null; // Could not confidently normalise — let Zod validation reject it
}

/** Generates VegeLink's Paystack-compatible virtual email for users without one. */
export function virtualEmailFromPhone(phone: string, domain: string): string {
  const digitsOnly = phone.replace(/\D/g, "");
  return `user_${digitsOnly}@${domain}`;
}
