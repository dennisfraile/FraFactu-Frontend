// src/features/facturacion/components/CuerpoDocumentoTable.tsx
import { Button, FormField, Input } from '@/design-system'
import { ItemPicker } from './ItemPicker'
import type { FormItem } from '../mappers'
import type { ProductoListItem } from '../types'

interface Props {
  items: FormItem[]
  onChange: (items: FormItem[]) => void
  sucursalId: number
}

const itemVacio: FormItem = { descripcion: '', cantidad: 1, precioUni: 0, uniMedida: 59, tipoItem: 1, tipoImpuesto: 1 }

export function CuerpoDocumentoTable({ items, onChange, sucursalId }: Props) {
  const set = (idx: number, patch: Partial<FormItem>) =>
    onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  const agregar = () => onChange([...items, { ...itemVacio }])
  const quitar = (idx: number) => onChange(items.filter((_, i) => i !== idx))
  const fromProducto = (idx: number, p: ProductoListItem) =>
    set(idx, { productoId: p.id, codigo: p.codigo, descripcion: p.nombre, precioUni: p.precioVenta, uniMedida: Number(p.unidadMedida) || 59, tipoImpuesto: (p.tipoImpuesto as 1 | 2 | 3) || 1 })

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate">Cuerpo del documento</h2>
      {items.map((it, idx) => (
        <div key={idx} className="rounded-lg border border-hairline p-3">
          <div className="mb-2"><ItemPicker sucursalId={sucursalId} onSelect={(p) => fromProducto(idx, p)} /></div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <FormField label="Descripción" htmlFor={`desc-${idx}`}>
              <Input id={`desc-${idx}`} value={it.descripcion} onChange={(e) => set(idx, { descripcion: e.target.value })} />
            </FormField>
            <FormField label="Cantidad" htmlFor={`cant-${idx}`}>
              <Input id={`cant-${idx}`} type="number" value={it.cantidad} onChange={(e) => set(idx, { cantidad: Number(e.target.value) })} />
            </FormField>
            <FormField label="Precio" htmlFor={`precio-${idx}`}>
              <Input id={`precio-${idx}`} type="number" value={it.precioUni} onChange={(e) => set(idx, { precioUni: Number(e.target.value) })} />
            </FormField>
            <FormField label="Descuento" htmlFor={`desc2-${idx}`}>
              <Input id={`desc2-${idx}`} type="number" value={it.montoDescuento ?? 0} onChange={(e) => set(idx, { montoDescuento: Number(e.target.value) })} />
            </FormField>
          </div>
          <div className="mt-2 text-right">
            <button type="button" className="text-xs text-rojo" onClick={() => quitar(idx)}>Eliminar ítem</button>
          </div>
        </div>
      ))}
      <Button variant="ghost" onClick={agregar}>+ Agregar ítem</Button>
    </section>
  )
}
