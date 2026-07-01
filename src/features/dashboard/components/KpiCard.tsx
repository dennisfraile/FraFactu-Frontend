import { Card } from '@/design-system'

interface Props { label: string; valor: string; delta?: number }

export function KpiCard({ label, valor, delta }: Props) {
  const positivo = (delta ?? 0) >= 0
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-slate">{label}</p>
      <p className="cifra mt-1 text-2xl font-semibold text-ink">{valor}</p>
      {delta != null && (
        <p className={`mt-1 text-xs ${positivo ? 'text-sello' : 'text-rojo'}`}>
          {positivo ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
        </p>
      )}
    </Card>
  )
}
