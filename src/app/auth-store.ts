import { create } from 'zustand'
import { isExpired } from '@/lib/auth/jwt'
import type { AuthUser, LoginResponse } from '@/features/auth/types'

type Status = 'anon' | 'restricted' | 'authenticated'

// DEUDA DE SEGURIDAD CONSCIENTE: el JWT se persiste en localStorage, lo que lo
// expone a robo vía XSS (a diferencia de una cookie httpOnly). Es una decisión
// deliberada porque el backend actual autentica por Bearer, no por cookie. Hoy
// el riesgo es bajo (no hay dangerouslySetInnerHTML ni render de HTML externo en
// el frontend), pero migrar a cookie httpOnly + CSRF queda como mejora pendiente
// que requiere cambio de contrato con el backend. Ver auditoría frontend #5.
const KEY = 'frafactu-session'

interface AuthState {
  token: string | null
  user: AuthUser | null
  status: Status
  setSession: (r: LoginResponse) => void
  logout: () => void
  hydrate: () => void
}

function toUser(r: LoginResponse): AuthUser {
  return {
    userId: r.userId,
    nombreCompleto: r.nombreCompleto,
    email: r.email,
    rolId: r.rolId,
    rolNombre: r.rolNombre,
    emisorId: r.emisorId,
    emisorNombre: r.emisorNombre,
    accesoTodasSucursales: r.accesoTodasSucursales,
    sucursalIds: r.sucursalIds,
    permisos: r.permisos,
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  status: 'anon',
  setSession: (r) => {
    const user = toUser(r)
    const status: Status = r.requiereCambioPwd ? 'restricted' : 'authenticated'
    if (status === 'authenticated') {
      localStorage.setItem(KEY, JSON.stringify({ token: r.token, user }))
    } else {
      localStorage.removeItem(KEY)
    }
    set({ token: r.token, user, status })
  },
  logout: () => {
    localStorage.removeItem(KEY)
    set({ token: null, user: null, status: 'anon' })
  },
  hydrate: () => {
    const raw = localStorage.getItem(KEY)
    if (!raw) return
    try {
      const { token, user } = JSON.parse(raw) as { token: string; user: AuthUser }
      if (!token || isExpired(token)) {
        localStorage.removeItem(KEY)
        return
      }
      set({ token, user, status: 'authenticated' })
    } catch {
      localStorage.removeItem(KEY)
    }
  },
}))

export const selectIsAuthenticated = (s: AuthState) => s.status === 'authenticated'
export const selectRequiresPasswordChange = (s: AuthState) => s.status === 'restricted'
