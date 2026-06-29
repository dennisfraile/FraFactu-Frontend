# F6 — Inventario (frontend)

**Fecha:** 2026-06-29
**Rama:** `feat/f6-inventario` (desde `development`)
**Alcance:** Rebanada única, operativo completo. Catálogo de productos/servicios (+ categorías y marcas, incl. activo fijo) + Stock (existencias, ajuste, traslado) + Movimientos (+ kardex) + Reportes (vistas de tabla simples).

## Contexto

Las entradas de sidebar `/inventario/productos` y `/inventario/stock` están declaradas en `nav-config.ts` pero **no tienen ruta/página** (links muertos). El backend de inventario ya existe y es maduro (F3): `ProductosServiciosController`, `CategoriasController`, `MarcasController`, `BodegasController`, `InventarioController` (escritura), `InventarioReportesController` (lecturas/reportes). Esta es una fase de **solo frontend** sobre backend existente, **independiente de credenciales de Hacienda**. Referencia visual/IA: `SmartInventory-FrontEnd` (`ProductosPage`, `StockPage`, `MovimientosPage`, `CategoriasPage`, `MarcasPage`).

## Decisiones de diseño

1. **Una sola rebanada**, profundidad "operativo completo": todo el uso diario; los reportes contables como **vistas de tabla simples** (KPIs como tarjetas), sin gráficos pesados.
2. **Activo fijo (MobiliarioEquipo) incluido en v1**: el formulario de producto muestra los campos de activo fijo (fecha adquisición, años vida útil, valor actual, valor residual) **solo** cuando `tipoInventario == 1` (MobiliarioEquipo).
3. **Sidebar agrupado a 3 entradas** con pestañas internas:
   - **Productos** (`/inventario/productos`) → pestañas *Productos / Categorías / Marcas*. Alta/edición de producto en ruta propia.
   - **Stock** (`/inventario/stock`) → pestañas *Existencias* (con Ajustar/Trasladar) */ Movimientos* (con Kardex).
   - **Reportes** (`/inventario/reportes`) → *Valorizado / CMV / Rotación / ABC / KPIs*.
4. **Gating de rol:** se confía en el 403 del backend (deuda app-wide conocida), consistente con el resto del frontend. No se oculta por rol.

## Contrato del backend (confirmado)

Rutas SIN kebab-case (atributo `[Route("api/[controller]")]`); el cliente axios antepone `/api`.

**Productos/servicios — `/api/productosservicios`** (`PaginatedResponse<ProductoServicioListDto>`, estilo F2: `items/pageNumber/pageSize/totalItems/totalPages`):
- `GET /` — query `PaginatedRequest` (pageNumber, pageSize, searchTerm?) + `sucursalId? categoriaId? marcaId? unidadMedida? tipo? incluirInactivos`.
- `GET /search?searchTerm&sucursalId?` → `ProductoServicioListDto[]` (ya usado por facturación).
- `GET /{id}` → `ProductoServicioDto`.
- `POST /` ← `CreateProductoServicioDto` → 201 `ProductoServicioDto` (roles EmisorAdmin/GerenteSucursal).
- `PUT /{id}` ← `UpdateProductoServicioDto`.
- `PATCH /{id}/toggle-active`.
- `POST /{id}/desactivar` ← `DesactivarProductoServicioDto`.

`CreateProductoServicioDto` (campos): `codigo, nombre, descripcion?, precioVenta, catUnidadMedidaId, catTipoItemId, codigoBarras?, categoriaId?, marcaId?, precioCosto?, tipoImpuesto(1/2/3), porcentajeIVA?, precioIncluyeIva, costoIncluyeIva, stockMinimo?, stockMaximo?, puntoReorden?, permiteVentaSinStock?, tipoInventario(0=Ventas/1=MobiliarioEquipo/2=Insumos), fechaAdquisicion?, aniosVidaUtil?, valorActual?, valorResidual?, accesoTodasSucursales, sucursalIds?, tributosAdicionales?: ProductoTributoDto[]`. (El IVA "20" NO va en tributosAdicionales; se deriva de tipoImpuesto/porcentajeIVA.)

