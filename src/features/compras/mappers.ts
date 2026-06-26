// src/features/compras/mappers.ts
import { calcLineaProducto, calcTotalesCompra } from './calc/compra'
import type { CrearCompraExternaDto, CrearCompraDetalleDto, CrearGastoDto } from './types'

export interface FormProductoLinea {
  productoId: number | null
  codigo?: string
  descripcion: string
  bodegaId: number | null
  cantidad: number
  costoUnitario: number
  aplicaIva: boolean
  ivaManual?: number // IVA editado a mano; si undefined, se calcula 13% (o 0 si !aplicaIva)
  esParaInventario: boolean
}

export interface FormGastoLinea {
  descripcion: string
  monto: number
  catTipoGastoId: number | null
  centroCosto: string
  cuentaContable: string
}

export interface CompraFormValues {
  proveedorId: number | null
  sucursalId: number | null
  numeroFactura: string
  fechaEmision: string // yyyy-MM-dd
  observaciones: string
  productos: FormProductoLinea[]
  gastos: FormGastoLinea[]
}

export function nuevaLineaProducto(): FormProductoLinea {
  return { productoId: null, descripcion: '', bodegaId: null, cantidad: 1, costoUnitario: 0, aplicaIva: true, esParaInventario: true }
}

export function nuevaLineaGasto(): FormGastoLinea {
  return { descripcion: '', monto: 0, catTipoGastoId: null, centroCosto: '', cuentaContable: '' }
}

export function buildCrearCompraDto(v: CompraFormValues): CrearCompraExternaDto {
  const detalles: CrearCompraDetalleDto[] = v.productos.map((p) => {
    const c = calcLineaProducto({ cantidad: p.cantidad, costoUnitario: p.costoUnitario, aplicaIva: p.aplicaIva, ivaManual: p.ivaManual })
    return {
      productoId: p.productoId ?? 0,
      bodegaId: p.esParaInventario ? p.bodegaId : null,
      cantidad: p.cantidad,
      costoUnitario: p.costoUnitario,
      subtotal: c.subtotal,
      iva: c.iva,
      total: c.total,
      esParaInventario: p.esParaInventario,
    }
  })
  const gastos: CrearGastoDto[] = v.gastos.map((g) => ({
    catTipoGastoId: g.catTipoGastoId,
    descripcion: g.descripcion.trim(),
    monto: g.monto,
    centroCosto: g.centroCosto.trim() || undefined,
    cuentaContable: g.cuentaContable.trim() || undefined,
  }))
  const calcProductos = v.productos.map((p) => calcLineaProducto({ cantidad: p.cantidad, costoUnitario: p.costoUnitario, aplicaIva: p.aplicaIva, ivaManual: p.ivaManual }))
  const totales = calcTotalesCompra(calcProductos, gastos.map((g) => ({ monto: g.monto })))
  return {
    proveedorId: v.proveedorId ?? 0,
    sucursalId: v.sucursalId ?? 0,
    numeroFactura: v.numeroFactura.trim(),
    fechaEmision: v.fechaEmision,
    subtotal: totales.subtotal,
    iva: totales.iva,
    total: totales.total,
    observaciones: v.observaciones.trim() || undefined,
    detalles,
    gastos,
  }
}
