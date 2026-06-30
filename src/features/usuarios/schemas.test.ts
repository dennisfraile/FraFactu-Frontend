import { describe, it, expect } from 'vitest'
import { crearUsuarioSchema, toCrearDto } from './schemas'

const baseManual = {
  nombreCompleto: 'Ana Pérez', email: 'ana@x.com', rolId: 5,
  accesoTodasSucursales: true, sucursalIds: [] as number[], cajaIds: [] as number[],
  modoPassword: 'manual' as const, password: 'Secreta123', confirmar: 'Secreta123', requiereCambioPwd: true,
}

describe('crearUsuarioSchema', () => {
  it('válido en modo manual con passwords coincidentes', () => {
    expect(crearUsuarioSchema.safeParse(baseManual).success).toBe(true)
  })
  it('falla si las contraseñas no coinciden', () => {
    const r = crearUsuarioSchema.safeParse({ ...baseManual, confirmar: 'otra' })
    expect(r.success).toBe(false)
  })
  it('falla si password < 8 en modo manual', () => {
    const r = crearUsuarioSchema.safeParse({ ...baseManual, password: 'corta', confirmar: 'corta' })
    expect(r.success).toBe(false)
  })
  it('modo correo no exige password', () => {
    const r = crearUsuarioSchema.safeParse({ ...baseManual, modoPassword: 'correo', password: '', confirmar: '' })
    expect(r.success).toBe(true)
  })
  it('exige al menos una sucursal si no es acceso a todas', () => {
    const r = crearUsuarioSchema.safeParse({ ...baseManual, accesoTodasSucursales: false, sucursalIds: [] })
    expect(r.success).toBe(false)
  })
  it('toCrearDto: modo correo => password undefined', () => {
    const form = { ...baseManual, modoPassword: 'correo' as const, password: '', confirmar: '' }
    const dto = toCrearDto(form)
    expect(dto.password).toBeUndefined()
  })
  it('toCrearDto: modo manual => password presente', () => {
    expect(toCrearDto(baseManual).password).toBe('Secreta123')
  })
})
