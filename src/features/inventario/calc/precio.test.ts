import { describe, it, expect } from 'vitest'
import { precioConIva, precioSinIva } from './precio'

describe('precio IVA', () => {
  it('agrega IVA', () => { expect(precioConIva(100, 13)).toBe(113) })
  it('extrae IVA', () => { expect(precioSinIva(113, 13)).toBe(100) })
  it('redondea a 2', () => { expect(precioConIva(9.99, 13)).toBe(11.29) })
})
