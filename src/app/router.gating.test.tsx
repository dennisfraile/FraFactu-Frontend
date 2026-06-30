// src/app/router.gating.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/design-system'
import { AppRoutes } from './router'
import { useAuthStore } from './auth-store'

function setRol(rolNombre: string) {
  useAuthStore.setState({
    token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', status: 'authenticated',
    user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 1, rolNombre, emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [2], permisos: [] },
  })
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
