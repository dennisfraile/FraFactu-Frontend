import { Badge } from '@/design-system'

type BadgeEstado = 'recibido' | 'pendiente' | 'rechazado' | 'borrador'

const BADGE_ESTADO: Record<string, BadgeEstado> = {
  Pagado: 'recibido',
  Parcial: 'pendiente',
  Pendiente: 'pendiente',
  EnMora: 'rechazado',
  Refinanciado: 'pendiente',
}

export function EstadoCobroBadge({ estado }: { estado: string }) {
  return <Badge estado={BADGE_ESTADO[estado] ?? 'borrador'}>{estado}</Badge>
}
