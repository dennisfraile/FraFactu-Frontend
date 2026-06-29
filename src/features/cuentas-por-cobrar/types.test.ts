import { describe, it, expect } from 'vitest'
import type { PlanCuotasDto, CuotaDto, DefinicionCuotaDto, ConfiguracionCuotasDto } from './types'
import type { IconName } from '@/design-system'

describe('tipos cuentas por cobrar', () => {
  it('PlanCuotasDto admite la forma del backend', () => {
    const cuota: CuotaDto = {
      numero: 1, monto: 50, fechaPactada: '2026-07-01', estado: 'Pendiente',
      esCuotaFinal: false, interesMora: 0,
    }
    const plan: PlanCuotasDto = {
      id: 1, condicionOperacion: 2, montoTotal: 100, montoPagado: 0,
      saldoAdeudado: 100, estadoCobro: 'Pendiente', cuotas: [cuota],
    }
    expect(plan.cuotas[0].numero).toBe(1)
  })
  it('DefinicionCuotaDto y ConfiguracionCuotasDto compilan', () => {
    const def: DefinicionCuotaDto = { numero: 1, monto: 50, fechaPactada: '2026-07-01' }
    const cfg: ConfiguracionCuotasDto = {
      tasaMoraMensual: 2, diasGracia: 3, moraHabilitada: true,
      recordatoriosHabilitados: false, diasAntesRecordatorio: 2,
    }
    expect(def.numero + cfg.diasGracia).toBe(4)
  })
  it('cobros es un IconName válido', () => {
    const icon: IconName = 'cobros'
    expect(icon).toBe('cobros')
  })
})
