import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { dashboardHandlers } from '@/test/msw/dashboard-handlers'
import { authAs } from '@/test/auth'
import { DashboardPage } from './DashboardPage'

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>()
  return { ...actual, ResponsiveContainer: ({ children }: { children: ReactNode }) => <div style={{ width: 500, height: 300 }}>{children}</div> }
})

const server = setupServer(...dashboardHandlers)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><DashboardPage /></QueryClientProvider>)
}
function auth(rolNombre: string, accesoTodasSucursales = false) {
  authAs(rolNombre, { accesoTodasSucursales, sucursalIds: [2] })
}

describe('DashboardPage — curación por rol', () => {
  it('EmisorAdmin (todas sucursales) ve KPIs, selector de sucursal y comparativo', async () => {
    auth('EmisorAdmin', true)
    setup()
    await waitFor(() => expect(screen.getByText('Total ventas')).toBeInTheDocument())
    expect(screen.getByLabelText('Sucursal')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText(/comparativo de sucursales/i)).toBeInTheDocument())
  })
  it('Auditor (scope) ve KPIs pero NO selector de sucursal ni comparativo', async () => {
    auth('Auditor', false)
    setup()
    await waitFor(() => expect(screen.getByText('Total ventas')).toBeInTheDocument())
    expect(screen.queryByLabelText('Sucursal')).toBeNull()
    expect(screen.queryByText(/comparativo de sucursales/i)).toBeNull()
  })
  it('Cajero ve su sección personal y NO las gerenciales', async () => {
    auth('Cajero', false)
    setup()
    await waitFor(() => expect(screen.getByText('Mis ventas')).toBeInTheDocument())
    expect(screen.queryByText('Total ventas')).toBeNull()
  })
})
