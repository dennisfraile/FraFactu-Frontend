# F5.4 — S4: DTEs recibidos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el frontend de "DTEs recibidos" (carga manual de CCF, listado/detalle/descartar, asistente mapear-y-crear-compra, y Gmail OAuth+lectura asíncrona cableados con e2e diferido), espejo de la feature `compras`.

**Architecture:** Nueva feature `src/features/dtes-recibidos/` con la misma estructura que `compras/` (api, hooks, types, schemas, mappers, estado, calc, components, pages). React Query para datos y polling (`refetchInterval`, sin `useEffect`+setState). El asistente de mapeo usa el **layout A** (tabla de líneas en una sola pantalla, cada fila con clasificador Existente/Nuevo/Gasto + panel de cuadre). Reusa `productosApi`/`bodegasApi`/`sucursalesApi`/`useCatalogo` de facturación y `tiposGastoApi` de compras.

**Tech Stack:** React 18 + TypeScript + Vite, React Router, @tanstack/react-query v5, zod, MSW + Vitest + @testing-library/react, Tailwind (design-system propio).

## Global Constraints

- Rutas del backend **SIN kebab-case**: `/api/dtesrecibidos`, `/api/emisores`. Base axios `@/lib/http/axios` (la base ya incluye `/api`; en MSW la base es `http://localhost:8080/api`).
- El envoltorio paginado de DTEs es `{ items, total, pagina, tamanoPagina, totalPaginas }` (DISTINTO del `PagedResult` de compras `{ totalItems, pageNumber, pageSize, totalPages }`).
- Fechas que se envían al backend en UTC ISO (`...T00:00:00Z`), nunca `yyyy-MM-dd`. (En S4 casi no se envían fechas como cuerpo; aplica si surge.)
- ESLint prohíbe `react-hooks/set-state-in-effect`: para precargar formularios usar patrón loader externo + inner-form con `key`; para polling usar `refetchInterval` de React Query. **Nunca** `useEffect`+`setState`.
- `npm run build` debe pasar tras cada tarea (vitest NO detecta errores de `tsc`). GATE por tarea: `npm run build` + `npm run test` + `npm run lint`, todo en 0.
- Solo se ingieren CCF (tipo `03`); el backend rechaza el resto en `cargar-json`/`leer-correo`.
- Roles backend (espejo en nav/acciones): ver lista/detalle/estadísticas = EmisorAdmin/GerenteSucursal/Contador/Auditor; acciones (cargar, leer, descartar, mapear) = EmisorAdmin/GerenteSucursal; config Gmail = EmisorAdmin.
- El asistente de mapeo: la suma de totales de línea debe coincidir con `DteRecibido.Total` ±0.01 (validado en el front antes de enviar; el backend revalida).

---

## File Structure

```
src/features/dtes-recibidos/
├── types.ts                       # DTOs espejo del backend
├── estado.ts                      # estado DTE → tono Badge
├── parse.ts                       # parseDteLineas(jsonDte) → DteLineaParsed[]
├── calc/
│   ├── mapeo.ts                   # round2, totalLineaMapeo, calcCuadre
│   └── mapeo.test.ts
├── parse.test.ts
├── estado.test.ts
├── api.ts                         # dtesRecibidosApi (/dtesrecibidos)
├── gmail-api.ts                   # gmailApi (/emisores/gmail-*) + emisorPerfilApi (mi-perfil)
├── hooks.ts                       # React Query hooks (datos, polling, gmail)
├── hooks.test.tsx
├── mappers.ts                     # MapeoFormValues, lineaDesdeParsed, buildMapearDto
├── mappers.test.ts
├── schemas.ts                     # mapeoSchema, leerCorreoSchema
├── schemas.test.ts
├── components/
│   ├── DescartarDteModal.tsx
│   ├── DescartarDteModal.test.tsx
│   ├── CargarJsonModal.tsx
│   ├── CargarJsonModal.test.tsx
│   ├── LeerCorreoModal.tsx
│   ├── LeerCorreoModal.test.tsx
│   ├── MapeoLineasTable.tsx
│   └── MapeoLineasTable.test.tsx
├── pages/
│   ├── DtesRecibidosListPage.tsx
│   ├── DtesRecibidosListPage.test.tsx
│   ├── DteRecibidoDetallePage.tsx
│   ├── DteRecibidoDetallePage.test.tsx
│   ├── MapearDtePage.tsx
│   ├── MapearDtePage.test.tsx
│   ├── ConfiguracionCorreoPage.tsx
│   ├── ConfiguracionCorreoPage.test.tsx
│   ├── GmailCallbackPage.tsx
│   └── GmailCallbackPage.test.tsx
src/test/msw/dtes-recibidos-handlers.ts   # handlers MSW (+ registrar en handlers.ts)
src/app/router.tsx                          # +5 rutas (modificar)
src/app/nav-config.ts                       # +item nav (modificar)
src/design-system/Icon.tsx                  # +icono 'recibidos' (modificar)
```

---

## Task 1: Tipos y estado

**Files:**
- Create: `src/features/dtes-recibidos/types.ts`
- Create: `src/features/dtes-recibidos/estado.ts`
- Test: `src/features/dtes-recibidos/estado.test.ts`

**Interfaces:**
- Produces: todos los tipos del feature (consumidos por casi todas las tareas) y `tonoDteRecibido(estado)`.

- [ ] **Step 1: Escribir `types.ts`** (sin test; solo tipos)

```typescript
// src/features/dtes-recibidos/types.ts
// Tipos TS espejo de los DTOs del backend (camelCase en el JSON).

// El listado de DTEs devuelve este envoltorio (≠ PagedResult de compras).
export interface PagedDtes<T> {
  items: T[]
  total: number
  pagina: number
  tamanoPagina: number
  totalPaginas: number
}

export type EstadoDteRecibido = 'PENDIENTE' | 'VINCULADO' | 'DESCARTADO'
export type AccionMapeo = 'PRODUCTO_EXISTENTE' | 'PRODUCTO_NUEVO' | 'GASTO'

export interface DteRecibidoResumenDto {
  id: number
  codigoGeneracion: string
  tipoDte: string
  numeroControl?: string | null
  fechaEmision: string
  emisorNit: string
  emisorNombre: string
  total: number
  estado: EstadoDteRecibido
  compraExternaId?: number | null
  fechaCreacion: string
}

export interface DteRecibidoDto {
  id: number
  codigoGeneracion: string
  selloRecibido?: string | null
  tipoDte: string
  numeroControl?: string | null
  fechaEmision: string
  emisorNit: string
  emisorNombre: string
  emisorNrc?: string | null
  receptorNit?: string | null
  receptorNombre?: string | null
  jsonDte: string
  montoGravado: number
  montoExento: number
  montoNoSujeto: number
  subTotal: number
  iva: number
  total: number
  estado: EstadoDteRecibido
  compraExternaId?: number | null
  motivoDescarte?: string | null
  emailOrigen?: string | null
  fechaRecepcionEmail?: string | null
  fechaCreacion: string
  fechaActualizacion?: string | null
}

export interface ListarDtesParams {
  pagina?: number
  tamanoPagina?: number
  estado?: string
  tipoDte?: string
  emisorNit?: string
  fechaDesde?: string
  fechaHasta?: string
  search?: string
  sortBy?: string
  sortDesc?: boolean
}

export interface DteEstadisticasDto {
  totalPendientes: number
  totalVinculados: number
  totalDescartados: number
  total: number
  montoTotalPendientes: number
  ultimaLectura?: string | null
}

// ---- Carga manual ----
export interface CargaArchivoResultado {
  archivo: string
  resultado: string // "Cargado" | "Duplicado" | "NoEsCCF" | "ReceptorInvalido" | "ContenidoInvalido" | "ErrorLectura"
  codigoGeneracion?: string | null
  mensaje: string
}
export interface CargaMasivaResponse {
  totalArchivos: number
  cargados: number
  duplicados: number
  rechazados: number
  resultados: CargaArchivoResultado[]
}

// ---- Lectura de correo (asíncrona) ----
export interface EncolarLecturaRequest {
  mesInicio?: string // "YYYY-MM"
  mesFin?: string
}
export interface EncolarLecturaResponse {
  jobId: number
  estado: string
  mensaje: string
}
export interface EstadoLecturaJob {
  jobId: number
  estado: string // ENCOLADO | EN_PROGRESO | COMPLETADO | FALLIDO
  fechaCreacion: string
  fechaInicio?: string | null
  fechaFin?: string | null
  correosProcesados: number
  dtesEncontrados: number
  dtesNuevos: number
  dtesDuplicados: number
  errores: number
  mensajeError?: string | null
  dtesIgnorados: number
  rangoDesde?: string | null
  rangoHasta?: string | null
  esAutomatico: boolean
  terminado: boolean
}

export interface ConfiguracionLecturaDto {
  lecturaCorreoHabilitada: boolean
}

// ---- Mapeo (asistente) ----
export interface ProductoNuevoMapeoDto {
  codigo: string
  nombre: string
  catTipoItemId: number
  catUnidadMedidaId: number
  categoriaId?: number | null
  tipoInventario: number // 0=Ventas, 1=MobiliarioEquipo, 2=Insumos
  aniosVidaUtil?: number | null
  valorResidual?: number | null
}
export interface MapearItemDto {
  descripcionDte: string
  montoDte: number
  accion: AccionMapeo
  productoId?: number | null
  productoNuevo?: ProductoNuevoMapeoDto | null
  cantidad?: number | null
  bodegaId?: number | null
  costoUnitario?: number | null
  catTipoGastoId?: number | null
}
export interface MapearDteCompraDto {
  sucursalId: number
  items: MapearItemDto[]
}
export interface MapearDteCompraResponse {
  compraId: number
  totalMapeado: number
  totalDte: number
  itemsProductos: number
  itemsGastos: number
  productosCreados: number
}

// ---- Gmail / perfil emisor ----
export interface EmisorPerfilGmail {
  gmailEmail?: string | null
  gmailConectado: boolean
  lecturaCorreoHabilitada: boolean
  ultimaLecturaCorreo?: string | null
}
```

- [ ] **Step 2: Escribir el test de `estado.ts`**

```typescript
// src/features/dtes-recibidos/estado.test.ts
import { describe, it, expect } from 'vitest'
import { tonoDteRecibido } from './estado'

describe('tonoDteRecibido', () => {
  it('mapea cada estado a su tono', () => {
    expect(tonoDteRecibido('VINCULADO')).toBe('recibido')
    expect(tonoDteRecibido('DESCARTADO')).toBe('rechazado')
    expect(tonoDteRecibido('PENDIENTE')).toBe('borrador')
  })
})
```

- [ ] **Step 3: Correr el test (debe fallar)**

Run: `npm run test -- src/features/dtes-recibidos/estado.test.ts`
Expected: FAIL ("Cannot find module './estado'").

- [ ] **Step 4: Escribir `estado.ts`**

```typescript
// src/features/dtes-recibidos/estado.ts
import type { EstadoDteRecibido } from './types'

export type TonoDte = 'recibido' | 'rechazado' | 'borrador'

export function tonoDteRecibido(estado: EstadoDteRecibido): TonoDte {
  if (estado === 'VINCULADO') return 'recibido'
  if (estado === 'DESCARTADO') return 'rechazado'
  return 'borrador'
}
```

- [ ] **Step 5: Correr el test (debe pasar) + build**

Run: `npm run test -- src/features/dtes-recibidos/estado.test.ts && npm run build`
Expected: PASS y build OK.

- [ ] **Step 6: Commit**

```bash
git add src/features/dtes-recibidos/types.ts src/features/dtes-recibidos/estado.ts src/features/dtes-recibidos/estado.test.ts
git commit -m "feat(f5.4-s4): tipos y estado de DTEs recibidos"
```

---

## Task 2: Parseo de líneas del DTE

**Files:**
- Create: `src/features/dtes-recibidos/parse.ts`
- Test: `src/features/dtes-recibidos/parse.test.ts`

**Interfaces:**
- Consumes: `round2` de `./calc/mapeo` (Task 3) — para evitar dependencia circular en orden de tareas, `parse.ts` define el cálculo con un `round2` local importado de `./calc/mapeo`. **Implementar Task 3 antes o a la par** (mismo commit no es necesario; basta que `calc/mapeo.ts` exista). Si se ejecuta Task 2 primero, crear `calc/mapeo.ts` con solo `round2` y completarlo en Task 3.
- Produces: `DteLineaParsed`, `parseDteLineas(jsonDte: string): DteLineaParsed[]`.

- [ ] **Step 1: Asegurar `round2` disponible** — si `src/features/dtes-recibidos/calc/mapeo.ts` no existe aún, créalo con:

```typescript
// src/features/dtes-recibidos/calc/mapeo.ts (se completa en Task 3)
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}
```

- [ ] **Step 2: Escribir el test**

```typescript
// src/features/dtes-recibidos/parse.test.ts
import { describe, it, expect } from 'vitest'
import { parseDteLineas } from './parse'

const json = JSON.stringify({
  cuerpoDocumento: [
    { numItem: 1, codigo: 'P-1', uniMedida: 59, descripcion: 'Papel bond', cantidad: 50, precioUni: 4.5, montoDescu: 0, ventaNoSuj: 0, ventaExenta: 0, ventaGravada: 225 },
    { numItem: 2, codigo: null, descripcion: 'Flete', cantidad: 1, precioUni: 10, montoDescu: 0, ventaNoSuj: 0, ventaExenta: 0, ventaGravada: 10 },
  ],
})

describe('parseDteLineas', () => {
  it('parsea cada ítem del cuerpo del documento', () => {
    const lineas = parseDteLineas(json)
    expect(lineas).toHaveLength(2)
    expect(lineas[0]).toMatchObject({ numItem: 1, codigo: 'P-1', descripcion: 'Papel bond', cantidad: 50, precioUnitario: 4.5, ventaGravada: 225, unidadMedida: 59 })
    // montoConIva = round2(225*1.13) = 254.25
    expect(lineas[0].montoConIva).toBe(254.25)
  })

  it('devuelve [] ante JSON inválido o sin cuerpo', () => {
    expect(parseDteLineas('no-json')).toEqual([])
    expect(parseDteLineas(JSON.stringify({}))).toEqual([])
  })
})
```

- [ ] **Step 3: Correr el test (debe fallar)**

