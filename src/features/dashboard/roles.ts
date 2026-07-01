// Curación de UX del dashboard (NO seguridad: el backend autoriza los 6 roles).
// Decide qué secciones ve cada rol. El selector de sucursal y el comparativo
// se condicionan aparte por user.accesoTodasSucursales.
import type { RolNombre } from '@/lib/authz/roles'

export const DASHBOARD_GERENCIAL: RolNombre[] = ['SuperAdmin', 'EmisorAdmin', 'GerenteSucursal', 'Contador', 'Auditor']
export const DASHBOARD_CAJERO: RolNombre[] = ['Cajero']
