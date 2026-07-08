import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuthStore, type AuthUser } from '../store/auth.store'
import { authApi, usersApi } from '../lib/apiCalls'
import { Spinner } from '../components/ui/Feedback'

interface AuthContextType {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, accessToken, isAuthenticated, setAuth, setAccessToken, clearAuth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    const initializeAuth = async () => {
      try {
        // Try to perform a silent refresh via httpOnly refresh cookie
        const res = await authApi.refresh()
        const newAccessToken = res.data.data.accessToken
        
        if (active) {
          setAccessToken(newAccessToken)
          
          // Fetch the full private profile to recover the complete user context (name, region, language)
          const profileRes = await usersApi.getProfile()
          const dbUser = profileRes.data.data.user
          
          const fullName = [dbUser.firstName, dbUser.middleName, dbUser.lastName]
            .filter(Boolean)
            .join(' ')

          setAuth(
            {
              id: dbUser.id,
              phone: dbUser.phone,
              role: dbUser.role,
              fullName,
              region: dbUser.region ?? undefined,
              language: dbUser.language ?? undefined,
              paymentDetailsSet: dbUser.paymentDetailsSet,
              mobileMoneyNumber: dbUser.mobileMoneyNumber,
              mobileMoneyNetwork: dbUser.mobileMoneyNetwork,
            },
            newAccessToken
          )
        }
      } catch (err) {
        if (active) {
          clearAuth()
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    return () => {
      active = false
    }
  }, [setAccessToken, setAuth, clearAuth])

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // Ignore network errors on logout to ensure client state is always cleared
    } finally {
      clearAuth()
    }
  }

  if (isLoading) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: '#fcfdfa', zIndex: 9999
      }}>
        <Spinner />
        <p style={{ marginTop: 12, color: '#264123', fontSize: '0.9rem', fontWeight: 500, fontFamily: 'sans-serif' }}>
          Loading VegeLink...
        </p>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      isAuthenticated,
      isLoading,
      logout: handleLogout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
