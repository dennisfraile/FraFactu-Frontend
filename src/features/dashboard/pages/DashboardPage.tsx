import { useMemo, useState } from 'react'
import { Can } from '@/lib/authz/Can'
import { useAuthStore } from '@/app/auth-store'
import { DASHBOARD_GERENCIAL, DASHBOARD_CAJERO } from '../roles'
import { rangoDePreset, periodoAnterior } from '../date-range'
import { PeriodoSelector, type PeriodoValue } from '../components/PeriodoSelector'
import { SucursalSelector } from '../components/SucursalSelector'
import { KpisSection } from '../components/KpisSection'
import { VentasPorDiaChart } from '../components/VentasPorDiaChart'
import { TopProductosCard } from '../components/TopProductosCard'
import { VentasPorCategoriaSection } from '../components/VentasPorCategoriaSection'
import { VentasPorVendedorSection } from '../components/VentasPorVendedorSection'
import { ComparativoSucursalesTable } from '../components/ComparativoSucursalesTable'
import { CajeroDashboard } from '../components/CajeroDashboard'

const DIAS_POR_PRESET: Record<string, number> = { hoy: 1, '7d': 7, '30d': 30, mes: 31, custom: 30 }

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const puedeElegirSucursal = user?.accesoTodasSucursales === true
  const [periodo, setPeriodo] = useState<PeriodoValue>(() => ({ preset: '30d', ...rangoDePreset('30d') }))
  const [sucursalId, setSucursalId] = useState<number | undefined>(undefined)

  const rango = useMemo(() => ({ fechaInicio: periodo.fechaInicio, fechaFin: periodo.fechaFin, sucursalId }), [periodo.fechaInicio, periodo.fechaFin, sucursalId])
  const kpiParams = useMemo(
    () => ({ ...rango, ...periodoAnterior({ fechaInicio: periodo.fechaInicio, fechaFin: periodo.fechaFin }) }),
    [rango, periodo.fechaInicio, periodo.fechaFin],
  )
  const dias = DIAS_POR_PRESET[periodo.preset] ?? 30

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodoSelector value={periodo} onChange={setPeriodo} />
          {puedeElegirSucursal && <SucursalSelector value={sucursalId} onChange={setSucursalId} />}
        </div>
      </div>

      <Can roles={DASHBOARD_CAJERO}>
        <CajeroDashboard params={rango} />
      </Can>

      <Can roles={DASHBOARD_GERENCIAL}>
        <div className="space-y-6">
          <KpisSection params={kpiParams} />
          <div className="grid gap-4 lg:grid-cols-2">
            <VentasPorDiaChart dias={dias} sucursalId={sucursalId} />
            <TopProductosCard params={rango} />
          </div>
          <VentasPorCategoriaSection params={rango} />
          <VentasPorVendedorSection params={rango} />
          {puedeElegirSucursal && <ComparativoSucursalesTable params={rango} />}
        </div>
      </Can>
    </div>
  )
}
