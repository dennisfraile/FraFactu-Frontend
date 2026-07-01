import { describe, it, expect } from 'vitest'
import { puede, ROLES } from './roles'

describe('puede', () => {
  it('true si el rol está en la lista permitida', () => {
    expect(puede('EmisorAdmin', ['SuperAdmin', 'EmisorAdmin'])).toBe(true)
  })
  it('false si el rol no está', () => {
    expect(puede('Cajero', ['SuperAdmin', 'EmisorAdmin'])).toBe(false)
  })
  it('false si el rol es undefined/null', () => {
    expect(puede(undefined, ['EmisorAdmin'])).toBe(false)
    expect(puede(null, ['EmisorAdmin'])).toBe(false)
  })
  it('ROLES contiene los 7 roles del sistema', () => {
    expect(ROLES).toHaveLength(7)
    expect(ROLES).toContain('SuperAdmin')
    expect(ROLES).toContain('Contador')
  })
  it('incluye EncargadoInventario como rol válido', () => {
    expect(ROLES).toContain('EncargadoInventario')
    expect(puede('EncargadoInventario', ['EncargadoInventario'])).toBe(true)
  })
})
