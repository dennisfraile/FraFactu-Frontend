# Dashboard real — Diseño

**Fecha:** 2026-07-01
**Estado:** Aprobado (brainstorming)
**Rama:** `feat/dashboard-real`
**Depende de:** módulo authz (`useAuthz`, `<Can>`), design system, `useAuthStore`, cliente `@/lib/http/axios`.

## Problema

Hoy `/dashboard` es un placeholder (`src/features/dashboard/DashboardPlaceholder.tsx`). El backend ya expone un `DashboardController` completo (9 endpoints). Queremos un dashboard real que consuma esos endpoints, respetando el design system "Tinta y Sello en cálido" y curando qué ve cada rol.

## Decisiones (del brainstorming)

- **Gráficos:** `recharts` (nueva dependencia).
- **Alcance:** completo — los 9 endpoints.
- **Vistas por rol:** dashboard único con secciones gateadas (no layouts separados).
- **Rango de fechas:** presets (Hoy/7d/30d/Este mes) + rango personalizado.

## Contrato backend (fuente de verdad)

Base `/api/dashboard`. Controller autoriza los 6 roles principales; el scope por sucursal lo aplica el backend (`ScopeHelper`): SuperAdmin/EmisorAdmin ven todo; GerenteSucursal/Contador/Cajero/Auditor quedan limitados a su(s) sucursal(es). `sucursalId` es opcional; un rol con scope que pida una sucursal ajena recibe 403.

**Inconsistencia de params de fecha entre endpoints — se absorbe en `api.ts`:**

| Endpoint | Método | Params de fecha / paginación | Roles | Respuesta |
|---|---|---|---|---|
| `/kpis` | GET | `fechaInicio?`, `fechaFin?`, `fechaAnteriorInicio?`, `fechaAnteriorFin?`, `sucursalId?` | 6 | `DashboardKPIs` |
| `/ventas-por-dia` | GET | `dias?`(def 30), `sucursalId?` | 6 | `VentasPorDia[]` |
| `/productos-mas-vendidos` | GET | `top?`(def 10), `fechaInicio?`, `fechaFin?`, `sucursalId?` | 6 | `ProductoMasVendido[]` |
| `/ventas-por-categoria` | GET | `fechaInicio?`, `fechaFin?`, `sucursalId?` | 6 | `VentasPorCategoria[]` |
| `/ventas-por-categoria/detalle` | GET | `fechaInicio?`, `fechaFin?`, `sucursalId?`, `categoriaId?`, `search?`, `page?`, `pageSize?` | 6 | `PagedResult<VentaCategoriaDetalleDto>` |
| `/ventas-por-vendedor` | GET | `fechaInicio?`, `fechaFin?`, `sucursalId?` | 6 | `VentasPorVendedor[]` |
| `/ventas-por-vendedor/detalle` | GET | `fechaInicio?`, `fechaFin?`, `sucursalId?`, `vendedorId?`, `search?`, `page?`, `pageSize?` | 6 | `PagedResult<VentaVendedorDetalleDto>` |
| `/comparativo-sucursales` | GET | `desde`**(req)**, `hasta`**(req)**, `sucursalId?`, `search?`, `page?`, `pageSize?` | 6 | `PagedResult<ComparativoSucursalDto>` |
| `/cajero` | GET | `fechaDesde?`, `fechaHasta?` | EmisorAdmin, GerenteSucursal, Contador, Cajero (**sin** Auditor/SuperAdmin) | `DashboardCajeroDto` |