Run: `npm run test -- src/features/dtes-recibidos/parse.test.ts`
Expected: FAIL ("Cannot find module './parse'").

- [ ] **Step 4: Escribir `parse.ts`**

```typescript
// src/features/dtes-recibidos/parse.ts
import { round2 } from './calc/mapeo'

export interface DteLineaParsed {
  numItem: number
  codigo: string | null
  descripcion: string
  cantidad: number
  precioUnitario: number
  montoDescuento: number
  ventaGravada: number
  ventaExenta: number
  ventaNoSujeta: number
  unidadMedida: number | null
  // Monto sembrado con IVA por línea (gravada*1.13 + exenta + noSujeta - descuento).
  // Es un valor por defecto editable; el cuadre final lo valida el usuario.
  montoConIva: number
}

interface ItemCrudo {
  numItem?: number
  codigo?: string | null
  descripcion?: string
  cantidad?: number
  precioUni?: number
  montoDescu?: number
  ventaGravada?: number
  ventaExenta?: number
  ventaNoSuj?: number
  uniMedida?: number | null
}

export function parseDteLineas(jsonDte: string): DteLineaParsed[] {
  let raw: { cuerpoDocumento?: ItemCrudo[] }
  try {
    raw = JSON.parse(jsonDte)
  } catch {
    return []
  }
  const cuerpo = Array.isArray(raw?.cuerpoDocumento) ? raw.cuerpoDocumento : []
  return cuerpo.map((it, i) => {
    const ventaGravada = Number(it.ventaGravada ?? 0)
    const ventaExenta = Number(it.ventaExenta ?? 0)
    const ventaNoSujeta = Number(it.ventaNoSuj ?? 0)
    const montoDescuento = Number(it.montoDescu ?? 0)
    return {
      numItem: Number(it.numItem ?? i + 1),
      codigo: it.codigo ?? null,
      descripcion: String(it.descripcion ?? ''),
      cantidad: Number(it.cantidad ?? 0),
      precioUnitario: Number(it.precioUni ?? 0),
      montoDescuento,
      ventaGravada,
      ventaExenta,
      ventaNoSujeta,
      unidadMedida: it.uniMedida != null ? Number(it.uniMedida) : null,
      montoConIva: round2(ventaGravada * 1.13 + ventaExenta + ventaNoSujeta - montoDescuento),
    }
  })
}
```

- [ ] **Step 5: Correr el test (debe pasar) + build**

Run: `npm run test -- src/features/dtes-recibidos/parse.test.ts && npm run build`
Expected: PASS y build OK.

- [ ] **Step 6: Commit**

```bash
git add src/features/dtes-recibidos/parse.ts src/features/dtes-recibidos/parse.test.ts src/features/dtes-recibidos/calc/mapeo.ts
git commit -m "feat(f5.4-s4): parseo de líneas del DTE (cuerpoDocumento)"
```

---

## Task 3: Cálculo de cuadre del mapeo

**Files:**
- Modify/Create: `src/features/dtes-recibidos/calc/mapeo.ts`
- Test: `src/features/dtes-recibidos/calc/mapeo.test.ts`

**Interfaces:**
- Produces: `round2`, `AccionMapeo` (re-export desde types), `LineaTotalInput`, `totalLineaMapeo`, `Cuadre`, `calcCuadre`.

- [ ] **Step 1: Escribir el test**

```typescript
// src/features/dtes-recibidos/calc/mapeo.test.ts
import { describe, it, expect } from 'vitest'
import { totalLineaMapeo, calcCuadre } from './mapeo'

describe('totalLineaMapeo', () => {
  it('producto = cantidad × costo', () => {
    expect(totalLineaMapeo({ accion: 'PRODUCTO_EXISTENTE', cantidad: 50, costoUnitario: 5.085, montoDte: 0 })).toBe(254.25)
  })
  it('gasto = montoDte', () => {
    expect(totalLineaMapeo({ accion: 'GASTO', cantidad: 0, costoUnitario: 0, montoDte: 30 })).toBe(30)
  })
})

describe('calcCuadre', () => {
  it('cuadra dentro de ±0.01', () => {
    const r = calcCuadre([{ accion: 'GASTO', cantidad: 0, costoUnitario: 0, montoDte: 254.25 }], 254.25)
    expect(r.cuadra).toBe(true)
    expect(r.diferencia).toBe(0)
  })
  it('no cuadra si difiere más de 0.01', () => {
    const r = calcCuadre([{ accion: 'GASTO', cantidad: 0, costoUnitario: 0, montoDte: 254.25 }], 300)
    expect(r.cuadra).toBe(false)
    expect(r.totalMapeado).toBe(254.25)
  })
})
```

- [ ] **Step 2: Correr el test (debe fallar)**

Run: `npm run test -- src/features/dtes-recibidos/calc/mapeo.test.ts`
Expected: FAIL ("totalLineaMapeo is not a function").

- [ ] **Step 3: Completar `calc/mapeo.ts`**

```typescript
// src/features/dtes-recibidos/calc/mapeo.ts
import type { AccionMapeo } from '../types'

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export interface LineaTotalInput {
  accion: AccionMapeo
  cantidad: number
  costoUnitario: number
  montoDte: number
}

// Producto: cantidad × costo. Gasto: montoDte (incluye IVA prorrateado por línea).
export function totalLineaMapeo(l: LineaTotalInput): number {
  return l.accion === 'GASTO' ? round2(l.montoDte) : round2(l.cantidad * l.costoUnitario)
}

export interface Cuadre {
  totalMapeado: number
  diferencia: number
  cuadra: boolean
}

export function calcCuadre(lineas: LineaTotalInput[], totalDte: number): Cuadre {
  const totalMapeado = round2(lineas.reduce((s, l) => s + totalLineaMapeo(l), 0))
  const diferencia = round2(totalMapeado - totalDte)
  return { totalMapeado, diferencia, cuadra: Math.abs(diferencia) <= 0.01 }
}
```

- [ ] **Step 4: Correr el test (debe pasar) + build**

Run: `npm run test -- src/features/dtes-recibidos/calc/mapeo.test.ts && npm run build`
Expected: PASS y build OK.

- [ ] **Step 5: Commit**

```bash
git add src/features/dtes-recibidos/calc/mapeo.ts src/features/dtes-recibidos/calc/mapeo.test.ts
git commit -m "feat(f5.4-s4): cálculo de cuadre del asistente de mapeo"
```

---

## Task 4: Cliente API, hooks y MSW

**Files:**
- Create: `src/features/dtes-recibidos/api.ts`
- Create: `src/features/dtes-recibidos/gmail-api.ts`
- Create: `src/features/dtes-recibidos/hooks.ts`
- Create: `src/test/msw/dtes-recibidos-handlers.ts`
- Modify: `src/test/msw/handlers.ts`
- Test: `src/features/dtes-recibidos/hooks.test.tsx`

**Interfaces:**
- Consumes: tipos de Task 1; `api` de `@/lib/http/axios`.
- Produces: `dtesRecibidosApi`, `gmailApi`, `emisorPerfilApi`, y hooks: `useDtesRecibidos`, `useDteRecibido`, `useEstadisticasDtes`, `useCargarJson`, `useDescartarDte`, `useMapearYCrearCompra`, `useLeerCorreo`, `useEstadoLecturaCorreo`, `useConfigurarLectura`, `useProbarConexion`, `useMiPerfil`, `useGmailConnect`, `useExchangeGmailCode`, `useGmailDisconnect`.

- [ ] **Step 1: Escribir `api.ts`**

```typescript
// src/features/dtes-recibidos/api.ts
import { api } from '@/lib/http/axios'
import type {
  PagedDtes, DteRecibidoResumenDto, DteRecibidoDto, ListarDtesParams, DteEstadisticasDto,
  CargaMasivaResponse, EncolarLecturaRequest, EncolarLecturaResponse, EstadoLecturaJob,
  ConfiguracionLecturaDto, MapearDteCompraDto, MapearDteCompraResponse,
} from './types'

export const dtesRecibidosApi = {
  async listar(params: ListarDtesParams): Promise<PagedDtes<DteRecibidoResumenDto>> {
    const { data } = await api.get<PagedDtes<DteRecibidoResumenDto>>('/dtesrecibidos', { params })
    return data
  },
  async getById(id: number): Promise<DteRecibidoDto> {
    const { data } = await api.get<DteRecibidoDto>(`/dtesrecibidos/${id}`)
    return data
  },
  async estadisticas(params: ListarDtesParams): Promise<DteEstadisticasDto> {
    const { data } = await api.get<DteEstadisticasDto>('/dtesrecibidos/estadisticas', { params })
    return data
  },
  async cargarJson(archivos: File[]): Promise<CargaMasivaResponse> {
    const fd = new FormData()
    archivos.forEach((f) => fd.append('archivos', f))
    const { data } = await api.post<CargaMasivaResponse>('/dtesrecibidos/cargar-json', fd)
    return data
  },
  async descartar(id: number, motivo: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>(`/dtesrecibidos/${id}/descartar`, { motivo })
    return data
  },
  async mapearYCrearCompra(id: number, dto: MapearDteCompraDto): Promise<MapearDteCompraResponse> {
    const { data } = await api.post<MapearDteCompraResponse>(`/dtesrecibidos/${id}/mapear-y-crear-compra`, dto)
    return data
  },
  async leerCorreo(dto: EncolarLecturaRequest): Promise<EncolarLecturaResponse> {
    const { data } = await api.post<EncolarLecturaResponse>('/dtesrecibidos/leer-correo', dto)
    return data
  },
  async estadoLectura(): Promise<EstadoLecturaJob> {
    const { data } = await api.get<EstadoLecturaJob>('/dtesrecibidos/leer-correo/estado')
    return data
  },
  async configurar(dto: ConfiguracionLecturaDto): Promise<{ message: string }> {
    const { data } = await api.put<{ message: string }>('/dtesrecibidos/configuracion', dto)
    return data
  },
  async probarConexion(): Promise<{ exitoso: boolean; mensaje: string }> {
    const { data } = await api.post<{ exitoso: boolean; mensaje: string }>('/dtesrecibidos/probar-conexion', {})
    return data
  },
}
```

- [ ] **Step 2: Escribir `gmail-api.ts`**

```typescript
// src/features/dtes-recibidos/gmail-api.ts
import { api } from '@/lib/http/axios'
import type { EmisorPerfilGmail } from './types'

export const gmailApi = {
  async connect(): Promise<{ authorizationUrl: string }> {
    const { data } = await api.get<{ authorizationUrl: string }>('/emisores/gmail-connect')
    return data
  },
  async exchangeCode(code: string, state: string): Promise<{ success: boolean; email: string }> {
    const { data } = await api.post<{ success: boolean; email: string }>('/emisores/gmail-exchange-code', { code, state })
    return data
  },
  async disconnect(): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>('/emisores/gmail-disconnect')
    return data
  },
}

export const emisorPerfilApi = {
  async miPerfil(): Promise<EmisorPerfilGmail> {
    const { data } = await api.get<EmisorPerfilGmail>('/emisores/mi-perfil')
    return data
  },
}
```

- [ ] **Step 3: Escribir `hooks.ts`**

```typescript
// src/features/dtes-recibidos/hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dtesRecibidosApi } from './api'
import { gmailApi, emisorPerfilApi } from './gmail-api'
import type { ListarDtesParams, EncolarLecturaRequest, ConfiguracionLecturaDto, MapearDteCompraDto } from './types'

export function useDtesRecibidos(params: ListarDtesParams) {
  return useQuery({ queryKey: ['dtes-recibidos', params], queryFn: () => dtesRecibidosApi.listar(params) })
}

export function useDteRecibido(id: number) {
  return useQuery({ queryKey: ['dte-recibido', id], queryFn: () => dtesRecibidosApi.getById(id), enabled: Number.isFinite(id) })
}

export function useEstadisticasDtes(params: ListarDtesParams) {
  return useQuery({ queryKey: ['dtes-estadisticas', params], queryFn: () => dtesRecibidosApi.estadisticas(params) })
}

function invalidarListados(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['dtes-recibidos'] })
  qc.invalidateQueries({ queryKey: ['dtes-estadisticas'] })
}

export function useCargarJson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (archivos: File[]) => dtesRecibidosApi.cargarJson(archivos),
    onSuccess: () => invalidarListados(qc),
  })
}

export function useDescartarDte() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) => dtesRecibidosApi.descartar(id, motivo),
    onSuccess: (_d, vars) => { invalidarListados(qc); qc.invalidateQueries({ queryKey: ['dte-recibido', vars.id] }) },
  })
}

export function useMapearYCrearCompra() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: MapearDteCompraDto }) => dtesRecibidosApi.mapearYCrearCompra(id, dto),
    onSuccess: (_d, vars) => { invalidarListados(qc); qc.invalidateQueries({ queryKey: ['dte-recibido', vars.id] }); qc.invalidateQueries({ queryKey: ['compras'] }) },
  })
}

export function useLeerCorreo() {
  return useMutation({ mutationFn: (dto: EncolarLecturaRequest) => dtesRecibidosApi.leerCorreo(dto) })
}

// Polling: refetch cada 2s mientras el job no esté terminado. Sin useEffect+setState.
export function useEstadoLecturaCorreo(activo: boolean) {
  return useQuery({
    queryKey: ['lectura-correo-estado'],
    queryFn: () => dtesRecibidosApi.estadoLectura(),
    enabled: activo,
    refetchInterval: (q) => (q.state.data?.terminado ? false : 2000),
  })
}

export function useConfigurarLectura() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: ConfiguracionLecturaDto) => dtesRecibidosApi.configurar(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mi-perfil'] }),
  })
}

export function useProbarConexion() {
  return useMutation({ mutationFn: () => dtesRecibidosApi.probarConexion() })
}

export function useMiPerfil() {
  return useQuery({ queryKey: ['mi-perfil'], queryFn: () => emisorPerfilApi.miPerfil() })
}

export function useGmailConnect() {
  return useMutation({ mutationFn: () => gmailApi.connect() })
}

export function useExchangeGmailCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ code, state }: { code: string; state: string }) => gmailApi.exchangeCode(code, state),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mi-perfil'] }),
  })
}

export function useGmailDisconnect() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => gmailApi.disconnect(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mi-perfil'] }),
  })
}
```

