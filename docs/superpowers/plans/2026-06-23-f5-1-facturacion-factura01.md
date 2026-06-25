# F5.1 — Facturación: Fundaciones + Factura (01) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir en `FraFactu-Frontend` el módulo de Facturación con la primera rebanada vertical: emitir, previsualizar, historiar y anular una **Factura (01)** end-to-end contra el backend real, sobre el design system y el shell de F4.

**Architecture:** Módulo `features/facturacion/` con un **motor de cálculo TS puro** (sin React, probado con TDD), una capa de datos (axios + React Query) contra los endpoints reales, y UI en **Layout C** (captura única + paso de vista previa). El motor y los mappers son funciones puras testeables; los componentes consumen valores derivados memoizados.

**Tech Stack:** React 19, TypeScript, Vite 7, Vitest 3 + RTL + MSW, TanStack Query 5, react-hook-form 7 + zod 4, Tailwind v4, axios. Nueva dep: `qrcode.react`.

## Global Constraints

- **Stack fijo** (no cambiar): Vite 7 / Vitest 3 / @vitejs/plugin-react 5 / Tailwind v4. No subir a Vite 8.
- **Idioma:** todo el código, comentarios y UI en **español**.
- **Cliente HTTP:** usar siempre la instancia `api` de `@/lib/http/axios` (baseURL = `${VITE_API_URL}/api`, inyecta Bearer). El backend resuelve `EmisorId` desde el JWT; **el frontend NO envía emisorId**.
- **Rutas backend** (case-insensitive, `[Route("api/[controller]")]`, sin kebab-case): `/facturas`, `/catalogos/*`, `/receptores/search`, `/productosservicios/search` (¡no `productos-servicios`!), `/vendedores`, `/sucursales/todas-activas`. Catálogo de condiciones: `/catalogos/condiciones-operacione` (con typo del backend, literal).
- **Tests sin `.env`:** `VITE_API_URL` ya fijado en `vitest.config.ts`. MSW para toda llamada HTTP. `base = 'http://localhost:8080/api'` en handlers.
- **TDD** obligatorio en motor de cálculo, número a letras y mappers (test rojo → verde).
- **Git:** rama `feat/f5-1-facturacion-factura01` desde `development`. Mensajes en español + trailer `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`. **No** pushear ni commitear sin que el usuario lo pida (la rama y el primer commit se confirman con el usuario). Los `git commit` de cada tarea quedan listados pero su ejecución se confirma según la política del usuario.
- **Emisión en F5.1 = modo PENDIENTE:** crear con `identificacion.crearEventoAutomatico=false`. Transmisión real a MH se difiere a F5.4.
- **Verificación de cierre:** `npm run build`, `npm run test`, `npm run lint` verdes y verificados; CI verde en el PR.

---

## File Structure

**Crear:**
- `src/features/facturacion/types.ts` — tipos espejo de los DTOs del backend.
- `src/features/facturacion/catalogos.ts` — códigos MH como constantes/enums.
- `src/features/facturacion/calc/round.ts` — `round`, `round8`.
- `src/features/facturacion/calc/types.ts` — `TipoImpuesto`, `ItemInput`, `ItemCalculado`, `ResumenNumerico`.
- `src/features/facturacion/calc/factura01.ts` — `calcularItemFactura01`, `calcularResumenFactura01`, `pagosCuadran`.
- `src/features/facturacion/calc/numero-letras.ts` — `numeroALetras`.
- `src/features/facturacion/calc/index.ts` — barrel.
- `src/features/facturacion/mappers.ts` — `buildCreateFacturaDto` (form → DTO).
- `src/features/facturacion/api.ts` — `facturacionApi`.
- `src/features/facturacion/catalogos-api.ts` — `catalogosApi`, `receptoresApi`, `productosApi`, `vendedoresApi`, `sucursalesApi`.
- `src/features/facturacion/hooks.ts` — hooks de React Query.
- `src/features/facturacion/schemas.ts` — zod del formulario.
- `src/features/facturacion/components/AsyncSearchSelect.tsx` — selector con búsqueda async (debounce).
- `src/features/facturacion/components/ReceptorPicker.tsx`
- `src/features/facturacion/components/ItemPicker.tsx`
- `src/features/facturacion/components/DatosGeneralesSection.tsx`
- `src/features/facturacion/components/CuerpoDocumentoTable.tsx`
- `src/features/facturacion/components/CierrePagoSection.tsx`
- `src/features/facturacion/components/TotalesPanel.tsx`
- `src/features/facturacion/components/VistaPreviaDte.tsx`
- `src/features/facturacion/components/AnularInvalidarModal.tsx`
- `src/features/facturacion/pages/EmitirFacturaPage.tsx`
- `src/features/facturacion/pages/HistorialPage.tsx`
- `src/features/facturacion/pages/DteDetallePage.tsx`
- Tests `*.test.ts(x)` junto a cada archivo con lógica.
- `docs/operaciones/semilla-emisor-pruebas.md` — script de semilla del emisor de pruebas.

**Modificar:**
- `src/design-system/Table.tsx` — añadir modo de paginación controlada (server-side), retrocompatible.
- `src/app/router.tsx` — cablear rutas `/facturacion/*`.
- `src/app/nav-config.ts` — ajustar entradas de la sección Facturación.
- `src/test/msw/handlers.ts` — añadir handlers de facturación/catálogos.
- `package.json` — añadir `qrcode.react`.

---

## Task 1: Tipos del dominio (`types.ts`) y constantes de catálogos (`catalogos.ts`)

**Files:**
- Create: `src/features/facturacion/types.ts`
- Create: `src/features/facturacion/catalogos.ts`

**Interfaces:**
- Produces: `TipoDte`, `CatalogoItem`, `CreateFacturaDto`, `IdentificacionDto`, `ReceptorDteDto`, `DireccionDto`, `ItemDocumentoDto`, `PagoDto`, `ResumenDto`, `FacturaResponse`, `FacturaListItem`, `PaginatedResponse<T>`, `AnularFacturaDto`, `PuedeInvalidarResult`, `ReceptorListItem`, `ProductoListItem`, `Vendedor`, `Sucursal`. Constantes `COND_OPERACION`, `TIPO_ITEM`, `TIPO_IMPUESTO`, `TIPO_DTE`.

Esta tarea no tiene test propio (solo tipos/constantes); se valida vía `tsc` en tareas siguientes y un build al final. Es la base que consumen todas las demás.

- [ ] **Step 1: Crear `types.ts`**

```ts
// src/features/facturacion/types.ts
// Tipos TS espejo de los DTOs reales del backend (camelCase en el JSON).

export type TipoDte = '01' | '03' | '14' | '05' | '06'

export interface CatalogoItem {
  id: number
  codigo: string
  valor: string
}

// Catálogos con campos extra para cascada / clasificación.
export interface MunicipioItem extends CatalogoItem { codigoDepartamento: string }
export interface DistritoItem extends CatalogoItem { codigoDepartamento: string; codigoMunicipio: string }

export interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

// ---- Request de emisión ----
export interface IdentificacionDto {
  version: number
  tipoDte: TipoDte
  tipoModelo: number
  tipoOperacion: number
  crearEventoAutomatico: boolean
  fechaEmision: string // yyyy-MM-dd
  horaEmision: string // HH:mm:ss
  tipoMoneda: string // 'USD'
}

export interface DireccionDto {
  departamento: string
  municipio: string
  distrito?: string
  complemento: string
}

export interface ReceptorDteDto {
  tipoDocumento?: string
  numDocumento?: string
  nrc?: string
  nombre: string
  nombreComercial?: string
  codActividad?: string
  descActividad?: string
  direccion?: DireccionDto
  telefono?: string
  correo?: string
}

export interface ItemDocumentoDto {
  numItem: number
  tipoItem: number
  cantidad: number
  codigo?: string
  uniMedida: number
  descripcion: string
  precioUni: number
  montoDescuento?: number
  ventaGravada: number
  ventaExenta: number
  ventaNoSuj: number
  ivaItem: number
  tributos?: string[] | null
  productoId?: number
  bodegaId?: number
  precioIncluyeIva?: boolean
}

export interface PagoDto {
  catFormaPagoId: number
  monto: number
  referencia?: string
  catPlazoId?: number
  periodo?: number
}

export interface ResumenDto {
  totalNoSuj: number
  totalExenta: number
  totalGravada: number
  subTotal: number
  totalIva: number
  ivaRete1?: number
  reteRenta?: number
  totalDescu?: number
  totalPagar: number
  totalLetras: string
  condicionOperacion: number
  pagos: PagoDto[]
}

export interface CreateFacturaDto {
  identificacion: IdentificacionDto
  sucursalId: number
  receptorId?: number | null
  receptor?: ReceptorDteDto | null
  vendedorId?: number | null
  cuerpoDocumento: ItemDocumentoDto[]
  resumen: ResumenDto
  observaciones?: string
}

// ---- Respuestas ----
export interface FacturaResponse {
  id: number
  codigoGeneracion: string
  numeroControl: string
  selloRecepcion?: string | null
  estado: string
  estadoHacienda?: string | null
  identificacion: IdentificacionDto
  receptor?: ReceptorDteDto | null
  cuerpoDocumento: ItemDocumentoDto[]
  resumen: ResumenDto
  fechaEmision: string
}

export interface FacturaListItem {
  id: number
  numeroControl: string
  codigoGeneracion: string
  fechaEmision: string
  tipoDte: string
  tipoDocumento: string
  receptorNombre: string
  receptorNumeroDocumento: string
  totalPagar: number
  estadoHacienda: string
  selloRecepcion?: string | null
  ambiente: string
}

export interface AnularFacturaDto {
  motivo: string
}

export interface PuedeInvalidarResult {
  puedeInvalidar: boolean
  horasRestantes: number
  fechaLimite: string
  mensaje: string
}

// ---- Autocompletar / selección ----
export interface ReceptorListItem {
  id: number
  tipoDocumentoNombre: string
  numeroDocumento: string | null
  nombreRazonSocial: string
  correoElectronico: string
  nrc: string
}

export interface ProductoListItem {
  id: number
  codigo: string
  nombre: string
  descripcion?: string
  precioVenta: number
  unidadMedida: string
  tipoItem: string
  tipoImpuesto: number // 1=Gravado, 2=Exento, 3=NoSujeto
  precioIncluyeIva: boolean
}

export interface Vendedor {
  id: number
  codigo: string
  nombre: string
  activo: boolean
}

export interface Sucursal {
  id: number
  nombre: string
}
```

- [ ] **Step 2: Crear `catalogos.ts`**

```ts
// src/features/facturacion/catalogos.ts
// Códigos MH usados en F5.1 (Factura 01).

export const TIPO_DTE = { FACTURA: '01', CCF: '03', NC: '05', ND: '06', FSE: '14' } as const

export const COND_OPERACION = { CONTADO: 1, CREDITO: 2, OTRO: 3 } as const

export const TIPO_ITEM = { BIEN: 1, SERVICIO: 2, AMBOS: 3, OTROS: 4 } as const

export const TIPO_IMPUESTO = { GRAVADO: 1, EXENTO: 2, NO_SUJETO: 3 } as const

// Identificación por defecto para una Factura 01 en modo PENDIENTE (sin MH).
export const IDENTIFICACION_FACTURA_DEFAULT = {
  version: 1,
  tipoDte: TIPO_DTE.FACTURA,
  tipoModelo: 1, // Previo
  tipoOperacion: 1, // Normal
  crearEventoAutomatico: false, // F5.1: no transmite a MH
  tipoMoneda: 'USD',
} as const
```

- [ ] **Step 3: Verificar que typechequea**

Run: `cd FraFactu-Frontend && npx tsc -b --noEmit`
Expected: sin errores nuevos relacionados a estos archivos.

- [ ] **Step 4: Commit**

```bash
git add src/features/facturacion/types.ts src/features/facturacion/catalogos.ts
git commit -m "feat(facturacion): tipos del dominio y constantes de catálogos MH"
```

---

## Task 2: Redondeo (`calc/round.ts`)

**Files:**
- Create: `src/features/facturacion/calc/round.ts`
- Test: `src/features/facturacion/calc/round.test.ts`

**Interfaces:**
- Produces: `round(n: number, decimales?: number): number` (default 2), `round8(n: number): number`.

- [ ] **Step 1: Escribir el test que falla**

