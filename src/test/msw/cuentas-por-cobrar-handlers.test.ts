import { describe, it, expect } from 'vitest'
import { cuentasPorCobrarHandlers, planEjemplo } from './cuentas-por-cobrar-handlers'

describe('cuentasPorCobrarHandlers', () => {
  it('exporta handlers y un plan de ejemplo', () => {
    expect(cuentasPorCobrarHandlers.length).toBeGreaterThan(0)
    expect(planEjemplo.id).toBe(1)
    expect(planEjemplo.cuotas.length).toBeGreaterThanOrEqual(2)
  })
})
