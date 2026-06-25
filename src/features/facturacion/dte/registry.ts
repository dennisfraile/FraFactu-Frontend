import type { TipoDte } from '../types'
import type { DteStrategy } from './strategy'
import { facturaStrategy } from './factura01'

// Estrategias por tipo de DTE. CCF (03) y FSE (14) se añaden en F5.2b/F5.2c.
export const dteRegistry: Partial<Record<TipoDte, DteStrategy>> = {
  '01': facturaStrategy,
}

export function getStrategySafe(tipoDte: TipoDte): DteStrategy | undefined {
  return dteRegistry[tipoDte]
}

export function getStrategy(tipoDte: TipoDte): DteStrategy {
  const s = dteRegistry[tipoDte]
  if (!s) throw new Error(`Tipo de DTE no soportado: ${tipoDte}`)
  return s
}

// Tipos emisibles desde la UI, en orden de presentación.
export const TIPOS_EMISIBLES = Object.keys(dteRegistry) as TipoDte[]
