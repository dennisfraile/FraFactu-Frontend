// src/features/compras/pages/ComprasListPage.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ComprasListPage } from './ComprasListPage'
import { useAuthStore } from '@/app/auth-store'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><MemoryRouter><ComprasListPage /></MemoryRouter></QueryClientProvider>)
}

describe('ComprasListPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', status: 'authenticated', user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 2, rolNombre: 'EmisorAdmin', emisorId: 5, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  })

  it('lista las compras del backend', async () => {
    setup()
    expect(await screen.findByText('F-001')).toBeInTheDocument()
    expect(screen.getByText('Distribuidora El Sol')).toBeInTheDocument()
    expect(screen.getByText('BORRADOR')).toBeInTheDocument()
  })

  it('EmisorAdmin ve "Nueva compra"', async () => {
    setup()
    expect(await screen.findByText('F-001')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /nueva compra/i })).toBeInTheDocument()
  })

  it('Auditor no ve "Nueva compra"', async () => {
    useAuthStore.setState({ token: 't', status: 'authenticated', user: { userId: 1, nombreCompleto: 'X', email: 'x@x.com', rolId: 1, rolNombre: 'Auditor', emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
    setup()
    expect(await screen.findByText('F-001')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /nueva compra/i })).toBeNull()
  })
})
