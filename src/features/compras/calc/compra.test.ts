import { describe, it, expect } from 'vitest'
import { round2, calcLineaProducto, calcTotalesCompra } from './compra'

describe('calc de compra', () => {
  it('round2 redondea a 2 decimales', () => {
    expect(round2(1.005)).toBe(1.01)
    expect(round2(100 * 0.13)).toBe(13)
  })

  it('línea producto con IVA 13% automático', () => {
    expect(calcLineaProducto({ cantidad: 2, costoUnitario: 50, aplicaIva: true })).toEqual({ subtotal: 100, iva: 13, total: 113 })
  })

  it('línea producto sin IVA cuando no aplica', () => {
    expect(calcLineaProducto({ cantidad: 3, costoUnitario: 10, aplicaIva: false })).toEqual({ subtotal: 30, iva: 0, total: 30 })
  })

  it('línea producto respeta IVA manual', () => {
    expect(calcLineaProducto({ cantidad: 1, costoUnitario: 100, aplicaIva: true, ivaManual: 5 })).toEqual({ subtotal: 100, iva: 5, total: 105 })
  })

  it('línea producto con ivaManual: 0 honra el cero explícito (sin calcular 13%)', () => {
    expect(calcLineaProducto({ cantidad: 1, costoUnitario: 100, aplicaIva: true, ivaManual: 0 })).toEqual({ subtotal: 100, iva: 0, total: 100 })
  })

  it('totales del header: gastos suman al subtotal sin IVA', () => {
    const p = [calcLineaProducto({ cantidad: 2, costoUnitario: 50, aplicaIva: true })] // sub 100, iva 13
    const totales = calcTotalesCompra(p, [{ monto: 20 }]) // gasto 20
    // subtotal = 100 + 20 = 120 ; iva = 13 ; total = 133
    expect(totales).toEqual({ subtotal: 120, iva: 13, total: 133 })
    // invariante backend: Σdetalle.total + Σgasto.monto == total
    expect(p[0].total + 20).toBe(totales.total)
  })

  it('compra solo de gastos: IVA 0', () => {
    expect(calcTotalesCompra([], [{ monto: 40 }, { monto: 10 }])).toEqual({ subtotal: 50, iva: 0, total: 50 })
  })
})
