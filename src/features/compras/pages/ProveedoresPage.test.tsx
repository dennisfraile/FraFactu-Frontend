// src/features/compras/pages/ProveedoresPage.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/design-system'
import { ProveedoresPage } from './ProveedoresPage'
import { useAuthStore } from '@/app/auth-store'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter><ProveedoresPage /></MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

describe('ProveedoresPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', status: 'authenticated', user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 2, rolNombre: 'EmisorAdmin', emisorId: 5, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  })

  it('lista los proveedores del backend', async () => {
    setup()
    expect(await screen.findByText('Distribuidora El Sol')).toBeInTheDocument()
    expect(screen.getByText('06140101011011')).toBeInTheDocument()
  })

  it('Auditor no ve "Nuevo proveedor"', async () => {
    useAuthStore.setState({ token: 't', status: 'authenticated', user: { userId: 1, nombreCompleto: 'X', email: 'x@x.com', rolId: 1, rolNombre: 'Auditor', emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
    setup()
    await screen.findByText(/proveedor/i)
    expect(screen.queryByRole('button', { name: /nuevo proveedor/i })).toBeNull()
  })
})
