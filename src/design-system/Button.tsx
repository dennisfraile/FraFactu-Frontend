import type { ButtonHTMLAttributes } from 'react'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'ghost' | 'danger' | 'subtle'
type Size = 'sm' | 'md'

const base =
  'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sello ' +
  'disabled:opacity-60 disabled:cursor-not-allowed'

const variants: Record<Variant, string> = {
  primary: 'bg-sello text-white hover:bg-sello-bright',
  ghost: 'border border-hairline text-sello hover:bg-sello/10',
  danger: 'bg-rojo text-white hover:opacity-90',
  subtle: 'text-slate hover:bg-slate/10',
}
const sizes: Record<Size, string> = { sm: 'text-sm px-3 py-1.5', md: 'text-sm px-4 py-2' }

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
