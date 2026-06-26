# F5.3 — Nota de Crédito (05) y Nota de Débito (06)

**Fecha:** 2026-06-26
**Fase:** F5.3 (tercera rebanada de Facturación, sobre F5.2 ya mergeada)
**Repo:** FraFactu-Frontend · rama `feat/f5-3-nc-nd` desde `development`

## Objetivo
Emitir **Notas de Crédito (DTE 05)** y **Notas de Débito (DTE 06)** que ajustan un **CCF (03)** ya emitido,
referenciándolo como *documento relacionado*. Es el primer flujo con documento relacionado y el primero
que **deriva sus datos de un DTE previo**. Se emite en estado **PENDIENTE** (`guardar-pendiente`), sin
transmisión a MH (igual que F5.1/F5.2; la transmisión real se difiere a F5.4).

## Alcance (decisiones de brainstorming)
- **Documento original soportado:** SOLO **CCF (03)** emitido por nosotros (caso real dominante). No se
  soportan notas sobre Factura 01 ni FSE 14 en esta rebanada.
- **NC (05) — precarga con ajuste parcial:** se precargan los ítems del CCF original (`detalle-para-nc`);
  el usuario puede **quitar líneas y reducir cantidades/montos** (crédito total o parcial). Se muestra el
  **saldo disponible** como guía.
- **ND (06) — referencia + ítems nuevos:** referencia el CCF original (documento relacionado + receptor
  heredado) pero el usuario **teclea los cargos nuevos a mano** (interés, flete, ajuste al alza). Sin
  precarga de ítems.
- **Punto de entrada:** tarjetas **NC** y **ND** en la landing `/facturacion/emitir` (igual que 01/03/14);
  dentro, un buscador del CCF original.

## Contrato del backend (verificado en el código, a confirmar en e2e)
- Endpoints dedicados (controlador `FacturasController`):
  - `GET /api/facturas/buscar-para-nc?searchTerm=…` → `List<BuscarParaNcResultDto>`
  - `GET /api/facturas/buscar-para-nd?searchTerm=…` → `List<BuscarParaNcResultDto>`
  - `GET /api/facturas/{id}/detalle-para-nc` → `DetalleParaNcDto`
  - `GET /api/facturas/{id}/detalle-para-nd` → `DetalleParaNcDto`
- `BuscarParaNcResultDto`: `id, numeroControl, codigoGeneracion, tipoDte, tipoDocumentoNombre,
  fechaEmision, receptorNombre, receptorNumDocumento, montoTotalOperacion, totalPagar, estadoHacienda,
  saldoDisponible, montoAcreditado, nceCount`.
- `DetalleParaNcDto`: cabecera (`id, numeroControl, codigoGeneracion, tipoDte, fechaEmision,
  condicionOperacion`), receptor (`receptorId, receptorNombre, receptorNumDocumento, receptorNit,
  receptorNrc, receptorCorreo, receptorTelefono`), totales (`totalGravada, totalExenta, totalNoSuj,
  subTotal, totalIva, montoTotalOperacion, totalPagar`) y la **lista de ítems del original** (forma exacta
  a fijar en el plan leyendo el DTO completo).
- **Documento relacionado** (`DocumentoRelacionadoDto`): `{ tipoDocumento, tipoGeneracion (1=Propio,
  2=Externo), numeroDocumento, fechaEmision }`. NC/ND exigen **≥1** (máx 50). Para nuestro caso:
  `tipoDocumento:'03'`, `tipoGeneracion:1`, `numeroDocumento:<codigoGeneracion del CCF>`,
  `fechaEmision:<fecha del CCF>`.
- NC (05) y ND (06) son **version 4** (`ObtenerVersionSegunTipoDte`).
- NC/ND **no requieren caja** (el validador omite la regla de caja para 05/06) ni mueven stock.
- Cálculo igual que CCF: **IVA neto** (`base×0.13`) representado como **tributo** (`["20"]` por ítem +
  `resumen.tributos:[{codigo:'20',descripcion:'Impuesto al Valor Agregado 13%',valor:totalIva}]`);
  `montoTotalOperacion = subTotal + Σtributos`. El receptor debe tener **dirección completa con distrito**
  (heredada del CCF original, que ya la tiene por haberse emitido).

## Arquitectura

### Estrategias (registro por tipo de DTE)
- Nuevas: `src/features/facturacion/dte/nc05.ts` y `nd06.ts`, registradas en `registry.ts`
  (→ `TIPOS_EMISIBLES` incluye `'05'` y `'06'` → tarjetas en landing automáticas).
- **Cálculo compartido:** se extrae el cálculo IVA-neto del CCF a `src/features/facturacion/calc/iva-neto.ts`
  (`calcItemIvaNeto`, `calcResumenIvaNeto`); `ccf03.ts`, `nc05.ts` y `nd06.ts` lo consumen. (Refactor de
  `ccf03.ts` a delegar, manteniendo su test verde — paridad 03.)
- Campos nuevos en `DteStrategy`:
  - `requiereDocumentoRelacionado: boolean` (05/06 `true`; resto `false`).
  - `prefillDesdeOriginal: boolean` (05 `true`; 06 `false`; resto `false`).
