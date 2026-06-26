# F5.4 — S5: Compras externas + Proveedores (frontend)

**Fecha:** 2026-06-26
**Rama:** `feat/f5-4-compras` (desde `development`)
**Fase:** F5.4 (Gestión avanzada de facturación), **primera rebanada (S5)**.

## Contexto y decisión de descomposición

F5.4 agrupa varios subsistemas relativamente independientes. El mapeo del backend de FraFactu confirmó que **los seis subsistemas ya están implementados en el backend** (95–100%): transmisión real a MH, lotes, DTEs recibidos, compras externas, cuentas por cobrar e invalidación real. Por tanto F5.4 es esencialmente **trabajo de frontend**: cablear UI a endpoints existentes.

Descomposición acordada de F5.4 en sub-rebanadas de frontend:

| Slice | Subsistema | Depende de credenciales MH | Estado |
|---|---|---|---|
| **S5** | **Compras externas + proveedores** | No | **Esta rebanada** |
| S4 | DTEs recibidos | No (carga manual/Gmail) | Posterior |
| S6 | Cuentas por cobrar | No (emite PENDIENTE) | Posterior |
| S1 | Transmisión real individual a MH | **Sí** | Bloqueada (sin credenciales de Pruebas) |
| S2 | Invalidación real (evento MH) | **Sí** | Bloqueada |
| S3 | Lotes / envío masivo | **Sí** | Bloqueada |

**Por qué S5 primero:** (1) no requiere credenciales/certificado de Hacienda (decisión del usuario: aún no disponibles); (2) es prerequisito de S4, cuya acción estrella `mapear-y-crear-compra` aterriza en una compra externa; (3) afecta inventario real, conectando con F3.

**Decisiones de alcance del usuario (brainstorming 2026-06-26):**
- Incluir **ambos tipos de línea** en la compra: producto (→ inventario) y gasto administrativo (sin inventario).
- **Incluir** la edición de compras CONFIRMADAS (`editar-confirmada`, reajusta inventario).
- **Diferir** las vistas de reportes (totales de compras por período, gastos por tipo/centro de costo). S5 = CRUD transaccional.

## Objetivo

Entregar, en el frontend React de FraFactu, el CRUD completo de **proveedores** y **compras externas** (alta/edición de BORRADOR, confirmar→afecta stock, anular→revierte, editar-confirmada→reajusta stock, listados y detalle), validado end-to-end contra el backend real en Docker.

## Contrato del backend (verificado contra FraFactu-Backend)

Rutas **sin kebab-case**. Autorización `[Authorize(Roles=...)]` (EmisorAdmin, GerenteSucursal, Contador para escritura; +Auditor para lectura). `EmisorId` se extrae del JWT (no es input).

### Proveedores — `ProveedoresController`
- `POST /api/proveedores` — `CrearProveedorDto` → `ProveedorDto`
- `PUT /api/proveedores/{id}` — `ActualizarProveedorDto` → `ProveedorDto`
- `GET /api/proveedores/{id}` → `ProveedorDto`
- `GET /api/proveedores/nit/{nit}` → `ProveedorDto`
- `GET /api/proveedores?pagina=1&tamanoPagina=20&filtro=&soloActivos=true` → paginado
- `PATCH /api/proveedores/{id}/estado?activo={bool}` → 204
- `DELETE /api/proveedores/{id}` → 204

**CrearProveedorDto:** `NIT` (req, regex `^[0-9]{14}$`, 14 dígitos), `Nombre` (req, max 300), `NombreComercial?` (max 300), `Direccion?` (max 500), `Telefono?` (max 50), `Email?` (max 200, email válido), `Contacto?` (max 200), `SitioWeb?` (max 300), `Notas?` (max 1000).
**ActualizarProveedorDto:** igual + `Activo` (bool, default true).
**ProveedorDto (respuesta):** `Id, NIT, TipoDocumentoNombre(="NIT"), Nombre, NombreComercial?, Direccion?, Telefono?, Email?, Contacto?, SitioWeb?, Notas?, Activo, TotalCompras, MontoTotalCompras, UltimaCompra?, FechaCreacion`.

