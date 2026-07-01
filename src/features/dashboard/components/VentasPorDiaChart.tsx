import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, Spinner, EmptyState } from '@/design-system'
import { useVentasPorDia } from '../hooks'

export function VentasPorDiaChart({ dias, sucursalId }: { dias: number; sucursalId?: number }) {
  const { data, isLoading, isError } = useVentasPorDia({ dias, sucursalId })
  return (
    <Card className="p-4">
      <h2 className="mb-3 font-display text-base font-semibold text-ink">Ventas por día</h2>
      {isLoading ? <div className="flex justify-center py-6"><Spinner /></div>
        : isError || !data?.length ? <EmptyState title="Sin datos" hint="No hay ventas en el período." />
        : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.map((d) => ({ ...d, dia: d.fecha.slice(5, 10) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e1d4" />
              <XAxis dataKey="dia" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Area type="monotone" dataKey="totalVentas" stroke="#1f6b4f" fill="#e7efe9" />
            </AreaChart>
          </ResponsiveContainer>
        )}
    </Card>
  )
}
