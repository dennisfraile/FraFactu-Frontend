import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { useUsuarios, useRoles } from './hooks'

const base = 'http://localhost:8080/api'
const server = setupServer(
  http.get(`${base}/usuarios`, () => HttpResponse.json({ items: [{ id: 1, nombreCompleto: 'Ana' }], currentPage: 1, totalPages: 1, pageSize: 10, totalCount: 1 })),
  http.get(`${base}/roles`, () => HttpResponse.json([{ id: 5, nombre: 'EmisorAdmin' }])),
)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('hooks usuarios', () => {
  it('useUsuarios carga la lista', async () => {
    const { result } = renderHook(() => useUsuarios({ pageNumber: 1, pageSize: 10 }), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.totalCount).toBe(1)
  })
  it('useRoles carga los roles', async () => {
    const { result } = renderHook(() => useRoles(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.[0].nombre).toBe('EmisorAdmin')
  })
})
