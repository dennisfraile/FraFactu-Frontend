import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import { api } from './axios'
import { useAuthStore } from '@/app/auth-store'

// axios-mock-adapter intercepta la instancia sin tocar la red.
let mock: MockAdapter
let originalLocation: PropertyDescriptor | undefined
beforeEach(() => {
  mock = new MockAdapter(api)
  useAuthStore.setState({ token: 'tkn-123', user: null, status: 'authenticated' })
  // Silenciar ruido jsdom: reemplazar window.location con un mock
  originalLocation = Object.getOwnPropertyDescriptor(window, 'location')
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: { pathname: '/dashboard', assign: vi.fn() },
  })
})

afterEach(() => {
  mock.restore()
  if (originalLocation) Object.defineProperty(window, 'location', originalLocation)
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

  it('un 401 desde /auth/login NO llama a logout (endpoint público)', async () => {
    const logoutSpy = vi.spyOn(useAuthStore.getState(), 'logout')
    mock.onPost('/auth/login').reply(401)
    await expect(api.post('/auth/login', {})).rejects.toBeTruthy()
    expect(logoutSpy).not.toHaveBeenCalled()
  })

  it('un 401 desde /auth/google NO llama a logout (endpoint público)', async () => {
    const logoutSpy = vi.spyOn(useAuthStore.getState(), 'logout')
    mock.onPost('/auth/google').reply(401)
    await expect(api.post('/auth/google', {})).rejects.toBeTruthy()
    expect(logoutSpy).not.toHaveBeenCalled()
  })
})
