// src/app/router.inventario.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/design-system'
import { AppRoutes } from './router'
import { useAuthStore } from './auth-store'

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
    useAuthStore.setState({ token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', status: 'authenticated', user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 5, rolNombre: 'EmisorAdmin', emisorId: 3, emisorNombre: 'E', sucursalIds: [2], accesoTodasSucursales: true, permisos: [] } })
  })

  it('monta productos', async () => {
    setup('/inventario/productos')
    expect(await screen.findByRole('heading', { name: 'Productos y servicios' })).toBeInTheDocument()
  })

  it('monta stock', async () => {
    setup('/inventario/stock')
    expect(await screen.findByRole('heading', { name: 'Stock' })).toBeInTheDocument()
  })

  it('monta reportes', async () => {
    setup('/inventario/reportes')
    expect(await screen.findByRole('heading', { name: 'Reportes de inventario' })).toBeInTheDocument()
  })

  it('Contador no puede abrir el form de nuevo producto (AccesoDenegado)', async () => {
    useAuthStore.setState({ token: 't', status: 'authenticated', user: { userId: 1, nombreCompleto: 'X', email: 'x@x.com', rolId: 1, rolNombre: 'Contador', emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
    setup('/inventario/productos/nuevo')
    expect(await screen.findByText(/acceso denegado/i)).toBeInTheDocument()
  })

  it('EmisorAdmin sí abre el form de nuevo producto', async () => {
    useAuthStore.setState({ token: 't', status: 'authenticated', user: { userId: 1, nombreCompleto: 'X', email: 'x@x.com', rolId: 1, rolNombre: 'EmisorAdmin', emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
    setup('/inventario/productos/nuevo')
    expect(screen.queryByText(/acceso denegado/i)).toBeNull()
  })
})
