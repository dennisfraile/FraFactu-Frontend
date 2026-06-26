import { describe, it, expect } from 'vitest'
import { fseStrategy, calcItemFse14, calcResumenFse14 } from './fse14'

describe('calcItemFse14 (compra, sin IVA)', () => {
  it('compra = precio*cant - descuento; sin IVA ni gravada', () => {
    const r = calcItemFse14({ cantidad: 2, precioUni: 30, tipoImpuesto: 1 })
    expect(r.compra).toBe(60)
    expect(r.ventaGravada).toBe(0)
    expect(r.ivaItem).toBe(0)
    expect(r.montoDescuento).toBe(0)
  })
  it('propaga el descuento de línea', () => {
    const r = calcItemFse14({ cantidad: 1, precioUni: 100, montoDescuento: 10, tipoImpuesto: 1 })
    expect(r.compra).toBe(90)
    expect(r.montoDescuento).toBe(10)
  })
})

describe('calcResumenFse14 (retenciones)', () => {
  it('subtotal <= 100: sin retención de renta', () => {
    const items = [calcItemFse14({ cantidad: 1, precioUni: 80, tipoImpuesto: 1 })]
    const r = calcResumenFse14(items)
    expect(r.totalCompras).toBe(80)
    expect(r.subTotal).toBe(80)
    expect(r.reteRenta).toBe(0)
    expect(r.ivaRete1).toBe(0)
    expect(r.totalPagar).toBe(80)
  })
  it('subtotal > 100: retención renta 10%', () => {
    const items = [calcItemFse14({ cantidad: 1, precioUni: 200, tipoImpuesto: 1 })]
    const r = calcResumenFse14(items)
    expect(r.subTotal).toBe(200)
    expect(r.reteRenta).toBe(20) // 200 * 0.10
    expect(r.ivaRete1).toBe(0)
    expect(r.totalPagar).toBe(180)
  })
  it('agente de retención: IVA 1% adicional', () => {
    const items = [calcItemFse14({ cantidad: 1, precioUni: 200, tipoImpuesto: 1 })]
    const r = calcResumenFse14(items, { esAgenteRetencion: true })
    expect(r.reteRenta).toBe(20)
    expect(r.ivaRete1).toBe(2) // 200 * 0.01
    expect(r.totalPagar).toBe(178) // 200 - 20 - 2
  })
  it('totalCompras = compra + descuento; subtotal = compra neto', () => {
    const items = [calcItemFse14({ cantidad: 1, precioUni: 100, montoDescuento: 10, tipoImpuesto: 1 })]
    const r = calcResumenFse14(items)
    expect(r.totalCompras).toBe(100) // 90 + 10
    expect(r.descu).toBe(10)
    expect(r.subTotal).toBe(90)
  })
})

describe('fseStrategy (14) metadatos', () => {
  it('version 2, requiere caja, sujeto excluido, no descuenta stock, usa agente retención', () => {
    expect(fseStrategy.tipoDte).toBe('14')
    expect(fseStrategy.version).toBe(2)
    expect(fseStrategy.requiereCaja).toBe(true)
    expect(fseStrategy.descuentaStock).toBe(false)
    expect(fseStrategy.receptorPolicy).toBe('sujetoExcluido')
    expect(fseStrategy.usaAgenteRetencion).toBe(true)
  })
  it('buildItemDto manda compra y ivaItem=0', () => {
    const item = { descripcion: 'Compra A', cantidad: 2, precioUni: 30, uniMedida: 39, tipoItem: 1, tipoImpuesto: 1 as const }
    const dto = fseStrategy.buildItemDto(item, fseStrategy.calcItem(item), 1)
    expect(dto.compra).toBe(60)
    expect(dto.ventaGravada).toBe(0)
    expect(dto.ivaItem).toBe(0)
  })
  it('buildResumenDto manda totalCompras, reteRenta e ivaRete1', () => {
    const calc = [fseStrategy.calcItem({ cantidad: 1, precioUni: 200, tipoImpuesto: 1 })]
    const res = fseStrategy.calcResumen(calc, { esAgenteRetencion: true })
    const dto = fseStrategy.buildResumenDto(res, { sucursalId: 1, cajaId: null, esConsumidorFinal: false, condicionOperacion: 1, receptorId: 7, esAgenteRetencion: true, items: [], pagos: [{ catFormaPagoId: 1, monto: 178 }] })
    expect(dto.totalCompras).toBe(200)
    expect(dto.reteRenta).toBe(20)
    expect(dto.ivaRete1).toBe(2)
    expect(dto.totalPagar).toBe(178)
    expect(dto.totalGravada).toBe(0)
    expect(dto.totalIva).toBe(0)
  })
})
