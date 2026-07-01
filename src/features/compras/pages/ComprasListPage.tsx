// src/features/compras/pages/ComprasListPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Input, Button, Badge, Spinner, EmptyState } from '@/design-system'
import { useCompras } from '../hooks'
import { tonoCompra } from '../estado'
import type { CompraExternaDto } from '../types'
import { Can } from '@/lib/authz/Can'
import { COMPRA_ESCRIBIR } from '@/lib/authz/acciones'

export function ComprasListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState('')
  const { data, isLoading, isError } = useCompras({ pagina: page, tamanoPagina: 20, search: search || undefined, estado: estado || undefined })

  const columns = [
    { key: 'numeroFactura', header: 'Nº factura', render: (c: CompraExternaDto) => <span className="cifra text-xs">{c.numeroFactura}</span> },
    { key: 'proveedorNombre', header: 'Proveedor' },
    { key: 'fechaEmision', header: 'Fecha', render: (c: CompraExternaDto) => <span className="cifra">{c.fechaEmision.slice(0, 10)}</span> },
    { key: 'total', header: 'Total', render: (c: CompraExternaDto) => <span className="cifra font-medium">${c.total.toFixed(2)}</span> },
    { key: 'estado', header: 'Estado', render: (c: CompraExternaDto) => <Badge estado={tonoCompra(c.estado)}>{c.estado}</Badge> },
    { key: 'acciones', header: '', render: (c: CompraExternaDto) => <button className="text-xs font-medium text-sello hover:text-sello-bright" onClick={() => navigate(`/compras/${c.id}`)}>Ver</button> },
  ]

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Compras externas</h1>
        <Can roles={COMPRA_ESCRIBIR}>
          <Button onClick={() => navigate('/compras/nueva')}>Nueva compra</Button>
        </Can>
      </div>
      <div className="flex items-center gap-3">
        <Input placeholder="Buscar por nº de factura o proveedor" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        <select aria-label="Estado" className="rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark" value={estado} onChange={(e) => { setEstado(e.target.value); setPage(1) }}>
          <option value="">Todos los estados</option>
          <option value="BORRADOR">Borrador</option>
          <option value="CONFIRMADA">Confirmada</option>
          <option value="ANULADA">Anulada</option>
        </select>
      </div>
      {isLoading && <Spinner />}
      {isError && <EmptyState title="Error" hint="No se pudieron cargar las compras." />}
      {data && data.items.length === 0 && <EmptyState title="Sin compras" hint="Registre la primera compra externa." />}
      {data && data.items.length > 0 && (
        <Table columns={columns} rows={data.items} getRowKey={(c) => c.id} serverPagination={{ page: data.pageNumber, totalPages: data.totalPages, onPageChange: setPage }} />
      )}
    </div>
  )
}
