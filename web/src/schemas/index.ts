import { z } from 'zod'

const phone = z
  .string()
  .min(1, 'Phone number is required')
  .regex(/^(\+233|0)\d{9}$/, 'Enter a valid Ghanaian phone number e.g. 0244123456')

const pin = z
  .string()
  .min(4, 'PIN must be at least 4 digits')
  .max(6, 'PIN must be at most 6 digits')
  .regex(/^\d+$/, 'PIN must contain only digits')

const otp = z
  .string()
  .length(6, 'Verification code must be 6 digits')
  .regex(/^\d+$/, 'Digits only')

export const registerSchema = z.object({
  phone,
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  role: z.enum(['farmer', 'buyer', 'transporter', 'agent'], { message: 'Select a role' }),
  region: z.string().min(1, 'Region is required'),
  language: z.string().min(1, 'Preferred language is required'),
})
export type RegisterFormData = z.infer<typeof registerSchema>

export const verifyOtpSchema = z.object({ otp })
export type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>

export const setPinSchema = z
  .object({ pin, confirmPin: pin })
  .refine((d) => d.pin === d.confirmPin, { message: 'PINs do not match', path: ['confirmPin'] })
export type SetPinFormData = z.infer<typeof setPinSchema>

export const loginSchema = z.object({ phone, pin })
export type LoginFormData = z.infer<typeof loginSchema>

export const createListingSchema = z.object({
  vegetable_type: z.string().min(1, 'Crop type is required'),
  quantity_kg: z.coerce.number().positive('Must be greater than 0'),
  price_per_kg_ghs: z.coerce.number().positive('Must be greater than 0'),
  harvest_date: z.string().min(1, 'Harvest date is required'),
  delivery_address: z.string().optional(),
})
export type CreateListingFormData = z.infer<typeof createListingSchema>

export const placeOrderSchema = z.object({
  quantity_kg: z.coerce.number().positive('Must be greater than 0'),
  delivery_address: z.string().min(1, 'Delivery address is required'),
  mode: z.enum(['delivery', 'pickup']),
})
export type PlaceOrderFormData = z.infer<typeof placeOrderSchema>
