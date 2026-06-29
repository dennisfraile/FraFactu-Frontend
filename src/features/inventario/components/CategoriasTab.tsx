// src/features/inventario/components/CategoriasTab.tsx
import { useState } from 'react'
import { Button, Spinner, EmptyState, useToast } from '@/design-system'
import { useCategorias, useCrearCategoria, useActualizarCategoria, useToggleCategoria, useEliminarCategoria } from '../hooks'
import { CategoriaFormModal } from './CategoriaFormModal'
import type { Categoria, CrearCategoriaDto } from '../types'

export function CategoriasTab() {
  const lista = useCategorias()
  const crear = useCrearCategoria()
  const actualizar = useActualizarCategoria()
  const toggle = useToggleCategoria()
  const eliminar = useEliminarCategoria()
  const toast = useToast()
  const [editando, setEditando] = useState<Categoria | null | undefined>(undefined) // undefined = cerrado, null = nueva

  const onGuardar = async (dto: CrearCategoriaDto) => {
    try {
      if (editando) await actualizar.mutateAsync({ id: editando.id, dto })
      else await crear.mutateAsync(dto)
      toast.show('Categoría guardada')
      setEditando(undefined)
    } catch (e) {
      toast.show((e as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ?? 'No se pudo guardar', { tone: 'rojo' })
    }
  }
  const onEliminar = async (c: Categoria) => {
    if (!window.confirm(`¿Eliminar la categoría "${c.nombre}"?`)) return
    try { await eliminar.mutateAsync(c.id); toast.show('Categoría eliminada') }
    catch (e) { toast.show((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'No se pudo eliminar', { tone: 'rojo' }) }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditando(null)}>Nueva categoría</Button>
      </div>
      {lista.isLoading ? <Spinner /> : !lista.data?.length ? (
        <EmptyState title="Sin categorías" hint="Crea la primera categoría." />
      ) : (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-wide text-slate/70"><th className="py-2">Código</th><th>Nombre</th><th className="text-right">Productos</th><th>Estado</th><th /></tr></thead>
          <tbody>
            {lista.data.map((c) => (
              <tr key={c.id} className="border-t border-hairline">
                <td className="py-2 font-mono text-xs">{c.codigo}</td>
                <td>{c.nombre}</td>
                <td className="text-right">{c.totalProductos}</td>
                <td>{c.activo ? 'Activa' : 'Inactiva'}</td>
                <td className="space-x-2 text-right">
                  <button type="button" className="text-xs text-sello" onClick={() => setEditando(c)}>Editar</button>
                  <button type="button" className="text-xs text-slate" onClick={() => toggle.mutate(c.id)}>{c.activo ? 'Desactivar' : 'Activar'}</button>
                  <button type="button" className="text-xs text-rojo" onClick={() => onEliminar(c)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {editando !== undefined && (
        <CategoriaFormModal inicial={editando} onGuardar={onGuardar} onClose={() => setEditando(undefined)} cargando={crear.isPending || actualizar.isPending} />
      )}
    </div>
  )
}
