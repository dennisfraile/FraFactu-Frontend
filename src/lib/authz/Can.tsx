import type { ReactNode } from 'react'
import { useAuthz } from './useAuthz'
import type { RolNombre } from './roles'

interface Props { roles: RolNombre[]; fallback?: ReactNode; children: ReactNode }

export function Can({ roles, fallback = null, children }: Props) {
  const { hasAnyRole } = useAuthz()
  return <>{hasAnyRole(roles) ? children : fallback}</>
}
