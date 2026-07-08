import { z } from 'zod'

// ── Phone: strict Ghana international format (+233 + 9 digits) ────────────────
// Strictly enforced: +233XXXXXXXXX
const phone = z
  .string()
  .min(1, 'Phone number is required')
  .regex(
    /^\+233\d{9}$/,
    'Enter a valid Ghanaian phone number, e.g. +233244123456',
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
export const createListingSchema = z
  .object({
    vegetableType: z.string().min(1, 'Crop type is required'),
    quantityKg: z.coerce.number().positive('Must be greater than 0'),
    pricePerKgGhs: z.coerce.number().positive('Must be greater than 0'),
    harvestDate: z.string().min(1, 'Harvest date is required'),
    images: z.array(z.string().url('Invalid image URL')).default([]),
    location: z.object({
      lat: z.number({ required_error: 'Latitude is required' }),
      lng: z.number({ required_error: 'Longitude is required' }),
    }),
    supportsDelivery: z.boolean().default(true),
    supportsPickup: z.boolean().default(true),
    recommendedPackagingId: z.string().uuid().optional(),
    // Agent-only: supply when creating on behalf of a farmer
    farmerId: z.string().uuid().optional(),
  })
  .refine((d) => d.supportsDelivery || d.supportsPickup, {
    message: 'At least one fulfilment mode must be selected',
    path: ['supportsPickup'],
  })
export type CreateListingFormData = z.infer<typeof createListingSchema>

// ── Place order ───────────────────────────────────────────────────────────────
export const placeOrderSchema = z.object({
  quantity_kg: z.coerce.number().positive('Must be greater than 0'),
  delivery_address: z.string().min(1, 'Delivery address is required'),
  mode: z.enum(['delivery', 'pickup']),
})
export type PlaceOrderFormData = z.infer<typeof placeOrderSchema>
