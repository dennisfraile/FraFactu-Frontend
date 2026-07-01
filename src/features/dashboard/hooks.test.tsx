import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { dashboardHandlers } from '@/test/msw/dashboard-handlers'
import { useKpis, useComparativoSucursales } from './hooks'

const server = setupServer(...dashboardHandlers)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('dashboard hooks', () => {
  it('useKpis trae las métricas', async () => {
    const { result } = renderHook(() => useKpis({ fechaInicio: 'a', fechaFin: 'b' }), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.totalVentas).toBe(45000)
  })
  it('useComparativoSucursales no dispara si enabled=false', async () => {
    const { result } = renderHook(() => useComparativoSucursales({ fechaInicio: 'a', fechaFin: 'b', page: 1, pageSize: 50 }, false), { wrapper })
    expect(result.current.fetchStatus).toBe('idle')
  })
})
