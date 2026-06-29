import { describe, it, expect } from 'vitest'
import { inventarioHandlers, productoEjemplo, stockEjemplo } from './inventario-handlers'

describe('inventarioHandlers', () => {
  it('exporta handlers y ejemplos', () => {
    expect(inventarioHandlers.length).toBeGreaterThan(0)
    expect(productoEjemplo.codigo).toBe('P001')
    expect(stockEjemplo.cantidadDisponible).toBeGreaterThanOrEqual(0)
  })
})
