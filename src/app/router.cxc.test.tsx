// src/app/router.cxc.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/design-system'
import { AppRoutes } from './router'
import { useAuthStore } from './auth-store'
import { navSections } from './nav-config'

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

describe('rutas de cuentas por cobrar', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', status: 'authenticated', user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 2, rolNombre: 'EmisorAdmin', emisorId: 5, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  })

  // Páginas cargadas con React.lazy: ampliamos timeout por transform fría. Ver router.dashboard.test.
  it('renderiza el listado en /cuentas-por-cobrar', async () => {
    setup('/cuentas-por-cobrar')
    expect(await screen.findByRole('heading', { name: /cuentas por cobrar/i }, { timeout: 15000 })).toBeInTheDocument()
  }, 20000)

  it('renderiza la configuracion de mora en /cuentas-por-cobrar/configuracion-mora', async () => {
    setup('/cuentas-por-cobrar/configuracion-mora')
    expect(await screen.findByRole('heading', { name: /configuración de mora/i }, { timeout: 15000 })).toBeInTheDocument()
  }, 20000)

  it('incluye la sección Cuentas por cobrar en nav-config', () => {
    const sec = navSections.find((s) => s.title === 'Cuentas por cobrar')
    expect(sec).toBeDefined()
    expect(sec!.items.some((i) => i.to === '/cuentas-por-cobrar')).toBe(true)
  })
})
