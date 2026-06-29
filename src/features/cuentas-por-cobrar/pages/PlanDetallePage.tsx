// src/features/cuentas-por-cobrar/pages/PlanDetallePage.tsx
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Spinner, EmptyState, useToast } from '@/design-system'
import { usePlan, usePagarCuota, useRefinanciar } from '../hooks'
import { cuentasPorCobrarApi, type FormatoReporte } from '../api'
import { PlanCuotasTable } from '../components/PlanCuotasTable'
import { PagarCuotaModal } from '../components/PagarCuotaModal'
import { RefinanciarModal } from '../components/RefinanciarModal'
import { EstadoCobroBadge } from '../components/EstadoCobroBadge'
import { ReporteDescargaButtons } from '../components/ReporteDescargaButtons'
import type { RegistrarPagoCuotaDto, RefinanciarPlanDto } from '../types'

const fmt = (n: number) => `$${n.toFixed(2)}`

export function PlanDetallePage() {
  const { planId } = useParams<{ planId: string }>()
  const id = Number(planId)
  const plan = usePlan(id)
  const pagar = usePagarCuota()
  const refinanciar = useRefinanciar()
  const toast = useToast()
  const [cuotaAPagar, setCuotaAPagar] = useState<number | null>(null)
  const [refinanciando, setRefinanciando] = useState(false)

  const descargar = async (formato: FormatoReporte) => {
    try { await cuentasPorCobrarApi.descargarEstadoCuentaPlan(id, formato) }
    catch { toast.show('No se pudo descargar el estado de cuenta', { tone: 'rojo' }) }
  }

  const onPagar = async (dto: RegistrarPagoCuotaDto) => {
    if (cuotaAPagar == null) return
    try {
      await pagar.mutateAsync({ planId: id, numero: cuotaAPagar, dto })
      toast.show('Cuota pagada')
      setCuotaAPagar(null)
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'No se pudo pagar la cuota'
      toast.show(msg, { tone: 'rojo' })
    }
  }

  const onRefinanciar = async (dto: RefinanciarPlanDto) => {
    try {
      await refinanciar.mutateAsync({ planId: id, dto })
      toast.show('Plan refinanciado')
      setRefinanciando(false)
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'No se pudo refinanciar'
      toast.show(msg, { tone: 'rojo' })
    }
  }

  if (plan.isLoading) return <div className="p-6"><Spinner /></div>
  if (plan.isError || !plan.data) return <div className="p-6"><EmptyState title="Plan no encontrado" hint="El plan no existe o no tienes acceso." /></div>

  const p = plan.data
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">{p.receptorNombre ?? 'Consumidor Final'}</h1>
          <p className="text-sm text-slate">Plan #{p.id} · Condición {p.condicionOperacion === 2 ? 'Crédito' : 'Mixto'}</p>
        </div>
        <EstadoCobroBadge estado={p.estadoCobro} />
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-lg border border-hairline px-3 py-2">Total<br /><span className="cifra text-lg">{fmt(p.montoTotal)}</span></div>
        <div className="rounded-lg border border-hairline px-3 py-2">Pagado<br /><span className="cifra text-lg">{fmt(p.montoPagado)}</span></div>
        <div className="rounded-lg border border-hairline px-3 py-2">Saldo<br /><span className="cifra text-lg">{fmt(p.saldoAdeudado)}</span></div>
      </div>

      <PlanCuotasTable cuotas={p.cuotas} onPagar={setCuotaAPagar} />

      <div className="flex items-center justify-between">
        <ReporteDescargaButtons label="Estado de cuenta" onDescargar={descargar} />
        {p.saldoAdeudado > 0 && <Button variant="ghost" onClick={() => setRefinanciando(true)}>Refinanciar</Button>}
      </div>

      {cuotaAPagar != null && (
        <PagarCuotaModal planId={id} numero={cuotaAPagar} onConfirmar={onPagar} onClose={() => setCuotaAPagar(null)} cargando={pagar.isPending} />
      )}
      {refinanciando && (
        <RefinanciarModal saldo={p.saldoAdeudado} onConfirmar={onRefinanciar} onClose={() => setRefinanciando(false)} cargando={refinanciar.isPending} />
      )}
    </div>
  )
}
