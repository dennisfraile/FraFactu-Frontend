// src/features/inventario/components/MovimientosTab.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { inventarioHandlers } from '@/test/msw/inventario-handlers'
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
})
