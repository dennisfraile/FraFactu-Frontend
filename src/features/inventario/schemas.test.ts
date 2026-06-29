import { describe, it, expect } from 'vitest'
import { productoSchema, ajusteSchema } from './schemas'

describe('productoSchema', () => {
  it('exige código y nombre y precio >= 0', () => {
    const bad = productoSchema.safeParse({ codigo: '', nombre: '', precioVenta: -1, catUnidadMedidaId: 0, catTipoItemId: 0, tipoImpuesto: 1, precioIncluyeIva: false, costoIncluyeIva: false, tipoInventario: 0, accesoTodasSucursales: true })
    expect(bad.success).toBe(false)
  })
  it('acepta un producto válido', () => {
    const ok = productoSchema.safeParse({ codigo: 'P002', nombre: 'Tornillo', precioVenta: 1.5, catUnidadMedidaId: 39, catTipoItemId: 1, tipoImpuesto: 1, precioIncluyeIva: false, costoIncluyeIva: false, tipoInventario: 0, accesoTodasSucursales: true })
    expect(ok.success).toBe(true)
  })
})

describe('ajusteSchema', () => {
  it('observaciones >= 10 chars', () => {
    expect(ajusteSchema.safeParse({ productoId: 1, bodegaId: 1, cantidad: -2, motivo: 'MERMA', observaciones: 'corto' }).success).toBe(false)
    expect(ajusteSchema.safeParse({ productoId: 1, bodegaId: 1, cantidad: -2, motivo: 'MERMA', observaciones: 'rotura en bodega' }).success).toBe(true)
  })
})
