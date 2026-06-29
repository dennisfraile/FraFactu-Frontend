// src/features/inventario/components/CategoriaFormModal.tsx
import { useState } from 'react'
import { Modal, Button, FormField, Input } from '@/design-system'
import { categoriaSchema } from '../schemas'
import type { Categoria, CrearCategoriaDto } from '../types'

interface Props { inicial?: Categoria | null; onGuardar: (dto: CrearCategoriaDto) => void; onClose: () => void; cargando: boolean }

export function CategoriaFormModal({ inicial, onGuardar, onClose, cargando }: Props) {
  const [codigo, setCodigo] = useState(inicial?.codigo ?? '')
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '')
  const [error, setError] = useState<string | null>(null)

  const guardar = () => {
    const dto = { codigo: codigo.trim(), nombre: nombre.trim(), descripcion: descripcion.trim() || null }
    const res = categoriaSchema.safeParse(dto)
    if (!res.success) { setError(res.error.issues[0]?.message ?? 'Revise el formulario'); return }
    onGuardar(dto)
  }

  return (
    <Modal open onClose={onClose} title={inicial ? 'Editar categoría' : 'Nueva categoría'}>
      <div className="space-y-3">
        {error && <p className="rounded-md bg-rojo/10 px-3 py-2 text-sm text-rojo">{error}</p>}
        <FormField label="Código" htmlFor="cat-codigo"><Input id="cat-codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} /></FormField>
        <FormField label="Nombre" htmlFor="cat-nombre"><Input id="cat-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} /></FormField>
        <FormField label="Descripción (opcional)" htmlFor="cat-desc"><Input id="cat-desc" value={descripcion ?? ''} onChange={(e) => setDescripcion(e.target.value)} /></FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar} disabled={cargando}>{cargando ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </div>
    </Modal>
  )
}