DTOs (propiedades exactas):
- `DashboardKPIs`: `totalFacturas:number, totalVentas:number, promedioVenta:number, facturasAprobadas:number, facturasPendientes:number, facturasRechazadas:number, crecimientoVentas:number`
- `VentasPorDia`: `fecha:string(ISO), cantidadFacturas:number, totalVentas:number`
- `ProductoMasVendido`: `productoId:number, nombreProducto:string, cantidadVendida:number, totalVentas:number`
- `VentasPorCategoria`: `categoriaId:number, nombreCategoria:string, totalVentas:number, cantidadVendidaReales:number, cantidadProductos:number`
- `VentaCategoriaDetalleDto`: `facturaDetalleId, facturaId, numeroControl, codigoGeneracion, fechaEmision, productoId|null, productoNombre, categoriaId|null, categoriaNombre|null, cantidad, totalVenta, receptorNombre, sucursalId|null, sucursalNombre|null`
- `VentasPorVendedor`: `vendedorId:number, codigoVendedor:string, nombreVendedor:string, totalVentas:number, cantidadFacturas:number, promedioVenta:number`
- `VentaVendedorDetalleDto`: `facturaId, numeroControl, codigoGeneracion, fechaEmision, receptorNombre, totalPagar, estadoHacienda, vendedorId|null, vendedorCodigo|null, vendedorNombre|null, sucursalId|null, sucursalNombre|null`
- `ComparativoSucursalDto`: `sucursalId, codigoSucursal, nombreSucursal, totalFacturas, totalVentas, promedioVenta, porcentajeDelTotal`
- `DashboardCajeroDto`: `totalFacturas:number, montoTotalVendido:number, promedioVenta:number, ventasPorDia: { fecha:string, cantidadFacturas:number, montoTotal:number }[]`
- `PagedResult<T>`: `items:T[], totalItems, pageNumber, pageSize, totalPages, hasPreviousPage, hasNextPage`

## Arquitectura del feature `src/features/dashboard/`

### `types.ts`
Los DTOs anteriores + `PagedResult<T>` + `RangoParams { fechaInicio?: string; fechaFin?: string; sucursalId?: number }`.

### `date-range.ts`
- `type Preset = 'hoy' | '7d' | '30d' | 'mes' | 'custom'`.
- `rangoDePreset(preset, custom?): { fechaInicio: string; fechaFin: string }` — calcula el rango en horario local y devuelve ISO (`toISOString()`); `fechaFin` = fin del día.
- `periodoAnterior({fechaInicio, fechaFin}): { fechaAnteriorInicio: string; fechaAnteriorFin: string }` — mismo largo, inmediatamente anterior (para `crecimientoVentas` de KPIs).
- Default: `'30d'`.
- **Nota de test:** el cálculo de fechas usa `new Date()`; para tests deterministas la función acepta un `ahora?: Date` inyectable (default `new Date()`).

### `api.ts`
`dashboardApi` con un método por endpoint. Recibe la interfaz común `RangoParams` (+ paginación/filtros donde aplique) y mapea a los nombres reales del backend:
- `kpis(p & { fechaAnteriorInicio?, fechaAnteriorFin? })` → `/kpis`
- `ventasPorDia({ dias?, sucursalId? })` → `/ventas-por-dia`
- `topProductos({ top?, ...RangoParams })` → `/productos-mas-vendidos`
- `ventasPorCategoria(RangoParams)` → `/ventas-por-categoria`
- `categoriaDetalle(RangoParams & { categoriaId?, search?, page, pageSize })` → `/ventas-por-categoria/detalle`
- `ventasPorVendedor(RangoParams)` → `/ventas-por-vendedor`
- `vendedorDetalle(RangoParams & { vendedorId?, search?, page, pageSize })` → `/ventas-por-vendedor/detalle`
- `comparativoSucursales({ desde, hasta, sucursalId?, search?, page, pageSize })` → `/comparativo-sucursales` (mapea `fechaInicio→desde`, `fechaFin→hasta`, requeridos)
- `cajero({ fechaDesde?, fechaHasta? })` → `/cajero` (mapea `fechaInicio→fechaDesde`, `fechaFin→fechaHasta`)

### `hooks.ts`
Un hook React Query por endpoint, `queryKey: ['dashboard-<x>', params]`. `useDashboardCajero` y `useComparativoSucursales` usan `enabled` para no dispararse cuando la sección no aplica al rol.

### Curación por rol (UX, NO seguridad)
Constantes locales en `src/features/dashboard/roles.ts` (no en `acciones.ts`, porque el backend ya autoriza a los 6 y esto es curación de presentación):
- `DASHBOARD_GERENCIAL: RolNombre[] = ['SuperAdmin','EmisorAdmin','GerenteSucursal','Contador','Auditor']` — KPIs, ventas/día, top productos, categoría, vendedor.
- `DASHBOARD_CAJERO: RolNombre[] = ['Cajero']` — sección personal (`/cajero`), vista principal del cajero.
- Selector de sucursal + comparativo-sucursales: condicionados a `user.accesoTodasSucursales === true` (no por rol), leído de `useAuthStore`.

Un `Cajero` ve **solo** su sección personal; el resto ve las secciones gerenciales; los multi-sucursal admins además ven el selector de sucursal y el comparativo.

