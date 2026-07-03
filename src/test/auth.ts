import { useAuthStore } from '@/app/auth-store'
import type { AuthUser } from '@/features/auth/types'

interface AuthAsOpts {
  accesoTodasSucursales?: boolean
  sucursalIds?: number[]
  emisorId?: number
  rolId?: number
  userId?: number
  status?: 'authenticated' | 'restricted'
  token?: string
  /** Escape hatch para campos puntuales del AuthUser que un test necesite fijar. */
  user?: Partial<AuthUser>
}

/**
 * Coloca una sesión autenticada en el store para los tests.
 * Centraliza el literal de `AuthUser` que antes se duplicaba en cada suite;
 * cada feature pasa solo los overrides que le importan (rol, scope de sucursal,
 * emisor, etc.).
 */
export function authAs(rolNombre: string, opts: AuthAsOpts = {}) {
  const {
    accesoTodasSucursales = false,
    sucursalIds = [1],
    emisorId = 3,
    rolId = 1,
    userId = 1,
    status = 'authenticated',
    token = 't',
    user = {},
  } = opts
  useAuthStore.setState({
    token,
    status,
    user: {
      userId,
      nombreCompleto: 'X',
      email: 'x@x.com',
      rolId,
      rolNombre,
      emisorId,
      emisorNombre: 'E',
      accesoTodasSucursales,
      sucursalIds,
      permisos: [],
      ...user,
    },
  })
}
