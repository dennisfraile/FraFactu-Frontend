import type { DefinicionCuotaDto } from '../types'

export type ModoCuota = 'monto' | 'porcentaje'

export interface CuotaDraft {
  fechaPactada: string
  valor: number
}

export function montoDeCuota(d: CuotaDraft, modo: ModoCuota, total: number): number {
  return modo === 'monto' ? d.valor : Math.round((d.valor / 100) * total * 100) / 100
}

export function validarCuotas(drafts: CuotaDraft[], modo: ModoCuota, total: number): string | null {
  if (drafts.length < 2) return 'Un plan requiere al menos 2 cuotas.'
  if (drafts.some((d) => !d.fechaPactada)) return 'Cada cuota necesita una fecha pactada.'
  if (drafts.some((d) => !(d.valor > 0))) return 'El valor de cada cuota debe ser mayor a 0.'

  for (let i = 1; i < drafts.length; i++) {
    if (drafts[i].fechaPactada <= drafts[i - 1].fechaPactada)
      return 'Las fechas de las cuotas deben ir en orden ascendente.'
  }

  if (modo === 'porcentaje') {
    const suma = drafts.reduce((acc, d) => acc + d.valor, 0)
    if (Math.abs(suma - 100) > 0.01) return `Los porcentajes deben sumar 100 (suman ${suma.toFixed(2)}).`
    return null
  }

  const suma = drafts.reduce((acc, d) => acc + d.valor, 0)
  if (Math.abs(suma - total) > 0.01)
    return `La suma de las cuotas (${suma.toFixed(2)}) no coincide con el total (${total.toFixed(2)}).`
  return null
}

export function construirDefiniciones(drafts: CuotaDraft[], modo: ModoCuota): DefinicionCuotaDto[] {
  return drafts.map((d, i) =>
    modo === 'monto'
      ? { numero: i + 1, monto: d.valor, fechaPactada: d.fechaPactada }
      : { numero: i + 1, porcentaje: d.valor, fechaPactada: d.fechaPactada },
  )
}
