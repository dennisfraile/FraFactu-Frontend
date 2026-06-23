import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { UserMenu } from './UserMenu'
import { useAuthStore } from './auth-store'
import { authApi } from '@/features/auth/api'

describe('UserMenu', () => {
  beforeEach(() => useAuthStore.setState({
    status: 'authenticated', token: 't',
    user: { userId: 1, nombreCompleto: 'Ana', email: 'ana@x.com', rolId: 1, rolNombre: 'Admin', emisorId: 1, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [], permisos: [] },
  }))
  it('cerrar sesión llama a authApi.logout y limpia el store', async () => {
    const apiSpy = vi.spyOn(authApi, 'logout').mockResolvedValue()
    render(<MemoryRouter><UserMenu /></MemoryRouter>)
    await userEvent.click(screen.getByRole('button', { name: /ana/i }))
    await userEvent.click(screen.getByRole('menuitem', { name: /cerrar sesión/i }))
    expect(apiSpy).toHaveBeenCalled()
    expect(useAuthStore.getState().status).toBe('anon')
  })

  it('navega a /login después de cerrar sesión', async () => {
    vi.spyOn(authApi, 'logout').mockResolvedValue()
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<UserMenu />} />
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>
    )
    await userEvent.click(screen.getByRole('button', { name: /ana/i }))
    await userEvent.click(screen.getByRole('menuitem', { name: /cerrar sesión/i }))
    expect(await screen.findByText('Login')).toBeInTheDocument()
  })
})
