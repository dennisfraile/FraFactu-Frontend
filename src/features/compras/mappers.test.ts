import { describe, it, expect } from 'vitest'
import { buildCrearCompraDto, nuevaLineaProducto, nuevaLineaGasto, type CompraFormValues } from './mappers'

const base: CompraFormValues = {
  proveedorId: 1, sucursalId: 1, numeroFactura: 'F-001', fechaEmision: '2026-06-20', observaciones: '',
  productos: [{ ...nuevaLineaProducto(), productoId: 3, descripcion: 'Producto A', bodegaId: 1, cantidad: 2, costoUnitario: 50, ivaManual: undefined, aplicaIva: true, esParaInventario: true }],
  gastos: [{ ...nuevaLineaGasto(), descripcion: 'Flete', monto: 20 }],
}

describe('buildCrearCompraDto', () => {
  it('arma el DTO con detalles, gastos y totales cuadrados', () => {
    const dto = buildCrearCompraDto(base)
    expect(dto.proveedorId).toBe(1)
    expect(dto.detalles).toHaveLength(1)
    expect(dto.detalles[0]).toMatchObject({ productoId: 3, bodegaId: 1, cantidad: 2, costoUnitario: 50, subtotal: 100, iva: 13, total: 113, esParaInventario: true })
    expect(dto.gastos[0]).toMatchObject({ descripcion: 'Flete', monto: 20 })
    expect(dto).toMatchObject({ subtotal: 120, iva: 13, total: 133 })
    // invariante backend
    const sumaLineas = dto.detalles.reduce((s, d) => s + d.total, 0) + dto.gastos.reduce((s, g) => s + g.monto, 0)
    expect(sumaLineas).toBe(dto.total)
  })

  it('omite bodegaId cuando el detalle no es para inventario', () => {
    const v: CompraFormValues = { ...base, productos: [{ ...base.productos[0], esParaInventario: false, bodegaId: null }] }
    const dto = buildCrearCompraDto(v)
    expect(dto.detalles[0].bodegaId).toBeNull()
    expect(dto.detalles[0].esParaInventario).toBe(false)
  })
})
