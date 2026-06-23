// src/features/facturacion/types.ts
// Tipos TS espejo de los DTOs reales del backend (camelCase en el JSON).

export type TipoDte = '01' | '03' | '14' | '05' | '06'

export interface CatalogoItem {
  id: number
  codigo: string
  valor: string
}

// Catálogos con campos extra para cascada / clasificación.
export interface MunicipioItem extends CatalogoItem { codigoDepartamento: string }
export interface DistritoItem extends CatalogoItem { codigoDepartamento: string; codigoMunicipio: string }

export interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

// ---- Request de emisión ----
export interface IdentificacionDto {
  version: number
  tipoDte: TipoDte
  tipoModelo: number
  tipoOperacion: number
  crearEventoAutomatico: boolean
  fechaEmision: string // yyyy-MM-dd
  horaEmision: string // HH:mm:ss
  tipoMoneda: string // 'USD'
}

export interface DireccionDto {
  departamento: string
  municipio: string
  distrito?: string
  complemento: string
}

export interface ReceptorDteDto {
  tipoDocumento?: string
  numDocumento?: string
  nrc?: string
  nombre: string
  nombreComercial?: string
  codActividad?: string
  descActividad?: string
  direccion?: DireccionDto
  telefono?: string
  correo?: string
}

export interface ItemDocumentoDto {
  numItem: number
  tipoItem: number
  cantidad: number
  codigo?: string
  uniMedida: number
  descripcion: string
  precioUni: number
  montoDescuento?: number
  ventaGravada: number
  ventaExenta: number
  ventaNoSuj: number
  ivaItem: number
  tributos?: string[] | null
  productoId?: number
  bodegaId?: number
  precioIncluyeIva?: boolean
}

export interface PagoDto {
  catFormaPagoId: number
  monto: number
  referencia?: string
  catPlazoId?: number
  periodo?: number
}

export interface ResumenDto {
  totalNoSuj: number
  totalExenta: number
  totalGravada: number
  subTotal: number
  totalIva: number
  ivaRete1?: number
  reteRenta?: number
  totalDescu?: number
  totalPagar: number
  totalLetras: string
  condicionOperacion: number
  pagos: PagoDto[]
}

export interface CreateFacturaDto {
  identificacion: IdentificacionDto
  sucursalId: number
  receptorId?: number | null
  receptor?: ReceptorDteDto | null
  vendedorId?: number | null
  cuerpoDocumento: ItemDocumentoDto[]
  resumen: ResumenDto
  observaciones?: string
}

// ---- Respuestas ----
export interface FacturaResponse {
  id: number
  codigoGeneracion: string
  numeroControl: string
  selloRecepcion?: string | null
  estado: string
  estadoHacienda?: string | null
  identificacion: IdentificacionDto
  receptor?: ReceptorDteDto | null
  cuerpoDocumento: ItemDocumentoDto[]
  resumen: ResumenDto
  fechaEmision: string
}

export interface FacturaListItem {
  id: number
  numeroControl: string
  codigoGeneracion: string
  fechaEmision: string
  tipoDte: string
  tipoDocumento: string
  receptorNombre: string
  receptorNumeroDocumento: string
  totalPagar: number
  estadoHacienda: string
  selloRecepcion?: string | null
  ambiente: string
}

export interface AnularFacturaDto {
  motivo: string
}

export interface PuedeInvalidarResult {
  puedeInvalidar: boolean
  horasRestantes: number
  fechaLimite: string
  mensaje: string
}

// ---- Autocompletar / selección ----
export interface ReceptorListItem {
  id: number
  tipoDocumentoNombre: string
  numeroDocumento: string | null
  nombreRazonSocial: string
  correoElectronico: string
  nrc: string
}

export interface ProductoListItem {
  id: number
  codigo: string
  nombre: string
  descripcion?: string
  precioVenta: number
  unidadMedida: string
  tipoItem: string
  tipoImpuesto: number // 1=Gravado, 2=Exento, 3=NoSujeto
  precioIncluyeIva: boolean
}

export interface Vendedor {
  id: number
  codigo: string
  nombre: string
  activo: boolean
}

export interface Sucursal {
  id: number
  nombre: string
}
