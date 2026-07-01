import { Spinner, EmptyState } from '@/design-system'
import { useKpis } from '../hooks'
import type { RangoParams } from '../types'
import { KpiCard } from './KpiCard'

const money = (n: number) => `$${n.toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function KpisSection({ params }: { params: RangoParams & { fechaAnteriorInicio?: string; fechaAnteriorFin?: string } }) {
  const { data, isLoading, isError } = useKpis(params)
  if (isLoading) return <div className="flex justify-center py-6"><Spinner /></div>
  if (isError || !data) return <EmptyState title="Sin KPIs" hint="No se pudieron cargar los indicadores." />
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <KpiCard label="Total ventas" valor={money(data.totalVentas)} delta={data.crecimientoVentas} />
      <KpiCard label="Nº facturas" valor={String(data.totalFacturas)} />
      <KpiCard label="Promedio venta" valor={money(data.promedioVenta)} />
      <KpiCard label="Aprobadas" valor={String(data.facturasAprobadas)} />
      <KpiCard label="Pendientes" valor={String(data.facturasPendientes)} />
      <KpiCard label="Rechazadas" valor={String(data.facturasRechazadas)} />
    </div>
  )
}
