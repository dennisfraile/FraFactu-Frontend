import { useAuthStore } from '@/app/auth-store'

interface AuthAsOpts {
  accesoTodasSucursales?: boolean
  sucursalIds?: number[]
}

/**
 * Coloca una sesión autenticada en el store para los tests.
 * Centraliza el literal de `AuthUser` que antes se duplicaba en cada suite;
 * cada feature pasa solo los overrides que le importan (rol, scope de sucursal).
 */
export function authAs(rolNombre: string, opts: AuthAsOpts = {}) {
  const { accesoTodasSucursales = false, sucursalIds = [1] } = opts
  useAuthStore.setState({
    token: 't',
    status: 'authenticated',
    user: {
      userId: 1,
      nombreCompleto: 'X',
      email: 'x@x.com',
      rolId: 1,
      rolNombre,
      emisorId: 3,
      emisorNombre: 'E',
      accesoTodasSucursales,
      sucursalIds,
      permisos: [],
    },
  })
}
