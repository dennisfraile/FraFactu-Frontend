import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { ToastProvider } from '@/design-system'
import { inventarioHandlers } from '@/test/msw/inventario-handlers'
import { StockPage } from './StockPage'

const base = 'http://localhost:8080/api'
const server = setupServer(...inventarioHandlers, http.get(`${base}/bodegas/sucursal/:id`, () => HttpResponse.json([{ id: 1, nombre: 'Bodega Principal' }])))
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}><ToastProvider>{children}</ToastProvider></QueryClientProvider>
}

describe('StockPage', () => {
  it('muestra existencias por defecto y cambia a movimientos', async () => {
    render(<StockPage />, { wrapper })
    await waitFor(() => expect(screen.getByText('Producto de prueba')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('tab', { name: /movimientos/i }))
    await waitFor(() => expect(screen.getByText('COMPRA_EXTERNA')).toBeInTheDocument())
  })
})
