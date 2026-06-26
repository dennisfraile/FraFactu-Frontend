import { QuickCreateSelect } from '@/features/facturacion/components/QuickCreateSelect'
import { proveedoresApi } from '../proveedores-api'
import { ProveedorFormModal } from './ProveedorFormModal'
import type { ProveedorDto } from '../types'

interface Props {
  onSelect: (p: ProveedorDto) => void
}

export function ProveedorPicker({ onSelect }: Props) {
  return (
    <QuickCreateSelect<ProveedorDto>
      onSearch={(term) => proveedoresApi.search(term)}
      getLabel={(p) => `${p.nombre} — ${p.nit}`}
      onSelect={onSelect}
      placeholder="Buscar proveedor por nombre o NIT"
      crearLabel="Crear proveedor"
      renderCreateModal={({ onCreated, onClose }) => (
        <ProveedorFormModal onSaved={onCreated} onClose={onClose} />
      )}
    />
  )
}
