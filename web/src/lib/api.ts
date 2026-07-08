/**
 * Shared Axios instance for all authenticated API calls.
 *
 * Request interceptor: injects the JWT access token from the Zustand auth store.
 * Response interceptor: on 401, attempts a single silent token refresh via the
 *   httpOnly refresh cookie, then retries the original request. If refresh also
 *   fails, clears auth state and lets the RequireAuth guard redirect to login.
 */

import axios from 'axios'
import { useAuthStore } from '../store/auth.store'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Required for httpOnly refresh cookie
})

// ── Request: attach access token ─────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response: silent token refresh on 401 ────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    // Only attempt a single refresh per failed request
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        // The refresh token travels via the httpOnly cookie automatically.
        // Backend response: { success, data: { accessToken, refreshToken } }
        const res = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        )
        const newAccessToken: string = res.data.data.accessToken
        useAuthStore.getState().setAccessToken(newAccessToken)
        original.headers.Authorization = `Bearer ${newAccessToken}`
        return api(original)
      } catch {
        // Refresh failed — session is dead. Clear state so RequireAuth redirects.
        useAuthStore.getState().clearAuth()
      }
    }

    return Promise.reject(error)
  },
)
