import { describe, it, expect } from 'vitest'
import { buildFacturaSchema } from '../schemas'
import { getStrategy } from './registry'
import type { FacturaFormValues } from '../mappers'

const base: FacturaFormValues = {
  sucursalId: 1, cajaId: null, esConsumidorFinal: false, receptorId: 7, vendedorId: null, condicionOperacion: 1,
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
