// src/features/compras/components/ConfirmarCompraModal.tsx
import { useState } from 'react'
import { Modal, Button, FormField, Input } from '@/design-system'

interface Props { onConfirmar: (observaciones: string) => void; onClose: () => void; cargando: boolean }

export function ConfirmarCompraModal({ onConfirmar, onClose, cargando }: Props) {
  const [obs, setObs] = useState('')
  return (
    <Modal open onClose={onClose} title="Confirmar compra">
      <div className="space-y-3">
        <p className="text-sm text-slate">Al confirmar, los productos marcados para inventario incrementarán el stock de su bodega.</p>
        <FormField label="Observaciones (opcional)" htmlFor="cc-obs"><Input id="cc-obs" value={obs} onChange={(e) => setObs(e.target.value)} /></FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onConfirmar(obs)} disabled={cargando}>{cargando ? 'Confirmando…' : 'Confirmar'}</Button>
        </div>
      </div>
    </Modal>
  )
}
