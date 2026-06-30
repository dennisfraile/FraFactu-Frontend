import { Outlet } from 'react-router-dom'
import { useAuthz } from '@/lib/authz/useAuthz'
import type { RolNombre } from '@/lib/authz/roles'
import { AccesoDenegado } from './AccesoDenegado'

export function RoleRoute({ allow }: { allow: RolNombre[] }) {
  const { hasAnyRole } = useAuthz()
  return hasAnyRole(allow) ? <Outlet /> : <AccesoDenegado />
}
