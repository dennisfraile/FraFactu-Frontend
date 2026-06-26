import { describe, it, expect } from 'vitest'
import { buildCreateFacturaDto, type FacturaFormValues } from '../mappers'
import { buildFacturaSchema } from '../schemas'
import { getStrategy } from './registry'

const base: FacturaFormValues = {
  sucursalId: 1,
  cajaId: 5,
  esConsumidorFinal: false,
  receptorId: 7,
  vendedorId: null,
  condicionOperacion: 1,
  items: [{ descripcion: 'Servicio A', cantidad: 2, precioUni: 50, uniMedida: 39, tipoItem: 1, tipoImpuesto: 1, bodegaId: 2 }],
  pagos: [{ catFormaPagoId: 1, monto: 113 }],
}

describe('CCF (03): mapper + schema', () => {
  it('arma el DTO con version 4, receptorId y IVA neto', () => {
    const dto = buildCreateFacturaDto(base, { fecha: '2026-06-25', hora: '10:00:00' }, '03')
    expect(dto.identificacion.tipoDte).toBe('03')
    expect(dto.identificacion.version).toBe(4)
    expect(dto.cajaId).toBe(5)
    expect(dto.receptorId).toBe(7)
    expect(dto.receptor).toBeNull()
    expect(dto.cuerpoDocumento[0].ventaGravada).toBe(100)
    expect(dto.cuerpoDocumento[0].ivaItem).toBe(13)
    expect(dto.cuerpoDocumento[0].precioIncluyeIva).toBe(false)
    expect(dto.resumen.totalIva).toBe(13)
    expect(dto.resumen.totalPagar).toBe(113)
    expect(dto.resumen.montoTotalOperacion).toBe(113)
    expect(dto.cuerpoDocumento[0].tributos).toEqual(['20'])
    expect(dto.resumen.tributos).toEqual([{ codigo: '20', descripcion: 'Impuesto al Valor Agregado 13%', valor: 13 }])
  })
  it('el schema CCF rechaza sin receptor (no permite Consumidor Final)', () => {
    const schema = buildFacturaSchema(getStrategy('03'))
    const r = schema.safeParse({ ...base, receptorId: null, esConsumidorFinal: true })
    expect(r.success).toBe(false)
  })
  it('el schema CCF acepta con receptor y pagos que cuadran con el total + IVA', () => {
    const schema = buildFacturaSchema(getStrategy('03'))
    expect(schema.safeParse(base).success).toBe(true)
  })
})
