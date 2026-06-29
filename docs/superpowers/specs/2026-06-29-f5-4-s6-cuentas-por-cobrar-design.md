# F5.4 S6 — Cuentas por cobrar (frontend)

**Fecha:** 2026-06-29
**Rama:** `feat/f5-4-s6-cuentas-por-cobrar` (desde `development`)
**Alcance:** Completo — gestión + cobro + crear venta a crédito + refinanciar + configuración de mora + reportes.

## Contexto

El backend de cuentas por cobrar ya existe (`CuentasPorCobrarController`, base `api/cuentas-por-cobrar`, `[Authorize]`, scoped por `EmisorId` del token). S6 es casi solo frontend: construir las pantallas que consumen ese contrato, siguiendo el patrón de los features `compras` (S5) y `dtes-recibidos` (S4).

### Contrato del backend (confirmado)

| Método | Ruta | Roles | Cuerpo / Query | Respuesta |
|---|---|---|---|---|
| POST | `/` | EmisorAdmin, GerenteSucursal, Cajero | `CrearVentaCreditoDto` | `PlanCuotasDto` (201) |
| GET | `/?soloConSaldo=true` | autenticado | — | `PlanCuotasDto[]` |
| GET | `/{planId}` | autenticado | — | `PlanCuotasDto` / 404 |
| POST | `/{planId}/cuotas/{numero}/pagar` | EmisorAdmin, GerenteSucursal, Cajero | `RegistrarPagoCuotaDto` | `PlanCuotasDto` |
| GET | `/{planId}/cuotas/{numero}/mora-estimada` | autenticado | — | `MoraEstimadaDto` |
| GET | `/configuracion-mora` | autenticado | — | `ConfiguracionCuotasDto` |
| PUT | `/configuracion-mora` | EmisorAdmin, GerenteSucursal | `ActualizarConfiguracionCuotasDto` | `ConfiguracionCuotasDto` |
| POST | `/{planId}/refinanciar` | EmisorAdmin, GerenteSucursal | `RefinanciarPlanDto` | `PlanCuotasDto` |
| GET | `/reportes/antiguedad/{excel\|pdf}` | EmisorAdmin, GerenteSucursal, Contador, Auditor | — | archivo |
| GET | `/reportes/estado-cuenta/plan/{planId}/{pdf\|excel}` | EmisorAdmin, GerenteSucursal, Cajero | — | archivo |
| GET | `/reportes/estado-cuenta/cliente/{receptorId}/{pdf\|excel}` | EmisorAdmin, GerenteSucursal, Cajero | — | archivo |

**DTOs (formas exactas):**

- `CrearVentaCreditoDto`: `{ Venta: CreateFacturaElectronicaDto, Cuotas: DefinicionCuotaDto[] (≥2), Observaciones? }`. La condición de operación (2 = crédito, 3 = mixto) va dentro de `Venta.Resumen.CondicionOperacion`. El backend emite la cuota 1.
- `DefinicionCuotaDto`: `{ Numero, Monto? | Porcentaje?, FechaPactada }` — se usa **Monto O Porcentaje**, no ambos.
- `PlanCuotasDto`: `{ Id, ReceptorId?, ReceptorNombre?, CondicionOperacion, MontoTotal, MontoPagado, SaldoAdeudado, EstadoCobro, Cuotas: CuotaDto[] }`.
- `CuotaDto`: `{ Numero, Monto, FechaPactada, Estado, FechaPago?, FacturaId?, CodigoGeneracion?, EsCuotaFinal, InteresMora }`.
- `RegistrarPagoCuotaDto`: `{ CatFormaPagoId, Referencia? }`.
- `MoraEstimadaDto`: `{ Numero, Monto, FechaPactada, DiasAtraso, InteresMora, MoraHabilitada }`.
- `ConfiguracionCuotasDto` / `ActualizarConfiguracionCuotasDto`: `{ TasaMoraMensual, DiasGracia, MoraHabilitada, RecordatoriosHabilitados, DiasAntesRecordatorio }`.
- `RefinanciarPlanDto`: `{ Motivo, NuevasCuotas: DefinicionCuotaDto[] }` (deben sumar el saldo).
- Aging: `AgingReporteDto { FechaCorte, Clientes[{ ReceptorId?, ClienteNombre, Planes[], Subtotal }], Totales }`, buckets `PorVencer/D1a30/D31a60/D61a90/Mas90/Total`.

## Decisiones de diseño

1. **Alcance completo** (gestión + cobro + crear venta a crédito + refinanciar + config mora + reportes).
2. **Crear venta a crédito = página nueva que compone.** Una `CrearVentaCreditoPage` dentro del feature `cuentas-por-cobrar` que REUSA los componentes de facturación (`ReceptorPicker`, `CuerpoDocumentoTable`, `TotalesPanel`) + un `CuotasBuilder` nuevo, y postea al endpoint de cuentas-por-cobrar. Facturación queda intacta.
3. **Navegación = sección con sub-rutas.** Entrada "Cuentas por cobrar" en el sidebar con: Planes (índice), Nueva venta a crédito, Configuración de mora. Detalle del plan como ruta hija. Reportes como botones dentro de las páginas.
4. **Gating de rol:** se confía en el 403 del backend (no se ocultan acciones por rol app-wide), consistente con la deuda abierta (a) de compras/facturación/dtes. No se resuelve en S6.

## Arquitectura del feature

