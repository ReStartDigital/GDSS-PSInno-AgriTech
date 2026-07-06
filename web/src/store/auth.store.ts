import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'farmer' | 'buyer' | 'transporter' | 'agent' | 'admin'

export interface AuthUser {
  id: string
  phone: string
  role: UserRole
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  registrationToken: string | null
  pendingPhone: string | null
  isAuthenticated: boolean
  setAuth: (user: AuthUser, accessToken: string) => void
  setAccessToken: (token: string) => void
  setRegistrationToken: (token: string, phone: string) => void
  clearRegistrationToken: () => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      registrationToken: null,
      pendingPhone: null,
      isAuthenticated: false,
      setAuth: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true, registrationToken: null, pendingPhone: null }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setRegistrationToken: (registrationToken, pendingPhone) =>
        set({ registrationToken, pendingPhone }),
      clearRegistrationToken: () => set({ registrationToken: null, pendingPhone: null }),
      clearAuth: () =>
        set({ user: null, accessToken: null, isAuthenticated: false, registrationToken: null, pendingPhone: null }),
    }),
    { name: 'vegelink-auth', partialize: (s) => ({ user: s.user }) },
  ),
)
