# Entrega B — Gating de acciones por rol (frontend)

**Fecha:** 2026-07-01
**Estado:** Aprobado (brainstorming)
**Rama:** `feat/authz-entrega-b`
**Depende de:** Entrega A (módulo `src/lib/authz/`: `useAuthz`, `<Can>`, `RoleRoute`, `roles.ts`).

## Problema

Tras la Entrega A, el gating por rol cubre navegación, rutas por área y el feature `usuarios`.
El resto de features (facturación, compras, cuentas por cobrar, inventario, DTEs recibidos)
muestran **todos** sus botones de escritura a cualquier rol que pueda ver la página, y se
confía en el `403` del backend. Resultado: un `Auditor`/`Contador`/`Cajero` ve botones como
"Nueva compra", "Anular", "Refinanciar" o "Eliminar" que su rol no puede ejecutar.

Objetivo: ocultar cada **disparador de operación de escritura** a los roles que el backend no
autoriza, espejando fielmente los `[Authorize(Roles=...)]` de los controllers.

## Alcance

**Sí:** gatear los botones/enlaces que **inician** una operación de escritura
(Nueva/Editar/Anular/Confirmar/Pagar/Refinanciar/Ajustar/Trasladar/Eliminar/Descartar/etc.).

**No:** los botones internos de un formulario ya abierto (p.ej. agregar/quitar línea en
`CompraLineasTable`, `CuerpoDocumentoTable`). Quien abrió el form ya está autorizado; gatearlos
es ruido.

**No:** dashboard, cambios de backend, flujos bloqueados por credenciales MH de Pruebas
(su comportamiento no cambia).

## Arquitectura (2 capas)

### Capa 1 — Ruta (endurecer rutas solo-escritura)

Las rutas de formulario que hoy quedan abiertas a roles de lectura se restringen a los roles de
escritura. Único cambio real en `router.tsx`: separar

```
/inventario/productos/nuevo
/inventario/productos/:id/editar
```

en su propio `RoleRoute allow={['EmisorAdmin','GerenteSucursal']}` (hoy heredan
`[EmisorAdmin, GerenteSucursal, Cajero, Contador, Auditor]`, la audiencia de solo lectura de
productos).

Las demás rutas solo-escritura ya coinciden con sus roles de escritura y no cambian:
`/compras/nueva`, `/compras/:id/editar` (`[EmisorAdmin, GerenteSucursal, Contador]`),
`/cuentas-por-cobrar/nueva` (`[EmisorAdmin, GerenteSucursal, Cajero]`),
`/facturacion/emitir/*` (`[EmisorAdmin, GerenteSucursal, Cajero]`).

### Capa 2 — Acción (`<Can>` en triggers)

Envolver cada disparador en `<Can roles={CONSTANTE} fallback={null}>…</Can>` (oculta el botón).

## Módulo central de la matriz: `src/lib/authz/acciones.ts`

Fuente única de verdad. Constantes `RolNombre[]` nombradas por acción, espejo literal del
backend. Elimina el `ROLES_ESCRITURA` duplicado de la Entrega A
(`UsuariosTable`/`UsuariosPage` pasan a importar del módulo central).

Antes, en `src/lib/authz/roles.ts`: añadir el 7º rol `EncargadoInventario` al tipo `RolNombre`
y al array `ROLES` (el backend lo autoriza para ajustes/traslados de inventario).