### Componentes (`components/`)
- `PeriodoSelector.tsx` — botones de preset + inputs desde/hasta (modo custom) con validación (fin ≥ inicio). Emite `{ preset, fechaInicio, fechaFin }` al padre.
- `SucursalSelector.tsx` — `<select>` con "Todas" + sucursales de `useSucursales` (`/sucursales/todas-activas`). Solo si `accesoTodasSucursales`.
- `KpiCard.tsx` — tarjeta (label, valor formateado, delta opcional con ▲/▼ y color sello/rojo).
- `KpisSection.tsx` — grid de `KpiCard` desde `useKpis`.
- `VentasPorDiaChart.tsx` — Recharts `AreaChart` (eje X fecha, Y totalVentas), colores del tema.
- `TopProductosCard.tsx` — Recharts `BarChart` horizontal (top N).
- `VentasPorCategoriaSection.tsx` — chart (barras) + botón "Ver detalle" que abre la tabla paginada (`CategoriaDetalleTable`).
- `CategoriaDetalleTable.tsx` — `Table` con `serverPagination` + búsqueda (`useCategoriaDetalle`).
- `VentasPorVendedorSection.tsx` + `VendedorDetalleTable.tsx` — análogo a categoría.
- `ComparativoSucursalesTable.tsx` — `Table` paginada (`useComparativoSucursales`), solo multi-sucursal admins.
- `CajeroDashboard.tsx` — KPIs personales + su ventas/día (Recharts), desde `useDashboardCajero`.

### `pages/DashboardPage.tsx`
Orquesta: mantiene estado `{ preset, fechaInicio, fechaFin, sucursalId }`; renderiza `PeriodoSelector`, `SucursalSelector` (gated), y las secciones según rol/scope con `<Can>` y `accesoTodasSucursales`. Cada sección maneja su propio loading/error/empty (una sección que falla no tumba la página).

### Router / bundle
- Reemplaza `DashboardPlaceholder` por `DashboardPage` en `src/app/router.tsx` (ruta `/dashboard`, sigue abierta a todo autenticado).
- **Lazy-load**: `DashboardPage` se importa con `React.lazy` + `<Suspense fallback={<Spinner/>}>`, para que Recharts quede fuera del chunk principal (mitiga el warning de bundle >500kB).

## Manejo de errores y estados
- Cada hook/sección: `isLoading → Spinner`; `isError → EmptyState` con mensaje; datos vacíos → `EmptyState`.
- 403 por sucursal ajena: el interceptor global ya desloguea en 401/403; para el dashboard, el scope lo garantiza el backend, así que no se fuerza sucursal ajena desde la UI (el selector solo lista sucursales accesibles).

## Testing
- `date-range.test.ts`: presets → rangos correctos (con `ahora` inyectado); `periodoAnterior` correcto.
- `api.test.ts` (MSW): cada método mapea al endpoint y params correctos (en especial `desde/hasta` de comparativo y `fechaDesde/fechaHasta` de cajero).
- `src/test/msw/dashboard-handlers.ts`: datos de ejemplo para los 9 endpoints; registrado (additive) en `src/test/msw/handlers.ts`.
- Componentes con datos (`KpiCard`, `CategoriaDetalleTable`, `ComparativoSucursalesTable`, `CajeroDashboard` KPIs): aserciones de valores.
- Charts Recharts: en jsdom `ResponsiveContainer` no mide ancho → **mockear `ResponsiveContainer`** (o `recharts`'s container) a tamaño fijo en el setup del test; asevera que el chart renderiza con los datos, sin crash.
- Curación por rol (test de `DashboardPage`): Cajero ve sección personal y NO gerenciales; Auditor ve gerenciales sin selector de sucursal; EmisorAdmin ve todo + selector + comparativo.
- Suite completa + lint + build verdes antes de PR.

## Fuera de alcance
Export PDF/Excel del dashboard; auto-refresh en vivo; drill-downs más allá de los `/detalle` del backend; selector de `ambiente` (se usa el ambiente activo por defecto del backend).

## Entregable
- Feature `src/features/dashboard/` (types/api/hooks/date-range/roles + componentes + `DashboardPage`).
- Dependencia `recharts` añadida.
- Router: `/dashboard` → `DashboardPage` (lazy).
- `dashboard-handlers.ts` MSW.
- Suite verde, PR por web hacia `development`.
