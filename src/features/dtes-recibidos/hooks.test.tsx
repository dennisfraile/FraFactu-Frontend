// src/features/dtes-recibidos/hooks.test.tsx
import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useDtesRecibidos, useEstadisticasDtes } from './hooks'

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('hooks de DTEs recibidos', () => {
  it('useDtesRecibidos trae el listado paginado', async () => {
    const { result } = renderHook(() => useDtesRecibidos({ pagina: 1, tamanoPagina: 20 }), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items[0].codigoGeneracion).toBe('GUID-1')
    expect(result.current.data?.total).toBe(1)
  })

  it('useEstadisticasDtes trae los totales', async () => {
    const { result } = renderHook(() => useEstadisticasDtes({}), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.totalPendientes).toBe(1)
  })
})
