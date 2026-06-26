// src/features/compras/pages/CompraFormPage.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '@/design-system'
import { CompraFormPage } from './CompraFormPage'
import { useAuthStore } from '@/app/auth-store'

function setup(initial = '/compras/nueva') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter initialEntries={[initial]}>
          <Routes>
            <Route path="/compras/nueva" element={<CompraFormPage />} />
            <Route path="/compras/:id" element={<div>Detalle</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

describe('CompraFormPage (alta)', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', status: 'authenticated', user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 2, rolNombre: 'Admin', emisorId: 5, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  })

  it('exige al menos una línea antes de guardar', async () => {
    const user = userEvent.setup()
    setup()
    await user.type(screen.getByLabelText(/número de factura/i), 'F-001')
    await user.click(screen.getByRole('button', { name: /guardar borrador/i }))
    expect(await screen.findByText(/al menos una línea/i)).toBeInTheDocument()
  }, 15000)
})
