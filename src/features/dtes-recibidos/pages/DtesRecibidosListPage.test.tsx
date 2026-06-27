// src/features/dtes-recibidos/pages/DtesRecibidosListPage.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { DtesRecibidosListPage } from './DtesRecibidosListPage'
import { useAuthStore } from '@/app/auth-store'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><MemoryRouter><DtesRecibidosListPage /></MemoryRouter></QueryClientProvider>)
}

describe('DtesRecibidosListPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', status: 'authenticated', user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 2, rolNombre: 'EmisorAdmin', emisorId: 5, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  })

  it('muestra los DTEs y las estadísticas', async () => {
    setup()
    expect(await screen.findByText('DTE-03-0001')).toBeInTheDocument()
    expect(screen.getByText('DISTRIBUIDORA EL BUEN PRECIO')).toBeInTheDocument()
    expect(await screen.findByText(/pendientes/i)).toBeInTheDocument()
  })
})
