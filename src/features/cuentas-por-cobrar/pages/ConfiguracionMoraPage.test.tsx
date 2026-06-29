// src/features/cuentas-por-cobrar/pages/ConfiguracionMoraPage.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { ToastProvider } from '@/design-system'
import { cuentasPorCobrarHandlers } from '@/test/msw/cuentas-por-cobrar-handlers'
import { ConfiguracionMoraPage } from './ConfiguracionMoraPage'

const server = setupServer(...cuentasPorCobrarHandlers)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}><ToastProvider>{children}</ToastProvider></QueryClientProvider>
}

describe('ConfiguracionMoraPage', () => {
  it('carga la config y permite guardar', async () => {
    render(<ConfiguracionMoraPage />, { wrapper })
    await waitFor(() => expect(screen.getByLabelText(/tasa de mora/i)).toHaveValue(2))
    fireEvent.change(screen.getByLabelText(/días de gracia/i), { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    await waitFor(() => expect(screen.getByText(/guardad/i)).toBeInTheDocument())
  })
})
