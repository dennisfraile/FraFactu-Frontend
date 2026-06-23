# F5.1 — Frontend Facturación: Fundaciones + Factura (01) end-to-end

**Fecha:** 2026-06-23
**Fase:** F5.1 (primera rebanada vertical de F5 — módulo Facturación)
**Repo:** `FraFactu-Frontend` (rama `feat/f5-1-facturacion-factura01` desde `development`)
**Construye sobre:** F4 (design system "Tinta y Sello en cálido", shell, axios, React Query, auth store).

---

## 1. Contexto y decisiones de descomposición

F5 (módulo Facturación) es la fase más grande del proyecto. Se descompone en **rebanadas verticales por tipo de DTE** (decisión del usuario, Opción A):

- **F5.1** — Fundaciones + **Factura (01)** end-to-end *(este spec)*.
- **F5.2** — CCF (03) + FSE (14).
- **F5.3** — NC (05) + ND (06).
- **F5.4** — Gestión avanzada: lotes (incl. transmisión real a MH), DTEs recibidos, compras externas, cuentas por cobrar.

Cada sub-fase es su propia rama/PR. F5.1 es el "esqueleto andante": ejercita todas las capas de la arquitectura con un solo tipo de DTE, dejando el riesgo arquitectónico al frente.

### Restricción clave: sin credenciales MH por ahora
No hay certificado ni credenciales del ambiente de Pruebas de Hacienda disponibles. Por tanto:
- El e2e de F5.1 valida hasta **armar el DTE y persistirlo como PENDIENTE** (sin transmisión real a MH).
- La emisión usa `crearEventoAutomatico=false` (queda PENDIENTE) y/o `guardar-pendiente`.
- La **transmisión real a MH (sello de recepción)** se difiere a F5.4, cuando haya certificado/credenciales.

---

## 2. Mapa de la API real del backend (verificado)

Emisión de **todos** los tipos de DTE por un único endpoint; `identificacion.tipoDte` discrimina 01/03/14/05/06.

| Acción | Endpoint | Notas |
|---|---|---|
| Emitir DTE | `POST /api/facturas` | body `CreateFacturaElectronicaDto`. Con `identificacion.crearEventoAutomatico=true` transmite a MH; con `false` queda PENDIENTE_LOTE. Roles: EmisorAdmin, GerenteSucursal, Cajero. |
| Guardar pendiente | `POST /api/facturas/guardar-pendiente` | persiste sin enviar a MH. |
| Enviar individual | `POST /api/facturas/{id}/enviar-individual` | transmite una pendiente (requiere MH → F5.4). |
| Detalle por id | `GET /api/facturas/{id}` | `FacturaElectronicaResponseDto`. |
| Detalle por código | `GET /api/facturas/codigo/{codigo}` | idem. |
| Historial paginado | `GET /api/facturas` | filtros: `pageNumber,pageSize,sucursalId,search,fechaDesde,fechaHasta,vendedorId,tipoDte,estadoHacienda,catTipoTransmisionId,ambiente`. Devuelve `PaginatedResponse<FacturaListDto>`. |
| Búsqueda rápida | `GET /api/facturas/search?q=&ambiente=` | `List<FacturaListDto>`. |
| JSON DTE | `GET /api/facturas/{id}/json-dte` | JSON oficial MH. |
| Anular | `POST /api/facturas/{id}/anular` | body `{ motivo }`. Roles: EmisorAdmin, GerenteSucursal. |
| ¿Puede invalidar? | `GET /api/facturas/{id}/puede-invalidar` | plazo (01/11/14 = 3 meses; resto = día siguiente). |
| Invalidar (evento MH) | `POST /api/facturas/{id}/invalidar` | body `AnularFacturaDto`. Requiere MH para el evento real → el armado/validación se hace en F5.1; el envío real a F5.4. |

**Catálogos MH** (`GET /api/catalogos/*`, **públicos sin auth**), forma `{ id, codigo, valor }` (+ campos extra):
`departamentos`, `municipios` (+`codigoDepartamento`), `distritos` (+`codigoDepartamento,codigoMunicipio`), `tributos` (+`esRetencion,esValorPorcentual,seccion`), `unidades-medida`, `tipos-documento`, `condiciones-operacione`, `formas-pago`, `plazos`, `tipos-items`, `tipos-documento-identificacion-receptor`, `actividades-economicas` (+`padreId,esSeleccionable`), etc.

