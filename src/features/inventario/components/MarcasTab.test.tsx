import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { ToastProvider } from '@/design-system'
import { inventarioHandlers } from '@/test/msw/inventario-handlers'
import { authAs } from '@/test/auth'
import { MarcasTab } from './MarcasTab'

const server = setupServer(...inventarioHandlers)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><ToastProvider><MarcasTab /></ToastProvider></QueryClientProvider>)
}
function auth(rolNombre: string) {
  authAs(rolNombre, { accesoTodasSucursales: true })
}
describe('MarcasTab gating', () => {
  beforeEach(() => auth('EmisorAdmin'))
  it('EmisorAdmin ve "Nueva marca"', () => { setup(); expect(screen.getByRole('button', { name: /nueva marca/i })).toBeInTheDocument() })
  it('Cajero no ve "Nueva marca"', () => { auth('Cajero'); setup(); expect(screen.queryByRole('button', { name: /nueva marca/i })).toBeNull() })
})
