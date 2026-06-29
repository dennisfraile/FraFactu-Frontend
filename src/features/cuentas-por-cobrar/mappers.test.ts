import { describe, it, expect } from 'vitest'
import { buildCrearVentaCreditoDto } from './mappers'
import type { CreateFacturaDto } from '@/features/facturacion/types'

const venta = { resumen: { condicionOperacion: 2, totalPagar: 100 } } as unknown as CreateFacturaDto

describe('buildCrearVentaCreditoDto', () => {
  it('envuelve venta + cuotas + observaciones', () => {
    const dto = buildCrearVentaCreditoDto(venta, [
      { numero: 1, monto: 40, fechaPactada: '2026-07-01' },
      { numero: 2, monto: 60, fechaPactada: '2026-08-01' },
    ], 'a 60 días')
    expect(dto.venta).toBe(venta)
    expect(dto.cuotas).toHaveLength(2)
    expect(dto.observaciones).toBe('a 60 días')
  })
  it('observaciones es null cuando va vacío', () => {
    const dto = buildCrearVentaCreditoDto(venta, [], '')
    expect(dto.observaciones).toBeNull()
  })
})
