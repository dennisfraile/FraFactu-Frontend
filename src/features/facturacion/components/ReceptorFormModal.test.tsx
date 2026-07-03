import { describe, it, expect, beforeEach } from 'vitest'
import { type ReactElement } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReceptorFormModal } from './ReceptorFormModal'
import { authAs } from '@/test/auth'
import type { ReceptorListItem } from '../types'

function wrap(ui: ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('ReceptorFormModal (contribuyente)', () => {
  beforeEach(() => {
    authAs('Admin', { rolId: 2, emisorId: 5, accesoTodasSucursales: true })
  })

  it('valida campos requeridos y, completos, crea el receptor devolviéndolo', async () => {
    const user = userEvent.setup()
    let creado: ReceptorListItem | null = null
    wrap(<ReceptorFormModal policy="contribuyente" onCreated={(r) => { creado = r }} onClose={() => {}} />)

    // Sin datos → error de validación (empieza por el nombre).
    await user.click(screen.getByRole('button', { name: /guardar/i }))
    expect(await screen.findByText(/razón social requerida/i)).toBeInTheDocument()
    expect(creado).toBeNull()

    // Completa todos los campos obligatorios del contribuyente (valores de los handlers MSW).
    await user.type(screen.getByLabelText(/nombre o razón social/i), 'Empresa X S.A.')
    await user.type(screen.getByLabelText(/^nrc/i), '123-4')
    await user.selectOptions(screen.getByLabelText(/tipo de documento/i), '1') // NIT (id 1)
    await user.type(screen.getByLabelText(/número de documento/i), '0614-010101-001-1')
    await user.selectOptions(screen.getByLabelText(/actividad económica/i), '01111')
    await user.selectOptions(screen.getByLabelText(/^departamento/i), '1')
    await user.selectOptions(screen.getByLabelText(/^municipio/i), '10')
    await user.selectOptions(screen.getByLabelText(/^distrito/i), '100')
    await user.type(screen.getByLabelText(/dirección/i), 'Col. Centro, calle 1')

    await user.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => expect(creado).not.toBeNull()) // deja resolver la mutación
    expect(creado!.id).toBe(99)
    expect(creado!.nombreRazonSocial).toBe('Empresa X S.A.')
  }, 15000)
})