### Compras externas — `ComprasExternasController`
- `POST /api/comprasexternas` — `CrearCompraExternaDto` → `CompraExternaDto` (crea BORRADOR)
- `PUT /api/comprasexternas/{id}` — `ActualizarCompraExternaDto` (solo BORRADOR)
- `POST /api/comprasexternas/{id}/confirmar` — `ConfirmarCompraDto?` → afecta inventario
- `POST /api/comprasexternas/{id}/anular` — `AnularCompraDto` (motivo req) → revierte inventario
- `PUT /api/comprasexternas/{id}/editar-confirmada` — `ActualizarCompraExternaDto` → reajusta inventario
- `GET /api/comprasexternas/{id}` → `CompraExternaDto`
- `GET /api/comprasexternas?pagina&tamanoPagina&proveedorId&bodegaId&sucursalId&estado&fechaDesde&fechaHasta&fechaRegistroDesde&fechaRegistroHasta&search&sortBy&sortDesc` → paginado
- `GET /api/comprasexternas/proveedor/{proveedorId}?limite=10`
- `GET /api/comprasexternas/totales?desde&hasta&proveedorId&sucursalId` *(reporte — diferido)*

**Estados:** `BORRADOR → CONFIRMADA → ANULADA`. Edición de BORRADOR vía `PUT`; edición de CONFIRMADA (origen MANUAL) vía `editar-confirmada`.

**CrearCompraExternaDto / ActualizarCompraExternaDto:**
`ProveedorId` (req, >0), `SucursalId` (req), `NumeroFactura` (req, max 100), `FechaEmision` (req, ≤ ahora UTC), `Subtotal` (req, >0), `IVA` (req, ≥0), `Total` (req, >0, `=Subtotal+IVA` ±0.01), `Observaciones?`, `Detalles: CrearCompraDetalleDto[]`, `Gastos: CrearGastoDto[]`.
Regla global: ≥1 detalle **o** ≥1 gasto; máx 1000 detalles; `Σ(detalles.Total)+Σ(gastos.Monto) ≈ Total` (±0.01).

**CrearCompraDetalleDto:** `ProductoId` (req, >0), `BodegaId` (req si `EsParaInventario=true`, >0), `Cantidad` (req, >0), `CostoUnitario` (req, >0), `Subtotal` (req, ≥0, `≈ Cantidad×CostoUnitario` ±0.01), `IVA` (req, ≥0), `Total` (req, >0, `=Subtotal+IVA`), `EsParaInventario` (bool, default true).

**CrearGastoDto:** `CatTipoGastoId?` (int), `Descripcion` (req, max 500), `Monto` (req, >0), `CentroCosto?` (max 100), `CuentaContable?` (max 50).

**CompraExternaDto (respuesta):** `Id, ProveedorId, ProveedorNIT, ProveedorNombre, SucursalId, SucursalNombre, NumeroFactura, FechaEmision, FechaRegistro, Subtotal, IVA, Total, Estado, FechaConfirmacion?, FechaAnulacion?, Observaciones?, Origen(MANUAL|DTE), CodigoGeneracionDte?, SelloRecibidoDte?, TipoDte?, NumeroControlDte?, Detalles: CompraDetalleDto[], Gastos: GastoAdministrativoDto[], TotalProductosInventario, TotalGastosAdministrativos, CantidadItems`.
**CompraDetalleDto:** `Id, CompraExternaId, ProductoId, ProductoCodigo, ProductoNombre, BodegaId, BodegaNombre, Cantidad, CostoUnitario, Subtotal, IVA, Total, EsParaInventario`.
**GastoAdministrativoDto:** `Id, CompraExternaId, CatTipoGastoId?, TipoGastoNombre?, Descripcion, Monto, CentroCosto?, CuentaContable?, FechaCreacion`.

