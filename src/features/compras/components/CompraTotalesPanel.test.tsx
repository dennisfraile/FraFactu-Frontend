import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CompraTotalesPanel } from './CompraTotalesPanel'
import { nuevaLineaProducto, nuevaLineaGasto } from '../mappers'

describe('CompraTotalesPanel', () => {
  it('muestra subtotal, IVA y total computados', () => {
    const productos = [{ ...nuevaLineaProducto(), productoId: 3, descripcion: 'A', bodegaId: 1, cantidad: 2, costoUnitario: 50 }]
    const gastos = [{ ...nuevaLineaGasto(), descripcion: 'Flete', monto: 20 }]
    render(<CompraTotalesPanel productos={productos} gastos={gastos} />)
    // subtotal 120, iva 13, total 133
    expect(screen.getByText('$120.00')).toBeInTheDocument()
    expect(screen.getByText('$13.00')).toBeInTheDocument()
    expect(screen.getByText('$133.00')).toBeInTheDocument()
  })
})
