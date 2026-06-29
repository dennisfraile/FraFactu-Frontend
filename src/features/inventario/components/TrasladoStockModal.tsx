// src/features/inventario/components/TrasladoStockModal.tsx
import { useState } from 'react'
import { Modal, Button, FormField, Input, Spinner } from '@/design-system'
import { useBodegas } from '@/features/facturacion/hooks'
import type { BodegaItem } from '@/features/facturacion/types'
import { trasladoSchema } from '../schemas'
import type { TrasladoInventarioDto } from '../types'

interface Props {
  producto: { id: number; nombre: string }
  sucursalId: number
  onConfirmar: (dto: TrasladoInventarioDto) => void
  onClose: () => void
  cargando: boolean
}

interface InnerProps extends Props {
  bodegas: BodegaItem[]
}

function TrasladoStockForm({ producto, bodegas, onConfirmar, onClose, cargando }: InnerProps) {
  // Auto-select first bodega as origen; leave destino 0 so user must choose
  const [origen, setOrigen] = useState(bodegas[0]?.id ?? 0)
  const [destino, setDestino] = useState(0)
  const [cantidad, setCantidad] = useState(0)
  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState<string | null>(null)
  const sel = 'w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark'

  const confirmar = () => {
    const dto = {
      productoId: producto.id,
      bodegaOrigenId: origen,
      bodegaDestinoId: destino,
      cantidad: Number(cantidad),
      observaciones: observaciones.trim() || null,
    }
    const res = trasladoSchema.safeParse(dto)
    if (!res.success) {
      setError(res.error.issues[0]?.message ?? 'Revise el formulario')
      return
    }
    onConfirmar(dto)
  }

  return (
    <Modal open onClose={onClose} title={`Trasladar — ${producto.nombre}`}>
      <div className="space-y-3">
        {error && <p className="rounded-md bg-rojo/10 px-3 py-2 text-sm text-rojo">{error}</p>}
        <FormField label="Bodega origen" htmlFor="tr-origen">
          <select
            id="tr-origen"
            className={sel}
            value={origen}
            onChange={(e) => setOrigen(Number(e.target.value))}
          >
            <option value={0}>Seleccione…</option>
            {bodegas.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Bodega destino" htmlFor="tr-destino">
          <select
            id="tr-destino"
            className={sel}
            value={destino}
            onChange={(e) => setDestino(Number(e.target.value))}
          >
            <option value={0}>Seleccione…</option>
            {bodegas.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Cantidad" htmlFor="tr-cant">
          <Input
            id="tr-cant"
            type="number"
            value={cantidad}
            onChange={(e) => setCantidad(Number(e.target.value))}
          />
        </FormField>
        <FormField label="Observaciones (opcional)" htmlFor="tr-obs">
          <Input
            id="tr-obs"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={cargando}>
            {cargando ? 'Procesando…' : 'Confirmar traslado'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export function TrasladoStockModal(props: Props) {
  const bodegas = useBodegas(props.sucursalId)

  if (bodegas.isLoading || !bodegas.data) {
    return (
      <Modal open onClose={props.onClose} title={`Trasladar — ${props.producto.nombre}`}>
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      </Modal>
    )
  }

  return (
    <TrasladoStockForm
      key={bodegas.data.map((b) => b.id).join(',')}
      {...props}
      bodegas={bodegas.data}
    />
  )
}
