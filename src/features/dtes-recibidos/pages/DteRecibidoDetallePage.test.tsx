import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '@/design-system'
import { DteRecibidoDetallePage } from './DteRecibidoDetallePage'
import { authAs } from '@/test/auth'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/dtes-recibidos/7']}>
          <Routes>
            <Route path="/dtes-recibidos/:id" element={<DteRecibidoDetallePage />} />
            <Route path="/dtes-recibidos/:id/mapear" element={<div>Mapear</div>} />
            <Route path="/dtes-recibidos" element={<div>DTEs recibidos</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

describe('DteRecibidoDetallePage', () => {
  beforeEach(() => {
    authAs('EmisorAdmin', { rolId: 2, emisorId: 5, accesoTodasSucursales: true })
  })

  it('muestra el DTE PENDIENTE con sus líneas y la acción de mapear', async () => {
    setup()
    expect(await screen.findByText('DISTRIBUIDORA EL BUEN PRECIO')).toBeInTheDocument()
    expect(screen.getByText('Resma de papel bond carta')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /mapear y crear compra/i })).toBeInTheDocument()
  })

  it('descarta el DTE pidiendo motivo', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    setup()
    await user.click(await screen.findByRole('button', { name: /^descartar$/i }))
    await user.type(await screen.findByLabelText(/motivo/i), 'Duplicado')
    await user.click(screen.getByRole('button', { name: /descartar dte/i }))
    expect(await screen.findByText('DTEs recibidos', { exact: false })).toBeInTheDocument()
  }, 15000)

  it('Contador no ve Mapear/Descartar', async () => {
    authAs('Contador', { accesoTodasSucursales: true })
    setup() // DTE en estado PENDIENTE vía MSW
    await screen.findByText('DISTRIBUIDORA EL BUEN PRECIO')
    expect(screen.queryByRole('button', { name: /mapear y crear compra/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /descartar/i })).toBeNull()
  })
})
