// src/features/compras/types.ts
// Tipos TS espejo de los DTOs del backend (camelCase en el JSON).

// Paginado: los Listar de compras/proveedores devuelven PagedResult<T>.
export interface PagedResult<T> {
  items: T[]
  totalItems: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

// ---- Proveedores ----
export interface ProveedorDto {
  id: number
  nit: string
  tipoDocumentoNombre: string
  nombre: string
  nombreComercial?: string | null
  direccion?: string | null
  telefono?: string | null
  email?: string | null
  contacto?: string | null
  sitioWeb?: string | null
  notas?: string | null
  activo: boolean
  totalCompras: number
  montoTotalCompras: number
  ultimaCompra?: string | null
  fechaCreacion: string
}

export interface CrearProveedorDto {
  nit: string
  nombre: string
  nombreComercial?: string
  direccion?: string
  telefono?: string
  email?: string
  contacto?: string
  sitioWeb?: string
  notas?: string
}

export interface ActualizarProveedorDto extends CrearProveedorDto {
  activo: boolean
}

export interface ListarProveedoresParams {
  pagina?: number
  tamanoPagina?: number
  filtro?: string
  soloActivos?: boolean
}

// ---- Catálogo tipos de gasto ----
export interface TipoGastoDto {
  id: number
  codigo: string
  nombre: string
  descripcion?: string | null
  activo: boolean
}

// ---- Compras externas (usados desde T7) ----
export type EstadoCompra = 'BORRADOR' | 'CONFIRMADA' | 'ANULADA'

export interface CompraDetalleDto {
  id: number
  compraExternaId: number
  productoId: number
  productoCodigo: string
  productoNombre: string
  bodegaId: number
  bodegaNombre: string
  cantidad: number
  costoUnitario: number
  subtotal: number
  iva: number
  total: number
  esParaInventario: boolean
}

export interface GastoAdministrativoDto {
  id: number
  compraExternaId: number
  catTipoGastoId?: number | null
  tipoGastoNombre?: string | null
  descripcion: string
  monto: number
  centroCosto?: string | null
  cuentaContable?: string | null
  fechaCreacion: string
}

export interface CompraExternaDto {
  id: number
  proveedorId: number
  proveedorNit: string
  proveedorNombre: string
  sucursalId: number
  sucursalNombre: string
  numeroFactura: string
  fechaEmision: string
  fechaRegistro: string
  subtotal: number
  iva: number
  total: number
  estado: EstadoCompra
  fechaConfirmacion?: string | null
  fechaAnulacion?: string | null
  observaciones?: string | null
  origen: 'MANUAL' | 'DTE'
  codigoGeneracionDte?: string | null
  selloRecibidoDte?: string | null
  tipoDte?: string | null
  numeroControlDte?: string | null
  detalles: CompraDetalleDto[]
  gastos: GastoAdministrativoDto[]
  totalProductosInventario: number
  totalGastosAdministrativos: number
  cantidadItems: number
}

export interface CrearCompraDetalleDto {
  productoId: number
  bodegaId?: number | null
  cantidad: number
  costoUnitario: number
  subtotal: number
  iva: number
  total: number
  esParaInventario: boolean
}

export interface CrearGastoDto {
  catTipoGastoId?: number | null
  descripcion: string
  monto: number
  centroCosto?: string
  cuentaContable?: string
}

export interface CrearCompraExternaDto {
  proveedorId: number
  sucursalId: number
  numeroFactura: string
  fechaEmision: string
  subtotal: number
  iva: number
  total: number
  observaciones?: string
  detalles: CrearCompraDetalleDto[]
  gastos: CrearGastoDto[]
}

export type ActualizarCompraExternaDto = CrearCompraExternaDto

export interface ConfirmarCompraDto {
  observaciones?: string
}

export interface AnularCompraDto {
  motivo: string
}

export interface ListarComprasParams {
  pagina?: number
  tamanoPagina?: number
  proveedorId?: number
  sucursalId?: number
  bodegaId?: number
  estado?: string
  fechaDesde?: string
  fechaHasta?: string
  search?: string
  sortBy?: string
  sortDesc?: boolean
}
