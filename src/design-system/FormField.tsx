import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'

interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: ReactNode
}

// Atributos ARIA que inyectamos al control hijo para que un lector de pantalla,
// al enfocar el input, anuncie el error/hint y su estado inválido.
type ControlAriaProps = { 'aria-invalid'?: boolean; 'aria-describedby'?: string }

export function FormField({ label, htmlFor, error, hint, children }: FormFieldProps) {
  const errorId = `${htmlFor}-error`
  const hintId = `${htmlFor}-hint`
  const describedBy = error ? errorId : hint ? hintId : undefined

  // Clonamos el control para asociarle el mensaje sin exigir que cada formulario
  // repita estos atributos a mano. Si children no es un elemento válido, se deja tal cual.
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<ControlAriaProps>, {
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
      })
    : children

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink/80 dark:text-white/70">
        {label}
      </label>
      {control}
      {hint && !error && <p id={hintId} className="text-xs text-slate">{hint}</p>}
      {error && <p id={errorId} role="alert" className="text-xs font-medium text-rojo">{error}</p>}
    </div>
  )
}
