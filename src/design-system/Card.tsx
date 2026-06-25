import type { HTMLAttributes } from 'react'
export function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg border border-hairline bg-surface p-5 shadow-card dark:border-white/10 dark:bg-surface-dark dark:shadow-none ${className}`}
      {...rest}
    />
  )
}
