// src/features/inventario/pages/ReportesInventarioPage.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { inventarioHandlers } from '@/test/msw/inventario-handlers'
import { ReportesInventarioPage } from './ReportesInventarioPage'

const server = setupServer(...inventarioHandlers)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('ReportesInventarioPage', () => {
  it('muestra las tarjetas de KPIs', async () => {
    render(<ReportesInventarioPage />, { wrapper })
    await waitFor(() => expect(screen.getByText(/valor total/i)).toBeInTheDocument())
  })
})
