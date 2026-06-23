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
      className={`w-full rounded-md border bg-surface px-3 py-2 text-sm text-ink outline-none dark:bg-[#16241f] dark:text-[#fafaf8] ${invalid ? 'border-rojo' : 'border-hairline'} focus-visible:ring-2 focus-visible:ring-sello ${className}`}
      {...rest}
    />
  )
})
