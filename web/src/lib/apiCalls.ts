/**
 * Real API client layer — replaces the localStorage mock.
 *
 * All functions return raw Axios responses so hooks can access the full
 * response shape. Backend envelope: { success, data: <payload> }
 *
 * Orders and Transport endpoints are stubbed — they point at real API paths
 * that don't exist yet on the backend. They will throw a 404 until the
 * backend feature is built. This keeps the integration path clear and
 * avoids touching hook logic when those endpoints are ready.
 */

import type {
  RegisterFormData,
  LoginFormData,
  PlaceOrderFormData,
  CreateListingFormData,
} from '../schemas'
import { api } from './api'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

// ── Auth API ──────────────────────────────────────────────────────────────────

export const authApi = {
  /**
   * POST /auth/register
   * Sends only the fields the backend schema accepts.
   * region + language are collected in the form but stored later via
   * PATCH /users/me after registration completes.
   */
  register: (data: RegisterFormData) =>
    api.post('/auth/register', {
      phone: data.phone,
      firstName: data.firstName,
      middleName: data.middleName || undefined,
      lastName: data.lastName,
      role: data.role,
      email: data.email || undefined,
    }),

  /**
   * POST /auth/verify-otp
   * Body: { phone, otp }
   */
  verifyOtp: (phone: string, otp: string) =>
    api.post('/auth/verify-otp', { phone, otp }),

  /**
   * POST /auth/set-pin
   * Uses a separate axios call — the Authorization header must carry the
   * short-lived registration token, NOT the regular access token.
   * Body: { pin }
   */
  setPin: (pin: string, registrationToken: string) =>
    axios.post(
      `${BASE_URL}/auth/set-pin`,
      { pin },
      {
        headers: { Authorization: `Bearer ${registrationToken}` },
        withCredentials: true,
      },
    ),

  /**
   * POST /auth/login
   * Body: { phone, pin }
   * Response sets httpOnly refresh cookie, returns { user, accessToken, refreshToken }
   */
  login: (data: LoginFormData) =>
    api.post('/auth/login', { phone: data.phone, pin: data.pin }),

  /**
   * POST /auth/refresh
   * Relies on the httpOnly cookie being sent automatically (withCredentials: true).
   * Returns { accessToken, refreshToken }
   */
  refresh: () => api.post('/auth/refresh', {}),

  /**
   * POST /auth/logout
   * Clears the server-side refresh token whitelist entry.
   */
  logout: () => api.post('/auth/logout', {}),

  /**
   * POST /auth/resend-otp
   * Body: { phone }
   */
  resendOtp: (phone: string) => api.post('/auth/resend-otp', { phone }),
}

// ── Listings API ──────────────────────────────────────────────────────────────
//
// Backend response envelopes:
//   GET  /listings       → { success, data: { data: Listing[], meta: PaginationMeta } }
//   GET  /listings/:id   → { success, data: { listing: Listing } }
//   POST /listings       → { success, data: { listing: Listing } }
//   PATCH /listings/:id  → { success, data: { listing: Listing } }
//   DELETE /listings/:id → { success, data: { message: string } }

export const listingsApi = {
  /**
   * GET /listings
   * Accepts any subset of the backend query params (page, limit,
   * vegetable_type, farmer_id, lat, lng, radius_km, etc.)
   */
  getAll: (params?: Record<string, string | number | undefined>) =>
    api.get('/listings', { params }),

  /** GET /listings/:id */
  getById: (id: string) => api.get(`/listings/${id}`),

  /**
   * POST /listings
   * Maps frontend location: { lat, lng } coordinates to backend { latitude, longitude } format.
   */
  create: (data: CreateListingFormData & { farmer_id?: string }) => {
    const { location, ...rest } = data
    const backendLocation = location
      ? { latitude: location.lat, longitude: location.lng }
      : undefined

    return api.post('/listings', {
      ...rest,
      location: backendLocation,
    })
  },

  /**
   * PATCH /listings/:id
   * Partial update — at least one field required.
   */
  update: (
    id: string,
    data: Partial<CreateListingFormData & { status: string }>,
  ) => {
    const { location, ...rest } = data
    const backendLocation = location
      ? { latitude: location.lat, longitude: location.lng }
      : undefined

    return api.patch(`/listings/${id}`, {
      ...rest,
      ...(backendLocation ? { location: backendLocation } : {}),
    })
  },

  /** DELETE /listings/:id — soft delete (status → cancelled) */
  delete: (id: string) => api.delete(`/listings/${id}`),
}

// ── Orders API ── (backend endpoints not yet implemented) ─────────────────────
// These paths will 404 until the backend orders feature is built.
// Hooks reading these will land in their error state — this is expected.

export const ordersApi = {
  getMyOrders: () => api.get('/orders'),
  getById: (id: string) => api.get(`/orders/${id}`),
  place: (listingId: string, data: PlaceOrderFormData) =>
    api.post('/orders', { listing_id: listingId, ...data }),
  confirm: (id: string) => api.patch(`/orders/${id}/confirm`, {}),
  cancel: (id: string, reason: string) =>
    api.patch(`/orders/${id}/cancel`, { reason }),
}

// ── Transport API ── (backend endpoints not yet implemented) ──────────────────
// These paths will 404 until the backend transport feature is built.

export const transportApi = {
  getJobs: () => api.get('/transport/jobs'),
  accept: (id: string) => api.patch(`/transport/jobs/${id}/accept`, {}),
  updateStatus: (id: string, status: string) =>
    api.patch(`/transport/jobs/${id}/status`, { status }),
}

// ── Users API ─────────────────────────────────────────────────────────────────
//
// Backend response envelopes:
//   GET  /users/me                       → { success, data: { user: User } }
//   PATCH /users/me                      → { success, data: { user: User, message } }
//   GET  /users/agent/clients            → { success, data: { data: User[], meta } }
//   POST /users/agent/clients            → { success, data: { user: User, message } }
//   PATCH /users/agent/clients/:id/unassign → { success, data: { message } }

export const usersApi = {
  /** GET /users/me — full private profile */
  getProfile: () => api.get('/users/me'),

  /** PATCH /users/me — update mutable profile fields */
  updateProfile: (data: {
    firstName?: string
    middleName?: string
    lastName?: string
    email?: string
    region?: string
    language?: string
    location?: { lat: number; lng: number }
  }) => api.patch('/users/me', data),

  /** POST /users/me/payment-details — configure Mobile Money payment settings */
  updatePaymentDetails: (data: {
    mobile_number: string
    mobile_network: string
  }) => api.post('/users/me/payment-details', data),

  /** GET /users/agent/clients — paginated list of agent's farmers */
  getClients: (params?: { page?: number; limit?: number }) =>
    api.get('/users/agent/clients', { params }),

  /**
   * POST /users/agent/clients — register a new offline farmer client.
   * role must be one of the registerable roles (default: farmer).
   */
  registerClient: (data: {
    phone: string
    firstName: string
    lastName: string
    middleName?: string
    role: string
    email?: string
    region?: string
    language?: string
    location?: { lat: number; lng: number }
  }) => api.post('/users/agent/clients', data),

  /** PATCH /users/agent/clients/:id/unassign */
  unassignClient: (clientId: string) =>
    api.patch(`/users/agent/clients/${clientId}/unassign`, {}),
}
