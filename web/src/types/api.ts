import type { UserRole } from '../store/auth.store'

// ── Listing ───────────────────────────────────────────────────────────────────
// Matches backend CreateListingRequest (POST)
export interface ListingRequest {
  vegetable_type: string
  quantity_kg: number
  price_per_kg_ghs: number
  harvest_date: string
  images: string[]
  recommended_packaging_id?: string
  location: { lat: number; lng: number }
  supports_delivery: boolean
  supports_pickup: boolean
  auto_confirm_until_kg?: number
  auto_confirm_price_floor_ghs?: number
  farmer_id?: string
}

// Matches backend ProduceListingEntity (GET/Response)
export interface ListingResponse {
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
  autoConfirmUntilKg: number | null
  autoConfirmPriceFloorGhs: number | null
  recommendedPackagingId: string | null
  committedKg: number
  createdAt: string
  updatedAt: string
  agriScore?: number
  isUrgent?: boolean
  freshness?: 'High' | 'Medium' | 'Low'
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
// Placeholder — will be updated once the orders backend feature is built
export interface Order {
  id: string
  status:
    | 'pending'
    | 'negotiating'
    | 'confirmed'
    | 'packed'
    | 'in_transit'
    | 'delivered'
    | 'cancelled'
  quantity_kg: number
  price_per_kg_ghs: number
  total_ghs: number
  mode: 'delivery' | 'pickup'
  delivery_address?: string
  listing_id: string
  buyer_id: string
  created_at: string
  updated_at: string
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
