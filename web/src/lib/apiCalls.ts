import { api } from './api'
import type { RegisterFormData, LoginFormData, PlaceOrderFormData, CreateListingFormData } from '../schemas'

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: RegisterFormData) => api.post('/auth/register', data),
  verifyOtp: (phone: string, otp: string) => api.post('/auth/verify-otp', { phone, otp }),
  setPin: (pin: string, registrationToken: string) =>
    api.post('/auth/set-pin', { pin }, { headers: { Authorization: `Bearer ${registrationToken}` } }),
  login: (data: LoginFormData) => api.post('/auth/login', data),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  resendOtp: (phone: string) => api.post('/auth/resend-otp', { phone }),
}

// ── Listings ──────────────────────────────────────────────────────────────────
export const listingsApi = {
  getMyListings: () => api.get('/listings/my'),
  getAll: (params?: Record<string, string>) => api.get('/listings', { params }),
  getById: (id: string) => api.get(`/listings/${id}`),
  create: (data: CreateListingFormData) => api.post('/listings', data),
  update: (id: string, data: Partial<CreateListingFormData>) => api.put(`/listings/${id}`, data),
  delete: (id: string) => api.delete(`/listings/${id}`),
}

// ── Orders ────────────────────────────────────────────────────────────────────
export const ordersApi = {
  getMyOrders: () => api.get('/orders'),
  getById: (id: string) => api.get(`/orders/${id}`),
  place: (listingId: string, data: PlaceOrderFormData) =>
    api.post('/orders', { listing_id: listingId, ...data }),
  confirm: (id: string) => api.post(`/orders/${id}/confirm`),
  cancel: (id: string, reason: string) => api.post(`/orders/${id}/cancel`, { reason }),
}

// ── Transport ─────────────────────────────────────────────────────────────────
export const transportApi = {
  getJobs: () => api.get('/transport/jobs'),
  accept: (id: string) => api.post(`/transport/${id}/accept`),
  updateStatus: (id: string, status: string) => api.put(`/transport/${id}/status`, { status }),
}

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: { firstName?: string; lastName?: string }) => api.put('/users/me', data),
}
