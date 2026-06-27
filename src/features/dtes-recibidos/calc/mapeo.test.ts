// src/features/dtes-recibidos/calc/mapeo.test.ts
import { describe, it, expect } from 'vitest'
import { totalLineaMapeo, calcCuadre } from './mapeo'

describe('totalLineaMapeo', () => {
  it('producto = cantidad × costo', () => {
    expect(totalLineaMapeo({ accion: 'PRODUCTO_EXISTENTE', cantidad: 50, costoUnitario: 5.085, montoDte: 0 })).toBe(254.25)
  })
  it('gasto = montoDte', () => {
    expect(totalLineaMapeo({ accion: 'GASTO', cantidad: 0, costoUnitario: 0, montoDte: 30 })).toBe(30)
  })
})

describe('calcCuadre', () => {
  it('cuadra dentro de ±0.01', () => {
    const r = calcCuadre([{ accion: 'GASTO', cantidad: 0, costoUnitario: 0, montoDte: 254.25 }], 254.25)
    expect(r.cuadra).toBe(true)
    expect(r.diferencia).toBe(0)
  })
  it('no cuadra si difiere más de 0.01', () => {
    const r = calcCuadre([{ accion: 'GASTO', cantidad: 0, costoUnitario: 0, montoDte: 254.25 }], 300)
    expect(r.cuadra).toBe(false)
    expect(r.totalMapeado).toBe(254.25)
  })
})