```ts
// src/features/facturacion/calc/round.test.ts
import { describe, it, expect } from 'vitest'
import { round, round8 } from './round'

describe('round', () => {
  it('redondea a 2 decimales por defecto', () => {
    expect(round(1.005)).toBe(1.01)
    expect(round(2.345)).toBe(2.35)
    expect(round(0.1 + 0.2)).toBe(0.3)
  })
  it('respeta los decimales indicados', () => {
    expect(round(1.23456, 3)).toBe(1.235)
  })
  it('round8 redondea a 8 decimales', () => {
    expect(round8(1.123456785)).toBe(1.12345679)
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npx vitest run src/features/facturacion/calc/round.test.ts`
Expected: FAIL ("Failed to resolve import './round'").

- [ ] **Step 3: Implementación mínima**

```ts
// src/features/facturacion/calc/round.ts
// Redondeo "half away from zero" estable, evitando el sesgo binario de toFixed.
export function round(n: number, decimales = 2): number {
  const factor = Math.pow(10, decimales)
  return Math.round((n + Number.EPSILON) * factor) / factor
}

export function round8(n: number): number {
  return round(n, 8)
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npx vitest run src/features/facturacion/calc/round.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/facturacion/calc/round.ts src/features/facturacion/calc/round.test.ts
git commit -m "feat(facturacion): helper de redondeo con TDD"
```

---

## Task 3: Número a letras (`calc/numero-letras.ts`)

**Files:**
- Create: `src/features/facturacion/calc/numero-letras.ts`
- Test: `src/features/facturacion/calc/numero-letras.test.ts`

**Interfaces:**
- Produces: `numeroALetras(monto: number): string` → p.ej. `113.00` → `"CIENTO TRECE DÓLARES CON 00/100"`.

- [ ] **Step 1: Escribir el test que falla**

```ts
// src/features/facturacion/calc/numero-letras.test.ts
import { describe, it, expect } from 'vitest'
import { numeroALetras } from './numero-letras'

describe('numeroALetras', () => {
  it('convierte enteros con centavos', () => {
    expect(numeroALetras(113)).toBe('CIENTO TRECE DÓLARES CON 00/100')
    expect(numeroALetras(1.5)).toBe('UN DÓLAR CON 50/100')
  })
  it('cero', () => {
    expect(numeroALetras(0)).toBe('CERO DÓLARES CON 00/100')
  })
  it('miles y unidades compuestas', () => {
    expect(numeroALetras(1234.56)).toBe('MIL DOSCIENTOS TREINTA Y CUATRO DÓLARES CON 56/100')
    expect(numeroALetras(21)).toBe('VEINTIUN DÓLARES CON 00/100')
  })
  it('cientos exactos', () => {
    expect(numeroALetras(100)).toBe('CIEN DÓLARES CON 00/100')
    expect(numeroALetras(500)).toBe('QUINIENTOS DÓLARES CON 00/100')
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npx vitest run src/features/facturacion/calc/numero-letras.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementación mínima**

```ts
// src/features/facturacion/calc/numero-letras.ts
// Convierte un monto USD a letras en español (formato MH: "... DÓLARES CON NN/100").
import { round } from './round'

const UNIDADES = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE']
const ESPECIALES: Record<number, string> = {
  10: 'DIEZ', 11: 'ONCE', 12: 'DOCE', 13: 'TRECE', 14: 'CATORCE', 15: 'QUINCE',
  16: 'DIECISÉIS', 17: 'DIECISIETE', 18: 'DIECIOCHO', 19: 'DIECINUEVE',
  20: 'VEINTE', 21: 'VEINTIUN', 22: 'VEINTIDÓS', 23: 'VEINTITRÉS', 24: 'VEINTICUATRO',
  25: 'VEINTICINCO', 26: 'VEINTISÉIS', 27: 'VEINTISIETE', 28: 'VEINTIOCHO', 29: 'VEINTINUEVE',
}
const DECENAS = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA']
const CENTENAS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS']

function menorQueCien(n: number): string {
  if (n < 10) return UNIDADES[n]
  if (ESPECIALES[n]) return ESPECIALES[n]
  const d = Math.floor(n / 10)
  const u = n % 10
  return u === 0 ? DECENAS[d] : `${DECENAS[d]} Y ${UNIDADES[u]}`
}

function menorQueMil(n: number): string {
  if (n === 100) return 'CIEN'
  const c = Math.floor(n / 100)
  const resto = n % 100
  const centena = CENTENAS[c]
  const restoTxt = resto === 0 ? '' : menorQueCien(resto)
  return [centena, restoTxt].filter(Boolean).join(' ')
}

function enteroALetras(n: number): string {
  if (n === 0) return 'CERO'
  const millones = Math.floor(n / 1_000_000)
  const miles = Math.floor((n % 1_000_000) / 1000)
  const resto = n % 1000
  const partes: string[] = []
  if (millones > 0) partes.push(millones === 1 ? 'UN MILLÓN' : `${menorQueMil(millones)} MILLONES`)
  if (miles > 0) partes.push(miles === 1 ? 'MIL' : `${menorQueMil(miles)} MIL`)
  if (resto > 0) partes.push(menorQueMil(resto))
  return partes.join(' ')
}

