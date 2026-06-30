import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { UsuarioFormModal } from './UsuarioFormModal'

const base = 'http://localhost:8080/api'
const server = setupServer(
  http.get(`${base}/roles`, () => HttpResponse.json([{ id: 5, nombre: 'EmisorAdmin' }, { id: 7, nombre: 'Cajero' }])),
  http.get(`${base}/cajas`, () => HttpResponse.json([{ id: 1, nombre: 'Caja 1', sucursalId: 2, codigo: 'C1' }])),
  http.get(`${base}/sucursales/todas-activas`, () => HttpResponse.json([{ id: 2, nombre: 'Casa Matriz' }])),
)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('UsuarioFormModal (crear)', () => {
  it('valida que el nombre es requerido', async () => {
    const onGuardarCrear = vi.fn()
    render(<UsuarioFormModal inicial={null} onGuardarCrear={onGuardarCrear} onGuardarEditar={() => {}} onClose={() => {}} cargando={false} />, { wrapper })
    await screen.findByText('Casa Matriz')
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }))
    expect(await screen.findByText(/nombre requerido/i)).toBeInTheDocument()
    expect(onGuardarCrear).not.toHaveBeenCalled()
  })

  it('crea en modo correo con datos válidos', async () => {
    const onGuardarCrear = vi.fn()
    render(<UsuarioFormModal inicial={null} onGuardarCrear={onGuardarCrear} onGuardarEditar={() => {}} onClose={() => {}} cargando={false} />, { wrapper })
    await screen.findByText('Casa Matriz')
    await userEvent.type(screen.getByLabelText(/nombre completo/i), 'Ana Pérez')
    await userEvent.type(screen.getByLabelText(/email/i), 'ana@x.com')
    await userEvent.selectOptions(screen.getByLabelText(/rol/i), '5')
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }))
    await waitFor(() => expect(onGuardarCrear).toHaveBeenCalledTimes(1))
    expect(onGuardarCrear.mock.calls[0][0]).toMatchObject({ nombreCompleto: 'Ana Pérez', email: 'ana@x.com', rolId: 5 })
    expect(onGuardarCrear.mock.calls[0][0].password).toBeUndefined()
  })
})
