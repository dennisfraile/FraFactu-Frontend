import { useState } from 'react'
import { Modal, Button, FormField, Input } from '@/design-system'
import { CuotasBuilder } from './CuotasBuilder'
import { validarCuotas, construirDefiniciones, type CuotaDraft, type ModoCuota } from '../calc/cuotas'
import type { RefinanciarPlanDto } from '../types'

interface Props {
  saldo: number
  onConfirmar: (dto: RefinanciarPlanDto) => void
  onClose: () => void
  cargando: boolean
}

export function RefinanciarModal({ saldo, onConfirmar, onClose, cargando }: Props) {
  const [motivo, setMotivo] = useState('')
  const [modo, setModo] = useState<ModoCuota>('monto')
  const [drafts, setDrafts] = useState<CuotaDraft[]>([
    { fechaPactada: '', valor: 0 },
    { fechaPactada: '', valor: 0 },
  ])
  const [error, setError] = useState<string | null>(null)

  const confirmar = () => {
    if (!motivo.trim()) { setError('El motivo es obligatorio.'); return }
    const errCuotas = validarCuotas(drafts, modo, saldo)
    if (errCuotas) { setError(errCuotas); return }
    onConfirmar({ motivo: motivo.trim(), nuevasCuotas: construirDefiniciones(drafts, modo) })
  }

  return (
    <Modal open onClose={onClose} title="Refinanciar plan">
      <div className="space-y-3">
        <p className="text-sm text-slate">Saldo a refinanciar: <span className="cifra">${saldo.toFixed(2)}</span></p>
        <FormField label="Motivo" htmlFor="rf-motivo">
          <Input id="rf-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </FormField>
        <CuotasBuilder total={saldo} drafts={drafts} modo={modo} onDrafts={setDrafts} onModo={setModo} />
        {error && <p className="rounded-md bg-rojo/10 px-3 py-2 text-sm text-rojo">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={confirmar} disabled={cargando}>{cargando ? 'Procesando…' : 'Refinanciar'}</Button>
        </div>
      </div>
    </Modal>
  )
}
