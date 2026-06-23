import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

type Tone = 'sello' | 'rojo' | 'ambar'
interface ToastItem { id: number; msg: string; tone: Tone }
interface ToastCtx { show: (msg: string, opts?: { tone?: Tone }) => void }

const Ctx = createContext<ToastCtx | null>(null)
const toneCls: Record<Tone, string> = {
  sello: 'border-sello text-sello',
  rojo: 'border-rojo text-rojo',
  ambar: 'border-ambar text-ambar-ink',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)
  const show = useCallback((msg: string, opts?: { tone?: Tone }) => {
    const id = nextId.current++
    setItems((prev) => [...prev, { id, msg, tone: opts?.tone ?? 'sello' }])
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])
  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`rounded-md border bg-surface px-4 py-2 text-sm shadow-md dark:bg-[#16241f] ${toneCls[t.tone]}`}>
            {t.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return ctx
}
