import { z } from 'zod'

// ── Phone: strict Ghana international format (+233 + 9 digits) ────────────────
// Accepts the full E.164 format: +233XXXXXXXXX
// Also accepts the local shorthand 0XXXXXXXXX — the backend normalises both.
const phone = z
  .string()
  .min(1, 'Phone number is required')
  .regex(
    /^(\+?233|0)?\d{9}$/,
    'Enter a valid Ghanaian phone number, e.g. 0244123456 or +233244123456',
  )

// ── PIN: 4–6 numeric digits ───────────────────────────────────────────────────
const pin = z
  .string()
  .min(4, 'PIN must be at least 4 digits')
  .max(6, 'PIN must be at most 6 digits')
  .regex(/^\d+$/, 'PIN must contain only digits')

// ── OTP: exactly 6 numeric digits ────────────────────────────────────────────
const otp = z
  .string()
  .length(6, 'Verification code must be exactly 6 digits')
  .regex(/^\d+$/, 'Digits only')

// ── Step 1: POST /auth/register ───────────────────────────────────────────────
// region and language are frontend-only UX fields (stored after registration
// via PATCH /users/me). They are stripped from the register API call body.
export const registerSchema = z.object({
  phone,
  firstName: z.string().trim().min(1, 'First name is required'),
  middleName: z.string().trim().optional(),
  lastName: z.string().trim().min(1, 'Last name is required'),
  role: z.enum(['farmer', 'buyer', 'transporter', 'agent'], {
    message: 'Select a role',
  }),
  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  region: z.string().min(1, 'Region is required'),
  language: z.string().min(1, 'Preferred language is required'),
})
export type RegisterFormData = z.infer<typeof registerSchema>

// ── Step 2: POST /auth/verify-otp ─────────────────────────────────────────────
export const verifyOtpSchema = z.object({ otp })
export type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>

// ── Step 3: POST /auth/set-pin ────────────────────────────────────────────────
export const setPinSchema = z
  .object({ pin, confirmPin: pin })
  .refine((d) => d.pin === d.confirmPin, {
    message: 'PINs do not match',
    path: ['confirmPin'],
  })
export type SetPinFormData = z.infer<typeof setPinSchema>

// ── POST /auth/login ───────────────────────────────────────────────────────────
export const loginSchema = z.object({ phone, pin })
export type LoginFormData = z.infer<typeof loginSchema>

// ── POST /api/v1/listings ─────────────────────────────────────────────────────
// Mirrors backend createListingSchema exactly.
// Required backend fields: vegetable_type, quantity_kg, price_per_kg_ghs,
// harvest_date, images[], location: {lat, lng}, supports_delivery, supports_pickup
export const createListingSchema = z
  .object({
    vegetable_type: z.string().min(1, 'Crop type is required'),
    quantity_kg: z.coerce.number().positive('Must be greater than 0'),
    price_per_kg_ghs: z.coerce.number().positive('Must be greater than 0'),
    harvest_date: z.string().min(1, 'Harvest date is required'),
    images: z.array(z.string().url('Invalid image URL')).default([]),
    location: z.object({
      lat: z.number({ message: 'Latitude is required' }),
      lng: z.number({ message: 'Longitude is required' }),
    }),
    supports_delivery: z.boolean().default(true),
    supports_pickup: z.boolean().default(true),
    recommended_packaging_id: z.string().uuid().optional(),
    // Agent-only: supply when creating on behalf of a farmer
    farmer_id: z.string().uuid().optional(),
    unit_of_measure: z.string().optional(),
    description: z.string().optional(),
  })
  .refine((d) => d.supports_delivery || d.supports_pickup, {
    message: 'At least one fulfilment mode must be selected',
    path: ['supports_pickup'],
  })
export type CreateListingFormData = z.infer<typeof createListingSchema>

export const FulfilmentMode = {
  DELIVERY: 'delivery',
  PICKUP: 'pickup',
} as const
export type FulfilmentMode = (typeof FulfilmentMode)[keyof typeof FulfilmentMode]

const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
})

// ── Place order ───────────────────────────────────────────────────────────────
export const placeOrderSchema = z
  .object({
    listing_id: z.string().uuid("Invalid listing identifier"),
    quantity_kg: z.number().positive("Quantity must be greater than 0"),
    mode: z.nativeEnum(FulfilmentMode).default(FulfilmentMode.DELIVERY),
    delivery_address: z
      .string()
      .trim()
      .min(5, "Address is too short")
      .optional()
      .nullable(),
    delivery_location: locationSchema.optional().nullable(),
    packaging_type_id: z.string().uuid().optional().nullable(),
    packaging_type_name: z.string().trim().max(255).optional(),
    special_handling: z.string().trim().max(1000).optional(),
  })
  .refine(
    (data) => {
      if (data.mode === FulfilmentMode.DELIVERY) {
        return !!data.delivery_address && !!data.delivery_location;
      }
      return true;
    },
    {
      message: "Delivery address is required when fulfilment mode is set to delivery",
      path: ["delivery_address"],
    },
  );
export type PlaceOrderFormData = z.infer<typeof placeOrderSchema>

