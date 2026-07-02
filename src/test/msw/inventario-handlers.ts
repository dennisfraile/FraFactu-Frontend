import { http, HttpResponse } from 'msw'
import type {
  ProductoListItem, ProductoDetalle, Categoria, Marca, StockPorBodega, MovimientoInventario,
  KardexProducto, InventarioKPIs,
} from '@/features/inventario/types'

const base = 'http://localhost:8080/api'

export const productoEjemplo: ProductoListItem = {
  id: 2, codigo: 'P001', nombre: 'Producto de prueba', precioVenta: 56.5, precioCosto: 30, activo: true,
  unidadMedida: 'Unidad', tipoItem: 'Bienes', categoriaId: 1, categoriaNombre: 'General', marcaId: null, marcaNombre: null,
  tipoImpuesto: 1, porcentajeIVA: 13, precioIncluyeIva: true, costoIncluyeIva: false, codigoBarras: null,
  stockMinimo: 5, stockMaximo: 100, puntoReorden: 10, permiteVentaSinStock: false, fechaCreacion: '2026-06-25',
  accesoTodasSucursales: true, tipoInventario: 0, tributosAdicionales: [],
}
export const productoDetalleEjemplo: ProductoDetalle = {
  id: 2, codigo: 'P001', nombre: 'Producto de prueba', precioVenta: 56.5, activo: true, fechaCreacion: '2026-06-25',
  unidadMedida: { id: 39, valor: 'Unidad' }, tipoItem: { id: 1, valor: 'Bienes' }, emisorId: 3,
  codigoBarras: null, categoriaId: 1, categoriaNombre: 'General', marcaId: null, marcaNombre: null, precioCosto: 30,
  accesoTodasSucursales: true, sucursales: [], tipoImpuesto: 1, porcentajeIVA: 13, precioIncluyeIva: true,
  costoIncluyeIva: false, stockMinimo: 5, stockMaximo: 100, puntoReorden: 10, permiteVentaSinStock: false,
  tipoInventario: 0, tributosAdicionales: [],
}
export const categoriaEjemplo: Categoria = { id: 1, codigo: 'C1', nombre: 'General', totalProductos: 1, activo: true, fechaCreacion: '2026-06-25' }
export const marcaEjemplo: Marca = { id: 1, nombre: 'Genérica', totalProductos: 0, activa: true, fechaCreacion: '2026-06-25' }
export const stockEjemplo: StockPorBodega = {
  productoId: 2, productoCodigo: 'P001', productoNombre: 'Producto de prueba', bodegaId: 1, bodegaNombre: 'Bodega Principal',
  sucursalNombre: 'Casa Matriz', cantidadDisponible: 8, cantidadReservada: 0, cantidadTotal: 8, costoPromedio: 30,
  valorStock: 240, fechaUltimoMovimiento: '2026-06-27', stockMinimo: 5, stockMaximo: 100,
}
export const movimientoEjemplo: MovimientoInventario = {
  id: 1, fechaMovimiento: '2026-06-27', tipoMovimiento: 'ENTRADA', tipoDocumento: 'COMPRA_EXTERNA', numeroDocumento: 'C-1',
  documentoId: 1, productoId: 2, productoCodigo: 'P001', productoNombre: 'Producto de prueba', bodegaId: 1, bodegaNombre: 'Bodega Principal',
  cantidad: 5, costoUnitario: 30, saldoAnterior: 3, nuevoSaldo: 8, observaciones: null, usuarioId: 1, usuarioNombre: 'Ana',
}
export const kardexEjemplo: KardexProducto = {
  productoId: 2, productoCodigo: 'P001', productoNombre: 'Producto de prueba', bodegaId: 1, bodegaNombre: 'Bodega Principal',
  fechaDesde: '2026-06-01', fechaHasta: '2026-06-30', saldoInicial: 3, totalEntradas: 5, totalSalidas: 0, saldoFinal: 8,
  movimientos: { items: [movimientoEjemplo], totalItems: 1, pageNumber: 1, pageSize: 50, totalPages: 1 },
}
export const kpisEjemplo: InventarioKPIs = {
  totalProductos: 1, valorTotalInventario: 240, productosBajoMinimo: 0, productosSinStock: 0,
  totalMovimientosUltimoMes: 1, totalEntradasUltimoMes: 1, totalSalidasUltimoMes: 0,
  costoMercanciaVendidaMesActual: 0, valorComprasMesActual: 150, rotacionPromedioAnual: 0, diasPromedioInventario: 0,
}

