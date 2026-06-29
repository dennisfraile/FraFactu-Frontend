import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { PagarCuotaModal } from './PagarCuotaModal'

const base = 'http://localhost:8080/api'
const server = setupServer(
  http.get(`${base}/cuentas-por-cobrar/1/cuotas/2/mora-estimada`, () =>
    HttpResponse.json({ numero: 2, monto: 50, fechaPactada: '2026-08-01', diasAtraso: 5, interesMora: 1.25, moraHabilitada: true })),
  http.get(`${base}/catalogos/formas-pago`, () => HttpResponse.json([{ id: 1, valor: 'Efectivo' }, { id: 2, valor: 'Transferencia' }])),
)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('PagarCuotaModal', () => {
  it('muestra la mora estimada y confirma con la forma de pago', async () => {
    const onConfirmar = vi.fn()
    render(<PagarCuotaModal planId={1} numero={2} onConfirmar={onConfirmar} onClose={() => {}} cargando={false} />, { wrapper })
    await waitFor(() => expect(screen.getByText(/1\.25/)).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /confirmar pago/i }))
    expect(onConfirmar).toHaveBeenCalledWith(expect.objectContaining({ catFormaPagoId: expect.any(Number) }))
  })
})
