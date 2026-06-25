// src/features/facturacion/pages/HistorialPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Input, Spinner, EmptyState, Badge } from '@/design-system'
import { useHistorial } from '../hooks'
import type { FacturaListItem } from '../types'

export function HistorialPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { data, isLoading, isError } = useHistorial({ pageNumber: page, pageSize: 10, search: search || undefined })

  const columns = [
    { key: 'numeroControl', header: 'Número de control' },
    { key: 'fechaEmision', header: 'Fecha', render: (r: FacturaListItem) => r.fechaEmision.slice(0, 10) },
    { key: 'receptorNombre', header: 'Receptor' },
    { key: 'totalPagar', header: 'Total', render: (r: FacturaListItem) => `$${r.totalPagar.toFixed(2)}` },
    { key: 'estadoHacienda', header: 'Estado', render: (r: FacturaListItem) => <Badge>{r.estadoHacienda}</Badge> },
    { key: 'acciones', header: '', render: (r: FacturaListItem) => <button className="text-xs text-sello" onClick={() => navigate(`/facturacion/${r.id}`)}>Ver</button> },
  ]

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-semibold text-ink">Historial de DTEs</h1>
      <Input placeholder="Buscar por número, código o receptor" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      {isLoading && <Spinner />}
      {isError && <EmptyState title="Error" hint="No se pudo cargar el historial." />}
      {data && data.items.length === 0 && <EmptyState title="Sin DTEs" hint="Aún no hay facturas emitidas." />}
      {data && data.items.length > 0 && (
        <Table
          columns={columns}
          rows={data.items}
          getRowKey={(r) => r.id}
          serverPagination={{ page: data.pageNumber, totalPages: data.totalPages, onPageChange: setPage }}
        />
      )}
    </div>
  )
}
