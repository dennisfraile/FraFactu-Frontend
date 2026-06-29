// src/features/inventario/components/MarcaFormModal.tsx
import { useState } from 'react'
import { Modal, Button, FormField, Input } from '@/design-system'
import { marcaSchema } from '../schemas'
import type { Marca, CrearMarcaDto } from '../types'

interface Props { inicial?: Marca | null; onGuardar: (dto: CrearMarcaDto) => void; onClose: () => void; cargando: boolean }

export function MarcaFormModal({ inicial, onGuardar, onClose, cargando }: Props) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '')
  const [error, setError] = useState<string | null>(null)

  const guardar = () => {
    const dto = { nombre: nombre.trim(), descripcion: descripcion.trim() || null }
    const res = marcaSchema.safeParse(dto)
    if (!res.success) { setError(res.error.issues[0]?.message ?? 'Revise el formulario'); return }
    onGuardar(dto)
  }

  return (
    <Modal open onClose={onClose} title={inicial ? 'Editar marca' : 'Nueva marca'}>
      <div className="space-y-3">
        {error && <p className="rounded-md bg-rojo/10 px-3 py-2 text-sm text-rojo">{error}</p>}
        <FormField label="Nombre" htmlFor="marca-nombre"><Input id="marca-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} /></FormField>
        <FormField label="Descripción (opcional)" htmlFor="marca-desc"><Input id="marca-desc" value={descripcion ?? ''} onChange={(e) => setDescripcion(e.target.value)} /></FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar} disabled={cargando}>{cargando ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </div>
    </Modal>
  )
}
