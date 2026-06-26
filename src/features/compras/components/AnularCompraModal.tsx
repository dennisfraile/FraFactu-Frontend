// src/features/compras/components/AnularCompraModal.tsx
import { useState } from 'react'
import { Modal, Button, FormField, Input } from '@/design-system'

interface Props { onConfirmar: (motivo: string) => void; onClose: () => void; cargando: boolean }

export function AnularCompraModal({ onConfirmar, onClose, cargando }: Props) {
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const confirmar = () => {
    if (!motivo.trim()) { setError('El motivo es obligatorio'); return }
    onConfirmar(motivo.trim())
  }
  return (
    <Modal open onClose={onClose} title="Anular compra">
      <div className="space-y-3">
        <p className="text-sm text-slate">Si la compra estaba confirmada, anularla revertirá el stock afectado.</p>
        {error && <p className="rounded-md bg-rojo/10 px-3 py-2 text-sm text-rojo">{error}</p>}
        <FormField label="Motivo" htmlFor="ac-motivo"><Input id="ac-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} /></FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" onClick={confirmar} disabled={cargando}>{cargando ? 'Anulando…' : 'Confirmar anulación'}</Button>
        </div>
      </div>
    </Modal>
  )
}
