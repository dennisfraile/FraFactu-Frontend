# F5.4 — S4: DTEs recibidos (diseño)

Fecha: 2026-06-27
Rama: `feat/f5-4-dtes-recibidos` (desde `development`)
Repo: `FraFactu-Frontend` (React + TS + Vite). Backend ya existe completo.

## Contexto

Cuarta sub-rebanada de F5.4. El backend de DTEs recibidos ya está completo
(`DtesRecibidosController` + OAuth Gmail en `EmisoresController`); S4 es casi solo
frontend, espejo de la feature `compras` (S5). Solo se ingieren **CCF (03)**.

Decisiones de alcance tomadas en brainstorming:
- **Todo S4 en una sola rama**, incluido el bloque Gmail.
- **Gmail diferido para e2e**: el entorno dev no tiene credenciales OAuth de Google
  configuradas (análogo al bloqueo del MH). La UI se cablea pero su validación e2e
  queda pendiente; lo validable e2e ahora es carga manual + descartar + mapeo.
- **Asistente de mapeo: layout A** (tabla en una sola pantalla, filas expandibles).
- **Las 3 acciones por línea**: producto existente, producto nuevo (inline) y gasto.

## Alcance

Nueva feature `src/features/dtes-recibidos/` con la convención de `compras/`
(`api.ts`, `hooks.ts`, `types.ts`, `schemas.ts`, `mappers.ts`, `estado.ts`,
`calc/`, `components/`, `pages/`, MSW handlers).

**Dentro de S4:**
- Listar + filtros + tarjetas de estadísticas + paginación de servidor.
- Detalle (parsea `JsonDte`).
- Carga manual de JSON (multipart, hasta 100 archivos).
- Descartar (con motivo).
- Asistente mapear-y-crear-compra (layout A, 3 acciones).
- Gmail: configuración (connect → callback → exchange / disconnect / toggle /
  probar conexión) + leer correo asíncrono con polling. **UI cableada, e2e diferido.**

**Fuera de S4 (YAGNI):** `vincular/{compraId}` (enlazar a compra existente),
`enviar-prueba`, y `crear-compra` legacy (usamos solo `mapear-y-crear-compra`).

## Rutas, navegación y roles

Rutas (en `router.tsx`, dentro del layout protegido):
- `/dtes-recibidos` → `DtesRecibidosListPage`
- `/dtes-recibidos/:id` → `DteRecibidoDetallePage`
- `/dtes-recibidos/:id/mapear` → `MapearDtePage`
- `/dtes-recibidos/configuracion` → `ConfiguracionCorreoPage`
- `/dtes-recibidos/gmail/callback` → `GmailCallbackPage`

Nav (`nav-config.ts`): "DTEs recibidos" → `/dtes-recibidos`.

Roles (espejo del backend, gateados en nav/acciones):
- Ver lista/detalle/estadísticas: `EmisorAdmin`, `GerenteSucursal`, `Contador`, `Auditor`.
- Acciones (cargar JSON, leer correo, descartar, mapear-crear-compra): `EmisorAdmin`, `GerenteSucursal`.
- Configuración Gmail (connect/disconnect/toggle/probar): solo `EmisorAdmin`.

**Supuesto a confirmar (Gmail diferido):** el `GmailRedirectUri` del backend/Google
Cloud debe apuntar a `…/dtes-recibidos/gmail/callback`.

## Contrato del backend (verificado)

Rutas SIN kebab-case. Base `/api`.

DTEs recibidos (`/api/dtesrecibidos`):
- `GET /` — query: `pagina, tamanoPagina, estado?, tipoDte?, emisorNit?, fechaDesde?, fechaHasta?, search?, sortBy?, sortDesc`. Resp `{ items: DteRecibidoResumenDto[], total, pagina, tamanoPagina, totalPaginas }`.
- `GET /{id}` → `DteRecibidoDto` (incluye `jsonDte` crudo).
- `GET /estadisticas` — mismos filtros → `DteRecibidoEstadisticasDto`.
- `POST /cargar-json` — multipart `archivos` (≤100, 5MB c/u) → `CargaMasivaDtesResponseDto` (resultado por archivo).
- `POST /{id}/descartar` — `{ motivo: string }`.
- `POST /{id}/mapear-y-crear-compra` — `MapearDteCompraDto` → `MapearDteCompraResponseDto`.
- `POST /leer-correo` — body opcional `{ mesInicio?: "YYYY-MM", mesFin?: "YYYY-MM" }` (ambos o ninguno; MesFin≥MesInicio; ≤12 meses) → `{ jobId, estado, mensaje }` (202).
- `GET /leer-correo/estado` → `EstadoLecturaCorreoJobDto` (contadores en vivo, `terminado`).
- `PUT /configuracion` — `{ lecturaCorreoHabilitada: bool }`.
- `POST /probar-conexion` → `{ exitoso, mensaje }`.

