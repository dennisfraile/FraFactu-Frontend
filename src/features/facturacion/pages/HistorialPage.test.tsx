// src/features/facturacion/pages/HistorialPage.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { HistorialPage } from './HistorialPage'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/facturacion/historial']}>
        <Routes>
          <Route path="/facturacion/historial" element={<HistorialPage />} />
          <Route path="/facturacion/:id" element={<div>Detalle</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('HistorialPage', () => {
  it('lista facturas del backend', async () => {
    setup()
    expect(await screen.findByText('DTE-01-00000000-000000000000001')).toBeInTheDocument()
    expect(screen.getByText('Consumidor Final')).toBeInTheDocument()
  })
})