### Catálogos para el formulario (endpoints reales de FraFactu)
- Productos: `GET /api/productosservicios/search?searchTerm=&sucursalId=` → `ProductoServicioListDto[]` *(ya consumido en facturacion como `productosApi.search`)*. Campos relevantes: `Id, Codigo, Nombre, EsServicio, AplicaIVA, PorcentajeIVA, PrecioCosto, CatUnidadMedidaId/UnidadMedidaNombre`.
- Bodegas: `GET /api/bodegas/sucursal/{sucursalId}?soloActivas=true` *(ya consumido como `bodegasApi.porSucursal`)*.
- Sucursales: `GET /api/sucursales/todas-activas` *(ya consumido como `sucursalesApi.todasActivas`)*.
- Tipos de gasto: `GET /api/tiposgasto?page=1&pageSize=20&soloActivos=true` → `PaginatedResponse<TipoGastoDto>` (`Id, Codigo, Nombre, Descripcion?, Activo`). **Nuevo cliente.**

## Arquitectura del frontend

Nueva feature `src/features/compras/`, espejo de `src/features/facturacion/`:

```
src/features/compras/
├── api.ts                 # comprasApi: listar, getById, crear, actualizar, confirmar, anular, editarConfirmada
├── proveedores-api.ts     # proveedoresApi: listar, getById, search, crear, actualizar, cambiarEstado, eliminar
├── catalogos-api.ts       # tiposGastoApi.listar; re-export de productos/bodegas/sucursales de facturacion
├── hooks.ts               # TanStack Query: useProveedores/useCrearProveedor/...; useCompras/useCompra/useCrearCompra/...
├── types.ts               # ProveedorDto, CompraExternaDto, Crear/Actualizar*, PaginatedResponse<T> (reuso del tipo existente)
├── schemas.ts             # zod: proveedorSchema, compraSchema (superRefine: cuadre de totales y ≥1 línea)
├── calc/
│   ├── compra.ts          # calculo de línea producto y totales del header (puro)
│   ├── compra.test.ts
│   └── index.ts
├── components/
│   ├── ProveedorFormModal.tsx     # crear/editar proveedor (molde ReceptorFormModal)
│   ├── ProveedorPicker.tsx        # QuickCreateSelect de proveedor
│   ├── CompraLineasTable.tsx      # tabs Productos / Gastos
│   ├── CompraLineaProductoRow / CompraLineaGastoRow
│   ├── CompraTotalesPanel.tsx     # totales en vivo (molde TotalesPanel)
│   ├── ConfirmarCompraModal.tsx / AnularCompraModal.tsx
│   └── *.test.tsx
└── pages/
    ├── ProveedoresPage.tsx
    ├── ComprasListPage.tsx
    ├── CompraFormPage.tsx          # alta + edición (BORRADOR y editar-confirmada)
    ├── CompraDetallePage.tsx
    └── *.test.tsx
```

**Reuso:** `productosApi.search`, `bodegasApi.porSucursal`, `sucursalesApi.todasActivas` se importan de `facturacion` (no se duplican). `Table`, `AsyncSearchSelect`, `QuickCreateSelect`, design-system (`Button/Modal/FormField/Input/Combobox/Badge/Toast`) se reusan tal cual.

## S5a — Proveedores

- **ProveedoresPage**: `Table` con paginación de servidor (`proveedoresApi.listar({pagina,tamanoPagina,filtro,soloActivos})`). Búsqueda por `filtro` (debounce), toggle "solo activos". Columnas: NIT, Nombre, Nombre comercial, Contacto, Total compras, Estado (`Badge`). Acciones por fila: Editar, Activar/Desactivar.
- **ProveedorFormModal** (RHF + zod, molde `ReceptorFormModal`): NIT (`^\d{14}$`), Nombre*, Nombre comercial, Dirección, Teléfono, Email (válido), Contacto, Sitio web, Notas. Modo crear (`POST`) / editar (`PUT`).
- Activar/desactivar: `PATCH /estado`. DELETE detrás de confirmación explícita (rara; un proveedor con compras no debería borrarse — se desactiva). Si el backend rechaza DELETE con compras, se muestra el error.
- **ProveedorPicker** = `QuickCreateSelect` (busca + "+ Crear proveedor" inline con `ProveedorFormModal`). Lo consume S5b.

