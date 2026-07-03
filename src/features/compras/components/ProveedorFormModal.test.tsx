// src/features/compras/components/ProveedorFormModal.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { type ReactElement } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProveedorFormModal } from './ProveedorFormModal'
import { authAs } from '@/test/auth'
import type { ProveedorDto } from '../types'

function wrap(ui: ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('ProveedorFormModal', () => {
  beforeEach(() => {
    authAs('Admin', { rolId: 2, emisorId: 5, accesoTodasSucursales: true })
  })

  it('valida NIT y nombre, y al completar crea el proveedor', async () => {
    const user = userEvent.setup()
    let guardado: ProveedorDto | null = null
    wrap(<ProveedorFormModal onSaved={(p) => { guardado = p }} onClose={() => {}} />)

    // NIT inválido → error.
    await user.type(screen.getByLabelText(/^NIT/i), '0614')
    await user.type(screen.getByLabelText(/nombre o razón social/i), 'Distribuidora El Sol')
    await user.click(screen.getByRole('button', { name: /guardar/i }))
    expect(await screen.findByText(/14 dígitos/i)).toBeInTheDocument()
    expect(guardado).toBeNull()

    // Corrige el NIT.
    await user.clear(screen.getByLabelText(/^NIT/i))
    await user.type(screen.getByLabelText(/^NIT/i), '06140101011011')
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => expect(guardado).not.toBeNull())
    expect(guardado!.id).toBe(99)
    expect(guardado!.nombre).toBe('Distribuidora El Sol')
  }, 15000)
})
