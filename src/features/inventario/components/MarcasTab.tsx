// src/features/inventario/components/MarcasTab.tsx
import { useState } from 'react'
import { Button, Spinner, EmptyState, useToast } from '@/design-system'
import { useMarcas, useCrearMarca, useActualizarMarca, useToggleMarca, useEliminarMarca } from '../hooks'
import { MarcaFormModal } from './MarcaFormModal'
import type { Marca, CrearMarcaDto } from '../types'

export function MarcasTab() {
  const lista = useMarcas()
  const crear = useCrearMarca()
  const actualizar = useActualizarMarca()
  const toggle = useToggleMarca()
  const eliminar = useEliminarMarca()
  const toast = useToast()
  const [editando, setEditando] = useState<Marca | null | undefined>(undefined)

  const onGuardar = async (dto: CrearMarcaDto) => {
    try {
      if (editando) await actualizar.mutateAsync({ id: editando.id, dto })
      else await crear.mutateAsync(dto)
      toast.show('Marca guardada'); setEditando(undefined)
    } catch (e) { toast.show((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'No se pudo guardar', { tone: 'rojo' }) }
  }
  const onEliminar = async (m: Marca) => {
    if (!window.confirm(`¿Eliminar la marca "${m.nombre}"?`)) return
    try { await eliminar.mutateAsync(m.id); toast.show('Marca eliminada') }
    catch (e) { toast.show((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'No se pudo eliminar', { tone: 'rojo' }) }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={() => setEditando(null)}>Nueva marca</Button></div>
      {lista.isLoading ? <Spinner /> : !lista.data?.length ? (
        <EmptyState title="Sin marcas" hint="Crea la primera marca." />
      ) : (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-wide text-slate/70"><th className="py-2">Nombre</th><th className="text-right">Productos</th><th>Estado</th><th /></tr></thead>
          <tbody>
            {lista.data.map((m) => (
              <tr key={m.id} className="border-t border-hairline">
                <td className="py-2">{m.nombre}</td>
                <td className="text-right">{m.totalProductos}</td>
                <td>{m.activa ? 'Activa' : 'Inactiva'}</td>
                <td className="space-x-2 text-right">
                  <button type="button" className="text-xs text-sello" onClick={() => setEditando(m)}>Editar</button>
                  <button type="button" className="text-xs text-slate" onClick={() => toggle.mutate(m.id)}>{m.activa ? 'Desactivar' : 'Activar'}</button>
                  <button type="button" className="text-xs text-rojo" onClick={() => onEliminar(m)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {editando !== undefined && (
        <MarcaFormModal inicial={editando} onGuardar={onGuardar} onClose={() => setEditando(undefined)} cargando={crear.isPending || actualizar.isPending} />
      )}
    </div>
  )
}
