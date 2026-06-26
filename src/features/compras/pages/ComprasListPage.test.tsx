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
    useAuthStore.setState({ token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', status: 'authenticated', user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 2, rolNombre: 'Admin', emisorId: 5, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  })

  it('lista las compras del backend', async () => {
    setup()
    expect(await screen.findByText('F-001')).toBeInTheDocument()
    expect(screen.getByText('Distribuidora El Sol')).toBeInTheDocument()
    expect(screen.getByText('BORRADOR')).toBeInTheDocument()
  })
})
