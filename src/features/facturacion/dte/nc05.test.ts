import { describe, it, expect } from 'vitest'
import { ncStrategy } from './nc05'

describe('ncStrategy (05) metadatos', () => {
  it('version 4, requiere caja, requiere documento relacionado, contribuyente, prefill', () => {
    expect(ncStrategy.tipoDte).toBe('05')
    expect(ncStrategy.version).toBe(4)
    expect(ncStrategy.requiereCaja).toBe(true)
    expect(ncStrategy.descuentaStock).toBe(false)
    expect(ncStrategy.receptorPolicy).toBe('contribuyente')
    expect(ncStrategy.requiereDocumentoRelacionado).toBe(true)
    expect(ncStrategy.prefillDesdeOriginal).toBe(true)
  })
  it('buildItemDto: IVA neto con tributo ["20"] en gravado', () => {
    const item = { descripcion: 'X', cantidad: 2, precioUni: 50, uniMedida: 39, tipoItem: 1, tipoImpuesto: 1 as const }
    const dto = ncStrategy.buildItemDto(item, ncStrategy.calcItem(item), 1)
    expect(dto.ventaGravada).toBe(100)
    expect(dto.ivaItem).toBe(13)
    expect(dto.tributos).toEqual(['20'])
    expect(dto.precioIncluyeIva).toBe(false)
  })
  it('buildResumenDto: tributos + montoTotalOperacion', () => {
    const calc = [ncStrategy.calcItem({ cantidad: 2, precioUni: 50, tipoImpuesto: 1 })]
    const res = ncStrategy.calcResumen(calc)
    const dto = ncStrategy.buildResumenDto(res, { sucursalId: 1, cajaId: null, esConsumidorFinal: false, condicionOperacion: 1, receptorId: 7, items: [], pagos: [{ catFormaPagoId: 1, monto: 113 }] })
    expect(dto.montoTotalOperacion).toBe(113)
    expect(dto.totalPagar).toBe(113)
    expect(dto.tributos).toEqual([{ codigo: '20', descripcion: 'Impuesto al Valor Agregado 13%', valor: 13 }])
  })
})
