// src/features/dtes-recibidos/estado.ts
import type { EstadoDteRecibido } from './types'

export type TonoDte = 'recibido' | 'rechazado' | 'borrador'

export function tonoDteRecibido(estado: EstadoDteRecibido): TonoDte {
  if (estado === 'VINCULADO') return 'recibido'
  if (estado === 'DESCARTADO') return 'rechazado'
  return 'borrador'
}
