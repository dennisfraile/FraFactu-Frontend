import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import { api } from './axios'
import { useAuthStore } from '@/app/auth-store'

// axios-mock-adapter intercepta la instancia sin tocar la red.
let mock: MockAdapter
beforeEach(() => {
  mock = new MockAdapter(api)
  useAuthStore.setState({ token: 'tkn-123', user: null, status: 'authenticated' })
  // Silenciar ruido jsdom: reemplazar window.location con un mock
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { pathname: '/dashboard', assign: vi.fn() },
  })
})

afterEach(() => {
  mock.restore()
})

describe('api interceptors', () => {
  it('añade Authorization Bearer desde el store', async () => {
    mock.onGet('/ping').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer tkn-123')
      return [200, { ok: true }]
    })
    await api.get('/ping')
  })

  it('en 401 limpia la sesión (logout)', async () => {
    const logoutSpy = vi.spyOn(useAuthStore.getState(), 'logout')
    mock.onGet('/protegido').reply(401)
    await expect(api.get('/protegido')).rejects.toBeTruthy()
    expect(logoutSpy).toHaveBeenCalled()
  })

  it('en 403 limpia la sesión (logout)', async () => {
    const logoutSpy = vi.spyOn(useAuthStore.getState(), 'logout')
    mock.onGet('/protegido').reply(403)
    await expect(api.get('/protegido')).rejects.toBeTruthy()
    expect(logoutSpy).toHaveBeenCalled()
  })
})
