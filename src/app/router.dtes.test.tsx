// src/app/router.dtes.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/design-system'
import { AppRoutes } from './router'
import { authAs } from '@/test/auth'
import { navSections } from './nav-config'

function setup(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

describe('rutas de DTEs recibidos', () => {
  beforeEach(() => {
    authAs('EmisorAdmin', { rolId: 2, emisorId: 5, accesoTodasSucursales: true })
  })

  it('renderiza el listado en /dtes-recibidos', async () => {
    setup('/dtes-recibidos')
    // Página cargada con React.lazy: ampliamos timeout por transform fría. Ver router.dashboard.test.
    expect(await screen.findByRole('heading', { name: /dtes recibidos/i }, { timeout: 15000 })).toBeInTheDocument()
  }, 20000)

  it('incluye el item de nav', () => {
    const items = navSections.flatMap((s) => s.items)
    expect(items.some((i) => i.to === '/dtes-recibidos')).toBe(true)
  })
})
