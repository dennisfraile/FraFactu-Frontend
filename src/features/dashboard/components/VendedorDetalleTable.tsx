import { useState } from 'react'
import { Table, Input, Spinner, EmptyState } from '@/design-system'
import { useVendedorDetalle } from '../hooks'
import type { RangoParams, VentaVendedorDetalle } from '../types'

export function VendedorDetalleTable({ params }: { params: RangoParams }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { data, isLoading, isError } = useVendedorDetalle({ ...params, page, pageSize: 20, search: search || undefined })

  const columns = [
    { key: 'numeroControl', header: 'Nº control', render: (r: VentaVendedorDetalle) => <span className="cifra text-xs">{r.numeroControl}</span> },
    { key: 'vendedorNombre', header: 'Vendedor', render: (r: VentaVendedorDetalle) => r.vendedorNombre ?? '—' },
    { key: 'receptorNombre', header: 'Cliente' },
    { key: 'totalPagar', header: 'Total', render: (r: VentaVendedorDetalle) => <span className="cifra">${r.totalPagar.toFixed(2)}</span> },
    { key: 'estadoHacienda', header: 'Estado' },
  ]

  return (
    <div className="mt-3 space-y-3">
      <Input placeholder="Buscar…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="max-w-xs" />
      {isLoading ? <Spinner />
        : isError || !data?.items.length ? <EmptyState title="Sin detalle" hint="No hay facturas para el período." />
        : <Table columns={columns} rows={data.items} getRowKey={(r) => r.facturaId} serverPagination={{ page: data.pageNumber, totalPages: data.totalPages, onPageChange: setPage }} />}
    </div>
  )
}
