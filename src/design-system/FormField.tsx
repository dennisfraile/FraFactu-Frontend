import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: ReactNode
}

export function FormField({ label, htmlFor, error, hint, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink/80 dark:text-white/70">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate">{hint}</p>}
      {error && <p role="alert" className="text-xs font-medium text-rojo">{error}</p>}
    </div>
  )
}
