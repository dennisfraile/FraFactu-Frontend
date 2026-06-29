// src/features/inventario/components/MovimientosTab.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { inventarioHandlers, movimientoEjemplo, kardexEjemplo } from '@/test/msw/inventario-handlers'
import { MovimientosTab } from './MovimientosTab'

const server = setupServer(...inventarioHandlers)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('MovimientosTab', () => {
  it('lista movimientos', async () => {
    render(<MovimientosTab />, { wrapper })
    await waitFor(() => expect(screen.getByText('COMPRA_EXTERNA')).toBeInTheDocument())
  })
  it('abre el kardex de un producto', async () => {
    render(<MovimientosTab />, { wrapper })
    await waitFor(() => screen.getByText('COMPRA_EXTERNA'))
    fireEvent.click(screen.getAllByRole('button', { name: /kardex/i })[0])
    await waitFor(() => expect(screen.getByText(/saldo final/i)).toBeInTheDocument())
  })
  it('envía desde con T00:00:00Z y hasta con T23:59:59Z al backend', async () => {
    const capturedUrls: string[] = []
    server.use(
      http.get('http://localhost:8080/api/inventarioreportes/movimientos', ({ request }) => {
        capturedUrls.push(request.url)
        return HttpResponse.json({ items: [movimientoEjemplo], totalItems: 1, pageNumber: 1, pageSize: 50, totalPages: 1 })
      }),
      http.get('http://localhost:8080/api/inventarioreportes/kardex/:id', ({ request }) => {
        capturedUrls.push(request.url)
        return HttpResponse.json(kardexEjemplo)
      }),
    )
    render(<MovimientosTab />, { wrapper })
    // Wait for the movimientos request to fire
    await waitFor(() => expect(capturedUrls.some(u => u.includes('movimientos'))).toBe(true))
    const movUrl = capturedUrls.find(u => u.includes('movimientos'))!
    // axios does not percent-encode colons in query params — check literal form
    expect(decodeURIComponent(movUrl)).toContain('T00:00:00Z')
    expect(decodeURIComponent(movUrl)).toContain('T23:59:59Z')
    // Also open kardex and verify it too
    await waitFor(() => screen.getByText('COMPRA_EXTERNA'))
    fireEvent.click(screen.getAllByRole('button', { name: /kardex/i })[0])
    await waitFor(() => expect(capturedUrls.some(u => u.includes('kardex'))).toBe(true))
    const kardexUrl = capturedUrls.find(u => u.includes('kardex'))!
    expect(decodeURIComponent(kardexUrl)).toContain('T00:00:00Z')
    expect(decodeURIComponent(kardexUrl)).toContain('T23:59:59Z')
  })
})
