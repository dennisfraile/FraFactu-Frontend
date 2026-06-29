// src/features/cuentas-por-cobrar/pages/PlanDetallePage.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { ToastProvider } from '@/design-system'
import { cuentasPorCobrarHandlers } from '@/test/msw/cuentas-por-cobrar-handlers'
import { PlanDetallePage } from './PlanDetallePage'

const base = 'http://localhost:8080/api'
const server = setupServer(
  ...cuentasPorCobrarHandlers,
  http.get(`${base}/catalogos/formas-pago`, () => HttpResponse.json([{ id: 1, valor: 'Efectivo' }])),
)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderEn(ruta: string, children: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter initialEntries={[ruta]}>
          <Routes><Route path="/cuentas-por-cobrar/:planId" element={children} /></Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

describe('PlanDetallePage', () => {
  it('muestra la cabecera y las cuotas del plan', async () => {
    renderEn('/cuentas-por-cobrar/1', <PlanDetallePage />)
    await waitFor(() => expect(screen.getByText('Cliente Demo')).toBeInTheDocument())
    expect(screen.getByText('GEN-1')).toBeInTheDocument()
  })
  it('abre el modal de pago al pulsar Pagar', async () => {
    renderEn('/cuentas-por-cobrar/1', <PlanDetallePage />)
    await waitFor(() => screen.getByText('GEN-1'))
    fireEvent.click(screen.getByRole('button', { name: /^pagar/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: /confirmar pago/i })).toBeInTheDocument())
  })
})