**Autocompletar / selección (rutas reales — `[Route("api/[controller]")]`, sin kebab-case, case-insensitive):**
- `GET /api/receptores/search?searchTerm=` → `List<ReceptorListDto>`.
- `GET /api/productosservicios/search?searchTerm=&sucursalId=` → `List<ProductoServicioListDto>` (trae `precioVenta`, `unidadMedida`, `tipoImpuesto` 1=Gravado/2=Exento/3=NoSujeto, `precioIncluyeIva`, `tributosAdicionales`). **Ojo: el segmento es `productosservicios`, NO `productos-servicios`.**
- `GET /api/vendedores?activeOnly=true&sucursalId=` → `List<VendedorDto>`.
- `GET /api/sucursales/todas-activas` → sucursales activas (para el selector de sucursal del formulario).
- Catálogo de condiciones de operación: `GET /api/catalogos/condiciones-operacione` (sic — el backend tiene ese path sin "s" final; usarlo literal).

**Contrato de emisión (`CreateFacturaElectronicaDto`), campos usados en F5.1 (Factura 01):**
- `identificacion`: `{ version:1, tipoDte:"01", tipoModelo, tipoOperacion, crearEventoAutomatico, fechaEmision, horaEmision (HH:mm:ss), tipoMoneda:"USD" }`.
- `sucursalId` (int, requerido), `receptorId?` o `receptor?` (`ReceptorDteDto`: tipoDocumento, numDocumento, nrc?, nombre, direccion?{departamento,municipio,distrito?,complemento}, telefono?, correo?), `vendedorId?`, `cajaId?`.
- `cuerpoDocumento: ItemDocumentoDto[]` — por ítem: `numItem, tipoItem (1=Bien,2=Servicio,3=Ambos,4=Otros), cantidad, codigo?, uniMedida (int), descripcion, precioUni, montoDescuento?, ventaGravada, ventaExenta, ventaNoSuj, ivaItem, tributos?:string[], productoId?, bodegaId?, costoUnitario?, precioIncluyeIva?`.
- `resumen: ResumenDto` — `totalNoSuj, totalExenta, totalGravada, subTotalVentas?, descu*?, totalDescu?, totalIva, ivaRete1?, reteRenta?, subTotal, totalPagar, totalLetras, condicionOperacion (1=Contado,2=Crédito,3=Otro), pagos: PagoDto[]` (`{ catFormaPagoId, monto, referencia?, catPlazoId?, periodo? }`).
- Opcionales no usados en F5.1 (sí en F5.2/F5.3): `documentosRelacionados`, `ventaTercero`, `otrosDocumentos`, `extension`, `apendices`.

**Respuesta `FacturaElectronicaResponseDto`:** `id, codigoGeneracion, numeroControl, selloRecepcion?, estado, estadoHacienda, identificacion, emisor, receptor?, cuerpoDocumento, resumen, jsonDte?, fechaEmision, ...`.

**Preview/PDF/QR:** el backend **no** los genera (no hay endpoint PDF/QR para facturas). El frontend arma el preview (HTML), exporta PDF en cliente y genera el QR desde la URL de consulta pública de MH (`ambiente` + `codGen=codigoGeneracion` + `fechaEmi=fechaEmision`). El QR resuelve a un DTE válido **solo tras transmisión**.

---

## 3. Arquitectura del módulo (`src/features/facturacion/`)

```
features/facturacion/
  types.ts            # tipos TS espejo de los DTOs (request + response) — camelCase
  catalogos.ts        # códigos MH como const/enums (tipoDte, condiciónOp, tipoItem, tipoDoc receptor…)
  api.ts              # facturacionApi: create, guardarPendiente, getAll, getById,
                      #   getByCodigo, anular, invalidar, puedeInvalidar, jsonDte, search
  catalogos-api.ts    # catalogosApi (GET /api/catalogos/*) + receptores/search, productos/search, vendedores
  hooks.ts            # React Query: useCatalogo, useEmitirFactura, useHistorial, useDte, useAnular, usePuedeInvalidar
  calc/
    factura01.ts      # motor de cálculo Factura 01 (TS puro)
    round.ts          # round(n,2), round8(n)
    numero-letras.ts  # totalLetras (cifra USD → palabras, es-SV)
    types.ts          # interfaz MotorCalculo (extensible por tipo de DTE)
    index.ts
  schemas.ts          # zod (validación de formulario, alineada a FluentValidation del backend)
  pages/
    EmitirFacturaPage.tsx
    HistorialPage.tsx
    DteDetallePage.tsx
  components/
    DatosGeneralesSection.tsx
    CuerpoDocumentoTable.tsx
    ReceptorPicker.tsx
    ItemPicker.tsx
    CierrePagoSection.tsx
    TotalesPanel.tsx
    VistaPreviaDte.tsx
    AnularInvalidarModal.tsx
```

