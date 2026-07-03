// src/app/router.gating.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/design-system'
import { AppRoutes } from './router'
import { authAs } from '@/test/auth'

function setRol(rolNombre: string) {
  authAs(rolNombre, { accesoTodasSucursales: true, sucursalIds: [2] })
}
function setup(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

describe('router gating por rol', () => {
  beforeEach(() => setRol('Cajero'))
  it('Cajero entrando a /cuentas-por-cobrar/configuracion-mora ve AccesoDenegado', async () => {
    setup('/cuentas-por-cobrar/configuracion-mora')
    expect(await screen.findByRole('heading', { name: /acceso denegado/i })).toBeInTheDocument()
  })
  it('EmisorAdmin sí accede a configuracion-mora', async () => {
    setRol('EmisorAdmin')
    setup('/cuentas-por-cobrar/configuracion-mora')
    // No debe mostrar AccesoDenegado (renderiza la página real o su loader)
    expect(screen.queryByRole('heading', { name: /acceso denegado/i })).toBeNull()
  })
})
