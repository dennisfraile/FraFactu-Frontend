import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { setupServer } from 'msw/node'
import { ToastProvider } from '@/design-system'
import { inventarioHandlers } from '@/test/msw/inventario-handlers'
import { useAuthStore } from '@/app/auth-store'
import { ProductosTab } from './ProductosTab'

const server = setupServer(...inventarioHandlers)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><ToastProvider><MemoryRouter><ProductosTab /></MemoryRouter></ToastProvider></QueryClientProvider>)
}
function auth(rolNombre: string) {
  useAuthStore.setState({ token: 't', status: 'authenticated', user: { userId: 1, nombreCompleto: 'X', email: 'x@x.com', rolId: 1, rolNombre, emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
}

describe('ProductosTab gating', () => {
  beforeEach(() => auth('EmisorAdmin'))
  it('EmisorAdmin ve "Nuevo producto"', () => {
    setup()
    expect(screen.getByRole('button', { name: /nuevo producto/i })).toBeInTheDocument()
  })
  it('Auditor no ve "Nuevo producto"', () => {
    auth('Auditor')
    setup()
    expect(screen.queryByRole('button', { name: /nuevo producto/i })).toBeNull()
  })
})