**Categorías — `/api/categorias`** y **Marcas — `/api/marcas`** (misma forma): `GET /`, `GET /{id}`, `POST`, `PUT /{id}`, `DELETE /{id}` (solo EmisorAdmin), `PATCH /{id}/toggle-active`. DTOs `CategoriaDto`/`MarcaDto`.

**Bodegas — `/api/bodegas/sucursal/{sucursalId}`** (ya usado por facturación).

**Inventario (escritura) — `/api/inventario`** (roles EmisorAdmin/GerenteSucursal/EncargadoInventario):
- `POST /ajustes` ← `AjusteInventarioDto { productoId, bodegaId, cantidad (±), motivo (CORRECCION/MERMA/FALTANTE/SOBRANTE/DAÑADO/OTRO), observaciones (10–1000 chars) }`.
- `POST /traslado` ← `TrasladoInventarioDto { productoId, bodegaOrigenId, bodegaDestinoId, cantidad, observaciones? }`.

**Inventario reportes (lectura) — `/api/inventarioreportes`** (roles EmisorAdmin/GerenteSucursal/Contador/Auditor[/Cajero en stock]):
- `GET /stock?bodegaId?&productoId?&search?&page&pageSize&sucursalId?&categoriaId?&marcaId?` → `PagedResult<StockPorBodegaDto>` (estilo compras: `items/totalItems/pageNumber/totalPages`).
- `GET /stock/bajo-minimo`, `GET /stock/sin-movimiento`.
- `GET /movimientos?desde&hasta&productoId?&bodegaId?&tipoMovimiento?&search?&page&pageSize&sucursalId?&ocultarAnulaciones?&sortBy?&sortDesc?` → `PagedResult<MovimientoInventarioDto>` (desde/hasta obligatorios).
- `GET /kardex/{productoId}?bodegaId?&desde?&hasta?&search?&page&pageSize&sucursalId?&tipoMovimiento?` → `KardexProductoDto`.
- `GET /movimientos/resumen-por-tipo`, `GET /valoracion`, `GET /cmv`, `GET /rotacion`, `GET /rotacion-abc`, `GET /kpis`.

> Nota: los wrappers de paginado difieren — productos usa `PaginatedResponse` (F2) y los reportes usan `PagedResult` (compras). Las formas exactas de `StockPorBodegaDto`/`MovimientoInventarioDto`/`KardexProductoDto`/los reportes se fijan al detalle en el plan leyendo cada DTO.

## Arquitectura del feature

```
src/features/inventario/
  api.ts                 # productosApi (CRUD), categoriasApi, marcasApi, inventarioApi (ajuste/traslado), reportesApi (+descarga si aplica)
  types.ts               # tipos espejo de los DTOs
  schemas.ts             # zod: producto, categoría, marca, ajuste, traslado
  calc/precio.ts         # derivaciones precio con/sin IVA (si se muestran)
  hooks.ts               # React Query: productos, producto, categorías, marcas, stock, movimientos, kardex, reportes, mutaciones (crear/editar/toggle/desactivar/ajustar/trasladar/CRUD catálogos)
  components/
    ProductoFormFields/* # secciones del formulario (datos, precios/impuesto, stock, activo-fijo, sucursales, tributos)
    CategoriaFormModal.tsx, MarcaFormModal.tsx   # alta rápida + edición
    AjusteStockModal.tsx, TrasladoStockModal.tsx
    StockTable.tsx, MovimientosTable.tsx, KardexPanel.tsx
    TributosProductoSection.tsx
  pages/
    ProductosPage.tsx        # tabs Productos/Categorías/Marcas (índice /inventario/productos)
    ProductoFormPage.tsx     # /inventario/productos/nuevo y /:id/editar
    StockPage.tsx            # tabs Existencias/Movimientos
    ReportesInventarioPage.tsx
+ src/test/msw/inventario-handlers.ts
+ rutas en src/app/router.tsx; nav en src/app/nav-config.ts (3 entradas) + icono(s)
```

## Páginas y flujo

