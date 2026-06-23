import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ToastProvider } from '@/design-system'
import { LoginPage } from './LoginPage'
import { useAuthStore } from '@/app/auth-store'

function setup() {
  return render(
    <GoogleOAuthProvider clientId="test">
      <MemoryRouter initialEntries={['/login']}>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
            <Route path="/first-login" element={<div>Primer ingreso</div>} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    </GoogleOAuthProvider>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => useAuthStore.setState({ token: null, user: null, status: 'anon' }))

  it('login correcto navega a dashboard y deja sesión authenticated', async () => {
    setup()
    await userEvent.type(screen.getByLabelText(/correo/i), 'ana@x.com')
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'secreta12')
    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(await screen.findByText('Dashboard')).toBeInTheDocument()
    expect(useAuthStore.getState().status).toBe('authenticated')
  })

  it('credenciales inválidas muestran error y no navega', async () => {
    setup()
    await userEvent.type(screen.getByLabelText(/correo/i), 'ana@x.com')
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'mala')
    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(await screen.findByText(/incorrect/i)).toBeInTheDocument()
    expect(useAuthStore.getState().status).toBe('anon')
  })
})
