// src/features/compras/estado.ts
import type { EstadoCompra } from './types'

export type TonoCompra = 'recibido' | 'rechazado' | 'borrador'

export function tonoCompra(estado: EstadoCompra): TonoCompra {
  if (estado === 'CONFIRMADA') return 'recibido'
  if (estado === 'ANULADA') return 'rechazado'
  return 'borrador'
}
