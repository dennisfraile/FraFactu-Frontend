// src/features/inventario/components/AjusteStockModal.test.tsx
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { AjusteStockModal } from './AjusteStockModal'

const base = 'http://localhost:8080/api'
const server = setupServer(http.get(`${base}/bodegas/sucursal/2`, () => HttpResponse.json([{ id: 1, nombre: 'Bodega Principal' }])))
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('AjusteStockModal', () => {
  it('no confirma con observaciones cortas', async () => {
    const onConfirmar = vi.fn()
    render(<AjusteStockModal producto={{ id: 2, nombre: 'P001' }} sucursalId={2} onConfirmar={onConfirmar} onClose={() => {}} cargando={false} />, { wrapper })
    await waitFor(() => screen.getByText('Bodega Principal'))
    fireEvent.change(screen.getByLabelText(/cantidad/i), { target: { value: '-2' } })
    fireEvent.change(screen.getByLabelText(/observaciones/i), { target: { value: 'corto' } })
    fireEvent.click(screen.getByRole('button', { name: /confirmar ajuste/i }))
    expect(onConfirmar).not.toHaveBeenCalled()
  })
  it('confirma con datos válidos', async () => {
    const onConfirmar = vi.fn()
    render(<AjusteStockModal producto={{ id: 2, nombre: 'P001' }} sucursalId={2} onConfirmar={onConfirmar} onClose={() => {}} cargando={false} />, { wrapper })
    await waitFor(() => screen.getByText('Bodega Principal'))
    fireEvent.change(screen.getByLabelText(/cantidad/i), { target: { value: '-2' } })
    fireEvent.change(screen.getByLabelText(/observaciones/i), { target: { value: 'rotura en bodega' } })
    fireEvent.click(screen.getByRole('button', { name: /confirmar ajuste/i }))
    expect(onConfirmar).toHaveBeenCalledWith(expect.objectContaining({ productoId: 2, cantidad: -2, motivo: expect.any(String) }))
  })
})
