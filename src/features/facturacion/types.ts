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
  // numeroControl y codigoGeneracion: el validador del backend los exige (NotEmpty + formato),
  // pero el servicio los regenera y descarta. Se envían placeholders válidos.
  numeroControl: string
  codigoGeneracion: string
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
  compra?: number // FSE (14): monto de compra al sujeto excluido.
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

export interface ResumenTributoDto {
  codigo: string
  descripcion: string
  valor: number
}

export interface ResumenDto {
  totalNoSuj: number
  totalExenta: number
  totalGravada: number
  subTotal: number
  totalIva: number
  ivaRete1?: number
  reteRenta?: number
  totalCompras?: number // FSE (14)
  descu?: number // FSE (14): descuento global
  montoTotalOperacion?: number // CCF (03)
  totalDescu?: number
  totalPagar: number
  totalLetras: string
  condicionOperacion: number
  pagos: PagoDto[]
  tributos?: ResumenTributoDto[]
}

export interface CreateFacturaDto {
  identificacion: IdentificacionDto
  cajaId?: number | null
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

// Caja registradora (POS). Requerida para emitir Factura 01.
export interface CajaDto {
  id: number
  sucursalId: number
  codigo: string
  nombre: string
  activo: boolean
  codPuntoVenta: string
  codPuntoVentaMH: string
}

// Bodega (almacén). Requerida por ítem de tipo Bien (producto físico).
export interface BodegaItem {
  id: number
  codigo: string
  nombre: string
  sucursalId: number
  esPrincipal: boolean
  activa: boolean
}

// ---- Creación de receptor (quick-create) ----
export interface CrearReceptorDto {
  catTipoDocumentoId?: number | null // Id de catálogo (NO el código MH).
  numeroDocumento?: string
  nombreRazonSocial: string
  nrc?: string
  codigoActividad?: string
  descripcionActividad?: string
  catDepartamentoId?: number | null
  catMunicipioId?: number | null
  catDistritoId?: number | null
  direccion?: string
  correoElectronico?: string
  telefono?: string
}

export interface ReceptorDto {
  id: number
  nombreRazonSocial: string
  numeroDocumento: string | null
  nrc: string | null
  correoElectronico: string | null
}

// Catálogo de actividad económica (jerárquico).
export interface ActividadEconomicaItem extends CatalogoItem {
  esSeleccionable: boolean
  padreId: number | null
}
