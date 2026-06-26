import { useMemo } from 'react'
import { numeroALetras } from '../calc/numero-letras'
import { getStrategy } from '../dte/registry'
import type { FormItem } from '../mappers'
import type { TipoDte } from '../types'

export function TotalesPanel({ items, tipoDte = '01', esAgenteRetencion }: { items: FormItem[]; tipoDte?: TipoDte; esAgenteRetencion?: boolean }) {
  const strategy = getStrategy(tipoDte)
  const resumen = useMemo(() => {
    const calc = items
      .filter((i) => i.cantidad > 0 && i.precioUni >= 0)
      .map((i) => strategy.calcItem({ cantidad: i.cantidad, precioUni: i.precioUni, montoDescuento: i.montoDescuento, tipoImpuesto: i.tipoImpuesto }))
    return strategy.calcResumen(calc, { esAgenteRetencion })
  }, [items, strategy, esAgenteRetencion])

  const fmt = (n: number) => `$${n.toFixed(2)}`
  const row = (label: string, value: number) => (
    <div className="flex items-baseline justify-between"><dt className="text-slate">{label}</dt><dd className="cifra text-ink/90 dark:text-white/85">{fmt(value)}</dd></div>
  )
  return (
    <div className="sticky top-4 rounded-xl border border-hairline bg-surface p-5 shadow-card dark:border-white/10 dark:bg-surface-dark dark:shadow-none">
      <p className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-slate/80">
        <span className="h-1.5 w-1.5 rounded-full bg-oro" /> Resumen
      </p>
      <dl className="space-y-1.5 text-sm">
        {tipoDte === '14' ? (
          <>
            {row('Total compras', resumen.totalCompras ?? 0)}
            {(resumen.reteRenta ?? 0) > 0 && row('Retención renta 10%', -(resumen.reteRenta ?? 0))}
            {(resumen.ivaRete1 ?? 0) > 0 && row('Retención IVA 1%', -(resumen.ivaRete1 ?? 0))}
          </>
        ) : tipoDte === '03' ? (
          <>
            {row('Gravado', resumen.totalGravada)}
            {row('Exento', resumen.totalExenta)}
            {row('IVA 13%', resumen.totalIva)}
          </>
        ) : (
          <>
            {row('Gravado', resumen.totalGravada)}
            {row('Exento', resumen.totalExenta)}
            {row('IVA 13%', resumen.totalIva)}
          </>
        )}
      </dl>
      <div className="mt-3 flex items-baseline justify-between rounded-lg bg-oro-tint/70 px-3 py-2.5 dark:bg-oro/10">
        <span className="text-sm font-semibold text-oro-ink dark:text-oro-bright">Total a pagar</span>
        <span className="cifra text-xl font-bold text-oro-ink dark:text-oro-bright">{fmt(resumen.totalPagar)}</span>
      </div>
      <p className="mt-2.5 text-xs leading-snug text-slate">{numeroALetras(resumen.totalPagar)}</p>
    </div>
  )
}
