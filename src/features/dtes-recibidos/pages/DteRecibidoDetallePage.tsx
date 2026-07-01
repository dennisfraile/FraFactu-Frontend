import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Badge, Spinner, EmptyState, useToast } from '@/design-system'
import { useDteRecibido, useDescartarDte } from '../hooks'
import { parseDteLineas } from '../parse'
import { tonoDteRecibido } from '../estado'
import { DescartarDteModal } from '../components/DescartarDteModal'
import { Can } from '@/lib/authz/Can'
import { DTE_RECIBIDO_GESTIONAR } from '@/lib/authz/acciones'

export function DteRecibidoDetallePage() {
  const { id } = useParams()
  const dteId = Number(id)
  const navigate = useNavigate()
  const { data, isLoading, isError } = useDteRecibido(dteId)
  const toast = useToast()
  const descartar = useDescartarDte()
  const [modal, setModal] = useState(false)

  const onDescartar = async (motivo: string) => {
    try { await descartar.mutateAsync({ id: dteId, motivo }); toast.show('DTE descartado'); setModal(false); navigate('/dtes-recibidos') }
    catch (e) {
      const msg = (e as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error
        ?? (e as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'No se pudo descartar'
      toast.show(msg, { tone: 'rojo' })
    }
  }

  if (isLoading) return <div className="p-6"><Spinner /></div>
  if (isError || !data) return <div className="p-6"><EmptyState title="No se pudo cargar el DTE" hint="Intenta de nuevo." /></div>

  const lineas = parseDteLineas(data.jsonDte)
  const esPendiente = data.estado === 'PENDIENTE'
  const origen = data.emailOrigen ? `Correo (${data.emailOrigen})` : 'Carga manual'

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">{data.numeroControl ?? data.codigoGeneracion}</h1>
          <p className="text-sm text-slate"><span>{data.emisorNombre}</span>{' · NIT '}<span className="cifra">{data.emisorNit}</span>{' · Tipo '}<span className="cifra">{data.tipoDte}</span></p>
        </div>
        <Badge estado={tonoDteRecibido(data.estado)}>{data.estado}</Badge>
      </div>

      <div className="rounded-xl border border-hairline p-4 text-sm">
        <div className="grid grid-cols-2 gap-2 text-slate">
          <span>Fecha emisión: <span className="cifra text-ink">{data.fechaEmision.slice(0, 10)}</span></span>
          <span>Origen: <span className="text-ink">{origen}</span></span>
          <span>Código generación: <span className="cifra text-ink">{data.codigoGeneracion}</span></span>
          {data.selloRecibido && <span>Sello: <span className="cifra text-ink">{data.selloRecibido}</span></span>}
        </div>
      </div>

      <div className="rounded-xl border border-hairline p-4">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-hairline text-left text-slate"><th className="py-2">Descripción</th><th>Cant.</th><th>P. unit.</th><th className="text-right">Gravada</th></tr></thead>
          <tbody>
            {lineas.map((l) => (
              <tr key={l.numItem} className="border-b border-hairline"><td className="py-2">{l.descripcion}</td><td className="cifra">{l.cantidad}</td><td className="cifra">${l.precioUnitario.toFixed(2)}</td><td className="cifra text-right">${l.ventaGravada.toFixed(2)}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex justify-end gap-6 text-sm">
          <span className="text-slate">Subtotal <span className="cifra">${data.subTotal.toFixed(2)}</span></span>
          <span className="text-slate">IVA <span className="cifra">${data.iva.toFixed(2)}</span></span>
          <span className="font-semibold text-ink">Total <span className="cifra">${data.total.toFixed(2)}</span></span>
        </div>
      </div>

      {data.estado === 'VINCULADO' && data.compraExternaId && (
        <p className="rounded-md bg-sello/10 px-3 py-2 text-sm">Vinculado a la <button className="font-medium text-sello hover:underline" onClick={() => navigate(`/compras/${data.compraExternaId}`)}>compra #{data.compraExternaId}</button>.</p>
      )}
      {data.estado === 'DESCARTADO' && <p className="rounded-md bg-rojo/10 px-3 py-2 text-sm text-rojo">Descartado: {data.motivoDescarte}</p>}

      {esPendiente && (
        <Can roles={DTE_RECIBIDO_GESTIONAR}>
          <div className="flex gap-2">
            <Button onClick={() => navigate(`/dtes-recibidos/${dteId}/mapear`)}>Mapear y crear compra</Button>
            <Button variant="danger" onClick={() => setModal(true)}>Descartar</Button>
          </div>
        </Can>
      )}
      {modal && <DescartarDteModal onConfirmar={onDescartar} onClose={() => setModal(false)} cargando={descartar.isPending} />}
    </div>
  )
}
