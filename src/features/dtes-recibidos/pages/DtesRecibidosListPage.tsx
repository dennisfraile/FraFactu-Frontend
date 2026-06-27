// src/features/dtes-recibidos/pages/DtesRecibidosListPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Input, Badge, Spinner, EmptyState, Card, Button } from '@/design-system'
import { useDtesRecibidos, useEstadisticasDtes } from '../hooks'
import { tonoDteRecibido } from '../estado'
import type { DteRecibidoResumenDto } from '../types'
import { CargarJsonModal } from '../components/CargarJsonModal'
import { LeerCorreoModal } from '../components/LeerCorreoModal'

export function DtesRecibidosListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState('')
  const [modal, setModal] = useState<'cargar' | 'leer' | null>(null)
  const params = { pagina: page, tamanoPagina: 20, search: search || undefined, estado: estado || undefined }
  const { data, isLoading, isError } = useDtesRecibidos(params)
  const stats = useEstadisticasDtes({ search: search || undefined, estado: estado || undefined })

  const columns = [
    { key: 'numeroControl', header: 'Nº control', render: (d: DteRecibidoResumenDto) => <span className="cifra text-xs">{d.numeroControl ?? d.codigoGeneracion.slice(0, 8)}</span> },
    { key: 'emisorNombre', header: 'Emisor' },
    { key: 'tipoDte', header: 'Tipo', render: (d: DteRecibidoResumenDto) => <span className="cifra">{d.tipoDte}</span> },
    { key: 'fechaEmision', header: 'Fecha', render: (d: DteRecibidoResumenDto) => <span className="cifra">{d.fechaEmision.slice(0, 10)}</span> },
    { key: 'total', header: 'Total', render: (d: DteRecibidoResumenDto) => <span className="cifra font-medium">${d.total.toFixed(2)}</span> },
    { key: 'estado', header: 'Estado', render: (d: DteRecibidoResumenDto) => <Badge estado={tonoDteRecibido(d.estado)}>{d.estado}</Badge> },
    { key: 'acciones', header: '', render: (d: DteRecibidoResumenDto) => <button className="text-xs font-medium text-sello hover:text-sello-bright" onClick={() => navigate(`/dtes-recibidos/${d.id}`)}>Ver</button> },
  ]

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">DTEs recibidos</h1>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate('/dtes-recibidos/configuracion')}>Configurar correo</Button>
          <Button variant="ghost" onClick={() => setModal('leer')}>Leer correo</Button>
          <Button onClick={() => setModal('cargar')}>Cargar JSON</Button>
        </div>
      </div>

      {stats.data && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card><div className="p-3"><p className="text-xs text-slate">Pendientes</p><p className="cifra text-lg font-semibold text-ink">{stats.data.totalPendientes}</p></div></Card>
          <Card><div className="p-3"><p className="text-xs text-slate">Vinculados</p><p className="cifra text-lg font-semibold text-ink">{stats.data.totalVinculados}</p></div></Card>
          <Card><div className="p-3"><p className="text-xs text-slate">Descartados</p><p className="cifra text-lg font-semibold text-ink">{stats.data.totalDescartados}</p></div></Card>
          <Card><div className="p-3"><p className="text-xs text-slate">Monto pendiente</p><p className="cifra text-lg font-semibold text-ink">${stats.data.montoTotalPendientes.toFixed(2)}</p></div></Card>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Input placeholder="Buscar por emisor o nº de control" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        <select aria-label="Estado" className="rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark" value={estado} onChange={(e) => { setEstado(e.target.value); setPage(1) }}>
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="VINCULADO">Vinculado</option>
          <option value="DESCARTADO">Descartado</option>
        </select>
      </div>

      {isLoading && <Spinner />}
      {isError && <EmptyState title="Error" hint="No se pudieron cargar los DTEs recibidos." />}
      {data && data.items.length === 0 && <EmptyState title="Sin DTEs recibidos" hint="Cargue un CCF manualmente o configure la lectura de correo." />}
      {data && data.items.length > 0 && (
        <Table columns={columns} rows={data.items} getRowKey={(d) => d.id} serverPagination={{ page: data.pagina, totalPages: data.totalPaginas, onPageChange: setPage }} />
      )}
      {modal === 'cargar' && <CargarJsonModal onClose={() => setModal(null)} />}
      {modal === 'leer' && <LeerCorreoModal onClose={() => setModal(null)} />}
    </div>
  )
}
