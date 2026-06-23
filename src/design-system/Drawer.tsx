import { useEffect, type ReactNode } from 'react'
interface DrawerProps {
  open: boolean
  onClose: () => void
  side?: 'left' | 'right'
  children: ReactNode
}
export function Drawer({ open, onClose, side = 'left', children }: DrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-ink/40" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        className={`absolute top-0 h-full w-72 max-w-[80%] bg-surface p-4 shadow-xl dark:bg-[#16241f] ${side === 'left' ? 'left-0' : 'right-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </aside>
    </div>
  )
}
