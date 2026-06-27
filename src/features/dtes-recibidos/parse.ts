import { round2 } from './calc/mapeo'

export interface DteLineaParsed {
  numItem: number
  codigo: string | null
  descripcion: string
  cantidad: number
  precioUnitario: number
  montoDescuento: number
  ventaGravada: number
  ventaExenta: number
  ventaNoSujeta: number
  unidadMedida: number | null
  // Monto neto por línea (sin IVA): ventaGravada + ventaExenta + ventaNoSujeta - montoDescuento.
  montoNeto: number
  // Monto sembrado con IVA por línea (gravada*1.13 + exenta + noSujeta - descuento).
  // Es un valor por defecto editable; el cuadre final lo valida el usuario.
  montoConIva: number
}

interface ItemCrudo {
  numItem?: number
  codigo?: string | null
  descripcion?: string
  cantidad?: number
  precioUni?: number
  montoDescu?: number
  ventaGravada?: number
  ventaExenta?: number
  ventaNoSuj?: number
  uniMedida?: number | null
}

export function parseDteLineas(jsonDte: string): DteLineaParsed[] {
  let raw: { cuerpoDocumento?: ItemCrudo[] }
  try {
    raw = JSON.parse(jsonDte)
  } catch {
    return []
  }
  const cuerpo = Array.isArray(raw?.cuerpoDocumento) ? raw.cuerpoDocumento : []
  return cuerpo.map((it, i) => {
    const ventaGravada = Number(it.ventaGravada ?? 0)
    const ventaExenta = Number(it.ventaExenta ?? 0)
    const ventaNoSujeta = Number(it.ventaNoSuj ?? 0)
    const montoDescuento = Number(it.montoDescu ?? 0)
    return {
      numItem: Number(it.numItem ?? i + 1),
      codigo: it.codigo ?? null,
      descripcion: String(it.descripcion ?? ''),
      cantidad: Number(it.cantidad ?? 0),
      precioUnitario: Number(it.precioUni ?? 0),
      montoDescuento,
      ventaGravada,
      ventaExenta,
      ventaNoSujeta,
      unidadMedida: it.uniMedida != null ? Number(it.uniMedida) : null,
      montoNeto: round2(ventaGravada + ventaExenta + ventaNoSujeta - montoDescuento),
      montoConIva: round2(ventaGravada * 1.13 + ventaExenta + ventaNoSujeta - montoDescuento),
    }
  })
}
