export type Preset = 'hoy' | '7d' | '30d' | 'mes'
export interface Rango { fechaInicio: string; fechaFin: string }

function inicioDelDia(d: Date): Date { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
function finDelDia(d: Date): Date { const x = new Date(d); x.setHours(23, 59, 59, 999); return x }

export function rangoDePreset(preset: Preset, ahora: Date = new Date()): Rango {
  const fin = finDelDia(ahora)
  let inicio: Date
  switch (preset) {
    case 'hoy': inicio = inicioDelDia(ahora); break
    case '7d': { const d = new Date(ahora); d.setDate(d.getDate() - 6); inicio = inicioDelDia(d); break }
    case '30d': { const d = new Date(ahora); d.setDate(d.getDate() - 29); inicio = inicioDelDia(d); break }
    case 'mes': { const d = new Date(ahora.getFullYear(), ahora.getMonth(), 1); inicio = inicioDelDia(d); break }
  }
  return { fechaInicio: inicio.toISOString(), fechaFin: fin.toISOString() }
}

export function periodoAnterior(r: Rango): { fechaAnteriorInicio: string; fechaAnteriorFin: string } {
  const inicio = new Date(r.fechaInicio).getTime()
  const fin = new Date(r.fechaFin).getTime()
  const largo = fin - inicio
  const anteriorFin = new Date(inicio - 1)
  const anteriorInicio = new Date(inicio - 1 - largo)
  return { fechaAnteriorInicio: anteriorInicio.toISOString(), fechaAnteriorFin: anteriorFin.toISOString() }
}
