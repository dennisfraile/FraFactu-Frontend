import { describe, it, expect } from 'vitest'
import { round, round8 } from './round'

describe('round', () => {
  it('redondea a 2 decimales por defecto', () => {
    expect(round(1.005)).toBe(1.01)
    expect(round(2.345)).toBe(2.35)
    expect(round(0.1 + 0.2)).toBe(0.3)
  })
  it('respeta los decimales indicados', () => {
    expect(round(1.23456, 3)).toBe(1.235)
  })
  it('round8 redondea a 8 decimales', () => {
    expect(round8(1.123456785)).toBe(1.12345679)
  })
})
