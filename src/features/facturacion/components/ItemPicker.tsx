import { useCallback } from 'react'
import { AsyncSearchSelect } from './AsyncSearchSelect'
import { productosApi } from '../catalogos-api'
import type { ProductoListItem } from '../types'

export function ItemPicker({ onSelect, sucursalId }: { onSelect: (p: ProductoListItem) => void; sucursalId?: number }) {
  const buscar = useCallback((term: string) => productosApi.search(term, sucursalId), [sucursalId])

  return (
    <AsyncSearchSelect<ProductoListItem>
      onSearch={buscar}
      getLabel={(p) => `${p.codigo} — ${p.nombre} ($${p.precioVenta.toFixed(2)})`}
      onSelect={onSelect}
      placeholder="Buscar producto por código o nombre"
    />
  )
}