Gmail OAuth (`/api/emisores`):
- `GET /gmail-connect` → `{ authorizationUrl }`.
- `POST /gmail-exchange-code` — `{ code, state }` → `{ success, email }`.
- `DELETE /gmail-disconnect` → `{ message }`.

### DTOs clave

`MapearDteCompraDto`:
- `sucursalId: int` (debe pertenecer al emisor).
- `items: MapearItemDto[]`.

`MapearItemDto` (uno por línea del DTE):
- `descripcionDte: string`, `montoDte: decimal`, `accion: "PRODUCTO_EXISTENTE" | "PRODUCTO_NUEVO" | "GASTO"`.
- Si `PRODUCTO_EXISTENTE`: `productoId: int` + `cantidad>0` + `bodegaId` + `costoUnitario≥0`.
- Si `PRODUCTO_NUEVO`: `productoNuevo: ProductoNuevoMapeoDto` + `cantidad` + `bodegaId` + `costoUnitario`.
- Si `GASTO`: `catTipoGastoId?: int` (usa `montoDte`).

`ProductoNuevoMapeoDto`: `codigo, nombre, catTipoItemId (1=Bien/2=Servicio),
catUnidadMedidaId (CAT-14), categoriaId?, tipoInventario (0=Ventas/1=Mobiliario/2=Insumos),
aniosVidaUtil? (si Mobiliario), valorResidual?`.

`MapearDteCompraResponseDto`: `compraId, totalMapeado, totalDte, itemsProductos,
itemsGastos, productosCreados`.

Validación de cuadre del backend: Σ(totales de línea) ≈ `DteRecibido.Total` ±0.01.
Efecto: crea `CompraExterna` BORRADOR con `Origen="DTE"`; DTE pasa a `VINCULADO`,
`CompraExternaId` seteado.

`DteRecibidoDto` (display): `id, codigoGeneracion, selloRecibido?, tipoDte,
numeroControl?, fechaEmision, emisorNit, emisorNombre, emisorNrc?, receptorNit?,
receptorNombre?, jsonDte, montoGravado, montoExento, montoNoSujeto, subTotal, iva,
total, estado, compraExternaId?, motivoDescarte?, emailOrigen?, fechaRecepcionEmail?,
fechaCreacion, fechaActualizacion?`.

Estructura interna de líneas (parseo de `jsonDte.cuerpoDocumento[]`): `numItem,
codigo?, descripcion, cantidad, precioUni, montoDescu, ventaGravada, ventaExenta,
ventaNoSuj, uniMedida?, tipoItem`.

`EstadoLecturaCorreoJobDto`: `jobId, estado (ENCOLADO|EN_PROGRESO|COMPLETADO|FALLIDO),
fechaCreacion, fechaInicio?, fechaFin?, correosProcesados, dtesEncontrados, dtesNuevos,
dtesDuplicados, errores, dtesIgnorados, mensajeError?, rangoDesde?, rangoHasta?,
esAutomatico, terminado`.

Estados del DTE recibido (`estado`): `PENDIENTE`, `VINCULADO`, `DESCARTADO`.
Fuente (`fuenteRecepcion`): `CORREO`, `CARGA_MANUAL`.

## Componentes y páginas

### `DtesRecibidosListPage`
- Tarjetas de estadísticas (de `GET /estadisticas`): totales por estado, monto
  pendiente, última lectura.
- Filtros: `estado, tipoDte, emisorNit, fechaDesde/fechaHasta, search`; orden;
  paginación de servidor (reusa `Table` con `serverPagination`).
- Columnas: fecha emisión, emisor (NIT+nombre), tipoDte, nº control, total, fuente,
  estado (`Badge`). Fila → detalle.
- Header con acciones según rol: **Cargar JSON** (modal), **Leer correo** (modal +
  polling), **Configurar correo** (→ página config).

### `DteRecibidoDetallePage`
- Parsea `jsonDte` y muestra identificación, emisor, receptor, tabla de líneas
  (`cuerpoDocumento`), resumen (gravado/exento/no sujeto, subtotal, IVA, total).
- Bloque estado/trazabilidad: estado, origen, email origen, fecha recepción; si
  VINCULADO → enlace a `/compras/:compraExternaId`; si DESCARTADO → motivo.
- Acciones (si PENDIENTE y rol): **Mapear y crear compra**, **Descartar** (modal motivo).

### `MapearDtePage` (asistente, layout A)
- Cabecera: datos del DTE + selector de **Sucursal** (`sucursalesApi`).
- Tabla de líneas (una por `cuerpoDocumento`): muestra descripción/cantidad/precio
  originales + clasificador por línea (`Existente`/`Nuevo`/`Gasto`):
  - Existente: `AsyncSearchSelect` productos (`productosApi`) + Cantidad + Bodega
    (`bodegasApi` por sucursal) + CostoUnitario.
  - Nuevo: sub-formulario inline (`codigo, nombre, catTipoItemId, catUnidadMedidaId,
    categoriaId?, tipoInventario` + `aniosVidaUtil/valorResidual` si Mobiliario) +
    Cantidad + Bodega + CostoUnitario.
  - Gasto: `catTipoGastoId?` (`tiposgasto`); usa el monto de la línea del DTE.
