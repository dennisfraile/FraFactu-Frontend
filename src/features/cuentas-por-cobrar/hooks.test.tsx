import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { usePlanes, usePlan, usePagarCuota } from './hooks'

const base = 'http://localhost:8080/api'
const plan = { id: 1, condicionOperacion: 2, montoTotal: 100, montoPagado: 0, saldoAdeudado: 100, estadoCobro: 'Pendiente', cuotas: [] }
const server = setupServer(
  http.get(`${base}/cuentas-por-cobrar`, () => HttpResponse.json([plan])),
  http.get(`${base}/cuentas-por-cobrar/1`, () => HttpResponse.json(plan)),
  http.post(`${base}/cuentas-por-cobrar/1/cuotas/1/pagar`, () => HttpResponse.json({ ...plan, montoPagado: 50, saldoAdeudado: 50 })),
)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('hooks cxc', () => {
  it('usePlanes lista planes', async () => {
    const { result } = renderHook(() => usePlanes(true), { wrapper })
    await waitFor(() => expect(result.current.data?.[0].id).toBe(1))
  })
  it('usePlan trae el detalle', async () => {
    const { result } = renderHook(() => usePlan(1), { wrapper })
    await waitFor(() => expect(result.current.data?.id).toBe(1))
  })
  it('usePagarCuota muta', async () => {
    const { result } = renderHook(() => usePagarCuota(), { wrapper })
    const res = await result.current.mutateAsync({ planId: 1, numero: 1, dto: { catFormaPagoId: 1 } })
    expect(res.saldoAdeudado).toBe(50)
  })
})
