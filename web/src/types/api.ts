import type { UserRole } from '../store/auth.store'

export interface Listing {
  id: string
  vegetable_type: string
  quantity_kg: number
  price_per_kg_ghs: number
  harvest_date: string
  status: 'active' | 'sold' | 'cancelled'
  farmer?: { firstName: string }
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
