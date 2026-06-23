import type { HTMLAttributes } from 'react'
export function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg border border-hairline bg-surface p-5 shadow-[0_4px_14px_rgba(22,36,31,0.06)] dark:bg-[#16241f] dark:shadow-none ${className}`}
      {...rest}
    />
  )
}
