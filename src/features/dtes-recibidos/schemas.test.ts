import { describe, it, expect } from 'vitest'
import { mapeoSchema, leerCorreoSchema } from './schemas'
import { lineaDesdeParsed } from './mappers'
import type { DteLineaParsed } from './parse'

const linea: DteLineaParsed = {
  numItem: 1, codigo: 'P-1', descripcion: 'Papel', cantidad: 50, precioUnitario: 4.5,
  montoDescuento: 0, ventaGravada: 225, ventaExenta: 0, ventaNoSujeta: 0, unidadMedida: 59,
  montoNeto: 225, montoConIva: 254.25,
}

describe('mapeoSchema', () => {
  it('acepta una línea GASTO con sucursal', () => {
    const r = mapeoSchema.safeParse({ sucursalId: 2, lineas: [lineaDesdeParsed(linea)] })
    expect(r.success).toBe(true)
  })
  it('rechaza PRODUCTO_EXISTENTE sin producto/bodega', () => {
    const r = mapeoSchema.safeParse({ sucursalId: 2, lineas: [{ ...lineaDesdeParsed(linea), accion: 'PRODUCTO_EXISTENTE' }] })
    expect(r.success).toBe(false)
  })
  it('rechaza sin sucursal', () => {
    const r = mapeoSchema.safeParse({ sucursalId: null, lineas: [lineaDesdeParsed(linea)] })
    expect(r.success).toBe(false)
  })
})

describe('leerCorreoSchema', () => {
  it('acepta ambos meses vacíos', () => {
    expect(leerCorreoSchema.safeParse({ mesInicio: '', mesFin: '' }).success).toBe(true)
  })
  it('acepta rango válido', () => {
    expect(leerCorreoSchema.safeParse({ mesInicio: '2026-01', mesFin: '2026-03' }).success).toBe(true)
  })
  it('rechaza si solo uno está presente', () => {
    expect(leerCorreoSchema.safeParse({ mesInicio: '2026-01', mesFin: '' }).success).toBe(false)
  })
  it('rechaza fin < inicio', () => {
    expect(leerCorreoSchema.safeParse({ mesInicio: '2026-05', mesFin: '2026-01' }).success).toBe(false)
  })
})
