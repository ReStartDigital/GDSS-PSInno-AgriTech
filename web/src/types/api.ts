import type { UserRole } from '../store/auth.store'

// ── Listing ───────────────────────────────────────────────────────────────────
// Matches the backend ProduceListingEntity schema
export interface Listing {
  id: string
  farmerId: string
  vegetableType: string
  quantityKg: number
  pricePerKgGhs: number
  harvestDate: string
  status: 'active' | 'sold' | 'cancelled'
  images: string[]
  location: { type: 'Point'; coordinates: [number, number] }
  supportsDelivery: boolean
  supportsPickup: boolean
  autoConfirmUntilKg?: number | null
  autoConfirmPriceFloorGhs?: number | null
  recommended_packaging_id?: string | null
  created_at: string
  updated_at: string
  farmer?: {
    id: string
    firstName: string
    lastName: string
    phone: string
    profilePhotoUrl?: string | null
  }
}

// ── Pagination ────────────────────────────────────────────────────────────────
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

// ── Order ─────────────────────────────────────────────────────────────────────
// Matches backend OrderEntity schema
export interface Order {
  id: string
  buyerId: string
  farmerId: string
  listingId: string
  listing?: Listing
  mode: 'delivery' | 'pickup'
  quantityKg: number
  pricePerKgGhs: number
  negotiatedPricePerKgGhs: number | null
  produceSubtotalGhs: number
  packagingTypeId: string | null
  transportCostEstimateGhs: number
  totalGhs: number
  deliveryAddress: string | null
  deliveryLocation: { type: 'Point'; coordinates: [number, number] } | null
  status:
    | 'pending'
    | 'pending_agent_confirmation'
    | 'pending_sms_confirmation'
    | 'negotiating'
    | 'confirmed'
    | 'packed'
    | 'in_transit'
    | 'delivered'
    | 'cancelled'
  cancelledBy: string | null
  cancellationReason: string | null
  createdAt: string
  updatedAt: string
}

// ── User ──────────────────────────────────────────────────────────────────────
export interface ApiUser {
  id: string
  phone: string
  firstName: string
  lastName: string
  middleName?: string | null
  email?: string | null
  role: UserRole
  region?: string | null
  language?: string | null
  isActive: boolean
  profilePhotoUrl?: string | null
  phoneVerifiedAt?: string | null
  createdAt: string
}

// ── API Error envelope ────────────────────────────────────────────────────────
/** Matches backend error shape: `{ error: { code, message } }` */
export interface ApiErrorShape {
  response?: {
    data?: {
      error?: {
        code?: string
        message?: string
      }
    }
  }
}
