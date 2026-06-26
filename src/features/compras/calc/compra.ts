// Redondeo a 2 decimales (centavos), estable frente a errores de coma flotante.
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export interface LineaProductoInput {
  cantidad: number
  costoUnitario: number
  aplicaIva: boolean
  ivaManual?: number // si se define, sobrescribe el 13% automático
}

export interface LineaProductoCalc {
  subtotal: number
  iva: number
  total: number
}

export function calcLineaProducto({ cantidad, costoUnitario, aplicaIva, ivaManual }: LineaProductoInput): LineaProductoCalc {
  const subtotal = round2(cantidad * costoUnitario)
  const iva = ivaManual !== undefined ? round2(ivaManual) : aplicaIva ? round2(subtotal * 0.13) : 0
  return { subtotal, iva, total: round2(subtotal + iva) }
}

export interface TotalesCompra {
  subtotal: number
  iva: number
  total: number
}

// Subtotal del header = subtotales de productos + montos de gasto (los gastos no llevan IVA).
// IVA del header = suma del IVA de los productos. Total = subtotal + IVA.
// Esto satisface las dos validaciones del backend: Total=Subtotal+IVA y Σ(det.Total)+Σ(gasto.Monto)≈Total.
export function calcTotalesCompra(productos: LineaProductoCalc[], gastos: { monto: number }[]): TotalesCompra {
  const subProductos = productos.reduce((s, p) => s + p.subtotal, 0)
  const ivaProductos = productos.reduce((s, p) => s + p.iva, 0)
  const totalGastos = gastos.reduce((s, g) => s + g.monto, 0)
  const subtotal = round2(subProductos + totalGastos)
  const iva = round2(ivaProductos)
  return { subtotal, iva, total: round2(subtotal + iva) }
}
