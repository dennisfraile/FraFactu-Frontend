import { useSucursales } from '@/features/facturacion/hooks'

interface Props { value: number | undefined; onChange: (id: number | undefined) => void }

export function SucursalSelector({ value, onChange }: Props) {
  const { data } = useSucursales()
  return (
    <select
      aria-label="Sucursal"
      className="rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
    >
      <option value="">Todas las sucursales</option>
      {(data ?? []).map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
    </select>
  )
}
