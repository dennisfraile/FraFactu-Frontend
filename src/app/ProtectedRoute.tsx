import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from './auth-store'

export function ProtectedRoute() {
  const status = useAuthStore((s) => s.status)
  if (status === 'authenticated') return <Outlet />
  if (status === 'restricted') return <Navigate to="/first-login" replace />
  return <Navigate to="/login" replace />
}
