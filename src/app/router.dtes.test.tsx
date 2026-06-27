// src/app/router.dtes.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/design-system'
import { AppRoutes } from './router'
import { useAuthStore } from './auth-store'
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
    useAuthStore.setState({ token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', status: 'authenticated', user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 2, rolNombre: 'EmisorAdmin', emisorId: 5, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  })

  it('renderiza el listado en /dtes-recibidos', async () => {
    setup('/dtes-recibidos')
    expect(await screen.findByRole('heading', { name: /dtes recibidos/i })).toBeInTheDocument()
  })

  it('incluye el item de nav', () => {
    const items = navSections.flatMap((s) => s.items)
    expect(items.some((i) => i.to === '/dtes-recibidos')).toBe(true)
  })
})
