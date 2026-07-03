import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

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
  const [activeIndex, setActiveIndex] = useState(-1)
  const listId = useId()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Timer aparte del de debounce: difiere el cierre en onBlur. Debe limpiarse al
  // desmontar para no disparar setOpen sobre un componente muerto (contamina el
  // jsdom de otros tests en la suite completa).
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (blurTimer.current) clearTimeout(blurTimer.current) }, [])

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (term.trim().length < minChars) return
    timer.current = setTimeout(async () => {
      setCargando(true)
      try {
        setItems(await onSearch(term.trim()))
        setActiveIndex(-1) // resultados nuevos: sin resaltado hasta que el usuario navegue
        setOpen(true)
      } finally {
        setCargando(false)
      }
    }, 300)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [term, minChars, onSearch])

  // No mostramos resultados obsoletos mientras el término sea más corto que el mínimo.
  const visibles = term.trim().length >= minChars ? items : []

  function seleccionar(item: T) {
    onSelect(item)
    setTerm('')
    setItems([])
    setOpen(false)
    setActiveIndex(-1)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'ArrowDown':
        if (visibles.length === 0) return
        e.preventDefault()
        setOpen(true)
        setActiveIndex((i) => Math.min(i + 1, visibles.length - 1))
        break
      case 'ArrowUp':
        if (visibles.length === 0) return
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
        break
      case 'Enter':
        // Sólo interceptamos Enter si hay una opción resaltada; así no bloqueamos
        // el envío del formulario cuando el dropdown está cerrado o sin selección.
        if (open && activeIndex >= 0 && activeIndex < visibles.length) {
          e.preventDefault()
          seleccionar(visibles[activeIndex])
        }
        break
      case 'Escape':
        if (open) {
          e.preventDefault()
          setOpen(false)
          setActiveIndex(-1)
        }
        break
    }
  }

  return (
    <div className="relative">
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined}
        className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark"
        placeholder={placeholder}
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onFocus={() => visibles.length > 0 && setOpen(true)}
        onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 150) }}
        onKeyDown={onKeyDown}
      />
      {open && (
        <ul id={listId} role="listbox" className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-hairline bg-surface shadow-lg dark:bg-surface-dark">
          {cargando && <li className="px-3 py-2 text-sm text-slate">Buscando…</li>}
          {!cargando && visibles.map((item, idx) => (
            <li
              key={idx}
              id={`${listId}-opt-${idx}`}
              role="option"
              aria-selected={idx === activeIndex}
              ref={idx === activeIndex ? (el) => el?.scrollIntoView?.({ block: 'nearest' }) : undefined}
              className={`cursor-pointer px-3 py-2 text-sm ${idx === activeIndex ? 'bg-sello/10' : 'hover:bg-sello/10'}`}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseDown={() => seleccionar(item)}
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
