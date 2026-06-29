export interface PagedResult<T> {
  items: T[]
  totalItems: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

export const TIPO_INVENTARIO = { VENTAS: 0, MOBILIARIO_EQUIPO: 1, INSUMOS: 2 } as const
export const TIPO_IMPUESTO = { GRAVADO: 1, EXENTO: 2, NO_SUJETO: 3 } as const
export const MOTIVOS_AJUSTE = ['CORRECCION', 'MERMA', 'FALTANTE', 'SOBRANTE', 'DAÑADO', 'OTRO'] as const

export interface ProductoTributo {
  codigo: string
  tipoCalculo?: string | null
  valor?: number | null
}

export interface SucursalAsignada { sucursalId: number; sucursalNombre?: string }

export interface ProductoListItem {
  id: number
  codigo: string
  nombre: string
  descripcion?: string | null
  precioVenta: number
  precioCosto?: number | null
  activo: boolean
  unidadMedida: string
  tipoItem: string
  categoriaId?: number | null
  categoriaNombre?: string | null
  marcaId?: number | null
  marcaNombre?: string | null
  tipoImpuesto: number
  porcentajeIVA?: number | null
  precioIncluyeIva: boolean
  costoIncluyeIva: boolean
  codigoBarras?: string | null
  stockMinimo?: number | null
  stockMaximo?: number | null
  puntoReorden?: number | null
  permiteVentaSinStock?: boolean | null
  fechaCreacion: string
  accesoTodasSucursales: boolean
  tipoInventario: number
  fechaAdquisicion?: string | null
  aniosVidaUtil?: number | null
  valorActual?: number | null
  valorResidual?: number | null
  tributosAdicionales: ProductoTributo[]
}

export interface ProductoDetalle {
  id: number
  codigo: string
  nombre: string
  descripcion?: string | null
  precioVenta: number
  activo: boolean
  fechaCreacion: string
  unidadMedida: { id: number; valor: string }
  tipoItem: { id: number; valor: string }
  emisorId: number
  codigoBarras?: string | null
  categoriaId?: number | null
  categoriaNombre?: string | null
  marcaId?: number | null
  marcaNombre?: string | null
  precioCosto?: number | null
  accesoTodasSucursales: boolean
  sucursales: SucursalAsignada[]
  tipoImpuesto: number
  porcentajeIVA?: number | null
  precioIncluyeIva: boolean
  costoIncluyeIva: boolean
  stockMinimo?: number | null
  stockMaximo?: number | null
  puntoReorden?: number | null
  permiteVentaSinStock?: boolean | null
  tipoInventario: number
  fechaAdquisicion?: string | null
  aniosVidaUtil?: number | null
  valorActual?: number | null
  valorResidual?: number | null
  tributosAdicionales: ProductoTributo[]
}

export interface CrearProductoDto {
  codigo: string
  nombre: string
  descripcion?: string | null
  precioVenta: number
  catUnidadMedidaId: number
  catTipoItemId: number
  codigoBarras?: string | null
  categoriaId?: number | null
  marcaId?: number | null
  precioCosto?: number | null
  tipoImpuesto: number
  porcentajeIVA?: number | null
  precioIncluyeIva: boolean
  costoIncluyeIva: boolean
  stockMinimo?: number | null
  stockMaximo?: number | null
  puntoReorden?: number | null
  permiteVentaSinStock?: boolean | null
  tipoInventario: number
  fechaAdquisicion?: string | null
  aniosVidaUtil?: number | null
  valorActual?: number | null
  valorResidual?: number | null
  accesoTodasSucursales: boolean
  sucursalIds?: number[] | null
  tributosAdicionales?: ProductoTributo[] | null
}

export type ActualizarProductoDto = CrearProductoDto
export interface DesactivarProductoDto { motivo: string }

export interface Categoria {
  id: number
  codigo: string
  nombre: string
  descripcion?: string | null
  categoriaPadreId?: number | null
  categoriaPadreNombre?: string | null
  totalProductos: number
  activo: boolean
  fechaCreacion: string
}
export interface CrearCategoriaDto { codigo: string; nombre: string; descripcion?: string | null; categoriaPadreId?: number | null }

export interface Marca {
  id: number
  nombre: string
  descripcion?: string | null
  totalProductos: number
  activa: boolean
  fechaCreacion: string
}
export interface CrearMarcaDto { nombre: string; descripcion?: string | null }

export interface AjusteInventarioDto {
  productoId: number
  bodegaId: number
  cantidad: number
  motivo: string
  observaciones: string
}
export interface TrasladoInventarioDto {
  productoId: number
  bodegaOrigenId: number
  bodegaDestinoId: number
  cantidad: number
  observaciones?: string | null
}

export interface StockPorBodega {
  productoId: number
  productoCodigo: string
  productoNombre: string
  bodegaId: number
  bodegaNombre: string
  sucursalNombre: string
  cantidadDisponible: number
  cantidadReservada: number
  cantidadTotal: number
  costoPromedio: number
  valorStock: number
  fechaUltimoMovimiento?: string | null
  stockMinimo?: number | null
  stockMaximo?: number | null
}
export interface ProductoBajoMinimo {
  productoId: number; productoCodigo: string; productoNombre: string
  stockMinimo: number; stockActual: number; diferencia: number; estado: string
}
export interface ProductoSinMovimiento {
  productoId: number; productoCodigo: string; productoNombre: string
  stockActual: number; valorStock: number; diasSinMovimiento: number; ultimoMovimiento?: string | null
}
export interface MovimientoInventario {
  id: number; fechaMovimiento: string; tipoMovimiento: string; tipoDocumento: string
  numeroDocumento?: string | null; documentoId?: number | null
  productoId: number; productoCodigo: string; productoNombre: string
  bodegaId: number; bodegaNombre: string
  cantidad: number; costoUnitario: number; saldoAnterior: number; nuevoSaldo: number
  observaciones?: string | null; usuarioId?: number | null; usuarioNombre?: string | null
}
export interface KardexProducto {
  productoId: number; productoCodigo: string; productoNombre: string
  bodegaId?: number | null; bodegaNombre?: string | null
  fechaDesde: string; fechaHasta: string
  saldoInicial: number; totalEntradas: number; totalSalidas: number; saldoFinal: number
  movimientos: PagedResult<MovimientoInventario>
}
export interface ValoracionPorProducto {
  productoId: number; productoCodigo: string; productoNombre: string
  cantidad: number; costoPromedio: number; valorTotal: number; porcentajeDelTotal: number
}
export interface ValoracionInventario {
  bodegaId?: number | null; bodegaNombre?: string | null
  totalProductos: number; cantidadTotalUnidades: number; valorTotal: number
  detalleProductos: ValoracionPorProducto[]
}
export interface RotacionProducto {
  productoId: number; productoCodigo: string; productoNombre: string
  cantidadVendida: number; promedioStock: number; indiceRotacion: number
  diasPromediInventario: number; clasificacion: string
}
export interface RotacionAbcItem {
  productoId: number; productoCodigo: string; productoNombre: string
  unidadesVendidas: number; valorVendido: number; porcentajeAcumulado: number; clasificacion: string
}
export interface InventarioKPIs {
  totalProductos: number; valorTotalInventario: number; productosBajoMinimo: number; productosSinStock: number
  totalMovimientosUltimoMes: number; totalEntradasUltimoMes: number; totalSalidasUltimoMes: number
  costoMercanciaVendidaMesActual: number; valorComprasMesActual: number
  rotacionPromedioAnual: number; diasPromedioInventario: number
}
