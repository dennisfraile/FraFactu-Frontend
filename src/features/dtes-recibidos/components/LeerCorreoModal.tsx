// src/features/dtes-recibidos/components/LeerCorreoModal.tsx
import { useState } from 'react'
import { Modal, Button, FormField, Input, Spinner } from '@/design-system'
import { useLeerCorreo, useEstadoLecturaCorreo } from '../hooks'
import { leerCorreoSchema } from '../schemas'

interface Props { onClose: () => void }

export function LeerCorreoModal({ onClose }: Props) {
  const [mesInicio, setMesInicio] = useState('')
  const [mesFin, setMesFin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [polling, setPolling] = useState(false)
  const leer = useLeerCorreo()
  const estado = useEstadoLecturaCorreo(polling)

  const iniciar = async () => {
    const res = leerCorreoSchema.safeParse({ mesInicio, mesFin })
    if (!res.success) { setError(res.error.issues[0]?.message ?? 'Revise el rango de meses'); return }
    setError(null)
    const dto = mesInicio && mesFin ? { mesInicio, mesFin } : {}
    try {
      await leer.mutateAsync(dto)
      setPolling(true) // arranca el polling (en handler de evento, no useEffect)
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'No se pudo iniciar la lectura'
      setError(msg)
    }
  }

  const job = estado.data
  const terminado = job?.terminado ?? false

  return (
    <Modal open onClose={onClose} title="Leer correo (Gmail)">
      <div className="space-y-3">
        <p className="text-sm text-slate">Lee los CCF adjuntos en el correo conectado. Sin rango, lee el mes en curso.</p>
        {error && <p className="rounded-md bg-rojo/10 px-3 py-2 text-sm text-rojo">{error}</p>}

        {!polling && (
          <div className="grid grid-cols-2 gap-2">
            <FormField label="Mes inicio (AAAA-MM)" htmlFor="lc-ini"><Input id="lc-ini" placeholder="2026-01" value={mesInicio} onChange={(e) => setMesInicio(e.target.value)} /></FormField>
            <FormField label="Mes fin (AAAA-MM)" htmlFor="lc-fin"><Input id="lc-fin" placeholder="2026-03" value={mesFin} onChange={(e) => setMesFin(e.target.value)} /></FormField>
          </div>
        )}

        {polling && job && (
          <div className="rounded-md border border-hairline p-3 text-sm">
            <p className="font-medium text-ink">Estado: {job.estado}{!terminado && <span className="ml-2 inline-block align-middle"><Spinner /></span>}</p>
            <p className="mt-1 text-slate">Procesados: <span className="cifra">{job.correosProcesados}</span> · Encontrados: <span className="cifra">{job.dtesEncontrados}</span> · Nuevos: <span className="cifra">{job.dtesNuevos}</span> · Duplicados: <span className="cifra">{job.dtesDuplicados}</span> · Ignorados: <span className="cifra">{job.dtesIgnorados}</span> · Errores: <span className="cifra">{job.errores}</span></p>
            {job.mensajeError && <p className="mt-1 text-rojo">{job.mensajeError}</p>}
          </div>
        )}
        {polling && !job && <Spinner />}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>{terminado ? 'Cerrar' : 'Cancelar'}</Button>
          {!polling && <Button onClick={iniciar} disabled={leer.isPending}>{leer.isPending ? 'Iniciando…' : 'Iniciar lectura'}</Button>}
        </div>
      </div>
    </Modal>
  )
}
