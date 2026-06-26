// src/features/compras/pages/CompraDetallePage.tsx
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Badge, Spinner, EmptyState, useToast } from '@/design-system'
import { useCompra, useConfirmarCompra, useAnularCompra } from '../hooks'
import { ConfirmarCompraModal } from '../components/ConfirmarCompraModal'
import { AnularCompraModal } from '../components/AnularCompraModal'
import type { EstadoCompra } from '../types'

function tono(estado: EstadoCompra): 'recibido' | 'pendiente' | 'rechazado' | 'borrador' {
  if (estado === 'CONFIRMADA') return 'recibido'
  if (estado === 'ANULADA') return 'rechazado'
  return 'borrador'
}

export function CompraDetallePage() {
  const { id } = useParams()
  const compraId = Number(id)
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isLoading, isError } = useCompra(compraId)
  const confirmar = useConfirmarCompra()
  const anular = useAnularCompra()
  const [modal, setModal] = useState<'confirmar' | 'anular' | null>(null)

  if (isLoading) return <div className="p-6"><Spinner /></div>
  if (isError || !data) return <div className="p-6"><EmptyState title="No se pudo cargar la compra" hint="Intenta de nuevo." /></div>

  const onConfirmar = async (observaciones: string) => {
    try { await confirmar.mutateAsync({ id: compraId, dto: { observaciones: observaciones || undefined } }); toast.show('Compra confirmada'); setModal(null) }
    catch { toast.show('No se pudo confirmar', { tone: 'rojo' }) }
  }
  const onAnular = async (motivo: string) => {
    try { await anular.mutateAsync({ id: compraId, dto: { motivo } }); toast.show('Compra anulada'); setModal(null) }
    catch { toast.show('No se pudo anular', { tone: 'rojo' }) }
  }

  const esBorrador = data.estado === 'BORRADOR'
  const esConfirmada = data.estado === 'CONFIRMADA'

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">{data.numeroFactura}</h1>
          <p className="text-sm text-slate"><span>{data.proveedorNombre}</span>{' · '}<span>{data.sucursalNombre}</span></p>
        </div>
        <Badge estado={tono(data.estado)}>{data.estado}</Badge>
      </div>

      <div className="rounded-xl border border-hairline p-4">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-hairline text-left text-slate"><th className="py-2">Concepto</th><th>Cant.</th><th>Costo</th><th>IVA</th><th className="text-right">Total</th></tr></thead>
          <tbody>
            {data.detalles.map((d) => (
              <tr key={`d-${d.id}`} className="border-b border-hairline"><td className="py-2">{d.productoNombre} <span className="text-xs text-slate">({d.bodegaNombre})</span></td><td className="cifra">{d.cantidad}</td><td className="cifra">${d.costoUnitario.toFixed(2)}</td><td className="cifra">${d.iva.toFixed(2)}</td><td className="cifra text-right">${d.total.toFixed(2)}</td></tr>
            ))}
            {data.gastos.map((g) => (
              <tr key={`g-${g.id}`} className="border-b border-hairline"><td className="py-2">{g.descripcion} <span className="text-xs text-slate">(gasto)</span></td><td /><td /><td /><td className="cifra text-right">${g.monto.toFixed(2)}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex justify-end gap-6 text-sm">
          <span className="text-slate">Subtotal <span className="cifra">${data.subtotal.toFixed(2)}</span></span>
          <span className="text-slate">IVA <span className="cifra">${data.iva.toFixed(2)}</span></span>
          <span className="font-semibold text-ink">Total <span className="cifra">${data.total.toFixed(2)}</span></span>
        </div>
      </div>

      <div className="flex gap-2">
        {(esBorrador || esConfirmada) && <Button variant="ghost" onClick={() => navigate(`/compras/${compraId}/editar`)}>Editar</Button>}
        {esBorrador && <Button onClick={() => setModal('confirmar')}>Confirmar</Button>}
        {(esBorrador || esConfirmada) && <Button variant="danger" onClick={() => setModal('anular')}>Anular</Button>}
      </div>

      {modal === 'confirmar' && <ConfirmarCompraModal onConfirmar={onConfirmar} onClose={() => setModal(null)} cargando={confirmar.isPending} />}
      {modal === 'anular' && <AnularCompraModal onConfirmar={onAnular} onClose={() => setModal(null)} cargando={anular.isPending} />}
    </div>
  )
}