export function numeroALetras(monto: number): string {
  const valor = round(monto, 2)
  const entero = Math.floor(valor)
  const centavos = Math.round((valor - entero) * 100)
  const centavosTxt = String(centavos).padStart(2, '0')
  const moneda = entero === 1 ? 'DÓLAR' : 'DÓLARES'
  return `${enteroALetras(entero)} ${moneda} CON ${centavosTxt}/100`
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npx vitest run src/features/facturacion/calc/numero-letras.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/facturacion/calc/numero-letras.ts src/features/facturacion/calc/numero-letras.test.ts
git commit -m "feat(facturacion): conversión de monto a letras (es-SV) con TDD"
```

---

## Task 4: Motor de cálculo Factura 01 (`calc/types.ts`, `calc/factura01.ts`, `calc/index.ts`)

**Files:**
- Create: `src/features/facturacion/calc/types.ts`
- Create: `src/features/facturacion/calc/factura01.ts`
- Create: `src/features/facturacion/calc/index.ts`
- Test: `src/features/facturacion/calc/factura01.test.ts`

**Interfaces:**
- Consumes: `round` (Task 2).
- Produces:
  - `ItemInput { cantidad; precioUni; montoDescuento?; tipoImpuesto: 1|2|3 }`
  - `ItemCalculado { ventaGravada; ventaExenta; ventaNoSuj; ivaItem }`
  - `ResumenNumerico { totalGravada; totalExenta; totalNoSuj; totalIva; subTotal; totalPagar }`
  - `calcularItemFactura01(input: ItemInput): ItemCalculado`
  - `calcularResumenFactura01(items: ItemCalculado[]): ResumenNumerico`
  - `pagosCuadran(montosPago: number[], totalPagar: number): boolean`

- [ ] **Step 1: Escribir el test que falla**

```ts
// src/features/facturacion/calc/factura01.test.ts
import { describe, it, expect } from 'vitest'
import { calcularItemFactura01, calcularResumenFactura01, pagosCuadran } from './factura01'

describe('calcularItemFactura01 (precio IVA-incluido)', () => {
  it('ítem gravado: extrae IVA inverso', () => {
    const r = calcularItemFactura01({ cantidad: 2, precioUni: 56.5, tipoImpuesto: 1 })
    expect(r.ventaGravada).toBe(113)
    expect(r.ivaItem).toBe(13) // 113/1.13*0.13
    expect(r.ventaExenta).toBe(0)
    expect(r.ventaNoSuj).toBe(0)
  })
  it('aplica descuento de línea antes del IVA', () => {
    const r = calcularItemFactura01({ cantidad: 1, precioUni: 113, montoDescuento: 13, tipoImpuesto: 1 })
    expect(r.ventaGravada).toBe(100)
    expect(r.ivaItem).toBe(11.5)
  })
  it('ítem exento: sin IVA', () => {
    const r = calcularItemFactura01({ cantidad: 3, precioUni: 10, tipoImpuesto: 2 })
    expect(r.ventaExenta).toBe(30)
    expect(r.ventaGravada).toBe(0)
    expect(r.ivaItem).toBe(0)
  })
  it('ítem no sujeto', () => {
    const r = calcularItemFactura01({ cantidad: 1, precioUni: 50, tipoImpuesto: 3 })
    expect(r.ventaNoSuj).toBe(50)
    expect(r.ivaItem).toBe(0)
  })
})

describe('calcularResumenFactura01', () => {
  it('suma totales y mantiene IVA incluido en el total', () => {
    const items = [
      calcularItemFactura01({ cantidad: 2, precioUni: 56.5, tipoImpuesto: 1 }), // gravada 113, iva 13
      calcularItemFactura01({ cantidad: 3, precioUni: 10, tipoImpuesto: 2 }), // exenta 30
    ]
    const r = calcularResumenFactura01(items)
    expect(r.totalGravada).toBe(113)
    expect(r.totalExenta).toBe(30)
    expect(r.totalNoSuj).toBe(0)
    expect(r.totalIva).toBe(13)
    expect(r.subTotal).toBe(143)
    expect(r.totalPagar).toBe(143) // el IVA ya está incluido en la gravada
  })
})

describe('pagosCuadran', () => {
  it('true cuando la suma de pagos iguala el total', () => {
    expect(pagosCuadran([100, 43], 143)).toBe(true)
  })
  it('false cuando no cuadra', () => {
    expect(pagosCuadran([100], 143)).toBe(false)
  })
  it('tolera ruido de coma flotante', () => {
    expect(pagosCuadran([0.1, 0.2], 0.3)).toBe(true)
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npx vitest run src/features/facturacion/calc/factura01.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementación mínima**

```ts
// src/features/facturacion/calc/types.ts
export type TipoImpuesto = 1 | 2 | 3 // 1=Gravado, 2=Exento, 3=NoSujeto

export interface ItemInput {
  cantidad: number
  precioUni: number
  montoDescuento?: number
  tipoImpuesto: TipoImpuesto
}

export interface ItemCalculado {
  ventaGravada: number
  ventaExenta: number
  ventaNoSuj: number
  ivaItem: number
}

export interface ResumenNumerico {
  totalGravada: number
  totalExenta: number
  totalNoSuj: number
  totalIva: number
  subTotal: number
  totalPagar: number
}
```

```ts
// src/features/facturacion/calc/factura01.ts
import { round } from './round'
import type { ItemInput, ItemCalculado, ResumenNumerico } from './types'

const TASA_IVA = 0.13

// Factura 01: el precio unitario INCLUYE IVA. Se extrae el IVA de la base gravada.
export function calcularItemFactura01(input: ItemInput): ItemCalculado {
  const base = round(input.precioUni * input.cantidad - (input.montoDescuento ?? 0), 2)
  const r: ItemCalculado = { ventaGravada: 0, ventaExenta: 0, ventaNoSuj: 0, ivaItem: 0 }
  if (input.tipoImpuesto === 1) {
    r.ventaGravada = base
    r.ivaItem = round((base / (1 + TASA_IVA)) * TASA_IVA, 2)
  } else if (input.tipoImpuesto === 2) {
    r.ventaExenta = base
  } else {
    r.ventaNoSuj = base
  }
  return r
}

export function calcularResumenFactura01(items: ItemCalculado[]): ResumenNumerico {
  const totalGravada = round(items.reduce((s, i) => s + i.ventaGravada, 0), 2)
  const totalExenta = round(items.reduce((s, i) => s + i.ventaExenta, 0), 2)
  const totalNoSuj = round(items.reduce((s, i) => s + i.ventaNoSuj, 0), 2)
  const totalIva = round(items.reduce((s, i) => s + i.ivaItem, 0), 2)
  const subTotal = round(totalGravada + totalExenta + totalNoSuj, 2)
  // En Factura 01 el IVA ya está incluido en la venta gravada: el total = subtotal.
  const totalPagar = subTotal
  return { totalGravada, totalExenta, totalNoSuj, totalIva, subTotal, totalPagar }
}

export function pagosCuadran(montosPago: number[], totalPagar: number): boolean {
  const suma = round(montosPago.reduce((s, m) => s + m, 0), 2)
  return suma === round(totalPagar, 2)
}
```

```ts
// src/features/facturacion/calc/index.ts
export * from './round'
export * from './types'
export * from './factura01'
export * from './numero-letras'
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npx vitest run src/features/facturacion/calc/`
Expected: PASS (round, numero-letras y factura01).

- [ ] **Step 5: Commit**

```bash
git add src/features/facturacion/calc/types.ts src/features/facturacion/calc/factura01.ts src/features/facturacion/calc/index.ts src/features/facturacion/calc/factura01.test.ts
git commit -m "feat(facturacion): motor de cálculo Factura 01 (IVA incluido) con TDD"
```

---

## Task 5: Mapper form → DTO (`mappers.ts`)

**Files:**
- Create: `src/features/facturacion/mappers.ts`
- Test: `src/features/facturacion/mappers.test.ts`

**Interfaces:**
- Consumes: tipos de Task 1; `calcularItemFactura01`, `calcularResumenFactura01`, `numeroALetras` (Task 3/4); `IDENTIFICACION_FACTURA_DEFAULT` (Task 1).
- Produces:
  - `FormItem { productoId?; codigo?; descripcion; cantidad; precioUni; montoDescuento?; uniMedida; tipoItem; tipoImpuesto: 1|2|3; bodegaId? }`
  - `FormPago { catFormaPagoId; monto }`
  - `FacturaFormValues { sucursalId; esConsumidorFinal; receptorId?: number|null; vendedorId?: number|null; condicionOperacion; items: FormItem[]; pagos: FormPago[] }`
  - `buildCreateFacturaDto(values: FacturaFormValues, ahora: { fecha: string; hora: string }): CreateFacturaDto`

- [ ] **Step 1: Escribir el test que falla**

```ts
// src/features/facturacion/mappers.test.ts
import { describe, it, expect } from 'vitest'
import { buildCreateFacturaDto, type FacturaFormValues } from './mappers'

const base: FacturaFormValues = {
  sucursalId: 1,
  esConsumidorFinal: true,
  receptorId: null,
  vendedorId: null,
  condicionOperacion: 1,
  items: [
    { descripcion: 'Producto A', cantidad: 2, precioUni: 56.5, uniMedida: 59, tipoItem: 1, tipoImpuesto: 1 },
  ],
  pagos: [{ catFormaPagoId: 1, monto: 113 }],
}

describe('buildCreateFacturaDto', () => {
  it('arma el DTO de Factura 01 con identificación PENDIENTE', () => {
    const dto = buildCreateFacturaDto(base, { fecha: '2026-06-23', hora: '14:30:00' })
    expect(dto.identificacion.tipoDte).toBe('01')
    expect(dto.identificacion.crearEventoAutomatico).toBe(false)
    expect(dto.identificacion.fechaEmision).toBe('2026-06-23')
    expect(dto.sucursalId).toBe(1)
    expect(dto.receptorId).toBeNull()
    expect(dto.receptor).toBeNull()
  })
  it('calcula cuerpo y resumen coherentes', () => {
    const dto = buildCreateFacturaDto(base, { fecha: '2026-06-23', hora: '14:30:00' })
    expect(dto.cuerpoDocumento[0].ventaGravada).toBe(113)
    expect(dto.cuerpoDocumento[0].ivaItem).toBe(13)
    expect(dto.cuerpoDocumento[0].numItem).toBe(1)
    expect(dto.resumen.totalGravada).toBe(113)
    expect(dto.resumen.totalIva).toBe(13)
    expect(dto.resumen.totalPagar).toBe(113)
    expect(dto.resumen.totalLetras).toBe('CIENTO TRECE DÓLARES CON 00/100')
    expect(dto.resumen.pagos[0].monto).toBe(113)
  })
  it('con receptor registrado envía receptorId y no receptor inline', () => {
    const dto = buildCreateFacturaDto({ ...base, esConsumidorFinal: false, receptorId: 7 }, { fecha: '2026-06-23', hora: '14:30:00' })
    expect(dto.receptorId).toBe(7)
    expect(dto.receptor).toBeNull()
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npx vitest run src/features/facturacion/mappers.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementación mínima**

```ts
// src/features/facturacion/mappers.ts
import type { CreateFacturaDto, ItemDocumentoDto } from './types'
import type { TipoImpuesto } from './calc/types'
import { calcularItemFactura01, calcularResumenFactura01 } from './calc/factura01'
import { numeroALetras } from './calc/numero-letras'
import { IDENTIFICACION_FACTURA_DEFAULT } from './catalogos'

export interface FormItem {
  productoId?: number
  bodegaId?: number
  codigo?: string
  descripcion: string
  cantidad: number
  precioUni: number
  montoDescuento?: number
  uniMedida: number
  tipoItem: number
  tipoImpuesto: TipoImpuesto
}

export interface FormPago {
  catFormaPagoId: number
  monto: number
}

export interface FacturaFormValues {
  sucursalId: number
  esConsumidorFinal: boolean
  receptorId?: number | null
  vendedorId?: number | null
  condicionOperacion: number
  items: FormItem[]
  pagos: FormPago[]
}

export function buildCreateFacturaDto(
  values: FacturaFormValues,
  ahora: { fecha: string; hora: string },
): CreateFacturaDto {
  const calculados = values.items.map((it) =>
    calcularItemFactura01({
      cantidad: it.cantidad,
      precioUni: it.precioUni,
      montoDescuento: it.montoDescuento,
      tipoImpuesto: it.tipoImpuesto,
    }),
  )
  const resumen = calcularResumenFactura01(calculados)

  const cuerpoDocumento: ItemDocumentoDto[] = values.items.map((it, idx) => ({
    numItem: idx + 1,
    tipoItem: it.tipoItem,
    cantidad: it.cantidad,
    codigo: it.codigo,
    uniMedida: it.uniMedida,
    descripcion: it.descripcion,
    precioUni: it.precioUni,
    montoDescuento: it.montoDescuento ?? 0,
    ventaGravada: calculados[idx].ventaGravada,
    ventaExenta: calculados[idx].ventaExenta,
    ventaNoSuj: calculados[idx].ventaNoSuj,
    ivaItem: calculados[idx].ivaItem,
    tributos: null,
    productoId: it.productoId,
    bodegaId: it.bodegaId,
    precioIncluyeIva: true,
  }))

  return {
    identificacion: {
      ...IDENTIFICACION_FACTURA_DEFAULT,
      fechaEmision: ahora.fecha,
      horaEmision: ahora.hora,
    },
    sucursalId: values.sucursalId,
    receptorId: values.esConsumidorFinal ? null : values.receptorId ?? null,
    receptor: null,
    vendedorId: values.vendedorId ?? null,
    cuerpoDocumento,
    resumen: {
      totalNoSuj: resumen.totalNoSuj,
      totalExenta: resumen.totalExenta,
      totalGravada: resumen.totalGravada,
      subTotal: resumen.subTotal,
      totalIva: resumen.totalIva,
      totalPagar: resumen.totalPagar,
      totalLetras: numeroALetras(resumen.totalPagar),
      condicionOperacion: values.condicionOperacion,
      pagos: values.pagos.map((p) => ({ catFormaPagoId: p.catFormaPagoId, monto: p.monto })),
    },
  }
}
```

Nota: `TipoImpuesto` viene de `./calc/types` (valores 1|2|3); no se necesita ningún alias adicional en `./types`.

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npx vitest run src/features/facturacion/mappers.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/facturacion/mappers.ts src/features/facturacion/mappers.test.ts
git commit -m "feat(facturacion): mapper de formulario a CreateFacturaDto con TDD"
```

---

## Task 6: Cliente API de facturación y catálogos (`api.ts`, `catalogos-api.ts`)

**Files:**
- Create: `src/features/facturacion/api.ts`
- Create: `src/features/facturacion/catalogos-api.ts`

**Interfaces:**
- Consumes: instancia `api` de `@/lib/http/axios`; tipos de Task 1.
- Produces:
  - `facturacionApi`: `crear`, `guardarPendiente`, `getById`, `getByCodigo`, `listar(params)`, `anular`, `puedeInvalidar`, `getJsonDte`.
  - `catalogosApi.get(nombre)`, `receptoresApi.search(term)`, `productosApi.search(term, sucursalId?)`, `vendedoresApi.listar(sucursalId?)`, `sucursalesApi.todasActivas()`.

Sin test unitario propio (capa fina sobre axios); se cubre vía MSW en las tareas de páginas.

- [ ] **Step 1: Crear `api.ts`**

```ts
// src/features/facturacion/api.ts
import { api } from '@/lib/http/axios'
import type {
  CreateFacturaDto, FacturaResponse, FacturaListItem, PaginatedResponse,
  AnularFacturaDto, PuedeInvalidarResult,
} from './types'

export interface ListarFacturasParams {
  pageNumber?: number
  pageSize?: number
  search?: string
  tipoDte?: string
  estadoHacienda?: string
  fechaDesde?: string
  fechaHasta?: string
  sucursalId?: number
  ambiente?: string
}

export const facturacionApi = {
  async crear(dto: CreateFacturaDto): Promise<FacturaResponse> {
    const { data } = await api.post<FacturaResponse>('/facturas', dto)
    return data
  },
  async guardarPendiente(dto: CreateFacturaDto): Promise<FacturaResponse> {
    const { data } = await api.post<FacturaResponse>('/facturas/guardar-pendiente', dto)
    return data
  },
  async getById(id: number): Promise<FacturaResponse> {
    const { data } = await api.get<FacturaResponse>(`/facturas/${id}`)
    return data
  },
  async getByCodigo(codigo: string): Promise<FacturaResponse> {
    const { data } = await api.get<FacturaResponse>(`/facturas/codigo/${codigo}`)
    return data
  },
  async listar(params: ListarFacturasParams): Promise<PaginatedResponse<FacturaListItem>> {
    const { data } = await api.get<PaginatedResponse<FacturaListItem>>('/facturas', { params })
    return data
  },
  async anular(id: number, dto: AnularFacturaDto): Promise<void> {
    await api.post(`/facturas/${id}/anular`, dto)
  },
  async puedeInvalidar(id: number): Promise<PuedeInvalidarResult> {
    const { data } = await api.get<PuedeInvalidarResult>(`/facturas/${id}/puede-invalidar`)
    return data
  },
  async getJsonDte(id: number): Promise<string> {
    const { data } = await api.get(`/facturas/${id}/json-dte`, { responseType: 'text' })
    return data as string
  },
}
```

- [ ] **Step 2: Crear `catalogos-api.ts`**

```ts
// src/features/facturacion/catalogos-api.ts
import { api } from '@/lib/http/axios'
import type {
  CatalogoItem, MunicipioItem, DistritoItem, ReceptorListItem, ProductoListItem, Vendedor, Sucursal,
} from './types'

// Mapa de nombre lógico → segmento real del endpoint /api/catalogos/*.
const CATALOGO_PATHS = {
  departamentos: 'departamentos',
  municipios: 'municipios',
  distritos: 'distritos',
  tributos: 'tributos',
  unidadesMedida: 'unidades-medida',
  tiposItems: 'tipos-items',
  formasPago: 'formas-pago',
  condicionesOperacion: 'condiciones-operacione', // sic: typo del backend
  tiposDocIdentificacion: 'tipos-documento-identificacion-receptor',
  plazos: 'plazos',
} as const

export type NombreCatalogo = keyof typeof CATALOGO_PATHS

export const catalogosApi = {
  async get<T = CatalogoItem>(nombre: NombreCatalogo): Promise<T[]> {
    const { data } = await api.get<T[]>(`/catalogos/${CATALOGO_PATHS[nombre]}`)
    return data
  },
  municipios(): Promise<MunicipioItem[]> { return this.get<MunicipioItem>('municipios') },
  distritos(): Promise<DistritoItem[]> { return this.get<DistritoItem>('distritos') },
}

export const receptoresApi = {
  async search(searchTerm: string): Promise<ReceptorListItem[]> {
    const { data } = await api.get<ReceptorListItem[]>('/receptores/search', { params: { searchTerm } })
    return data
  },
}

export const productosApi = {
  async search(searchTerm: string, sucursalId?: number): Promise<ProductoListItem[]> {
    const { data } = await api.get<ProductoListItem[]>('/productosservicios/search', {
      params: { searchTerm, sucursalId },
    })
    return data
  },
}

export const vendedoresApi = {
  async listar(sucursalId?: number): Promise<Vendedor[]> {
    const { data } = await api.get<Vendedor[]>('/vendedores', { params: { activeOnly: true, sucursalId } })
    return data
  },
}

export const sucursalesApi = {
  async todasActivas(): Promise<Sucursal[]> {
    const { data } = await api.get<Sucursal[]>('/sucursales/todas-activas')
    return data
  },
}
```

- [ ] **Step 3: Verificar typecheck**

Run: `npx tsc -b --noEmit`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/features/facturacion/api.ts src/features/facturacion/catalogos-api.ts
git commit -m "feat(facturacion): cliente axios de facturas, catálogos y autocompletado"
```

---

## Task 7: Hooks de React Query (`hooks.ts`)

**Files:**
- Create: `src/features/facturacion/hooks.ts`

**Interfaces:**
- Consumes: `facturacionApi`, `catalogosApi`, `vendedoresApi`, `sucursalesApi` (Task 6); tipos Task 1.
- Produces: `useCatalogo(nombre)`, `useMunicipios()`, `useDistritos()`, `useVendedores(sucursalId?)`, `useSucursales()`, `useHistorial(params)`, `useFactura(id)`, `useEmitirFactura()`, `useAnularFactura()`, `usePuedeInvalidar(id, enabled)`.

Sin test unitario propio; se ejercitan vía las páginas (MSW).

- [ ] **Step 1: Crear `hooks.ts`**

```ts
// src/features/facturacion/hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { facturacionApi, type ListarFacturasParams } from './api'
import { catalogosApi, vendedoresApi, sucursalesApi, type NombreCatalogo } from './catalogos-api'
import type { CreateFacturaDto, AnularFacturaDto } from './types'

const HORA_CATALOGO = 1000 * 60 * 60 // catálogos: estáticos durante la sesión

export function useCatalogo(nombre: NombreCatalogo) {
  return useQuery({
    queryKey: ['catalogo', nombre],
    queryFn: () => catalogosApi.get(nombre),
    staleTime: HORA_CATALOGO,
  })
}

export function useMunicipios() {
  return useQuery({ queryKey: ['catalogo', 'municipios'], queryFn: () => catalogosApi.municipios(), staleTime: HORA_CATALOGO })
}

export function useDistritos() {
  return useQuery({ queryKey: ['catalogo', 'distritos'], queryFn: () => catalogosApi.distritos(), staleTime: HORA_CATALOGO })
}

export function useVendedores(sucursalId?: number) {
  return useQuery({ queryKey: ['vendedores', sucursalId], queryFn: () => vendedoresApi.listar(sucursalId) })
}

export function useSucursales() {
  return useQuery({ queryKey: ['sucursales'], queryFn: () => sucursalesApi.todasActivas(), staleTime: HORA_CATALOGO })
}

export function useHistorial(params: ListarFacturasParams) {
  return useQuery({
    queryKey: ['facturas', params],
    queryFn: () => facturacionApi.listar(params),
  })
}

export function useFactura(id: number) {
  return useQuery({ queryKey: ['factura', id], queryFn: () => facturacionApi.getById(id), enabled: Number.isFinite(id) })
}

export function useEmitirFactura() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateFacturaDto) => facturacionApi.crear(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['facturas'] }),
  })
}

