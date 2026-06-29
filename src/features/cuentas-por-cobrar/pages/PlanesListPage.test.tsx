// src/features/cuentas-por-cobrar/pages/PlanesListPage.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { cuentasPorCobrarHandlers } from '@/test/msw/cuentas-por-cobrar-handlers'
import { PlanesListPage } from './PlanesListPage'

const server = setupServer(...cuentasPorCobrarHandlers)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>
}

describe('PlanesListPage', () => {
  it('lista los planes con su cliente y estado', async () => {
    render(<PlanesListPage />, { wrapper })
    await waitFor(() => expect(screen.getByText('Cliente Demo')).toBeInTheDocument())
    expect(screen.getByText('Parcial')).toBeInTheDocument()
  })
  it('muestra el botón de nueva venta a crédito', async () => {
    render(<PlanesListPage />, { wrapper })
    expect(screen.getByRole('link', { name: /nueva venta a crédito/i })).toHaveAttribute('href', '/cuentas-por-cobrar/nueva')
  })
})
