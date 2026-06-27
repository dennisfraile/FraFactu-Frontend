// src/features/dtes-recibidos/pages/MapearDtePage.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '@/design-system'
import { MapearDtePage } from './MapearDtePage'
import { useAuthStore } from '@/app/auth-store'

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
    useAuthStore.setState({ token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', status: 'authenticated', user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 2, rolNombre: 'EmisorAdmin', emisorId: 5, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  })

  it('precarga las líneas del DTE y crea la compra (cuadra como gasto)', async () => {
    const user = userEvent.setup()
    setup()
    expect(await screen.findByText('Resma de papel bond carta')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /crear compra/i }))
    expect(await screen.findByText('Compra creada')).toBeInTheDocument()
  }, 15000)
})
