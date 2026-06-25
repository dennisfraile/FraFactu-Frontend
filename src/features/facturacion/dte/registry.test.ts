import { describe, it, expect } from 'vitest'
import { getStrategy, getStrategySafe, TIPOS_EMISIBLES } from './registry'

describe('dteRegistry', () => {
  it('getStrategy("01") devuelve la estrategia de Factura', () => {
    expect(getStrategy('01').tipoDte).toBe('01')
  })
  it('getStrategySafe de un tipo no soportado devuelve undefined', () => {
    expect(getStrategySafe('99' as never)).toBeUndefined()
  })
  it('getStrategy de un tipo no soportado lanza', () => {
    expect(() => getStrategy('99' as never)).toThrow()
  })
  it('TIPOS_EMISIBLES incluye 01', () => {
    expect(TIPOS_EMISIBLES).toContain('01')
  })
})
