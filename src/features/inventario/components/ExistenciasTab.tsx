// src/features/inventario/components/ExistenciasTab.tsx
import { useState } from 'react'
import { Input, Spinner, EmptyState, Badge, Button, useToast } from '@/design-system'
import { useAuthStore } from '@/app/auth-store'
import { Can } from '@/lib/authz/Can'
import { INVENTARIO_AJUSTAR } from '@/lib/authz/acciones'
import { useStock, useBajoMinimo, useSinMovimiento, useAjustarStock, useTrasladarStock } from '../hooks'
import { AjusteStockModal } from './AjusteStockModal'
import { TrasladoStockModal } from './TrasladoStockModal'
import type { AjusteInventarioDto, TrasladoInventarioDto } from '../types'

type Vista = 'todas' | 'bajo' | 'sin'
const fmt = (n: number) => `$${n.toFixed(2)}`

export function ExistenciasTab() {
  const user = useAuthStore((s) => s.user)
  const sucursalId = user?.sucursalIds?.[0] ?? 2
  const toast = useToast()
  const [vista, setVista] = useState<Vista>('todas')
  const [search, setSearch] = useState('')
  const stock = useStock({ search: search || undefined, page: 1, pageSize: 50 })
  const bajo = useBajoMinimo()
  const sin = useSinMovimiento()
  const ajustar = useAjustarStock()
  const trasladar = useTrasladarStock()
  const [ajusteProd, setAjusteProd] = useState<{ id: number; nombre: string } | null>(null)
  const [trasladoProd, setTrasladoProd] = useState<{ id: number; nombre: string } | null>(null)
  const sel = 'rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark'

  const onAjustar = async (dto: AjusteInventarioDto) => {
    try { await ajustar.mutateAsync(dto); toast.show('Ajuste registrado'); setAjusteProd(null) }
    catch (e) { toast.show((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'No se pudo ajustar', { tone: 'rojo' }) }
  }
  const onTrasladar = async (dto: TrasladoInventarioDto) => {
    try { await trasladar.mutateAsync(dto); toast.show('Traslado registrado'); setTrasladoProd(null) }
    catch (e) { toast.show((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'No se pudo trasladar', { tone: 'rojo' }) }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <select className={sel} value={vista} onChange={(e) => setVista(e.target.value as Vista)}>
          <option value="todas">Todas las existencias</option>
          <option value="bajo">Bajo mínimo</option>
          <option value="sin">Sin movimiento</option>
        </select>
        {vista === 'todas' && <Input placeholder="Buscar producto" value={search} onChange={(e) => setSearch(e.target.value)} />}
      </div>

      {vista === 'todas' && (
        stock.isLoading ? <Spinner /> : !stock.data?.items.length ? <EmptyState title="Sin existencias" hint="No hay stock para mostrar." /> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wide text-slate/70"><th className="py-2">Producto</th><th>Bodega</th><th className="text-right">Disponible</th><th className="text-right">Costo prom.</th><th className="text-right">Valor</th><th /></tr></thead>
            <tbody>
              {stock.data.items.map((s) => {
                const bajoMin = s.stockMinimo != null && s.cantidadDisponible <= s.stockMinimo
                return (
                  <tr key={`${s.productoId}-${s.bodegaId}`} className="border-t border-hairline">
                    <td className="py-2">{s.productoNombre} {bajoMin && <Badge estado="rechazado">Bajo mínimo</Badge>}</td>
                    <td>{s.bodegaNombre}</td>
                    <td className="cifra text-right">{s.cantidadDisponible}</td>
                    <td className="cifra text-right">{fmt(s.costoPromedio)}</td>
                    <td className="cifra text-right">{fmt(s.valorStock)}</td>
                    <td className="space-x-2 text-right">
                      <Can roles={INVENTARIO_AJUSTAR}>
                        <Button variant="ghost" onClick={() => setAjusteProd({ id: s.productoId, nombre: s.productoNombre })}>Ajustar</Button>
                        <Button variant="ghost" onClick={() => setTrasladoProd({ id: s.productoId, nombre: s.productoNombre })}>Trasladar</Button>
                      </Can>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )
      )}

      {vista === 'bajo' && (
        bajo.isLoading ? <Spinner /> : !bajo.data?.length ? <EmptyState title="Todo en orden" hint="No hay productos bajo mínimo." /> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wide text-slate/70"><th className="py-2">Producto</th><th className="text-right">Mínimo</th><th className="text-right">Actual</th><th>Estado</th></tr></thead>
            <tbody>{bajo.data.map((b) => <tr key={b.productoId} className="border-t border-hairline"><td className="py-2">{b.productoNombre}</td><td className="cifra text-right">{b.stockMinimo}</td><td className="cifra text-right">{b.stockActual}</td><td>{b.estado}</td></tr>)}</tbody>
          </table>
        )
      )}

      {vista === 'sin' && (
        sin.isLoading ? <Spinner /> : !sin.data?.length ? <EmptyState title="Sin resultados" hint="No hay productos sin movimiento." /> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wide text-slate/70"><th className="py-2">Producto</th><th className="text-right">Stock</th><th className="text-right">Días sin mov.</th></tr></thead>
            <tbody>{sin.data.map((p) => <tr key={p.productoId} className="border-t border-hairline"><td className="py-2">{p.productoNombre}</td><td className="cifra text-right">{p.stockActual}</td><td className="text-right">{p.diasSinMovimiento}</td></tr>)}</tbody>
          </table>
        )
      )}

      {ajusteProd && <AjusteStockModal producto={ajusteProd} sucursalId={sucursalId} onConfirmar={onAjustar} onClose={() => setAjusteProd(null)} cargando={ajustar.isPending} />}
      {trasladoProd && <TrasladoStockModal producto={trasladoProd} sucursalId={sucursalId} onConfirmar={onTrasladar} onClose={() => setTrasladoProd(null)} cargando={trasladar.isPending} />}
    </div>
  )
}
