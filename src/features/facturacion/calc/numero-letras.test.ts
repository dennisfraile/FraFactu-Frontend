import { describe, it, expect } from 'vitest'
import { numeroALetras } from './numero-letras'

describe('numeroALetras', () => {
  it('convierte enteros con centavos', () => {
    expect(numeroALetras(113)).toBe('CIENTO TRECE DÓLARES CON 00/100')
    expect(numeroALetras(1.5)).toBe('UN DÓLAR CON 50/100')
  })
  it('cero', () => {
    expect(numeroALetras(0)).toBe('CERO DÓLARES CON 00/100')
  })
  it('miles y unidades compuestas', () => {
    expect(numeroALetras(1234.56)).toBe('MIL DOSCIENTOS TREINTA Y CUATRO DÓLARES CON 56/100')
    expect(numeroALetras(21)).toBe('VEINTIUN DÓLARES CON 00/100')
  })
  it('cientos exactos', () => {
    expect(numeroALetras(100)).toBe('CIEN DÓLARES CON 00/100')
    expect(numeroALetras(500)).toBe('QUINIENTOS DÓLARES CON 00/100')
  })
})
