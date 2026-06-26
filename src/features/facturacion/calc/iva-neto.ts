import { round } from './round'
import type { ItemInput, ItemCalculado, ResumenNumerico } from './types'

const TASA_IVA = 0.13

// Cálculo compartido por CCF (03), NC (05) y ND (06): precio NETO, IVA agregado (base × 0.13).
export function calcItemIvaNeto(input: ItemInput): ItemCalculado {
  const base = round(input.precioUni * input.cantidad - (input.montoDescuento ?? 0), 2)
  const r: ItemCalculado = { ventaGravada: 0, ventaExenta: 0, ventaNoSuj: 0, ivaItem: 0 }
  if (input.tipoImpuesto === 1) {
    r.ventaGravada = base
    r.ivaItem = round(base * TASA_IVA, 2)
  } else if (input.tipoImpuesto === 2) {
    r.ventaExenta = base
  } else {
    r.ventaNoSuj = base
  }
  return r
}

export function calcResumenIvaNeto(items: ItemCalculado[]): ResumenNumerico {
  const totalGravada = round(items.reduce((s, i) => s + i.ventaGravada, 0), 2)
  const totalExenta = round(items.reduce((s, i) => s + i.ventaExenta, 0), 2)
  const totalNoSuj = round(items.reduce((s, i) => s + i.ventaNoSuj, 0), 2)
  const totalIva = round(items.reduce((s, i) => s + i.ivaItem, 0), 2)
  const subTotal = round(totalGravada + totalExenta + totalNoSuj, 2)
  const montoTotalOperacion = round(subTotal + totalIva, 2)
  const totalPagar = montoTotalOperacion
  return { totalGravada, totalExenta, totalNoSuj, totalIva, subTotal, totalPagar, montoTotalOperacion, reteRenta: 0 }
}