## S5b — Compras externas

### Modelo de líneas y cálculo de totales

Dos tipos de línea conviven en el mismo formulario:

**Línea producto** (`Detalles`): producto (`AsyncSearchSelect` sobre `productosApi.search`), bodega (selector por sucursal de la compra), cantidad, costo unitario, IVA.
- `Subtotal = round(Cantidad × CostoUnitario, 2)`
- `IVA = AplicaIVA ? round(Subtotal × 0.13, 2) : 0` — **editable** (default 13%; respeta `AplicaIVA` del producto)
- `Total = Subtotal + IVA`
- `EsParaInventario = true` ⇒ `BodegaId` obligatoria. (Un producto marcado `EsServicio` puede ir con `EsParaInventario=false` y sin bodega; default según el producto.)

**Línea gasto** (`Gastos`): Descripción*, Monto*, Tipo de gasto (catálogo `tiposgasto`, opcional), Centro de costo, Cuenta contable. Sin IVA ni inventario.

**Totales del header (computados, solo lectura):**
- `Subtotal = Σ(detalle.Subtotal) + Σ(gasto.Monto)`
- `IVA = Σ(detalle.IVA)`
- `Total = Subtotal + IVA`

Esto satisface simultáneamente las dos validaciones del backend: `Total = Subtotal + IVA` **y** `Σ(detalles.Total) + Σ(gastos.Monto) ≈ Total`. (Comprobación: `Σdet.Total + Σgasto.Monto = Σ(det.Sub+det.IVA) + Σgasto.Monto = (Σdet.Sub+Σgasto.Monto) + Σdet.IVA = Subtotal + IVA = Total`.)

**Regla de negocio:** al menos una línea (producto **o** gasto); el botón Guardar se deshabilita si no hay ninguna. `superRefine` en zod replica las validaciones (cuadre ±0.01, ≥1 línea, bodega req para producto de inventario).

### Páginas y flujo

- **ComprasListPage**: `Table` server (`comprasApi.listar` con filtros proveedor/estado/fechas/search). Columnas: Nº factura, Proveedor, Fecha emisión, Total, Estado (`Badge`). Botón "Nueva compra". Fila → detalle.
- **CompraFormPage** (alta y edición): header (ProveedorPicker, Sucursal, Nº factura del proveedor, Fecha emisión, Observaciones) + `CompraLineasTable` (tabs Productos / Gastos) + `CompraTotalesPanel` (en vivo). Guardar:
  - Nuevo → `POST` (queda BORRADOR).
  - Edición de BORRADOR → `PUT /{id}`.
  - Edición de CONFIRMADA → `PUT /{id}/editar-confirmada` (banner de advertencia: "reajusta inventario").
- **CompraDetallePage**: resumen + tabla de líneas (productos y gastos) + metadatos (estado, fechas, origen). Acciones por estado:
  - `BORRADOR` → **Editar**, **Confirmar** (`ConfirmarCompraModal`, observaciones opcionales), **Anular** (`AnularCompraModal`, motivo obligatorio).
  - `CONFIRMADA` → **Editar confirmada**, **Anular**.
  - `ANULADA` → solo lectura.

## Routing y navegación

Rutas nuevas bajo `AppLayout` (en `src/app/router.tsx`):
- `/compras` → ComprasListPage
- `/compras/nueva` → CompraFormPage (alta)
- `/compras/:id` → CompraDetallePage
- `/compras/:id/editar` → CompraFormPage (edición)
- `/proveedores` → ProveedoresPage

Nueva sección de nav "Compras" en `src/app/nav-config.ts` con items **Compras** y **Proveedores** (iconos del sprite existente; p.ej. carrito y building).

## Testing y verificación

