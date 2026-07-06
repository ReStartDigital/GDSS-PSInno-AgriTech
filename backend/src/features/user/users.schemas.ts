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
  mobile_number: phoneSchema,
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
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
});
export type RegisterClientDto = z.infer<typeof registerClientSchema>;
