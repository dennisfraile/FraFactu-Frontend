import { Button, FormField, Input, Icon } from '@/design-system'
import { validarCuotas, montoDeCuota, type CuotaDraft, type ModoCuota } from '../calc/cuotas'

interface Props {
  total: number
  drafts: CuotaDraft[]
  modo: ModoCuota
  onDrafts: (d: CuotaDraft[]) => void
  onModo: (m: ModoCuota) => void
  errorBackend?: string | null
}

export function CuotasBuilder({ total, drafts, modo, onDrafts, onModo, errorBackend }: Props) {
  const error = validarCuotas(drafts, modo, total) ?? errorBackend ?? null
  const set = (idx: number, patch: Partial<CuotaDraft>) =>
    onDrafts(drafts.map((d, i) => (i === idx ? { ...d, ...patch } : d)))
  const agregar = () => onDrafts([...drafts, { fechaPactada: '', valor: 0 }])
  const quitar = (idx: number) => onDrafts(drafts.filter((_, i) => i !== idx))
  const fmt = (n: number) => `$${n.toFixed(2)}`

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-slate/80">
          <span className="h-1.5 w-1.5 rounded-full bg-oro" />Plan de cuotas
        </h2>
        <label className="flex items-center gap-2 text-xs">
          Modo
          <select className="rounded-md border border-hairline bg-surface px-2 py-1 text-sm dark:bg-surface-dark"
            value={modo} onChange={(e) => onModo(e.target.value as ModoCuota)}>
            <option value="monto">Monto fijo</option>
            <option value="porcentaje">Porcentaje</option>
          </select>
        </label>
      </div>

      {drafts.map((d, idx) => (
        <div key={idx} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
          <FormField label={`Cuota ${idx + 1} — fecha`} htmlFor={`cuota-fecha-${idx}`}>
            <Input id={`cuota-fecha-${idx}`} type="date" value={d.fechaPactada}
              onChange={(e) => set(idx, { fechaPactada: e.target.value })} />
          </FormField>
          <FormField label={modo === 'monto' ? 'Monto' : 'Porcentaje (valor)'} htmlFor={`cuota-valor-${idx}`}>
            <Input id={`cuota-valor-${idx}`} type="number" value={d.valor}
              onChange={(e) => set(idx, { valor: Number(e.target.value) })} />
          </FormField>
          <div className="pb-2 text-right text-xs text-slate">
            {modo === 'porcentaje' && <span className="cifra">{fmt(montoDeCuota(d, modo, total))}</span>}
            {drafts.length > 2 && (
              <button type="button" className="ml-2 text-rojo" onClick={() => quitar(idx)}>Quitar</button>
            )}
          </div>
        </div>
      ))}

      <Button variant="ghost" onClick={agregar}><Icon name="plus" size={16} />Agregar cuota</Button>
      {error && <p className="rounded-md bg-rojo/10 px-3 py-2 text-sm text-rojo">{error}</p>}
    </section>
  )
}
