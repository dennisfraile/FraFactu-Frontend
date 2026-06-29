// src/features/inventario/components/AjusteStockModal.tsx
import { useState } from 'react'
import { Modal, Button, FormField, Input, Spinner } from '@/design-system'
import { useBodegas } from '@/features/facturacion/hooks'
import type { BodegaItem } from '@/features/facturacion/types'
import { ajusteSchema } from '../schemas'
import { MOTIVOS_AJUSTE } from '../types'
import type { AjusteInventarioDto } from '../types'

interface Props {
  producto: { id: number; nombre: string }
  sucursalId: number
  onConfirmar: (dto: AjusteInventarioDto) => void
  onClose: () => void
  cargando: boolean
}

interface InnerProps extends Props {
  bodegas: BodegaItem[]
}

function AjusteStockForm({ producto, bodegas, onConfirmar, onClose, cargando }: InnerProps) {
  const [bodegaId, setBodegaId] = useState<number>(bodegas[0]?.id ?? 0)
  const [cantidad, setCantidad] = useState<number>(0)
  const [motivo, setMotivo] = useState<string>(MOTIVOS_AJUSTE[0])
  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState<string | null>(null)
  const sel = 'w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark'

  const confirmar = () => {
    const dto = {
      productoId: producto.id,
      bodegaId,
      cantidad: Number(cantidad),
      motivo,
      observaciones: observaciones.trim(),
    }
    const res = ajusteSchema.safeParse(dto)
    if (!res.success) {
      setError(res.error.issues[0]?.message ?? 'Revise el formulario')
      return
    }
    onConfirmar(dto)
  }

  return (
    <Modal open onClose={onClose} title={`Ajustar stock — ${producto.nombre}`}>
      <div className="space-y-3">
        {error && <p className="rounded-md bg-rojo/10 px-3 py-2 text-sm text-rojo">{error}</p>}
        <FormField label="Bodega" htmlFor="aj-bodega">
          <select
            id="aj-bodega"
            className={sel}
            value={bodegaId}
            onChange={(e) => setBodegaId(Number(e.target.value))}
          >
            {bodegas.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Cantidad (+ incrementa / − decrementa)" htmlFor="aj-cant">
          <Input
            id="aj-cant"
            type="number"
            value={cantidad}
            onChange={(e) => setCantidad(Number(e.target.value))}
          />
        </FormField>
        <FormField label="Motivo" htmlFor="aj-motivo">
          <select
            id="aj-motivo"
            className={sel}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          >
            {MOTIVOS_AJUSTE.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Observaciones" htmlFor="aj-obs">
          <Input
            id="aj-obs"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={cargando}>
            {cargando ? 'Procesando…' : 'Confirmar ajuste'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export function AjusteStockModal(props: Props) {
  const bodegas = useBodegas(props.sucursalId)

  if (bodegas.isLoading || !bodegas.data) {
    return (
      <Modal open onClose={props.onClose} title={`Ajustar stock — ${props.producto.nombre}`}>
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      </Modal>
    )
  }

  // key forces re-mount of inner form with correct default bodegaId when bodegas load
  return (
    <AjusteStockForm
      key={bodegas.data.map((b) => b.id).join(',')}
      {...props}
      bodegas={bodegas.data}
    />
  )
}
