import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { dashboardApi } from './api'
import { dashboardHandlers } from '@/test/msw/dashboard-handlers'

const base = 'http://localhost:8080/api'
const server = setupServer(...dashboardHandlers)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())

describe('dashboardApi', () => {
  it('kpis devuelve las métricas', async () => {
    const k = await dashboardApi.kpis({ fechaInicio: 'a', fechaFin: 'b' })
    expect(k.totalVentas).toBe(45000)
  })
  it('comparativoSucursales mapea fechaInicio/fechaFin a desde/hasta requeridos', async () => {
    let qs = ''
    server.use(http.get(`${base}/dashboard/comparativo-sucursales`, ({ request }) => {
      qs = new URL(request.url).search
      return HttpResponse.json({ items: [], totalItems: 0, pageNumber: 1, pageSize: 50, totalPages: 0, hasPreviousPage: false, hasNextPage: false })
    }))
    await dashboardApi.comparativoSucursales({ fechaInicio: '2026-01-01', fechaFin: '2026-01-31', page: 1, pageSize: 50 })
    expect(qs).toContain('desde=2026-01-01')
    expect(qs).toContain('hasta=2026-01-31')
  })
  it('cajero mapea a fechaDesde/fechaHasta', async () => {
    let qs = ''
    server.use(http.get(`${base}/dashboard/cajero`, ({ request }) => {
      qs = new URL(request.url).search
      return HttpResponse.json({ totalFacturas: 0, montoTotalVendido: 0, promedioVenta: 0, ventasPorDia: [] })
    }))
    await dashboardApi.cajero({ fechaInicio: '2026-01-01', fechaFin: '2026-01-31' })
    expect(qs).toContain('fechaDesde=2026-01-01')
    expect(qs).toContain('fechaHasta=2026-01-31')
  })
})
