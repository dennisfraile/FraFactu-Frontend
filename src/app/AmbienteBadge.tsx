import { Badge } from '@/design-system'
export function AmbienteBadge({ ambiente = 'Pruebas' }: { ambiente?: 'Pruebas' | 'Producción' }) {
  return <Badge estado={ambiente === 'Producción' ? 'recibido' : 'pendiente'}>{ambiente}</Badge>
}