const page = <T,>(item: T) => ({ items: [item], totalItems: 1, pageNumber: 1, pageSize: 50, totalPages: 1 })
const pageF2 = <T,>(item: T) => ({ items: [item], totalCount: 1, pageNumber: 1, pageSize: 20, totalPages: 1 })

export const inventarioHandlers = [
  http.get(`${base}/productosservicios`, () => HttpResponse.json(pageF2(productoEjemplo))),
  http.get(`${base}/productosservicios/2`, () => HttpResponse.json(productoDetalleEjemplo)),
  http.post(`${base}/productosservicios`, () => HttpResponse.json(productoDetalleEjemplo, { status: 201 })),
  http.put(`${base}/productosservicios/2`, () => HttpResponse.json(productoDetalleEjemplo)),
  http.patch(`${base}/productosservicios/:id/toggle-active`, () => HttpResponse.json({ ok: true })),
  http.post(`${base}/productosservicios/:id/desactivar`, () => HttpResponse.json({ ok: true })),
  http.get(`${base}/categorias`, () => HttpResponse.json([categoriaEjemplo])),
  http.post(`${base}/categorias`, () => HttpResponse.json(categoriaEjemplo, { status: 201 })),
  http.put(`${base}/categorias/:id`, () => HttpResponse.json(categoriaEjemplo)),
  http.patch(`${base}/categorias/:id/toggle-active`, () => HttpResponse.json({ ok: true })),
  http.delete(`${base}/categorias/:id`, () => new HttpResponse(null, { status: 204 })),
  http.get(`${base}/marcas`, () => HttpResponse.json([marcaEjemplo])),
  http.post(`${base}/marcas`, () => HttpResponse.json(marcaEjemplo, { status: 201 })),
  http.put(`${base}/marcas/:id`, () => HttpResponse.json(marcaEjemplo)),
  http.patch(`${base}/marcas/:id/toggle-active`, () => HttpResponse.json({ ok: true })),
  http.delete(`${base}/marcas/:id`, () => new HttpResponse(null, { status: 204 })),
  http.post(`${base}/inventario/ajustes`, () => HttpResponse.json({ ok: true })),
  http.post(`${base}/inventario/traslado`, () => HttpResponse.json({ ok: true })),
  http.get(`${base}/inventarioreportes/stock`, () => HttpResponse.json(page(stockEjemplo))),
  http.get(`${base}/inventarioreportes/stock/bajo-minimo`, () => HttpResponse.json([])),
  http.get(`${base}/inventarioreportes/stock/sin-movimiento`, () => HttpResponse.json([])),
  http.get(`${base}/inventarioreportes/movimientos`, () => HttpResponse.json(page(movimientoEjemplo))),
  http.get(`${base}/inventarioreportes/kardex/:id`, () => HttpResponse.json(kardexEjemplo)),
  http.get(`${base}/inventarioreportes/valoracion`, () => HttpResponse.json({ bodegaId: null, bodegaNombre: null, totalProductos: 1, cantidadTotalUnidades: 8, valorTotal: 240, detalleProductos: [] })),
  http.get(`${base}/inventarioreportes/rotacion`, () => HttpResponse.json([])),
  http.get(`${base}/inventarioreportes/rotacion-abc`, () => HttpResponse.json([])),
  http.get(`${base}/inventarioreportes/kpis`, () => HttpResponse.json(kpisEjemplo)),
]
