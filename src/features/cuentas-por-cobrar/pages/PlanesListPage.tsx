// src/features/cuentas-por-cobrar/pages/PlanesListPage.tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Spinner, EmptyState } from '@/design-system'
import { usePlanes } from '../hooks'
import { cuentasPorCobrarApi, type FormatoReporte } from '../api'
import { EstadoCobroBadge } from '../components/EstadoCobroBadge'
import { ReporteDescargaButtons } from '../components/ReporteDescargaButtons'

const fmt = (n: number) => `$${n.toFixed(2)}`

export function PlanesListPage() {
  const [soloConSaldo, setSoloConSaldo] = useState(true)
  const planes = usePlanes(soloConSaldo)

  const descargar = async (formato: FormatoReporte) => {
    try {
      await cuentasPorCobrarApi.descargarAntiguedad(formato)
    } catch (err) {
      console.error('No se pudo descargar el reporte', err)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Cuentas por cobrar</h1>
        <Link
          to="/cuentas-por-cobrar/nueva"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-sello px-4 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-sello-bright"
        >
          Nueva venta a crédito
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={soloConSaldo}
            onChange={(e) => setSoloConSaldo(e.target.checked)}
          />
          Solo planes con saldo
        </label>
        <ReporteDescargaButtons label="Antigüedad de saldos" onDescargar={descargar} />
      </div>

      {planes.isLoading ? (
        <Spinner />
      ) : !planes.data?.length ? (
        <EmptyState title="Sin planes" hint="No hay planes de cuotas para mostrar." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate/70">
              <th className="py-2">Cliente</th>
              <th className="text-right">Total</th>
              <th className="text-right">Pagado</th>
              <th className="text-right">Saldo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {planes.data.map((p) => (
              <tr key={p.id} className="border-t border-hairline hover:bg-oro-tint/30">
                <td className="py-2">
                  <Link
                    className="text-sello underline-offset-2 hover:underline"
                    to={`/cuentas-por-cobrar/${p.id}`}
                  >
                    {p.receptorNombre ?? 'Consumidor Final'}
                  </Link>
                </td>
                <td className="cifra text-right">{fmt(p.montoTotal)}</td>
                <td className="cifra text-right">{fmt(p.montoPagado)}</td>
                <td className="cifra text-right">{fmt(p.saldoAdeudado)}</td>
                <td><EstadoCobroBadge estado={p.estadoCobro} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
