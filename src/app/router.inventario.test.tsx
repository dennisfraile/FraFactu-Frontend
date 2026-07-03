// src/app/router.inventario.test.tsx
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

describe('rutas inventario', () => {
  beforeEach(() => {
    authAs('EmisorAdmin', { rolId: 5, accesoTodasSucursales: true, sucursalIds: [2] })
  })

  // Páginas cargadas con React.lazy: ampliamos timeout por transform fría. Ver router.dashboard.test.
  it('monta productos', async () => {
    setup('/inventario/productos')
    expect(await screen.findByRole('heading', { name: 'Productos y servicios' }, { timeout: 15000 })).toBeInTheDocument()
  }, 20000)

  it('monta stock', async () => {
    setup('/inventario/stock')
    expect(await screen.findByRole('heading', { name: 'Stock' }, { timeout: 15000 })).toBeInTheDocument()
  }, 20000)

  it('monta reportes', async () => {
    setup('/inventario/reportes')
    expect(await screen.findByRole('heading', { name: 'Reportes de inventario' }, { timeout: 15000 })).toBeInTheDocument()
  }, 20000)

  it('Contador no puede abrir el form de nuevo producto (AccesoDenegado)', async () => {
    authAs('Contador', { accesoTodasSucursales: true })
    setup('/inventario/productos/nuevo')
    expect(await screen.findByText(/acceso denegado/i)).toBeInTheDocument()
  })

  it('EmisorAdmin sí abre el form de nuevo producto', async () => {
    authAs('EmisorAdmin', { accesoTodasSucursales: true })
    setup('/inventario/productos/nuevo')
    expect(screen.queryByText(/acceso denegado/i)).toBeNull()
  })
})
