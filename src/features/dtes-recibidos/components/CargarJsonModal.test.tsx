import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '@/design-system'
import { CargarJsonModal } from './CargarJsonModal'
import { authAs } from '@/test/auth'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><ToastProvider><CargarJsonModal onClose={() => {}} /></ToastProvider></QueryClientProvider>)
}

describe('CargarJsonModal', () => {
  beforeEach(() => {
    authAs('EmisorAdmin', { rolId: 2, emisorId: 5, accesoTodasSucursales: true })
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
