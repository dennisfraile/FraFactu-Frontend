import { useState } from 'react'
import { FormField } from '@/design-system'
import { AsyncSearchSelect } from './AsyncSearchSelect'
import { facturacionApi } from '../api'
import type { BuscarParaNcResultDto, DetalleItemParaNcDto, DocumentoRelacionadoDto, ReceptorListItem, TipoDte } from '../types'
import type { FormItem } from '../mappers'

interface SeleccionPayload {
  documentoRelacionado: DocumentoRelacionadoDto
  receptor: ReceptorListItem
  items: FormItem[]
}
interface Props {
  tipoDte: TipoDte
  prefill: boolean
  onSeleccion: (p: SeleccionPayload) => void
}

function tipoImpuestoDeItem(it: DetalleItemParaNcDto): 1 | 2 | 3 {
  if (it.ventaGravada > 0) return 1
  if (it.ventaExenta > 0) return 2
  return 3
}
function aFormItem(it: DetalleItemParaNcDto): FormItem {
  return {
    codigo: it.codigo ?? undefined,
    descripcion: it.descripcion,
    cantidad: it.cantidad,
    precioUni: it.precioUnitario,
    montoDescuento: it.montoDescuento || undefined,
    uniMedida: it.unidadMedida ?? 0,
    tipoItem: it.tipoItem,
    tipoImpuesto: tipoImpuestoDeItem(it),
  }
}

export function DocumentoOriginalSection({ tipoDte, prefill, onSeleccion }: Props) {
  const [elegido, setElegido] = useState<BuscarParaNcResultDto | null>(null)
  const buscar = (term: string) => (tipoDte === '05' ? facturacionApi.buscarParaNc(term) : facturacionApi.buscarParaNd(term))

  const seleccionar = async (r: BuscarParaNcResultDto) => {
    setElegido(r)
    const detalle = tipoDte === '05' ? await facturacionApi.detalleParaNc(r.id) : await facturacionApi.detalleParaNd(r.id)
    onSeleccion({
      documentoRelacionado: { tipoDocumento: '03', tipoGeneracion: 1, numeroDocumento: r.codigoGeneracion, fechaEmision: r.fechaEmision.slice(0, 10) },
      receptor: {
        id: detalle.receptorId ?? 0,
        tipoDocumentoNombre: '',
        numeroDocumento: detalle.receptorNumDocumento,
        nombreRazonSocial: detalle.receptorNombre,
        correoElectronico: detalle.receptorCorreo ?? '',
        nrc: detalle.receptorNrc ?? '',
      },
      items: prefill ? detalle.items.map(aFormItem) : [],
    })
  }

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-slate/80"><span className="h-1.5 w-1.5 rounded-full bg-oro" />Documento original (CCF)</h2>
      <FormField label="Buscar CCF a referenciar" htmlFor="doc-original">
        <AsyncSearchSelect<BuscarParaNcResultDto>
          onSearch={buscar}
          getLabel={(r) => `${r.numeroControl} · ${r.receptorNombre} · $${r.totalPagar.toFixed(2)} · saldo $${r.saldoDisponible.toFixed(2)}`}
          onSelect={seleccionar}
          placeholder="Buscar por nº de control, receptor o código"
        />
      </FormField>
      {elegido && (
        <div className="rounded-md border border-hairline px-3 py-2 text-sm">
          <div className="font-medium">{elegido.numeroControl}</div>
          <div className="text-slate">{elegido.receptorNombre} · {elegido.receptorNumDocumento}</div>
          <div className="text-slate">Total ${elegido.totalPagar.toFixed(2)} · Saldo disponible ${elegido.saldoDisponible.toFixed(2)}</div>
        </div>
      )}
    </section>
  )
}
