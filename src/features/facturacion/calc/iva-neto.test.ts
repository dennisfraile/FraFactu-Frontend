import { describe, it, expect } from 'vitest'
import { calcItemIvaNeto, calcResumenIvaNeto } from './iva-neto'

describe('calcItemIvaNeto (IVA neto)', () => {
  it('gravado: ventaGravada = base, ivaItem = base*0.13', () => {
    const r = calcItemIvaNeto({ cantidad: 2, precioUni: 50, tipoImpuesto: 1 })
    expect(r.ventaGravada).toBe(100)
    expect(r.ivaItem).toBe(13)
  })
  it('exento: sin IVA', () => {
    const r = calcItemIvaNeto({ cantidad: 1, precioUni: 80, tipoImpuesto: 2 })
    expect(r.ventaExenta).toBe(80)
    expect(r.ivaItem).toBe(0)
  })
})

describe('calcResumenIvaNeto', () => {
  it('suma gravada + IVA y arma montoTotalOperacion', () => {
    const items = [calcItemIvaNeto({ cantidad: 2, precioUni: 50, tipoImpuesto: 1 })]
    const r = calcResumenIvaNeto(items)
    expect(r.subTotal).toBe(100)
    expect(r.totalIva).toBe(13)
    expect(r.montoTotalOperacion).toBe(113)
    expect(r.totalPagar).toBe(113)
    expect(r.reteRenta).toBe(0)
  })
})
