import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { dashboardHandlers } from '@/test/msw/dashboard-handlers'

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>()
  return { ...actual, ResponsiveContainer: ({ children }: { children: ReactNode }) => <div style={{ width: 500, height: 300 }}>{children}</div> }
})

import { VentasPorCategoriaSection } from './VentasPorCategoriaSection'

const server = setupServer(...dashboardHandlers)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('VentasPorCategoriaSection', () => {
  it('muestra el chart y al pedir detalle carga la tabla paginada', async () => {
    render(<VentasPorCategoriaSection params={{ fechaInicio: 'a', fechaFin: 'b' }} />, { wrapper })
    await waitFor(() => expect(screen.getByText(/ventas por categoría/i)).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /ver detalle/i }))
    await waitFor(() => expect(screen.getByText('DTE-01-0001')).toBeInTheDocument())
  })
})
