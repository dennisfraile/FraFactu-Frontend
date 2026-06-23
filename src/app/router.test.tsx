import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ToastProvider } from '@/design-system'
import { AppRoutes } from './router'
import { useAuthStore } from './auth-store'

function setup(path: string) {
  return render(
    <GoogleOAuthProvider clientId="test">
      <MemoryRouter initialEntries={[path]}>
        <ToastProvider><AppRoutes /></ToastProvider>
      </MemoryRouter>
    </GoogleOAuthProvider>,
  )
}

describe('router', () => {
  beforeEach(() => useAuthStore.setState({ token: null, user: null, status: 'anon' }))
  it('muestra el login en /login', () => {
    setup('/login')
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })
  it('una ruta protegida redirige a login si anon', () => {
    setup('/dashboard')
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })
})
