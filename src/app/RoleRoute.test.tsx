import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { RoleRoute } from './RoleRoute'
import { authAs } from '@/test/auth'

function setRol(rolNombre: string) {
  authAs(rolNombre, { accesoTodasSucursales: true, sucursalIds: [2] })
}

function setup() {
  return render(
    <MemoryRouter initialEntries={['/x']}>
      <Routes>
        <Route element={<RoleRoute allow={['EmisorAdmin']} />}>
          <Route path="/x" element={<div>Contenido protegido</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('RoleRoute', () => {
  beforeEach(() => setRol('EmisorAdmin'))
  it('renderiza el contenido si el rol califica', () => {
    setup()
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument()
  })
  it('muestra AccesoDenegado si no califica', () => {
    setRol('Cajero')
    setup()
    expect(screen.getByRole('heading', { name: /acceso denegado/i })).toBeInTheDocument()
    expect(screen.queryByText('Contenido protegido')).toBeNull()
  })
})
