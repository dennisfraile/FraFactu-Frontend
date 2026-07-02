import { describe, it, expect } from 'vitest'
import { rangoDePreset, periodoAnterior, inicioDelDiaISO, finDelDiaISO } from './date-range'

const ahora = new Date('2026-03-15T12:00:00Z')

describe('rangoDePreset', () => {
  it('30d abarca 30 días terminando hoy', () => {
    const r = rangoDePreset('30d', ahora)
    expect(new Date(r.fechaFin).getTime()).toBeGreaterThan(new Date(r.fechaInicio).getTime())
    const dias = (new Date(r.fechaFin).getTime() - new Date(r.fechaInicio).getTime()) / 86400000
    expect(dias).toBeGreaterThan(29)
    expect(dias).toBeLessThan(31)
  })
  it('hoy: el rango cubre ~24h (un día local)', () => {
    const r = rangoDePreset('hoy', ahora)
    const horas = (new Date(r.fechaFin).getTime() - new Date(r.fechaInicio).getTime()) / 3_600_000
    expect(horas).toBeGreaterThan(23)
    expect(horas).toBeLessThan(25)
  })
})

describe('inicioDelDiaISO / finDelDiaISO', () => {
  it('inicioDelDiaISO es el inicio del día local del YMD dado', () => {
    const iso = inicioDelDiaISO('2026-07-02')
    const d = new Date(iso)
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(6)
    expect(d.getDate()).toBe(2)
    expect(d.getHours()).toBe(0)
    expect(d.getMinutes()).toBe(0)
  })
  it('finDelDiaISO cubre hasta el último instante del día local (incluye el día completo)', () => {
    const iso = finDelDiaISO('2026-07-02')
    const d = new Date(iso)
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(6)
    expect(d.getDate()).toBe(2)
    expect(d.getHours()).toBe(23)
    expect(d.getMinutes()).toBe(59)
  })
  it('un rango custom de un solo día cubre ~24h (no colapsa a 0)', () => {
    const inicio = new Date(inicioDelDiaISO('2026-07-02')).getTime()
    const fin = new Date(finDelDiaISO('2026-07-02')).getTime()
    const horas = (fin - inicio) / 3_600_000
    expect(horas).toBeGreaterThan(23)
    expect(horas).toBeLessThan(25)
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
