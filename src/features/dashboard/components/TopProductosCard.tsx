import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, Spinner, EmptyState } from '@/design-system'
import { useTopProductos } from '../hooks'
import type { RangoParams } from '../types'

export function TopProductosCard({ params }: { params: RangoParams }) {
  const { data, isLoading, isError } = useTopProductos({ ...params, top: 10 })
  return (
    <Card className="p-4">
      <h2 className="mb-3 font-display text-base font-semibold text-ink">Top productos</h2>
      {isLoading ? <div className="flex justify-center py-6"><Spinner /></div>
        : isError || !data?.length ? <EmptyState title="Sin datos" hint="No hay productos vendidos en el período." />
        : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart layout="vertical" data={data} margin={{ left: 24 }}>
              <XAxis type="number" fontSize={11} />
              <YAxis type="category" dataKey="nombreProducto" width={120} fontSize={11} />
              <Tooltip />
              <Bar dataKey="totalVentas" fill="#c2922e" />
            </BarChart>
          </ResponsiveContainer>
        )}
    </Card>
  )
}
