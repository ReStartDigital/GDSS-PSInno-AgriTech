/**
 * Generates a consistent, synthetic email address using a user's phone number.
 * This satisfies payment gateways like Paystack while keeping registrations frictionless.
 * * @param phone The raw phone number input (e.g., "+233240001112" or "0240001112")
 * @returns A normalized email string (e.g., "233240001112@platform.internal")
 */
export function generateSyntheticEmail(phone: string): string {
  // Remove the '+' sign and any accidental whitespace or dashes
  const cleanPhone = phone.replace(/[+\s-]/g, "");
  
  // Use a domain dedicated to your internal/synthetic traffic
  return `${cleanPhone}@platform.internal`;
}