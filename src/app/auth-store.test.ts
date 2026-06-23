import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore, selectIsAuthenticated, selectRequiresPasswordChange } from './auth-store'
import type { LoginResponse } from '@/features/auth/types'

function future(secs = 3600) { return Math.floor(Date.now() / 1000) + secs }
function makeToken(payload: Record<string, unknown>): string {
  const b64 = (o: object) =>
    btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${b64({ alg: 'HS256' })}.${b64(payload)}.sig`
}
function makeLogin(over: Partial<LoginResponse> = {}): LoginResponse {
  return {
    token: makeToken({ exp: future() }), tokenType: 'Bearer', expiresIn: 3600,
    userId: 1, nombreCompleto: 'Ana', email: 'ana@x.com', rolId: 2, rolNombre: 'Admin',
    emisorId: 5, emisorNombre: 'Mi Empresa', accesoTodasSucursales: true, sucursalIds: [1],
    permisos: ['factura.crear'], requiereCambioPwd: false, ...over,
  }
}

describe('auth-store', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ token: null, user: null, status: 'anon' })
  })

  it('setSession con requiereCambioPwd=false → authenticated y persiste', () => {
    useAuthStore.getState().setSession(makeLogin())
    expect(useAuthStore.getState().status).toBe('authenticated')
    expect(selectIsAuthenticated(useAuthStore.getState())).toBe(true)
    expect(JSON.parse(localStorage.getItem('frafactu-session')!).user.email).toBe('ana@x.com')
  })

  it('setSession con requiereCambioPwd=true → restricted', () => {
    useAuthStore.getState().setSession(makeLogin({ requiereCambioPwd: true }))
    expect(useAuthStore.getState().status).toBe('restricted')
    expect(selectRequiresPasswordChange(useAuthStore.getState())).toBe(true)
    expect(selectIsAuthenticated(useAuthStore.getState())).toBe(false)
  })

  it('logout limpia estado y storage', () => {
    useAuthStore.getState().setSession(makeLogin())
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().status).toBe('anon')
    expect(localStorage.getItem('frafactu-session')).toBeNull()
  })

  it('hydrate restaura sesión válida desde storage', () => {
    useAuthStore.getState().setSession(makeLogin())
    useAuthStore.setState({ token: null, user: null, status: 'anon' })
    useAuthStore.getState().hydrate()
    expect(useAuthStore.getState().status).toBe('authenticated')
  })

  it('hydrate descarta token expirado', () => {
    const expired = makeLogin({ token: makeToken({ exp: 1 }) })
    localStorage.setItem('frafactu-session', JSON.stringify({ token: expired.token, user: { ...expired } }))
    useAuthStore.getState().hydrate()
    expect(useAuthStore.getState().status).toBe('anon')
    expect(localStorage.getItem('frafactu-session')).toBeNull()
  })

  it('setSession con requiereCambioPwd=true NO persiste en localStorage y status es restricted', () => {
    useAuthStore.getState().setSession(makeLogin({ requiereCambioPwd: true }))
    expect(useAuthStore.getState().status).toBe('restricted')
    expect(localStorage.getItem('frafactu-session')).toBeNull()
  })

  it('hydrate tras sesión restricted deja status anon (nada restaurado)', () => {
    useAuthStore.getState().setSession(makeLogin({ requiereCambioPwd: true }))
    // Simular recarga: resetear el estado en memoria
    useAuthStore.setState({ token: null, user: null, status: 'anon' })
    useAuthStore.getState().hydrate()
    expect(useAuthStore.getState().status).toBe('anon')
  })
})
