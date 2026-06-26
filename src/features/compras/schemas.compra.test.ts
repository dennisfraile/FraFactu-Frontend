// src/features/compras/schemas.compra.test.ts
import { describe, it, expect } from 'vitest'
import { compraSchema } from './schemas'
import { nuevaLineaProducto, nuevaLineaGasto, type CompraFormValues } from './mappers'

const valido: CompraFormValues = {
  proveedorId: 1, sucursalId: 1, numeroFactura: 'F-001', fechaEmision: '2026-06-20', observaciones: '',
  productos: [{ ...nuevaLineaProducto(), productoId: 3, descripcion: 'A', bodegaId: 1, cantidad: 2, costoUnitario: 50 }],
  gastos: [],
}

describe('compraSchema', () => {
  it('acepta una compra válida con 1 producto', () => {
    expect(compraSchema.safeParse(valido).success).toBe(true)
  })
  it('rechaza sin proveedor', () => {
    expect(compraSchema.safeParse({ ...valido, proveedorId: null }).success).toBe(false)
  })
  it('rechaza número de factura vacío', () => {
    expect(compraSchema.safeParse({ ...valido, numeroFactura: '' }).success).toBe(false)
  })
  it('rechaza sin ninguna línea (ni producto ni gasto)', () => {
    expect(compraSchema.safeParse({ ...valido, productos: [], gastos: [] }).success).toBe(false)
  })
  it('rechaza producto de inventario sin bodega', () => {
    expect(compraSchema.safeParse({ ...valido, productos: [{ ...valido.productos[0], bodegaId: null }] }).success).toBe(false)
  })
  it('acepta solo gastos (sin productos)', () => {
    expect(compraSchema.safeParse({ ...valido, productos: [], gastos: [{ ...nuevaLineaGasto(), descripcion: 'Flete', monto: 20 }] }).success).toBe(true)
  })
})
