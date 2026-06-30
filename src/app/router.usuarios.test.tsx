// src/app/router.usuarios.test.tsx
import { describe, it, expect, beforeEach, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { setupServer } from 'msw/node'
import { ToastProvider } from '@/design-system'
import { AppRoutes } from './router'
import { useAuthStore } from './auth-store'
import { usuariosHandlers } from '@/test/msw/usuarios-handlers'

const server = setupServer(...usuariosHandlers)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function setRol(rolNombre: string) {
  useAuthStore.setState({ token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', status: 'authenticated', user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 5, rolNombre, emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [2], permisos: [] } })
}
function setup(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider><MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter></ToastProvider>
    </QueryClientProvider>,
  )
}

describe('ruta /config/usuarios', () => {
  beforeEach(() => setRol('EmisorAdmin'))
  it('EmisorAdmin monta la página de usuarios', async () => {
    setup('/config/usuarios')
    expect(await screen.findByRole('heading', { name: 'Usuarios' })).toBeInTheDocument()
  })
  it('Cajero ve AccesoDenegado', async () => {
    setRol('Cajero')
    setup('/config/usuarios')
    expect(await screen.findByRole('heading', { name: /acceso denegado/i })).toBeInTheDocument()
  })
})
