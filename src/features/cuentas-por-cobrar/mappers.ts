import type { CreateFacturaDto } from '@/features/facturacion/types'
import type { CrearVentaCreditoDto, DefinicionCuotaDto } from './types'

export function buildCrearVentaCreditoDto(
  venta: CreateFacturaDto,
  cuotas: DefinicionCuotaDto[],
  observaciones?: string | null,
): CrearVentaCreditoDto {
  return { venta, cuotas, observaciones: observaciones?.trim() ? observaciones.trim() : null }
}
