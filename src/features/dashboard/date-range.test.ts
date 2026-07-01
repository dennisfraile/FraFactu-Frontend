import { describe, it, expect } from 'vitest'
import { rangoDePreset, periodoAnterior } from './date-range'

const ahora = new Date('2026-03-15T12:00:00Z')

describe('rangoDePreset', () => {
  it('30d abarca 30 días terminando hoy', () => {
    const r = rangoDePreset('30d', ahora)
    expect(new Date(r.fechaFin).getTime()).toBeGreaterThan(new Date(r.fechaInicio).getTime())
    const dias = (new Date(r.fechaFin).getTime() - new Date(r.fechaInicio).getTime()) / 86400000
    expect(dias).toBeGreaterThan(29)
    expect(dias).toBeLessThan(31)
  })
  it('hoy: inicio y fin caen el mismo día', () => {
    const r = rangoDePreset('hoy', ahora)
    expect(r.fechaInicio.slice(0, 10)).toBe(r.fechaFin.slice(0, 10))
  })
})

describe('periodoAnterior', () => {
  it('el período anterior tiene el mismo largo y termina justo antes del inicio', () => {
    const r = rangoDePreset('7d', ahora)
    const prev = periodoAnterior(r)
    expect(new Date(prev.fechaAnteriorFin).getTime()).toBeLessThanOrEqual(new Date(r.fechaInicio).getTime())
    const largoActual = new Date(r.fechaFin).getTime() - new Date(r.fechaInicio).getTime()
    const largoPrev = new Date(prev.fechaAnteriorFin).getTime() - new Date(prev.fechaAnteriorInicio).getTime()
    expect(Math.abs(largoActual - largoPrev)).toBeLessThan(1000)
  })
})
