// src/app/router.compras.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/design-system'
import { AppRoutes } from './router'
import { authAs } from '@/test/auth'

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

describe('rutas de compras', () => {
  beforeEach(() => {
    authAs('EmisorAdmin', { rolId: 2, emisorId: 5, accesoTodasSucursales: true })
  })

  // Las páginas se cargan con React.lazy: en caché de transform fría el import
  // dinámico supera el timeout por defecto; ampliamos findBy y el test. Ver router.dashboard.test.
  it('/proveedores renderiza la página de proveedores', async () => {
    setup('/proveedores')
    expect(await screen.findByText('Distribuidora El Sol', undefined, { timeout: 15000 })).toBeInTheDocument()
  }, 20000)

  it('/compras renderiza el listado de compras', async () => {
    setup('/compras')
    expect(await screen.findByText('F-001', undefined, { timeout: 15000 })).toBeInTheDocument()
  }, 20000)
})