- **Unit (`calc/compra.ts`)**: cálculo de línea producto (subtotal/IVA 13%/IVA 0 si no aplica/total), totales del header, cuadre, redondeo a 2 decimales y tolerancia 0.01.
- **Component / página** (Vitest + RTL + MSW): `ProveedorFormModal` (validación NIT 14 dígitos, email, requeridos), `ProveedoresPage` (lista + toggle activos), `CompraLineasTable` (agregar/quitar líneas, recálculo), `CompraFormPage` (cuadre, ≥1 línea, guardar BORRADOR), `CompraDetallePage` (acciones por estado). Handlers nuevos en `src/test/msw/compras-handlers.ts`.
- **GATE por tarea:** `npm test`, `npm run lint`, **`npm run build`** (lección F5.2: Vitest no detecta errores de `tsc`/excess-property; correr build tras cada estrategia/test).
- **E2E contra Docker** (lo ejecuta el controlador, no subagentes): backend `:8080`, frontend `:5173`, Postgres `:5432`. Flujo:
  1. Crear proveedor (NIT 14 dígitos) → 201.
  2. Crear compra BORRADOR con 1 línea producto (bodega) + 1 línea gasto → 201, estado BORRADOR, cuadre OK.
  3. Confirmar → 200/201; verificar en BD/endpoint que el **stock de la bodega aumentó** por la cantidad del detalle.
  4. Editar-confirmada (cambiar cantidad) → verificar reajuste de stock.
  5. Anular (motivo) → verificar reversión de stock.
  - Semilla e2e existente: `admin@pruebas.local`/`Pruebas#2026`, emisorId3/sucursal2/bodega1, producto P001 (uni cod59=Id39). Crear proveedor de prueba en el flujo.
- Como en F5.1b/F5.2/F5.3, el e2e real puede destapar **gaps de contrato** (forma exacta del payload) → emitir con la forma exacta del frontend y ajustar.

## Criterios de aceptación

1. CRUD de proveedores funcional (crear/editar/listar paginado/buscar/activar-desactivar) con validación NIT `^\d{14}$` y email.
2. Alta y edición de compras BORRADOR con líneas de producto (con bodega) y de gasto, totales computados que cuadran con el backend (±0.01).
3. Confirmar afecta stock; anular lo revierte; editar-confirmada lo reajusta — verificado e2e contra Docker.
4. Listado y detalle de compras con acciones correctas por estado (BORRADOR/CONFIRMADA/ANULADA).
5. Rutas y nav "Compras"/"Proveedores" cableadas; ProveedorPicker reutilizable.
6. GATE verde: tests + lint + build; e2e 201 validado.

## Fuera de alcance (S5)

- Reportes de compras/gastos (totales por período, por tipo, por centro de costo) → rebanada de reportes posterior.
- DTEs recibidos y su `mapear-y-crear-compra` → S4 (consumirá esta feature).
- Cualquier flujo que requiera credenciales/certificado MH (S1/S2/S3).
- CRUD de tipos de gasto (se consume el catálogo existente; su gestión es otra fase).

## Riesgos / watch-items para el e2e

- **W1 — IVA por línea:** el backend valida `Total=Subtotal+IVA` y `Subtotal≈Cantidad×CostoUnitario`, pero **no** fuerza IVA=13%. Confirmar que acepta IVA editable (incl. 0 para no-afecto). Bajo riesgo.
- **W2 — Mapeo gasto→subtotal del header:** confirmar que el backend acepta `Subtotal` del header incluyendo el `Monto` de gastos sin IVA asociado (nuestra fórmula). Si exige otro reparto, ajustar.
- **W3 — `EsParaInventario` / bodega:** confirmar que un detalle con `EsParaInventario=false` se acepta sin `BodegaId`, y que el descuento/incremento de stock solo ocurre para `EsParaInventario=true`.
- **W4 — `editar-confirmada`:** confirmar que solo aplica a compras de `Origen=MANUAL` y cómo reajusta stock (delta vs revertir+reaplicar).
- **W5 — DELETE proveedor con compras:** comportamiento del backend (¿409/error?) → la UI debe degradar a desactivar.
