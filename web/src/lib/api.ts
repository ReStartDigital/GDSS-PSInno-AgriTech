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
    const originalRequest = error.config

    // 1. If 401 and not a retry, and NOT the refresh endpoint itself
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true
      try {
        // Use the bare axios instance to avoid triggering this interceptor again
        const res = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        )
        const newAccessToken = res.data.data.accessToken
        useAuthStore.getState().setAccessToken(newAccessToken)
        
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest) // Retry original
      } catch (refreshError) {
        // Refresh failed — session is dead. Clear state.
        useAuthStore.getState().clearAuth()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)
