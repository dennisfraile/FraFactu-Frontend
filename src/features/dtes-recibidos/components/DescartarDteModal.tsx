import { useState } from 'react'
import { Modal, Button, FormField, Input } from '@/design-system'

interface Props { onConfirmar: (motivo: string) => void; onClose: () => void; cargando: boolean }

export function DescartarDteModal({ onConfirmar, onClose, cargando }: Props) {
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const confirmar = () => {
    if (!motivo.trim()) { setError('El motivo es obligatorio'); return }
    onConfirmar(motivo.trim())
  }
  return (
    <Modal open onClose={onClose} title="Descartar DTE recibido">
      <div className="space-y-3">
        <p className="text-sm text-slate">El DTE quedará marcado como descartado y no podrá vincularse a una compra.</p>
        {error && <p className="rounded-md bg-rojo/10 px-3 py-2 text-sm text-rojo">{error}</p>}
        <FormField label="Motivo" htmlFor="dd-motivo"><Input id="dd-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} /></FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" onClick={confirmar} disabled={cargando}>{cargando ? 'Descartando…' : 'Descartar DTE'}</Button>
        </div>
      </div>
    </Modal>
  )
}
