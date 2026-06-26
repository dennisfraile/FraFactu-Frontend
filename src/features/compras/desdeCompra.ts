// src/features/compras/desdeCompra.ts
// Helper para reconstruir los valores del form desde una compra existente (edición).
import { nuevaLineaProducto, nuevaLineaGasto, type CompraFormValues, type FormProductoLinea, type FormGastoLinea } from './mappers'
import type { CompraExternaDto } from './types'

export function desdeCompra(c: CompraExternaDto): CompraFormValues {
  return {
    proveedorId: c.proveedorId, sucursalId: c.sucursalId, numeroFactura: c.numeroFactura,
    fechaEmision: c.fechaEmision.slice(0, 10), observaciones: c.observaciones ?? '',
    productos: c.detalles.map<FormProductoLinea>((d) => ({ ...nuevaLineaProducto(), productoId: d.productoId, codigo: d.productoCodigo, descripcion: d.productoNombre, bodegaId: d.bodegaId, cantidad: d.cantidad, costoUnitario: d.costoUnitario, aplicaIva: d.iva > 0, ivaManual: d.iva, esParaInventario: d.esParaInventario })),
    gastos: c.gastos.map<FormGastoLinea>((g) => ({ ...nuevaLineaGasto(), descripcion: g.descripcion, monto: g.monto, catTipoGastoId: g.catTipoGastoId ?? null, centroCosto: g.centroCosto ?? '', cuentaContable: g.cuentaContable ?? '' })),
  }
}
