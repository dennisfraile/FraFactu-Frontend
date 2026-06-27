// src/features/dtes-recibidos/calc/mapeo.test.ts
import { describe, it, expect } from 'vitest'
import { totalLineaMapeo, calcCuadre, prorratearIva } from './mapeo'

// DTE context: subTotal=225, iva=29.25 (total=254.25)
const dteCtx = { iva: 29.25, subTotal: 225 }

describe('prorratearIva', () => {
  it('prorratea correctamente el IVA', () => {
    // 225 * (29.25 / 225) = 29.25
    expect(prorratearIva(225, 29.25, 225)).toBe(29.25)
  })
  it('retorna 0 si subTotalDte <= 0', () => {
    expect(prorratearIva(100, 13, 0)).toBe(0)
  })
  it('retorna 0 si ivaDte <= 0', () => {
    expect(prorratearIva(100, 0, 225)).toBe(0)
  })
  it('retorna 0 si subtotal <= 0', () => {
    expect(prorratearIva(0, 29.25, 225)).toBe(0)
  })
})

describe('totalLineaMapeo', () => {
  it('producto = subtotal + IVA prorrateado', () => {
    // cantidad 50 × costoUnitario 4.50 = 225 subtotal; IVA = round2(225*29.25/225) = 29.25; total = 254.25
    expect(totalLineaMapeo({ accion: 'PRODUCTO_EXISTENTE', cantidad: 50, costoUnitario: 4.50, montoDte: 0 }, dteCtx)).toBe(254.25)
  })
  it('gasto = montoDte (sin IVA adicional)', () => {
    expect(totalLineaMapeo({ accion: 'GASTO', cantidad: 0, costoUnitario: 0, montoDte: 30 }, dteCtx)).toBe(30)
  })
})

describe('calcCuadre', () => {
  it('cuadra dentro de ±0.01 (caso GASTO)', () => {
    const r = calcCuadre([{ accion: 'GASTO', cantidad: 0, costoUnitario: 0, montoDte: 254.25 }], 254.25, dteCtx)
    expect(r.cuadra).toBe(true)
    expect(r.diferencia).toBe(0)
  })
  it('cuadra dentro de ±0.01 (caso PRODUCTO con IVA prorrateado)', () => {
    // cantidad 50 × costo 4.50 = subtotal 225; IVA = 29.25; total = 254.25
    const r = calcCuadre([{ accion: 'PRODUCTO_EXISTENTE', cantidad: 50, costoUnitario: 4.50, montoDte: 0 }], 254.25, dteCtx)
    expect(r.cuadra).toBe(true)
    expect(r.totalMapeado).toBe(254.25)
  })
  it('no cuadra si difiere más de 0.01', () => {
    const r = calcCuadre([{ accion: 'GASTO', cantidad: 0, costoUnitario: 0, montoDte: 254.25 }], 300, dteCtx)
    expect(r.cuadra).toBe(false)
    expect(r.totalMapeado).toBe(254.25)
  })
})
