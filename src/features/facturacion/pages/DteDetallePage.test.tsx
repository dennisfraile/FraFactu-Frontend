// src/features/facturacion/pages/DteDetallePage.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '@/design-system'
import { DteDetallePage } from './DteDetallePage'
import { authAs } from '@/test/auth'

function setup(entrada = '/facturacion/10') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[entrada]}>
        <ToastProvider>
          <Routes>
            <Route path="/facturacion/:id" element={<DteDetallePage />} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('DteDetallePage', () => {
  beforeEach(() => {
    authAs('EmisorAdmin', { rolId: 2, emisorId: 5, accesoTodasSucursales: true })
  })

  it('muestra el DTE y permite anular con motivo', async () => {
    setup()
    expect(await screen.findByText(/DTE-01-00000000-000000000000001/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /anular/i }))
    await userEvent.type(screen.getByLabelText(/motivo/i), 'Error de digitación')
    await userEvent.click(screen.getByRole('button', { name: /confirmar anulación/i }))
    expect(await screen.findByText(/anulada/i)).toBeInTheDocument()
  })

  it('muestra un estado de error si el id de la ruta no es válido', () => {
    setup('/facturacion/abc')
    expect(screen.getByText(/DTE no válido/i)).toBeInTheDocument()
  })

  it('EmisorAdmin ve "Anular"', async () => {
    setup()
    expect(await screen.findByRole('button', { name: /anular/i })).toBeInTheDocument()
  })

  it('Cajero no ve "Anular"', async () => {
    authAs('Cajero', { accesoTodasSucursales: true })
    setup()
    await screen.findByText(/DTE-01-00000000-000000000000001/)
    expect(screen.queryByRole('button', { name: /anular/i })).toBeNull()
  })
})
