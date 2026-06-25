// src/features/facturacion/components/VistaPreviaDte.tsx
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/design-system'
import type { CreateFacturaDto } from '../types'

interface Props {
  dto: CreateFacturaDto
  codigoGeneracion?: string
  ambiente?: string // '00' pruebas, '01' producción
  onEmitir?: () => void
  emitiendo?: boolean
}

function urlConsultaMh(codGen: string | undefined, fechaEmi: string, ambiente: string): string {
  const cg = codGen ?? 'PENDIENTE'
  return `https://admin.factura.gob.sv/consultaPublica?ambiente=${ambiente}&codGen=${cg}&fechaEmi=${fechaEmi}`
}

export function VistaPreviaDte({ dto, codigoGeneracion, ambiente = '00', onEmitir, emitiendo }: Props) {
  const fmt = (n: number) => `$${n.toFixed(2)}`
  const url = urlConsultaMh(codigoGeneracion, dto.identificacion.fechaEmision, ambiente)
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-hairline bg-surface p-6 print:border-0 dark:bg-[#16241f]">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">Factura Electrónica (01)</h2>
            <p className="text-sm text-slate">Fecha: {dto.identificacion.fechaEmision} {dto.identificacion.horaEmision}</p>
            {codigoGeneracion && <p className="text-xs text-slate">Código generación: {codigoGeneracion}</p>}
          </div>
          <div className="text-center">
            <QRCodeSVG value={url} size={96} />
            <p className="mt-1 text-[10px] text-slate">Válido tras transmisión a MH</p>
          </div>
        </div>

        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-slate">
              <th className="py-1">Descripción</th><th className="py-1">Cant.</th><th className="py-1">Precio</th><th className="py-1">Gravado</th>
            </tr>
          </thead>
          <tbody>
            {dto.cuerpoDocumento.map((it) => (
              <tr key={it.numItem} className="border-b border-hairline">
                <td className="py-1">{it.descripcion}</td>
                <td className="py-1">{it.cantidad}</td>
                <td className="py-1">{fmt(it.precioUni)}</td>
                <td className="py-1">{fmt(it.ventaGravada)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-slate">Gravado</dt><dd>{fmt(dto.resumen.totalGravada)}</dd></div>
          <div className="flex justify-between"><dt className="text-slate">IVA 13%</dt><dd>{fmt(dto.resumen.totalIva)}</dd></div>
          <div className="flex justify-between border-t border-hairline pt-1 font-bold text-sello"><dt>Total</dt><dd>{fmt(dto.resumen.totalPagar)}</dd></div>
        </dl>
        <p className="mt-2 text-xs text-slate">{dto.resumen.totalLetras}</p>
      </div>

      <div className="flex gap-3 print:hidden">
        <Button variant="ghost" onClick={() => window.print()}>Descargar PDF</Button>
        {onEmitir && <Button onClick={onEmitir} disabled={emitiendo}>{emitiendo ? 'Emitiendo…' : 'Emitir DTE'}</Button>}
      </div>
    </div>
  )
}
