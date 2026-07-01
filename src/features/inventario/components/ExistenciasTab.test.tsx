// src/features/inventario/components/ExistenciasTab.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { ToastProvider } from '@/design-system'
import { inventarioHandlers } from '@/test/msw/inventario-handlers'
import { useAuthStore } from '@/app/auth-store'
import { ExistenciasTab } from './ExistenciasTab'

const base = 'http://localhost:8080/api'
const server = setupServer(...inventarioHandlers, http.get(`${base}/bodegas/sucursal/:id`, () => HttpResponse.json([{ id: 1, nombre: 'Bodega Principal' }])))
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}><ToastProvider>{children}</ToastProvider></QueryClientProvider>
}

beforeEach(() => {
  useAuthStore.setState({ token: 't', status: 'authenticated', user: { userId: 1, nombreCompleto: 'X', email: 'x@x.com', rolId: 1, rolNombre: 'EmisorAdmin', emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
})

describe('ExistenciasTab', () => {
  it('muestra el stock por bodega', async () => {
    render(<ExistenciasTab />, { wrapper })
    await waitFor(() => expect(screen.getByText('Producto de prueba')).toBeInTheDocument())
    expect(screen.getByText('Bodega Principal')).toBeInTheDocument()
  })
  it('abre el modal de ajuste', async () => {
    render(<ExistenciasTab />, { wrapper })
    await waitFor(() => screen.getByText('Producto de prueba'))
    fireEvent.click(screen.getAllByRole('button', { name: /ajustar/i })[0])
    await waitFor(() => expect(screen.getByRole('button', { name: /confirmar ajuste/i })).toBeInTheDocument())
  })
  it('Contador no ve "Ajustar" ni "Trasladar"', async () => {
    useAuthStore.setState({ token: 't', status: 'authenticated', user: { userId: 1, nombreCompleto: 'X', email: 'x@x.com', rolId: 1, rolNombre: 'Contador', emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
    render(<ExistenciasTab />, { wrapper })
    await waitFor(() => screen.getByText('Producto de prueba'))
    expect(screen.queryByRole('button', { name: /ajustar/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /trasladar/i })).toBeNull()
  })
})
