import { useState } from 'react'
import { Card, Table, Spinner, EmptyState } from '@/design-system'
import { useComparativoSucursales } from '../hooks'
import type { RangoParams, ComparativoSucursal } from '../types'

export function ComparativoSucursalesTable({ params }: { params: RangoParams }) {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useComparativoSucursales({ ...params, page, pageSize: 20 }, true)

  const columns = [
    { key: 'nombreSucursal', header: 'Sucursal' },
    { key: 'totalFacturas', header: 'Facturas', render: (r: ComparativoSucursal) => <span className="cifra">{r.totalFacturas}</span> },
    { key: 'totalVentas', header: 'Total ventas', render: (r: ComparativoSucursal) => <span className="cifra">${r.totalVentas.toFixed(2)}</span> },
    { key: 'porcentajeDelTotal', header: '% del total', render: (r: ComparativoSucursal) => <span className="cifra">{r.porcentajeDelTotal.toFixed(1)}%</span> },
  ]

  return (
    <Card className="p-4">
      <h2 className="mb-3 font-display text-base font-semibold text-ink">Comparativo de sucursales</h2>
      {isLoading ? <div className="flex justify-center py-6"><Spinner /></div>
        : isError || !data?.items.length ? <EmptyState title="Sin datos" hint="No hay datos de sucursales para el período." />
        : <Table columns={columns} rows={data.items} getRowKey={(r) => r.sucursalId} serverPagination={{ page: data.pageNumber, totalPages: data.totalPages, onPageChange: setPage }} />}
    </Card>
  )
}
