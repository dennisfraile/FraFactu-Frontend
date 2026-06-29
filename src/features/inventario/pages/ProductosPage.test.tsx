// src/features/inventario/pages/ProductosPage.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { ToastProvider } from '@/design-system'
import { inventarioHandlers } from '@/test/msw/inventario-handlers'
import { ProductosPage } from './ProductosPage'

const server = setupServer(...inventarioHandlers)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}><ToastProvider><MemoryRouter>{children}</MemoryRouter></ToastProvider></QueryClientProvider>
}

describe('ProductosPage', () => {
  it('lista productos en la pestaña Productos', async () => {
    render(<ProductosPage />, { wrapper })
    await waitFor(() => expect(screen.getByText('Producto de prueba')).toBeInTheDocument())
  })
  it('cambia a la pestaña Categorías', async () => {
    render(<ProductosPage />, { wrapper })
    fireEvent.click(screen.getByRole('tab', { name: /categor/i }))
    await waitFor(() => expect(screen.getByText('General')).toBeInTheDocument())
  })
})
