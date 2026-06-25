// src/features/facturacion/pages/EmitirFacturaPage.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '@/design-system'
import { EmitirFacturaPage } from './EmitirFacturaPage'
import { useAuthStore } from '@/app/auth-store'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/facturacion/emitir']}>
        <ToastProvider>
          <Routes>
            <Route path="/facturacion/emitir" element={<EmitirFacturaPage />} />
            <Route path="/facturacion/:id" element={<div>Detalle DTE</div>} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('EmitirFacturaPage', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', status: 'authenticated',
      user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 2, rolNombre: 'Admin', emisorId: 5, emisorNombre: 'Mi Empresa', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] },
    })
  })

  it('captura un ítem, revisa la vista previa y emite navegando al detalle', async () => {
    setup()
    // Agregar ítem manual
    await userEvent.click(await screen.findByRole('button', { name: /agregar ítem/i }))
    await userEvent.type(screen.getByLabelText(/descripción/i), 'Producto A')
    await userEvent.clear(screen.getByLabelText(/cantidad/i)); await userEvent.type(screen.getByLabelText(/cantidad/i), '2')
    await userEvent.clear(screen.getByLabelText(/precio/i)); await userEvent.type(screen.getByLabelText(/precio/i), '56.5')
    // Pago que cuadra (113)
    await userEvent.clear(screen.getByLabelText(/monto/i)); await userEvent.type(screen.getByLabelText(/monto/i), '113')
    // Ir a vista previa
    await userEvent.click(screen.getByRole('button', { name: /revisar y emitir/i }))
    expect(await screen.findByText(/CIENTO TRECE/i)).toBeInTheDocument()
    // Emitir
    await userEvent.click(screen.getByRole('button', { name: /emitir dte/i }))
    expect(await screen.findByText('Detalle DTE')).toBeInTheDocument()
  })
})
