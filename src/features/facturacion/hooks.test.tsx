// src/features/facturacion/hooks.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'

// Mockeamos la capa de API para aislar la lógica de los hooks (invalidaciones de
// caché y gating por `enabled`), sin depender de la red ni de handlers MSW.
vi.mock('./api', () => ({
  facturacionApi: {
    guardarPendiente: vi.fn().mockResolvedValue({ id: 10 }),
    anular: vi.fn().mockResolvedValue({ ok: true }),
  },
}))
vi.mock('./catalogos-api', () => ({
  receptoresApi: { crear: vi.fn().mockResolvedValue({ id: 7 }) },
}))

import { useEmitirFactura, useAnularFactura, useCrearReceptor, useCajas } from './hooks'
import type { CreateFacturaDto, AnularFacturaDto, CrearReceptorDto } from './types'

function ctx() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const invalidate = vi.spyOn(qc, 'invalidateQueries')
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, invalidate, wrapper }
}

describe('hooks de facturación', () => {
  it('useEmitirFactura invalida la lista de facturas al tener éxito', async () => {
    const { invalidate, wrapper } = ctx()
    const { result } = renderHook(() => useEmitirFactura(), { wrapper })
    await result.current.mutateAsync({} as CreateFacturaDto)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['facturas'] })
  })

  it('useAnularFactura invalida la lista y el detalle de la factura anulada', async () => {
    const { invalidate, wrapper } = ctx()
    const { result } = renderHook(() => useAnularFactura(), { wrapper })
    await result.current.mutateAsync({ id: 42, dto: {} as AnularFacturaDto })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['facturas'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['factura', 42] })
  })

  it('useCrearReceptor invalida el listado de receptores', async () => {
    const { invalidate, wrapper } = ctx()
    const { result } = renderHook(() => useCrearReceptor(), { wrapper })
    await result.current.mutateAsync({} as CrearReceptorDto)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['receptores'] })
  })

  it('useCajas no dispara la consulta sin sucursal (enabled=false)', async () => {
    const { wrapper } = ctx()
    const { result } = renderHook(() => useCajas(undefined), { wrapper })
    // enabled:false → la query queda inactiva (fetchStatus idle) y nunca resuelve.
    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'))
    expect(result.current.isPending).toBe(true)
    expect(result.current.data).toBeUndefined()
  })
})
