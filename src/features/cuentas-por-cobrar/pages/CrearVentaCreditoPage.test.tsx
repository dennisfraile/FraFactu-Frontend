// src/features/cuentas-por-cobrar/pages/CrearVentaCreditoPage.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { ToastProvider } from '@/design-system'
import { cuentasPorCobrarHandlers } from '@/test/msw/cuentas-por-cobrar-handlers'
import { CrearVentaCreditoPage } from './CrearVentaCreditoPage'

const base = 'http://localhost:8080/api'
const server = setupServer(
  ...cuentasPorCobrarHandlers,
  // catálogos que consumen los componentes de facturación reutilizados (URLs reales):
  http.get(`${base}/sucursales/todas-activas`, () => HttpResponse.json([{ id: 1, nombre: 'Casa Matriz' }])),
  http.get(`${base}/catalogos/formas-pago`, () => HttpResponse.json([{ id: 1, valor: 'Efectivo' }])),
  // sic: typo del backend (condiciones-operacione sin 's')
  http.get(`${base}/catalogos/condiciones-operacione`, () => HttpResponse.json([{ id: 2, valor: 'Crédito' }, { id: 3, valor: 'Mixto' }])),
  http.get(`${base}/vendedores`, () => HttpResponse.json([])),
  http.get(`${base}/cajas`, () => HttpResponse.json([])),
  // catálogos adicionales que CuerpoDocumentoTable requiere:
  http.get(`${base}/catalogos/unidades-medida`, () => HttpResponse.json([{ id: 1, valor: 'Unidad' }])),
  http.get(`${base}/bodegas/sucursal/:id`, () => HttpResponse.json([])),
)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter>{children}</MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}

describe('CrearVentaCreditoPage', () => {
  it('monta el formulario de venta a crédito con el plan de cuotas', async () => {
    render(<CrearVentaCreditoPage />, { wrapper })
    await waitFor(() => expect(screen.getByText(/plan de cuotas/i)).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /crear venta a crédito/i })).toBeInTheDocument()
  })
})
