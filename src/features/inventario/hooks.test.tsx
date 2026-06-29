import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { useProductos, useCategorias, useAjustarStock } from './hooks'

const base = 'http://localhost:8080/api'
const server = setupServer(
  http.get(`${base}/productosservicios`, () => HttpResponse.json({ items: [{ id: 1, codigo: 'P001', nombre: 'X', precioVenta: 1, activo: true, unidadMedida: 'Unidad', tipoItem: 'Bienes', tipoImpuesto: 1, precioIncluyeIva: true, costoIncluyeIva: false, fechaCreacion: 'x', accesoTodasSucursales: true, tipoInventario: 0, tributosAdicionales: [] }], totalCount: 1, pageNumber: 1, pageSize: 20, totalPages: 1 })),
  http.get(`${base}/categorias`, () => HttpResponse.json([])),
  http.post(`${base}/inventario/ajustes`, () => HttpResponse.json({ ok: true })),
)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('hooks inventario', () => {
  it('useProductos lista', async () => {
    const { result } = renderHook(() => useProductos({ pageNumber: 1, pageSize: 20 }), { wrapper })
    await waitFor(() => expect(result.current.data?.items[0].codigo).toBe('P001'))
  })
  it('useCategorias', async () => {
    const { result } = renderHook(() => useCategorias(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
  it('useAjustarStock muta', async () => {
    const { result } = renderHook(() => useAjustarStock(), { wrapper })
    await result.current.mutateAsync({ productoId: 1, bodegaId: 1, cantidad: -1, motivo: 'MERMA', observaciones: 'rotura en bodega' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
