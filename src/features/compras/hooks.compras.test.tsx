// src/features/compras/hooks.compras.test.tsx
import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { useCompras, useConfirmarCompra } from './hooks'

function wrap() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('hooks de compras', () => {
  it('useCompras devuelve la página', async () => {
    const { result } = renderHook(() => useCompras({ pagina: 1, tamanoPagina: 20 }), { wrapper: wrap() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.items[0].numeroFactura).toBe('F-001')
  })
  it('useConfirmarCompra devuelve la compra confirmada', async () => {
    const { result } = renderHook(() => useConfirmarCompra(), { wrapper: wrap() })
    const c = await result.current.mutateAsync({ id: 50, dto: {} })
    expect(c.estado).toBe('CONFIRMADA')
  })
})
