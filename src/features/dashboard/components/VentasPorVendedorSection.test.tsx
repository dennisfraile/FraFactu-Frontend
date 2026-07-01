import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { dashboardHandlers } from '@/test/msw/dashboard-handlers'
import { VentasPorVendedorSection } from './VentasPorVendedorSection'

const server = setupServer(...dashboardHandlers)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('VentasPorVendedorSection', () => {
  it('lista vendedores y al pedir detalle carga la tabla', async () => {
    render(<VentasPorVendedorSection params={{ fechaInicio: 'a', fechaFin: 'b' }} />, { wrapper })
    await waitFor(() => expect(screen.getByText('Ana Vendedora')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /ver detalle/i }))
    await waitFor(() => expect(screen.getByText('DTE-01-0001')).toBeInTheDocument())
  })
})
