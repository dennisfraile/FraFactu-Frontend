// src/features/compras/pages/ProveedoresPage.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/design-system'
import { ProveedoresPage } from './ProveedoresPage'
import { authAs } from '@/test/auth'

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
    authAs('EmisorAdmin', { rolId: 2, emisorId: 5, accesoTodasSucursales: true })
  })

  it('lista los proveedores del backend', async () => {
    setup()
    expect(await screen.findByText('Distribuidora El Sol')).toBeInTheDocument()
    expect(screen.getByText('06140101011011')).toBeInTheDocument()
  })

  it('Auditor no ve "Nuevo proveedor"', async () => {
    authAs('Auditor', { accesoTodasSucursales: true })
    setup()
    await screen.findByText(/proveedor/i)
    expect(screen.queryByRole('button', { name: /nuevo proveedor/i })).toBeNull()
  })
})
