// src/app/router.usuarios.test.tsx
import { describe, it, expect, beforeEach, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { setupServer } from 'msw/node'
import { ToastProvider } from '@/design-system'
import { AppRoutes } from './router'
import { authAs } from '@/test/auth'
import { usuariosHandlers } from '@/test/msw/usuarios-handlers'

const server = setupServer(...usuariosHandlers)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function setRol(rolNombre: string) {
  authAs(rolNombre, { rolId: 5, accesoTodasSucursales: true, sucursalIds: [2] })
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
    // La página se carga con React.lazy: en caché de transform fría supera el
    // timeout por defecto de findBy/Vitest; ampliamos ambos. Ver router.dashboard.test.
    expect(await screen.findByRole('heading', { name: 'Usuarios' }, { timeout: 15000 })).toBeInTheDocument()
  }, 20000)
  it('Cajero ve AccesoDenegado', async () => {
    setRol('Cajero')
    setup('/config/usuarios')
    expect(await screen.findByRole('heading', { name: /acceso denegado/i })).toBeInTheDocument()
  })
})
