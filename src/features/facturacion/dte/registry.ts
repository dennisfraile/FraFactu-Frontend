import type { TipoDte } from '../types'
import type { DteStrategy } from './strategy'
import { facturaStrategy } from './factura01'
import { ccfStrategy } from './ccf03'
import { ncStrategy } from './nc05'
import { fseStrategy } from './fse14'

// Estrategias por tipo de DTE. FSE (14) se añade en F5.2c.
export const dteRegistry: Partial<Record<TipoDte, DteStrategy>> = {
  '01': facturaStrategy,
  '03': ccfStrategy,
  '05': ncStrategy,
  '14': fseStrategy,
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
