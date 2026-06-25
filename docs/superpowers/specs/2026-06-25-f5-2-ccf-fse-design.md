# F5.2 — Emisión de CCF (03) y FSE (14)

**Fecha:** 2026-06-25
**Fase:** F5.2 (segunda rebanada vertical de F5, Opción A — por tipo de DTE)
**Repo:** `FraFactu-Frontend`
**Rama:** `feat/f5-2-ccf-fse` (desde `development`)
**Precede:** F5.1 (Factura 01) completa y mergeada (PR #5). **Sigue:** F5.3 (NC 05 + ND 06).

---

## 1. Objetivo

Añadir la emisión de dos nuevos tipos de DTE reutilizando y **generalizando** el módulo de
facturación, hoy acoplado a Factura 01:

- **CCF (03)** — Comprobante de Crédito Fiscal: cálculo de **IVA neto** (precio sin IVA, se
  agrega 13%), **receptor contribuyente obligatorio** (NIT/NRC/actividad/dirección).
- **FSE (14)** — Factura de Sujeto Excluido: el emisor **compra** a un sujeto excluido; **sin
  IVA** + **retenciones** (renta 10% si subtotal > $100; IVA 1% si el emisor es agente de
  retención). No descuenta stock.

El trabajo transversal es extraer todo lo específico de cada tipo a un **registro de
estrategias por tipo de DTE**, de modo que `calc`, `mappers`, `schemas`, componentes y routing
despachen por tipo. CCF y FSE pasan a ser "rellenar una estrategia + su política de receptor".

Además se introduce un patrón reutilizable de **quick-create** en los selectores (buscar
existente o crear inline en un modal), cableado en F5.2 únicamente para **Receptor**.

---

## 2. Contexto verificado (backend real + frontend actual)

### 2.1 Ya genérico en el frontend (reutilizable tal cual)
`types.ts` (el DTO ya admite `03`/`14`, `ReceptorDteDto`, `ResumenDto` con `ivaRete1`/`reteRenta`),
`hooks.ts`, `api.ts`, `catalogos-api.ts`, `CuerpoDocumentoTable`, `CierrePagoSection`,
`AsyncSearchSelect`, `Item/ReceptorPicker`, `AnularInvalidarModal`, `HistorialPage`,
`DteDetallePage`.

### 2.2 Hardcodeado a `01` (puntos de extensión)
`calc/factura01.ts` (IVA-incluido), `mappers.ts` (`precioIncluyeIva:true`, identificación 01),
`schemas.ts` (cajaId obligatorio, cálculo 01), `catalogos.ts`
(`IDENTIFICACION_FACTURA_DEFAULT`), `TotalesPanel`, `VistaPreviaDte`, `DatosGeneralesSection`
(caja siempre visible), `EmitirFacturaPage` (título fijo, sin selector de tipo).

### 2.3 Reglas del backend (verificadas contra validators/servicio)
- **Versión por tipo** (`IdentificacionDtoValidator`, `ObtenerVersionSegunTipoDte`): 01=2,
  **03=4**, **14=2**, 05=4, 06=4.
- **`cajaId`**: obligatorio salvo 05/06 → **01 y 03 lo requieren; 14 NO** (esto corrige el
  supuesto previo de que 03 no necesitaba caja).
- **Receptor obligatorio** si `totalPagar ≥ $1,095` (excepto tipo 14, que siempre lo exige).
- **CCF (03):** `ivaItem = ventaGravada × 0.13` (directo); el servicio descuenta stock; en la
  práctica el receptor es contribuyente con NIT/NRC/actividad/dirección. `reteRenta` el backend
  solo lo admite si todos los ítems son servicios → **lo fijamos en 0** (alineado con el Vue de
  referencia: MH solo aplica reteRenta a FSE).
- **FSE (14):** por ítem `compra = (precioUni × cantidad) − descuento`,
  `ventaGravada/exenta/noSuj = 0`, `ivaItem = 0`. El servicio remapea: `TotalGravado =
  TotalCompras`, todo lo demás 0. **No descuenta stock.** Fecha de emisión: máx. 1 mes atrás.
- **`POST /api/facturas/guardar-pendiente`** sigue siendo el endpoint de emisión PENDIENTE
  (estado `PENDIENTE_ENVIO`); `numeroControl`/`codigoGeneracion` placeholders; el servicio los
  regenera.

### 2.4 Creación de Receptor (backend)
- **`POST /api/receptores`** (auth: `EmisorAdmin`/`GerenteSucursal`/`Cajero`; `EmisorId` sale del
  JWT). `CreateReceptorDto` solo exige `NombreRazonSocial` (3–200) → **la completitud fiscal para
  CCF/FSE la valida el frontend por tipo**. Unicidad por documento/NRC dentro del emisor.
- **`CatTipoDocumentoId`** se envía como **Id de catálogo** (no el código MH); el validador del
  backend usa Ids. Se resuelve leyendo el catálogo vivo, igual que `uniMedida` en F5.1.
- Catálogos disponibles: `GET /api/catalogos/actividades-economicas` (jerárquico:
  `Id/Codigo/Valor/EsSeleccionable/PadreId`; seleccionables solo `EsSeleccionable=true`),
  `departamentos`/`municipios`/`distritos` (cascada por `CodigoDepartamento` y
  `CodigoMunicipio`), `tipos-documento-identificacion-receptor` (plano).

---

## 3. Arquitectura — registro de estrategias por tipo de DTE

Nuevo directorio `src/features/facturacion/dte/`:

```
dte/
  strategy.ts     # interface DteStrategy + tipos compartidos
  registry.ts     # dteRegistry: Record<TipoDte, DteStrategy>; getStrategy(tipo)
  factura01.ts    # estrategia '01' (recibe la lógica actual de calc/factura01.ts)
  ccf03.ts        # estrategia '03' (CCF, IVA neto)
  fse14.ts        # estrategia '14' (FSE, retenciones)
```

```ts
interface DteStrategy {
  tipoDte: TipoDte;
  version: number;                 // 01:2, 03:4, 14:2
  etiqueta: string;                // 'Comprobante de Crédito Fiscal'
  etiquetaCorta: string;           // 'CCF'
  precioIncluyeIva: boolean;       // 01:true, 03/14:false
  requiereCaja: boolean;           // 01/03:true, 14:false
  descuentaStock: boolean;         // 01/03:true, 14:false (informativo en UI)
  receptorPolicy: 'opcional' | 'contribuyente' | 'sujetoExcluido';
  usaAgenteRetencion: boolean;     // solo 14
  buildIdentificacion(ahora): IdentificacionDto;        // version + tipoDte + placeholders
  calcItem(input: ItemInput): ItemCalculado;            // IVA inverso / directo / compra
  calcResumen(items: ItemCalculado[], opts: ResumenOpts): ResumenNumerico; // incl. retenciones
  buildItemDto(input, calc): ItemDocumentoDto;          // remapeo FSE (compra) vs gravada
  buildResumenDto(resumen, pagos, condicion): ResumenDto;
}
```

- `calc/` se conserva para utilidades puras transversales (`round`, `numero-letras`). La lógica
  de cálculo por tipo se traslada a las estrategias; la de 01 se **mueve tal cual** con sus tests
  para garantizar paridad.
- `mappers.ts`, `schemas.ts` y los componentes leen `getStrategy(tipoDte)` en vez de hardcodear 01.
- `catalogos.ts`: `IDENTIFICACION_FACTURA_DEFAULT` → `strategy.buildIdentificacion()`.

**Regla de oro:** la fase de generalización (3.x → F5.2a) **no cambia el comportamiento de 01**;
se valida con los tests existentes de F5.1 en verde antes de tocar CCF/FSE.

### 3.1 Fórmulas de cálculo (verificadas contra el backend)

**01 (Factura) — IVA incluido (sin cambios, solo se mueve):**
- `ivaItem = round((ventaGravada / 1.13) × 0.13)`; `totalPagar = subTotal`.

**03 (CCF) — IVA neto:**
- Ítem: `ventaGravada = round(precioUni × cantidad − descuento)`;
  `ivaItem = round(ventaGravada × 0.13)`.
- Resumen: `totalGravada = Σ ventaGravada`; `totalIva = Σ ivaItem`;
  `subTotal = totalGravada − totalDescu`; `montoTotalOperacion = subTotal + totalIva`;
  `reteRenta = 0`; `ivaPerci1 = 0`; `totalPagar = montoTotalOperacion`.

**14 (FSE) — sin IVA + retenciones:**
- Ítem: `compra = round(precioUni × cantidad − descuento)`;
  `ventaGravada/exenta/noSuj = 0`, `ivaItem = 0`.
- Resumen: `totalCompras = Σ (compra + descuento)`; `descu = Σ descuentos`;
  `subTotal = totalCompras − descu`;
  `reteRenta = subTotal > 100 ? round(subTotal × 0.10) : 0`;
  `ivaRete1 = esAgenteRetencion ? round(subTotal × 0.01) : 0`;
  `totalPagar = subTotal − ivaRete1 − reteRenta`.

Redondeo a 2 decimales (`round` existente) en todos los totales.

---

## 4. Routing y navegación

- Nav "Facturación" → "Emitir DTE" abre **landing** en `/facturacion/emitir` con tarjetas
  (Factura 01 · CCF 03 · FSE 14) que navegan a `/facturacion/emitir/:tipo`.
- `EmitirFacturaPage` → `EmitirDtePage`, parametrizada: lee `:tipo`, valida que sea 01/03/14
  (inválido → redirige a la landing) y configura form/calc/schema/preview vía `getStrategy(tipo)`.
  Título, badge y etiquetas salen de la estrategia.
- `Historial` y `DteDetalle` sin cambios.

---

## 5. Quick-create de Receptor (patrón reutilizable)

- **Pieza genérica** `QuickCreateSelect` (envuelve `AsyncSearchSelect`): busca existentes y añade
  acción **"+ Crear nuevo"** que abre un `Modal`; al guardar con éxito invalida la búsqueda,
  **auto-selecciona** la entidad creada y la muestra en el form sin perder estado. API agnóstica
  (`searchFn`, `renderCreateModal`, `getOptionLabel/Value`) para reutilizarla luego en
  productos/sucursales (no se cablean en F5.2).
- **`ReceptorFormModal`** + `receptorApi.crear` (`POST /api/receptores`): cascada
  **departamento → municipio → distrito** (filtrando por `CodigoDepartamento`/`CodigoMunicipio`)
  y **actividad económica** (catálogo jerárquico, solo `EsSeleccionable=true`). Hooks nuevos:
  `useActividadesEconomicas`, `useTiposDocumentoReceptor`, `useCrearReceptor` (mutation que
  invalida la búsqueda de receptores).
- **Completitud fiscal por tipo (validada en el frontend):**
  - CCF: NIT (tipoDoc 36) + NRC, actividad económica, dirección (depto/municipio/complemento).
  - FSE: documento DUI/Pasaporte/Carné/Otro (**no NIT**), nombre, actividad económica, dirección.
  - 01: sigue "Consumidor Final" (sin cambios).
- `CatTipoDocumentoId` se envía como **Id de catálogo** (resuelto del catálogo vivo).

---

## 6. Schema/validación por tipo

`buildFacturaSchema(strategy)` (o `superRefine` que recibe la estrategia):
- `cajaId` requerido solo si `strategy.requiereCaja`.
- Receptor obligatorio si `receptorPolicy !== 'opcional'` (CCF/FSE no permiten "Consumidor Final").
- Cuadre de pagos usa `strategy.calcResumen` (no el cálculo de 01 hardcodeado).
- Ítems Bien siguen exigiendo bodega (sin cambios).
- FSE: validar fecha de emisión ≥ hoy − 1 mes (alineado al backend).

---

## 7. Componentes a tocar

- `TotalesPanel`: recibe `strategy`; usa `strategy.calcResumen`; filas según tipo (CCF: gravada +
  IVA neto; FSE: total compras − retenciones).
- `VistaPreviaDte`: título/badge/filas dinámicos por tipo (hoy fija "Factura 01" e "IVA 13%").
- `DatosGeneralesSection`: caja condicional (`strategy.requiereCaja`); receptor vía
  `QuickCreateSelect`; en FSE el switch **"Somos agente de retención IVA"** y la sección rotulada
  "Sujeto Excluido (proveedor)".
- `CuerpoDocumentoTable`, `CierrePagoSection`, pickers, `AnularInvalidarModal`: reutilizados.

---

## 8. Testing y e2e

- **TDD (antes de UI):** estrategias `ccf03` (IVA neto, redondeos) y `fse14` (retenciones,
  umbral $100, agente sí/no, remapeo `compra`/`totalCompras`); `mappers` por tipo (version 4/2,
  `receptor` vs `receptorId`, FSE sin caja); `schemas` por tipo (CCF/FSE rechazan "Consumidor
  Final"; FSE válido sin caja). **Paridad 01:** los tests de F5.1 deben seguir verdes tras mover
  la lógica de 01 a la estrategia.
- **MSW:** handlers para `POST /api/receptores`, `actividades-economicas`,
  `tipos-documento-identificacion-receptor`, municipios/distritos. Integración de
  `ReceptorFormModal` y del flujo quick-create (crear → auto-seleccionar).
- **e2e contra Docker** (reusando el emisor de pruebas sembrado): emitir CCF 03 (HTTP 201
  `PENDIENTE_ENVIO`) y FSE 14 (HTTP 201). El receptor fiscal se crea con el propio quick-create
  o se siembra; se documenta en `docs/operaciones/semilla-emisor-pruebas.md`.
- **Cierre:** `npm run build` + `npm run test` + `npm run lint` verdes.

---

## 9. Secuencia de entrega (sub-fases) y git

Rama `feat/f5-2-ccf-fse` desde `development`. Commits locales por tarea; push solo cuando el
usuario lo autorice (preguntando rama). PR por web (correlativo siguiente).

1. **F5.2a — Generalización a multi-DTE.** Registro de estrategias; mover 01; parametrizar
   `mappers`/`schemas`/componentes/routing (landing + `:tipo`). *Criterio:* 01 idéntico, todos
   los tests de F5.1 verdes.
2. **F5.2b — CCF (03) end-to-end.** Estrategia `ccf03`, política receptor contribuyente,
   quick-create de Receptor, preview CCF. *Criterio:* emite CCF 201 e2e.
3. **F5.2c — FSE (14) end-to-end.** Estrategia `fse14` (retenciones), sujeto excluido + switch
   agente, preview FSE. *Criterio:* emite FSE 201 e2e.

Memoria de proyecto actualizada al cierre.

---

## 10. Fuera de alcance (YAGNI, diferido)

- CCF: venta a cuenta de terceros (`VentaTercero`), otros documentos (`OtrosDocumentos`), IVA
  percibido Art.163, retención por servicios.
- Quick-create de productos/servicios, sucursales, cajas/bodegas (el patrón queda listo; se
  cablea en su fase — F6/F7).
- CRUD completo de receptores (F7).
- NC (05) y ND (06) → F5.3. Transmisión real a MH e invalidación → F5.4.

---

## 11. Criterios de aceptación

1. El módulo emite **01, 03 y 14** seleccionando el tipo desde la landing; cada uno con su
   cálculo, receptor y validación correctos.
2. **Paridad 01:** comportamiento y tests de F5.1 sin regresión.
3. CCF emite e2e contra Docker (201 `PENDIENTE_ENVIO`) con receptor contribuyente.
4. FSE emite e2e contra Docker (201) con sujeto excluido y retenciones correctas.
5. Quick-create de Receptor funciona: crear desde el form → auto-seleccionado, sin perder estado.
6. `build` + `test` + `lint` verdes.
