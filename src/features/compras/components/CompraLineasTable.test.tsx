// src/features/compras/components/CompraLineasTable.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CompraLineasTable } from './CompraLineasTable'
import { authAs } from '@/test/auth'
import type { FormProductoLinea, FormGastoLinea } from '../mappers'

function Host() {
  const [productos, setProductos] = useState<FormProductoLinea[]>([])
  const [gastos, setGastos] = useState<FormGastoLinea[]>([])
  return <CompraLineasTable productos={productos} onProductos={setProductos} gastos={gastos} onGastos={setGastos} sucursalId={1} />
}

function wrap() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><Host /></QueryClientProvider>)
}

describe('CompraLineasTable', () => {
  beforeEach(() => {
    authAs('Admin', { rolId: 2, emisorId: 5, accesoTodasSucursales: true })
  })

  it('agrega una línea de producto y muestra su total calculado', async () => {
    const user = userEvent.setup()
    wrap()
    await user.click(screen.getByRole('button', { name: /agregar producto/i }))
    const cant = screen.getByLabelText(/cantidad/i)
    await user.clear(cant); await user.type(cant, '2')
    const costo = screen.getByLabelText(/costo/i)
    await user.clear(costo); await user.type(costo, '50')
    // total de línea = 100 + 13 IVA = 113
    expect(await screen.findByText(/113\.00/)).toBeInTheDocument()
  })

  it('cambia a la pestaña Gastos y agrega un gasto', async () => {
    const user = userEvent.setup()
    wrap()
    await user.click(screen.getByRole('tab', { name: /gastos/i }))
    await user.click(screen.getByRole('button', { name: /agregar gasto/i }))
    expect(screen.getByLabelText(/descripción del gasto/i)).toBeInTheDocument()
  })
})
