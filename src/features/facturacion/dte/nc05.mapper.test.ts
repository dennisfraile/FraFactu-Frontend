import { describe, it, expect } from 'vitest'
import { buildFacturaSchema } from '../schemas'
import { getStrategy } from './registry'
import { buildCreateFacturaDto } from '../mappers'
import type { FacturaFormValues } from '../mappers'

const base: FacturaFormValues = {
  sucursalId: 1, cajaId: 5, esConsumidorFinal: false, receptorId: 7, vendedorId: null, condicionOperacion: 1,
  documentoRelacionado: { tipoDocumento: '03', tipoGeneracion: 1, numeroDocumento: 'ABC', fechaEmision: '2026-06-20' },
  items: [{ descripcion: 'X', cantidad: 2, precioUni: 50, uniMedida: 39, tipoItem: 1, tipoImpuesto: 1 }],
  pagos: [{ catFormaPagoId: 1, monto: 113 }],
}

describe('schema NC (05)', () => {
  it('acepta con documento relacionado + receptor', () => {
    expect(buildFacturaSchema(getStrategy('05')).safeParse(base).success).toBe(true)
  })
  it('rechaza sin documento relacionado', () => {
    expect(buildFacturaSchema(getStrategy('05')).safeParse({ ...base, documentoRelacionado: null }).success).toBe(false)
  })
  it('rechaza sin receptor', () => {
    expect(buildFacturaSchema(getStrategy('05')).safeParse({ ...base, receptorId: null }).success).toBe(false)
  })
})

describe('DTO e2e NC (05)', () => {
  it('arma el DTO de NC con tributos, documento relacionado y version 4', () => {
    const dto = buildCreateFacturaDto(base, { fecha: '2026-06-26', hora: '10:00:00' }, '05')
    expect(dto.identificacion.tipoDte).toBe('05')
    expect(dto.identificacion.version).toBe(4)
    expect(dto.cajaId).toBe(5)
    expect(dto.cuerpoDocumento[0].tributos).toEqual(['20'])
    expect(dto.cuerpoDocumento[0].ivaItem).toBe(13)
    expect(dto.resumen.tributos).toEqual([{ codigo: '20', descripcion: 'Impuesto al Valor Agregado 13%', valor: 13 }])
    expect(dto.resumen.montoTotalOperacion).toBe(113)
    expect(dto.documentosRelacionados).toEqual([{ tipoDocumento: '03', tipoGeneracion: 1, numeroDocumento: 'ABC', fechaEmision: '2026-06-20' }])
  })
})
