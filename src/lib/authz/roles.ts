export type RolNombre =
  | 'SuperAdmin'
  | 'EmisorAdmin'
  | 'GerenteSucursal'
  | 'Cajero'
  | 'Auditor'
  | 'Contador'
  | 'EncargadoInventario'

export const ROLES: RolNombre[] = [
  'SuperAdmin', 'EmisorAdmin', 'GerenteSucursal', 'Cajero', 'Auditor', 'Contador', 'EncargadoInventario',
]

/** True si `rol` está dentro de `allow`. Gating por nombre de rol (espeja [Authorize(Roles=...)] del backend). */
export function puede(rol: string | undefined | null, allow: RolNombre[]): boolean {
  if (!rol) return false
  return (allow as string[]).includes(rol)
}
