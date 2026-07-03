// src/features/dtes-recibidos/pages/MapearDtePage.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '@/design-system'
import { MapearDtePage } from './MapearDtePage'
import { authAs } from '@/test/auth'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/dtes-recibidos/7/mapear']}>
          <Routes>
            <Route path="/dtes-recibidos/:id/mapear" element={<MapearDtePage />} />
            <Route path="/compras/:id" element={<div>Compra creada</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

describe('MapearDtePage', () => {
  beforeEach(() => {
    authAs('EmisorAdmin', { rolId: 2, emisorId: 5, accesoTodasSucursales: true })
  })

  it('precarga las líneas del DTE y crea la compra (cuadra como gasto)', async () => {
    const user = userEvent.setup()
    setup()
    expect(await screen.findByText('Resma de papel bond carta')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /crear compra/i }))
    expect(await screen.findByText('Compra creada')).toBeInTheDocument()
  }, 15000)
})
