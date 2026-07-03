// src/features/compras/pages/CompraDetallePage.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { CompraDetallePage } from './CompraDetallePage'
import { ToastProvider } from '@/design-system'
import { authAs } from '@/test/auth'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/compras/50']}>
          <Routes>
            <Route path="/compras/:id" element={<CompraDetallePage />} />
            <Route path="/compras/:id/editar" element={<div>Editar</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

describe('CompraDetallePage', () => {
  beforeEach(() => {
    authAs('EmisorAdmin', { rolId: 2, emisorId: 5, accesoTodasSucursales: true })
  })

  it('muestra la compra BORRADOR con acciones Confirmar y Anular', async () => {
    setup()
    expect(await screen.findByText('F-001')).toBeInTheDocument()
    expect(screen.getByText('Distribuidora El Sol')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /anular/i })).toBeInTheDocument()
  })

  it('al anular pide un motivo obligatorio', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(await screen.findByRole('button', { name: /^anular/i }))
    await user.click(screen.getByRole('button', { name: /confirmar anulación/i }))
    expect(await screen.findByText(/motivo.*obligatorio/i)).toBeInTheDocument()
  }, 15000)

  it('Auditor no ve acciones de compra', async () => {
    authAs('Auditor', { accesoTodasSucursales: true })
    setup()
    await screen.findByText('F-001')
    expect(screen.queryByRole('button', { name: /^anular$/i })).toBeNull()
  })
})