Principios: el **motor de cálculo no depende de React** (testeable en aislamiento); la UI consume el motor vía un hook/derivación memoizada; cada componente tiene una responsabilidad única y un archivo focalizado.

---

## 4. Motor de cálculo (TDD — el corazón)

Módulo TS puro, **probado primero** (rojo → verde). Interfaz extensible:

```ts
interface MotorCalculo {
  calcularItem(input: ItemInput, ctx: CalcContext): ItemCalculado   // ventaGravada/exenta/noSuj, ivaItem
  calcularResumen(items: ItemCalculado[], opts: ResumenOpts): ResumenCalculado
}
```

**Factura 01 (precio IVA-incluido):**
- Por ítem: `base = round(precioUni * cantidad - (montoDescuento ?? 0), 2)`. Según `tipoImpuesto` del producto/ítem, esa base va a `ventaGravada` (gravado), `ventaExenta` o `ventaNoSuj`. Para gravado: `ivaItem = round(ventaGravada / 1.13 * 0.13, 2)` (IVA inverso — el precio ya incluye IVA).
- Resumen: `totalGravada/totalExenta/totalNoSuj` = sumas; `totalIva` = suma de `ivaItem`; `subTotal = totalGravada + totalExenta + totalNoSuj`; `totalPagar = subTotal` (el IVA ya está incluido en gravada). `totalLetras` desde `totalPagar`.
- `pagos[]` deben sumar exactamente `totalPagar` (validación de formulario y de negocio).
- Redondeos con `round(n,2)` (cuerpo admite `round8`), replicando el comportamiento observado en la referencia Vue (`facturas.service.js`).

**Casos de prueba (mínimos):** 1 ítem gravado simple; múltiples ítems; con descuento de línea; ítem exento; mezcla gravado+exento; cuadre de pagos (ok / desajustado); `totalLetras` (enteros, centavos, cero, miles).

> Nota: el backend recalcula/valida estas cifras; el motor del frontend debe coincidir para evitar 400. `precioIncluyeIva` puede enviarse para que el backend reconcilie.

---

## 5. UI — Flujo de emisión (Layout C: captura única + paso de vista previa)

`EmitirFacturaPage` con **react-hook-form + zod**. Dos pasos.

**Paso 1 · Captura** (una pantalla; `TotalesPanel` pegado a la derecha, recalcula en vivo con el motor):
- **DatosGeneralesSection:** tipo DTE (fijo `01` en F5.1), sucursal (del selector empresa·sucursal del shell), `ReceptorPicker` (búsqueda `/receptores/search` o "Consumidor Final" sin documento), vendedor opcional, condición de operación.
- **CuerpoDocumentoTable:** field-array de ítems; cada fila con `ItemPicker` (autocompleta producto → precio, unidad, tipo impuesto, `productoId/bodegaId`) o ítem manual; columnas cantidad/precio/descuento; subtotal por fila en vivo; agregar/eliminar fila.
- **CierrePagoSection:** `pagos[]` (forma de pago del catálogo + monto); valida que sumen `totalPagar`.

**Paso 2 · Vista previa:** `VistaPreviaDte` con el DTE armado (emisor, receptor, ítems, resumen, total en letras, QR). Botones **Emitir** (crea PENDIENTE vía `crearEventoAutomatico=false`) y **Atrás**. También **Guardar como pendiente**. Tras éxito → toast + navegación a `DteDetallePage`.

**Errores:** 400 del backend (validación) se mapean a errores de formulario/`Toast`; estados de carga/empty/error consistentes con el design system.

---

## 6. Preview / PDF / QR (`VistaPreviaDte`)

