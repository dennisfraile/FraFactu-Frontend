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

// Producto: cantidad × costo. Gasto: montoDte (incluye IVA prorrateado por línea).
export function totalLineaMapeo(l: LineaTotalInput): number {
  return l.accion === 'GASTO' ? round2(l.montoDte) : round2(l.cantidad * l.costoUnitario)
}

export interface Cuadre {
  totalMapeado: number
  diferencia: number
  cuadra: boolean
}

export function calcCuadre(lineas: LineaTotalInput[], totalDte: number): Cuadre {
  const totalMapeado = round2(lineas.reduce((s, l) => s + totalLineaMapeo(l), 0))
  const diferencia = round2(totalMapeado - totalDte)
  return { totalMapeado, diferencia, cuadra: Math.abs(diferencia) <= 0.01 }
}