- Flags de nc05/nd06: `version:4`, `precioIncluyeIva:false`, `requiereCaja:false`,
  `descuentaStock:false`, `receptorPolicy:'contribuyente'`, `usaAgenteRetencion:false`,
  `requiereDocumentoRelacionado:true`. El **receptor se hereda** del original (no se crea ni se busca):
  en 05/06 no se muestra `ReceptorPicker`/`QuickCreateSelect`, solo el receptor (solo lectura) del CCF.

### Capa de datos
- `catalogos-api.ts`/`facturas` API: `buscarParaNc`, `buscarParaNd`, `detalleParaNc`, `detalleParaNd`.
- Tipos en `types.ts`: `BuscarParaNcResultDto`, `DetalleParaNcDto` (+ su lista de ítems),
  `DocumentoRelacionadoDto`; y `documentosRelacionados?: DocumentoRelacionadoDto[]` en `CreateFacturaDto`.
- Hooks RQ: `useBuscarParaNc`/`useBuscarParaNd` (búsqueda con término), y carga de detalle al seleccionar.
- Handlers MSW para todo lo anterior.

### UI
- **`DocumentoOriginalSection`** (nuevo): se renderiza en `EmitirDtePage` cuando
  `strategy.requiereDocumentoRelacionado`. Buscador (AsyncSearchSelect sobre `buscar-para-nc/nd`) que
  muestra nº control, fecha, receptor y **saldo disponible**. Al seleccionar:
  - fija el documento relacionado y el receptor (solo lectura) en el estado del formulario;
  - **NC:** llama `detalle-para-nc` y **precarga los ítems** (mapeados a `FormItem`); permite **quitar
    líneas y reducir cantidades/precios** (crédito total o parcial), pero **no añadir líneas nuevas**
    (una NC acredita lo facturado en el original);
  - **ND:** no precarga; el cuerpo arranca vacío para cargos manuales.
- `EmitirDtePage`: para 05/06 oculta caja (`requiereCaja:false`) y bodega (M2, `descuentaStock:false`),
  muestra `DocumentoOriginalSection` antes del cuerpo, y el receptor en solo lectura.
- `TotalesPanel` y `VistaPreviaDte`: soportan 05/06 (IVA neto, como 03) y muestran el documento relacionado
  (nº/codGen del CCF) en la vista previa.

### Cálculo, mapper y schema
- `mappers.ts` `buildCreateFacturaDto`: incluye `documentosRelacionados` cuando la estrategia lo requiere
  (lo arma desde el original seleccionado, guardado en el estado del formulario).
- `schemas.ts` `buildFacturaSchema`: para 05/06 exige **≥1 documento relacionado** y receptor; ≥1 ítem;
  sin caja. (El flujo de caja/bodega ya está condicionado por estrategia desde F5.2.)
- Cálculo IVA-neto compartido (ver arriba).

## Componentes y límites (diseño para aislamiento)
- `calc/iva-neto.ts` — funciones puras de cálculo; sin dependencias de React/estrategia.
- `dte/nc05.ts`, `dte/nd06.ts` — declaran metadatos + delegan cálculo + arman ítem/resumen/documentos
  relacionados. Testeables en aislamiento.
- `DocumentoOriginalSection` — único punto que conoce los endpoints de buscar/detalle; expone al padre
  `onSeleccion({ documentoRelacionado, receptor, itemsPrecargados })`. El padre (`EmitirDtePage`) no conoce
  los endpoints.
- El estado del formulario gana: `documentoRelacionado: DocumentoRelacionadoDto | null` y el receptor
  heredado (ya existe `receptorId`/`receptor`).

## Fuera de alcance (difiere a F5.4)
- Transmisión real a MH (se emite PENDIENTE vía `guardar-pendiente`; sin certificado/credenciales).
- Enforcement duro del saldo en el frontend (se muestra como guía; lo valida el backend).
- NC/ND sobre Factura 01 o FSE 14.
- Invalidación/anulación de NC/ND (la anulación general ya existe en el Historial).
- Lista/Historial nuevos: NC/ND aparecen en el Historial existente (verificar que rendericen bien).

## Estrategia de pruebas
- **Unit (vitest):** cálculo IVA-neto compartido (paridad con CCF); estrategias nc05/nd06 (metadatos,
  buildItemDto con tributos, buildResumenDto con tributos + montoTotalOperacion, documentosRelacionados);
  mapper 05/06 end-to-end del DTO; schema 05/06 (rechaza sin documento relacionado / sin receptor; acepta
  válido). `DocumentoOriginalSection` (búsqueda, selección, precarga NC vs vacío ND) con MSW.
- **GATE por sub-fase:** `npm run build` (tsc) + `npm run test` + `npm run lint`.
- **e2e contra Docker (controlador):** emitir un CCF (semilla existente) → **NC parcial** sobre él
  (`buscar-para-nc` → `detalle-para-nc` → ajustar → `guardar-pendiente`) → **201 PENDIENTE_ENVIO**; y una
  **ND** con cargo nuevo → **201**. Registrar cualquier divergencia de contrato (como en F5.1b/F5.2).

## Riesgos / a confirmar en e2e
- Forma exacta de la **lista de ítems** en `DetalleParaNcDto` (leer el DTO completo en el plan).
- Si el backend exige que los montos de la NC **no superen el saldo disponible** (probable; mensaje a
  capturar) y si valida que los ítems de la NC referencien líneas del original.
- `tipoOperacion`/`condicionOperacion` y cualquier campo extra que MH exija para 05/06.
- Versión: el backend mapea 05→4 y 06→4 (confirmar que el validador no exige otra).
