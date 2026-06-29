// src/features/inventario/components/MovimientosTab.tsx
import { useState } from 'react'
import { Input, FormField, Spinner, EmptyState, Button } from '@/design-system'
import { useMovimientos, useKardex } from '../hooks'

function hace(dias: number) {
  const d = new Date(); d.setDate(d.getDate() - dias)
  return d.toISOString().slice(0, 10)
}
function hoy() { return new Date().toISOString().slice(0, 10) }

const toUtcStart = (d: string) => d ? `${d}T00:00:00Z` : d
const toUtcEnd = (d: string) => d ? `${d}T23:59:59Z` : d

export function MovimientosTab() {
  const [desde, setDesde] = useState(hace(30))
  const [hasta, setHasta] = useState(hoy())
  const [kardexProd, setKardexProd] = useState<number | null>(null)
  const movs = useMovimientos({ desde: toUtcStart(desde), hasta: toUtcEnd(hasta), page: 1, pageSize: 50 })
  const kardex = useKardex(kardexProd ?? 0, { desde: toUtcStart(desde), hasta: toUtcEnd(hasta), page: 1, pageSize: 50 })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <FormField label="Desde" htmlFor="mv-desde"><Input id="mv-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></FormField>
        <FormField label="Hasta" htmlFor="mv-hasta"><Input id="mv-hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></FormField>
      </div>

      {movs.isLoading ? <Spinner /> : !movs.data?.items.length ? <EmptyState title="Sin movimientos" hint="No hay movimientos en el rango." /> : (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-wide text-slate/70"><th className="py-2">Fecha</th><th>Tipo</th><th>Documento</th><th>Producto</th><th>Bodega</th><th className="text-right">Cantidad</th><th className="text-right">Saldo</th><th /></tr></thead>
          <tbody>
            {movs.data.items.map((m) => (
              <tr key={m.id} className="border-t border-hairline">
                <td className="py-2">{m.fechaMovimiento?.slice(0, 10)}</td>
                <td>{m.tipoMovimiento}</td>
                <td><span>{m.tipoDocumento}</span>{m.numeroDocumento ? <span className="text-slate"> {m.numeroDocumento}</span> : null}</td>
                <td>{m.productoNombre}</td>
                <td>{m.bodegaNombre}</td>
                <td className="cifra text-right">{m.cantidad}</td>
                <td className="cifra text-right">{m.nuevoSaldo}</td>
                <td className="text-right"><Button variant="ghost" onClick={() => setKardexProd(m.productoId)}>Kardex</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {kardexProd != null && (
        <div className="rounded-xl border border-hairline p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold text-ink">Kardex {kardex.data ? `— ${kardex.data.productoNombre}` : ''}</h3>
            <button type="button" className="text-xs text-slate" onClick={() => setKardexProd(null)}>Cerrar</button>
          </div>
          {kardex.isLoading || !kardex.data ? <Spinner /> : (
            <>
              <div className="grid grid-cols-4 gap-2 text-sm">
                <div>Saldo inicial<br /><span className="cifra">{kardex.data.saldoInicial}</span></div>
                <div>Entradas<br /><span className="cifra">{kardex.data.totalEntradas}</span></div>
                <div>Salidas<br /><span className="cifra">{kardex.data.totalSalidas}</span></div>
                <div>Saldo final<br /><span className="cifra">{kardex.data.saldoFinal}</span></div>
              </div>
              <table className="mt-3 w-full text-sm">
                <thead><tr className="text-left text-xs uppercase tracking-wide text-slate/70"><th className="py-1">Fecha</th><th>Tipo</th><th className="text-right">Cantidad</th><th className="text-right">Saldo</th></tr></thead>
                <tbody>{kardex.data.movimientos.items.map((m) => <tr key={m.id} className="border-t border-hairline"><td className="py-1">{m.fechaMovimiento?.slice(0, 10)}</td><td>{m.tipoMovimiento}</td><td className="cifra text-right">{m.cantidad}</td><td className="cifra text-right">{m.nuevoSaldo}</td></tr>)}</tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  )
}
