import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '@/design-system'
import { CargarJsonModal } from './CargarJsonModal'
import { useAuthStore } from '@/app/auth-store'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><ToastProvider><CargarJsonModal onClose={() => {}} /></ToastProvider></QueryClientProvider>)
}

describe('CargarJsonModal', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', status: 'authenticated', user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 2, rolNombre: 'EmisorAdmin', emisorId: 5, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  })

  it('sube un archivo y muestra el resumen', async () => {
    const user = userEvent.setup()
    setup()
    const file = new File(['{"a":1}'], 'ccf.json', { type: 'application/json' })
    await user.upload(screen.getByLabelText(/archivos/i), file)
    await user.click(screen.getByRole('button', { name: /cargar/i }))
    expect(await screen.findByText(/cargados: 1/i)).toBeInTheDocument()
  })
})
