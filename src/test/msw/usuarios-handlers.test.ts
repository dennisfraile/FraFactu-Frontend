import { describe, it, expect } from 'vitest'
import { usuariosHandlers } from './usuarios-handlers'

describe('usuariosHandlers', () => {
  it('cubre usuarios, roles y cajas', () => {
    expect(usuariosHandlers.length).toBeGreaterThanOrEqual(6)
  })
})
