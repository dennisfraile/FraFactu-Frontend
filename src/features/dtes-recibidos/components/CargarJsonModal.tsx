// src/features/dtes-recibidos/components/CargarJsonModal.tsx
import { useState } from 'react'
import { Modal, Button, FormField } from '@/design-system'
import { useCargarJson } from '../hooks'
import type { CargaMasivaResponse } from '../types'

interface Props { onClose: () => void }

export function CargarJsonModal({ onClose }: Props) {
  const [archivos, setArchivos] = useState<File[]>([])
  const [resultado, setResultado] = useState<CargaMasivaResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const cargar = useCargarJson()

  const subir = async () => {
    if (archivos.length === 0) { setError('Seleccione al menos un archivo'); return }
    setError(null)
    try {
      setResultado(await cargar.mutateAsync(archivos))
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'No se pudieron cargar los archivos'
      setError(msg)
    }
  }

  return (
    <Modal open onClose={onClose} title="Cargar CCF (JSON)">
      <div className="space-y-3">
        <p className="text-sm text-slate">Adjunte uno o más archivos JSON/JWT de CCF (tipo 03) recibidos. Máximo 100 archivos.</p>
        {error && <p className="rounded-md bg-rojo/10 px-3 py-2 text-sm text-rojo">{error}</p>}
        <FormField label="Archivos" htmlFor="cj-files">
          <input id="cj-files" type="file" accept=".json,.jwt,application/json" multiple onChange={(e) => setArchivos(Array.from(e.target.files ?? []))} />
        </FormField>

        {resultado && (
          <div className="rounded-md border border-hairline p-3 text-sm">
            <p className="font-medium text-ink">Cargados: {resultado.cargados} · Duplicados: {resultado.duplicados} · Rechazados: {resultado.rechazados}</p>
            <ul className="mt-2 space-y-1 text-slate">
              {resultado.resultados.map((r, i) => (
                <li key={i}><span className="cifra">{r.archivo}</span>: {r.resultado} — {r.mensaje}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>{resultado ? 'Cerrar' : 'Cancelar'}</Button>
          {!resultado && <Button onClick={subir} disabled={cargar.isPending}>{cargar.isPending ? 'Cargando…' : 'Cargar'}</Button>}
        </div>
      </div>
    </Modal>
  )
}