- [ ] **Step 4: Escribir los handlers MSW** `src/test/msw/dtes-recibidos-handlers.ts`

```typescript
// src/test/msw/dtes-recibidos-handlers.ts
import { http, HttpResponse } from 'msw'

const base = 'http://localhost:8080/api'

const jsonDteEjemplo = JSON.stringify({
  identificacion: { tipoDte: '03', numeroControl: 'DTE-03-0001', codigoGeneracion: 'GUID-1', fecEmi: '2026-06-19' },
  emisor: { nit: '06141804941035', nrc: '1234567', nombre: 'DISTRIBUIDORA EL BUEN PRECIO' },
  receptor: { nit: '06140000000000', nombre: 'MI EMPRESA' },
  cuerpoDocumento: [
    { numItem: 1, codigo: 'PROD-001', uniMedida: 59, descripcion: 'Resma de papel bond carta', cantidad: 50, precioUni: 4.5, montoDescu: 0, ventaNoSuj: 0, ventaExenta: 0, ventaGravada: 225 },
  ],
  resumen: { totalGravada: 225, subTotal: 225, montoTotalOperacion: 254.25, totalPagar: 254.25 },
})

export const dteResumenEjemplo = {
  id: 7, codigoGeneracion: 'GUID-1', tipoDte: '03', numeroControl: 'DTE-03-0001',
  fechaEmision: '2026-06-19', emisorNit: '06141804941035', emisorNombre: 'DISTRIBUIDORA EL BUEN PRECIO',
  total: 254.25, estado: 'PENDIENTE', compraExternaId: null, fechaCreacion: '2026-06-20',
}

export const dteDetalleEjemplo = {
  ...dteResumenEjemplo, selloRecibido: 'SELLO-1', emisorNrc: '1234567',
  receptorNit: '06140000000000', receptorNombre: 'MI EMPRESA', jsonDte: jsonDteEjemplo,
  montoGravado: 225, montoExento: 0, montoNoSujeto: 0, subTotal: 225, iva: 29.25,
  motivoDescarte: null, emailOrigen: 'proveedor@x.com', fechaRecepcionEmail: '2026-06-19', fechaActualizacion: null,
}

const dtesPage = { items: [dteResumenEjemplo], total: 1, pagina: 1, tamanoPagina: 20, totalPaginas: 1 }

const estadisticasEjemplo = { totalPendientes: 1, totalVinculados: 0, totalDescartados: 0, total: 1, montoTotalPendientes: 254.25, ultimaLectura: '2026-06-20' }

const jobCompletado = {
  jobId: 1, estado: 'COMPLETADO', fechaCreacion: '2026-06-20', fechaInicio: '2026-06-20', fechaFin: '2026-06-20',
  correosProcesados: 5, dtesEncontrados: 3, dtesNuevos: 2, dtesDuplicados: 1, errores: 0, mensajeError: null,
  dtesIgnorados: 0, rangoDesde: null, rangoHasta: null, esAutomatico: false, terminado: true,
}

export const dtesRecibidosHandlers = [
  http.get(`${base}/dtesrecibidos`, () => HttpResponse.json(dtesPage)),
  http.get(`${base}/dtesrecibidos/estadisticas`, () => HttpResponse.json(estadisticasEjemplo)),
  http.get(`${base}/dtesrecibidos/leer-correo/estado`, () => HttpResponse.json(jobCompletado)),
  http.get(`${base}/dtesrecibidos/:id`, () => HttpResponse.json(dteDetalleEjemplo)),
  http.post(`${base}/dtesrecibidos/cargar-json`, () => HttpResponse.json({
    totalArchivos: 1, cargados: 1, duplicados: 0, rechazados: 0,
    resultados: [{ archivo: 'ccf.json', resultado: 'Cargado', codigoGeneracion: 'GUID-1', mensaje: 'OK' }],
  })),
  http.post(`${base}/dtesrecibidos/:id/descartar`, () => HttpResponse.json({ message: 'DTE descartado exitosamente' })),
  http.post(`${base}/dtesrecibidos/:id/mapear-y-crear-compra`, () => HttpResponse.json({
    compraId: 99, totalMapeado: 254.25, totalDte: 254.25, itemsProductos: 1, itemsGastos: 0, productosCreados: 0,
  })),
  http.post(`${base}/dtesrecibidos/leer-correo`, () => HttpResponse.json({ jobId: 1, estado: 'ENCOLADO', mensaje: 'Encolado' }, { status: 202 })),
  http.put(`${base}/dtesrecibidos/configuracion`, () => HttpResponse.json({ message: 'Configuración actualizada' })),
  http.post(`${base}/dtesrecibidos/probar-conexion`, () => HttpResponse.json({ exitoso: true, mensaje: 'Conexión OK' })),
  // Gmail / perfil
  http.get(`${base}/emisores/mi-perfil`, () => HttpResponse.json({ gmailEmail: null, gmailConectado: false, lecturaCorreoHabilitada: false, ultimaLecturaCorreo: null })),
  http.get(`${base}/emisores/gmail-connect`, () => HttpResponse.json({ authorizationUrl: 'https://accounts.google.com/o/oauth2/auth?x=1' })),
  http.post(`${base}/emisores/gmail-exchange-code`, () => HttpResponse.json({ success: true, email: 'cuenta@gmail.com' })),
  http.delete(`${base}/emisores/gmail-disconnect`, () => HttpResponse.json({ message: 'Cuenta de Gmail desconectada exitosamente' })),
]
```

- [ ] **Step 5: Registrar los handlers en `src/test/msw/handlers.ts`**

Modificar el archivo para importar y esparcir `dtesRecibidosHandlers`:

```typescript
import { http, HttpResponse } from 'msw'
import { facturacionHandlers } from './facturacion-handlers'
import { comprasHandlers } from './compras-handlers'
import { dtesRecibidosHandlers } from './dtes-recibidos-handlers'
```

Y al final del array `handlers`, después de `...comprasHandlers,`:

```typescript
  ...comprasHandlers,
  ...dtesRecibidosHandlers,
]
```

- [ ] **Step 6: Escribir el test de hooks**

```typescript
// src/features/dtes-recibidos/hooks.test.tsx
import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useDtesRecibidos, useEstadisticasDtes } from './hooks'

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('hooks de DTEs recibidos', () => {
  it('useDtesRecibidos trae el listado paginado', async () => {
    const { result } = renderHook(() => useDtesRecibidos({ pagina: 1, tamanoPagina: 20 }), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items[0].codigoGeneracion).toBe('GUID-1')
    expect(result.current.data?.total).toBe(1)
  })

  it('useEstadisticasDtes trae los totales', async () => {
    const { result } = renderHook(() => useEstadisticasDtes({}), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.totalPendientes).toBe(1)
  })
})
```

- [ ] **Step 7: Correr tests (deben pasar) + build**

Run: `npm run test -- src/features/dtes-recibidos/hooks.test.tsx && npm run build`
Expected: PASS y build OK.

- [ ] **Step 8: Commit**

```bash
git add src/features/dtes-recibidos/api.ts src/features/dtes-recibidos/gmail-api.ts src/features/dtes-recibidos/hooks.ts src/features/dtes-recibidos/hooks.test.tsx src/test/msw/dtes-recibidos-handlers.ts src/test/msw/handlers.ts
git commit -m "feat(f5.4-s4): cliente API, hooks y handlers MSW de DTEs recibidos"
```

---

## Task 5: Mappers y schemas del mapeo

**Files:**
- Create: `src/features/dtes-recibidos/mappers.ts`
- Create: `src/features/dtes-recibidos/schemas.ts`
- Test: `src/features/dtes-recibidos/mappers.test.ts`
- Test: `src/features/dtes-recibidos/schemas.test.ts`

**Interfaces:**
- Consumes: `DteLineaParsed` (Task 2), `round2`/`AccionMapeo` (Task 3/1), tipos (Task 1).
- Produces: `ProductoNuevoForm`, `MapeoLineaForm`, `MapeoFormValues`, `nuevoProductoVacio`, `lineaDesdeParsed`, `buildMapearDto`; `mapeoSchema`, `leerCorreoSchema`, `MESES_REGEX`.

- [ ] **Step 1: Escribir el test de mappers**

```typescript
// src/features/dtes-recibidos/mappers.test.ts
import { describe, it, expect } from 'vitest'
import { lineaDesdeParsed, buildMapearDto, type MapeoFormValues } from './mappers'
import type { DteLineaParsed } from './parse'

const linea: DteLineaParsed = {
  numItem: 1, codigo: 'P-1', descripcion: 'Papel', cantidad: 50, precioUnitario: 4.5,
  montoDescuento: 0, ventaGravada: 225, ventaExenta: 0, ventaNoSujeta: 0, unidadMedida: 59, montoConIva: 254.25,
}

describe('lineaDesdeParsed', () => {
  it('siembra una línea como GASTO con monto y costo por defecto', () => {
    const l = lineaDesdeParsed(linea)
    expect(l.accion).toBe('GASTO')
    expect(l.descripcionDte).toBe('Papel')
    expect(l.montoDte).toBe(254.25)
    expect(l.cantidad).toBe(50)
    expect(l.costoUnitario).toBe(5.09) // round2(254.25/50)
  })
})

describe('buildMapearDto', () => {
  it('arma items por acción', () => {
    const values: MapeoFormValues = {
      sucursalId: 2,
      lineas: [
        { ...lineaDesdeParsed(linea), accion: 'PRODUCTO_EXISTENTE', productoId: 10, bodegaId: 3, cantidad: 50, costoUnitario: 5.085 },
        { ...lineaDesdeParsed(linea), uid: 99, accion: 'GASTO', montoDte: 30 },
      ],
    }
    const dto = buildMapearDto(values)
    expect(dto.sucursalId).toBe(2)
    expect(dto.items[0]).toMatchObject({ accion: 'PRODUCTO_EXISTENTE', productoId: 10, bodegaId: 3, cantidad: 50, costoUnitario: 5.085 })
    expect(dto.items[1]).toMatchObject({ accion: 'GASTO', montoDte: 30 })
    expect(dto.items[1].productoId).toBeUndefined()
  })

  it('mapea PRODUCTO_NUEVO con su subobjeto', () => {
    const base = lineaDesdeParsed(linea)
    const values: MapeoFormValues = {
      sucursalId: 2,
      lineas: [{ ...base, accion: 'PRODUCTO_NUEVO', bodegaId: 3, cantidad: 50, costoUnitario: 5.085, nuevo: { ...base.nuevo, codigo: 'X', nombre: 'Nuevo', catTipoItemId: 1, catUnidadMedidaId: 59 } }],
    }
    const dto = buildMapearDto(values)
    expect(dto.items[0].productoNuevo).toMatchObject({ codigo: 'X', nombre: 'Nuevo', catTipoItemId: 1, catUnidadMedidaId: 59, tipoInventario: 0 })
  })
})
```

- [ ] **Step 2: Correr el test (debe fallar)**

Run: `npm run test -- src/features/dtes-recibidos/mappers.test.ts`
Expected: FAIL ("Cannot find module './mappers'").

- [ ] **Step 3: Escribir `mappers.ts`**

```typescript
// src/features/dtes-recibidos/mappers.ts
import { round2 } from './calc/mapeo'
import type { AccionMapeo, MapearDteCompraDto, MapearItemDto } from './types'
import type { DteLineaParsed } from './parse'

export interface ProductoNuevoForm {
  codigo: string
  nombre: string
  catTipoItemId: number | null
  catUnidadMedidaId: number | null
  categoriaId: number | null
  tipoInventario: number
  aniosVidaUtil: number | null
  valorResidual: number | null
}

export interface MapeoLineaForm {
  uid: number
  numItem: number
  descripcionDte: string
  montoDte: number
  accion: AccionMapeo
  productoId: number | null
  productoLabel: string
  cantidad: number
  bodegaId: number | null
  costoUnitario: number
  nuevo: ProductoNuevoForm
  catTipoGastoId: number | null
}

export interface MapeoFormValues {
  sucursalId: number | null
  lineas: MapeoLineaForm[]
}

let _uid = 0

export function nuevoProductoVacio(): ProductoNuevoForm {
  return { codigo: '', nombre: '', catTipoItemId: null, catUnidadMedidaId: null, categoriaId: null, tipoInventario: 0, aniosVidaUtil: null, valorResidual: null }
}

export function lineaDesdeParsed(item: DteLineaParsed): MapeoLineaForm {
  const cantidad = item.cantidad > 0 ? item.cantidad : 1
  return {
    uid: ++_uid,
    numItem: item.numItem,
    descripcionDte: item.descripcion,
    montoDte: item.montoConIva,
    accion: 'GASTO',
    productoId: null,
    productoLabel: '',
    cantidad,
    bodegaId: null,
    costoUnitario: round2(item.montoConIva / cantidad),
    nuevo: nuevoProductoVacio(),
    catTipoGastoId: null,
  }
}

export function buildMapearDto(v: MapeoFormValues): MapearDteCompraDto {
  if (!v.sucursalId) throw new Error('buildMapearDto: sucursalId requerido')
  const items: MapearItemDto[] = v.lineas.map((l) => {
    const base = { descripcionDte: l.descripcionDte.trim(), montoDte: round2(l.montoDte), accion: l.accion }
    if (l.accion === 'GASTO') {
      return { ...base, catTipoGastoId: l.catTipoGastoId }
    }
    if (l.accion === 'PRODUCTO_EXISTENTE') {
      if (!l.productoId) throw new Error('buildMapearDto: productoId requerido en línea de producto existente')
      return { ...base, productoId: l.productoId, cantidad: l.cantidad, bodegaId: l.bodegaId, costoUnitario: l.costoUnitario }
    }
    // PRODUCTO_NUEVO
    return {
      ...base,
      cantidad: l.cantidad,
      bodegaId: l.bodegaId,
      costoUnitario: l.costoUnitario,
      productoNuevo: {
        codigo: l.nuevo.codigo.trim(),
        nombre: l.nuevo.nombre.trim(),
        catTipoItemId: l.nuevo.catTipoItemId ?? 0,
        catUnidadMedidaId: l.nuevo.catUnidadMedidaId ?? 0,
        categoriaId: l.nuevo.categoriaId,
        tipoInventario: l.nuevo.tipoInventario,
        aniosVidaUtil: l.nuevo.aniosVidaUtil,
        valorResidual: l.nuevo.valorResidual,
      },
    }
  })
  return { sucursalId: v.sucursalId, items }
}
```