- **ProductosPage** (`/inventario/productos`): pestaña *Productos* = listado paginado con filtros (búsqueda, categoría, marca, tipo ítem, tipo inventario, incluir inactivos) + acciones toggle-activo/desactivar y botón "Nuevo". Pestañas *Categorías* y *Marcas* = listas con CRUD (crear/editar vía modal, toggle, eliminar con confirmación).
- **ProductoFormPage** (`/inventario/productos/nuevo` | `/:id/editar`): formulario completo en secciones (datos generales, precios e impuesto, control de stock, **activo fijo** condicional a MobiliarioEquipo, sucursales, tributos adicionales). Categoría/marca con **alta rápida** (modal). Al guardar, POST/PUT y vuelve al listado.
- **StockPage** (`/inventario/stock`): pestaña *Existencias* = tabla producto×bodega (CantidadDisponible/CostoPromedio) con filtros (bodega, sucursal, categoría/marca, búsqueda) y sub-vistas todas / bajo-mínimo / sin-movimiento; acciones **Ajustar** y **Trasladar** (modales). Pestaña *Movimientos* = tabla paginada (rango de fechas obligatorio, filtros tipo/producto/bodega) con **Kardex** por producto (panel/expansión).
- **ReportesInventarioPage** (`/inventario/reportes`): sub-secciones por reporte (Valorizado, CMV, Rotación, ABC, KPIs) como tablas; KPIs como tarjetas; descarga si el endpoint exporta.

## Estado de formularios sin useEffect+setState

Para inicializar el formulario de producto en edición desde los datos cargados, usar el patrón **inner-form con `key`** (componente interno que recibe el producto como prop inicial y se remonta con `key={producto.id|'nuevo'}`), NO `useEffect`+`setState` (regla ESLint `react-hooks/set-state-in-effect`). Los campos condicionales (activo fijo) se derivan del valor de `tipoInventario` en el estado del form, sin efecto.

## Errores, testing y restricciones

- **Errores:** `e.response?.data?.error` (o `.message`) → toast tono `rojo`; estados de carga/vacío con `Spinner`/`EmptyState` (prop `hint`). 404 en edición → estado vacío.
- **Reuso:** `bodegasApi`/`sucursalesApi`/`useCatalogo('unidadesMedida')`/`useCatalogo('tiposItem')` de facturación donde apliquen; `Button`/`Modal`/`FormField`/`Input`/`Table`/`Badge`/`EmptyState`/`Spinner`/`useToast`/`Tabs` del design-system (`Tabs` ya existe).
- **Testing:** TDD por componente/hook con MSW; `calc/` y `schemas` con tests unitarios; `npm run build` tras cada tarea (vitest no ve errores de tsc); e2e final contra Docker (crear producto → ver en stock → ajustar → trasladar → movimientos/kardex → reportes), y revisión whole-branch (opus) por el controlador.
- **Restricciones (lecciones S1–S6):** imports al tope (`import/first`); rutas backend tal cual (sin kebab salvo donde el backend lo use); NO `useEffect`+`setState` (inner-form con `key`, `refetchInterval` para polling); el `Button` del design-system es `<button>` (no `as={Link}`) → usar `<Link>` estilado o `useNavigate`; `EmptyState` usa prop `hint`; `Badge` usa prop `estado` (valores recibido/pendiente/rechazado/borrador) — para estados de inventario, mapear a esos tonos o usar otro indicador; confirmar las formas exactas de los DTOs de reportes al escribir el plan.

## Fuera de alcance (YAGNI / rebanadas futuras)

- Carga masiva de productos (CSV/Excel) — la referencia la tiene, se difiere.
- Gráficos analíticos en reportes (solo tablas/tarjetas en v1).
- Entradas/salidas manuales directas de inventario (las entradas vienen de compras/facturación; aquí solo ajuste y traslado, que es lo que expone `InventarioController`).
- Gating de rol app-wide en el frontend (deuda conocida).

## Deudas heredadas que NO se abordan

- Gating de rol app-wide; teardown pre-existente en `design-system/Combobox.test.tsx` y `facturacion/.../DocumentoOriginalSection.test.tsx`; minors diferidos de S6.
