import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UsuariosTable } from './UsuariosTable'
import { useAuthStore } from '@/app/auth-store'
import type { UsuarioListDto } from '../types'

function setRol(rolNombre: string) {
  useAuthStore.setState({ token: 't', status: 'authenticated', user: { userId: 1, nombreCompleto: 'X', email: 'x@x.com', rolId: 1, rolNombre, emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [2], permisos: [] } })
}
const u: UsuarioListDto = {
  id: 1, nombreCompleto: 'Ana Pérez', email: 'ana@x.com', activo: true, rolId: 5, rolNombre: 'EmisorAdmin',
  emisorNombre: 'E', accesoTodasSucursales: true, cantidadSucursales: 1, sucursalesNombres: 'Casa Matriz',
  sucursalIds: [2], cajas: [], fechaCreacion: '2026-06-30', ultimoAcceso: null,
}

describe('UsuariosTable', () => {
  beforeEach(() => setRol('EmisorAdmin'))
  it('muestra nombre, email y rol', () => {
    render(<UsuariosTable usuarios={[u]} onEditar={() => {}} onToggle={() => {}} onEliminar={() => {}} />)
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument()
    expect(screen.getByText('ana@x.com')).toBeInTheDocument()
    expect(screen.getByText('EmisorAdmin')).toBeInTheDocument()
  })
  it('estado vacío si no hay usuarios', () => {
    render(<UsuariosTable usuarios={[]} onEditar={() => {}} onToggle={() => {}} onEliminar={() => {}} />)
    expect(screen.getByText(/sin usuarios/i)).toBeInTheDocument()
  })
  it('Auditor no ve botón Editar', () => {
    setRol('Auditor')
    render(<UsuariosTable usuarios={[u]} onEditar={() => {}} onToggle={() => {}} onEliminar={() => {}} />)
    expect(screen.queryByRole('button', { name: /editar/i })).toBeNull()
  })
  it('click Editar dispara onEditar con el usuario', async () => {
    const onEditar = vi.fn()
    render(<UsuariosTable usuarios={[u]} onEditar={onEditar} onToggle={() => {}} onEliminar={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /editar/i }))
    expect(onEditar).toHaveBeenCalledWith(u)
  })
})
