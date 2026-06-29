// src/features/inventario/components/CategoriasTab.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { ToastProvider } from '@/design-system'
import { inventarioHandlers } from '@/test/msw/inventario-handlers'
import { CategoriasTab } from './CategoriasTab'

const server = setupServer(...inventarioHandlers)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}><ToastProvider>{children}</ToastProvider></QueryClientProvider>
}

describe('CategoriasTab', () => {
  it('lista categorías y muestra el botón de nueva', async () => {
    render(<CategoriasTab />, { wrapper })
    await waitFor(() => expect(screen.getByText('General')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /nueva categor/i })).toBeInTheDocument()
  })
})
