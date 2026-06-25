import { useMemo, useState } from 'react'

interface ComboboxProps<T> {
  items: T[]
  value: T | null
  onChange: (v: T) => void
  getLabel: (v: T) => string
  placeholder?: string
  id?: string
}
export function Combobox<T>({ items, value, onChange, getLabel, placeholder, id }: ComboboxProps<T>) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const filtered = useMemo(
    () => items.filter((i) => getLabel(i).toLowerCase().includes(query.toLowerCase())),
    [items, query, getLabel],
  )
  return (
    <div className="relative">
      <input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark"
        placeholder={placeholder}
        value={open ? query : value ? getLabel(value) : ''}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
      />
      {open && (
        <ul id={`${id}-list`} role="listbox" className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-hairline bg-surface shadow-lg dark:bg-surface-dark">
          {filtered.map((i, idx) => (
            <li
              key={idx}
              role="option"
              aria-selected={value === i}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-sello/10"
              onMouseDown={() => { onChange(i); setQuery(''); setOpen(false) }}
            >
              {getLabel(i)}
            </li>
          ))}
          {filtered.length === 0 && <li className="px-3 py-2 text-sm text-slate">Sin resultados</li>}
        </ul>
      )}
    </div>
  )
}
