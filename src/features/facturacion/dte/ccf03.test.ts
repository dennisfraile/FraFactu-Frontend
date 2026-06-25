import { describe, it, expect } from 'vitest'
import { ccfStrategy, calcItemCcf03, calcResumenCcf03 } from './ccf03'

describe('calcItemCcf03 (IVA neto)', () => {
  it('ítem gravado: IVA directo (13% sobre la base sin IVA)', () => {
    const r = calcItemCcf03({ cantidad: 2, precioUni: 50, tipoImpuesto: 1 })
    expect(r.ventaGravada).toBe(100)
    expect(r.ivaItem).toBe(13) // 100 * 0.13
  })
  it('aplica descuento de línea antes del IVA', () => {
    const r = calcItemCcf03({ cantidad: 1, precioUni: 100, montoDescuento: 20, tipoImpuesto: 1 })
    expect(r.ventaGravada).toBe(80)
    expect(r.ivaItem).toBe(10.4) // 80 * 0.13
  })
  it('ítem exento: sin IVA', () => {
    const r = calcItemCcf03({ cantidad: 3, precioUni: 10, tipoImpuesto: 2 })
    expect(r.ventaExenta).toBe(30)
    expect(r.ivaItem).toBe(0)
  })
})

describe('calcResumenCcf03', () => {
  it('suma IVA neto: total = subtotal + IVA', () => {
    const items = [calcItemCcf03({ cantidad: 2, precioUni: 50, tipoImpuesto: 1 })]
    const r = calcResumenCcf03(items)
    expect(r.totalGravada).toBe(100)
    expect(r.totalIva).toBe(13)
    expect(r.subTotal).toBe(100)
    expect(r.montoTotalOperacion).toBe(113)
    expect(r.totalPagar).toBe(113)
    expect(r.reteRenta).toBe(0)
  })
})

describe('ccfStrategy (03) metadatos', () => {
  it('version 4, caja requerida, receptor contribuyente, descuenta stock', () => {
    expect(ccfStrategy.tipoDte).toBe('03')
    expect(ccfStrategy.version).toBe(4)
    expect(ccfStrategy.requiereCaja).toBe(true)
    expect(ccfStrategy.descuentaStock).toBe(true)
    expect(ccfStrategy.receptorPolicy).toBe('contribuyente')
    expect(ccfStrategy.precioIncluyeIva).toBe(false)
  })
  it('buildItemDto manda precioIncluyeIva=false', () => {
    const item = { descripcion: 'A', cantidad: 2, precioUni: 50, uniMedida: 39, tipoItem: 1, tipoImpuesto: 1 as const, bodegaId: 2 }
    const dto = ccfStrategy.buildItemDto(item, ccfStrategy.calcItem(item), 1)
    expect(dto.precioIncluyeIva).toBe(false)
    expect(dto.ventaGravada).toBe(100)
    expect(dto.ivaItem).toBe(13)
  })
  it('buildResumenDto incluye montoTotalOperacion y reteRenta=0', () => {
    const calc = [ccfStrategy.calcItem({ cantidad: 2, precioUni: 50, tipoImpuesto: 1 })]
    const res = ccfStrategy.calcResumen(calc)
    const dto = ccfStrategy.buildResumenDto(res, { sucursalId: 1, cajaId: 1, esConsumidorFinal: false, condicionOperacion: 1, receptorId: 7, items: [], pagos: [{ catFormaPagoId: 1, monto: 113 }] })
    expect(dto.montoTotalOperacion).toBe(113)
    expect(dto.totalIva).toBe(13)
    expect(dto.reteRenta).toBe(0)
    expect(dto.totalPagar).toBe(113)
  })
})
