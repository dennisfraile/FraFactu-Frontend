// src/lib/authz/acciones.ts
// Matriz rol -> acción. Espejo literal de los [Authorize(Roles=...)] del backend.
// Ver docs/superpowers/specs/2026-07-01-authz-entrega-b-gating-acciones-design.md
import type { RolNombre } from './roles'

// Facturación (FacturasController)
export const FACTURA_CREAR: RolNombre[] = ['EmisorAdmin', 'GerenteSucursal', 'Cajero']
export const FACTURA_ANULAR: RolNombre[] = ['EmisorAdmin', 'GerenteSucursal']

// Compras (ComprasExternasController / ProveedoresController)
export const COMPRA_ESCRIBIR: RolNombre[] = ['EmisorAdmin', 'GerenteSucursal', 'Contador']
export const PROVEEDOR_ESCRIBIR: RolNombre[] = ['EmisorAdmin', 'GerenteSucursal', 'Contador']

// Cuentas por cobrar (CuentasPorCobrarController)
export const CXC_PAGAR: RolNombre[] = ['EmisorAdmin', 'GerenteSucursal', 'Cajero']
export const CXC_REFINANCIAR: RolNombre[] = ['EmisorAdmin', 'GerenteSucursal']

// Inventario (ProductosServiciosController / CategoriasController / MarcasController / InventarioController)
export const PRODUCTO_ESCRIBIR: RolNombre[] = ['EmisorAdmin', 'GerenteSucursal']
export const CATALOGO_ESCRIBIR: RolNombre[] = ['EmisorAdmin', 'GerenteSucursal']
export const CATALOGO_ELIMINAR: RolNombre[] = ['EmisorAdmin']
export const INVENTARIO_AJUSTAR: RolNombre[] = ['EmisorAdmin', 'GerenteSucursal', 'EncargadoInventario']

// DTEs recibidos (DtesRecibidosController)
export const DTE_RECIBIDO_GESTIONAR: RolNombre[] = ['EmisorAdmin', 'GerenteSucursal']
export const DTE_RECIBIDO_CONFIG: RolNombre[] = ['EmisorAdmin']

// Usuarios (UsuariosController) — consolidado desde Entrega A
export const USUARIOS_ESCRIBIR: RolNombre[] = ['SuperAdmin', 'EmisorAdmin', 'GerenteSucursal']
