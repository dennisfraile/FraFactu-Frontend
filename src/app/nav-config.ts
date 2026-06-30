// src/app/nav-config.ts
import type { IconName } from '@/design-system'
import type { RolNombre } from '@/lib/authz/roles'

export interface NavItem { label: string; to: string; icon: IconName; roles?: RolNombre[] }
export interface NavSection { title: string | null; items: NavItem[] }

export const navSections: NavSection[] = [
  { title: null, items: [{ label: 'Dashboard', to: '/dashboard', icon: 'dashboard' }] },
  { title: 'Facturación', items: [
    { label: 'Emitir DTE', to: '/facturacion/emitir', icon: 'factura', roles: ['EmisorAdmin', 'GerenteSucursal', 'Cajero'] },
    { label: 'Historial', to: '/facturacion/historial', icon: 'historial', roles: ['EmisorAdmin', 'GerenteSucursal', 'Cajero', 'Contador', 'Auditor'] },
  ] },
  { title: 'Compras', items: [
    { label: 'Compras externas', to: '/compras', icon: 'compras', roles: ['EmisorAdmin', 'GerenteSucursal', 'Contador'] },
    { label: 'Proveedores', to: '/proveedores', icon: 'proveedores', roles: ['EmisorAdmin', 'GerenteSucursal', 'Contador', 'Auditor'] },
    { label: 'DTEs recibidos', to: '/dtes-recibidos', icon: 'recibidos', roles: ['EmisorAdmin', 'GerenteSucursal', 'Contador', 'Auditor'] },
  ] },
  { title: 'Cuentas por cobrar', items: [
    { label: 'Planes', to: '/cuentas-por-cobrar', icon: 'cobros', roles: ['EmisorAdmin', 'GerenteSucursal', 'Cajero'] },
    { label: 'Nueva venta a crédito', to: '/cuentas-por-cobrar/nueva', icon: 'factura', roles: ['EmisorAdmin', 'GerenteSucursal', 'Cajero'] },
    { label: 'Configuración de mora', to: '/cuentas-por-cobrar/configuracion-mora', icon: 'historial', roles: ['EmisorAdmin', 'GerenteSucursal'] },
  ] },
  { title: 'Inventario', items: [
    { label: 'Productos', to: '/inventario/productos', icon: 'productos', roles: ['EmisorAdmin', 'GerenteSucursal', 'Cajero', 'Contador', 'Auditor'] },
    { label: 'Stock', to: '/inventario/stock', icon: 'stock', roles: ['EmisorAdmin', 'GerenteSucursal', 'Cajero', 'Contador', 'Auditor'] },
    { label: 'Reportes', to: '/inventario/reportes', icon: 'historial', roles: ['EmisorAdmin', 'GerenteSucursal', 'Contador', 'Auditor'] },
  ] },
  { title: 'Configuración', items: [
    { label: 'Usuarios', to: '/config/usuarios', icon: 'usuarios', roles: ['SuperAdmin', 'EmisorAdmin', 'GerenteSucursal', 'Auditor'] },
  ] },
]
