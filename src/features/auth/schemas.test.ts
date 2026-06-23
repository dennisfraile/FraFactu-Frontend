import { describe, it, expect } from 'vitest'
import { loginSchema, resetSchema } from './schemas'

describe('loginSchema', () => {
  it('rechaza email inválido', () => {
    expect(loginSchema.safeParse({ email: 'x', password: '12345678' }).success).toBe(false)
  })
  it('acepta datos válidos', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '12345678' }).success).toBe(true)
  })
})

describe('resetSchema', () => {
  it('falla si las contraseñas no coinciden', () => {
    const r = resetSchema.safeParse({ newPassword: '12345678', confirmPassword: 'xxxxxxxx' })
    expect(r.success).toBe(false)
  })
  it('falla si es muy corta', () => {
    expect(resetSchema.safeParse({ newPassword: '123', confirmPassword: '123' }).success).toBe(false)
  })
  it('acepta coincidentes y suficientemente largas', () => {
    expect(resetSchema.safeParse({ newPassword: '12345678', confirmPassword: '12345678' }).success).toBe(true)
  })
})
