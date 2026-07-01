import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, Button, Spinner, EmptyState } from '@/design-system'
import { useVentasPorCategoria } from '../hooks'
import type { RangoParams } from '../types'
import { CategoriaDetalleTable } from './CategoriaDetalleTable'

export function VentasPorCategoriaSection({ params }: { params: RangoParams }) {
  const { data, isLoading, isError } = useVentasPorCategoria(params)
  const [verDetalle, setVerDetalle] = useState(false)
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-ink">Ventas por categoría</h2>
        <Button variant="ghost" size="sm" onClick={() => setVerDetalle((v) => !v)}>{verDetalle ? 'Ocultar detalle' : 'Ver detalle'}</Button>
      </div>
      {isLoading ? <div className="flex justify-center py-6"><Spinner /></div>
        : isError || !data?.length ? <EmptyState title="Sin datos" hint="No hay ventas por categoría en el período." />
        : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data}>
              <XAxis dataKey="nombreCategoria" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Bar dataKey="totalVentas" fill="#1f6b4f" />
            </BarChart>
          </ResponsiveContainer>
        )}
      {verDetalle && <CategoriaDetalleTable params={params} />}
    </Card>
  )
}
