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
      <div className="overflow-hidden rounded-xl border border-hairline bg-surface shadow-card print:border-0 print:shadow-none dark:border-white/10 dark:bg-surface-dark dark:shadow-none">
        {/* Cabecera del documento con franja sello. */}
        <div className="flex items-start justify-between gap-4 border-b border-hairline bg-sello-tint/50 px-6 py-4 dark:border-white/10 dark:bg-sello/10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-semibold text-ink dark:text-white">Factura Electrónica</h2>
              <span className="rounded-md bg-sello px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white ring-1 ring-oro/40">01</span>
            </div>
            <p className="mt-0.5 text-sm text-slate">Fecha: <span className="cifra">{dto.identificacion.fechaEmision} {dto.identificacion.horaEmision}</span></p>
            {codigoGeneracion && <p className="text-xs text-slate">Código generación: <span className="cifra">{codigoGeneracion}</span></p>}
          </div>
          {/* Sello de recepción (QR enmarcado en oro). */}
          <div className="shrink-0 rounded-lg border border-oro/40 bg-surface p-2 text-center dark:bg-surface-dark">
            <QRCodeSVG value={url} size={88} />
            <p className="mt-1 max-w-[96px] text-[9px] leading-tight text-slate">Válido tras transmisión a MH</p>
          </div>
        </div>

        <div className="px-6 py-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left font-mono text-[11px] uppercase tracking-wide text-slate/80">
                <th className="pb-2 font-medium">Descripción</th>
                <th className="pb-2 text-right font-medium">Cant.</th>
                <th className="pb-2 text-right font-medium">Precio</th>
                <th className="pb-2 text-right font-medium">Gravado</th>
              </tr>
            </thead>
            <tbody>
              {dto.cuerpoDocumento.map((it) => (
                <tr key={it.numItem} className="border-b border-hairline/70">
                  <td className="py-2">{it.descripcion}</td>
                  <td className="cifra py-2 text-right">{it.cantidad}</td>
                  <td className="cifra py-2 text-right">{fmt(it.precioUni)}</td>
                  <td className="cifra py-2 text-right">{fmt(it.ventaGravada)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <dl className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm">
            <div className="flex items-baseline justify-between"><dt className="text-slate">Gravado</dt><dd className="cifra text-ink/90 dark:text-white/85">{fmt(dto.resumen.totalGravada)}</dd></div>
            <div className="flex items-baseline justify-between"><dt className="text-slate">IVA 13%</dt><dd className="cifra text-ink/90 dark:text-white/85">{fmt(dto.resumen.totalIva)}</dd></div>
            <div className="mt-1 flex items-baseline justify-between rounded-lg bg-oro-tint/70 px-3 py-2 dark:bg-oro/10">
              <dt className="font-semibold text-oro-ink dark:text-oro-bright">Total</dt>
              <dd className="cifra text-lg font-bold text-oro-ink dark:text-oro-bright">{fmt(dto.resumen.totalPagar)}</dd>
            </div>
          </dl>
          <p className="mt-2.5 text-xs leading-snug text-slate">{dto.resumen.totalLetras}</p>
        </div>
      </div>

      <div className="flex gap-3 print:hidden">
        <Button variant="ghost" onClick={() => window.print()}>Descargar PDF</Button>
        {onEmitir && <Button onClick={onEmitir} disabled={emitiendo}>{emitiendo ? 'Emitiendo…' : 'Emitir DTE'}</Button>}
      </div>
    </div>
  )
}
