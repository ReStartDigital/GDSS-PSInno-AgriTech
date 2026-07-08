import React, { createContext, useContext, ReactNode } from 'react'
import { useAuthStore, AuthUser } from '../store/auth.store'

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isInitialized: boolean
  clearAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Consumes existing Zustand store to bridge to Context
  const { user, isAuthenticated, isInitialized, clearAuth } = useAuthStore()

  const value = {
    user,
    isAuthenticated,
    isInitialized,
    clearAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
