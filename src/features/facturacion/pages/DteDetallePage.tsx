// src/features/facturacion/pages/DteDetallePage.tsx
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Spinner, EmptyState, useToast } from '@/design-system'
import { useFactura, useAnularFactura } from '../hooks'
import { VistaPreviaDte } from '../components/VistaPreviaDte'
import { AnularInvalidarModal } from '../components/AnularInvalidarModal'
import type { CreateFacturaDto } from '../types'

export function DteDetallePage() {
  const { id } = useParams()
  const facturaId = Number(id)
  const toast = useToast()
  const idValido = Number.isFinite(facturaId)
  const { data, isLoading, isError } = useFactura(facturaId)
  const anular = useAnularFactura()
  const [modal, setModal] = useState(false)

  if (!idValido) {
    return <div className="p-6"><EmptyState title="DTE no válido" hint="El identificador del documento no es correcto." /></div>
  }
  if (isLoading) return <div className="p-6"><Spinner /></div>
  if (isError || !data) {
    return <div className="p-6"><EmptyState title="No se pudo cargar el DTE" hint="Intenta de nuevo más tarde." /></div>
  }

  // La respuesta del backend cumple la forma necesaria para la vista previa.
  const dto = data as unknown as CreateFacturaDto

  const onConfirmar = async (motivo: string) => {
    try {
      await anular.mutateAsync({ id: facturaId, dto: { motivo } })
      toast.show('Factura anulada')
      setModal(false)
    } catch {
      toast.show('No se pudo anular la factura', { tone: 'rojo' })
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">{data.numeroControl}</h1>
        <Button variant="ghost" onClick={() => setModal(true)}>Anular</Button>
      </div>
      <VistaPreviaDte dto={dto} codigoGeneracion={data.codigoGeneracion} ambiente="00" />
      <AnularInvalidarModal abierto={modal} onCerrar={() => setModal(false)} onConfirmar={onConfirmar} cargando={anular.isPending} />
    </div>
  )
}
