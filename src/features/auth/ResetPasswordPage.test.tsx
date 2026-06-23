import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '@/design-system'
import { ResetPasswordPage } from './ResetPasswordPage'

function setup(search = '?token=abc') {
  return render(
    <MemoryRouter initialEntries={[`/reset-password${search}`]}>
      <ToastProvider>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('ResetPasswordPage', () => {
  it('reset exitoso redirige a login', async () => {
    setup('?token=abc')
    await userEvent.type(screen.getByLabelText(/nueva contraseña/i), '12345678')
    await userEvent.type(screen.getByLabelText(/confirmar/i), '12345678')
    await userEvent.click(screen.getByRole('button', { name: /restablecer/i }))
    expect(await screen.findByText('Login')).toBeInTheDocument()
  })
  it('muestra error de validación si no coinciden', async () => {
    setup()
    await userEvent.type(screen.getByLabelText(/nueva contraseña/i), '12345678')
    await userEvent.type(screen.getByLabelText(/confirmar/i), 'xxxxxxxx')
    await userEvent.click(screen.getByRole('button', { name: /restablecer/i }))
    expect(await screen.findByText(/no coinciden/i)).toBeInTheDocument()
  })
})
