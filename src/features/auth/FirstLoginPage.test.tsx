import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '@/design-system'
import { FirstLoginPage } from './FirstLoginPage'
import { useAuthStore } from '@/app/auth-store'

function setup() {
  return render(
    <MemoryRouter initialEntries={['/first-login']}>
      <ToastProvider>
        <Routes>
          <Route path="/first-login" element={<FirstLoginPage />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('FirstLoginPage', () => {
  beforeEach(() => useAuthStore.setState({ token: 'restringido', user: null, status: 'restricted' }))
  it('cambio exitoso deja authenticated y navega a dashboard', async () => {
    setup()
    await userEvent.type(screen.getByLabelText(/nueva contraseña/i), '12345678')
    await userEvent.type(screen.getByLabelText(/confirmar/i), '12345678')
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }))
    expect(await screen.findByText('Dashboard')).toBeInTheDocument()
    expect(useAuthStore.getState().status).toBe('authenticated')
  })
})
