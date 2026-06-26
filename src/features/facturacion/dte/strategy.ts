import type { ItemInput, ItemCalculado, ResumenNumerico, TipoImpuesto } from '../calc/types'
import type { TipoDte, ItemDocumentoDto, ResumenDto } from '../types'

export type ReceptorPolicy = 'opcional' | 'contribuyente' | 'sujetoExcluido'

export interface ResumenOpts {
  esAgenteRetencion?: boolean
}

// Tipos del formulario de emisión (compartidos por todos los tipos de DTE).
export interface FormItem {
  productoId?: number
  bodegaId?: number // Id de bodega; requerido para ítems Bien cuando el tipo descuenta stock.
  codigo?: string
  descripcion: string
  cantidad: number
  precioUni: number
  montoDescuento?: number
  uniMedida: number // Id de catálogo cat_uni_medida (NO el código MH).
  tipoItem: number
  tipoImpuesto: TipoImpuesto
}

export interface FormPago {
  catFormaPagoId: number
  monto: number
}

export interface FacturaFormValues {
  sucursalId: number
  cajaId: number | null
  esConsumidorFinal: boolean
  receptorId?: number | null
  vendedorId?: number | null
  condicionOperacion: number
  esAgenteRetencion?: boolean // FSE (14): el emisor retiene IVA 1%.
  items: FormItem[]
  pagos: FormPago[]
  documentoRelacionado?: import('../types').DocumentoRelacionadoDto | null
}

export interface DteStrategy {
  tipoDte: TipoDte
  version: number
  etiqueta: string // 'Comprobante de Crédito Fiscal'
  etiquetaCorta: string // 'CCF'
  precioIncluyeIva: boolean
  requiereCaja: boolean
  descuentaStock: boolean
  receptorPolicy: ReceptorPolicy
  usaAgenteRetencion: boolean
  requiereDocumentoRelacionado: boolean
  prefillDesdeOriginal: boolean
  calcItem(input: ItemInput): ItemCalculado
  calcResumen(items: ItemCalculado[], opts?: ResumenOpts): ResumenNumerico
  buildItemDto(item: FormItem, calc: ItemCalculado, numItem: number): ItemDocumentoDto
  buildResumenDto(resumen: ResumenNumerico, values: FacturaFormValues): ResumenDto
}
