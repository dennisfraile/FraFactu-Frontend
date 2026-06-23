import type { HTMLAttributes } from 'react'
type Estado = 'recibido' | 'pendiente' | 'rechazado' | 'borrador'
const tones: Record<Estado, string> = {
  recibido: 'bg-sello/12 text-sello',
  pendiente: 'bg-ambar/15 text-ambar-ink',
  rechazado: 'bg-rojo/12 text-rojo',
  borrador: 'bg-slate/14 text-slate',
}
interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  estado?: Estado
}
export function Badge({ estado = 'borrador', className = '', ...rest }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tones[estado]} ${className}`}
      {...rest}
    />
  )
}
