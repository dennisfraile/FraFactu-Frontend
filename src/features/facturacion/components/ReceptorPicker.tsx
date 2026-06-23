import { useCallback } from 'react'
import { AsyncSearchSelect } from './AsyncSearchSelect'
import { receptoresApi } from '../catalogos-api'
import type { ReceptorListItem } from '../types'

export function ReceptorPicker({ onSelect }: { onSelect: (r: ReceptorListItem) => void }) {
  const buscar = useCallback((term: string) => receptoresApi.search(term), [])

  return (
    <AsyncSearchSelect<ReceptorListItem>
      onSearch={buscar}
      getLabel={(r) => `${r.nombreRazonSocial}${r.numeroDocumento ? ` (${r.numeroDocumento})` : ''}`}
      onSelect={onSelect}
      placeholder="Buscar receptor por nombre o documento"
    />
  )
}
