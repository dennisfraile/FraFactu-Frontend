// src/features/dtes-recibidos/components/LeerCorreoModal.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LeerCorreoModal } from './LeerCorreoModal'
import { useAuthStore } from '@/app/auth-store'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><LeerCorreoModal onClose={() => {}} /></QueryClientProvider>)
}

describe('LeerCorreoModal', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', status: 'authenticated', user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 2, rolNombre: 'EmisorAdmin', emisorId: 5, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  })

  it('encola la lectura y muestra el progreso del job', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /iniciar lectura/i }))
    // El handler MSW devuelve un job COMPLETADO con 2 nuevos.
    expect(await screen.findByText(/nuevos/i)).toBeInTheDocument()
    expect(await screen.findByText(/completado/i)).toBeInTheDocument()
  })

  it('valida que se indiquen ambos meses o ninguno', async () => {
    const user = userEvent.setup()
    setup()
    await user.type(screen.getByLabelText(/mes inicio/i), '2026-01')
    await user.click(screen.getByRole('button', { name: /iniciar lectura/i }))
    expect(await screen.findByText(/ambos meses o ninguno/i)).toBeInTheDocument()
  })
})
