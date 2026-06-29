// src/features/inventario/pages/ReportesInventarioPage.tsx
import { useState } from 'react'
import { Tabs, Spinner, EmptyState } from '@/design-system'
import { useKpis, useValoracion, useRotacion, useRotacionAbc } from '../hooks'

const TABS = [{ id: 'kpis', label: 'KPIs' }, { id: 'valorizado', label: 'Valorizado' }, { id: 'rotacion', label: 'Rotación' }, { id: 'abc', label: 'ABC' }]
const fmt = (n: number) => `$${n.toFixed(2)}`

function Card({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-hairline px-3 py-2 text-sm"><div className="text-slate">{label}</div><div className="cifra text-lg text-ink">{value}</div></div>
}

export function ReportesInventarioPage() {
  const [tab, setTab] = useState('kpis')
  const kpis = useKpis()
  const valoracion = useValoracion()
  const rotacion = useRotacion()
  const abc = useRotacionAbc()

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold text-ink">Reportes de inventario</h1>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'kpis' && (kpis.isLoading || !kpis.data ? <Spinner /> : (
        <div className="grid gap-3 md:grid-cols-4">
          <Card label="Total productos" value={String(kpis.data.totalProductos)} />
          <Card label="Valor total del inventario" value={fmt(kpis.data.valorTotalInventario)} />
          <Card label="Bajo mínimo" value={String(kpis.data.productosBajoMinimo)} />
          <Card label="Sin stock" value={String(kpis.data.productosSinStock)} />
          <Card label="Movimientos (mes)" value={String(kpis.data.totalMovimientosUltimoMes)} />
          <Card label="CMV (mes)" value={fmt(kpis.data.costoMercanciaVendidaMesActual)} />
          <Card label="Compras (mes)" value={fmt(kpis.data.valorComprasMesActual)} />
          <Card label="Días promedio inv." value={String(kpis.data.diasPromedioInventario)} />
        </div>
      ))}

      {tab === 'valorizado' && (valoracion.isLoading || !valoracion.data ? <Spinner /> : !valoracion.data.detalleProductos.length ? <EmptyState title="Sin datos" hint="No hay valorización para mostrar." /> : (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-wide text-slate/70"><th className="py-2">Producto</th><th className="text-right">Cantidad</th><th className="text-right">Costo prom.</th><th className="text-right">Valor</th><th className="text-right">% del total</th></tr></thead>
          <tbody>{valoracion.data.detalleProductos.map((p) => <tr key={p.productoId} className="border-t border-hairline"><td className="py-2">{p.productoNombre}</td><td className="cifra text-right">{p.cantidad}</td><td className="cifra text-right">{fmt(p.costoPromedio)}</td><td className="cifra text-right">{fmt(p.valorTotal)}</td><td className="text-right">{p.porcentajeDelTotal.toFixed(1)}%</td></tr>)}</tbody>
        </table>
      ))}

      {tab === 'rotacion' && (rotacion.isLoading ? <Spinner /> : !rotacion.data?.length ? <EmptyState title="Sin datos" hint="No hay rotación para mostrar." /> : (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-wide text-slate/70"><th className="py-2">Producto</th><th className="text-right">Vendido</th><th className="text-right">Índice</th><th className="text-right">Días inv.</th><th>Clase</th></tr></thead>
          <tbody>{rotacion.data.map((r) => <tr key={r.productoId} className="border-t border-hairline"><td className="py-2">{r.productoNombre}</td><td className="cifra text-right">{r.cantidadVendida}</td><td className="cifra text-right">{r.indiceRotacion.toFixed(2)}</td><td className="text-right">{r.diasPromediInventario}</td><td>{r.clasificacion}</td></tr>)}</tbody>
        </table>
      ))}

      {tab === 'abc' && (abc.isLoading ? <Spinner /> : !abc.data?.length ? <EmptyState title="Sin datos" hint="No hay clasificación ABC para mostrar." /> : (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-wide text-slate/70"><th className="py-2">Producto</th><th className="text-right">Unidades</th><th className="text-right">Valor vendido</th><th className="text-right">% acum.</th><th>Clase</th></tr></thead>
          <tbody>{abc.data.map((a) => <tr key={a.productoId} className="border-t border-hairline"><td className="py-2">{a.productoNombre}</td><td className="cifra text-right">{a.unidadesVendidas}</td><td className="cifra text-right">{fmt(a.valorVendido)}</td><td className="text-right">{a.porcentajeAcumulado.toFixed(1)}%</td><td>{a.clasificacion}</td></tr>)}</tbody>
        </table>
      ))}
    </div>
  )
}
