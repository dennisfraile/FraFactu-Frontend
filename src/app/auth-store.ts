import { create } from 'zustand'
import { isExpired } from '@/lib/auth/jwt'
import type { AuthUser, LoginResponse } from '@/features/auth/types'

type Status = 'anon' | 'restricted' | 'authenticated'
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
  const { token: _t, tokenType: _tt, expiresIn: _e, requiereCambioPwd: _r, ...rest } = r
  return rest
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  status: 'anon',
  setSession: (r) => {
    const user = toUser(r)
    const status: Status = r.requiereCambioPwd ? 'restricted' : 'authenticated'
    localStorage.setItem(KEY, JSON.stringify({ token: r.token, user }))
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
