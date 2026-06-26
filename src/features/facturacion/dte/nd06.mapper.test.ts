import { describe, it, expect } from 'vitest'
import { buildCreateFacturaDto, type FacturaFormValues } from '../mappers'
import { buildFacturaSchema } from '../schemas'
import { getStrategy } from './registry'

const base: FacturaFormValues = {
  sucursalId: 1, cajaId: null, esConsumidorFinal: false, receptorId: 7, vendedorId: null, condicionOperacion: 1,
  documentoRelacionado: { tipoDocumento: '03', tipoGeneracion: 1, numeroDocumento: 'ABC', fechaEmision: '2026-06-20' },
  items: [{ descripcion: 'Interés por mora', cantidad: 1, precioUni: 100, uniMedida: 39, tipoItem: 2, tipoImpuesto: 1 }],
  pagos: [{ catFormaPagoId: 1, monto: 113 }],
}

describe('ND (06): mapper + schema', () => {
  it('arma el DTO con version 4, tributos y documento relacionado', () => {
    const dto = buildCreateFacturaDto(base, { fecha: '2026-06-26', hora: '10:00:00' }, '06')
    expect(dto.identificacion.tipoDte).toBe('06')
    expect(dto.identificacion.version).toBe(4)
    expect(dto.cuerpoDocumento[0].tributos).toEqual(['20'])
    expect(dto.resumen.montoTotalOperacion).toBe(113)
    expect(dto.documentosRelacionados?.[0].numeroDocumento).toBe('ABC')
  })
  it('schema rechaza sin documento relacionado', () => {
    expect(buildFacturaSchema(getStrategy('06')).safeParse({ ...base, documentoRelacionado: null }).success).toBe(false)
  })
})