```ts
export const FACTURA_CREAR:        RolNombre[] = ['EmisorAdmin', 'GerenteSucursal', 'Cajero']
export const FACTURA_ANULAR:       RolNombre[] = ['EmisorAdmin', 'GerenteSucursal']
export const COMPRA_ESCRIBIR:      RolNombre[] = ['EmisorAdmin', 'GerenteSucursal', 'Contador']
export const PROVEEDOR_ESCRIBIR:   RolNombre[] = ['EmisorAdmin', 'GerenteSucursal', 'Contador']
export const CXC_PAGAR:            RolNombre[] = ['EmisorAdmin', 'GerenteSucursal', 'Cajero']
export const CXC_REFINANCIAR:      RolNombre[] = ['EmisorAdmin', 'GerenteSucursal']
export const PRODUCTO_ESCRIBIR:    RolNombre[] = ['EmisorAdmin', 'GerenteSucursal']
export const CATALOGO_ESCRIBIR:    RolNombre[] = ['EmisorAdmin', 'GerenteSucursal']
export const CATALOGO_ELIMINAR:    RolNombre[] = ['EmisorAdmin']
export const INVENTARIO_AJUSTAR:   RolNombre[] = ['EmisorAdmin', 'GerenteSucursal', 'EncargadoInventario']
export const DTE_RECIBIDO_GESTIONAR: RolNombre[] = ['EmisorAdmin', 'GerenteSucursal', 'Contador']
export const DTE_RECIBIDO_CONFIG:  RolNombre[] = ['EmisorAdmin']
```

### Origen de cada constante (matriz backend)

| Constante | Endpoints backend | Roles |
|---|---|---|
| `FACTURA_CREAR` | `POST /facturas`, `guardar-pendiente`, `DELETE /{id}/descartar`, buscar/detalle NC/ND | EmisorAdmin, GerenteSucursal, Cajero |
| `FACTURA_ANULAR` | `POST /{id}/anular`, `/{id}/invalidar`, `/{id}/reenviar-correo` | EmisorAdmin, GerenteSucursal |
| `COMPRA_ESCRIBIR` | `POST/PUT /compras-externas`, `/confirmar`, `/anular`, `/editar-confirmada` | EmisorAdmin, GerenteSucursal, Contador |
| `PROVEEDOR_ESCRIBIR` | `POST/PUT /proveedores`, `PATCH /{id}/estado`, `DELETE /{id}` | EmisorAdmin, GerenteSucursal, Contador |
| `CXC_PAGAR` | `POST /{planId}/cuotas/{n}/pagar`, `POST /cuentas-por-cobrar`, reportes estado-cuenta | EmisorAdmin, GerenteSucursal, Cajero |
| `CXC_REFINANCIAR` | `POST /{planId}/refinanciar`, `PUT /configuracion-mora` | EmisorAdmin, GerenteSucursal |
| `PRODUCTO_ESCRIBIR` | `POST/PUT /productos-servicios`, `/toggle-active`, `/desactivar` | EmisorAdmin, GerenteSucursal |
| `CATALOGO_ESCRIBIR` | `POST/PUT /categorias`, `/marcas`, `/toggle-active` | EmisorAdmin, GerenteSucursal |
| `CATALOGO_ELIMINAR` | `DELETE /categorias/{id}`, `DELETE /marcas/{id}` | EmisorAdmin |
| `INVENTARIO_AJUSTAR` | `POST /inventario/ajustes`, `POST /inventario/traslado` | EmisorAdmin, GerenteSucursal, EncargadoInventario |
| `DTE_RECIBIDO_GESTIONAR` | ingesta/mapeo→compra/descartar (verificar controller exacto) | EmisorAdmin, GerenteSucursal, Contador |
| `DTE_RECIBIDO_CONFIG` | Gmail connect/exchange/disconnect (`EmisoresController`) | EmisorAdmin |

**Decisión fiel al backend:** `SuperAdmin` **no** se incluye en los gates de features operativos
(compras/facturación/inventario/cxc). El backend no lo autoriza ahí y la nav ya lo excluye; es
intencional, no un olvido. `SuperAdmin` permanece solo en gates de sistema (usuarios, hecho en
Entrega A).

## Sitios a gatear (triggers) — ~30

**Compras (6)**
- `pages/ComprasListPage.tsx` → "Nueva compra" → `COMPRA_ESCRIBIR`
- `pages/CompraDetallePage.tsx` → "Editar"/"Confirmar"/"Anular" → `COMPRA_ESCRIBIR`
- `pages/ProveedoresPage.tsx` → "Nuevo proveedor" + acciones de fila "Editar"/"Desactivar" → `PROVEEDOR_ESCRIBIR`

