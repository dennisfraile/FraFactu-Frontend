import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input, Spinner, EmptyState, Badge, useToast } from '@/design-system'
import { Can } from '@/lib/authz/Can'
import { PRODUCTO_ESCRIBIR } from '@/lib/authz/acciones'
import { useProductos, useToggleProducto, useCategorias } from '../hooks'

const fmt = (n: number) => `$${n.toFixed(2)}`

export function ProductosTab() {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoriaId, setCategoriaId] = useState<number | ''>('')
  const [incluirInactivos, setIncluirInactivos] = useState(false)
  const categorias = useCategorias()
  const productos = useProductos({ pageNumber: 1, pageSize: 50, searchTerm: searchTerm || undefined, categoriaId: categoriaId === '' ? undefined : Number(categoriaId), incluirInactivos })
  const toggle = useToggleProducto()

  const onToggle = async (id: number) => {
    try { await toggle.mutateAsync(id) } catch { toast.show('No se pudo cambiar el estado', { tone: 'rojo' }) }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <Input placeholder="Buscar por nombre o código" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <select className="rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value === '' ? '' : Number(e.target.value))}>
            <option value="">Todas las categorías</option>
            {(categorias.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={incluirInactivos} onChange={(e) => setIncluirInactivos(e.target.checked)} />Incluir inactivos</label>
        </div>
        <Can roles={PRODUCTO_ESCRIBIR}>
          <Button onClick={() => navigate('/inventario/productos/nuevo')}>Nuevo producto</Button>
        </Can>
      </div>

      {productos.isLoading ? <Spinner /> : !productos.data?.items.length ? (
        <EmptyState title="Sin productos" hint="No hay productos para los filtros actuales." />
      ) : (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-wide text-slate/70"><th className="py-2">Código</th><th>Nombre</th><th>Categoría</th><th className="text-right">Precio</th><th>Estado</th><th /></tr></thead>
          <tbody>
            {productos.data.items.map((p) => (
              <tr key={p.id} className="border-t border-hairline">
                <td className="py-2 font-mono text-xs">{p.codigo}</td>
                <td><Link className="text-sello hover:underline" to={`/inventario/productos/${p.id}/editar`}>{p.nombre}</Link></td>
                <td>{p.categoriaNombre ?? '—'}</td>
                <td className="cifra text-right">{fmt(p.precioVenta)}</td>
                <td><Badge estado={p.activo ? 'recibido' : 'borrador'}>{p.activo ? 'Activo' : 'Inactivo'}</Badge></td>
                <td className="space-x-2 text-right">
                  <Can roles={PRODUCTO_ESCRIBIR}>
                    <Link className="text-xs text-sello" to={`/inventario/productos/${p.id}/editar`}>Editar</Link>
                    <button type="button" className="text-xs text-slate" onClick={() => onToggle(p.id)}>{p.activo ? 'Desactivar' : 'Activar'}</button>
                  </Can>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
