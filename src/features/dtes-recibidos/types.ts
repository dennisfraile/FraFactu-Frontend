// src/features/dtes-recibidos/types.ts
// Tipos TS espejo de los DTOs del backend (camelCase en el JSON).

// El listado de DTEs devuelve este envoltorio (≠ PagedResult de compras).
export interface PagedDtes<T> {
  items: T[]
  total: number
  pagina: number
  tamanoPagina: number
  totalPaginas: number
}

export type EstadoDteRecibido = 'PENDIENTE' | 'VINCULADO' | 'DESCARTADO'
export type AccionMapeo = 'PRODUCTO_EXISTENTE' | 'PRODUCTO_NUEVO' | 'GASTO'

export interface DteRecibidoResumenDto {
  id: number
  codigoGeneracion: string
  tipoDte: string
  numeroControl?: string | null
  fechaEmision: string
  emisorNit: string
  emisorNombre: string
  total: number
  estado: EstadoDteRecibido
  compraExternaId?: number | null
  fechaCreacion: string
}

export interface DteRecibidoDto {
  id: number
  codigoGeneracion: string
  selloRecibido?: string | null
  tipoDte: string
  numeroControl?: string | null
  fechaEmision: string
  emisorNit: string
  emisorNombre: string
  emisorNrc?: string | null
  receptorNit?: string | null
  receptorNombre?: string | null
  jsonDte: string
  montoGravado: number
  montoExento: number
  montoNoSujeto: number
  subTotal: number
  iva: number
  total: number
  estado: EstadoDteRecibido
  compraExternaId?: number | null
  motivoDescarte?: string | null
  emailOrigen?: string | null
  fechaRecepcionEmail?: string | null
  fechaCreacion: string
  fechaActualizacion?: string | null
}

export interface ListarDtesParams {
  pagina?: number
  tamanoPagina?: number
  estado?: string
  tipoDte?: string
  emisorNit?: string
  fechaDesde?: string
  fechaHasta?: string
  search?: string
  sortBy?: string
  sortDesc?: boolean
}

export interface DteEstadisticasDto {
  totalPendientes: number
  totalVinculados: number
  totalDescartados: number
  total: number
  montoTotalPendientes: number
  ultimaLectura?: string | null
}

// ---- Carga manual ----
export interface CargaArchivoResultado {
  archivo: string
  resultado: string // "Cargado" | "Duplicado" | "NoEsCCF" | "ReceptorInvalido" | "ContenidoInvalido" | "ErrorLectura"
  codigoGeneracion?: string | null
  mensaje: string
}
export interface CargaMasivaResponse {
  totalArchivos: number
  cargados: number
  duplicados: number
  rechazados: number
  resultados: CargaArchivoResultado[]
}

// ---- Lectura de correo (asíncrona) ----
export interface EncolarLecturaRequest {
  mesInicio?: string // "YYYY-MM"
  mesFin?: string
}
export interface EncolarLecturaResponse {
  jobId: number
  estado: string
  mensaje: string
}
export interface EstadoLecturaJob {
  jobId: number
  estado: string // ENCOLADO | EN_PROGRESO | COMPLETADO | FALLIDO
  fechaCreacion: string
  fechaInicio?: string | null
  fechaFin?: string | null
  correosProcesados: number
  dtesEncontrados: number
  dtesNuevos: number
  dtesDuplicados: number
  errores: number
  mensajeError?: string | null
  dtesIgnorados: number
  rangoDesde?: string | null
  rangoHasta?: string | null
  esAutomatico: boolean
  terminado: boolean
}

export interface ConfiguracionLecturaDto {
  lecturaCorreoHabilitada: boolean
}

// ---- Mapeo (asistente) ----
export interface ProductoNuevoMapeoDto {
  codigo: string
  nombre: string
  catTipoItemId: number
  catUnidadMedidaId: number
  categoriaId?: number | null
  tipoInventario: number // 0=Ventas, 1=MobiliarioEquipo, 2=Insumos
  aniosVidaUtil?: number | null
  valorResidual?: number | null
}
export interface MapearItemDto {
  descripcionDte: string
  montoDte: number
  accion: AccionMapeo
  productoId?: number | null
  productoNuevo?: ProductoNuevoMapeoDto | null
  cantidad?: number | null
  bodegaId?: number | null
  costoUnitario?: number | null
  catTipoGastoId?: number | null
}
export interface MapearDteCompraDto {
  sucursalId: number
  items: MapearItemDto[]
}
export interface MapearDteCompraResponse {
  compraId: number
  totalMapeado: number
  totalDte: number
  itemsProductos: number
  itemsGastos: number
  productosCreados: number
}

// ---- Gmail / perfil emisor ----
export interface EmisorPerfilGmail {
  gmailEmail?: string | null
  gmailConectado: boolean
  lecturaCorreoHabilitada: boolean
  ultimaLecturaCorreo?: string | null
}
