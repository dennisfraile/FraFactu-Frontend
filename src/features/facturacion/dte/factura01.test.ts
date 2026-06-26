import { describe, it, expect } from 'vitest'
import { facturaStrategy } from './factura01'

describe('facturaStrategy (01)', () => {
  it('expone metadatos correctos', () => {
    expect(facturaStrategy.tipoDte).toBe('01')
    expect(facturaStrategy.version).toBe(2)
    expect(facturaStrategy.requiereCaja).toBe(true)
    expect(facturaStrategy.descuentaStock).toBe(true)
    expect(facturaStrategy.receptorPolicy).toBe('opcional')
    expect(facturaStrategy.precioIncluyeIva).toBe(true)
  })
  it('calcula ítem con IVA incluido (inverso)', () => {
    const r = facturaStrategy.calcItem({ cantidad: 2, precioUni: 56.5, tipoImpuesto: 1 })
    expect(r.ventaGravada).toBe(113)
    expect(r.ivaItem).toBe(13)
  })
  it('resumen: total = subtotal (IVA incluido)', () => {
    const calc = [facturaStrategy.calcItem({ cantidad: 2, precioUni: 56.5, tipoImpuesto: 1 })]
    const res = facturaStrategy.calcResumen(calc)
    expect(res.subTotal).toBe(113)
    expect(res.totalPagar).toBe(113)
    expect(res.totalIva).toBe(13)
  })
  it('buildItemDto y buildResumenDto producen el DTO de 01', () => {
    const item = { descripcion: 'A', cantidad: 2, precioUni: 56.5, uniMedida: 39, tipoItem: 1, tipoImpuesto: 1 as const, bodegaId: 2 }
    const calc = facturaStrategy.calcItem(item)
    const itemDto = facturaStrategy.buildItemDto(item, calc, 1)
    expect(itemDto.numItem).toBe(1)
    expect(itemDto.ventaGravada).toBe(113)
    expect(itemDto.precioIncluyeIva).toBe(true)
    const res = facturaStrategy.calcResumen([calc])
    const resDto = facturaStrategy.buildResumenDto(res, {
      sucursalId: 1, cajaId: 1, esConsumidorFinal: true, condicionOperacion: 1, items: [item], pagos: [{ catFormaPagoId: 1, monto: 113 }],
    })
    expect(resDto.totalPagar).toBe(113)
    expect(resDto.totalLetras).toBe('CIENTO TRECE DÓLARES CON 00/100')
    expect(resDto.pagos[0].monto).toBe(113)
  })
})
