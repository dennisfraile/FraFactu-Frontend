// src/features/facturacion/components/CuerpoDocumentoTable.tsx
import { Button, FormField, Input } from '@/design-system'
import { ItemPicker } from './ItemPicker'
import { useCatalogo, useBodegas } from '../hooks'
import { TIPO_ITEM } from '../catalogos'
import type { FormItem } from '../mappers'
import type { ProductoListItem, BodegaItem } from '../types'

interface Props {
  items: FormItem[]
  onChange: (items: FormItem[]) => void
  sucursalId: number
}

export function CuerpoDocumentoTable({ items, onChange, sucursalId }: Props) {
  const unidades = useCatalogo('unidadesMedida')
  const bodegas = useBodegas(sucursalId)

  // uniMedida es el Id de catálogo cat_uni_medida. Resolvemos por código MH ('59' = Unidad).
  const unidadIdPorCodigo = (codigo: string) => unidades.data?.find((u) => u.codigo === codigo)?.id
  const unidadPorDefecto = unidadIdPorCodigo('59') ?? unidades.data?.[0]?.id ?? 0
  // Bodega por defecto: la principal de la sucursal, o la primera activa.
  const bodegaPorDefecto = bodegas.data?.find((b) => b.esPrincipal)?.id ?? bodegas.data?.[0]?.id

  const set = (idx: number, patch: Partial<FormItem>) =>
    onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  const agregar = () =>
    onChange([
      ...items,
      { descripcion: '', cantidad: 1, precioUni: 0, uniMedida: unidadPorDefecto, tipoItem: TIPO_ITEM.BIEN, tipoImpuesto: 1, bodegaId: bodegaPorDefecto },
    ])
  const quitar = (idx: number) => onChange(items.filter((_, i) => i !== idx))
  const fromProducto = (idx: number, p: ProductoListItem) => {
    const tipoItem = p.tipoItem === 'Servicio' ? TIPO_ITEM.SERVICIO : TIPO_ITEM.BIEN
    set(idx, {
      productoId: p.id,
      codigo: p.codigo,
      descripcion: p.nombre,
      precioUni: p.precioVenta,
      uniMedida: unidadIdPorCodigo(p.unidadMedida) ?? unidadPorDefecto,
      tipoItem,
      tipoImpuesto: (p.tipoImpuesto as 1 | 2 | 3) || 1,
      // Solo los Bienes (físicos) descargan inventario y requieren bodega.
      bodegaId: tipoItem === TIPO_ITEM.BIEN ? bodegaPorDefecto : undefined,
    })
  }

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
          {it.tipoItem === TIPO_ITEM.BIEN && (
            <div className="mt-2">
              <FormField label="Bodega" htmlFor={`bodega-${idx}`}>
                <select
                  id={`bodega-${idx}`}
                  aria-label="Bodega"
                  className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-[#16241f]"
                  value={it.bodegaId ?? ''}
                  onChange={(e) => set(idx, { bodegaId: e.target.value ? Number(e.target.value) : undefined })}
                >
                  <option value="">Seleccione una bodega</option>
                  {(bodegas.data ?? []).map((b: BodegaItem) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                </select>
              </FormField>
            </div>
          )}
          <div className="mt-2 text-right">
            <button type="button" className="text-xs text-rojo" onClick={() => quitar(idx)}>Eliminar ítem</button>
          </div>
        </div>
      ))}
      {/* Se espera al catálogo de unidades para no crear ítems con uniMedida inválida (0). */}
      <Button variant="ghost" onClick={agregar} disabled={!unidades.data}>+ Agregar ítem</Button>
    </section>
  )
}
