// src/features/dtes-recibidos/estado.test.ts
import { describe, it, expect } from 'vitest'
import { tonoDteRecibido } from './estado'

describe('tonoDteRecibido', () => {
  it('mapea cada estado a su tono', () => {
    expect(tonoDteRecibido('VINCULADO')).toBe('recibido')
    expect(tonoDteRecibido('DESCARTADO')).toBe('rechazado')
    expect(tonoDteRecibido('PENDIENTE')).toBe('borrador')
  })
})
