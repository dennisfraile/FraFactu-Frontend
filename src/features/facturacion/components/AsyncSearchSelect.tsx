import { useEffect, useRef, useState } from 'react'

interface Props<T> {
  onSearch: (term: string) => Promise<T[]>
  getLabel: (item: T) => string
  onSelect: (item: T) => void
  placeholder?: string
  minChars?: number
}

export function AsyncSearchSelect<T>({ onSearch, getLabel, onSelect, placeholder, minChars = 2 }: Props<T>) {
  const [term, setTerm] = useState('')
  const [items, setItems] = useState<T[]>([])
  const [open, setOpen] = useState(false)
  const [cargando, setCargando] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (term.trim().length < minChars) return
    timer.current = setTimeout(async () => {
      setCargando(true)
      try {
        setItems(await onSearch(term.trim()))
        setOpen(true)
      } finally {
        setCargando(false)
      }
    }, 300)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [term, minChars, onSearch])

  // No mostramos resultados obsoletos mientras el término sea más corto que el mínimo.
  const visibles = term.trim().length >= minChars ? items : []

  return (
    <div className="relative">
      <input
        role="combobox"
        aria-expanded={open}
        className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-[#16241f]"
        placeholder={placeholder}
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onFocus={() => visibles.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && (
        <ul role="listbox" className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-hairline bg-surface shadow-lg dark:bg-[#16241f]">
          {cargando && <li className="px-3 py-2 text-sm text-slate">Buscando…</li>}
          {!cargando && visibles.map((item, idx) => (
            <li
              key={idx}
              role="option"
              className="cursor-pointer px-3 py-2 text-sm hover:bg-sello/10"
              onMouseDown={() => { onSelect(item); setTerm(''); setItems([]); setOpen(false) }}
            >
              {getLabel(item)}
            </li>
          ))}
          {!cargando && visibles.length === 0 && term.trim().length >= minChars && (
            <li className="px-3 py-2 text-sm text-slate">Sin resultados</li>
          )}
        </ul>
      )}
    </div>
  )
}
