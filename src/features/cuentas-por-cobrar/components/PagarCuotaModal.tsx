import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Modal, Button, FormField, Input } from '@/design-system'
import { useCatalogo } from '@/features/facturacion/hooks'
import { cuentasPorCobrarApi } from '../api'
import type { RegistrarPagoCuotaDto } from '../types'

interface Props {
  planId: number
  numero: number
  onConfirmar: (dto: RegistrarPagoCuotaDto) => void
  onClose: () => void
  cargando: boolean
}

export function PagarCuotaModal({ planId, numero, onConfirmar, onClose, cargando }: Props) {
  const formas = useCatalogo('formasPago')
  const mora = useQuery({
    queryKey: ['cxc-mora', planId, numero],
    queryFn: () => cuentasPorCobrarApi.moraEstimada(planId, numero),
  })
  const [catFormaPagoId, setCatFormaPagoId] = useState<number>(1)
  const [referencia, setReferencia] = useState('')
  const fmt = (n: number) => `$${n.toFixed(2)}`

  return (
    <Modal open onClose={onClose} title={`Pagar cuota ${numero}`}>
      <div className="space-y-3">
        {mora.data && (
          <div className="rounded-md border border-hairline px-3 py-2 text-sm">
            <p>Monto cuota: <span className="cifra">{fmt(mora.data.monto)}</span></p>
            {mora.data.moraHabilitada && mora.data.diasAtraso > 0 && (
              <p className="text-rojo">Mora estimada ({mora.data.diasAtraso} días): <span className="cifra">{fmt(mora.data.interesMora)}</span></p>
            )}
          </div>
        )}
        <FormField label="Forma de pago" htmlFor="pc-forma">
          <select id="pc-forma" className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark"
            value={catFormaPagoId} onChange={(e) => setCatFormaPagoId(Number(e.target.value))}>
            {(formas.data ?? []).map((f) => <option key={f.id} value={f.id}>{f.valor}</option>)}
          </select>
        </FormField>
        <FormField label="Referencia (opcional)" htmlFor="pc-ref">
          <Input id="pc-ref" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onConfirmar({ catFormaPagoId, referencia: referencia.trim() || null })} disabled={cargando}>
            {cargando ? 'Procesando…' : 'Confirmar pago'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
