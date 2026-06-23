export interface NavItem { label: string; to: string }
export interface NavSection { title: string | null; items: NavItem[] }
export const navSections: NavSection[] = [
  { title: null, items: [{ label: 'Dashboard', to: '/dashboard' }] },
  { title: 'Facturación', items: [
    { label: 'Emitir DTE', to: '/facturacion/emitir' },
    { label: 'Historial', to: '/facturacion/historial' },
    { label: 'Recibidos', to: '/facturacion/recibidos' },
  ] },
  { title: 'Inventario', items: [
    { label: 'Productos', to: '/inventario/productos' },
    { label: 'Stock', to: '/inventario/stock' },
  ] },
  { title: 'Configuración', items: [{ label: 'Usuarios', to: '/config/usuarios' }] },
]
