import { useMemo } from 'react'
import { calcularItemFactura01, calcularResumenFactura01 } from '../calc/factura01'
import { numeroALetras } from '../calc/numero-letras'
import type { FormItem } from '../mappers'

export function TotalesPanel({ items }: { items: FormItem[] }) {
  const resumen = useMemo(() => {
    const calc = items
      .filter((i) => i.cantidad > 0 && i.precioUni >= 0)
      .map((i) => calcularItemFactura01({ cantidad: i.cantidad, precioUni: i.precioUni, montoDescuento: i.montoDescuento, tipoImpuesto: i.tipoImpuesto }))
    return calcularResumenFactura01(calc)
  }, [items])

  const fmt = (n: number) => `$${n.toFixed(2)}`
  return (
    <div className="sticky top-4 rounded-xl border border-hairline bg-surface p-5 shadow-card dark:border-white/10 dark:bg-surface-dark dark:shadow-none">
      <p className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-slate/80">
        <span className="h-1.5 w-1.5 rounded-full bg-oro" /> Resumen
      </p>
      <dl className="space-y-1.5 text-sm">
        <div className="flex items-baseline justify-between"><dt className="text-slate">Gravado</dt><dd className="cifra text-ink/90 dark:text-white/85">{fmt(resumen.totalGravada)}</dd></div>
        <div className="flex items-baseline justify-between"><dt className="text-slate">Exento</dt><dd className="cifra text-ink/90 dark:text-white/85">{fmt(resumen.totalExenta)}</dd></div>
        <div className="flex items-baseline justify-between"><dt className="text-slate">IVA 13%</dt><dd className="cifra text-ink/90 dark:text-white/85">{fmt(resumen.totalIva)}</dd></div>
      </dl>
      {/* El total es el momento "lacre": cifra dorada, embosada. */}
      <div className="mt-3 flex items-baseline justify-between rounded-lg bg-oro-tint/70 px-3 py-2.5 dark:bg-oro/10">
        <span className="text-sm font-semibold text-oro-ink dark:text-oro-bright">Total a pagar</span>
        <span className="cifra text-xl font-bold text-oro-ink dark:text-oro-bright">{fmt(resumen.totalPagar)}</span>
      </div>
      <p className="mt-2.5 text-xs leading-snug text-slate">{numeroALetras(resumen.totalPagar)}</p>
    </div>
  )
}
