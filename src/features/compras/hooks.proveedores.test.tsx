// src/features/compras/hooks.proveedores.test.tsx
import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { useProveedores, useCrearProveedor } from './hooks'

function wrap() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('hooks de proveedores', () => {
  it('useProveedores devuelve la página del backend', async () => {
    const { result } = renderHook(() => useProveedores({ pagina: 1, tamanoPagina: 20 }), { wrapper: wrap() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.totalItems).toBe(1)
    expect(result.current.data!.items[0].nombre).toBe('Distribuidora El Sol')
  })

  it('useCrearProveedor crea y devuelve el proveedor', async () => {
    const { result } = renderHook(() => useCrearProveedor(), { wrapper: wrap() })
    const creado = await result.current.mutateAsync({ nit: '06140101011011', nombre: 'Nuevo Prov' })
    expect(creado.id).toBe(99)
    expect(creado.nombre).toBe('Nuevo Prov')
  })
})
