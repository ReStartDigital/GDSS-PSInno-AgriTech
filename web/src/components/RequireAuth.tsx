import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'

export function RequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <Outlet /> : <Navigate to="/auth/login" replace />
}

export function RedirectIfAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <Navigate to="/overview" replace /> : <Outlet />
}
