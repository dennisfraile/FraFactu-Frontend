// src/features/compras/components/CompraLineasTable.tsx
import { useState } from 'react'
import { Tabs, Button, FormField, Input, Icon } from '@/design-system'
import { AsyncSearchSelect } from '@/features/facturacion/components/AsyncSearchSelect'
import { productosApi, bodegasApi } from '../catalogos-api'
import { useQuery } from '@tanstack/react-query'
import { useTiposGasto } from '../hooks'
import { calcLineaProducto } from '../calc/compra'
import { nuevaLineaProducto, nuevaLineaGasto, type FormProductoLinea, type FormGastoLinea } from '../mappers'
import type { ProductoListItem } from '@/features/facturacion/types'

interface Props {
  productos: FormProductoLinea[]
  onProductos: (l: FormProductoLinea[]) => void
  gastos: FormGastoLinea[]
  onGastos: (l: FormGastoLinea[]) => void
  sucursalId: number | null
}

export function CompraLineasTable({ productos, onProductos, gastos, onGastos, sucursalId }: Props) {
  const [tab, setTab] = useState('productos')
  const tiposGasto = useTiposGasto()
  const bodegas = useQuery({
    queryKey: ['bodegas', sucursalId],
    queryFn: () => bodegasApi.porSucursal(sucursalId!),
    enabled: Number.isFinite(sucursalId),
  })

  const setProd = (idx: number, patch: Partial<FormProductoLinea>) =>
    onProductos(productos.map((p, i) => (i === idx ? { ...p, ...patch } : p)))
  const agregarProd = () => onProductos([...productos, nuevaLineaProducto()])
  const quitarProd = (idx: number) => onProductos(productos.filter((_, i) => i !== idx))
  const desdeProducto = (idx: number, p: ProductoListItem) => {
    const esServicio = p.tipoItem === 'Servicio'
    setProd(idx, {
      productoId: p.id,
      codigo: p.codigo,
      descripcion: p.nombre,
      costoUnitario: p.precioVenta,
      aplicaIva: p.tipoImpuesto === 1,
      esParaInventario: !esServicio,
      bodegaId: esServicio ? null : (bodegas.data?.find((b) => b.esPrincipal)?.id ?? bodegas.data?.[0]?.id ?? null),
    })
  }

  const setGasto = (idx: number, patch: Partial<FormGastoLinea>) =>
    onGastos(gastos.map((g, i) => (i === idx ? { ...g, ...patch } : g)))
  const agregarGasto = () => onGastos([...gastos, nuevaLineaGasto()])
  const quitarGasto = (idx: number) => onGastos(gastos.filter((_, i) => i !== idx))

  return (
    <section className="space-y-3">
      <Tabs tabs={[{ id: 'productos', label: `Productos (${productos.length})` }, { id: 'gastos', label: `Gastos (${gastos.length})` }]} active={tab} onChange={setTab} />

      {tab === 'productos' && (
        <div className="space-y-3">
          {productos.map((p, idx) => {
            const calc = calcLineaProducto({ cantidad: p.cantidad, costoUnitario: p.costoUnitario, aplicaIva: p.aplicaIva, ivaManual: p.ivaManual })
            return (
              <div key={idx} className="rounded-lg border border-hairline p-3">
                <div className="mb-2"><AsyncSearchSelect<ProductoListItem> onSearch={(t) => productosApi.search(t, sucursalId ?? undefined)} getLabel={(x) => `${x.codigo} — ${x.nombre}`} onSelect={(x) => desdeProducto(idx, x)} placeholder="Buscar producto" /></div>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <FormField label="Descripción" htmlFor={`d-${idx}`}><Input id={`d-${idx}`} value={p.descripcion} onChange={(e) => setProd(idx, { descripcion: e.target.value })} /></FormField>
                  <FormField label="Cantidad" htmlFor={`c-${idx}`}><Input id={`c-${idx}`} type="number" value={p.cantidad} onChange={(e) => setProd(idx, { cantidad: Number(e.target.value) })} /></FormField>
                  <FormField label="Costo unitario" htmlFor={`co-${idx}`}><Input id={`co-${idx}`} type="number" value={p.costoUnitario} onChange={(e) => setProd(idx, { costoUnitario: Number(e.target.value) })} /></FormField>
                  <FormField label="IVA" htmlFor={`iva-${idx}`}><Input id={`iva-${idx}`} type="number" value={p.ivaManual ?? calc.iva} onChange={(e) => setProd(idx, { ivaManual: Number(e.target.value) })} /></FormField>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate">
                    <input type="checkbox" checked={p.esParaInventario} onChange={(e) => setProd(idx, { esParaInventario: e.target.checked, bodegaId: e.target.checked ? p.bodegaId : null })} />
                    Va a inventario
                  </label>
                  {p.esParaInventario && (
                    <FormField label="Bodega" htmlFor={`b-${idx}`}>
                      <select id={`b-${idx}`} aria-label="Bodega" className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark" value={p.bodegaId ?? ''} onChange={(e) => setProd(idx, { bodegaId: e.target.value ? Number(e.target.value) : null })}>
                        <option value="">Seleccione una bodega</option>
                        {(bodegas.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                      </select>
                    </FormField>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="cifra text-sm text-slate">Total línea: <strong>${calc.total.toFixed(2)}</strong></span>
                  <button type="button" className="text-xs text-rojo" onClick={() => quitarProd(idx)}>Eliminar</button>
                </div>
              </div>
            )
          })}
          <Button variant="ghost" onClick={agregarProd}><Icon name="plus" size={16} />Agregar producto</Button>
        </div>
      )}

      {tab === 'gastos' && (
        <div className="space-y-3">
          {gastos.map((g, idx) => (
            <div key={idx} className="rounded-lg border border-hairline p-3">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <FormField label="Descripción del gasto" htmlFor={`gd-${idx}`}><Input id={`gd-${idx}`} value={g.descripcion} onChange={(e) => setGasto(idx, { descripcion: e.target.value })} /></FormField>
                <FormField label="Monto" htmlFor={`gm-${idx}`}><Input id={`gm-${idx}`} type="number" value={g.monto} onChange={(e) => setGasto(idx, { monto: Number(e.target.value) })} /></FormField>
                <FormField label="Tipo de gasto" htmlFor={`gt-${idx}`}>
                  <select id={`gt-${idx}`} className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark" value={g.catTipoGastoId ?? ''} onChange={(e) => setGasto(idx, { catTipoGastoId: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">(Opcional)</option>
                    {(tiposGasto.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                </FormField>
                <FormField label="Centro de costo" htmlFor={`gc-${idx}`}><Input id={`gc-${idx}`} value={g.centroCosto} onChange={(e) => setGasto(idx, { centroCosto: e.target.value })} /></FormField>
              </div>
              <div className="mt-2 text-right"><button type="button" className="text-xs text-rojo" onClick={() => quitarGasto(idx)}>Eliminar</button></div>
            </div>
          ))}
          <Button variant="ghost" onClick={agregarGasto}><Icon name="plus" size={16} />Agregar gasto</Button>
        </div>
      )}
    </section>
  )
}
