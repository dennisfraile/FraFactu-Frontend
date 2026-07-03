// src/features/dtes-recibidos/pages/DtesRecibidosListPage.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { DtesRecibidosListPage } from './DtesRecibidosListPage'
import { authAs } from '@/test/auth'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><MemoryRouter><DtesRecibidosListPage /></MemoryRouter></QueryClientProvider>)
}

describe('DtesRecibidosListPage', () => {
  beforeEach(() => {
    authAs('EmisorAdmin', { rolId: 2, emisorId: 5, accesoTodasSucursales: true })
  })

  it('muestra los DTEs y las estadísticas', async () => {
    setup()
    expect(await screen.findByText('DTE-03-0001')).toBeInTheDocument()
    expect(screen.getByText('DISTRIBUIDORA EL BUEN PRECIO')).toBeInTheDocument()
    expect(await screen.findByText(/pendientes/i)).toBeInTheDocument()
  })

  it('EmisorAdmin ve las acciones de ingesta', async () => {
    setup()
    expect(await screen.findByRole('button', { name: /cargar json/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /leer correo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /configurar correo/i })).toBeInTheDocument()
  })

  it('Auditor no ve ingesta ni configuración', async () => {
    authAs('Auditor', { accesoTodasSucursales: true })
    setup()
    expect(await screen.findByText('DTE-03-0001')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cargar json/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /configurar correo/i })).toBeNull()
  })
})
