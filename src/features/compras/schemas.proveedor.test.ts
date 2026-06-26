// src/features/compras/schemas.proveedor.test.ts
import { describe, it, expect } from 'vitest'
import { proveedorSchema } from './schemas'

const valido = { nit: '06140101011011', nombre: 'Distribuidora El Sol', email: '', nombreComercial: '', direccion: '', telefono: '', contacto: '', sitioWeb: '', notas: '' }

describe('proveedorSchema', () => {
  it('acepta un proveedor con NIT de 14 dígitos y nombre', () => {
    expect(proveedorSchema.safeParse(valido).success).toBe(true)
  })
  it('rechaza NIT que no tiene 14 dígitos', () => {
    const r = proveedorSchema.safeParse({ ...valido, nit: '0614' })
    expect(r.success).toBe(false)
  })
  it('rechaza NIT con letras', () => {
    expect(proveedorSchema.safeParse({ ...valido, nit: '0614010101101A' }).success).toBe(false)
  })
  it('rechaza nombre vacío', () => {
    expect(proveedorSchema.safeParse({ ...valido, nombre: '' }).success).toBe(false)
  })
  it('rechaza email con formato inválido pero acepta vacío', () => {
    expect(proveedorSchema.safeParse({ ...valido, email: 'no-es-email' }).success).toBe(false)
    expect(proveedorSchema.safeParse({ ...valido, email: '' }).success).toBe(true)
    expect(proveedorSchema.safeParse({ ...valido, email: 'a@b.com' }).success).toBe(true)
  })
})
