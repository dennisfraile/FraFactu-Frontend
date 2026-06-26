import { calcLineaProducto, calcTotalesCompra } from '../calc/compra'
import type { FormProductoLinea, FormGastoLinea } from '../mappers'

interface Props {
  productos: FormProductoLinea[]
  gastos: FormGastoLinea[]
}

export function CompraTotalesPanel({ productos, gastos }: Props) {
  const calc = productos.map((p) => calcLineaProducto({ cantidad: p.cantidad, costoUnitario: p.costoUnitario, aplicaIva: p.aplicaIva, ivaManual: p.ivaManual }))
  const { subtotal, iva, total } = calcTotalesCompra(calc, gastos.map((g) => ({ monto: g.monto })))

  const fila = (label: string, valor: number, fuerte = false) => (
    <div className={`flex items-center justify-between ${fuerte ? 'border-t border-hairline pt-2 text-base font-semibold text-ink' : 'text-sm text-slate'}`}>
      <span>{label}</span>
      <span className="cifra tabular">${valor.toFixed(2)}</span>
    </div>
  )

  return (
    <aside className="sticky top-6 h-fit space-y-2 rounded-xl border border-hairline p-4">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate/80">Totales</h2>
      {fila('Subtotal', subtotal)}
      {fila('IVA', iva)}
      {fila('Total', total, true)}
    </aside>
  )
}
