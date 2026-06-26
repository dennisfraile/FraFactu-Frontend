import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProveedorPicker } from './ProveedorPicker'
import { useAuthStore } from '@/app/auth-store'
import type { ProveedorDto } from '../types'

function wrap(onSelect: (p: ProveedorDto) => void) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><ProveedorPicker onSelect={onSelect} /></QueryClientProvider>)
}

describe('ProveedorPicker', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', status: 'authenticated', user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 2, rolNombre: 'Admin', emisorId: 5, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  })

  it('busca y selecciona un proveedor', async () => {
    const user = userEvent.setup()
    let sel: ProveedorDto | null = null
    wrap((p) => { sel = p })
    await user.type(screen.getByRole('combobox'), 'Sol')
    await user.click(await screen.findByText(/Distribuidora El Sol/i))
    expect(sel!.id).toBe(1)
  }, 15000)
})