- [ ] **Step 4: Escribir el test de schemas**

```typescript
// src/features/dtes-recibidos/schemas.test.ts
import { describe, it, expect } from 'vitest'
import { mapeoSchema, leerCorreoSchema } from './schemas'
import { lineaDesdeParsed } from './mappers'
import type { DteLineaParsed } from './parse'

const linea: DteLineaParsed = {
  numItem: 1, codigo: 'P-1', descripcion: 'Papel', cantidad: 50, precioUnitario: 4.5,
  montoDescuento: 0, ventaGravada: 225, ventaExenta: 0, ventaNoSujeta: 0, unidadMedida: 59, montoConIva: 254.25,
}

describe('mapeoSchema', () => {
  it('acepta una línea GASTO con sucursal', () => {
    const r = mapeoSchema.safeParse({ sucursalId: 2, lineas: [lineaDesdeParsed(linea)] })
    expect(r.success).toBe(true)
  })
  it('rechaza PRODUCTO_EXISTENTE sin producto/bodega', () => {
    const r = mapeoSchema.safeParse({ sucursalId: 2, lineas: [{ ...lineaDesdeParsed(linea), accion: 'PRODUCTO_EXISTENTE' }] })
    expect(r.success).toBe(false)
  })
  it('rechaza sin sucursal', () => {
    const r = mapeoSchema.safeParse({ sucursalId: null, lineas: [lineaDesdeParsed(linea)] })
    expect(r.success).toBe(false)
  })
})

describe('leerCorreoSchema', () => {
  it('acepta ambos meses vacíos', () => {
    expect(leerCorreoSchema.safeParse({ mesInicio: '', mesFin: '' }).success).toBe(true)
  })
  it('acepta rango válido', () => {
    expect(leerCorreoSchema.safeParse({ mesInicio: '2026-01', mesFin: '2026-03' }).success).toBe(true)
  })
  it('rechaza si solo uno está presente', () => {
    expect(leerCorreoSchema.safeParse({ mesInicio: '2026-01', mesFin: '' }).success).toBe(false)
  })
  it('rechaza fin < inicio', () => {
    expect(leerCorreoSchema.safeParse({ mesInicio: '2026-05', mesFin: '2026-01' }).success).toBe(false)
  })
})
```

- [ ] **Step 5: Escribir `schemas.ts`**

```typescript
// src/features/dtes-recibidos/schemas.ts
import { z } from 'zod'

export const MESES_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/

const lineaSchema = z.object({
  accion: z.enum(['PRODUCTO_EXISTENTE', 'PRODUCTO_NUEVO', 'GASTO']),
  productoId: z.number().int().nullable(),
  cantidad: z.number(),
  bodegaId: z.number().int().nullable(),
  costoUnitario: z.number(),
  catTipoGastoId: z.number().int().nullable(),
  nuevo: z.object({
    codigo: z.string(),
    nombre: z.string(),
    catTipoItemId: z.number().int().nullable(),
    catUnidadMedidaId: z.number().int().nullable(),
    categoriaId: z.number().int().nullable(),
    tipoInventario: z.number().int(),
    aniosVidaUtil: z.number().int().nullable(),
    valorResidual: z.number().nullable(),
  }),
})

export const mapeoSchema = z
  .object({
    sucursalId: z.number().int().positive('Seleccione una sucursal'),
    lineas: z.array(lineaSchema).min(1, 'El DTE no tiene líneas para mapear'),
  })
  .superRefine((v, ctx) => {
    v.lineas.forEach((l, i) => {
      if (l.accion === 'PRODUCTO_EXISTENTE') {
        if (!l.productoId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lineas', i, 'productoId'], message: 'Seleccione un producto' })
        if (!(l.cantidad > 0)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lineas', i, 'cantidad'], message: 'La cantidad debe ser mayor que 0' })
        if (!l.bodegaId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lineas', i, 'bodegaId'], message: 'Seleccione una bodega' })
        if (l.costoUnitario < 0) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lineas', i, 'costoUnitario'], message: 'Costo inválido' })
      } else if (l.accion === 'PRODUCTO_NUEVO') {
        if (!l.nuevo.codigo.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lineas', i, 'nuevo', 'codigo'], message: 'Código requerido' })
        if (!l.nuevo.nombre.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lineas', i, 'nuevo', 'nombre'], message: 'Nombre requerido' })
        if (!l.nuevo.catTipoItemId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lineas', i, 'nuevo', 'catTipoItemId'], message: 'Seleccione el tipo de ítem' })
        if (!l.nuevo.catUnidadMedidaId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lineas', i, 'nuevo', 'catUnidadMedidaId'], message: 'Seleccione la unidad de medida' })
        if (!(l.cantidad > 0)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lineas', i, 'cantidad'], message: 'La cantidad debe ser mayor que 0' })
        if (!l.bodegaId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lineas', i, 'bodegaId'], message: 'Seleccione una bodega' })
        if (l.costoUnitario < 0) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lineas', i, 'costoUnitario'], message: 'Costo inválido' })
      }
    })
  })

export type MapeoInput = z.infer<typeof mapeoSchema>

export const leerCorreoSchema = z
  .object({ mesInicio: z.string(), mesFin: z.string() })
  .superRefine((v, ctx) => {
    const aDef = v.mesInicio.trim() !== ''
    const bDef = v.mesFin.trim() !== ''
    if (aDef !== bDef) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['mesInicio'], message: 'Indique ambos meses o ninguno' })
      return
    }
    if (!aDef) return
    if (!MESES_REGEX.test(v.mesInicio)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['mesInicio'], message: 'Formato AAAA-MM' })
    if (!MESES_REGEX.test(v.mesFin)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['mesFin'], message: 'Formato AAAA-MM' })
    if (MESES_REGEX.test(v.mesInicio) && MESES_REGEX.test(v.mesFin) && v.mesFin < v.mesInicio)
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['mesFin'], message: 'El mes fin debe ser mayor o igual al mes inicio' })
  })

export type LeerCorreoInput = z.infer<typeof leerCorreoSchema>
```

- [ ] **Step 6: Correr tests (deben pasar) + build**

Run: `npm run test -- src/features/dtes-recibidos/mappers.test.ts src/features/dtes-recibidos/schemas.test.ts && npm run build`
Expected: PASS y build OK.

- [ ] **Step 7: Commit**

```bash
git add src/features/dtes-recibidos/mappers.ts src/features/dtes-recibidos/mappers.test.ts src/features/dtes-recibidos/schemas.ts src/features/dtes-recibidos/schemas.test.ts
git commit -m "feat(f5.4-s4): mappers y schemas del asistente de mapeo"
```

---

## Task 6: Página de listado + estadísticas

**Files:**
- Create: `src/features/dtes-recibidos/pages/DtesRecibidosListPage.tsx`
- Test: `src/features/dtes-recibidos/pages/DtesRecibidosListPage.test.tsx`

**Interfaces:**
- Consumes: `useDtesRecibidos`, `useEstadisticasDtes` (Task 4), `tonoDteRecibido` (Task 1).
- Produces: `DtesRecibidosListPage` (default export por nombre).

Nota: los botones de acciones (Cargar JSON / Leer correo / Configurar) se añaden en Tasks 9, 10 y 13 (placeholders de navegación o no presentes hasta entonces). Esta tarea entrega listado + filtros + tarjetas.

- [ ] **Step 1: Escribir el test**

```typescript
// src/features/dtes-recibidos/pages/DtesRecibidosListPage.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { DtesRecibidosListPage } from './DtesRecibidosListPage'
import { useAuthStore } from '@/app/auth-store'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><MemoryRouter><DtesRecibidosListPage /></MemoryRouter></QueryClientProvider>)
}

describe('DtesRecibidosListPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', status: 'authenticated', user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 2, rolNombre: 'EmisorAdmin', emisorId: 5, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  })

  it('muestra los DTEs y las estadísticas', async () => {
    setup()
    expect(await screen.findByText('DTE-03-0001')).toBeInTheDocument()
    expect(screen.getByText('DISTRIBUIDORA EL BUEN PRECIO')).toBeInTheDocument()
    expect(await screen.findByText(/pendientes/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Correr el test (debe fallar)**

Run: `npm run test -- src/features/dtes-recibidos/pages/DtesRecibidosListPage.test.tsx`
Expected: FAIL ("Cannot find module './DtesRecibidosListPage'").

- [ ] **Step 3: Escribir la página**

```tsx
// src/features/dtes-recibidos/pages/DtesRecibidosListPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Input, Badge, Spinner, EmptyState, Card } from '@/design-system'
import { useDtesRecibidos, useEstadisticasDtes } from '../hooks'
import { tonoDteRecibido } from '../estado'
import type { DteRecibidoResumenDto } from '../types'

