import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, className = '', ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`w-full rounded-md border bg-surface px-3 py-2 text-sm text-ink transition-colors outline-none placeholder:text-slate/60 dark:bg-surface-dark dark:text-[#f3f1ea] ${invalid ? 'border-rojo focus:border-rojo focus-visible:ring-2 focus-visible:ring-rojo/30' : 'border-hairline focus:border-sello focus-visible:ring-2 focus-visible:ring-sello/25'} ${className}`}
      {...rest}
    />
  )
})
