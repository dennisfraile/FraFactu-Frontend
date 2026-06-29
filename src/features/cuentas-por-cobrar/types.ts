import type { CreateFacturaDto } from '@/features/facturacion/types'

export type EstadoCobro = 'Pendiente' | 'Parcial' | 'Pagado' | 'EnMora' | 'Refinanciado' | string
export type EstadoCuota = 'Pendiente' | 'Pagada' | 'Vencida' | 'Refinanciada' | string

export interface CuotaDto {
  numero: number
  monto: number
  fechaPactada: string
  estado: EstadoCuota
  fechaPago?: string | null
  facturaId?: number | null
  codigoGeneracion?: string | null
  esCuotaFinal: boolean
  interesMora: number
}

export interface PlanCuotasDto {
  id: number
  receptorId?: number | null
  receptorNombre?: string | null
  condicionOperacion: number
  montoTotal: number
  montoPagado: number
  saldoAdeudado: number
  estadoCobro: EstadoCobro
  cuotas: CuotaDto[]
}

export interface DefinicionCuotaDto {
  numero: number
  monto?: number | null
  porcentaje?: number | null
  fechaPactada: string
}

export interface RegistrarPagoCuotaDto {
  catFormaPagoId: number
  referencia?: string | null
}

export interface MoraEstimadaDto {
  numero: number
  monto: number
  fechaPactada: string
  diasAtraso: number
  interesMora: number
  moraHabilitada: boolean
}

export interface ConfiguracionCuotasDto {
  tasaMoraMensual: number
  diasGracia: number
  moraHabilitada: boolean
  recordatoriosHabilitados: boolean
  diasAntesRecordatorio: number
}

export type ActualizarConfiguracionCuotasDto = ConfiguracionCuotasDto

export interface RefinanciarPlanDto {
  motivo: string
  nuevasCuotas: DefinicionCuotaDto[]
}

export interface CrearVentaCreditoDto {
  venta: CreateFacturaDto
  cuotas: DefinicionCuotaDto[]
  observaciones?: string | null
}
