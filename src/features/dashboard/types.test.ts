import { describe, it, expect } from 'vitest'
import type { DashboardKPIs, PagedResult, ComparativoSucursal } from './types'

describe('dashboard types', () => {
  it('DashboardKPIs tiene las 7 métricas', () => {
    const k: DashboardKPIs = { totalFacturas: 1, totalVentas: 2, promedioVenta: 3, facturasAprobadas: 4, facturasPendientes: 5, facturasRechazadas: 6, crecimientoVentas: 7 }
    expect(k.totalVentas).toBe(2)
  })
  it('PagedResult envuelve items y metadatos', () => {
    const p: PagedResult<ComparativoSucursal> = { items: [], totalItems: 0, pageNumber: 1, pageSize: 50, totalPages: 0, hasPreviousPage: false, hasNextPage: false }
    expect(p.items).toEqual([])
  })
})
