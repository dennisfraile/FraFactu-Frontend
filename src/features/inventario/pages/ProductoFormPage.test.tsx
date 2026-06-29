// src/features/inventario/pages/ProductoFormPage.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { ToastProvider } from '@/design-system'
import { inventarioHandlers } from '@/test/msw/inventario-handlers'
import { ProductoFormPage } from './ProductoFormPage'

const base = 'http://localhost:8080/api'
const server = setupServer(
  ...inventarioHandlers,
  http.get(`${base}/catalogos/unidades-medida`, () => HttpResponse.json([{ id: 39, valor: 'Unidad' }])),
  http.get(`${base}/catalogos/tipos-items`, () => HttpResponse.json([{ id: 1, valor: 'Bienes' }, { id: 2, valor: 'Servicios' }])),
  http.get(`${base}/sucursales/todas-activas`, () => HttpResponse.json([{ id: 2, nombre: 'Casa Matriz' }])),
)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())

function renderEn(ruta: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}><ToastProvider>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/inventario/productos/nuevo" element={<ProductoFormPage />} />
          <Route path="/inventario/productos/:id/editar" element={<ProductoFormPage />} />
          <Route path="/inventario/productos" element={<div>listado</div>} />
        </Routes>
      </MemoryRouter>
    </ToastProvider></QueryClientProvider>,
  )
}

describe('ProductoFormPage', () => {
  it('monta en modo nuevo', async () => {
    renderEn('/inventario/productos/nuevo')
    await waitFor(() => expect(screen.getByText(/nuevo producto/i)).toBeInTheDocument())
    expect(screen.getByLabelText('Código')).toHaveValue('')
  })
  it('precarga en modo edición', async () => {
    renderEn('/inventario/productos/2/editar')
    await waitFor(() => expect(screen.getByLabelText('Código')).toHaveValue('P001'))
  })
  it('muestra campos de activo fijo al elegir Mobiliario y Equipo', async () => {
    renderEn('/inventario/productos/nuevo')
    await waitFor(() => screen.getByLabelText(/tipo de inventario/i))
    fireEvent.change(screen.getByLabelText(/tipo de inventario/i), { target: { value: '1' } })
    expect(screen.getByLabelText(/años de vida útil/i)).toBeInTheDocument()
  })
})
