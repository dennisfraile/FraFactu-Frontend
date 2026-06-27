// src/features/dtes-recibidos/calc/mapeo.ts
import type { AccionMapeo } from '../types'

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export interface LineaTotalInput {
  accion: AccionMapeo
  cantidad: number
  costoUnitario: number
  montoDte: number
}

// Prorratea el IVA del DTE para una subtotal de línea, usando la proporción del DTE.
export function prorratearIva(subtotal: number, ivaDte: number, subTotalDte: number): number {
  return subTotalDte <= 0 || ivaDte <= 0 || subtotal <= 0
    ? 0
    : round2(subtotal * (ivaDte / subTotalDte))
}

// Producto: subtotal + IVA prorrateado. Gasto: montoDte (incluye IVA prorrateado por línea).
export function totalLineaMapeo(l: LineaTotalInput, dte: { iva: number; subTotal: number }): number {
  if (l.accion === 'GASTO') return round2(l.montoDte)
  const subtotal = round2(l.cantidad * l.costoUnitario)
  return round2(subtotal + prorratearIva(subtotal, dte.iva, dte.subTotal))
}

export interface Cuadre {
  totalMapeado: number
  diferencia: number
  cuadra: boolean
}

export function calcCuadre(lineas: LineaTotalInput[], totalDte: number, dte: { iva: number; subTotal: number }): Cuadre {
  const totalMapeado = round2(lineas.reduce((s, l) => s + totalLineaMapeo(l, dte), 0))
  const diferencia = round2(totalMapeado - totalDte)
  return { totalMapeado, diferencia, cuadra: Math.abs(diferencia) <= 0.01 }
}
