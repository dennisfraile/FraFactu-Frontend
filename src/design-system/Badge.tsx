import type { HTMLAttributes } from 'react'
type Estado = 'recibido' | 'pendiente' | 'rechazado' | 'borrador'
const tones: Record<Estado, string> = {
  recibido: 'bg-sello-tint text-sello-ink ring-sello/20 dark:bg-sello/15 dark:text-sello-bright',
  pendiente: 'bg-oro-tint text-oro-ink ring-oro/25 dark:bg-oro/15 dark:text-oro-bright',
  rechazado: 'bg-rojo/12 text-rojo ring-rojo/20',
  borrador: 'bg-slate/12 text-slate ring-slate/20',
}
interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  estado?: Estado
}
export function Badge({ estado = 'borrador', className = '', ...rest }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${tones[estado]} ${className}`}
      {...rest}
    />
  )
}
