// src/features/dtes-recibidos/components/MapeoLineasTable.tsx
import { useQuery } from '@tanstack/react-query'
import { FormField, Input } from '@/design-system'
import { AsyncSearchSelect } from '@/features/facturacion/components/AsyncSearchSelect'
import { productosApi, bodegasApi } from '@/features/facturacion/catalogos-api'
import { useCatalogo } from '@/features/facturacion/hooks'
import { useTiposGasto } from '@/features/compras/hooks'
import type { ProductoListItem } from '@/features/facturacion/types'
import { calcCuadre, totalLineaMapeo } from '../calc/mapeo'
import type { MapeoLineaForm } from '../mappers'
import type { AccionMapeo } from '../types'

interface Props {
  lineas: MapeoLineaForm[]
  onLineas: (l: MapeoLineaForm[]) => void
  sucursalId: number | null
  totalDte: number
  ivaDte: number
  subTotalDte: number
}

const ACCIONES: { id: AccionMapeo; label: string }[] = [
  { id: 'PRODUCTO_EXISTENTE', label: 'Existente' },
  { id: 'PRODUCTO_NUEVO', label: 'Nuevo' },
  { id: 'GASTO', label: 'Gasto' },
]

export function MapeoLineasTable({ lineas, onLineas, sucursalId, totalDte, ivaDte, subTotalDte }: Props) {
  const tiposGasto = useTiposGasto()
  const tiposItem = useCatalogo('tiposItems')
  const unidades = useCatalogo('unidadesMedida')
  const bodegas = useQuery({
    queryKey: ['bodegas', sucursalId],
    queryFn: () => bodegasApi.porSucursal(sucursalId!),
    enabled: Number.isFinite(sucursalId),
  })

  const set = (idx: number, patch: Partial<MapeoLineaForm>) =>
    onLineas(lineas.map((l, i) => (i === idx ? { ...l, ...patch } : l)))
  const setNuevo = (idx: number, patch: Partial<MapeoLineaForm['nuevo']>) =>
    onLineas(lineas.map((l, i) => (i === idx ? { ...l, nuevo: { ...l.nuevo, ...patch } } : l)))

  const dteCtx = { iva: ivaDte, subTotal: subTotalDte }
  const cuadre = calcCuadre(lineas.map((l) => ({ accion: l.accion, cantidad: l.cantidad, costoUnitario: l.costoUnitario, montoDte: l.montoDte })), totalDte, dteCtx)

  return (
    <section className="space-y-3">
      {lineas.map((l, idx) => {
        const total = totalLineaMapeo({ accion: l.accion, cantidad: l.cantidad, costoUnitario: l.costoUnitario, montoDte: l.montoDte }, dteCtx)
        return (
          <div key={l.uid} className="rounded-lg border border-hairline p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-ink">{l.descripcionDte}</p>
              <span className="cifra text-sm text-slate">${total.toFixed(2)}</span>
            </div>

            <div className="mt-2 flex gap-1">
              {ACCIONES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={`rounded-md px-2 py-1 text-xs ${l.accion === a.id ? 'bg-sello text-white' : 'border border-hairline text-slate'}`}
                  onClick={() => set(idx, { accion: a.id })}
                >
                  {a.label}
                </button>
              ))}
            </div>

            {(l.accion === 'PRODUCTO_EXISTENTE' || l.accion === 'PRODUCTO_NUEVO') && (
              <div className="mt-2 space-y-2">
                {l.accion === 'PRODUCTO_EXISTENTE' && (
                  l.productoId
                    ? <div className="flex items-center gap-3 text-sm"><span>{l.productoLabel}</span><button type="button" className="text-xs text-sello hover:underline" onClick={() => set(idx, { productoId: null, productoLabel: '' })}>Cambiar</button></div>
                    : <AsyncSearchSelect<ProductoListItem> onSearch={(t) => productosApi.search(t, sucursalId ?? undefined)} getLabel={(x) => `${x.codigo} — ${x.nombre}`} onSelect={(x) => set(idx, { productoId: x.id, productoLabel: `${x.codigo} — ${x.nombre}` })} placeholder="Buscar producto" />
                )}

                {l.accion === 'PRODUCTO_NUEVO' && (
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    <FormField label="Código" htmlFor={`pn-cod-${idx}`}><Input id={`pn-cod-${idx}`} value={l.nuevo.codigo} onChange={(e) => setNuevo(idx, { codigo: e.target.value })} /></FormField>
                    <FormField label="Nombre" htmlFor={`pn-nom-${idx}`}><Input id={`pn-nom-${idx}`} value={l.nuevo.nombre} onChange={(e) => setNuevo(idx, { nombre: e.target.value })} /></FormField>
                    <FormField label="Tipo de ítem" htmlFor={`pn-ti-${idx}`}>
                      <select id={`pn-ti-${idx}`} className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark" value={l.nuevo.catTipoItemId ?? ''} onChange={(e) => setNuevo(idx, { catTipoItemId: e.target.value ? Number(e.target.value) : null })}>
                        <option value="">Seleccione…</option>
                        {(tiposItem.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.valor}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Unidad" htmlFor={`pn-uni-${idx}`}>
                      <select id={`pn-uni-${idx}`} className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark" value={l.nuevo.catUnidadMedidaId ?? ''} onChange={(e) => setNuevo(idx, { catUnidadMedidaId: e.target.value ? Number(e.target.value) : null })}>
                        <option value="">Seleccione…</option>
                        {(unidades.data ?? []).map((u) => <option key={u.id} value={u.id}>{u.valor}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Tipo inventario" htmlFor={`pn-inv-${idx}`}>
                      <select id={`pn-inv-${idx}`} className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark" value={l.nuevo.tipoInventario} onChange={(e) => setNuevo(idx, { tipoInventario: Number(e.target.value) })}>
                        <option value={0}>Ventas</option>
                        <option value={1}>Mobiliario/Equipo</option>
                        <option value={2}>Insumos</option>
                      </select>
                    </FormField>
                    {l.nuevo.tipoInventario === 1 && (
                      <FormField label="Años vida útil" htmlFor={`pn-vu-${idx}`}><Input id={`pn-vu-${idx}`} type="number" value={l.nuevo.aniosVidaUtil ?? ''} onChange={(e) => setNuevo(idx, { aniosVidaUtil: e.target.value ? Number(e.target.value) : null })} /></FormField>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <FormField label="Cantidad" htmlFor={`m-cant-${idx}`}><Input id={`m-cant-${idx}`} type="number" value={l.cantidad} onChange={(e) => set(idx, { cantidad: Number(e.target.value) })} /></FormField>
                  <FormField label="Costo unitario" htmlFor={`m-cost-${idx}`}><Input id={`m-cost-${idx}`} type="number" value={l.costoUnitario} onChange={(e) => set(idx, { costoUnitario: Number(e.target.value) })} /></FormField>
                  <FormField label="Bodega" htmlFor={`m-bod-${idx}`}>
                    <select id={`m-bod-${idx}`} aria-label="Bodega" className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark" value={l.bodegaId ?? ''} onChange={(e) => set(idx, { bodegaId: e.target.value ? Number(e.target.value) : null })}>
                      <option value="">Seleccione…</option>
                      {(bodegas.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                    </select>
                  </FormField>
                </div>
              </div>
            )}

            {l.accion === 'GASTO' && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <FormField label="Monto" htmlFor={`g-mon-${idx}`}><Input id={`g-mon-${idx}`} type="number" value={l.montoDte} onChange={(e) => set(idx, { montoDte: Number(e.target.value) })} /></FormField>
                <FormField label="Tipo de gasto" htmlFor={`g-tipo-${idx}`}>
                  <select id={`g-tipo-${idx}`} className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark" value={l.catTipoGastoId ?? ''} onChange={(e) => set(idx, { catTipoGastoId: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">(Opcional)</option>
                    {(tiposGasto.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                </FormField>
              </div>
            )}
          </div>
        )
      })}

      <div className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${cuadre.cuadra ? 'bg-sello/10 text-sello' : 'bg-rojo/10 text-rojo'}`}>
        <span>Mapeado <span className="cifra">${cuadre.totalMapeado.toFixed(2)}</span> / DTE <span className="cifra">${totalDte.toFixed(2)}</span></span>
        <span>{cuadre.cuadra ? '✓ Cuadra' : `Diferencia $${cuadre.diferencia.toFixed(2)}`}</span>
      </div>
    </section>
  )
}
