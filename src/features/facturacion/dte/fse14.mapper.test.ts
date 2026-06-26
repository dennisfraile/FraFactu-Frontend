import { describe, it, expect } from 'vitest'
import { buildCreateFacturaDto, type FacturaFormValues } from '../mappers'
import { buildFacturaSchema } from '../schemas'
import { getStrategy } from './registry'

const base: FacturaFormValues = {
  sucursalId: 1,
  cajaId: null, // FSE no requiere caja
  esConsumidorFinal: false,
  receptorId: 7,
  vendedorId: null,
  condicionOperacion: 1,
  esAgenteRetencion: true,
  items: [{ descripcion: 'Compra A', cantidad: 1, precioUni: 200, uniMedida: 39, tipoItem: 1, tipoImpuesto: 1 }],
  pagos: [{ catFormaPagoId: 1, monto: 178 }],
}

describe('FSE (14): mapper + schema', () => {
  it('arma el DTO con version 2, sin caja, compra por ítem y retenciones', () => {
    const dto = buildCreateFacturaDto(base, { fecha: '2026-06-25', hora: '10:00:00' }, '14')
    expect(dto.identificacion.tipoDte).toBe('14')
    expect(dto.identificacion.version).toBe(2)
    expect(dto.cajaId).toBeNull()
    expect(dto.receptorId).toBe(7)
    expect(dto.cuerpoDocumento[0].compra).toBe(200)
    expect(dto.cuerpoDocumento[0].ivaItem).toBe(0)
    expect(dto.cuerpoDocumento[0].bodegaId).toBeUndefined()
    expect(dto.resumen.totalCompras).toBe(200)
    expect(dto.resumen.reteRenta).toBe(20)
    expect(dto.resumen.ivaRete1).toBe(2)
    expect(dto.resumen.totalPagar).toBe(178)
  })
  it('el schema FSE acepta sin caja y con sujeto excluido', () => {
    const schema = buildFacturaSchema(getStrategy('14'))
    expect(schema.safeParse(base).success).toBe(true)
  })
  it('el schema FSE rechaza sin sujeto excluido (receptorId)', () => {
    const schema = buildFacturaSchema(getStrategy('14'))
    expect(schema.safeParse({ ...base, receptorId: null }).success).toBe(false)
  })
})
