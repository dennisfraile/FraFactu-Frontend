import { describe, it, expect } from 'vitest'
import { navSections } from './nav-config'

describe('nav-config', () => {
  it('incluye la sección Compras con Proveedores', () => {
    const compras = navSections.find((s) => s.title === 'Compras')
    expect(compras).toBeDefined()
    expect(compras!.items.some((i) => i.to === '/proveedores')).toBe(true)
  })
})
