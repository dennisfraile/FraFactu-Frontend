// src/features/compras/pages/ProveedoresPage.tsx
import { useState } from 'react'
import { Table, Input, Button, Badge, Spinner, EmptyState, useToast } from '@/design-system'
import { useProveedores, useCambiarEstadoProveedor } from '../hooks'
import { ProveedorFormModal } from '../components/ProveedorFormModal'
import type { ProveedorDto } from '../types'

export function ProveedoresPage() {
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [filtro, setFiltro] = useState('')
  const [soloActivos, setSoloActivos] = useState(true)
  const [editar, setEditar] = useState<ProveedorDto | null | undefined>(undefined) // undefined = cerrado, null = nuevo
  const { data, isLoading, isError } = useProveedores({ pagina: page, tamanoPagina: 20, filtro: filtro || undefined, soloActivos })
  const cambiarEstado = useCambiarEstadoProveedor()

  const toggle = async (p: ProveedorDto) => {
    try {
      await cambiarEstado.mutateAsync({ id: p.id, activo: !p.activo })
      toast.show(p.activo ? 'Proveedor desactivado' : 'Proveedor activado')
    } catch {
      toast.show('No se pudo cambiar el estado', { tone: 'rojo' })
    }
  }

  const columns = [
    { key: 'nit', header: 'NIT', render: (p: ProveedorDto) => <span className="cifra text-xs">{p.nit}</span> },
    { key: 'nombre', header: 'Nombre' },
    { key: 'nombreComercial', header: 'Comercial', render: (p: ProveedorDto) => p.nombreComercial ?? '—' },
    { key: 'contacto', header: 'Contacto', render: (p: ProveedorDto) => p.contacto ?? '—' },
    { key: 'totalCompras', header: 'Compras', render: (p: ProveedorDto) => <span className="cifra">{p.totalCompras}</span> },
    { key: 'activo', header: 'Estado', render: (p: ProveedorDto) => <Badge estado={p.activo ? 'recibido' : 'borrador'}>{p.activo ? 'Activo' : 'Inactivo'}</Badge> },
    { key: 'acciones', header: '', render: (p: ProveedorDto) => (
      <div className="flex justify-end gap-3">
        <button className="text-xs font-medium text-sello hover:text-sello-bright" onClick={() => setEditar(p)}>Editar</button>
        <button className="text-xs font-medium text-slate hover:text-ink" onClick={() => toggle(p)}>{p.activo ? 'Desactivar' : 'Activar'}</button>
      </div>
    ) },
  ]

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Proveedores</h1>
        <Button onClick={() => setEditar(null)}>Nuevo proveedor</Button>
      </div>
      <div className="flex items-center gap-3">
        <Input placeholder="Buscar por nombre o NIT" value={filtro} onChange={(e) => { setFiltro(e.target.value); setPage(1) }} />
        <label className="flex items-center gap-2 text-sm text-slate">
          <input type="checkbox" checked={soloActivos} onChange={(e) => { setSoloActivos(e.target.checked); setPage(1) }} />
          Solo activos
        </label>
      </div>
      {isLoading && <Spinner />}
      {isError && <EmptyState title="Error" hint="No se pudieron cargar los proveedores." />}
      {data && data.items.length === 0 && <EmptyState title="Sin proveedores" hint="Cree el primer proveedor." />}
      {data && data.items.length > 0 && (
        <Table
          columns={columns}
          rows={data.items}
          getRowKey={(p) => p.id}
          serverPagination={{ page: data.pageNumber, totalPages: data.totalPages, onPageChange: setPage }}
        />
      )}
      {editar !== undefined && (
        <ProveedorFormModal
          proveedor={editar}
          onSaved={() => { setEditar(undefined); toast.show('Proveedor guardado') }}
          onClose={() => setEditar(undefined)}
        />
      )}
    </div>
  )
}