- **Preview:** documento renderizado con estilos de impresión (`@media print`).
- **PDF:** exportación en cliente con `window.print()` + estilos de impresión (sin dependencia pesada en F5.1).
- **QR:** lib ligera **`qrcode.react`** (nueva dependencia a aprobar) que codifica la URL de consulta pública de MH a partir de `ambiente`, `codigoGeneracion`, `fechaEmision`. Nota visible: válido solo tras transmisión a MH.

---

## 7. Historial + anular/invalidar

- **HistorialPage:** `Table` del design system (paginación nativa) sobre `GET /api/facturas` con filtros (search, tipoDte, estadoHacienda, fechas, sucursal, ambiente). Fila → `DteDetallePage`. Estados empty/loading/error.
- **DteDetallePage:** detalle (`GET /api/facturas/{id}`) + reuso de `VistaPreviaDte`. Acciones:
  - **Anular:** `AnularInvalidarModal` → `POST /{id}/anular { motivo }`.
  - **Invalidar:** primero `GET /{id}/puede-invalidar` (muestra plazo restante); si procede, modal con `AnularFacturaDto` → `POST /{id}/invalidar`. (El evento real a MH se completa en F5.4; en F5.1 se valida el armado y la ruta de la UI.)

---

## 8. Navegación y rutas

- `router.tsx`: dentro de `ProtectedRoute` + `AppLayout`, añadir `/facturacion/emitir` (EmitirFacturaPage), `/facturacion/historial` (HistorialPage), `/facturacion/:id` (DteDetallePage).
- `nav-config.ts`: sección "Facturación" ya existe; ajustar entradas a `Emitir DTE` → `/facturacion/emitir`, `Historial` → `/facturacion/historial` (la entrada "Recibidos" se cablea en F5.4).

---

## 9. Pruebas (Vitest + RTL + MSW)

- **TDD del motor de cálculo** (unitario, primero): ver §4.
- **Integración:**
  - `EmitirFacturaPage`: captura → totales en vivo → vista previa → emitir (MSW: catálogos, `/receptores/search`, `/productos-servicios/search`, `POST /facturas`).
  - `HistorialPage`: render de tabla, filtros, paginación (MSW: `GET /facturas`).
  - `DteDetallePage`: detalle + anular + flujo puede-invalidar/invalidar (MSW).
- Handlers MSW nuevos bajo el patrón de F4. Los tests **no** dependen de `.env` (ya fijado `VITE_API_URL` en `vitest.config.ts`).

---

## 10. Provisión del emisor de pruebas (prerequisito del e2e)

Documentado como script de semilla en el plan. Sobre el Postgres del `docker compose`:
1. Sembrar rol + usuario admin (workaround SQL de `frafactu-gap-bootstrap-admin`: INSERT Rol SuperAdmin/EmisorAdmin, INSERT Usuario con reset-token, `POST /auth/reset-password`).
2. Sembrar **Emisor de pruebas**: datos fiscales (NIT, NRC, nombre, actividad), `codEstable`/`codPuntoVenta` (necesarios para el número de control), ambiente **Pruebas** (`00`), **sin** certificado válido.
3. Sembrar al menos una **Sucursal**, un **Producto** y un **Receptor** de prueba para el e2e.

El JWT debe traer `EmisorId` y `SucursalId` para que los endpoints de facturas resuelvan el tenant.

---

## 11. Criterios de aceptación de F5.1

1. Se emite una **Factura 01** de punta a punta contra el backend en Docker → queda **PENDIENTE** (sin MH), aparece en historial, con preview/PDF/QR, y es anulable. Totales y tributos cuadran (validados por el backend, sin 400).
2. `npm run build`, `npm run test`, `npm run lint` **verdes y verificados**; CI verde en el PR.
3. **Diferido a credenciales MH (no bloquea F5.1):** transmisión real con sello de recepción → se cubre en F5.4.

## 12. Dependencias nuevas a aprobar
- `qrcode.react` (generación de QR en cliente). Sin otras libs pesadas (PDF vía print en F5.1).

## 13. Fuera de alcance de F5.1
- CCF/FSE/NC/ND (F5.2–F5.3); lotes/recibidos/compras/CxC y transmisión real a MH (F5.4); creación inline de receptores/productos (Config = F7); planes de cuota (CxC = F5.4).