**Facturación (3)**
- `pages/EmitirLandingPage.tsx` → cards de emisión de DTE → `FACTURA_CREAR`
  (defensa en profundidad; la ruta ya está gateada)
- `pages/DteDetallePage.tsx` → "Anular" → `FACTURA_ANULAR`

**Inventario (10)**
- `components/ProductosTab.tsx` → "Nuevo producto" + fila "Editar"/"Desactivar" → `PRODUCTO_ESCRIBIR`
- `components/CategoriasTab.tsx` → "Nueva categoría" + fila "Editar"/"Toggle" → `CATALOGO_ESCRIBIR`; "Eliminar" → `CATALOGO_ELIMINAR`
- `components/MarcasTab.tsx` → "Nueva marca" + fila "Editar"/"Toggle" → `CATALOGO_ESCRIBIR`; "Eliminar" → `CATALOGO_ELIMINAR`
- `components/ExistenciasTab.tsx` → "Ajustar"/"Trasladar" → `INVENTARIO_AJUSTAR`

**Cuentas por cobrar (3)**
- `components/PlanCuotasTable.tsx` (o `pages/PlanDetallePage.tsx`) → "Pagar" → `CXC_PAGAR`
- `pages/PlanDetallePage.tsx` → "Refinanciar" → `CXC_REFINANCIAR`; "Descargar estado de cuenta" → `CXC_PAGAR`

**DTEs recibidos (5)**
- `pages/DtesRecibidosListPage.tsx` → "Cargar JSON"/"Leer correo" → `DTE_RECIBIDO_GESTIONAR`; "Configurar correo" → `DTE_RECIBIDO_CONFIG`
- `pages/DteRecibidoDetallePage.tsx` → "Mapear y crear compra"/"Descartar" → `DTE_RECIBIDO_GESTIONAR`

Los triggers abren modales (`AnularCompraModal`, `PagarCuotaModal`, etc.); el modal solo se
alcanza si el trigger fue visible, así que **no** se gatea dentro del modal.

## Testing (patrón Entrega A, TDD)

- `src/lib/authz/acciones.test.ts`: verifica la membresía de cada constante (previene drift
  respecto al backend). Incluye `EncargadoInventario` en `INVENTARIO_AJUSTAR` y su ausencia en
  el resto.
- Un test por **sitio de trigger**, con un helper `renderConRol(rol)`: asserta que el botón se
  **oculta** para un rol de solo lectura representativo y se **muestra** para uno de escritura.
- Un test de ruta: `/inventario/productos/nuevo` redirige a `AccesoDenegado` para `Cajero`/
  `Contador`/`Auditor` y renderiza el form para `EmisorAdmin`.
- Suite completa verde + lint + build antes de PR.

## Riesgos / a verificar en el plan

1. **Roles exactos de DTEs recibidos:** el mapeo backend no expuso un controller dedicado de
   ingesta. Confirmar contra el controller real; default fiel = `[EmisorAdmin, GerenteSucursal,
   Contador]` (alineado con "mapear→crear compra"). Ajustar si difiere.
2. **`EncargadoInventario` emitido:** añadirlo al type es barato y fiel; si el login nunca puebla
   ese rol, no rompe nada (nadie lo tiene). No requiere backend.
3. **Estructura de acciones de fila:** confirmar cómo se renderizan los botones inline en tablas
   (`ProveedoresPage`, `*Tab`) para envolver el `<Can>` sin romper el layout de la celda.

## Entregable

- `src/lib/authz/roles.ts` (+`EncargadoInventario`), `src/lib/authz/acciones.ts` (+test).
- `<Can>` en ~30 triggers de 5 features.
- Endurecimiento de la ruta de form de producto en `router.tsx`.
- Consolidación del `ROLES_ESCRITURA` duplicado de Entrega A.
- Suite verde, PR por web hacia `development`.
