import { describe, it, expect } from 'vitest'
import { facturaFormSchema } from './schemas'

const valido = {
  sucursalId: 1,
  cajaId: 1,
  esConsumidorFinal: true,
  receptorId: null,
  vendedorId: null,
  condicionOperacion: 1,
  items: [{ descripcion: 'A', cantidad: 1, precioUni: 113, uniMedida: 39, tipoItem: 1, tipoImpuesto: 1, bodegaId: 2 }],
  pagos: [{ catFormaPagoId: 1, monto: 113 }],
}

describe('facturaFormSchema', () => {
  it('acepta un formulario válido', () => {
    expect(facturaFormSchema.safeParse(valido).success).toBe(true)
  })
  it('rechaza sin caja seleccionada', () => {
    expect(facturaFormSchema.safeParse({ ...valido, cajaId: null }).success).toBe(false)
  })
  it('rechaza un ítem Bien sin bodega', () => {
    const r = facturaFormSchema.safeParse({ ...valido, items: [{ ...valido.items[0], bodegaId: undefined }] })
    expect(r.success).toBe(false)
  })
  it('acepta un ítem Servicio sin bodega', () => {
    const r = facturaFormSchema.safeParse({ ...valido, items: [{ ...valido.items[0], tipoItem: 2, bodegaId: undefined }] })
    expect(r.success).toBe(true)
  })
  it('rechaza sin ítems', () => {
    expect(facturaFormSchema.safeParse({ ...valido, items: [] }).success).toBe(false)
  })
  it('rechaza cantidad <= 0', () => {
    const r = facturaFormSchema.safeParse({ ...valido, items: [{ ...valido.items[0], cantidad: 0 }] })
    expect(r.success).toBe(false)
  })
  it('rechaza si los pagos no cuadran con el total', () => {
    const r = facturaFormSchema.safeParse({ ...valido, pagos: [{ catFormaPagoId: 1, monto: 50 }] })
    expect(r.success).toBe(false)
  })
  it('exige receptorId cuando no es consumidor final', () => {
    const r = facturaFormSchema.safeParse({ ...valido, esConsumidorFinal: false, receptorId: null })
    expect(r.success).toBe(false)
  })
})
