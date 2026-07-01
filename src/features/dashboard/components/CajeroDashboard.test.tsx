import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { dashboardHandlers } from '@/test/msw/dashboard-handlers'

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>()
  return { ...actual, ResponsiveContainer: ({ children }: { children: ReactNode }) => <div style={{ width: 500, height: 300 }}>{children}</div> }
})

import { CajeroDashboard } from './CajeroDashboard'

const server = setupServer(...dashboardHandlers)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('CajeroDashboard', () => {
  it('muestra los KPIs personales del cajero', async () => {
    render(<CajeroDashboard params={{ fechaInicio: 'a', fechaFin: 'b' }} />, { wrapper })
    await waitFor(() => expect(screen.getByText('Mis ventas')).toBeInTheDocument())
  })
})