- Panel de cuadre (`calc/mapeo.ts`): Σ líneas (productos = cantidad×costo; gastos =
  montoDte) vs `DTE.Total`; valida ±0.01; bloquea el botón si no cuadra.
- Submit: `POST /{id}/mapear-y-crear-compra` → navega a `/compras/:compraId` con toast.

### Gmail / lectura / carga
- `ConfiguracionCorreoPage` (solo EmisorAdmin): estado de conexión (de datos del
  emisor: `gmailConectado/gmailEmail`); **Conectar** (`gmail-connect` → abre
  `authorizationUrl`); **Desconectar** (`gmail-disconnect`); **Probar conexión**
  (`probar-conexion`); **Toggle lectura** (`PUT /configuracion`).
- `GmailCallbackPage`: lee `code`+`state` del query → `gmail-exchange-code` →
  resultado y vuelta a config.
- Modal **Leer correo**: rango opcional `mesInicio/mesFin` (YYYY-MM); `POST
  /leer-correo` → polling `GET /leer-correo/estado` (vía React Query
  `refetchInterval` mientras `!terminado`, **sin** `useEffect`+setState por el lint
  del proyecto), mostrando contadores; al terminar invalida el listado.
- Modal **Cargar JSON**: input multi-archivo (≤100, JSON/JWT); `POST /cargar-json`
  multipart → muestra resultado por archivo; invalida el listado.

### `estado.ts`
Mapea estado DTE → tono de `Badge`: PENDIENTE→`borrador`, VINCULADO→`recibido`,
DESCARTADO→`rechazado`.

## Validación (zod, `schemas.ts`)
- Mapeo: por línea según `accion` (Existente: productoId+cantidad>0+bodega+costo≥0;
  Nuevo: campos del producto + cantidad/bodega/costo; Gasto: categoría opcional); al
  menos una línea; cuadre global ±0.01 (refinement). Sucursal requerida.
- Descartar: `motivo` no vacío.
- Leer correo: ambos meses o ninguno; formato YYYY-MM; MesFin≥MesInicio; ≤12 meses.

## Pruebas

Unit/componente (vitest + testing-library + MSW), espejo de compras:
- `calc/mapeo.ts` (cuadre ±0.01, productos vs gastos).
- `schemas.ts` (ramas por acción, cuadre, rango de meses).
- `mappers.ts` (form→DTO de mapeo; parseo de `jsonDte` a líneas).
- `estado.ts`.
- Páginas: listado (filtros/paginación/stats), detalle (parseo + acciones por
  estado), `MapearDtePage` (clasificar, cuadre, submit), config Gmail (conectado/
  desconectado), modales carga JSON y leer-correo (polling con handler MSW que
  progresa el job).
- `dtes-recibidos-handlers.ts` añadido a `handlers.ts`.
- GATE por tarea: `npm run build` + `vitest` + `lint` en 0 (vitest no ve errores de tsc).

E2E contra Docker (lo corre el controlador, no subagentes):
- Validable: cargar-json (subir CCF de prueba → PENDIENTE) → detalle →
  mapear-y-crear-compra (clasificar, cuadrar, crear) → verificar compra BORRADOR y
  DTE VINCULADO, stock al confirmar la compra → descartar otro DTE.
- Diferido (sin credenciales): flujo Gmail completo.
- Semilla: CCF de prueba en el working dir `test-dtes`; sembrar
  proveedor/categoría/producto si el esquema lo exige (como en S5).

## Lecciones aplicables (de S1–S5)
- Emitir contra el backend vivo con la forma EXACTA del frontend; el e2e destapa
  gaps de contrato (fechas en UTC ISO `...T00:00:00Z`, no `yyyy-MM-dd`).
- `npm run build` tras cada tarea (vitest no ve errores de tsc).
- ESLint prohíbe `react-hooks/set-state-in-effect`: usar split loader / inner-form
  con `key` y `refetchInterval` de React Query, no `useEffect`+setState para
  precargar formularios ni para el polling.
- Verificar stock real en BD: `docker exec frafactu-db psql -U frafactu -d frafactu`
  (tablas snake_case `stock_bodegas`/`movimientos_inventario`, columnas PascalCase).
- Rutas del backend SIN kebab-case.

## Archivos
Nuevos: feature `dtes-recibidos/` (api, types, schemas, hooks, mappers, estado,
calc/mapeo, ~8 componentes incl. tabla de mapeo + sub-form producto nuevo + modales,
5 páginas), MSW handlers. Modificados: `router.tsx`, `nav-config.ts`, posible
`Icon.tsx`. Reusa `productosApi`/`bodegasApi`/`sucursalesApi`/`tiposgasto`.
