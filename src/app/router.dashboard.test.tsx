import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { dashboardHandlers } from '@/test/msw/dashboard-handlers'
import { authAs } from '@/test/auth'
import { AppRoutes } from './router'

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>()
  return { ...actual, ResponsiveContainer: ({ children }: { children: ReactNode }) => <div style={{ width: 500, height: 300 }}>{children}</div> }
})

const server = setupServer(...dashboardHandlers)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())

describe('/dashboard', () => {
  it('renderiza el dashboard real (lazy) para un usuario autenticado', async () => {
    authAs('EmisorAdmin', { accesoTodasSucursales: true, sucursalIds: [2] })
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(<QueryClientProvider client={qc}><MemoryRouter initialEntries={['/dashboard']}><AppRoutes /></MemoryRouter></QueryClientProvider>)
    // La ruta usa React.lazy: el import dinámico de DashboardPage + recharts + el
    // fetch de KPIs. En una caché de transform FRÍA (CI, o el primer run tras editar
    // un archivo del chunk) esto supera los 5s por defecto de Vitest; ampliamos el
    // timeout del test y del waitFor. No ralentiza el caso que pasa: waitFor resuelve
    // en cuanto aparece el texto.
    await waitFor(() => expect(screen.getByText('Total ventas')).toBeInTheDocument(), { timeout: 15000 })
  }, 20000)
})
