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
    <div className="sticky top-4 rounded-xl border border-hairline bg-surface p-4 dark:bg-[#16241f]">
      <h3 className="mb-3 text-sm font-semibold text-ink">Resumen</h3>
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between"><dt className="text-slate">Gravado</dt><dd>{fmt(resumen.totalGravada)}</dd></div>
        <div className="flex justify-between"><dt className="text-slate">Exento</dt><dd>{fmt(resumen.totalExenta)}</dd></div>
        <div className="flex justify-between"><dt className="text-slate">IVA 13%</dt><dd>{fmt(resumen.totalIva)}</dd></div>
        <div className="mt-2 flex justify-between border-t border-hairline pt-2 text-base font-bold text-sello"><dt>Total</dt><dd>{fmt(resumen.totalPagar)}</dd></div>
      </dl>
      <p className="mt-2 text-xs text-slate">{numeroALetras(resumen.totalPagar)}</p>
    </div>
  )
}
