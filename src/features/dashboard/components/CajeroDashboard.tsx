import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, Spinner, EmptyState } from '@/design-system'
import { useDashboardCajero } from '../hooks'
import type { RangoParams } from '../types'
import { KpiCard } from './KpiCard'

const money = (n: number) => `$${n.toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function CajeroDashboard({ params }: { params: RangoParams }) {
  const { data, isLoading, isError } = useDashboardCajero(params, true)
  if (isLoading) return <div className="flex justify-center py-6"><Spinner /></div>
  if (isError || !data) return <EmptyState title="Sin datos" hint="No se pudo cargar tu dashboard." />
  return (
    <div className="space-y-4">
      <h2 className="font-display text-base font-semibold text-ink">Mis ventas</h2>
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Nº facturas" valor={String(data.totalFacturas)} />
        <KpiCard label="Monto vendido" valor={money(data.montoTotalVendido)} />
        <KpiCard label="Promedio" valor={money(data.promedioVenta)} />
      </div>
      <Card className="p-4">
        {!data.ventasPorDia.length ? <EmptyState title="Sin ventas" hint="No hay ventas en el período." />
          : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data.ventasPorDia.map((d) => ({ ...d, dia: d.fecha.slice(5, 10) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e1d4" />
                <XAxis dataKey="dia" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="montoTotal" stroke="#1f6b4f" fill="#e7efe9" />
              </AreaChart>
            </ResponsiveContainer>
          )}
      </Card>
    </div>
  )
}
