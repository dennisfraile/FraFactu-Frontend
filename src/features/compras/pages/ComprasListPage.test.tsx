// src/features/compras/pages/ComprasListPage.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ComprasListPage } from './ComprasListPage'
import { authAs } from '@/test/auth'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><MemoryRouter><ComprasListPage /></MemoryRouter></QueryClientProvider>)
}

describe('ComprasListPage', () => {
  beforeEach(() => {
    authAs('EmisorAdmin', { rolId: 2, emisorId: 5, accesoTodasSucursales: true })
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
    authAs('Auditor', { accesoTodasSucursales: true })
    setup()
    expect(await screen.findByText('F-001')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /nueva compra/i })).toBeNull()
  })
})