export function useAnularFactura() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: AnularFacturaDto }) => facturacionApi.anular(id, dto),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['facturas'] })
      qc.invalidateQueries({ queryKey: ['factura', vars.id] })
    },
  })
}

// Provisto para F5.4 (flujo de invalidación real, requiere credenciales MH).
export function usePuedeInvalidar(id: number, enabled: boolean) {
  return useQuery({
    queryKey: ['puede-invalidar', id],
    queryFn: () => facturacionApi.puedeInvalidar(id),
    enabled,
  })
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc -b --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/features/facturacion/hooks.ts
git commit -m "feat(facturacion): hooks de React Query para catálogos, historial y emisión"
```

---

## Task 8: Esquema zod del formulario (`schemas.ts`)

**Files:**
- Create: `src/features/facturacion/schemas.ts`
- Test: `src/features/facturacion/schemas.test.ts`

**Interfaces:**
- Consumes: `pagosCuadran` (Task 4); `calcularItemFactura01`/`calcularResumenFactura01` para validar cuadre.
- Produces: `facturaFormSchema` (zod), `type FacturaFormInput` (= `FacturaFormValues` de Task 5, inferido).

- [ ] **Step 1: Escribir el test que falla**

```ts
// src/features/facturacion/schemas.test.ts
import { describe, it, expect } from 'vitest'
import { facturaFormSchema } from './schemas'

const valido = {
  sucursalId: 1,
  esConsumidorFinal: true,
  receptorId: null,
  vendedorId: null,
  condicionOperacion: 1,
  items: [{ descripcion: 'A', cantidad: 1, precioUni: 113, uniMedida: 59, tipoItem: 1, tipoImpuesto: 1 }],
  pagos: [{ catFormaPagoId: 1, monto: 113 }],
}

describe('facturaFormSchema', () => {
  it('acepta un formulario válido', () => {
    expect(facturaFormSchema.safeParse(valido).success).toBe(true)
  })
  it('rechaza sin ítems', () => {
    expect(facturaFormSchema.safeParse({ ...valido, items: [] }).success).toBe(false)
  })
  it('rechaza cantidad <= 0', () => {
    const r = facturaFormSchema.safeParse({ ...valido, items: [{ ...valido.items[0], cantidad: 0 }] })
    expect(r.success).toBe(false)
  })
  it('rechaza si los pagos no cuadran con el total', () => {
    const r = facturaFormSchema.safeParse({ ...valido, pagos: [{ catFormaPagoId: 1, monto: 50 }] })
    expect(r.success).toBe(false)
  })
  it('exige receptorId cuando no es consumidor final', () => {
    const r = facturaFormSchema.safeParse({ ...valido, esConsumidorFinal: false, receptorId: null })
    expect(r.success).toBe(false)
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npx vitest run src/features/facturacion/schemas.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementación mínima**

```ts
// src/features/facturacion/schemas.ts
import { z } from 'zod'
import { calcularItemFactura01, calcularResumenFactura01, pagosCuadran } from './calc/factura01'

const itemSchema = z.object({
  productoId: z.number().optional(),
  bodegaId: z.number().optional(),
  codigo: z.string().optional(),
  descripcion: z.string().min(1, 'Descripción requerida'),
  cantidad: z.number().positive('La cantidad debe ser mayor que 0'),
  precioUni: z.number().nonnegative('El precio no puede ser negativo'),
  montoDescuento: z.number().nonnegative().optional(),
  uniMedida: z.number().int(),
  tipoItem: z.number().int(),
  tipoImpuesto: z.union([z.literal(1), z.literal(2), z.literal(3)]),
})

const pagoSchema = z.object({
  catFormaPagoId: z.number().int(),
  monto: z.number().positive('El monto debe ser mayor que 0'),
})

export const facturaFormSchema = z
  .object({
    sucursalId: z.number().int().positive('Seleccione una sucursal'),
    esConsumidorFinal: z.boolean(),
    receptorId: z.number().int().nullable().optional(),
    vendedorId: z.number().int().nullable().optional(),
    condicionOperacion: z.number().int(),
    items: z.array(itemSchema).min(1, 'Agregue al menos un ítem'),
    pagos: z.array(pagoSchema).min(1, 'Agregue al menos una forma de pago'),
  })
  .superRefine((v, ctx) => {
    if (!v.esConsumidorFinal && !v.receptorId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['receptorId'], message: 'Seleccione un receptor o marque Consumidor Final' })
    }
    const calc = v.items.map((it) =>
      calcularItemFactura01({ cantidad: it.cantidad, precioUni: it.precioUni, montoDescuento: it.montoDescuento, tipoImpuesto: it.tipoImpuesto }),
    )
    const { totalPagar } = calcularResumenFactura01(calc)
    if (!pagosCuadran(v.pagos.map((p) => p.monto), totalPagar)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['pagos'], message: `Los pagos deben sumar exactamente $${totalPagar.toFixed(2)}` })
    }
  })

export type FacturaFormInput = z.infer<typeof facturaFormSchema>
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npx vitest run src/features/facturacion/schemas.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/facturacion/schemas.ts src/features/facturacion/schemas.test.ts
git commit -m "feat(facturacion): esquema zod del formulario con validación de cuadre"
```

---

## Task 9: Paginación controlada en `Table` (design system)

**Files:**
- Modify: `src/design-system/Table.tsx`
- Modify (verificar que sigue verde): `src/design-system/Table.test.tsx`

**Interfaces:**
- Produces: prop opcional de paginación de servidor en `Table`: cuando se pasa `serverPagination={{ page, totalPages, onPageChange }}`, el componente NO segmenta `rows` localmente y usa esos controles. Sin esa prop, conserva el comportamiento actual (paginación cliente). Retrocompatible.

- [ ] **Step 1: Escribir el test que falla (modo servidor)**

Añadir a `src/design-system/Table.test.tsx` (no borrar los tests existentes):

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Table } from './Table'

describe('Table — paginación de servidor', () => {
  const cols = [{ key: 'n', header: 'N' }]
  const rows = [{ n: 1 }, { n: 2 }]
  it('muestra la página/total recibidos y delega el cambio de página', async () => {
    const onPageChange = vi.fn()
    render(
      <Table
        columns={cols}
        rows={rows}
        getRowKey={(r) => r.n}
        serverPagination={{ page: 2, totalPages: 5, onPageChange }}
      />,
    )
    expect(screen.getByText('Página 2 de 5')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npx vitest run src/design-system/Table.test.tsx`
Expected: FAIL (la prop `serverPagination` no existe; "Página 2 de 5" no aparece).

- [ ] **Step 3: Modificar `Table.tsx`**

Reemplazar el contenido por:

```tsx
// src/design-system/Table.tsx
import { useState, type ReactNode } from 'react'
import { Button } from './Button'

interface Column<T> { key: string; header: string; render?: (row: T) => ReactNode }

interface ServerPagination {
  page: number // 1-based
  totalPages: number
  onPageChange: (page: number) => void
}

interface TableProps<T> {
  columns: Column<T>[]
  rows: T[]
  pageSize?: number
  getRowKey: (row: T) => string | number
  serverPagination?: ServerPagination
}

export function Table<T>({ columns, rows, pageSize = 10, getRowKey, serverPagination }: TableProps<T>) {
  const [page, setPage] = useState(0) // 0-based, solo modo cliente
  const esServidor = !!serverPagination

  const pagesCliente = Math.max(1, Math.ceil(rows.length / pageSize))
  const slice = esServidor ? rows : rows.slice(page * pageSize, page * pageSize + pageSize)

  const pageLabelActual = esServidor ? serverPagination!.page : page + 1
  const pageLabelTotal = esServidor ? serverPagination!.totalPages : pagesCliente
  const enPrimera = esServidor ? serverPagination!.page <= 1 : page === 0
  const enUltima = esServidor ? serverPagination!.page >= serverPagination!.totalPages : page >= pagesCliente - 1

  const irAtras = () => (esServidor ? serverPagination!.onPageChange(serverPagination!.page - 1) : setPage((p) => p - 1))
  const irAdelante = () => (esServidor ? serverPagination!.onPageChange(serverPagination!.page + 1) : setPage((p) => p + 1))

  return (
    <div className="flex flex-col gap-3">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-hairline text-left text-slate">
            {columns.map((c) => <th key={c.key} className="py-2 font-medium">{c.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {slice.map((row) => (
            <tr key={getRowKey(row)} className="border-b border-hairline">
              {columns.map((c) => (
                <td key={c.key} className="py-2">
                  {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between text-sm text-slate">
        <span>Página {pageLabelActual} de {pageLabelTotal}</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" disabled={enPrimera} onClick={irAtras}>Anterior</Button>
          <Button variant="ghost" size="sm" disabled={enUltima} onClick={irAdelante}>Siguiente</Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa todo el suite de Table**

Run: `npx vitest run src/design-system/Table.test.tsx`
Expected: PASS (tests viejos de paginación cliente + nuevo de servidor).

- [ ] **Step 5: Commit**

```bash
git add src/design-system/Table.tsx src/design-system/Table.test.tsx
git commit -m "feat(design-system): Table soporta paginación de servidor (retrocompatible)"
```

---

## Task 10: Selector con búsqueda async (`components/AsyncSearchSelect.tsx`)

**Files:**
- Create: `src/features/facturacion/components/AsyncSearchSelect.tsx`
- Test: `src/features/facturacion/components/AsyncSearchSelect.test.tsx`

**Interfaces:**
- Produces: `AsyncSearchSelect<T>({ onSearch, getLabel, onSelect, placeholder, minChars? })` — input con debounce (300ms) que llama `onSearch(term)` (Promise<T[]>), muestra resultados y al elegir invoca `onSelect(item)`. `minChars` default 2.

- [ ] **Step 1: Escribir el test que falla**

```tsx
// src/features/facturacion/components/AsyncSearchSelect.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AsyncSearchSelect } from './AsyncSearchSelect'

describe('AsyncSearchSelect', () => {
  it('busca tras escribir y selecciona un resultado', async () => {
    const onSearch = vi.fn().mockResolvedValue([{ id: 1, nombre: 'Cliente Uno' }])
    const onSelect = vi.fn()
    render(
      <AsyncSearchSelect
        onSearch={onSearch}
        getLabel={(x: { id: number; nombre: string }) => x.nombre}
        onSelect={onSelect}
        placeholder="Buscar cliente"
      />,
    )
    await userEvent.type(screen.getByPlaceholderText('Buscar cliente'), 'Cli')
    expect(await screen.findByText('Cliente Uno')).toBeInTheDocument()
    await userEvent.click(screen.getByText('Cliente Uno'))
    expect(onSelect).toHaveBeenCalledWith({ id: 1, nombre: 'Cliente Uno' })
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npx vitest run src/features/facturacion/components/AsyncSearchSelect.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementación mínima**

```tsx
// src/features/facturacion/components/AsyncSearchSelect.tsx
import { useEffect, useRef, useState } from 'react'

interface Props<T> {
  onSearch: (term: string) => Promise<T[]>
  getLabel: (item: T) => string
  onSelect: (item: T) => void
  placeholder?: string
  minChars?: number
}

export function AsyncSearchSelect<T>({ onSearch, getLabel, onSelect, placeholder, minChars = 2 }: Props<T>) {
  const [term, setTerm] = useState('')
  const [items, setItems] = useState<T[]>([])
  const [open, setOpen] = useState(false)
  const [cargando, setCargando] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (term.trim().length < minChars) { setItems([]); return }
    timer.current = setTimeout(async () => {
      setCargando(true)
      try {
        setItems(await onSearch(term.trim()))
        setOpen(true)
      } finally {
        setCargando(false)
      }
    }, 300)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [term, minChars, onSearch])

  return (
    <div className="relative">
      <input
        role="combobox"
        aria-expanded={open}
        className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-[#16241f]"
        placeholder={placeholder}
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onFocus={() => items.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && (
        <ul role="listbox" className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-hairline bg-surface shadow-lg dark:bg-[#16241f]">
          {cargando && <li className="px-3 py-2 text-sm text-slate">Buscando…</li>}
          {!cargando && items.map((item, idx) => (
            <li
              key={idx}
              role="option"
              className="cursor-pointer px-3 py-2 text-sm hover:bg-sello/10"
              onMouseDown={() => { onSelect(item); setTerm(''); setItems([]); setOpen(false) }}
            >
              {getLabel(item)}
            </li>
          ))}
          {!cargando && items.length === 0 && term.trim().length >= minChars && (
            <li className="px-3 py-2 text-sm text-slate">Sin resultados</li>
          )}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npx vitest run src/features/facturacion/components/AsyncSearchSelect.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/facturacion/components/AsyncSearchSelect.tsx src/features/facturacion/components/AsyncSearchSelect.test.tsx
git commit -m "feat(facturacion): selector con búsqueda asíncrona y debounce"
```

---

## Task 11: Handlers MSW de facturación/catálogos

**Files:**
- Create: `src/test/msw/facturacion-handlers.ts`
- Modify: `src/test/msw/handlers.ts`

**Interfaces:**
- Produces: `facturacionHandlers` (array de handlers MSW) que cubren: catálogos usados, `/sucursales/todas-activas`, `/vendedores`, `/receptores/search`, `/productosservicios/search`, `POST /facturas`, `GET /facturas` (paginado), `GET /facturas/:id`, `POST /facturas/:id/anular`, `GET /facturas/:id/puede-invalidar`. Se concatenan en `handlers.ts`.

Sin test propio; habilita las tareas 13–15. (Esta tarea agrupa el "scaffolding de test" que necesitan las páginas.)

- [ ] **Step 1: Crear `facturacion-handlers.ts`**

```ts
// src/test/msw/facturacion-handlers.ts
import { http, HttpResponse } from 'msw'

const base = 'http://localhost:8080/api'

const facturaResponse = {
  id: 10,
  codigoGeneracion: 'ABC-123',
  numeroControl: 'DTE-01-00000000-000000000000001',
  selloRecepcion: null,
  estado: 'PENDIENTE',
  estadoHacienda: 'PENDIENTE',
  identificacion: { version: 1, tipoDte: '01', tipoModelo: 1, tipoOperacion: 1, crearEventoAutomatico: false, fechaEmision: '2026-06-23', horaEmision: '14:30:00', tipoMoneda: 'USD' },
  receptor: null,
  cuerpoDocumento: [{ numItem: 1, tipoItem: 1, cantidad: 2, uniMedida: 59, descripcion: 'Producto A', precioUni: 56.5, montoDescuento: 0, ventaGravada: 113, ventaExenta: 0, ventaNoSuj: 0, ivaItem: 13 }],
  resumen: { totalNoSuj: 0, totalExenta: 0, totalGravada: 113, subTotal: 113, totalIva: 13, totalPagar: 113, totalLetras: 'CIENTO TRECE DÓLARES CON 00/100', condicionOperacion: 1, pagos: [{ catFormaPagoId: 1, monto: 113 }] },
  fechaEmision: '2026-06-23',
}

const listItem = {
  id: 10, numeroControl: 'DTE-01-00000000-000000000000001', codigoGeneracion: 'ABC-123',
  fechaEmision: '2026-06-23', tipoDte: '01', tipoDocumento: 'Factura', receptorNombre: 'Consumidor Final',
  receptorNumeroDocumento: '', totalPagar: 113, estadoHacienda: 'PENDIENTE', selloRecepcion: null, ambiente: '00',
}

export const facturacionHandlers = [
  http.get(`${base}/catalogos/unidades-medida`, () => HttpResponse.json([{ id: 59, codigo: '59', valor: 'Unidad' }])),
  http.get(`${base}/catalogos/tipos-items`, () => HttpResponse.json([{ id: 1, codigo: '1', valor: 'Bien' }, { id: 2, codigo: '2', valor: 'Servicio' }])),
  http.get(`${base}/catalogos/formas-pago`, () => HttpResponse.json([{ id: 1, codigo: '01', valor: 'Billetes y monedas' }])),
  http.get(`${base}/catalogos/condiciones-operacione`, () => HttpResponse.json([{ id: 1, codigo: '1', valor: 'Contado' }, { id: 2, codigo: '2', valor: 'Crédito' }])),
  http.get(`${base}/sucursales/todas-activas`, () => HttpResponse.json([{ id: 1, nombre: 'Casa Matriz' }])),
  http.get(`${base}/vendedores`, () => HttpResponse.json([{ id: 1, codigo: 'V01', nombre: 'Vendedor Uno', activo: true }])),
  http.get(`${base}/receptores/search`, () => HttpResponse.json([{ id: 7, tipoDocumentoNombre: 'NIT', numeroDocumento: '0614-...', nombreRazonSocial: 'Cliente Uno', correoElectronico: 'c@x.com', nrc: '123-4' }])),
  http.get(`${base}/productosservicios/search`, () => HttpResponse.json([{ id: 3, codigo: 'P001', nombre: 'Producto A', precioVenta: 56.5, unidadMedida: '59', tipoItem: 'Bien', tipoImpuesto: 1, precioIncluyeIva: true }])),
  http.post(`${base}/facturas`, () => HttpResponse.json(facturaResponse, { status: 201 })),
  http.get(`${base}/facturas/:id`, () => HttpResponse.json(facturaResponse)),
  http.get(`${base}/facturas`, () => HttpResponse.json({ items: [listItem], totalCount: 1, pageNumber: 1, pageSize: 10, totalPages: 1 })),
  http.post(`${base}/facturas/:id/anular`, () => HttpResponse.json({ message: 'Factura anulada exitosamente', facturaId: 10 })),
  http.get(`${base}/facturas/:id/puede-invalidar`, () => HttpResponse.json({ puedeInvalidar: true, horasRestantes: 20, fechaLimite: '2026-06-24T23:59:59Z', mensaje: 'Puede invalidar.' })),
]
```

- [ ] **Step 2: Concatenar en `handlers.ts`**

Modificar el final de `src/test/msw/handlers.ts`:

```ts
import { facturacionHandlers } from './facturacion-handlers'
// ... (handlers de auth existentes arriba, sin tocar)
export const handlers = [
  // ...los handlers de auth existentes...
  ...facturacionHandlers,
]
```

(Conserva los handlers de auth ya presentes; solo añade el import al inicio y el spread al final del array `handlers`.)

- [ ] **Step 3: Verificar que la suite existente sigue verde**

Run: `npx vitest run src/features/auth`
Expected: PASS (no se rompió nada de auth).

- [ ] **Step 4: Commit**

```bash
git add src/test/msw/facturacion-handlers.ts src/test/msw/handlers.ts
git commit -m "test(facturacion): handlers MSW para facturas, catálogos y autocompletado"
```

---

## Task 12: Componentes de captura — `TotalesPanel`, `ItemPicker`, `ReceptorPicker`

**Files:**
- Create: `src/features/facturacion/components/TotalesPanel.tsx`
- Create: `src/features/facturacion/components/ItemPicker.tsx`
- Create: `src/features/facturacion/components/ReceptorPicker.tsx`
- Test: `src/features/facturacion/components/TotalesPanel.test.tsx`

**Interfaces:**
- Consumes: `calcularItemFactura01`, `calcularResumenFactura01`, `numeroALetras` (Task 4/3); `AsyncSearchSelect` (Task 10); `productosApi`, `receptoresApi` (Task 6); tipos Task 1; `FormItem` (Task 5).
- Produces:
  - `TotalesPanel({ items })` — recibe `FormItem[]`, calcula y muestra gravado/IVA/total/total en letras.
  - `ItemPicker({ onSelect })` — `onSelect(producto: ProductoListItem)`.
  - `ReceptorPicker({ onSelect })` — `onSelect(receptor: ReceptorListItem)`.

- [ ] **Step 1: Escribir el test que falla (TotalesPanel)**

```tsx
// src/features/facturacion/components/TotalesPanel.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TotalesPanel } from './TotalesPanel'

describe('TotalesPanel', () => {
  it('muestra totales en vivo de los ítems', () => {
    render(<TotalesPanel items={[{ descripcion: 'A', cantidad: 2, precioUni: 56.5, uniMedida: 59, tipoItem: 1, tipoImpuesto: 1 }]} />)
    expect(screen.getByText('$113.00')).toBeInTheDocument() // total
    expect(screen.getByText(/CIENTO TRECE/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npx vitest run src/features/facturacion/components/TotalesPanel.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar los tres componentes**

```tsx
// src/features/facturacion/components/TotalesPanel.tsx
import { useMemo } from 'react'
import { calcularItemFactura01, calcularResumenFactura01 } from '../calc/factura01'
import { numeroALetras } from '../calc/numero-letras'
import type { FormItem } from '../mappers'

export function TotalesPanel({ items }: { items: FormItem[] }) {
  const resumen = useMemo(() => {
    const calc = items
      .filter((i) => i.cantidad > 0 && i.precioUni >= 0)
      .map((i) => calcularItemFactura01({ cantidad: i.cantidad, precioUni: i.precioUni, montoDescuento: i.montoDescuento, tipoImpuesto: i.tipoImpuesto }))
    return calcularResumenFactura01(calc)
  }, [items])

  const fmt = (n: number) => `$${n.toFixed(2)}`
  return (
    <div className="sticky top-4 rounded-xl border border-hairline bg-surface p-4 dark:bg-[#16241f]">
      <h3 className="mb-3 text-sm font-semibold text-ink">Resumen</h3>
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between"><dt className="text-slate">Gravado</dt><dd>{fmt(resumen.totalGravada)}</dd></div>
        <div className="flex justify-between"><dt className="text-slate">Exento</dt><dd>{fmt(resumen.totalExenta)}</dd></div>
        <div className="flex justify-between"><dt className="text-slate">IVA 13%</dt><dd>{fmt(resumen.totalIva)}</dd></div>
        <div className="mt-2 flex justify-between border-t border-hairline pt-2 text-base font-bold text-sello"><dt>Total</dt><dd>{fmt(resumen.totalPagar)}</dd></div>
      </dl>
      <p className="mt-2 text-xs text-slate">{numeroALetras(resumen.totalPagar)}</p>
    </div>
  )
}
```

```tsx
// src/features/facturacion/components/ItemPicker.tsx
import { AsyncSearchSelect } from './AsyncSearchSelect'
import { productosApi } from '../catalogos-api'
import type { ProductoListItem } from '../types'

export function ItemPicker({ onSelect, sucursalId }: { onSelect: (p: ProductoListItem) => void; sucursalId?: number }) {
  return (
    <AsyncSearchSelect<ProductoListItem>
      onSearch={(term) => productosApi.search(term, sucursalId)}
      getLabel={(p) => `${p.codigo} — ${p.nombre} ($${p.precioVenta.toFixed(2)})`}
      onSelect={onSelect}
      placeholder="Buscar producto por código o nombre"
    />
  )
}
```

```tsx
// src/features/facturacion/components/ReceptorPicker.tsx
import { AsyncSearchSelect } from './AsyncSearchSelect'
import { receptoresApi } from '../catalogos-api'
import type { ReceptorListItem } from '../types'

export function ReceptorPicker({ onSelect }: { onSelect: (r: ReceptorListItem) => void }) {
  return (
    <AsyncSearchSelect<ReceptorListItem>
      onSearch={(term) => receptoresApi.search(term)}
      getLabel={(r) => `${r.nombreRazonSocial}${r.numeroDocumento ? ` (${r.numeroDocumento})` : ''}`}
      onSelect={onSelect}
      placeholder="Buscar receptor por nombre o documento"
    />
  )
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npx vitest run src/features/facturacion/components/TotalesPanel.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/facturacion/components/TotalesPanel.tsx src/features/facturacion/components/ItemPicker.tsx src/features/facturacion/components/ReceptorPicker.tsx src/features/facturacion/components/TotalesPanel.test.tsx
git commit -m "feat(facturacion): panel de totales en vivo y pickers de producto/receptor"
```

---

## Task 13: Vista previa con QR/PDF (`components/VistaPreviaDte.tsx`)

**Files:**
- Modify: `package.json` (añadir `qrcode.react`)
- Create: `src/features/facturacion/components/VistaPreviaDte.tsx`
- Test: `src/features/facturacion/components/VistaPreviaDte.test.tsx`

**Interfaces:**
- Consumes: `CreateFacturaDto` o `FacturaResponse`; `qrcode.react`.
- Produces: `VistaPreviaDte({ dto, codigoGeneracion?, ambiente?, onExportarPdf? })` — renderiza encabezado, ítems, resumen, total en letras y un QR (URL de consulta MH). Botón "Descargar PDF" llama `window.print()`.

- [ ] **Step 1: Añadir dependencia**

Run: `npm install qrcode.react@^4.2.0`
Expected: `qrcode.react` aparece en `dependencies` de `package.json`.

- [ ] **Step 2: Escribir el test que falla**

```tsx
// src/features/facturacion/components/VistaPreviaDte.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VistaPreviaDte } from './VistaPreviaDte'
import type { CreateFacturaDto } from '../types'

const dto: CreateFacturaDto = {
  identificacion: { version: 1, tipoDte: '01', tipoModelo: 1, tipoOperacion: 1, crearEventoAutomatico: false, fechaEmision: '2026-06-23', horaEmision: '14:30:00', tipoMoneda: 'USD' },
  sucursalId: 1, receptorId: null, receptor: null, vendedorId: null,
  cuerpoDocumento: [{ numItem: 1, tipoItem: 1, cantidad: 2, uniMedida: 59, descripcion: 'Producto A', precioUni: 56.5, montoDescuento: 0, ventaGravada: 113, ventaExenta: 0, ventaNoSuj: 0, ivaItem: 13 }],
  resumen: { totalNoSuj: 0, totalExenta: 0, totalGravada: 113, subTotal: 113, totalIva: 13, totalPagar: 113, totalLetras: 'CIENTO TRECE DÓLARES CON 00/100', condicionOperacion: 1, pagos: [{ catFormaPagoId: 1, monto: 113 }] },
}

describe('VistaPreviaDte', () => {
  it('muestra ítems, total y total en letras', () => {
    render(<VistaPreviaDte dto={dto} ambiente="00" />)
    expect(screen.getByText('Producto A')).toBeInTheDocument()
    expect(screen.getByText('$113.00')).toBeInTheDocument()
    expect(screen.getByText(/CIENTO TRECE/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Ejecutar y verificar que falla**

Run: `npx vitest run src/features/facturacion/components/VistaPreviaDte.test.tsx`
Expected: FAIL.

- [ ] **Step 4: Implementar el componente**

```tsx
// src/features/facturacion/components/VistaPreviaDte.tsx
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/design-system'
import type { CreateFacturaDto } from '../types'

interface Props {
  dto: CreateFacturaDto
  codigoGeneracion?: string
  ambiente?: string // '00' pruebas, '01' producción
  onEmitir?: () => void
  emitiendo?: boolean
}

function urlConsultaMh(codGen: string | undefined, fechaEmi: string, ambiente: string): string {
  const cg = codGen ?? 'PENDIENTE'
  return `https://admin.factura.gob.sv/consultaPublica?ambiente=${ambiente}&codGen=${cg}&fechaEmi=${fechaEmi}`
}

export function VistaPreviaDte({ dto, codigoGeneracion, ambiente = '00', onEmitir, emitiendo }: Props) {
  const fmt = (n: number) => `$${n.toFixed(2)}`
  const url = urlConsultaMh(codigoGeneracion, dto.identificacion.fechaEmision, ambiente)
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-hairline bg-surface p-6 print:border-0 dark:bg-[#16241f]">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">Factura Electrónica (01)</h2>
            <p className="text-sm text-slate">Fecha: {dto.identificacion.fechaEmision} {dto.identificacion.horaEmision}</p>
            {codigoGeneracion && <p className="text-xs text-slate">Código generación: {codigoGeneracion}</p>}
          </div>
          <div className="text-center">
            <QRCodeSVG value={url} size={96} />
            <p className="mt-1 text-[10px] text-slate">Válido tras transmisión a MH</p>
          </div>
        </div>

        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-slate">
              <th className="py-1">Descripción</th><th className="py-1">Cant.</th><th className="py-1">Precio</th><th className="py-1">Gravado</th>
            </tr>
          </thead>
          <tbody>
            {dto.cuerpoDocumento.map((it) => (
              <tr key={it.numItem} className="border-b border-hairline">
                <td className="py-1">{it.descripcion}</td>
                <td className="py-1">{it.cantidad}</td>
                <td className="py-1">{fmt(it.precioUni)}</td>
                <td className="py-1">{fmt(it.ventaGravada)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-slate">Gravado</dt><dd>{fmt(dto.resumen.totalGravada)}</dd></div>
          <div className="flex justify-between"><dt className="text-slate">IVA 13%</dt><dd>{fmt(dto.resumen.totalIva)}</dd></div>
          <div className="flex justify-between border-t border-hairline pt-1 font-bold text-sello"><dt>Total</dt><dd>{fmt(dto.resumen.totalPagar)}</dd></div>
        </dl>
        <p className="mt-2 text-xs text-slate">{dto.resumen.totalLetras}</p>
      </div>

      <div className="flex gap-3 print:hidden">
        <Button variant="ghost" onClick={() => window.print()}>Descargar PDF</Button>
        {onEmitir && <Button onClick={onEmitir} disabled={emitiendo}>{emitiendo ? 'Emitiendo…' : 'Emitir DTE'}</Button>}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Ejecutar y verificar que pasa**

Run: `npx vitest run src/features/facturacion/components/VistaPreviaDte.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/features/facturacion/components/VistaPreviaDte.tsx src/features/facturacion/components/VistaPreviaDte.test.tsx
git commit -m "feat(facturacion): vista previa del DTE con QR (qrcode.react) y exportar PDF"
```

---

## Task 14: Página de emisión (`pages/EmitirFacturaPage.tsx`)

**Files:**
- Create: `src/features/facturacion/components/DatosGeneralesSection.tsx`
- Create: `src/features/facturacion/components/CuerpoDocumentoTable.tsx`
- Create: `src/features/facturacion/components/CierrePagoSection.tsx`
- Create: `src/features/facturacion/pages/EmitirFacturaPage.tsx`
- Test: `src/features/facturacion/pages/EmitirFacturaPage.test.tsx`

**Interfaces:**
- Consumes: `useSucursales`, `useVendedores`, `useCatalogo`, `useEmitirFactura` (Task 7); `ReceptorPicker`, `ItemPicker`, `TotalesPanel`, `VistaPreviaDte` (Task 12/13); `buildCreateFacturaDto`, `FormItem`, `FormPago`, `FacturaFormValues` (Task 5); `facturaFormSchema` (Task 8); `useToast` (design system); `useNavigate`, store de auth.
- Produces: ruta `/facturacion/emitir`.

Estado del formulario con `useState` (lista de ítems/pagos dinámica) + validación con `facturaFormSchema` al emitir; dos pasos (`captura` | `preview`). La fecha/hora se calcula al emitir.

- [ ] **Step 1: Escribir el test de integración que falla**

```tsx
// src/features/facturacion/pages/EmitirFacturaPage.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '@/design-system'
import { EmitirFacturaPage } from './EmitirFacturaPage'
import { useAuthStore } from '@/app/auth-store'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/facturacion/emitir']}>
        <ToastProvider>
          <Routes>
            <Route path="/facturacion/emitir" element={<EmitirFacturaPage />} />
            <Route path="/facturacion/:id" element={<div>Detalle DTE</div>} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('EmitirFacturaPage', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', status: 'authenticated',
      user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 2, rolNombre: 'Admin', emisorId: 5, emisorNombre: 'Mi Empresa', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] },
    })
  })

  it('captura un ítem, revisa la vista previa y emite navegando al detalle', async () => {
    setup()
    // Agregar ítem manual
    await userEvent.click(await screen.findByRole('button', { name: /agregar ítem/i }))
    await userEvent.type(screen.getByLabelText(/descripción/i), 'Producto A')
    await userEvent.clear(screen.getByLabelText(/cantidad/i)); await userEvent.type(screen.getByLabelText(/cantidad/i), '2')
    await userEvent.clear(screen.getByLabelText(/precio/i)); await userEvent.type(screen.getByLabelText(/precio/i), '56.5')
    // Pago que cuadra (113)
    await userEvent.clear(screen.getByLabelText(/monto/i)); await userEvent.type(screen.getByLabelText(/monto/i), '113')
    // Ir a vista previa
    await userEvent.click(screen.getByRole('button', { name: /revisar y emitir/i }))
    expect(await screen.findByText(/CIENTO TRECE/i)).toBeInTheDocument()
    // Emitir
    await userEvent.click(screen.getByRole('button', { name: /emitir dte/i }))
    expect(await screen.findByText('Detalle DTE')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npx vitest run src/features/facturacion/pages/EmitirFacturaPage.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar las secciones**

```tsx
// src/features/facturacion/components/DatosGeneralesSection.tsx
import { FormField, Input } from '@/design-system'
import { ReceptorPicker } from './ReceptorPicker'
import { useSucursales, useVendedores, useCatalogo } from '../hooks'
import type { Sucursal, Vendedor, ReceptorListItem } from '../types'

interface Props {
  sucursalId: number
  onSucursalId: (id: number) => void
  esConsumidorFinal: boolean
  onEsConsumidorFinal: (v: boolean) => void
  receptor: ReceptorListItem | null
  onReceptor: (r: ReceptorListItem | null) => void
  vendedorId: number | null
  onVendedorId: (id: number | null) => void
  condicionOperacion: number
  onCondicionOperacion: (c: number) => void
}

export function DatosGeneralesSection(p: Props) {
  const sucursales = useSucursales()
  const vendedores = useVendedores(p.sucursalId)
  const condiciones = useCatalogo('condicionesOperacion')
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate">Datos generales</h2>
      <FormField label="Sucursal" htmlFor="sucursal">
        <select id="sucursal" className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-[#16241f]"
          value={p.sucursalId} onChange={(e) => p.onSucursalId(Number(e.target.value))}>
          {(sucursales.data ?? []).map((s: Sucursal) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
      </FormField>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={p.esConsumidorFinal} onChange={(e) => p.onEsConsumidorFinal(e.target.checked)} />
        Consumidor Final
      </label>
      {!p.esConsumidorFinal && (
        <FormField label="Receptor" htmlFor="receptor">
          {p.receptor
            ? <div className="flex items-center justify-between rounded-md border border-hairline px-3 py-2 text-sm">
                <span>{p.receptor.nombreRazonSocial}</span>
                <button type="button" className="text-xs text-sello" onClick={() => p.onReceptor(null)}>Cambiar</button>
              </div>
            : <ReceptorPicker onSelect={p.onReceptor} />}
        </FormField>
      )}
      <FormField label="Vendedor (opcional)" htmlFor="vendedor">
        <select id="vendedor" className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-[#16241f]"
          value={p.vendedorId ?? ''} onChange={(e) => p.onVendedorId(e.target.value ? Number(e.target.value) : null)}>
          <option value="">—</option>
          {(vendedores.data ?? []).map((v: Vendedor) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
        </select>
      </FormField>
      <FormField label="Condición de operación" htmlFor="condicion">
        <select id="condicion" className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-[#16241f]"
          value={p.condicionOperacion} onChange={(e) => p.onCondicionOperacion(Number(e.target.value))}>
          {(condiciones.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.valor}</option>)}
        </select>
      </FormField>
    </section>
  )
}
```

```tsx
// src/features/facturacion/components/CuerpoDocumentoTable.tsx
import { Button, FormField, Input } from '@/design-system'
import { ItemPicker } from './ItemPicker'
import type { FormItem } from '../mappers'
import type { ProductoListItem } from '../types'

interface Props {
  items: FormItem[]
  onChange: (items: FormItem[]) => void
  sucursalId: number
}

const itemVacio: FormItem = { descripcion: '', cantidad: 1, precioUni: 0, uniMedida: 59, tipoItem: 1, tipoImpuesto: 1 }

export function CuerpoDocumentoTable({ items, onChange, sucursalId }: Props) {
  const set = (idx: number, patch: Partial<FormItem>) =>
    onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  const agregar = () => onChange([...items, { ...itemVacio }])
  const quitar = (idx: number) => onChange(items.filter((_, i) => i !== idx))
  const fromProducto = (idx: number, p: ProductoListItem) =>
    set(idx, { productoId: p.id, codigo: p.codigo, descripcion: p.nombre, precioUni: p.precioVenta, uniMedida: Number(p.unidadMedida) || 59, tipoImpuesto: (p.tipoImpuesto as 1 | 2 | 3) || 1 })

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate">Cuerpo del documento</h2>
      {items.map((it, idx) => (
        <div key={idx} className="rounded-lg border border-hairline p-3">
          <div className="mb-2"><ItemPicker sucursalId={sucursalId} onSelect={(p) => fromProducto(idx, p)} /></div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <FormField label="Descripción" htmlFor={`desc-${idx}`}>
              <Input id={`desc-${idx}`} value={it.descripcion} onChange={(e) => set(idx, { descripcion: e.target.value })} />
            </FormField>
            <FormField label="Cantidad" htmlFor={`cant-${idx}`}>
              <Input id={`cant-${idx}`} type="number" value={it.cantidad} onChange={(e) => set(idx, { cantidad: Number(e.target.value) })} />
            </FormField>
            <FormField label="Precio" htmlFor={`precio-${idx}`}>
              <Input id={`precio-${idx}`} type="number" value={it.precioUni} onChange={(e) => set(idx, { precioUni: Number(e.target.value) })} />
            </FormField>
            <FormField label="Descuento" htmlFor={`desc2-${idx}`}>
              <Input id={`desc2-${idx}`} type="number" value={it.montoDescuento ?? 0} onChange={(e) => set(idx, { montoDescuento: Number(e.target.value) })} />
            </FormField>
          </div>
          <div className="mt-2 text-right">
            <button type="button" className="text-xs text-rojo" onClick={() => quitar(idx)}>Eliminar ítem</button>
          </div>
        </div>
      ))}
      <Button variant="ghost" onClick={agregar}>+ Agregar ítem</Button>
    </section>
  )
}
```

```tsx
// src/features/facturacion/components/CierrePagoSection.tsx
import { Button, FormField, Input } from '@/design-system'
import { useCatalogo } from '../hooks'
import type { FormPago } from '../mappers'

interface Props {
  pagos: FormPago[]
  onChange: (pagos: FormPago[]) => void
}

export function CierrePagoSection({ pagos, onChange }: Props) {
  const formas = useCatalogo('formasPago')
  const set = (idx: number, patch: Partial<FormPago>) => onChange(pagos.map((p, i) => (i === idx ? { ...p, ...patch } : p)))
  const agregar = () => onChange([...pagos, { catFormaPagoId: formas.data?.[0]?.id ?? 1, monto: 0 }])
  const quitar = (idx: number) => onChange(pagos.filter((_, i) => i !== idx))
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate">Cierre de pago</h2>
      {pagos.map((p, idx) => (
        <div key={idx} className="grid grid-cols-2 gap-2">
          <FormField label="Forma de pago" htmlFor={`fp-${idx}`}>
            <select id={`fp-${idx}`} className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-[#16241f]"
              value={p.catFormaPagoId} onChange={(e) => set(idx, { catFormaPagoId: Number(e.target.value) })}>
              {(formas.data ?? []).map((f) => <option key={f.id} value={f.id}>{f.valor}</option>)}
            </select>
          </FormField>
          <FormField label="Monto" htmlFor={`monto-${idx}`}>
            <Input id={`monto-${idx}`} type="number" value={p.monto} onChange={(e) => set(idx, { monto: Number(e.target.value) })} />
          </FormField>
          {pagos.length > 1 && <button type="button" className="text-xs text-rojo" onClick={() => quitar(idx)}>Quitar</button>}
        </div>
      ))}
      <Button variant="ghost" onClick={agregar}>+ Agregar pago</Button>
    </section>
  )
}
```

- [ ] **Step 4: Implementar `EmitirFacturaPage.tsx`**

```tsx
// src/features/facturacion/pages/EmitirFacturaPage.tsx
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, useToast } from '@/design-system'
import { useAuthStore } from '@/app/auth-store'
import { DatosGeneralesSection } from '../components/DatosGeneralesSection'
import { CuerpoDocumentoTable } from '../components/CuerpoDocumentoTable'
import { CierrePagoSection } from '../components/CierrePagoSection'
import { TotalesPanel } from '../components/TotalesPanel'
import { VistaPreviaDte } from '../components/VistaPreviaDte'
import { facturaFormSchema } from '../schemas'
import { buildCreateFacturaDto, type FormItem, type FormPago, type FacturaFormValues } from '../mappers'
import { useEmitirFactura } from '../hooks'
import type { ReceptorListItem } from '../types'

function ahora() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return { fecha: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, hora: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` }
}

export function EmitirFacturaPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const user = useAuthStore((s) => s.user)
  const emitir = useEmitirFactura()

  const [paso, setPaso] = useState<'captura' | 'preview'>('captura')
  const [sucursalId, setSucursalId] = useState<number>(user?.sucursalIds?.[0] ?? 1)
  const [esConsumidorFinal, setEsConsumidorFinal] = useState(true)
  const [receptor, setReceptor] = useState<ReceptorListItem | null>(null)
  const [vendedorId, setVendedorId] = useState<number | null>(null)
  const [condicionOperacion, setCondicionOperacion] = useState(1)
  const [items, setItems] = useState<FormItem[]>([])
  const [pagos, setPagos] = useState<FormPago[]>([{ catFormaPagoId: 1, monto: 0 }])

  const values: FacturaFormValues = {
    sucursalId, esConsumidorFinal, receptorId: receptor?.id ?? null, vendedorId, condicionOperacion, items, pagos,
  }

  const dtoPreview = useMemo(() => {
    try { return buildCreateFacturaDto(values, ahora()) } catch { return null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso])

  const irAPreview = () => {
    const res = facturaFormSchema.safeParse(values)
    if (!res.success) {
      toast.show(res.error.issues[0]?.message ?? 'Revise el formulario', 'error')
      return
    }
    setPaso('preview')
  }

  const onEmitir = async () => {
    try {
      const dto = buildCreateFacturaDto(values, ahora())
      const factura = await emitir.mutateAsync(dto)
      toast.show('Factura emitida (pendiente de envío a MH)', 'success')
      navigate(`/facturacion/${factura.id}`)
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'No se pudo emitir la factura'
      toast.show(msg, 'error')
    }
  }

  if (paso === 'preview' && dtoPreview) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Button variant="ghost" onClick={() => setPaso('captura')} className="mb-4">‹ Atrás</Button>
        <VistaPreviaDte dto={dtoPreview} ambiente="00" onEmitir={onEmitir} emitiendo={emitir.isPending} />
      </div>
    )
  }

  return (
    <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-ink">Emitir Factura (01)</h1>
        <DatosGeneralesSection
          sucursalId={sucursalId} onSucursalId={setSucursalId}
          esConsumidorFinal={esConsumidorFinal} onEsConsumidorFinal={setEsConsumidorFinal}
          receptor={receptor} onReceptor={setReceptor}
          vendedorId={vendedorId} onVendedorId={setVendedorId}
          condicionOperacion={condicionOperacion} onCondicionOperacion={setCondicionOperacion}
        />
        <CuerpoDocumentoTable items={items} onChange={setItems} sucursalId={sucursalId} />
        <CierrePagoSection pagos={pagos} onChange={setPagos} />
        <Button onClick={irAPreview}>Revisar y emitir ›</Button>
      </div>
      <TotalesPanel items={items} />
    </div>
  )
}
```

Nota: si `useToast().show` tuviera otra firma en el design system, ajusta la llamada al API real de `useToast` (ver `src/design-system/Toast.tsx`). El test usa `ToastProvider`.

- [ ] **Step 5: Ejecutar y verificar que pasa**

Run: `npx vitest run src/features/facturacion/pages/EmitirFacturaPage.test.tsx`
Expected: PASS. Si falla por la firma de `useToast` o labels, ajustar el componente a la API real verificada en `src/design-system/Toast.tsx` y `FormField.tsx` y re-ejecutar.

- [ ] **Step 6: Commit**

```bash
git add src/features/facturacion/components/DatosGeneralesSection.tsx src/features/facturacion/components/CuerpoDocumentoTable.tsx src/features/facturacion/components/CierrePagoSection.tsx src/features/facturacion/pages/EmitirFacturaPage.tsx src/features/facturacion/pages/EmitirFacturaPage.test.tsx
git commit -m "feat(facturacion): página de emisión de Factura 01 (captura + vista previa)"
```

---

## Task 15: Historial (`pages/HistorialPage.tsx`)

**Files:**
- Create: `src/features/facturacion/pages/HistorialPage.tsx`
- Test: `src/features/facturacion/pages/HistorialPage.test.tsx`

**Interfaces:**
- Consumes: `useHistorial` (Task 7); `Table` con `serverPagination` (Task 9); `EmptyState`, `Spinner`, `Badge` (design system); `useNavigate`.
- Produces: ruta `/facturacion/historial`.

- [ ] **Step 1: Escribir el test que falla**

```tsx
// src/features/facturacion/pages/HistorialPage.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { HistorialPage } from './HistorialPage'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/facturacion/historial']}>
        <Routes>
          <Route path="/facturacion/historial" element={<HistorialPage />} />
          <Route path="/facturacion/:id" element={<div>Detalle</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('HistorialPage', () => {
  it('lista facturas del backend', async () => {
    setup()
    expect(await screen.findByText('DTE-01-00000000-000000000000001')).toBeInTheDocument()
    expect(screen.getByText('Consumidor Final')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npx vitest run src/features/facturacion/pages/HistorialPage.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar la página**

```tsx
// src/features/facturacion/pages/HistorialPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Input, Spinner, EmptyState, Badge } from '@/design-system'
import { useHistorial } from '../hooks'
import type { FacturaListItem } from '../types'

export function HistorialPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { data, isLoading, isError } = useHistorial({ pageNumber: page, pageSize: 10, search: search || undefined })

  const columns = [
    { key: 'numeroControl', header: 'Número de control' },
    { key: 'fechaEmision', header: 'Fecha', render: (r: FacturaListItem) => r.fechaEmision.slice(0, 10) },
    { key: 'receptorNombre', header: 'Receptor' },
    { key: 'totalPagar', header: 'Total', render: (r: FacturaListItem) => `$${r.totalPagar.toFixed(2)}` },
    { key: 'estadoHacienda', header: 'Estado', render: (r: FacturaListItem) => <Badge>{r.estadoHacienda}</Badge> },
    { key: 'acciones', header: '', render: (r: FacturaListItem) => <button className="text-xs text-sello" onClick={() => navigate(`/facturacion/${r.id}`)}>Ver</button> },
  ]

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-semibold text-ink">Historial de DTEs</h1>
      <Input placeholder="Buscar por número, código o receptor" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      {isLoading && <Spinner />}
      {isError && <EmptyState title="Error" description="No se pudo cargar el historial." />}
      {data && data.items.length === 0 && <EmptyState title="Sin DTEs" description="Aún no hay facturas emitidas." />}
      {data && data.items.length > 0 && (
        <Table
          columns={columns}
          rows={data.items}
          getRowKey={(r) => r.id}
          serverPagination={{ page: data.pageNumber, totalPages: data.totalPages, onPageChange: setPage }}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npx vitest run src/features/facturacion/pages/HistorialPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/facturacion/pages/HistorialPage.tsx src/features/facturacion/pages/HistorialPage.test.tsx
git commit -m "feat(facturacion): historial de DTEs con paginación de servidor"
```

---

## Task 16: Detalle + anular/invalidar (`pages/DteDetallePage.tsx`, `components/AnularInvalidarModal.tsx`)

**Files:**
- Create: `src/features/facturacion/components/AnularInvalidarModal.tsx`
- Create: `src/features/facturacion/pages/DteDetallePage.tsx`
- Test: `src/features/facturacion/pages/DteDetallePage.test.tsx`

**Interfaces:**
- Consumes: `useFactura`, `useAnularFactura` (Task 7); `VistaPreviaDte` (Task 13); `Modal`, `Button`, `FormField`, `Input`, `Spinner`, `useToast` (design system); `useParams`.
- Produces: ruta `/facturacion/:id`.
- **Alcance F5.1:** solo **anulación** (operación local). El flujo de **invalidación** (evento oficial a MH) se difiere a F5.4 — los `usePuedeInvalidar`/`facturacionApi.puedeInvalidar` quedan provistos pero no se cablean en la UI aquí.

- [ ] **Step 1: Escribir el test que falla**

```tsx
// src/features/facturacion/pages/DteDetallePage.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '@/design-system'
import { DteDetallePage } from './DteDetallePage'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/facturacion/10']}>
        <ToastProvider>
          <Routes>
            <Route path="/facturacion/:id" element={<DteDetallePage />} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('DteDetallePage', () => {
  it('muestra el DTE y permite anular con motivo', async () => {
    setup()
    expect(await screen.findByText(/DTE-01-00000000-000000000000001/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /anular/i }))
    await userEvent.type(screen.getByLabelText(/motivo/i), 'Error de digitación')
    await userEvent.click(screen.getByRole('button', { name: /confirmar anulación/i }))
    expect(await screen.findByText(/anulada/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npx vitest run src/features/facturacion/pages/DteDetallePage.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar el modal y la página**

```tsx
// src/features/facturacion/components/AnularInvalidarModal.tsx
import { useState } from 'react'
import { Modal, Button, FormField, Input } from '@/design-system'

interface Props {
  abierto: boolean
  onCerrar: () => void
  onConfirmar: (motivo: string) => void
  cargando?: boolean
}

export function AnularInvalidarModal({ abierto, onCerrar, onConfirmar, cargando }: Props) {
  const [motivo, setMotivo] = useState('')
  if (!abierto) return null
  return (
    <Modal onClose={onCerrar} title="Anular factura">
      <div className="space-y-3">
        <FormField label="Motivo de anulación" htmlFor="motivo">
          <Input id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </FormField>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCerrar}>Cancelar</Button>
          <Button disabled={!motivo.trim() || cargando} onClick={() => onConfirmar(motivo.trim())}>Confirmar anulación</Button>
        </div>
      </div>
    </Modal>
  )
}
```

```tsx
// src/features/facturacion/pages/DteDetallePage.tsx
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Spinner, useToast } from '@/design-system'
import { useFactura, useAnularFactura } from '../hooks'
import { VistaPreviaDte } from '../components/VistaPreviaDte'
import { AnularInvalidarModal } from '../components/AnularInvalidarModal'
import type { CreateFacturaDto } from '../types'

export function DteDetallePage() {
  const { id } = useParams()
  const facturaId = Number(id)
  const toast = useToast()
  const { data, isLoading } = useFactura(facturaId)
  const anular = useAnularFactura()
  const [modal, setModal] = useState(false)

  if (isLoading || !data) return <div className="p-6"><Spinner /></div>

  // La respuesta del backend cumple la forma necesaria para la vista previa.
  const dto = data as unknown as CreateFacturaDto

  const onConfirmar = async (motivo: string) => {
    try {
      await anular.mutateAsync({ id: facturaId, dto: { motivo } })
      toast.show('Factura anulada', 'success')
      setModal(false)
    } catch {
      toast.show('No se pudo anular la factura', 'error')
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">{data.numeroControl}</h1>
        <Button variant="ghost" onClick={() => setModal(true)}>Anular</Button>
      </div>
      <VistaPreviaDte dto={dto} codigoGeneracion={data.codigoGeneracion} ambiente="00" />
      <AnularInvalidarModal abierto={modal} onCerrar={() => setModal(false)} onConfirmar={onConfirmar} cargando={anular.isPending} />
    </div>
  )
}
```

Nota: confirmar la firma real de `Modal` (`onClose`/`title` o `isOpen`) en `src/design-system/Modal.tsx` y ajustar props si difiere.

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npx vitest run src/features/facturacion/pages/DteDetallePage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/facturacion/components/AnularInvalidarModal.tsx src/features/facturacion/pages/DteDetallePage.tsx src/features/facturacion/pages/DteDetallePage.test.tsx
git commit -m "feat(facturacion): detalle del DTE con anulación"
```

---

## Task 17: Cablear rutas y navegación

**Files:**
- Modify: `src/app/router.tsx`
- Modify: `src/app/nav-config.ts`
- Modify: `src/app/router.test.tsx` (añadir caso)

**Interfaces:**
- Consumes: `EmitirFacturaPage`, `HistorialPage`, `DteDetallePage` (Tasks 14–16).

- [ ] **Step 1: Añadir test de ruta que falla**

Añadir a `src/app/router.test.tsx` un caso que verifique que `/facturacion/historial` monta el historial (usar el patrón existente del archivo; si el archivo ya mockea auth, reutilizarlo). Ejemplo de caso a insertar dentro del `describe` existente:

```tsx
it('la ruta /facturacion/historial está protegida y monta el historial', async () => {
  // (reutiliza el helper de render del archivo y el store autenticado del test existente)
  // Tras render con initialEntries=['/facturacion/historial'] y sesión authenticated:
  // expect(await screen.findByText(/Historial de DTEs/i)).toBeInTheDocument()
})
```

Si el `router.test.tsx` existente no facilita inyectar `initialEntries`, basta con verificar manualmente en el Step 4 (build) y dejar la cobertura de rutas en los tests de página. En ese caso, omite este step de test y documenta el cableado.

- [ ] **Step 2: Cablear `router.tsx`**

Reemplazar el bloque de rutas protegidas para incluir facturación:

```tsx
// src/app/router.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { AppLayout } from './AppLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { FirstLoginPage } from '@/features/auth/FirstLoginPage'
import { DashboardPlaceholder } from '@/features/dashboard/DashboardPlaceholder'
import { UiKitPage } from '@/features/ui-kit/UiKitPage'
import { EmitirFacturaPage } from '@/features/facturacion/pages/EmitirFacturaPage'
import { HistorialPage } from '@/features/facturacion/pages/HistorialPage'
import { DteDetallePage } from '@/features/facturacion/pages/DteDetallePage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/first-login" element={<FirstLoginPage />} />
      <Route path="/ui-kit" element={<UiKitPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPlaceholder />} />
          <Route path="/facturacion/emitir" element={<EmitirFacturaPage />} />
          <Route path="/facturacion/historial" element={<HistorialPage />} />
          <Route path="/facturacion/:id" element={<DteDetallePage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
```

- [ ] **Step 3: Ajustar `nav-config.ts`**

```ts
// src/app/nav-config.ts
export interface NavItem { label: string; to: string }
export interface NavSection { title: string | null; items: NavItem[] }
export const navSections: NavSection[] = [
  { title: null, items: [{ label: 'Dashboard', to: '/dashboard' }] },
  { title: 'Facturación', items: [
    { label: 'Emitir DTE', to: '/facturacion/emitir' },
    { label: 'Historial', to: '/facturacion/historial' },
  ] },
  { title: 'Inventario', items: [
    { label: 'Productos', to: '/inventario/productos' },
    { label: 'Stock', to: '/inventario/stock' },
  ] },
  { title: 'Configuración', items: [{ label: 'Usuarios', to: '/config/usuarios' }] },
]
```

(Se retira "Recibidos" hasta F5.4.)

- [ ] **Step 4: Verificar build y suite completa**

Run: `npm run build && npx vitest run src/app`
Expected: build OK; tests de `src/app` verdes.

- [ ] **Step 5: Commit**

```bash
git add src/app/router.tsx src/app/nav-config.ts src/app/router.test.tsx
git commit -m "feat(facturacion): cablea rutas y navegación de Facturación"
```

---

## Task 18: Semilla del emisor de pruebas (documentación operativa)

**Files:**
- Create: `docs/operaciones/semilla-emisor-pruebas.md`

**Interfaces:** documentación; sin código de app. Habilita el e2e manual (Task 19).

- [ ] **Step 1: Crear el documento de semilla**

Escribir `docs/operaciones/semilla-emisor-pruebas.md` con:
- Pasos para levantar `docker compose up --build` desde `FraFactu-Backend` (ver memoria `frafactu-arranque-local`).
- Script SQL (psql en el contenedor Postgres) para: (a) INSERT de rol `EmisorAdmin`; (b) INSERT de un `Emisor` de pruebas con datos fiscales mínimos, `codEstable`, `codPuntoVenta`, ambiente `00` (Pruebas) y sin certificado; (c) INSERT de una `Sucursal` ligada al emisor; (d) INSERT de un `Usuario` admin con `PasswordResetTokenHash` (sha256 de un token controlado) y `EmisorId`/`SucursalId`; (e) opcional: un `ProductoServicio` y un `Receptor` de prueba.
- Paso `POST /api/auth/reset-password { token, newPassword, confirmPassword }` para fijar la contraseña vía BCrypt.
- Verificación: `POST /api/auth/login` devuelve JWT con `emisorId`/`sucursalIds`.

> Nota: los nombres exactos de columnas/tablas deben confirmarse contra el `ModelSnapshot`/migraciones del backend al ejecutar (la estructura de `Emisores`, `Sucursales`, `Usuarios`, `Roles`). El documento debe listar el SQL real verificado contra el esquema, no plantillas. Si una columna obligatoria del `Emisor` impide el INSERT, completar con valores de prueba y registrarlo.

- [ ] **Step 2: Commit**

```bash
git add docs/operaciones/semilla-emisor-pruebas.md
git commit -m "docs(facturacion): semilla del emisor de pruebas para e2e de F5.1"
```

---

## Task 19: Verificación de cierre (build + test + lint + e2e manual)

**Files:** ninguno (verificación).

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: 0 errores. Corregir cualquier hallazgo (imports sin usar, `any`, etc.) y volver a ejecutar.

- [ ] **Step 2: Tests completos**

Run: `npm run test`
Expected: TODAS las suites verdes (auth previas + facturación nuevas).

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: `tsc -b` sin errores + `vite build` OK.

- [ ] **Step 4: e2e manual contra Docker** (requiere la máquina del usuario)

1. Levantar backend+frontend con Docker (`docker compose up --build` desde `FraFactu-Backend`).
2. Ejecutar la semilla del emisor de pruebas (Task 18).
3. Login en `http://localhost:5173`. Ir a Facturación → Emitir DTE.
4. Capturar un ítem (producto de prueba o manual), forma de pago que cuadre, revisar vista previa (totales, QR, total en letras), Emitir → queda PENDIENTE.
5. Verificar en Historial que aparece; abrir detalle; Anular con motivo.
6. Confirmar que totales/tributos no producen 400 del backend.

Registrar el resultado del e2e (qué pasó, qué quedó diferido por falta de MH).

- [ ] **Step 5: Commit final (si hubo correcciones de lint/types)**

```bash
git add -A
git commit -m "chore(facturacion): correcciones de lint/types tras verificación de cierre"
```

---

## Notas de cierre

- **PR por web** (correlativo #5) desde `feat/f5-1-facturacion-factura01` hacia `development`. Esperar CI verde.
- Tras el merge, actualizar memoria (`frafactu-estado-f5` o similar) con el estado de F5.1 y los puntos diferidos (transmisión MH, CCF/FSE/NC/ND, gestión).
- **Diferido a F5.2+:** entrada manual de receptor (CCF lo exige), cálculo CCF (IVA neto)/FSE (retenciones), NC/ND con documentos relacionados, lotes/recibidos/compras/CxC y transmisión real a MH.
