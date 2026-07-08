import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'farmer' | 'buyer' | 'transporter' | 'agent' | 'admin'

export interface AuthUser {
  id: string
  phone: string
  role: UserRole
  fullName?: string
  region?: string
  language?: string
  paymentDetailsSet?: boolean
  mobileMoneyNumber?: string | null
  mobileMoneyNetwork?: string | null
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  registrationToken: string | null
  pendingPhone: string | null
  isAuthenticated: boolean
  isInitialized: boolean
  setAuth: (user: AuthUser, accessToken: string) => void
  setAccessToken: (token: string) => void
  setRegistrationToken: (token: string, phone: string) => void
  clearRegistrationToken: () => void
  clearAuth: () => void
  setInitialized: (initialized: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      registrationToken: null,
      pendingPhone: null,
      isAuthenticated: false,
      isInitialized: false,
      setAuth: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true, registrationToken: null, pendingPhone: null }),
      setAccessToken: (accessToken) => set({ accessToken, isAuthenticated: true }),
      setRegistrationToken: (registrationToken, pendingPhone) =>
        set({ registrationToken, pendingPhone }),
      clearRegistrationToken: () => set({ registrationToken: null, pendingPhone: null }),
      clearAuth: () =>
        set({ user: null, accessToken: null, isAuthenticated: false, registrationToken: null, pendingPhone: null, isInitialized: true }),
      setInitialized: (isInitialized) => set({ isInitialized }),
    }),
    { name: 'vegelink-auth', partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated, accessToken: s.accessToken }) },
  ),
)
