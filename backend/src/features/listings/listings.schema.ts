import { z } from 'zod';

export interface LocationDto {
  lat: number;
  lng: number;
}

export interface CreateListingRequest {
  vegetable_type: string;
  quantity_kg: number;
  price_per_kg_ghs: number;
  harvest_date: string;
  images: string[];
  recommended_packaging_id?: string;
  location: LocationDto;
  supports_delivery: boolean;
  supports_pickup: boolean;
  auto_confirm_until_kg?: number;
  auto_confirm_price_floor_ghs?: number;
  farmer_id?: string;
}

export interface UpdateListingRequest {
  vegetable_type?: string;
  quantity_kg?: number;
  price_per_kg_ghs?: number;
  harvest_date?: string;
  images?: string[];
  recommended_packaging_id?: string | null;
  location?: LocationDto;
  status?: 'active' | 'sold' | 'cancelled';
  supports_delivery?: boolean;
  supports_pickup?: boolean;
  auto_confirm_until_kg?: number | null;
  auto_confirm_price_floor_ghs?: number | null;
}

export interface ListingsQueryRequest {
  page: number;
  limit: number;
  vegetable_type?: string;
  min_price_kg?: number;
  max_price_kg?: number;
  min_quantity_kg?: number;
  packaging_id?: string;
  fulfilment_mode: 'delivery' | 'pickup' | 'both';
  lat?: number;
  lng?: number;
  radius_km?: number;
  farmer_id?: string;
}

export interface PackagingRecommendRequest {
  vegetable_type: string;
}

// ── Shared sub-schemas ────────────────────────────────────────────────────────

const locationSchema = z.object({
  lat: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  lng: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
});

// ── POST /listings — Create listing ──────────────────────────────────────────
export const createListingSchema = z.object({
  vegetable_type: z
    .string()
    .trim()
    .min(2, 'Vegetable type must be at least 2 characters')
    .max(100, 'Vegetable type is too long')
    .toLowerCase(),

  quantity_kg: z
    .number({ message: 'quantity_kg must be a number' })
    .positive('Quantity must be greater than 0')
    .max(100_000, 'Quantity seems unreasonably large'),

  price_per_kg_ghs: z
    .number({ message: 'price_per_kg_ghs must be a number' })
    .positive('Price must be greater than 0')
    .max(100_000, 'Price seems unreasonably large'),

  harvest_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'harvest_date must be a valid date in YYYY-MM-DD format')
    .refine((date) => {
      const d = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d >= today;
    }, 'Harvest date must be today or in the future'),

  images: z.array(z.string().url('Each image must be a valid URL')).max(8, 'Maximum 8 images allowed').default([]),

  recommended_packaging_id: z.string().uuid('recommended_packaging_id must be a valid UUID').optional(),

  location: locationSchema,

  // Fulfilment mode — at least one must be true (validated below)
  supports_delivery: z.boolean().default(true),
  supports_pickup: z.boolean().default(true),

  // Pre-authorisation (optional) — see order confirmation addendum
  auto_confirm_until_kg: z.number().positive().optional(),
  auto_confirm_price_floor_ghs: z.number().positive().optional(),

  // Agent-only: must supply farmer_id when creating on behalf of a farmer
  farmer_id: z.string().uuid('farmer_id must be a valid UUID').optional(),
})
.superRefine((data, ctx) => {
  const validFulfilment = data.supports_delivery || data.supports_pickup;
  if (!validFulfilment) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one of supports_delivery or supports_pickup must be true',
      path: ['supports_pickup'],
    });
  }

  if (data.auto_confirm_until_kg !== undefined && data.auto_confirm_until_kg > data.quantity_kg) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Auto-confirm limit cannot exceed the total quantity available',
      path: ['auto_confirm_until_kg'],
    });
  }
});
export type CreateListingDto = z.infer<typeof createListingSchema>;

// ── PATCH /listings/:id — Update listing ─────────────────────────────────────
export const updateListingSchema = z
  .object({
    vegetable_type: z.string().trim().min(2).max(100).toLowerCase().optional(),
    quantity_kg: z.number().positive().max(100_000).optional(),
    price_per_kg_ghs: z.number().positive().max(100_000).optional(),
    harvest_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'harvest_date must be YYYY-MM-DD')
      .refine((date) => {
        const d = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return d >= today;
      }, 'Harvest date must be today or in the future')
      .optional(),
    images: z.array(z.string().url()).max(8).optional(),
    recommended_packaging_id: z.string().uuid().nullable().optional(),
    location: locationSchema.optional(),
    status: z.enum(['active', 'sold', 'cancelled']).optional(),
    supports_delivery: z.boolean().optional(),
    supports_pickup: z.boolean().optional(),
    auto_confirm_until_kg: z.number().positive().nullable().optional(),
    auto_confirm_price_floor_ghs: z.number().positive().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })
.refine(
  (data) => {
    if (data.supports_delivery === false && data.supports_pickup === false) {
      return false;
    }
    return true;
  },
  { message: 'At least one fulfilment mode must remain enabled.', path: ['supports_pickup'] }
);
export type UpdateListingDto = z.infer<typeof updateListingSchema>;

// ── GET /listings — Query params ─────────────────────────────────────────────
export const listingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),

  vegetable_type: z.string().trim().toLowerCase().optional(),
  min_price_kg: z.coerce.number().positive().optional(),
  max_price_kg: z.coerce.number().positive().optional(),
  min_quantity_kg: z.coerce.number().positive().optional(),
  packaging_id: z.string().uuid().optional(),
  fulfilment_mode: z.enum(['delivery', 'pickup', 'both']).default('both'),

  // Geolocation filter — if any one is provided, all three are required
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius_km: z.coerce.number().positive().max(200).default(15).optional(),

  farmer_id: z.string().uuid().optional(),
}).refine(
  (data) => {
    const hasAny = data.lat !== undefined || data.lng !== undefined;
    const hasAll = data.lat !== undefined && data.lng !== undefined;
    return !hasAny || hasAll;
  },
  { message: 'Both lat and lng must be provided together for location-based filtering', path: ['lat'] },
).refine(
  (data) => {
    if (data.min_price_kg && data.max_price_kg) {
      return data.min_price_kg <= data.max_price_kg;
    }
    return true;
  },
  { message: 'min_price_kg must be less than or equal to max_price_kg', path: ['min_price_kg'] },
);
export type ListingsQueryDto = z.infer<typeof listingsQuerySchema>;

// ── GET /listings/packaging/recommend — query params ─────────────────────────
export const packagingRecommendSchema = z.object({
  vegetable_type: z
    .string()
    .trim()
    .min(1, 'vegetable_type is required')
    .toLowerCase(),
});
export type PackagingRecommendDto = z.infer<typeof packagingRecommendSchema>;