export function DtesRecibidosListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState('')
  const params = { pagina: page, tamanoPagina: 20, search: search || undefined, estado: estado || undefined }
  const { data, isLoading, isError } = useDtesRecibidos(params)
  const stats = useEstadisticasDtes({ search: search || undefined, estado: estado || undefined })

  const columns = [
    { key: 'numeroControl', header: 'Nº control', render: (d: DteRecibidoResumenDto) => <span className="cifra text-xs">{d.numeroControl ?? d.codigoGeneracion.slice(0, 8)}</span> },
    { key: 'emisorNombre', header: 'Emisor' },
    { key: 'tipoDte', header: 'Tipo', render: (d: DteRecibidoResumenDto) => <span className="cifra">{d.tipoDte}</span> },
    { key: 'fechaEmision', header: 'Fecha', render: (d: DteRecibidoResumenDto) => <span className="cifra">{d.fechaEmision.slice(0, 10)}</span> },
    { key: 'total', header: 'Total', render: (d: DteRecibidoResumenDto) => <span className="cifra font-medium">${d.total.toFixed(2)}</span> },
    { key: 'estado', header: 'Estado', render: (d: DteRecibidoResumenDto) => <Badge estado={tonoDteRecibido(d.estado)}>{d.estado}</Badge> },
    { key: 'acciones', header: '', render: (d: DteRecibidoResumenDto) => <button className="text-xs font-medium text-sello hover:text-sello-bright" onClick={() => navigate(`/dtes-recibidos/${d.id}`)}>Ver</button> },
  ]

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">DTEs recibidos</h1>
      </div>

      {stats.data && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card><div className="p-3"><p className="text-xs text-slate">Pendientes</p><p className="cifra text-lg font-semibold text-ink">{stats.data.totalPendientes}</p></div></Card>
          <Card><div className="p-3"><p className="text-xs text-slate">Vinculados</p><p className="cifra text-lg font-semibold text-ink">{stats.data.totalVinculados}</p></div></Card>
          <Card><div className="p-3"><p className="text-xs text-slate">Descartados</p><p className="cifra text-lg font-semibold text-ink">{stats.data.totalDescartados}</p></div></Card>
          <Card><div className="p-3"><p className="text-xs text-slate">Monto pendiente</p><p className="cifra text-lg font-semibold text-ink">${stats.data.montoTotalPendientes.toFixed(2)}</p></div></Card>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Input placeholder="Buscar por emisor o nº de control" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        <select aria-label="Estado" className="rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark" value={estado} onChange={(e) => { setEstado(e.target.value); setPage(1) }}>
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="VINCULADO">Vinculado</option>
          <option value="DESCARTADO">Descartado</option>
        </select>
      </div>

      {isLoading && <Spinner />}
      {isError && <EmptyState title="Error" hint="No se pudieron cargar los DTEs recibidos." />}
      {data && data.items.length === 0 && <EmptyState title="Sin DTEs recibidos" hint="Cargue un CCF manualmente o configure la lectura de correo." />}
      {data && data.items.length > 0 && (
        <Table columns={columns} rows={data.items} getRowKey={(d) => d.id} serverPagination={{ page: data.pagina, totalPages: data.totalPaginas, onPageChange: setPage }} />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Correr el test (debe pasar) + build**

Run: `npm run test -- src/features/dtes-recibidos/pages/DtesRecibidosListPage.test.tsx && npm run build`
Expected: PASS y build OK.

- [ ] **Step 5: Commit**

```bash
git add src/features/dtes-recibidos/pages/DtesRecibidosListPage.tsx src/features/dtes-recibidos/pages/DtesRecibidosListPage.test.tsx
git commit -m "feat(f5.4-s4): página de listado + estadísticas de DTEs recibidos"
```

---

## Task 7: Página de detalle

**Files:**
- Create: `src/features/dtes-recibidos/pages/DteRecibidoDetallePage.tsx`
- Test: `src/features/dtes-recibidos/pages/DteRecibidoDetallePage.test.tsx`

**Interfaces:**
- Consumes: `useDteRecibido` (Task 4), `parseDteLineas` (Task 2), `tonoDteRecibido` (Task 1).
- Produces: `DteRecibidoDetallePage`. Botones "Mapear y crear compra" (navega a `/dtes-recibidos/:id/mapear`) y "Descartar" (modal de Task 8; aquí solo se cablea el botón "Mapear" + el área de acciones; el modal Descartar lo añade Task 8).

- [ ] **Step 1: Escribir el test**

```typescript
// src/features/dtes-recibidos/pages/DteRecibidoDetallePage.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '@/design-system'
import { DteRecibidoDetallePage } from './DteRecibidoDetallePage'
import { useAuthStore } from '@/app/auth-store'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/dtes-recibidos/7']}>
          <Routes>
            <Route path="/dtes-recibidos/:id" element={<DteRecibidoDetallePage />} />
            <Route path="/dtes-recibidos/:id/mapear" element={<div>Mapear</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

describe('DteRecibidoDetallePage', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', status: 'authenticated', user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 2, rolNombre: 'EmisorAdmin', emisorId: 5, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  })

  it('muestra el DTE PENDIENTE con sus líneas y la acción de mapear', async () => {
    setup()
    expect(await screen.findByText('DISTRIBUIDORA EL BUEN PRECIO')).toBeInTheDocument()
    expect(screen.getByText('Resma de papel bond carta')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /mapear y crear compra/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Correr el test (debe fallar)**

Run: `npm run test -- src/features/dtes-recibidos/pages/DteRecibidoDetallePage.test.tsx`
Expected: FAIL ("Cannot find module './DteRecibidoDetallePage'").

- [ ] **Step 3: Escribir la página**

```tsx
// src/features/dtes-recibidos/pages/DteRecibidoDetallePage.tsx
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Badge, Spinner, EmptyState } from '@/design-system'
import { useDteRecibido } from '../hooks'
import { parseDteLineas } from '../parse'
import { tonoDteRecibido } from '../estado'

export function DteRecibidoDetallePage() {
  const { id } = useParams()
  const dteId = Number(id)
  const navigate = useNavigate()
  const { data, isLoading, isError } = useDteRecibido(dteId)

  if (isLoading) return <div className="p-6"><Spinner /></div>
  if (isError || !data) return <div className="p-6"><EmptyState title="No se pudo cargar el DTE" hint="Intenta de nuevo." /></div>

  const lineas = parseDteLineas(data.jsonDte)
  const esPendiente = data.estado === 'PENDIENTE'
  const origen = data.emailOrigen ? `Correo (${data.emailOrigen})` : 'Carga manual'

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">{data.numeroControl ?? data.codigoGeneracion}</h1>
          <p className="text-sm text-slate"><span>{data.emisorNombre}</span>{' · NIT '}<span className="cifra">{data.emisorNit}</span>{' · Tipo '}<span className="cifra">{data.tipoDte}</span></p>
        </div>
        <Badge estado={tonoDteRecibido(data.estado)}>{data.estado}</Badge>
      </div>

      <div className="rounded-xl border border-hairline p-4 text-sm">
        <div className="grid grid-cols-2 gap-2 text-slate">
          <span>Fecha emisión: <span className="cifra text-ink">{data.fechaEmision.slice(0, 10)}</span></span>
          <span>Origen: <span className="text-ink">{origen}</span></span>
          <span>Código generación: <span className="cifra text-ink">{data.codigoGeneracion}</span></span>
          {data.selloRecibido && <span>Sello: <span className="cifra text-ink">{data.selloRecibido}</span></span>}
        </div>
      </div>

      <div className="rounded-xl border border-hairline p-4">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-hairline text-left text-slate"><th className="py-2">Descripción</th><th>Cant.</th><th>P. unit.</th><th className="text-right">Gravada</th></tr></thead>
          <tbody>
            {lineas.map((l) => (
              <tr key={l.numItem} className="border-b border-hairline"><td className="py-2">{l.descripcion}</td><td className="cifra">{l.cantidad}</td><td className="cifra">${l.precioUnitario.toFixed(2)}</td><td className="cifra text-right">${l.ventaGravada.toFixed(2)}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex justify-end gap-6 text-sm">
          <span className="text-slate">Subtotal <span className="cifra">${data.subTotal.toFixed(2)}</span></span>
          <span className="text-slate">IVA <span className="cifra">${data.iva.toFixed(2)}</span></span>
          <span className="font-semibold text-ink">Total <span className="cifra">${data.total.toFixed(2)}</span></span>
        </div>
      </div>

      {data.estado === 'VINCULADO' && data.compraExternaId && (
        <p className="rounded-md bg-sello/10 px-3 py-2 text-sm">Vinculado a la <button className="font-medium text-sello hover:underline" onClick={() => navigate(`/compras/${data.compraExternaId}`)}>compra #{data.compraExternaId}</button>.</p>
      )}
      {data.estado === 'DESCARTADO' && <p className="rounded-md bg-rojo/10 px-3 py-2 text-sm text-rojo">Descartado: {data.motivoDescarte}</p>}

      {esPendiente && (
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/dtes-recibidos/${dteId}/mapear`)}>Mapear y crear compra</Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Correr el test (debe pasar) + build**

Run: `npm run test -- src/features/dtes-recibidos/pages/DteRecibidoDetallePage.test.tsx && npm run build`
Expected: PASS y build OK.

- [ ] **Step 5: Commit**

```bash
git add src/features/dtes-recibidos/pages/DteRecibidoDetallePage.tsx src/features/dtes-recibidos/pages/DteRecibidoDetallePage.test.tsx
git commit -m "feat(f5.4-s4): página de detalle de DTE recibido"
```

---

## Task 8: Modal Descartar + cableado en detalle

**Files:**
- Create: `src/features/dtes-recibidos/components/DescartarDteModal.tsx`
- Test: `src/features/dtes-recibidos/components/DescartarDteModal.test.tsx`
- Modify: `src/features/dtes-recibidos/pages/DteRecibidoDetallePage.tsx`

**Interfaces:**
- Consumes: `Modal`, `Button`, `FormField`, `Input` (design-system); `useDescartarDte` (Task 4).
- Produces: `DescartarDteModal` con props `{ onConfirmar: (motivo: string) => void; onClose: () => void; cargando: boolean }`.

- [ ] **Step 1: Escribir el test del modal**

```typescript
// src/features/dtes-recibidos/components/DescartarDteModal.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DescartarDteModal } from './DescartarDteModal'

describe('DescartarDteModal', () => {
  it('exige un motivo antes de confirmar', async () => {
    const user = userEvent.setup()
    const onConfirmar = vi.fn()
    render(<DescartarDteModal onConfirmar={onConfirmar} onClose={() => {}} cargando={false} />)
    await user.click(screen.getByRole('button', { name: /descartar dte/i }))
    expect(await screen.findByText(/motivo.*obligatorio/i)).toBeInTheDocument()
    expect(onConfirmar).not.toHaveBeenCalled()
  })

  it('confirma con el motivo escrito', async () => {
    const user = userEvent.setup()
    const onConfirmar = vi.fn()
    render(<DescartarDteModal onConfirmar={onConfirmar} onClose={() => {}} cargando={false} />)
    await user.type(screen.getByLabelText(/motivo/i), 'Duplicado')
    await user.click(screen.getByRole('button', { name: /descartar dte/i }))
    expect(onConfirmar).toHaveBeenCalledWith('Duplicado')
  })
})
```

- [ ] **Step 2: Correr el test (debe fallar)**

Run: `npm run test -- src/features/dtes-recibidos/components/DescartarDteModal.test.tsx`
Expected: FAIL ("Cannot find module './DescartarDteModal'").

- [ ] **Step 3: Escribir el modal**

```tsx
// src/features/dtes-recibidos/components/DescartarDteModal.tsx
import { useState } from 'react'
import { Modal, Button, FormField, Input } from '@/design-system'

interface Props { onConfirmar: (motivo: string) => void; onClose: () => void; cargando: boolean }

export function DescartarDteModal({ onConfirmar, onClose, cargando }: Props) {
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const confirmar = () => {
    if (!motivo.trim()) { setError('El motivo es obligatorio'); return }
    onConfirmar(motivo.trim())
  }
  return (
    <Modal open onClose={onClose} title="Descartar DTE recibido">
      <div className="space-y-3">
        <p className="text-sm text-slate">El DTE quedará marcado como descartado y no podrá vincularse a una compra.</p>
        {error && <p className="rounded-md bg-rojo/10 px-3 py-2 text-sm text-rojo">{error}</p>}
        <FormField label="Motivo" htmlFor="dd-motivo"><Input id="dd-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} /></FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" onClick={confirmar} disabled={cargando}>{cargando ? 'Descartando…' : 'Descartar DTE'}</Button>
        </div>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 4: Cablear en la página de detalle** — modificar `DteRecibidoDetallePage.tsx`:

Añadir imports al inicio (junto a los existentes):

```tsx
import { useState } from 'react'
import { useToast } from '@/design-system'
import { useDteRecibido, useDescartarDte } from '../hooks'
import { DescartarDteModal } from '../components/DescartarDteModal'
```

(Reemplaza la línea `import { useDteRecibido } from '../hooks'` por la versión con `useDescartarDte`, y añade `useToast` al import de `@/design-system`.)

Dentro del componente, tras `const { data, ... } = useDteRecibido(dteId)`:

```tsx
  const toast = useToast()
  const descartar = useDescartarDte()
  const [modal, setModal] = useState(false)

  const onDescartar = async (motivo: string) => {
    try { await descartar.mutateAsync({ id: dteId, motivo }); toast.show('DTE descartado'); setModal(false); navigate('/dtes-recibidos') }
    catch (e) {
      const msg = (e as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error
        ?? (e as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'No se pudo descartar'
      toast.show(msg, { tone: 'rojo' })
    }
  }
```

Reemplazar el bloque de acciones `{esPendiente && (...)}` por:

```tsx
      {esPendiente && (
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/dtes-recibidos/${dteId}/mapear`)}>Mapear y crear compra</Button>
          <Button variant="danger" onClick={() => setModal(true)}>Descartar</Button>
        </div>
      )}
      {modal && <DescartarDteModal onConfirmar={onDescartar} onClose={() => setModal(false)} cargando={descartar.isPending} />}
```

- [ ] **Step 5: Escribir test de integración del descarte en detalle** — añadir a `DteRecibidoDetallePage.test.tsx`:

```typescript
  it('descarta el DTE pidiendo motivo', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    setup()
    await user.click(await screen.findByRole('button', { name: /^descartar$/i }))
    await user.type(await screen.findByLabelText(/motivo/i), 'Duplicado')
    await user.click(screen.getByRole('button', { name: /descartar dte/i }))
    expect(await screen.findByText('DTEs recibidos', { exact: false })).toBeInTheDocument()
  }, 15000)
```

(Para que la navegación a `/dtes-recibidos` resuelva, añade en el `<Routes>` del `setup()` la ruta `<Route path="/dtes-recibidos" element={<div>DTEs recibidos</div>} />`.)

- [ ] **Step 6: Correr tests (deben pasar) + build**

Run: `npm run test -- src/features/dtes-recibidos/components/DescartarDteModal.test.tsx src/features/dtes-recibidos/pages/DteRecibidoDetallePage.test.tsx && npm run build`
Expected: PASS y build OK.

- [ ] **Step 7: Commit**

```bash
git add src/features/dtes-recibidos/components/DescartarDteModal.tsx src/features/dtes-recibidos/components/DescartarDteModal.test.tsx src/features/dtes-recibidos/pages/DteRecibidoDetallePage.tsx src/features/dtes-recibidos/pages/DteRecibidoDetallePage.test.tsx
git commit -m "feat(f5.4-s4): descartar DTE recibido con motivo"
```

---

## Task 9: Modal Cargar JSON + cableado en listado

**Files:**
- Create: `src/features/dtes-recibidos/components/CargarJsonModal.tsx`
- Test: `src/features/dtes-recibidos/components/CargarJsonModal.test.tsx`
- Modify: `src/features/dtes-recibidos/pages/DtesRecibidosListPage.tsx`

**Interfaces:**
- Consumes: `Modal`, `Button` (design-system); `useCargarJson` (Task 4); tipo `CargaMasivaResponse` (Task 1).
- Produces: `CargarJsonModal` con props `{ onClose: () => void }`.

- [ ] **Step 1: Escribir el test**

```typescript
// src/features/dtes-recibidos/components/CargarJsonModal.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '@/design-system'
import { CargarJsonModal } from './CargarJsonModal'
import { useAuthStore } from '@/app/auth-store'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><ToastProvider><CargarJsonModal onClose={() => {}} /></ToastProvider></QueryClientProvider>)
}

describe('CargarJsonModal', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', status: 'authenticated', user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 2, rolNombre: 'EmisorAdmin', emisorId: 5, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  })

  it('sube un archivo y muestra el resumen', async () => {
    const user = userEvent.setup()
    setup()
    const file = new File(['{"a":1}'], 'ccf.json', { type: 'application/json' })
    await user.upload(screen.getByLabelText(/archivos/i), file)
    await user.click(screen.getByRole('button', { name: /cargar/i }))
    expect(await screen.findByText(/cargados: 1/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Correr el test (debe fallar)**

Run: `npm run test -- src/features/dtes-recibidos/components/CargarJsonModal.test.tsx`
Expected: FAIL ("Cannot find module './CargarJsonModal'").

- [ ] **Step 3: Escribir el modal**

```tsx
// src/features/dtes-recibidos/components/CargarJsonModal.tsx
import { useState } from 'react'
import { Modal, Button, FormField } from '@/design-system'
import { useCargarJson } from '../hooks'
import type { CargaMasivaResponse } from '../types'

interface Props { onClose: () => void }

export function CargarJsonModal({ onClose }: Props) {
  const [archivos, setArchivos] = useState<File[]>([])
  const [resultado, setResultado] = useState<CargaMasivaResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const cargar = useCargarJson()

  const subir = async () => {
    if (archivos.length === 0) { setError('Seleccione al menos un archivo'); return }
    setError(null)
    try {
      setResultado(await cargar.mutateAsync(archivos))
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'No se pudieron cargar los archivos'
      setError(msg)
    }
  }

  return (
    <Modal open onClose={onClose} title="Cargar CCF (JSON)">
      <div className="space-y-3">
        <p className="text-sm text-slate">Adjunte uno o más archivos JSON/JWT de CCF (tipo 03) recibidos. Máximo 100 archivos.</p>
        {error && <p className="rounded-md bg-rojo/10 px-3 py-2 text-sm text-rojo">{error}</p>}
        <FormField label="Archivos" htmlFor="cj-files">
          <input id="cj-files" type="file" accept=".json,.jwt,application/json" multiple onChange={(e) => setArchivos(Array.from(e.target.files ?? []))} />
        </FormField>

        {resultado && (
          <div className="rounded-md border border-hairline p-3 text-sm">
            <p className="font-medium text-ink">Cargados: {resultado.cargados} · Duplicados: {resultado.duplicados} · Rechazados: {resultado.rechazados}</p>
            <ul className="mt-2 space-y-1 text-slate">
              {resultado.resultados.map((r, i) => (
                <li key={i}><span className="cifra">{r.archivo}</span>: {r.resultado} — {r.mensaje}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>{resultado ? 'Cerrar' : 'Cancelar'}</Button>
          {!resultado && <Button onClick={subir} disabled={cargar.isPending}>{cargar.isPending ? 'Cargando…' : 'Cargar'}</Button>}
        </div>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 4: Cablear en el listado** — modificar `DtesRecibidosListPage.tsx`:

Añadir import:

```tsx
import { CargarJsonModal } from '../components/CargarJsonModal'
```

Añadir estado local (junto a los otros `useState`):

```tsx
  const [modal, setModal] = useState<'cargar' | null>(null)
```

Reemplazar el header por uno con botón:

```tsx
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">DTEs recibidos</h1>
        <Button onClick={() => setModal('cargar')}>Cargar JSON</Button>
      </div>
```

(Añade `Button` al import de `@/design-system`.)

Antes del cierre `</div>` final del componente:

```tsx
      {modal === 'cargar' && <CargarJsonModal onClose={() => setModal(null)} />}
```

- [ ] **Step 5: Correr tests (deben pasar) + build**

Run: `npm run test -- src/features/dtes-recibidos/components/CargarJsonModal.test.tsx src/features/dtes-recibidos/pages/DtesRecibidosListPage.test.tsx && npm run build`
Expected: PASS y build OK.

- [ ] **Step 6: Commit**

```bash
git add src/features/dtes-recibidos/components/CargarJsonModal.tsx src/features/dtes-recibidos/components/CargarJsonModal.test.tsx src/features/dtes-recibidos/pages/DtesRecibidosListPage.tsx
git commit -m "feat(f5.4-s4): carga manual de CCF (JSON) desde el listado"
```

---

## Task 10: Modal Leer correo (con polling) + cableado

**Files:**
- Create: `src/features/dtes-recibidos/components/LeerCorreoModal.tsx`
- Test: `src/features/dtes-recibidos/components/LeerCorreoModal.test.tsx`
- Modify: `src/features/dtes-recibidos/pages/DtesRecibidosListPage.tsx`

**Interfaces:**
- Consumes: `Modal`, `Button`, `FormField`, `Input` (design-system); `useLeerCorreo`, `useEstadoLecturaCorreo` (Task 4); `leerCorreoSchema` (Task 5).
- Produces: `LeerCorreoModal` con props `{ onClose: () => void }`.

- [ ] **Step 1: Escribir el test**

```typescript
// src/features/dtes-recibidos/components/LeerCorreoModal.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LeerCorreoModal } from './LeerCorreoModal'
import { useAuthStore } from '@/app/auth-store'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><LeerCorreoModal onClose={() => {}} /></QueryClientProvider>)
}

describe('LeerCorreoModal', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', status: 'authenticated', user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 2, rolNombre: 'EmisorAdmin', emisorId: 5, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  })

  it('encola la lectura y muestra el progreso del job', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /iniciar lectura/i }))
    // El handler MSW devuelve un job COMPLETADO con 2 nuevos.
    expect(await screen.findByText(/nuevos/i)).toBeInTheDocument()
    expect(await screen.findByText(/completado/i)).toBeInTheDocument()
  })

  it('valida que se indiquen ambos meses o ninguno', async () => {
    const user = userEvent.setup()
    setup()
    await user.type(screen.getByLabelText(/mes inicio/i), '2026-01')
    await user.click(screen.getByRole('button', { name: /iniciar lectura/i }))
    expect(await screen.findByText(/ambos meses o ninguno/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Correr el test (debe fallar)**

Run: `npm run test -- src/features/dtes-recibidos/components/LeerCorreoModal.test.tsx`
Expected: FAIL ("Cannot find module './LeerCorreoModal'").

- [ ] **Step 3: Escribir el modal**

```tsx
// src/features/dtes-recibidos/components/LeerCorreoModal.tsx
import { useState } from 'react'
import { Modal, Button, FormField, Input, Spinner } from '@/design-system'
import { useLeerCorreo, useEstadoLecturaCorreo } from '../hooks'
import { leerCorreoSchema } from '../schemas'

interface Props { onClose: () => void }

export function LeerCorreoModal({ onClose }: Props) {
  const [mesInicio, setMesInicio] = useState('')
  const [mesFin, setMesFin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [polling, setPolling] = useState(false)
  const leer = useLeerCorreo()
  const estado = useEstadoLecturaCorreo(polling)

  const iniciar = async () => {
    const res = leerCorreoSchema.safeParse({ mesInicio, mesFin })
    if (!res.success) { setError(res.error.issues[0]?.message ?? 'Revise el rango de meses'); return }
    setError(null)
    const dto = mesInicio && mesFin ? { mesInicio, mesFin } : {}
    try {
      await leer.mutateAsync(dto)
      setPolling(true) // arranca el polling (en handler de evento, no useEffect)
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'No se pudo iniciar la lectura'
      setError(msg)
    }
  }

  const job = estado.data
  const terminado = job?.terminado ?? false

  return (
    <Modal open onClose={onClose} title="Leer correo (Gmail)">
      <div className="space-y-3">
        <p className="text-sm text-slate">Lee los CCF adjuntos en el correo conectado. Sin rango, lee el mes en curso.</p>
        {error && <p className="rounded-md bg-rojo/10 px-3 py-2 text-sm text-rojo">{error}</p>}

        {!polling && (
          <div className="grid grid-cols-2 gap-2">
            <FormField label="Mes inicio (AAAA-MM)" htmlFor="lc-ini"><Input id="lc-ini" placeholder="2026-01" value={mesInicio} onChange={(e) => setMesInicio(e.target.value)} /></FormField>
            <FormField label="Mes fin (AAAA-MM)" htmlFor="lc-fin"><Input id="lc-fin" placeholder="2026-03" value={mesFin} onChange={(e) => setMesFin(e.target.value)} /></FormField>
          </div>
        )}

        {polling && job && (
          <div className="rounded-md border border-hairline p-3 text-sm">
            <p className="font-medium text-ink">Estado: {job.estado}{!terminado && <span className="ml-2 inline-block align-middle"><Spinner /></span>}</p>
            <p className="mt-1 text-slate">Procesados: <span className="cifra">{job.correosProcesados}</span> · Encontrados: <span className="cifra">{job.dtesEncontrados}</span> · Nuevos: <span className="cifra">{job.dtesNuevos}</span> · Duplicados: <span className="cifra">{job.dtesDuplicados}</span> · Ignorados: <span className="cifra">{job.dtesIgnorados}</span> · Errores: <span className="cifra">{job.errores}</span></p>
            {job.mensajeError && <p className="mt-1 text-rojo">{job.mensajeError}</p>}
          </div>
        )}
        {polling && !job && <Spinner />}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>{terminado ? 'Cerrar' : 'Cancelar'}</Button>
          {!polling && <Button onClick={iniciar} disabled={leer.isPending}>{leer.isPending ? 'Iniciando…' : 'Iniciar lectura'}</Button>}
        </div>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 4: Cablear en el listado** — modificar `DtesRecibidosListPage.tsx`:

Añadir import:

```tsx
import { LeerCorreoModal } from '../components/LeerCorreoModal'
```

Ampliar el tipo del estado modal a `'cargar' | 'leer' | null` y añadir el botón en el header (junto a "Cargar JSON"):

```tsx
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setModal('leer')}>Leer correo</Button>
          <Button onClick={() => setModal('cargar')}>Cargar JSON</Button>
        </div>
```

Y antes del cierre del componente:

```tsx
      {modal === 'leer' && <LeerCorreoModal onClose={() => setModal(null)} />}
```

- [ ] **Step 5: Correr tests (deben pasar) + build**

Run: `npm run test -- src/features/dtes-recibidos/components/LeerCorreoModal.test.tsx src/features/dtes-recibidos/pages/DtesRecibidosListPage.test.tsx && npm run build`
Expected: PASS y build OK.

- [ ] **Step 6: Commit**

```bash
git add src/features/dtes-recibidos/components/LeerCorreoModal.tsx src/features/dtes-recibidos/components/LeerCorreoModal.test.tsx src/features/dtes-recibidos/pages/DtesRecibidosListPage.tsx
git commit -m "feat(f5.4-s4): lectura de correo Gmail con polling de job (e2e diferido)"
```

---

## Task 11: Tabla de mapeo (clasificador por línea + producto nuevo + cuadre)

**Files:**
- Create: `src/features/dtes-recibidos/components/MapeoLineasTable.tsx`
- Test: `src/features/dtes-recibidos/components/MapeoLineasTable.test.tsx`

**Interfaces:**
- Consumes: `Button`, `FormField`, `Input`, `Icon` (design-system); `AsyncSearchSelect` (facturación); `productosApi`, `bodegasApi` de `@/features/facturacion/catalogos-api`; `useCatalogo` de `@/features/facturacion/hooks`; `useTiposGasto` de `@/features/compras/hooks`; `calcCuadre`, `totalLineaMapeo` (Task 3); tipos de mappers (Task 5).
- Produces: `MapeoLineasTable` con props `{ lineas: MapeoLineaForm[]; onLineas: (l: MapeoLineaForm[]) => void; sucursalId: number | null; totalDte: number }`.

- [ ] **Step 1: Escribir el test**

```typescript
// src/features/dtes-recibidos/components/MapeoLineasTable.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MapeoLineasTable } from './MapeoLineasTable'
import { lineaDesdeParsed, type MapeoLineaForm } from '../mappers'
import type { DteLineaParsed } from '../parse'
import { useAuthStore } from '@/app/auth-store'

const parsed: DteLineaParsed = {
  numItem: 1, codigo: 'P-1', descripcion: 'Papel', cantidad: 50, precioUnitario: 4.5,
  montoDescuento: 0, ventaGravada: 225, ventaExenta: 0, ventaNoSujeta: 0, unidadMedida: 59, montoConIva: 254.25,
}

function renderTabla(lineas: MapeoLineaForm[], onLineas = vi.fn()) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={qc}><MapeoLineasTable lineas={lineas} onLineas={onLineas} sucursalId={2} totalDte={254.25} /></QueryClientProvider>)
  return onLineas
}

describe('MapeoLineasTable', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', status: 'authenticated', user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 2, rolNombre: 'EmisorAdmin', emisorId: 5, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  })

  it('muestra el cuadre y la línea sembrada como gasto', () => {
    renderTabla([lineaDesdeParsed(parsed)])
    expect(screen.getByText('Papel')).toBeInTheDocument()
    expect(screen.getByText(/cuadra/i)).toBeInTheDocument()
  })

  it('al cambiar la acción a Gasto/Existente notifica onLineas', async () => {
    const user = userEvent.setup()
    const onLineas = renderTabla([lineaDesdeParsed(parsed)])
    await user.click(screen.getByRole('button', { name: /^existente$/i }))
    expect(onLineas).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Correr el test (debe fallar)**

Run: `npm run test -- src/features/dtes-recibidos/components/MapeoLineasTable.test.tsx`
Expected: FAIL ("Cannot find module './MapeoLineasTable'").

- [ ] **Step 3: Escribir el componente**

```tsx
// src/features/dtes-recibidos/components/MapeoLineasTable.tsx
import { useQuery } from '@tanstack/react-query'
import { FormField, Input } from '@/design-system'
import { AsyncSearchSelect } from '@/features/facturacion/components/AsyncSearchSelect'
import { productosApi, bodegasApi } from '@/features/facturacion/catalogos-api'
import { useCatalogo } from '@/features/facturacion/hooks'
import { useTiposGasto } from '@/features/compras/hooks'
import type { ProductoListItem } from '@/features/facturacion/types'
import { calcCuadre, totalLineaMapeo } from '../calc/mapeo'
import type { MapeoLineaForm } from '../mappers'
import type { AccionMapeo } from '../types'

interface Props {
  lineas: MapeoLineaForm[]
  onLineas: (l: MapeoLineaForm[]) => void
  sucursalId: number | null
  totalDte: number
}

const ACCIONES: { id: AccionMapeo; label: string }[] = [
  { id: 'PRODUCTO_EXISTENTE', label: 'Existente' },
  { id: 'PRODUCTO_NUEVO', label: 'Nuevo' },
  { id: 'GASTO', label: 'Gasto' },
]

export function MapeoLineasTable({ lineas, onLineas, sucursalId, totalDte }: Props) {
  const tiposGasto = useTiposGasto()
  const tiposItem = useCatalogo('tiposItems')
  const unidades = useCatalogo('unidadesMedida')
  const bodegas = useQuery({
    queryKey: ['bodegas', sucursalId],
    queryFn: () => bodegasApi.porSucursal(sucursalId!),
    enabled: Number.isFinite(sucursalId),
  })

  const set = (idx: number, patch: Partial<MapeoLineaForm>) =>
    onLineas(lineas.map((l, i) => (i === idx ? { ...l, ...patch } : l)))
  const setNuevo = (idx: number, patch: Partial<MapeoLineaForm['nuevo']>) =>
    onLineas(lineas.map((l, i) => (i === idx ? { ...l, nuevo: { ...l.nuevo, ...patch } } : l)))

  const cuadre = calcCuadre(lineas.map((l) => ({ accion: l.accion, cantidad: l.cantidad, costoUnitario: l.costoUnitario, montoDte: l.montoDte })), totalDte)

  return (
    <section className="space-y-3">
      {lineas.map((l, idx) => {
        const total = totalLineaMapeo({ accion: l.accion, cantidad: l.cantidad, costoUnitario: l.costoUnitario, montoDte: l.montoDte })
        return (
          <div key={l.uid} className="rounded-lg border border-hairline p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-ink">{l.descripcionDte}</p>
              <span className="cifra text-sm text-slate">${total.toFixed(2)}</span>
            </div>

            <div className="mt-2 flex gap-1">
              {ACCIONES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={`rounded-md px-2 py-1 text-xs ${l.accion === a.id ? 'bg-sello text-white' : 'border border-hairline text-slate'}`}
                  onClick={() => set(idx, { accion: a.id })}
                >
                  {a.label}
                </button>
              ))}
            </div>

            {(l.accion === 'PRODUCTO_EXISTENTE' || l.accion === 'PRODUCTO_NUEVO') && (
              <div className="mt-2 space-y-2">
                {l.accion === 'PRODUCTO_EXISTENTE' && (
                  l.productoId
                    ? <div className="flex items-center gap-3 text-sm"><span>{l.productoLabel}</span><button type="button" className="text-xs text-sello hover:underline" onClick={() => set(idx, { productoId: null, productoLabel: '' })}>Cambiar</button></div>
                    : <AsyncSearchSelect<ProductoListItem> onSearch={(t) => productosApi.search(t, sucursalId ?? undefined)} getLabel={(x) => `${x.codigo} — ${x.nombre}`} onSelect={(x) => set(idx, { productoId: x.id, productoLabel: `${x.codigo} — ${x.nombre}` })} placeholder="Buscar producto" />
                )}

                {l.accion === 'PRODUCTO_NUEVO' && (
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    <FormField label="Código" htmlFor={`pn-cod-${idx}`}><Input id={`pn-cod-${idx}`} value={l.nuevo.codigo} onChange={(e) => setNuevo(idx, { codigo: e.target.value })} /></FormField>
                    <FormField label="Nombre" htmlFor={`pn-nom-${idx}`}><Input id={`pn-nom-${idx}`} value={l.nuevo.nombre} onChange={(e) => setNuevo(idx, { nombre: e.target.value })} /></FormField>
                    <FormField label="Tipo de ítem" htmlFor={`pn-ti-${idx}`}>
                      <select id={`pn-ti-${idx}`} className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark" value={l.nuevo.catTipoItemId ?? ''} onChange={(e) => setNuevo(idx, { catTipoItemId: e.target.value ? Number(e.target.value) : null })}>
                        <option value="">Seleccione…</option>
                        {(tiposItem.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.valor}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Unidad" htmlFor={`pn-uni-${idx}`}>
                      <select id={`pn-uni-${idx}`} className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark" value={l.nuevo.catUnidadMedidaId ?? ''} onChange={(e) => setNuevo(idx, { catUnidadMedidaId: e.target.value ? Number(e.target.value) : null })}>
                        <option value="">Seleccione…</option>
                        {(unidades.data ?? []).map((u) => <option key={u.id} value={u.id}>{u.valor}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Tipo inventario" htmlFor={`pn-inv-${idx}`}>
                      <select id={`pn-inv-${idx}`} className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark" value={l.nuevo.tipoInventario} onChange={(e) => setNuevo(idx, { tipoInventario: Number(e.target.value) })}>
                        <option value={0}>Ventas</option>
                        <option value={1}>Mobiliario/Equipo</option>
                        <option value={2}>Insumos</option>
                      </select>
                    </FormField>
                    {l.nuevo.tipoInventario === 1 && (
                      <FormField label="Años vida útil" htmlFor={`pn-vu-${idx}`}><Input id={`pn-vu-${idx}`} type="number" value={l.nuevo.aniosVidaUtil ?? ''} onChange={(e) => setNuevo(idx, { aniosVidaUtil: e.target.value ? Number(e.target.value) : null })} /></FormField>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <FormField label="Cantidad" htmlFor={`m-cant-${idx}`}><Input id={`m-cant-${idx}`} type="number" value={l.cantidad} onChange={(e) => set(idx, { cantidad: Number(e.target.value) })} /></FormField>
                  <FormField label="Costo unitario" htmlFor={`m-cost-${idx}`}><Input id={`m-cost-${idx}`} type="number" value={l.costoUnitario} onChange={(e) => set(idx, { costoUnitario: Number(e.target.value) })} /></FormField>
                  <FormField label="Bodega" htmlFor={`m-bod-${idx}`}>
                    <select id={`m-bod-${idx}`} aria-label="Bodega" className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark" value={l.bodegaId ?? ''} onChange={(e) => set(idx, { bodegaId: e.target.value ? Number(e.target.value) : null })}>
                      <option value="">Seleccione…</option>
                      {(bodegas.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                    </select>
                  </FormField>
                </div>
              </div>
            )}

            {l.accion === 'GASTO' && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <FormField label="Monto" htmlFor={`g-mon-${idx}`}><Input id={`g-mon-${idx}`} type="number" value={l.montoDte} onChange={(e) => set(idx, { montoDte: Number(e.target.value) })} /></FormField>
                <FormField label="Tipo de gasto" htmlFor={`g-tipo-${idx}`}>
                  <select id={`g-tipo-${idx}`} className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark" value={l.catTipoGastoId ?? ''} onChange={(e) => set(idx, { catTipoGastoId: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">(Opcional)</option>
                    {(tiposGasto.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                </FormField>
              </div>
            )}
          </div>
        )
      })}

      <div className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${cuadre.cuadra ? 'bg-sello/10 text-sello' : 'bg-rojo/10 text-rojo'}`}>
        <span>Mapeado <span className="cifra">${cuadre.totalMapeado.toFixed(2)}</span> / DTE <span className="cifra">${totalDte.toFixed(2)}</span></span>
        <span>{cuadre.cuadra ? '✓ Cuadra' : `Diferencia $${cuadre.diferencia.toFixed(2)}`}</span>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Correr el test (debe pasar) + build**

Run: `npm run test -- src/features/dtes-recibidos/components/MapeoLineasTable.test.tsx && npm run build`
Expected: PASS y build OK.

- [ ] **Step 5: Commit**

```bash
git add src/features/dtes-recibidos/components/MapeoLineasTable.tsx src/features/dtes-recibidos/components/MapeoLineasTable.test.tsx
git commit -m "feat(f5.4-s4): tabla de mapeo con clasificador, producto nuevo y cuadre"
```

---

## Task 12: Página del asistente de mapeo

**Files:**
- Create: `src/features/dtes-recibidos/pages/MapearDtePage.tsx`
- Test: `src/features/dtes-recibidos/pages/MapearDtePage.test.tsx`

**Interfaces:**
- Consumes: `useDteRecibido`, `useMapearYCrearCompra` (Task 4); `useSucursales` de `@/features/facturacion/hooks`; `parseDteLineas` (Task 2); `lineaDesdeParsed`, `buildMapearDto`, `MapeoFormValues` (Task 5); `mapeoSchema` (Task 5); `calcCuadre` (Task 3); `MapeoLineasTable` (Task 11).
- Produces: `MapearDtePage`.

Usa el patrón loader-externo + inner-form con `key` (como `CompraFormPage`) para precargar las líneas sin `useEffect`+setState.

- [ ] **Step 1: Escribir el test**

```typescript
// src/features/dtes-recibidos/pages/MapearDtePage.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '@/design-system'
import { MapearDtePage } from './MapearDtePage'
import { useAuthStore } from '@/app/auth-store'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/dtes-recibidos/7/mapear']}>
          <Routes>
            <Route path="/dtes-recibidos/:id/mapear" element={<MapearDtePage />} />
            <Route path="/compras/:id" element={<div>Compra creada</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

describe('MapearDtePage', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', status: 'authenticated', user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 2, rolNombre: 'EmisorAdmin', emisorId: 5, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  })

  it('precarga las líneas del DTE y crea la compra (cuadra como gasto)', async () => {
    const user = userEvent.setup()
    setup()
    expect(await screen.findByText('Resma de papel bond carta')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /crear compra/i }))
    expect(await screen.findByText('Compra creada')).toBeInTheDocument()
  }, 15000)
})
```

- [ ] **Step 2: Correr el test (debe fallar)**

Run: `npm run test -- src/features/dtes-recibidos/pages/MapearDtePage.test.tsx`
Expected: FAIL ("Cannot find module './MapearDtePage'").

- [ ] **Step 3: Escribir la página**

```tsx
// src/features/dtes-recibidos/pages/MapearDtePage.tsx
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, FormField, Spinner, EmptyState, useToast } from '@/design-system'
import { useSucursales } from '@/features/facturacion/hooks'
import { useDteRecibido, useMapearYCrearCompra } from '../hooks'
import { parseDteLineas } from '../parse'
import { lineaDesdeParsed, buildMapearDto, type MapeoFormValues } from '../mappers'
import { mapeoSchema } from '../schemas'
import { calcCuadre } from '../calc/mapeo'
import { MapeoLineasTable } from '../components/MapeoLineasTable'
import type { DteRecibidoDto } from '../types'

function MapearForm({ dte, initialValues }: { dte: DteRecibidoDto; initialValues: MapeoFormValues }) {
  const navigate = useNavigate()
  const toast = useToast()
  const sucursales = useSucursales()
  const mapear = useMapearYCrearCompra()
  const [values, setValues] = useState<MapeoFormValues>(initialValues)
  const [error, setError] = useState<string | null>(null)

  const cuadre = calcCuadre(values.lineas.map((l) => ({ accion: l.accion, cantidad: l.cantidad, costoUnitario: l.costoUnitario, montoDte: l.montoDte })), dte.total)

  const crear = async () => {
    const res = mapeoSchema.safeParse(values)
    if (!res.success) { setError(res.error.issues[0]?.message ?? 'Revise el formulario'); return }
    if (!cuadre.cuadra) { setError(`El total mapeado no cuadra con el DTE (diferencia $${cuadre.diferencia.toFixed(2)})`); return }
    setError(null)
    try {
      const dto = buildMapearDto(values)
      const saved = await mapear.mutateAsync({ id: dte.id, dto })
      toast.show('Compra creada desde el DTE')
      navigate(`/compras/${saved.compraId}`)
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error
        ?? (e as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'No se pudo crear la compra'
      toast.show(msg, { tone: 'rojo' })
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Mapear y crear compra</h1>
        <p className="text-sm text-slate">{dte.emisorNombre} · {dte.numeroControl ?? dte.codigoGeneracion} · Total <span className="cifra">${dte.total.toFixed(2)}</span></p>
      </div>
      {error && <p className="rounded-md bg-rojo/10 px-3 py-2 text-sm text-rojo">{error}</p>}

      <FormField label="Sucursal destino" htmlFor="m-suc">
        <select id="m-suc" className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark" value={values.sucursalId ?? ''} onChange={(e) => setValues((v) => ({ ...v, sucursalId: e.target.value ? Number(e.target.value) : null }))}>
          <option value="">Seleccione…</option>
          {(sucursales.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
      </FormField>

      <MapeoLineasTable lineas={values.lineas} onLineas={(lineas) => setValues((v) => ({ ...v, lineas }))} sucursalId={values.sucursalId} totalDte={dte.total} />

      <Button onClick={crear} disabled={mapear.isPending || !cuadre.cuadra}>{mapear.isPending ? 'Creando…' : 'Crear compra (BORRADOR)'}</Button>
    </div>
  )
}

export function MapearDtePage() {
  const { id } = useParams()
  const dteId = Number(id)
  const user = useAuthStoreSucursal()
  const { data, isLoading, isError } = useDteRecibido(dteId)

  if (isLoading) return <div className="p-6"><Spinner /></div>
  if (isError || !data) return <div className="p-6"><EmptyState title="No se pudo cargar el DTE" hint="Intenta de nuevo." /></div>

  const initialValues: MapeoFormValues = {
    sucursalId: user ?? null,
    lineas: parseDteLineas(data.jsonDte).map(lineaDesdeParsed),
  }

  return <MapearForm key={dteId} dte={data} initialValues={initialValues} />
}

// Helper local: sucursal por defecto del usuario (primera accesible).
import { useAuthStore } from '@/app/auth-store'
function useAuthStoreSucursal(): number | null {
  return useAuthStore((s) => s.user?.sucursalIds?.[0] ?? null)
}
```

- [ ] **Step 4: Correr el test (debe pasar) + build**

Run: `npm run test -- src/features/dtes-recibidos/pages/MapearDtePage.test.tsx && npm run build`
Expected: PASS y build OK.

- [ ] **Step 5: Commit**

```bash
git add src/features/dtes-recibidos/pages/MapearDtePage.tsx src/features/dtes-recibidos/pages/MapearDtePage.test.tsx
git commit -m "feat(f5.4-s4): página del asistente mapear-y-crear-compra"
```

---

## Task 13: Configuración Gmail + callback OAuth

**Files:**
- Create: `src/features/dtes-recibidos/pages/ConfiguracionCorreoPage.tsx`
- Create: `src/features/dtes-recibidos/pages/GmailCallbackPage.tsx`
- Test: `src/features/dtes-recibidos/pages/ConfiguracionCorreoPage.test.tsx`
- Test: `src/features/dtes-recibidos/pages/GmailCallbackPage.test.tsx`

**Interfaces:**
- Consumes: `useMiPerfil`, `useGmailConnect`, `useGmailDisconnect`, `useExchangeGmailCode`, `useProbarConexion`, `useConfigurarLectura` (Task 4).
- Produces: `ConfiguracionCorreoPage`, `GmailCallbackPage`.

Nota: `gmailApi.connect()` devuelve la `authorizationUrl`; la página la abre con `window.open`. El callback (`/dtes-recibidos/gmail/callback`) lee `code`+`state` del query y llama `exchangeCode`. **e2e diferido** (sin credenciales Google en dev).

- [ ] **Step 1: Escribir el test de la config**

```typescript
// src/features/dtes-recibidos/pages/ConfiguracionCorreoPage.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/design-system'
import { ConfiguracionCorreoPage } from './ConfiguracionCorreoPage'
import { useAuthStore } from '@/app/auth-store'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><ToastProvider><MemoryRouter><ConfiguracionCorreoPage /></MemoryRouter></ToastProvider></QueryClientProvider>)
}

describe('ConfiguracionCorreoPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', status: 'authenticated', user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 2, rolNombre: 'EmisorAdmin', emisorId: 5, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  })

  it('muestra el estado desconectado y el botón de conectar', async () => {
    setup()
    expect(await screen.findByText(/no conectado/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /conectar gmail/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Correr el test (debe fallar)**

Run: `npm run test -- src/features/dtes-recibidos/pages/ConfiguracionCorreoPage.test.tsx`
Expected: FAIL ("Cannot find module './ConfiguracionCorreoPage'").

- [ ] **Step 3: Escribir `ConfiguracionCorreoPage.tsx`**

```tsx
// src/features/dtes-recibidos/pages/ConfiguracionCorreoPage.tsx
import { Button, Spinner, useToast } from '@/design-system'
import { useMiPerfil, useGmailConnect, useGmailDisconnect, useProbarConexion, useConfigurarLectura } from '../hooks'

export function ConfiguracionCorreoPage() {
  const toast = useToast()
  const perfil = useMiPerfil()
  const connect = useGmailConnect()
  const disconnect = useGmailDisconnect()
  const probar = useProbarConexion()
  const configurar = useConfigurarLectura()

  if (perfil.isLoading) return <div className="p-6"><Spinner /></div>

  const conectado = perfil.data?.gmailConectado ?? false
  const email = perfil.data?.gmailEmail
  const lecturaHabilitada = perfil.data?.lecturaCorreoHabilitada ?? false

  const onConectar = async () => {
    try {
      const { authorizationUrl } = await connect.mutateAsync()
      window.open(authorizationUrl, '_blank', 'noopener')
      toast.show('Autoriza el acceso en la ventana de Google; al volver, prueba la conexión.')
    } catch {
      toast.show('No se pudo iniciar la conexión con Gmail', { tone: 'rojo' })
    }
  }
  const onDesconectar = async () => {
    try { await disconnect.mutateAsync(); toast.show('Gmail desconectado') }
    catch { toast.show('No se pudo desconectar', { tone: 'rojo' }) }
  }
  const onProbar = async () => {
    try { const r = await probar.mutateAsync(); toast.show(r.mensaje, r.exitoso ? undefined : { tone: 'rojo' }) }
    catch { toast.show('No se pudo probar la conexión', { tone: 'rojo' }) }
  }
  const onToggle = async (habilitar: boolean) => {
    try { await configurar.mutateAsync({ lecturaCorreoHabilitada: habilitar }); toast.show('Configuración actualizada') }
    catch { toast.show('No se pudo actualizar la configuración', { tone: 'rojo' }) }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-xl font-semibold text-ink">Configuración de lectura de correo</h1>

      <div className="rounded-xl border border-hairline p-4">
        <p className="text-sm text-slate">Estado de Gmail</p>
        <p className="mt-1 text-base font-medium text-ink">{conectado ? `Conectado (${email})` : 'No conectado'}</p>
        <div className="mt-3 flex gap-2">
          {!conectado && <Button onClick={onConectar} disabled={connect.isPending}>Conectar Gmail</Button>}
          {conectado && <Button variant="ghost" onClick={onProbar} disabled={probar.isPending}>Probar conexión</Button>}
          {conectado && <Button variant="danger" onClick={onDesconectar} disabled={disconnect.isPending}>Desconectar</Button>}
        </div>
      </div>

      <div className="rounded-xl border border-hairline p-4">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={lecturaHabilitada} onChange={(e) => onToggle(e.target.checked)} disabled={configurar.isPending} />
          Habilitar lectura automática de DTEs desde correo
        </label>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Escribir el test del callback**

```typescript
// src/features/dtes-recibidos/pages/GmailCallbackPage.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { GmailCallbackPage } from './GmailCallbackPage'
import { useAuthStore } from '@/app/auth-store'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/dtes-recibidos/gmail/callback?code=abc&state=xyz']}>
        <Routes>
          <Route path="/dtes-recibidos/gmail/callback" element={<GmailCallbackPage />} />
          <Route path="/dtes-recibidos/configuracion" element={<div>Config</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('GmailCallbackPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', status: 'authenticated', user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 2, rolNombre: 'EmisorAdmin', emisorId: 5, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  })

  it('intercambia el código y confirma la conexión', async () => {
    setup()
    expect(await screen.findByText(/cuenta@gmail.com/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 5: Escribir `GmailCallbackPage.tsx`** (usa React Query con la mutación disparada vía un botón visible y auto-ejecución segura sin `useEffect`+setState: el intercambio se hace con `useQuery` parametrizado por los search params)

```tsx
// src/features/dtes-recibidos/pages/GmailCallbackPage.tsx
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, Spinner } from '@/design-system'
import { gmailApi } from '../gmail-api'

export function GmailCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const code = params.get('code') ?? ''
  const state = params.get('state') ?? ''

  // El intercambio ocurre como query (idempotente para la UI): se dispara al montar
  // porque enabled depende de los search params, sin useEffect+setState.
  const exchange = useQuery({
    queryKey: ['gmail-exchange', code, state],
    queryFn: () => gmailApi.exchangeCode(code, state),
    enabled: code !== '' && state !== '',
    retry: false,
  })

  return (
    <div className="mx-auto max-w-md space-y-4 p-6 text-center">
      <h1 className="text-xl font-semibold text-ink">Conectando Gmail…</h1>
      {exchange.isLoading && <Spinner />}
      {exchange.isError && <p className="rounded-md bg-rojo/10 px-3 py-2 text-sm text-rojo">No se pudo conectar Gmail. Intenta de nuevo desde la configuración.</p>}
      {exchange.isSuccess && <p className="rounded-md bg-sello/10 px-3 py-2 text-sm">Gmail conectado: <span className="font-medium">{exchange.data.email}</span></p>}
      {!code && <p className="text-sm text-slate">Falta el código de autorización.</p>}
      <Button onClick={() => navigate('/dtes-recibidos/configuracion')}>Volver a configuración</Button>
    </div>
  )
}
```

- [ ] **Step 6: Correr tests (deben pasar) + build**

Run: `npm run test -- src/features/dtes-recibidos/pages/ConfiguracionCorreoPage.test.tsx src/features/dtes-recibidos/pages/GmailCallbackPage.test.tsx && npm run build`
Expected: PASS y build OK.

- [ ] **Step 7: Commit**

```bash
git add src/features/dtes-recibidos/pages/ConfiguracionCorreoPage.tsx src/features/dtes-recibidos/pages/ConfiguracionCorreoPage.test.tsx src/features/dtes-recibidos/pages/GmailCallbackPage.tsx src/features/dtes-recibidos/pages/GmailCallbackPage.test.tsx
git commit -m "feat(f5.4-s4): configuración Gmail OAuth + callback (e2e diferido)"
```

---

## Task 14: Rutas, navegación e icono

**Files:**
- Modify: `src/app/router.tsx`
- Modify: `src/app/nav-config.ts`
- Modify: `src/design-system/Icon.tsx`
- Test: `src/app/router.dtes.test.tsx` (create)

**Interfaces:**
- Consumes: las 5 páginas (Tasks 6, 7, 12, 13).
- Produces: rutas `/dtes-recibidos`, `/dtes-recibidos/:id`, `/dtes-recibidos/:id/mapear`, `/dtes-recibidos/configuracion`, `/dtes-recibidos/gmail/callback`; item de nav; icono `recibidos`.

- [ ] **Step 1: Añadir el icono `recibidos`** en `src/design-system/Icon.tsx` — dentro del objeto `paths`, tras `proveedores` (antes del `}` de cierre del objeto):

```tsx
  recibidos: (
    <>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
    </>
  ),
```

- [ ] **Step 2: Añadir el item de nav** en `src/app/nav-config.ts` — dentro de la sección `'Compras'`, añadir como tercer item:

```typescript
  { title: 'Compras', items: [
    { label: 'Compras externas', to: '/compras', icon: 'compras' },
    { label: 'Proveedores', to: '/proveedores', icon: 'proveedores' },
    { label: 'DTEs recibidos', to: '/dtes-recibidos', icon: 'recibidos' },
  ] },
```

- [ ] **Step 3: Añadir las rutas** en `src/app/router.tsx` — imports (tras los de compras):

```tsx
import { DtesRecibidosListPage } from '@/features/dtes-recibidos/pages/DtesRecibidosListPage'
import { DteRecibidoDetallePage } from '@/features/dtes-recibidos/pages/DteRecibidoDetallePage'
import { MapearDtePage } from '@/features/dtes-recibidos/pages/MapearDtePage'
import { ConfiguracionCorreoPage } from '@/features/dtes-recibidos/pages/ConfiguracionCorreoPage'
import { GmailCallbackPage } from '@/features/dtes-recibidos/pages/GmailCallbackPage'
```

Rutas (dentro de `<Route element={<AppLayout />}>`, tras las de compras). **Orden importante**: las rutas literales (`configuracion`, `gmail/callback`) antes que `:id` para que no las capture el parámetro:

```tsx
          <Route path="/dtes-recibidos" element={<DtesRecibidosListPage />} />
          <Route path="/dtes-recibidos/configuracion" element={<ConfiguracionCorreoPage />} />
          <Route path="/dtes-recibidos/gmail/callback" element={<GmailCallbackPage />} />
          <Route path="/dtes-recibidos/:id" element={<DteRecibidoDetallePage />} />
          <Route path="/dtes-recibidos/:id/mapear" element={<MapearDtePage />} />
```

- [ ] **Step 4: Escribir el test de rutas**

```typescript
// src/app/router.dtes.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/design-system'
import { AppRoutes } from './router'
import { useAuthStore } from './auth-store'
import { navSections } from './nav-config'

function setup(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

describe('rutas de DTEs recibidos', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', status: 'authenticated', user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 2, rolNombre: 'EmisorAdmin', emisorId: 5, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  })

  it('renderiza el listado en /dtes-recibidos', async () => {
    setup('/dtes-recibidos')
    expect(await screen.findByRole('heading', { name: /dtes recibidos/i })).toBeInTheDocument()
  })

  it('incluye el item de nav', () => {
    const items = navSections.flatMap((s) => s.items)
    expect(items.some((i) => i.to === '/dtes-recibidos')).toBe(true)
  })
})
```

- [ ] **Step 5: Correr tests (deben pasar) + build**

Run: `npm run test -- src/app/router.dtes.test.tsx && npm run build`
Expected: PASS y build OK.

- [ ] **Step 6: Commit**

```bash
git add src/app/router.tsx src/app/nav-config.ts src/design-system/Icon.tsx src/app/router.dtes.test.tsx
git commit -m "feat(f5.4-s4): rutas, navegación e icono de DTEs recibidos"
```

---

## Task 15: GATE de cierre + revisión + finishing

**Files:** (sin código nuevo; verificación y cierre)

- [ ] **Step 1: GATE completo del proyecto**

Run: `npm run test && npm run lint && npm run build`
Expected: TODO en verde (sin tests rojos, 0 errores de lint, build OK). Si algo falla, corregir antes de seguir.

- [ ] **Step 2: Revisión whole-branch** — invocar `superpowers:requesting-code-review` sobre el diff completo de la rama `feat/f5-4-dtes-recibidos` vs `development`. Triagear hallazgos (Critical/Important se corrigen; Minor se documentan en el ledger). El controlador corre esta revisión y los e2e, no subagentes.

- [ ] **Step 3: E2E contra Docker** (lo corre el controlador) — con el stack arriba (`docker compose up -d` desde `FraFactu-Backend` si está caído) y sesión `admin@pruebas.local`/`Pruebas#2026`:
  1. **Cargar JSON**: subir un CCF de prueba (de `test-dtes` en los working dirs) vía `POST /api/dtesrecibidos/cargar-json` → aparece PENDIENTE en el listado. Si la BD de inventario está vacía, sembrar categoría/producto/bodega como en S5; verificar que el receptor del CCF coincide con el NIT del emisor de pruebas (si no, el backend lo rechaza por `ReceptorInvalido`).
  2. **Detalle**: abrir el DTE → ver líneas parseadas.
  3. **Mapear y crear compra**: clasificar líneas (probar las 3 acciones: existente/nuevo/gasto), cuadrar con el total, crear → verificar `MapearDteCompraResponse.compraId`, que el DTE pase a VINCULADO y que exista la `CompraExterna` BORRADOR con `Origen="DTE"`.
  4. **Confirmar la compra creada** (en la feature de compras) → verificar stock en BD: `docker exec frafactu-db psql -U frafactu -d frafactu` (tablas snake_case `stock_bodegas`/`movimientos_inventario`, columnas PascalCase).
  5. **Descartar**: descartar otro DTE PENDIENTE con motivo → verificar estado DESCARTADO.
  - **Diferido (sin credenciales Google)**: flujo Gmail (connect/callback/exchange/leer-correo). Dejar constancia en el ledger de que no se validó e2e.
  - Si el e2e destapa un gap de contrato, corregirlo con la forma exacta del frontend (lección recurrente S1–S5) y volver a correr el GATE.

- [ ] **Step 4: Actualizar el ledger SDD** `.superpowers/sdd/progress.md` con la sección F5.4 S4 (qué se hizo, e2e validado, gaps, minors diferidos).

- [ ] **Step 5: Actualizar memoria del proyecto** — actualizar `frafactu-estado-f5.md` (sección S4) y `frafactu-prompt-siguiente.md` (siguiente = S6 cuentas por cobrar; MH bloqueado) en `C:\Users\LENOVO\.claude\projects\c--Users-LENOVO-Documents-Portafolio-FraFactu-Planning\memory\`.

- [ ] **Step 6: Finishing branch** — invocar `superpowers:finishing-a-development-branch`. Según [[frafactu-politica-git]]: **preguntar la rama destino**, hacer push de `feat/f5-4-dtes-recibidos` y abrir el PR **por web** hacia `development` (no merge directo).

---

## Self-Review (hecho por el autor del plan)

**1. Cobertura del spec:**
- Listado + filtros + estadísticas → Task 6 ✓
- Detalle (parseo jsonDte) → Task 7 ✓
- Carga manual JSON → Task 9 ✓
- Descartar → Task 8 ✓
- Asistente mapear-y-crear-compra (layout A, 3 acciones, cuadre) → Tasks 5, 11, 12 ✓
- Gmail config + callback + leer-correo con polling → Tasks 10, 13 ✓
- Rutas/nav/roles/icono → Task 14 ✓
- Tipos/contrato backend → Task 1 (+ confirmados contra DTOs reales) ✓
- Pruebas + e2e + finishing → Task 15 ✓

**2. Placeholders:** sin TBD/TODO; cada paso de código trae el código. Las decisiones del backend (envoltorio `{items,total,pagina,...}`, DTOs) se verificaron contra el código fuente real.

**3. Consistencia de tipos:** `PagedDtes` usa `pagina/tamanoPagina/totalPaginas` (consumido en Task 6 con `data.pagina`/`data.totalPaginas`). `MapeoFormValues`/`MapeoLineaForm`/`ProductoNuevoForm` definidos en Task 5 y consumidos en Tasks 11–12. Hooks (Task 4) consumidos por nombre exacto en Tasks 6–13. `useCatalogo('tiposItems')`/`('unidadesMedida')` devuelven `CatalogoItem` con `.valor` (usado en Task 11).

**Riesgos conocidos (validar en e2e, Task 15):**
- Nombres de campos de `DteRecibidoEstadisticasDto` y `CargaMasivaDtesResponseDto`: confirmados contra los DTOs reales.
- `GmailRedirectUri` del backend debe apuntar a `/dtes-recibidos/gmail/callback` (supuesto; Gmail diferido).
- El default de `montoConIva` por línea (gravada×1.13) puede no cuadrar exacto con CCF mixtos (exento/no sujeto/descuentos); el panel de cuadre lo surface y el usuario ajusta antes de crear.
