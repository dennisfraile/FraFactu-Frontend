import { round } from './round'
import type { ItemInput, ItemCalculado, ResumenNumerico } from './types'

const TASA_IVA = 0.13

// Factura 01: el precio unitario INCLUYE IVA. Se extrae el IVA de la base gravada.
export function calcularItemFactura01(input: ItemInput): ItemCalculado {
  const base = round(input.precioUni * input.cantidad - (input.montoDescuento ?? 0), 2)
  const r: ItemCalculado = { ventaGravada: 0, ventaExenta: 0, ventaNoSuj: 0, ivaItem: 0 }
  if (input.tipoImpuesto === 1) {
    r.ventaGravada = base
    r.ivaItem = round((base / (1 + TASA_IVA)) * TASA_IVA, 2)
  } else if (input.tipoImpuesto === 2) {
    r.ventaExenta = base
  } else {
    r.ventaNoSuj = base
  }
  return r
}

export function calcularResumenFactura01(items: ItemCalculado[]): ResumenNumerico {
  const totalGravada = round(items.reduce((s, i) => s + i.ventaGravada, 0), 2)
  const totalExenta = round(items.reduce((s, i) => s + i.ventaExenta, 0), 2)
  const totalNoSuj = round(items.reduce((s, i) => s + i.ventaNoSuj, 0), 2)
  const totalIva = round(items.reduce((s, i) => s + i.ivaItem, 0), 2)
  const subTotal = round(totalGravada + totalExenta + totalNoSuj, 2)
  // En Factura 01 el IVA ya está incluido en la venta gravada: el total = subtotal.
  const totalPagar = subTotal
  return { totalGravada, totalExenta, totalNoSuj, totalIva, subTotal, totalPagar }
}

export function pagosCuadran(montosPago: number[], totalPagar: number): boolean {
  const suma = round(montosPago.reduce((s, m) => s + m, 0), 2)
  return suma === round(totalPagar, 2)
}
