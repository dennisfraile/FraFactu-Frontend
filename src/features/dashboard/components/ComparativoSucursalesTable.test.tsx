import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { dashboardHandlers } from '@/test/msw/dashboard-handlers'
import { ComparativoSucursalesTable } from './ComparativoSucursalesTable'

const server = setupServer(...dashboardHandlers)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('ComparativoSucursalesTable', () => {
  it('lista sucursales', async () => {
    render(<ComparativoSucursalesTable params={{ fechaInicio: 'a', fechaFin: 'b' }} />, { wrapper })
    await waitFor(() => expect(screen.getByText('Casa Matriz')).toBeInTheDocument())
  })
})
