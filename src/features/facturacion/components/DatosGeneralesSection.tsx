// src/features/facturacion/components/DatosGeneralesSection.tsx
import { FormField } from '@/design-system'
import { ReceptorPicker } from './ReceptorPicker'
import { useSucursales, useVendedores, useCatalogo } from '../hooks'
import type { Sucursal, Vendedor, ReceptorListItem } from '../types'

interface Props {
  sucursalId: number
  onSucursalId: (id: number) => void
  esConsumidorFinal: boolean
  onEsConsumidorFinal: (v: boolean) => void
  receptor: ReceptorListItem | null
  onReceptor: (r: ReceptorListItem | null) => void
  vendedorId: number | null
  onVendedorId: (id: number | null) => void
  condicionOperacion: number
  onCondicionOperacion: (c: number) => void
}

export function DatosGeneralesSection(p: Props) {
  const sucursales = useSucursales()
  const vendedores = useVendedores(p.sucursalId)
  const condiciones = useCatalogo('condicionesOperacion')
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate">Datos generales</h2>
      <FormField label="Sucursal" htmlFor="sucursal">
        <select id="sucursal" className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-[#16241f]"
          value={p.sucursalId} onChange={(e) => p.onSucursalId(Number(e.target.value))}>
          {(sucursales.data ?? []).map((s: Sucursal) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
      </FormField>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={p.esConsumidorFinal} onChange={(e) => p.onEsConsumidorFinal(e.target.checked)} />
        Consumidor Final
      </label>
      {!p.esConsumidorFinal && (
        <FormField label="Receptor" htmlFor="receptor">
          {p.receptor
            ? <div className="flex items-center justify-between rounded-md border border-hairline px-3 py-2 text-sm">
                <span>{p.receptor.nombreRazonSocial}</span>
                <button type="button" className="text-xs text-sello" onClick={() => p.onReceptor(null)}>Cambiar</button>
              </div>
            : <ReceptorPicker onSelect={p.onReceptor} />}
        </FormField>
      )}
      <FormField label="Vendedor (opcional)" htmlFor="vendedor">
        <select id="vendedor" className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-[#16241f]"
          value={p.vendedorId ?? ''} onChange={(e) => p.onVendedorId(e.target.value ? Number(e.target.value) : null)}>
          <option value="">—</option>
          {(vendedores.data ?? []).map((v: Vendedor) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
        </select>
      </FormField>
      <FormField label="Condición de operación" htmlFor="condicion">
        <select id="condicion" className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-[#16241f]"
          value={p.condicionOperacion} onChange={(e) => p.onCondicionOperacion(Number(e.target.value))}>
          {(condiciones.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.valor}</option>)}
        </select>
      </FormField>
    </section>
  )
}
