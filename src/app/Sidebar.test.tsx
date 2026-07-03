import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { authAs } from '@/test/auth'

function setRol(rolNombre: string) {
  authAs(rolNombre, { accesoTodasSucursales: true, sucursalIds: [2] })
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
