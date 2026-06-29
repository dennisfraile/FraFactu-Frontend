import { Button } from '@/design-system'
import type { CuotaDto } from '../types'

const fmt = (n: number) => `$${n.toFixed(2)}`

export function PlanCuotasTable({ cuotas, onPagar }: { cuotas: CuotaDto[]; onPagar: (numero: number) => void }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs uppercase tracking-wide text-slate/70">
          <th className="py-2">#</th>
          <th>Fecha pactada</th>
          <th className="text-right">Monto</th>
          <th>Estado</th>
          <th className="text-right">Mora</th>
          <th>Código gen.</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {cuotas.map((c) => (
          <tr key={c.numero} className="border-t border-hairline">
            <td className="py-2">{c.numero}</td>
            <td>{c.fechaPactada?.slice(0, 10)}</td>
            <td className="cifra text-right">{fmt(c.monto)}</td>
            <td>{c.estado}</td>
            <td className="cifra text-right">{c.interesMora > 0 ? fmt(c.interesMora) : '—'}</td>
            <td className="font-mono text-xs">{c.codigoGeneracion ?? '—'}</td>
            <td className="text-right">
              {c.estado !== 'Pagada' && (
                <Button variant="ghost" onClick={() => onPagar(c.numero)}>Pagar</Button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
