import { useState } from 'react'
import { Table, Input, Spinner, EmptyState } from '@/design-system'
import { useCategoriaDetalle } from '../hooks'
import type { RangoParams, VentaCategoriaDetalle } from '../types'

export function CategoriaDetalleTable({ params }: { params: RangoParams }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { data, isLoading, isError } = useCategoriaDetalle({ ...params, page, pageSize: 20, search: search || undefined })

  const columns = [
    { key: 'numeroControl', header: 'Nº control', render: (r: VentaCategoriaDetalle) => <span className="cifra text-xs">{r.numeroControl}</span> },
    { key: 'productoNombre', header: 'Producto' },
    { key: 'categoriaNombre', header: 'Categoría', render: (r: VentaCategoriaDetalle) => r.categoriaNombre ?? '—' },
    { key: 'cantidad', header: 'Cant.', render: (r: VentaCategoriaDetalle) => <span className="cifra">{r.cantidad}</span> },
    { key: 'totalVenta', header: 'Total', render: (r: VentaCategoriaDetalle) => <span className="cifra">${r.totalVenta.toFixed(2)}</span> },
  ]

  return (
    <div className="mt-3 space-y-3">
      <Input placeholder="Buscar producto…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="max-w-xs" />
      {isLoading ? <Spinner />
        : isError || !data?.items.length ? <EmptyState title="Sin detalle" hint="No hay líneas para el período." />
        : <Table columns={columns} rows={data.items} getRowKey={(r) => r.facturaDetalleId} serverPagination={{ page: data.pageNumber, totalPages: data.totalPages, onPageChange: setPage }} />}
    </div>
  )
}
