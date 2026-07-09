import { z } from "zod";
import { SUPPORTED_MOBILE_NETWORKS } from "../../infrastructure/paystack/paystack.client.js";
import { AUTH_CONSTANTS } from "../../common/constants/auth.constants.js";
import { REGISTERABLE_ROLES } from "../../common/constants/roles.enums.js";
import { normalizePhone } from "../../common/utils/phone.util.js";

const emailRules = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: "Invalid email address format" })
  .optional()
  .nullable();

const pinSchema = z
  .string()
  .min(
    AUTH_CONSTANTS.PIN.MIN_LENGTH,
    `PIN must be at least ${AUTH_CONSTANTS.PIN.MIN_LENGTH} digits`,
  )
  .max(
    AUTH_CONSTANTS.PIN.MAX_LENGTH,
    `PIN must be at most ${AUTH_CONSTANTS.PIN.MAX_LENGTH} digits`,
  )
  .regex(/^\d+$/, "PIN must contain only digits");

const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .transform((val, ctx) => {
    const normalized = normalizePhone(val);
    if (!normalized) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid Ghanaian phone number",
      });
      return z.NEVER;
    }
    return normalized;
  });

export const paystackPhone = z
  .string()
  .min(1, "Phone number is required")
  .transform((val, ctx) => {
    // 1. Strip out non-numeric characters (handles spaces, +, -, parentheses)
    const cleaned = val.replace(/\D/g, "");

    // 2. Normalize international format with country code (e.g., 233209117002 -> 0209117002)
    if (cleaned.startsWith("233") && cleaned.length === 12) {
      return `0${cleaned.slice(3)}`;
    }

    // 3. Normalize already correct local format (e.g., 0209117002)
    if (cleaned.startsWith("0") && cleaned.length === 10) {
      return cleaned;
    }

    // 4. Normalize short entry missing leading zero (e.g., 209117002 -> 0209117002)
    // Ghanaian mobile numbers are 9 digits without the leading '0'
    if (cleaned.length === 9) {
      return `0${cleaned}`;
    }

    // If it doesn't match any standard Ghanaian mobile structure, fail validation
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enter a valid 10-digit Ghanaian phone number (e.g. 020XXXXXXX)",
    });

    return z.NEVER;
  });

// ── PATCH /users/me ────────────────────────────────────────────────────────────
export const updateProfileSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "First name must be at least 2 characters")
      .max(100)
      .optional(),
    middleName: z.string().trim().max(100).nullable().optional(),
    lastName: z
      .string()
      .trim()
      .min(2, "Last name must be at least 2 characters")
      .max(100)
      .optional(),
    email: emailRules,
    region: z.string().trim().max(255).nullable().optional(),
    language: z.string().trim().max(50).optional(),
    location: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
      .optional(),
  })
  .refine(
    (data) =>
      Object.keys(data).filter(
        (k) => data[k as keyof typeof data] !== undefined,
      ).length > 0,
    {
      message:
        "At least one field must be provided for an profile modification",
    },
  );
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

// ── PATCH /users/me/pin ────────────────────────────────────────────────────────
export const changePinSchema = z
  .object({
    current_pin: pinSchema,
    new_pin: pinSchema,
  })
  .refine((data) => data.current_pin !== data.new_pin, {
    message: "New PIN must be different from current PIN",
    path: ["new_pin"],
  });
export type ChangePinDto = z.infer<typeof changePinSchema>;

// ── POST /users/me/payment-details ────────────────────────────────────────────
export const paymentDetailsSchema = z.object({
  mobile_number: paystackPhone,
  mobile_network: z.enum(SUPPORTED_MOBILE_NETWORKS as [string, ...string[]], {
    message: `Network must be one of: ${SUPPORTED_MOBILE_NETWORKS.join(", ")}`, // ✨ Corrected to 'message'
  }),
});
export type PaymentDetailsDto = z.infer<typeof paymentDetailsSchema>;

// ── GET /users — query params ─────────────────────────────────────────────────
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationDto = z.infer<typeof paginationSchema>;

// ── POST /agent/clients ────────────────────────────────────────────────────────
export const registerClientSchema = z.object({
  phone: phoneSchema,
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters")
    .max(100),
  middleName: z.string().trim().max(100).nullable().optional(),
  lastName: z
    .string()
    .trim()
    .min(2, "Last name must be at least 2 characters")
    .max(100),
  role: z.enum(REGISTERABLE_ROLES as [string, ...string[]], {
    message: `Role must be one of: ${REGISTERABLE_ROLES.join(", ")}`, // ✨ Corrected to 'message'
  }),
  region: z.string().trim().max(255).nullable().optional(),
  language: z.string().trim().max(50).optional(),
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
});
export type RegisterClientDto = z.infer<typeof registerClientSchema>;