```
src/features/cuentas-por-cobrar/
  api.ts            # llamadas axios a todos los endpoints
  types.ts          # tipos TS espejo de los DTOs del backend
  schemas.ts        # zod: cuotas, config-mora, refinanciar, pago
  calc/cuotas.ts    # repartir/validar cuotas (montos|porcentajes), sumar==total
  mappers.ts        # PlanCuotasDto -> viewmodel; form -> CrearVentaCreditoDto
  hooks.ts          # React Query: planes, plan, pagar, mora-estimada, config, refinanciar, crear
  components/
    PlanCuotasTable.tsx        # tabla de cuotas con estado y acciones
    CuotasBuilder.tsx          # constructor de cuotas (crear y refinanciar)
    PagarCuotaModal.tsx        # forma de pago + mora estimada -> POST pagar
    RefinanciarModal.tsx       # motivo + CuotasBuilder sobre el saldo
    EstadoCobroBadge.tsx       # badge de estado de cobro
    ReporteDescargaButtons.tsx # descarga blob Excel/PDF
  pages/
    PlanesListPage.tsx
    PlanDetallePage.tsx
    CrearVentaCreditoPage.tsx
    ConfiguracionMoraPage.tsx
+ src/test/msw/cuentas-por-cobrar-handlers.ts
+ rutas en src/app/router.tsx
+ entrada en src/app/nav-config.ts y src/app/Sidebar.tsx
```

## Páginas y flujo de datos

- **PlanesListPage** (índice `/cuentas-por-cobrar`): tabla de planes con saldo (`GET /?soloConSaldo`), toggle "ver todos" (`soloConSaldo=false`), columnas cliente / monto total / pagado / saldo / estado (badge). Botones de descarga del reporte de antigüedad (Excel/PDF). Fila → detalle. Botón "Nueva venta a crédito".
- **PlanDetallePage** (`/cuentas-por-cobrar/:planId`): cabecera del plan (cliente, total, pagado, saldo, estado) + `PlanCuotasTable`. Acción *Pagar cuota* por fila pendiente → `PagarCuotaModal` (consulta `GET .../mora-estimada` y la muestra, pide `CatFormaPagoId` + referencia opcional, POST `.../pagar`, refresca el plan). Acción *Refinanciar* (si hay saldo) → `RefinanciarModal` (motivo + `CuotasBuilder` sobre el saldo). Botones de estado de cuenta del plan (PDF/Excel). 404 → estado vacío.
- **CrearVentaCreditoPage** (`/cuentas-por-cobrar/nueva`): compone `ReceptorPicker` + `CuerpoDocumentoTable` + `TotalesPanel` de facturación, selector de condición (2 crédito / 3 mixto), `CuotasBuilder` (recibe el total del `TotalesPanel`), observaciones. Arma `CrearVentaCreditoDto` con `mappers.ts` y POSTea. Al éxito navega al detalle del plan creado.
- **ConfiguracionMoraPage** (`/cuentas-por-cobrar/configuracion-mora`): formulario (tasa mora mensual, días de gracia, mora habilitada, recordatorios habilitados, días antes de recordatorio) con `GET` inicial y `PUT` al guardar.

## CuotasBuilder (pieza nueva con lógica)

Componente reutilizable (crear venta y refinanciar). N filas (≥2): número, fecha pactada, y monto **o** porcentaje (modo seleccionable, coherente en todo el plan). Validaciones en `calc/cuotas.ts`:

- mínimo 2 cuotas;
- en modo monto: suma de montos == total con tolerancia de redondeo (±0.01);
- en modo porcentaje: suma de porcentajes == 100;
- fechas pactadas en orden ascendente;
- número de cuota correlativo desde 1.

Recibe el `total` como prop (del `TotalesPanel` al crear; del saldo adeudado al refinanciar). El cálculo se prueba con tests unitarios.

## Errores, testing y reportes

- **Errores:** mismo manejo que S4/S5 — `BadRequest { error }` del backend se muestra en toast/inline; 404 en detalle → estado vacío.
- **Reportes (descarga de archivo):** reusar el patrón de descarga blob ya existente en el repo (responseType blob + crear enlace de descarga con el nombre del header). `ReporteDescargaButtons` encapsula la lógica.
- **Testing:** TDD por componente/hook con MSW; `calc/cuotas.ts` con tests unitarios; `npm run build` tras cada tarea (vitest no ve errores de tsc); e2e final contra Docker: crear venta a crédito → ver plan → pagar cuota → ver saldo actualizado → refinanciar → configurar mora → descargar reportes. Revisión final whole-branch (opus) la hace el controlador, no subagentes.

## Restricciones técnicas (lecciones S1–S5)

- `npm run build` tras cada tarea.
- ESLint prohíbe `react-hooks/set-state-in-effect`: para polling usar `refetchInterval` de React Query, NO `useEffect`+`setState`; usar split loader / inner-form con `key` cuando haga falta inicializar formularios desde datos cargados.
- Imports al tope (`import/first`).
- Rutas del backend SIN kebab-case en los segmentos de recurso ya definidos (respetar las rutas exactas del controller: `cuentas-por-cobrar`, `configuracion-mora`, `mora-estimada` ya vienen con guion del backend — usarlas tal cual).
- El e2e real destapa gaps de contrato → emitir con la forma EXACTA del frontend y ajustar.

## Deudas que NO se abordan en S6

- (a) Gating de rol en el frontend app-wide (se difiere; se confía en el 403 del backend).
- (b) Adapter axios en `cargarJson` (workaround MSW/jsdom FormData).
- (c) Minors triados en el ledger SDD.
- (d) Error de teardown pre-existente en `design-system/Combobox.test.tsx`.
