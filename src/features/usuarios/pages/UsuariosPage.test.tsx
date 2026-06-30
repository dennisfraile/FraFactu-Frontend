// src/features/usuarios/pages/UsuariosPage.test.tsx
import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { ToastProvider } from '@/design-system'
import { UsuariosPage } from './UsuariosPage'
import { useAuthStore } from '@/app/auth-store'
import { usuariosHandlers } from '@/test/msw/usuarios-handlers'

const server = setupServer(...usuariosHandlers)
beforeEach(() => {
  useAuthStore.setState({ token: 't', status: 'authenticated', user: { userId: 1, nombreCompleto: 'X', email: 'x@x.com', rolId: 5, rolNombre: 'EmisorAdmin', emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [2], permisos: [] } })
})
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider><UsuariosPage /></ToastProvider>
    </QueryClientProvider>,
  )
}

describe('UsuariosPage', () => {
  it('lista usuarios y muestra el botón Nuevo para EmisorAdmin', async () => {
    setup()
    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /nuevo usuario/i })).toBeInTheDocument()
  })
  it('Auditor no ve el botón Nuevo', async () => {
    useAuthStore.setState({ token: 't', status: 'authenticated', user: { userId: 1, nombreCompleto: 'X', email: 'x@x.com', rolId: 8, rolNombre: 'Auditor', emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [2], permisos: [] } })
    setup()
    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /nuevo usuario/i })).toBeNull()
  })
})
