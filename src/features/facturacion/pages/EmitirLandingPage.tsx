import { useNavigate } from 'react-router-dom'
import { Card } from '@/design-system'
import { getStrategy, TIPOS_EMISIBLES } from '../dte/registry'

export function EmitirLandingPage() {
  const navigate = useNavigate()
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-1 text-xl font-semibold text-ink dark:text-white">Emitir DTE</h1>
      <p className="mb-6 text-sm text-slate">Seleccione el tipo de documento tributario electrónico.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TIPOS_EMISIBLES.map((tipo) => {
          const s = getStrategy(tipo)
          return (
            <Card key={tipo} className="cursor-pointer transition hover:ring-1 hover:ring-sello" onClick={() => navigate(`/facturacion/emitir/${tipo}`)}>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-sello px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white ring-1 ring-oro/40">{s.etiquetaCorta}</span>
                <span className="font-display text-base font-semibold text-ink dark:text-white">{s.etiqueta}</span>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
