import { describe, it, expect } from 'vitest'
import { ndStrategy } from './nd06'

describe('ndStrategy (06) metadatos', () => {
  it('version 4, requiere documento relacionado, SIN prefill', () => {
    expect(ndStrategy.tipoDte).toBe('06')
    expect(ndStrategy.version).toBe(4)
    expect(ndStrategy.requiereCaja).toBe(true)
    expect(ndStrategy.receptorPolicy).toBe('contribuyente')
    expect(ndStrategy.requiereDocumentoRelacionado).toBe(true)
    expect(ndStrategy.prefillDesdeOriginal).toBe(false)
  })
  it('buildResumenDto: IVA neto con tributos', () => {
    const calc = [ndStrategy.calcItem({ cantidad: 1, precioUni: 100, tipoImpuesto: 1 })]
    const res = ndStrategy.calcResumen(calc)
    const dto = ndStrategy.buildResumenDto(res, { sucursalId: 1, cajaId: null, esConsumidorFinal: false, condicionOperacion: 1, receptorId: 7, items: [], pagos: [{ catFormaPagoId: 1, monto: 113 }] })
    expect(dto.montoTotalOperacion).toBe(113)
    expect(dto.tributos).toEqual([{ codigo: '20', descripcion: 'Impuesto al Valor Agregado 13%', valor: 13 }])
  })
})
