// src/features/facturacion/components/CierrePagoSection.tsx
import { Button, FormField, Input } from '@/design-system'
import { useCatalogo } from '../hooks'
import type { FormPago } from '../mappers'

interface Props {
  pagos: FormPago[]
  onChange: (pagos: FormPago[]) => void
}

export function CierrePagoSection({ pagos, onChange }: Props) {
  const formas = useCatalogo('formasPago')
  const set = (idx: number, patch: Partial<FormPago>) => onChange(pagos.map((p, i) => (i === idx ? { ...p, ...patch } : p)))
  const agregar = () => onChange([...pagos, { catFormaPagoId: formas.data?.[0]?.id ?? 1, monto: 0 }])
  const quitar = (idx: number) => onChange(pagos.filter((_, i) => i !== idx))
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate">Cierre de pago</h2>
      {pagos.map((p, idx) => (
        <div key={idx} className="grid grid-cols-2 gap-2">
          <FormField label="Forma de pago" htmlFor={`fp-${idx}`}>
            <select id={`fp-${idx}`} className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-[#16241f]"
              value={p.catFormaPagoId} onChange={(e) => set(idx, { catFormaPagoId: Number(e.target.value) })}>
              {(formas.data ?? []).map((f) => <option key={f.id} value={f.id}>{f.valor}</option>)}
            </select>
          </FormField>
          <FormField label="Monto" htmlFor={`monto-${idx}`}>
            <Input id={`monto-${idx}`} type="number" value={p.monto} onChange={(e) => set(idx, { monto: Number(e.target.value) })} />
          </FormField>
          {pagos.length > 1 && <button type="button" className="text-xs text-rojo" onClick={() => quitar(idx)}>Quitar</button>}
        </div>
      ))}
      <Button variant="ghost" onClick={agregar}>+ Agregar pago</Button>
    </section>
  )
}
