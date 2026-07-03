import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProveedorPicker } from './ProveedorPicker'
import { authAs } from '@/test/auth'
import type { ProveedorDto } from '../types'

function wrap(onSelect: (p: ProveedorDto) => void) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><ProveedorPicker onSelect={onSelect} /></QueryClientProvider>)
}

describe('ProveedorPicker', () => {
  beforeEach(() => {
    authAs('Admin', { rolId: 2, emisorId: 5, accesoTodasSucursales: true })
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
