// src/features/inventario/components/TributosProductoSection.tsx
import { Button, FormField, Input, Icon } from '@/design-system'
import type { ProductoTributo } from '../types'

export function TributosProductoSection({ tributos, onChange }: { tributos: ProductoTributo[]; onChange: (t: ProductoTributo[]) => void }) {
  const set = (i: number, patch: Partial<ProductoTributo>) => onChange(tributos.map((t, idx) => (idx === i ? { ...t, ...patch } : t)))
  const agregar = () => onChange([...tributos, { codigo: '', tipoCalculo: 'porcentaje', valor: 0 }])
  const quitar = (i: number) => onChange(tributos.filter((_, idx) => idx !== i))
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-slate/80"><span className="h-1.5 w-1.5 rounded-full bg-oro" />Tributos adicionales (opcional)</h2>
      {tributos.map((t, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
          <FormField label="Código" htmlFor={`trib-cod-${i}`}><Input id={`trib-cod-${i}`} value={t.codigo} onChange={(e) => set(i, { codigo: e.target.value })} /></FormField>
          <FormField label="Tipo cálculo" htmlFor={`trib-tc-${i}`}>
            <select id={`trib-tc-${i}`} className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark" value={t.tipoCalculo ?? 'porcentaje'} onChange={(e) => set(i, { tipoCalculo: e.target.value })}>
              <option value="porcentaje">Porcentaje</option>
              <option value="monto_fijo">Monto fijo</option>
            </select>
          </FormField>
          <FormField label="Valor" htmlFor={`trib-val-${i}`}><Input id={`trib-val-${i}`} type="number" value={t.valor ?? 0} onChange={(e) => set(i, { valor: Number(e.target.value) })} /></FormField>
          <button type="button" className="pb-2 text-xs text-rojo" onClick={() => quitar(i)}>Quitar</button>
        </div>
      ))}
      <Button variant="ghost" onClick={agregar}><Icon name="plus" size={16} />Agregar tributo</Button>
    </section>
  )
}
