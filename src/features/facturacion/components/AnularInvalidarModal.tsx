// src/features/facturacion/components/AnularInvalidarModal.tsx
import { useState } from 'react'
import { Modal, Button, FormField, Input } from '@/design-system'

interface Props {
  abierto: boolean
  onCerrar: () => void
  onConfirmar: (motivo: string) => void
  cargando?: boolean
}

export function AnularInvalidarModal({ abierto, onCerrar, onConfirmar, cargando }: Props) {
  const [motivo, setMotivo] = useState('')
  if (!abierto) return null
  return (
    <Modal open onClose={onCerrar} title="Anular factura">
      <div className="space-y-3">
        <FormField label="Motivo de anulación" htmlFor="motivo">
          <Input id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </FormField>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCerrar}>Cancelar</Button>
          <Button disabled={!motivo.trim() || cargando} onClick={() => onConfirmar(motivo.trim())}>Confirmar anulación</Button>
        </div>
      </div>
    </Modal>
  )
}
