import type { IconName } from '@/design-system'

export interface NavItem { label: string; to: string; icon: IconName }
export interface NavSection { title: string | null; items: NavItem[] }
export const navSections: NavSection[] = [
  { title: null, items: [{ label: 'Dashboard', to: '/dashboard', icon: 'dashboard' }] },
  { title: 'Facturación', items: [
    { label: 'Emitir DTE', to: '/facturacion/emitir', icon: 'factura' },
    { label: 'Historial', to: '/facturacion/historial', icon: 'historial' },
  ] },
  { title: 'Compras', items: [
    { label: 'Compras externas', to: '/compras', icon: 'compras' },
    { label: 'Proveedores', to: '/proveedores', icon: 'proveedores' },
    { label: 'DTEs recibidos', to: '/dtes-recibidos', icon: 'recibidos' },
  ] },
  { title: 'Cuentas por cobrar', items: [
    { label: 'Planes', to: '/cuentas-por-cobrar', icon: 'cobros' },
    { label: 'Nueva venta a crédito', to: '/cuentas-por-cobrar/nueva', icon: 'factura' },
    { label: 'Configuración de mora', to: '/cuentas-por-cobrar/configuracion-mora', icon: 'historial' },
  ] },
  { title: 'Inventario', items: [
    { label: 'Productos', to: '/inventario/productos', icon: 'productos' },
    { label: 'Stock', to: '/inventario/stock', icon: 'stock' },
  ] },
  { title: 'Configuración', items: [{ label: 'Usuarios', to: '/config/usuarios', icon: 'usuarios' }] },
]
