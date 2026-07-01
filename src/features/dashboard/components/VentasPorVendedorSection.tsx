import { useState } from 'react'
import { Card, Button, Spinner, EmptyState, Table } from '@/design-system'
import { useVentasPorVendedor } from '../hooks'
import type { RangoParams, VentasPorVendedor } from '../types'
import { VendedorDetalleTable } from './VendedorDetalleTable'

export function VentasPorVendedorSection({ params }: { params: RangoParams }) {
  const { data, isLoading, isError } = useVentasPorVendedor(params)
  const [verDetalle, setVerDetalle] = useState(false)

  const columns = [
    { key: 'nombreVendedor', header: 'Vendedor' },
    { key: 'cantidadFacturas', header: 'Facturas', render: (r: VentasPorVendedor) => <span className="cifra">{r.cantidadFacturas}</span> },
    { key: 'totalVentas', header: 'Total ventas', render: (r: VentasPorVendedor) => <span className="cifra">${r.totalVentas.toFixed(2)}</span> },
    { key: 'promedioVenta', header: 'Promedio', render: (r: VentasPorVendedor) => <span className="cifra">${r.promedioVenta.toFixed(2)}</span> },
  ]

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-ink">Ventas por vendedor</h2>
        <Button variant="ghost" size="sm" onClick={() => setVerDetalle((v) => !v)}>{verDetalle ? 'Ocultar detalle' : 'Ver detalle'}</Button>
      </div>
      {isLoading ? <div className="flex justify-center py-6"><Spinner /></div>
        : isError || !data?.length ? <EmptyState title="Sin datos" hint="No hay ventas por vendedor en el período." />
        : <Table columns={columns} rows={data} getRowKey={(r) => r.vendedorId} />}
      {verDetalle && <VendedorDetalleTable params={params} />}
    </Card>
  )
}
