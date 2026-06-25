import { useState, type ReactNode } from 'react'
import { AsyncSearchSelect } from './AsyncSearchSelect'

interface Props<T> {
  onSearch: (term: string) => Promise<T[]>
  getLabel: (item: T) => string
  onSelect: (item: T) => void
  placeholder?: string
  crearLabel: string
  renderCreateModal: (args: { onCreated: (item: T) => void; onClose: () => void }) => ReactNode
}

// Selector con búsqueda async + acción "+ crear" que abre un modal de alta.
// Al crear, selecciona automáticamente la entidad creada (sin abandonar el formulario).
export function QuickCreateSelect<T>({ onSearch, getLabel, onSelect, placeholder, crearLabel, renderCreateModal }: Props<T>) {
  const [abierto, setAbierto] = useState(false)
  return (
    <div className="space-y-2">
      <AsyncSearchSelect<T> onSearch={onSearch} getLabel={getLabel} onSelect={onSelect} placeholder={placeholder} />
      <button type="button" className="text-xs font-medium text-sello hover:underline" onClick={() => setAbierto(true)}>
        + {crearLabel}
      </button>
      {abierto && renderCreateModal({
        onCreated: (item) => { onSelect(item); setAbierto(false) },
        onClose: () => setAbierto(false),
      })}
    </div>
  )
}
