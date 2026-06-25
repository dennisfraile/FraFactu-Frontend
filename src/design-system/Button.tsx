import type { ButtonHTMLAttributes } from 'react'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'ghost' | 'danger' | 'subtle' | 'accent'
type Size = 'sm' | 'md'

const base =
  'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-all duration-150 ' +
  'active:translate-y-px disabled:opacity-55 disabled:cursor-not-allowed disabled:active:translate-y-0'

const variants: Record<Variant, string> = {
  primary: 'bg-sello text-white shadow-soft hover:bg-sello-bright hover:shadow-card',
  accent: 'bg-oro text-white shadow-soft hover:bg-oro-bright hover:shadow-[var(--shadow-oro)]',
  ghost: 'border border-hairline bg-surface text-sello hover:border-sello/30 hover:bg-sello-tint dark:bg-surface-dark dark:border-white/10 dark:hover:bg-white/5',
  danger: 'bg-rojo text-white shadow-soft hover:opacity-90',
  subtle: 'text-slate hover:bg-slate/10',
}
const sizes: Record<Size, string> = { sm: 'text-sm px-3 py-1.5', md: 'text-sm px-4 py-2.5' }

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export function Button({ variant = 'primary', size = 'md', loading = false, disabled, children, className = '', ...rest }: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner size={14} />}
      {children}
    </button>
  )
}
