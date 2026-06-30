import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useAuthStore } from './auth-store'

function setRol(rolNombre: string) {
  useAuthStore.setState({
    token: 't', status: 'authenticated',
    user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 1, rolNombre, emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [2], permisos: [] },
  })
}
const renderSidebar = () =>
  render(<MemoryRouter><Sidebar collapsed={false} onToggle={() => {}} /></MemoryRouter>)

describe('Sidebar gating por rol', () => {
  beforeEach(() => setRol('EmisorAdmin'))
  it('EmisorAdmin ve Usuarios y Emitir DTE', () => {
    renderSidebar()
    expect(screen.getByRole('link', { name: /usuarios/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /emitir dte/i })).toBeInTheDocument()
  })
  it('Cajero NO ve Usuarios ni Configuración de mora', () => {
    setRol('Cajero')
    renderSidebar()
    expect(screen.queryByRole('link', { name: /usuarios/i })).toBeNull()
    expect(screen.queryByRole('link', { name: /configuración de mora/i })).toBeNull()
  })
  it('Auditor ve Usuarios pero NO Emitir DTE', () => {
    setRol('Auditor')
    renderSidebar()
    expect(screen.getByRole('link', { name: /usuarios/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /emitir dte/i })).toBeNull()
  })
})
