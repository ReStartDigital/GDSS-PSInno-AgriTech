import { describe, it, expect } from 'vitest'
import {
  registerSchema,
  verifyOtpSchema,
  setPinSchema,
  loginSchema,
  createListingSchema,
  placeOrderSchema,
} from './index'

// ── registerSchema ────────────────────────────────────────────────────────────
describe('registerSchema', () => {
  const valid = { phone: '0244123456', firstName: 'Ama', lastName: 'Owusu', role: 'farmer' as const, region: 'Ashanti', language: 'twi' }

  it('accepts a valid Ghanaian phone number starting with 0', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts a phone number in +233 format', () => {
    expect(registerSchema.safeParse({ ...valid, phone: '+233244123456' }).success).toBe(true)
  })

  it('rejects a non-Ghanaian phone number', () => {
    const result = registerSchema.safeParse({ ...valid, phone: '07911123456' })
    expect(result.success).toBe(false)
  })

  it('rejects an empty first name', () => {
    const result = registerSchema.safeParse({ ...valid, firstName: '' })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid role', () => {
    const result = registerSchema.safeParse({ ...valid, role: 'admin' })
    expect(result.success).toBe(false)
  })
})

// ── verifyOtpSchema ───────────────────────────────────────────────────────────
describe('verifyOtpSchema', () => {
  it('accepts a 6-digit OTP', () => {
    expect(verifyOtpSchema.safeParse({ otp: '123456' }).success).toBe(true)
  })

  it('rejects OTPs shorter than 6 digits', () => {
    expect(verifyOtpSchema.safeParse({ otp: '12345' }).success).toBe(false)
  })

  it('rejects non-numeric OTPs', () => {
    expect(verifyOtpSchema.safeParse({ otp: '12345a' }).success).toBe(false)
  })
})

// ── setPinSchema ──────────────────────────────────────────────────────────────
describe('setPinSchema', () => {
  it('accepts matching 4-digit PINs', () => {
    expect(setPinSchema.safeParse({ pin: '1234', confirmPin: '1234' }).success).toBe(true)
  })

  it('rejects mismatched PINs', () => {
    const result = setPinSchema.safeParse({ pin: '1234', confirmPin: '5678' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('confirmPin')
    }
  })

  it('rejects non-digit PINs', () => {
    expect(setPinSchema.safeParse({ pin: 'abcd', confirmPin: 'abcd' }).success).toBe(false)
  })

  it('rejects PINs shorter than 4 digits', () => {
    expect(setPinSchema.safeParse({ pin: '123', confirmPin: '123' }).success).toBe(false)
  })
})

// ── loginSchema ───────────────────────────────────────────────────────────────
describe('loginSchema', () => {
  it('accepts valid phone + PIN', () => {
    expect(loginSchema.safeParse({ phone: '0244123456', pin: '1234' }).success).toBe(true)
  })

  it('rejects missing PIN', () => {
    expect(loginSchema.safeParse({ phone: '0244123456' }).success).toBe(false)
  })
})

// ── createListingSchema ───────────────────────────────────────────────────────
describe('createListingSchema', () => {
  const valid = {
    vegetable_type: 'Tomatoes',
    quantity_kg: 100,
    price_per_kg_ghs: 4.5,
    harvest_date: '2026-08-01',
  }

  it('accepts valid listing data', () => {
    expect(createListingSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects zero quantity', () => {
    expect(createListingSchema.safeParse({ ...valid, quantity_kg: 0 }).success).toBe(false)
  })

  it('rejects negative price', () => {
    expect(createListingSchema.safeParse({ ...valid, price_per_kg_ghs: -1 }).success).toBe(false)
  })

  it('coerces string numbers for quantity and price', () => {
    expect(createListingSchema.safeParse({ ...valid, quantity_kg: '50', price_per_kg_ghs: '3.20' }).success).toBe(true)
  })
})

// ── placeOrderSchema ──────────────────────────────────────────────────────────
describe('placeOrderSchema', () => {
  const valid = { quantity_kg: 50, delivery_address: 'Kumasi Central Market', mode: 'delivery' as const }

  it('accepts a valid delivery order', () => {
    expect(placeOrderSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts a pickup order', () => {
    expect(placeOrderSchema.safeParse({ ...valid, mode: 'pickup' }).success).toBe(true)
  })

  it('rejects empty delivery address', () => {
    expect(placeOrderSchema.safeParse({ ...valid, delivery_address: '' }).success).toBe(false)
  })

  it('rejects zero quantity', () => {
    expect(placeOrderSchema.safeParse({ ...valid, quantity_kg: 0 }).success).toBe(false)
  })
})
