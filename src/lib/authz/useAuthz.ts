import { useAuthStore } from '@/app/auth-store'
import { puede, type RolNombre } from './roles'

export function useAuthz() {
  const rol = useAuthStore((s) => s.user?.rolNombre)
  return {
    rol,
    hasRole: (r: RolNombre) => puede(rol, [r]),
    hasAnyRole: (rs: RolNombre[]) => puede(rol, rs),
  }
}
