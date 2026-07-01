import { useState } from 'react'
import { Button, Input } from '@/design-system'
import { rangoDePreset, type Preset } from '../date-range'

export interface PeriodoValue { preset: Preset | 'custom'; fechaInicio: string; fechaFin: string }
interface Props { value: PeriodoValue; onChange: (v: PeriodoValue) => void }

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'hoy', label: 'Hoy' }, { key: '7d', label: '7 días' }, { key: '30d', label: '30 días' }, { key: 'mes', label: 'Este mes' },
]

export function PeriodoSelector({ value, onChange }: Props) {
  const [custom, setCustom] = useState(value.preset === 'custom')

  const elegirPreset = (p: Preset) => { setCustom(false); onChange({ preset: p, ...rangoDePreset(p) }) }
  const cambiarFecha = (campo: 'fechaInicio' | 'fechaFin', v: string) => {
    onChange({ ...value, preset: 'custom', [campo]: v ? new Date(v).toISOString() : value[campo] })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <Button key={p.key} variant={!custom && value.preset === p.key ? 'primary' : 'ghost'} size="sm" onClick={() => elegirPreset(p.key)}>{p.label}</Button>
      ))}
      <Button variant={custom ? 'primary' : 'ghost'} size="sm" onClick={() => setCustom(true)}>Personalizado</Button>
      {custom && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate" htmlFor="f-desde">Desde</label>
          <Input id="f-desde" type="date" onChange={(e) => cambiarFecha('fechaInicio', e.target.value)} className="w-40" />
          <label className="text-xs text-slate" htmlFor="f-hasta">Hasta</label>
          <Input id="f-hasta" type="date" onChange={(e) => cambiarFecha('fechaFin', e.target.value)} className="w-40" />
        </div>
      )}
    </div>
  )
}
