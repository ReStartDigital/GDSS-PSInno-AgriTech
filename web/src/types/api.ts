import type { UserRole } from '../store/auth.store'

export interface Listing {
  id: string
  vegetable_type: string
  quantity_kg: number
  price_per_kg_ghs: number
  harvest_date: string
  status: 'active' | 'sold' | 'cancelled'
  location?: string
  farmer?: { firstName: string }
  freshness?: 'High' | 'Medium' | 'Low'
  agriScore?: number
  isUrgent?: boolean
}

export interface Order {
  id: string
  status: 'pending' | 'negotiating' | 'confirmed' | 'packed' | 'in_transit' | 'delivered' | 'cancelled'
  quantity_kg: number
  price_per_kg_ghs: number
  total_ghs: number
  mode: 'delivery' | 'pickup'
  delivery_address?: string
  created_at: string
}

export interface ApiUser {
  id: string
  phone: string
  role: UserRole
}

/** Matches the backend's standard error envelope: `{ error: { message: string } }` */
export interface ApiErrorShape {
  response?: {
    data?: {
      error?: {
        message?: string
      }
    }
  }
}
