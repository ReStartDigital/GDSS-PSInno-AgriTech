import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function RequireAuth() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Outlet /> : <Navigate to="/auth/login" replace />
}

export function RedirectIfAuth() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/overview" replace /> : <Outlet />
}
