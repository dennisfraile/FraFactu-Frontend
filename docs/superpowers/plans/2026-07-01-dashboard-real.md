# Dashboard real — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el placeholder de `/dashboard` por un dashboard real que consume los 9 endpoints del `DashboardController`, con gráficos (recharts), curación por rol y selector de período.

**Architecture:** Feature `src/features/dashboard/` con el patrón del proyecto (types/api/hooks/date-range/roles + components + page). `api.ts` absorbe la inconsistencia de params de fecha del backend. Secciones gateadas por rol (`<Can>`) y por `accesoTodasSucursales`. `DashboardPage` se carga con `React.lazy` para sacar recharts del chunk principal.

**Tech Stack:** React 19 + TypeScript + Vite 7, Vitest 3 + Testing Library + MSW, TanStack Query v5, axios (`@/lib/http/axios`), recharts (nueva dep), zustand (`useAuthStore`), react-router-dom 7.

## Global Constraints

- Rama: `feat/dashboard-real` (ya creada desde `development`).
- Cliente HTTP: `import { api } from '@/lib/http/axios'`; `api.get<T>(url, { params })` devuelve `{ data }`. Base ya incluye `/api`.
- React Query: `useQuery({ queryKey: ['dashboard-*', params], queryFn })`; `enabled` para secciones condicionales.
- Gating por rol con `<Can roles={RolNombre[]}>` de `@/lib/authz/Can`; `useAuthz()` de `@/lib/authz/useAuthz`; usuario vía `useAuthStore` (`@/app/auth-store`), campos `user.rolNombre`, `user.accesoTodasSucursales`, `user.sucursalIds`.
- Curación por rol del dashboard vive en `src/features/dashboard/roles.ts` (NO en `src/lib/authz/acciones.ts`): es UX, no seguridad (el backend autoriza los 6 roles).
- Design system desde `@/design-system`: `Card`, `Spinner`, `EmptyState` (`title`, `hint`), `Table` (`columns`, `rows`, `getRowKey`, `serverPagination={{page,totalPages,onPageChange}}`), `Button` (`variant`, `size`), `Input`, `Badge`. Colores: `sello`, `oro`, `ink`, `slate`, `rojo`, `surface`, `hairline` (clases Tailwind `text-sello`, `bg-sello`, etc.).
- `useSucursales()` se importa de `@/features/facturacion/hooks` (devuelve query de `{ id, nombre }[]` desde `/sucursales/todas-activas`).
- Fechas: se envían ISO string (`toISOString()`). El backend devuelve ISO.
- recharts v3 (soporta React 19). Instalar con `npm install recharts`.
- Test único: `npx vitest run <ruta>`. MSW base URL en tests: `http://localhost:8080/api`.
- Patrón de autenticación en tests:
  ```ts
  useAuthStore.setState({ token: 't', status: 'authenticated',
    user: { userId: 1, nombreCompleto: 'X', email: 'x@x.com', rolId: 1, rolNombre: 'EmisorAdmin', emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  ```
- Cada tarea termina con su suite verde. Task final: `npm run test`, `npm run lint`, `npm run build`.

---

## File Structure

- `src/features/dashboard/types.ts` — DTOs de los 9 endpoints + `PagedResult<T>` + `RangoParams`.
- `src/features/dashboard/date-range.ts` — presets → rango ISO + período anterior.
- `src/features/dashboard/roles.ts` — constantes de curación por rol.
- `src/features/dashboard/api.ts` — `dashboardApi` (9 métodos, mapeo de params).
- `src/features/dashboard/hooks.ts` — hooks React Query.
- `src/features/dashboard/components/` — `KpiCard`, `KpisSection`, `VentasPorDiaChart`, `TopProductosCard`, `VentasPorCategoriaSection`, `CategoriaDetalleTable`, `VentasPorVendedorSection`, `VendedorDetalleTable`, `ComparativoSucursalesTable`, `CajeroDashboard`, `PeriodoSelector`, `SucursalSelector`.
- `src/features/dashboard/pages/DashboardPage.tsx` — orquestación.
- `src/test/msw/dashboard-handlers.ts` — handlers de ejemplo; registrado en `src/test/msw/handlers.ts`.
- `src/app/router.tsx` — `/dashboard` → `DashboardPage` (lazy). Se elimina `DashboardPlaceholder`.

---

## Task 1: Dependencia recharts + `types.ts`

**Files:**
- Modify: `package.json` (dep recharts)
- Create: `src/features/dashboard/types.ts`, `src/features/dashboard/types.test.ts`

**Interfaces:**
- Produces: `PagedResult<T>`, `RangoParams`, `DashboardKPIs`, `VentasPorDia`, `ProductoMasVendido`, `VentasPorCategoria`, `VentaCategoriaDetalle`, `VentasPorVendedor`, `VentaVendedorDetalle`, `ComparativoSucursal`, `VentaDiaCajero`, `DashboardCajero`.

- [ ] **Step 1: Instalar recharts**

Run: `npm install recharts`
Expected: recharts (v3.x) añadido a `dependencies`; `npm install` sin errores de peer deps con React 19.

- [ ] **Step 2: Escribir el test que falla**

Crear `src/features/dashboard/types.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import type { DashboardKPIs, PagedResult, ComparativoSucursal } from './types'

describe('dashboard types', () => {
  it('DashboardKPIs tiene las 7 métricas', () => {
    const k: DashboardKPIs = { totalFacturas: 1, totalVentas: 2, promedioVenta: 3, facturasAprobadas: 4, facturasPendientes: 5, facturasRechazadas: 6, crecimientoVentas: 7 }
    expect(k.totalVentas).toBe(2)
  })
  it('PagedResult envuelve items y metadatos', () => {
    const p: PagedResult<ComparativoSucursal> = { items: [], totalItems: 0, pageNumber: 1, pageSize: 50, totalPages: 0, hasPreviousPage: false, hasNextPage: false }
    expect(p.items).toEqual([])
  })
})
```

- [ ] **Step 3: Correr y verificar que falla**

Run: `npx vitest run src/features/dashboard/types.test.ts`
Expected: FAIL — `./types` no existe.

- [ ] **Step 4: Implementar**

Crear `src/features/dashboard/types.ts`:

```ts
export interface PagedResult<T> {
  items: T[]
  totalItems: number
  pageNumber: number
  pageSize: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface RangoParams { fechaInicio?: string; fechaFin?: string; sucursalId?: number }

export interface DashboardKPIs {
  totalFacturas: number
  totalVentas: number
  promedioVenta: number
  facturasAprobadas: number
  facturasPendientes: number
  facturasRechazadas: number
  crecimientoVentas: number
}

export interface VentasPorDia { fecha: string; cantidadFacturas: number; totalVentas: number }

export interface ProductoMasVendido { productoId: number; nombreProducto: string; cantidadVendida: number; totalVentas: number }

export interface VentasPorCategoria { categoriaId: number; nombreCategoria: string; totalVentas: number; cantidadVendidaReales: number; cantidadProductos: number }

export interface VentaCategoriaDetalle {
  facturaDetalleId: number; facturaId: number; numeroControl: string; codigoGeneracion: string
  fechaEmision: string; productoId: number | null; productoNombre: string
  categoriaId: number | null; categoriaNombre: string | null; cantidad: number; totalVenta: number
  receptorNombre: string; sucursalId: number | null; sucursalNombre: string | null
}

export interface VentasPorVendedor { vendedorId: number; codigoVendedor: string; nombreVendedor: string; totalVentas: number; cantidadFacturas: number; promedioVenta: number }

export interface VentaVendedorDetalle {
  facturaId: number; numeroControl: string; codigoGeneracion: string; fechaEmision: string
  receptorNombre: string; totalPagar: number; estadoHacienda: string
  vendedorId: number | null; vendedorCodigo: string | null; vendedorNombre: string | null
  sucursalId: number | null; sucursalNombre: string | null
}

export interface ComparativoSucursal { sucursalId: number; codigoSucursal: string; nombreSucursal: string; totalFacturas: number; totalVentas: number; promedioVenta: number; porcentajeDelTotal: number }

export interface VentaDiaCajero { fecha: string; cantidadFacturas: number; montoTotal: number }
export interface DashboardCajero { totalFacturas: number; montoTotalVendido: number; promedioVenta: number; ventasPorDia: VentaDiaCajero[] }
```

- [ ] **Step 5: Correr y verificar que pasa**

Run: `npx vitest run src/features/dashboard/types.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/features/dashboard/types.ts src/features/dashboard/types.test.ts
git commit -m "feat(dashboard): recharts + types del contrato del DashboardController"
```

---

## Task 2: `date-range.ts` (presets + período anterior)

**Files:**
- Create: `src/features/dashboard/date-range.ts`, `src/features/dashboard/date-range.test.ts`

**Interfaces:**
- Produces: `type Preset = 'hoy'|'7d'|'30d'|'mes'`; `interface Rango { fechaInicio: string; fechaFin: string }`; `rangoDePreset(preset: Preset, ahora?: Date): Rango`; `periodoAnterior(r: Rango): { fechaAnteriorInicio: string; fechaAnteriorFin: string }`.

- [ ] **Step 1: Escribir el test que falla**

Crear `src/features/dashboard/date-range.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { rangoDePreset, periodoAnterior } from './date-range'

const ahora = new Date('2026-03-15T12:00:00Z')

describe('rangoDePreset', () => {
  it('30d abarca 30 días terminando hoy', () => {
    const r = rangoDePreset('30d', ahora)
    expect(new Date(r.fechaFin).getTime()).toBeGreaterThan(new Date(r.fechaInicio).getTime())
    const dias = (new Date(r.fechaFin).getTime() - new Date(r.fechaInicio).getTime()) / 86400000
    expect(dias).toBeGreaterThan(29)
    expect(dias).toBeLessThan(31)
  })
  it('hoy: inicio y fin caen el mismo día', () => {
    const r = rangoDePreset('hoy', ahora)
    expect(r.fechaInicio.slice(0, 10)).toBe(r.fechaFin.slice(0, 10))
  })
})

describe('periodoAnterior', () => {
  it('el período anterior tiene el mismo largo y termina justo antes del inicio', () => {
    const r = rangoDePreset('7d', ahora)
    const prev = periodoAnterior(r)
    expect(new Date(prev.fechaAnteriorFin).getTime()).toBeLessThanOrEqual(new Date(r.fechaInicio).getTime())
    const largoActual = new Date(r.fechaFin).getTime() - new Date(r.fechaInicio).getTime()
    const largoPrev = new Date(prev.fechaAnteriorFin).getTime() - new Date(prev.fechaAnteriorInicio).getTime()
    expect(Math.abs(largoActual - largoPrev)).toBeLessThan(1000)
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/features/dashboard/date-range.test.ts`
Expected: FAIL — `./date-range` no existe.

- [ ] **Step 3: Implementar**

Crear `src/features/dashboard/date-range.ts`:

```ts
export type Preset = 'hoy' | '7d' | '30d' | 'mes'
export interface Rango { fechaInicio: string; fechaFin: string }

function inicioDelDia(d: Date): Date { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
function finDelDia(d: Date): Date { const x = new Date(d); x.setHours(23, 59, 59, 999); return x }

export function rangoDePreset(preset: Preset, ahora: Date = new Date()): Rango {
  const fin = finDelDia(ahora)
  let inicio: Date
  switch (preset) {
    case 'hoy': inicio = inicioDelDia(ahora); break
    case '7d': { const d = new Date(ahora); d.setDate(d.getDate() - 6); inicio = inicioDelDia(d); break }
    case '30d': { const d = new Date(ahora); d.setDate(d.getDate() - 29); inicio = inicioDelDia(d); break }
    case 'mes': { const d = new Date(ahora.getFullYear(), ahora.getMonth(), 1); inicio = inicioDelDia(d); break }
  }
  return { fechaInicio: inicio.toISOString(), fechaFin: fin.toISOString() }
}

export function periodoAnterior(r: Rango): { fechaAnteriorInicio: string; fechaAnteriorFin: string } {
  const inicio = new Date(r.fechaInicio).getTime()
  const fin = new Date(r.fechaFin).getTime()
  const largo = fin - inicio
  const anteriorFin = new Date(inicio - 1)
  const anteriorInicio = new Date(inicio - 1 - largo)
  return { fechaAnteriorInicio: anteriorInicio.toISOString(), fechaAnteriorFin: anteriorFin.toISOString() }
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npx vitest run src/features/dashboard/date-range.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/date-range.ts src/features/dashboard/date-range.test.ts
git commit -m "feat(dashboard): helper de presets de fecha y período anterior"
```

---

## Task 3: `roles.ts` (curación por rol)

**Files:**
- Create: `src/features/dashboard/roles.ts`, `src/features/dashboard/roles.test.ts`

**Interfaces:**
- Consumes: `RolNombre` de `@/lib/authz/roles`.
- Produces: `DASHBOARD_GERENCIAL: RolNombre[]`, `DASHBOARD_CAJERO: RolNombre[]`.

- [ ] **Step 1: Escribir el test que falla**

Crear `src/features/dashboard/roles.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { DASHBOARD_GERENCIAL, DASHBOARD_CAJERO } from './roles'

describe('curación de roles del dashboard', () => {
  it('gerencial cubre admin/gerente/contador/auditor/superadmin, sin Cajero', () => {
    expect(DASHBOARD_GERENCIAL).toEqual(['SuperAdmin', 'EmisorAdmin', 'GerenteSucursal', 'Contador', 'Auditor'])
    expect(DASHBOARD_GERENCIAL).not.toContain('Cajero')
  })
  it('la sección de cajero es solo para Cajero', () => {
    expect(DASHBOARD_CAJERO).toEqual(['Cajero'])
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/features/dashboard/roles.test.ts`
Expected: FAIL — `./roles` no existe.

- [ ] **Step 3: Implementar**

Crear `src/features/dashboard/roles.ts`:

```ts
// Curación de UX del dashboard (NO seguridad: el backend autoriza los 6 roles).
// Decide qué secciones ve cada rol. El selector de sucursal y el comparativo
// se condicionan aparte por user.accesoTodasSucursales.
import type { RolNombre } from '@/lib/authz/roles'

export const DASHBOARD_GERENCIAL: RolNombre[] = ['SuperAdmin', 'EmisorAdmin', 'GerenteSucursal', 'Contador', 'Auditor']
export const DASHBOARD_CAJERO: RolNombre[] = ['Cajero']
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npx vitest run src/features/dashboard/roles.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/roles.ts src/features/dashboard/roles.test.ts
git commit -m "feat(dashboard): constantes de curación por rol"
```

---

## Task 4: `api.ts` + handlers MSW

**Files:**
- Create: `src/features/dashboard/api.ts`, `src/features/dashboard/api.test.ts`, `src/test/msw/dashboard-handlers.ts`
- Modify: `src/test/msw/handlers.ts` (registrar `...dashboardHandlers`)

**Interfaces:**
- Consumes: tipos de Task 1; `api` de `@/lib/http/axios`.
- Produces: `dashboardApi` con métodos `kpis`, `ventasPorDia`, `topProductos`, `ventasPorCategoria`, `categoriaDetalle`, `ventasPorVendedor`, `vendedorDetalle`, `comparativoSucursales`, `cajero`. Y `export const dashboardHandlers` en el archivo MSW.

- [ ] **Step 1: Escribir los handlers MSW de ejemplo**

Crear `src/test/msw/dashboard-handlers.ts`:

```ts
import { http, HttpResponse } from 'msw'
import type {
  DashboardKPIs, VentasPorDia, ProductoMasVendido, VentasPorCategoria,
  VentasPorVendedor, ComparativoSucursal, DashboardCajero, PagedResult,
  VentaCategoriaDetalle, VentaVendedorDetalle,
} from '@/features/dashboard/types'

const base = 'http://localhost:8080/api'

export const kpisEjemplo: DashboardKPIs = { totalFacturas: 120, totalVentas: 45000, promedioVenta: 375, facturasAprobadas: 100, facturasPendientes: 15, facturasRechazadas: 5, crecimientoVentas: 12.5 }
const ventasDia: VentasPorDia[] = [{ fecha: '2026-03-01T00:00:00Z', cantidadFacturas: 4, totalVentas: 1200 }, { fecha: '2026-03-02T00:00:00Z', cantidadFacturas: 6, totalVentas: 2100 }]
const topProd: ProductoMasVendido[] = [{ productoId: 2, nombreProducto: 'Escritorio', cantidadVendida: 30, totalVentas: 9000 }]
const porCategoria: VentasPorCategoria[] = [{ categoriaId: 1, nombreCategoria: 'Muebles', totalVentas: 20000, cantidadVendidaReales: 120, cantidadProductos: 8 }]
const porVendedor: VentasPorVendedor[] = [{ vendedorId: 1, codigoVendedor: 'V01', nombreVendedor: 'Ana Vendedora', totalVentas: 15000, cantidadFacturas: 40, promedioVenta: 375 }]
const comparativo: PagedResult<ComparativoSucursal> = { items: [{ sucursalId: 2, codigoSucursal: 'S02', nombreSucursal: 'Casa Matriz', totalFacturas: 120, totalVentas: 45000, promedioVenta: 375, porcentajeDelTotal: 100 }], totalItems: 1, pageNumber: 1, pageSize: 50, totalPages: 1, hasPreviousPage: false, hasNextPage: false }
const catDetalle: PagedResult<VentaCategoriaDetalle> = { items: [{ facturaDetalleId: 1, facturaId: 10, numeroControl: 'DTE-01-0001', codigoGeneracion: 'ABC', fechaEmision: '2026-03-02T10:00:00Z', productoId: 2, productoNombre: 'Escritorio', categoriaId: 1, categoriaNombre: 'Muebles', cantidad: 2, totalVenta: 600, receptorNombre: 'Cliente X', sucursalId: 2, sucursalNombre: 'Casa Matriz' }], totalItems: 1, pageNumber: 1, pageSize: 50, totalPages: 1, hasPreviousPage: false, hasNextPage: false }
const vendDetalle: PagedResult<VentaVendedorDetalle> = { items: [{ facturaId: 10, numeroControl: 'DTE-01-0001', codigoGeneracion: 'ABC', fechaEmision: '2026-03-02T10:00:00Z', receptorNombre: 'Cliente X', totalPagar: 600, estadoHacienda: 'APROBADO', vendedorId: 1, vendedorCodigo: 'V01', vendedorNombre: 'Ana Vendedora', sucursalId: 2, sucursalNombre: 'Casa Matriz' }], totalItems: 1, pageNumber: 1, pageSize: 50, totalPages: 1, hasPreviousPage: false, hasNextPage: false }
const cajero: DashboardCajero = { totalFacturas: 20, montoTotalVendido: 7500, promedioVenta: 375, ventasPorDia: [{ fecha: '2026-03-02T00:00:00Z', cantidadFacturas: 3, montoTotal: 1100 }] }

export const dashboardHandlers = [
  http.get(`${base}/dashboard/kpis`, () => HttpResponse.json(kpisEjemplo)),
  http.get(`${base}/dashboard/ventas-por-dia`, () => HttpResponse.json(ventasDia)),
  http.get(`${base}/dashboard/productos-mas-vendidos`, () => HttpResponse.json(topProd)),
  http.get(`${base}/dashboard/ventas-por-categoria`, () => HttpResponse.json(porCategoria)),
  http.get(`${base}/dashboard/ventas-por-categoria/detalle`, () => HttpResponse.json(catDetalle)),
  http.get(`${base}/dashboard/ventas-por-vendedor`, () => HttpResponse.json(porVendedor)),
  http.get(`${base}/dashboard/ventas-por-vendedor/detalle`, () => HttpResponse.json(vendDetalle)),
  http.get(`${base}/dashboard/comparativo-sucursales`, () => HttpResponse.json(comparativo)),
  http.get(`${base}/dashboard/cajero`, () => HttpResponse.json(cajero)),
]
```

- [ ] **Step 2: Registrar en handlers.ts**

En `src/test/msw/handlers.ts`, añadir el import y el spread (additive, al final del array `handlers`):

```ts
import { dashboardHandlers } from './dashboard-handlers'
// ... dentro del array:
  ...dashboardHandlers,
```

- [ ] **Step 3: Escribir el test que falla**

Crear `src/features/dashboard/api.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { dashboardApi } from './api'
import { dashboardHandlers } from '@/test/msw/dashboard-handlers'

const base = 'http://localhost:8080/api'
const server = setupServer(...dashboardHandlers)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())

describe('dashboardApi', () => {
  it('kpis devuelve las métricas', async () => {
    const k = await dashboardApi.kpis({ fechaInicio: 'a', fechaFin: 'b' })
    expect(k.totalVentas).toBe(45000)
  })
  it('comparativoSucursales mapea fechaInicio/fechaFin a desde/hasta requeridos', async () => {
    let qs = ''
    server.use(http.get(`${base}/dashboard/comparativo-sucursales`, ({ request }) => {
      qs = new URL(request.url).search
      return HttpResponse.json({ items: [], totalItems: 0, pageNumber: 1, pageSize: 50, totalPages: 0, hasPreviousPage: false, hasNextPage: false })
    }))
    await dashboardApi.comparativoSucursales({ fechaInicio: '2026-01-01', fechaFin: '2026-01-31', page: 1, pageSize: 50 })
    expect(qs).toContain('desde=2026-01-01')
    expect(qs).toContain('hasta=2026-01-31')
  })
  it('cajero mapea a fechaDesde/fechaHasta', async () => {
    let qs = ''
    server.use(http.get(`${base}/dashboard/cajero`, ({ request }) => {
      qs = new URL(request.url).search
      return HttpResponse.json({ totalFacturas: 0, montoTotalVendido: 0, promedioVenta: 0, ventasPorDia: [] })
    }))
    await dashboardApi.cajero({ fechaInicio: '2026-01-01', fechaFin: '2026-01-31' })
    expect(qs).toContain('fechaDesde=2026-01-01')
    expect(qs).toContain('fechaHasta=2026-01-31')
  })
})
```

- [ ] **Step 4: Correr y verificar que falla**

Run: `npx vitest run src/features/dashboard/api.test.ts`
Expected: FAIL — `./api` no existe.

- [ ] **Step 5: Implementar**

Crear `src/features/dashboard/api.ts`:

```ts
import { api } from '@/lib/http/axios'
import type {
  DashboardKPIs, VentasPorDia, ProductoMasVendido, VentasPorCategoria,
  VentasPorVendedor, ComparativoSucursal, DashboardCajero, PagedResult,
  VentaCategoriaDetalle, VentaVendedorDetalle, RangoParams,
} from './types'

interface Pagina { page?: number; pageSize?: number; search?: string }

export const dashboardApi = {
  async kpis(p: RangoParams & { fechaAnteriorInicio?: string; fechaAnteriorFin?: string }): Promise<DashboardKPIs> {
    const { data } = await api.get<DashboardKPIs>('/dashboard/kpis', { params: p })
    return data
  },
  async ventasPorDia(p: { dias?: number; sucursalId?: number }): Promise<VentasPorDia[]> {
    const { data } = await api.get<VentasPorDia[]>('/dashboard/ventas-por-dia', { params: p })
    return data
  },
  async topProductos(p: RangoParams & { top?: number }): Promise<ProductoMasVendido[]> {
    const { data } = await api.get<ProductoMasVendido[]>('/dashboard/productos-mas-vendidos', { params: p })
    return data
  },
  async ventasPorCategoria(p: RangoParams): Promise<VentasPorCategoria[]> {
    const { data } = await api.get<VentasPorCategoria[]>('/dashboard/ventas-por-categoria', { params: p })
    return data
  },
  async categoriaDetalle(p: RangoParams & Pagina & { categoriaId?: number }): Promise<PagedResult<VentaCategoriaDetalle>> {
    const { data } = await api.get<PagedResult<VentaCategoriaDetalle>>('/dashboard/ventas-por-categoria/detalle', { params: p })
    return data
  },
  async ventasPorVendedor(p: RangoParams): Promise<VentasPorVendedor[]> {
    const { data } = await api.get<VentasPorVendedor[]>('/dashboard/ventas-por-vendedor', { params: p })
    return data
  },
  async vendedorDetalle(p: RangoParams & Pagina & { vendedorId?: number }): Promise<PagedResult<VentaVendedorDetalle>> {
    const { data } = await api.get<PagedResult<VentaVendedorDetalle>>('/dashboard/ventas-por-vendedor/detalle', { params: p })
    return data
  },
  async comparativoSucursales(p: RangoParams & Pagina): Promise<PagedResult<ComparativoSucursal>> {
    const { fechaInicio, fechaFin, sucursalId, page, pageSize, search } = p
    const params = { desde: fechaInicio, hasta: fechaFin, sucursalId, page, pageSize, search }
    const { data } = await api.get<PagedResult<ComparativoSucursal>>('/dashboard/comparativo-sucursales', { params })
    return data
  },
  async cajero(p: RangoParams): Promise<DashboardCajero> {
    const params = { fechaDesde: p.fechaInicio, fechaHasta: p.fechaFin }
    const { data } = await api.get<DashboardCajero>('/dashboard/cajero', { params })
    return data
  },
}
```

- [ ] **Step 6: Correr y verificar que pasa**

Run: `npx vitest run src/features/dashboard/api.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/dashboard/api.ts src/features/dashboard/api.test.ts src/test/msw/dashboard-handlers.ts src/test/msw/handlers.ts
git commit -m "feat(dashboard): api.ts (9 endpoints, mapeo de params) + handlers MSW"
```

---

## Task 5: `hooks.ts`

**Files:**
- Create: `src/features/dashboard/hooks.ts`, `src/features/dashboard/hooks.test.tsx`

**Interfaces:**
- Consumes: `dashboardApi` (Task 4), tipos (Task 1).
- Produces: `useKpis(p)`, `useVentasPorDia(p)`, `useTopProductos(p)`, `useVentasPorCategoria(p)`, `useCategoriaDetalle(p)`, `useVentasPorVendedor(p)`, `useVendedorDetalle(p)`, `useComparativoSucursales(p, enabled)`, `useDashboardCajero(p, enabled)`. Cada uno devuelve el resultado de `useQuery`.

- [ ] **Step 1: Escribir el test que falla**

Crear `src/features/dashboard/hooks.test.tsx`:

```tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { dashboardHandlers } from '@/test/msw/dashboard-handlers'
import { useKpis, useComparativoSucursales } from './hooks'

const server = setupServer(...dashboardHandlers)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('dashboard hooks', () => {
  it('useKpis trae las métricas', async () => {
    const { result } = renderHook(() => useKpis({ fechaInicio: 'a', fechaFin: 'b' }), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.totalVentas).toBe(45000)
  })
  it('useComparativoSucursales no dispara si enabled=false', async () => {
    const { result } = renderHook(() => useComparativoSucursales({ fechaInicio: 'a', fechaFin: 'b', page: 1, pageSize: 50 }, false), { wrapper })
    expect(result.current.fetchStatus).toBe('idle')
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/features/dashboard/hooks.test.tsx`
Expected: FAIL — `./hooks` no existe.

- [ ] **Step 3: Implementar**

Crear `src/features/dashboard/hooks.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from './api'
import type { RangoParams } from './types'

type Pagina = { page?: number; pageSize?: number; search?: string }

export function useKpis(p: RangoParams & { fechaAnteriorInicio?: string; fechaAnteriorFin?: string }) {
  return useQuery({ queryKey: ['dashboard-kpis', p], queryFn: () => dashboardApi.kpis(p) })
}
export function useVentasPorDia(p: { dias?: number; sucursalId?: number }) {
  return useQuery({ queryKey: ['dashboard-ventas-dia', p], queryFn: () => dashboardApi.ventasPorDia(p) })
}
export function useTopProductos(p: RangoParams & { top?: number }) {
  return useQuery({ queryKey: ['dashboard-top-productos', p], queryFn: () => dashboardApi.topProductos(p) })
}
export function useVentasPorCategoria(p: RangoParams) {
  return useQuery({ queryKey: ['dashboard-categoria', p], queryFn: () => dashboardApi.ventasPorCategoria(p) })
}
export function useCategoriaDetalle(p: RangoParams & Pagina & { categoriaId?: number }) {
  return useQuery({ queryKey: ['dashboard-categoria-detalle', p], queryFn: () => dashboardApi.categoriaDetalle(p) })
}
export function useVentasPorVendedor(p: RangoParams) {
  return useQuery({ queryKey: ['dashboard-vendedor', p], queryFn: () => dashboardApi.ventasPorVendedor(p) })
}
export function useVendedorDetalle(p: RangoParams & Pagina & { vendedorId?: number }) {
  return useQuery({ queryKey: ['dashboard-vendedor-detalle', p], queryFn: () => dashboardApi.vendedorDetalle(p) })
}
export function useComparativoSucursales(p: RangoParams & Pagina, enabled: boolean) {
  return useQuery({ queryKey: ['dashboard-comparativo', p], queryFn: () => dashboardApi.comparativoSucursales(p), enabled })
}
export function useDashboardCajero(p: RangoParams, enabled: boolean) {
  return useQuery({ queryKey: ['dashboard-cajero', p], queryFn: () => dashboardApi.cajero(p), enabled })
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npx vitest run src/features/dashboard/hooks.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/hooks.ts src/features/dashboard/hooks.test.tsx
git commit -m "feat(dashboard): hooks React Query"
```

---

## Task 6: `KpiCard` + `KpisSection`

**Files:**
- Create: `src/features/dashboard/components/KpiCard.tsx`, `KpiCard.test.tsx`, `KpisSection.tsx`

**Interfaces:**
- Consumes: `useKpis` (Task 5), `Card` de `@/design-system`.
- Produces: `KpiCard({ label, valor, delta? })`; `KpisSection({ params })` donde `params: RangoParams & { fechaAnteriorInicio?, fechaAnteriorFin? }`.

- [ ] **Step 1: Escribir el test que falla**

Crear `src/features/dashboard/components/KpiCard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KpiCard } from './KpiCard'

describe('KpiCard', () => {
  it('muestra label y valor', () => {
    render(<KpiCard label="Total ventas" valor="$45,000" />)
    expect(screen.getByText('Total ventas')).toBeInTheDocument()
    expect(screen.getByText('$45,000')).toBeInTheDocument()
  })
  it('muestra el delta con signo', () => {
    render(<KpiCard label="Crecimiento" valor="12.5%" delta={12.5} />)
    expect(screen.getByText(/12\.5/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/features/dashboard/components/KpiCard.test.tsx`
Expected: FAIL — `./KpiCard` no existe.

- [ ] **Step 3: Implementar KpiCard**

Crear `src/features/dashboard/components/KpiCard.tsx`:

```tsx
import { Card } from '@/design-system'

interface Props { label: string; valor: string; delta?: number }

export function KpiCard({ label, valor, delta }: Props) {
  const positivo = (delta ?? 0) >= 0
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-slate">{label}</p>
      <p className="cifra mt-1 text-2xl font-semibold text-ink">{valor}</p>
      {delta != null && (
        <p className={`mt-1 text-xs ${positivo ? 'text-sello' : 'text-rojo'}`}>
          {positivo ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
        </p>
      )}
    </Card>
  )
}
```

- [ ] **Step 4: Implementar KpisSection**

Crear `src/features/dashboard/components/KpisSection.tsx`:

```tsx
import { Spinner, EmptyState } from '@/design-system'
import { useKpis } from '../hooks'
import type { RangoParams } from '../types'
import { KpiCard } from './KpiCard'

const money = (n: number) => `$${n.toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function KpisSection({ params }: { params: RangoParams & { fechaAnteriorInicio?: string; fechaAnteriorFin?: string } }) {
  const { data, isLoading, isError } = useKpis(params)
  if (isLoading) return <div className="flex justify-center py-6"><Spinner /></div>
  if (isError || !data) return <EmptyState title="Sin KPIs" hint="No se pudieron cargar los indicadores." />
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <KpiCard label="Total ventas" valor={money(data.totalVentas)} delta={data.crecimientoVentas} />
      <KpiCard label="Nº facturas" valor={String(data.totalFacturas)} />
      <KpiCard label="Promedio venta" valor={money(data.promedioVenta)} />
      <KpiCard label="Aprobadas" valor={String(data.facturasAprobadas)} />
      <KpiCard label="Pendientes" valor={String(data.facturasPendientes)} />
      <KpiCard label="Rechazadas" valor={String(data.facturasRechazadas)} />
    </div>
  )
}
```

- [ ] **Step 5: Correr y verificar que pasa**

Run: `npx vitest run src/features/dashboard/components/KpiCard.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/dashboard/components/KpiCard.tsx src/features/dashboard/components/KpiCard.test.tsx src/features/dashboard/components/KpisSection.tsx
git commit -m "feat(dashboard): KpiCard + KpisSection"
```

---

## Task 7: Charts (`VentasPorDiaChart`, `TopProductosCard`)

**Files:**
- Create: `src/features/dashboard/components/VentasPorDiaChart.tsx`, `TopProductosCard.tsx`, `VentasPorDiaChart.test.tsx`

**Interfaces:**
- Consumes: `useVentasPorDia`, `useTopProductos` (Task 5); recharts.
- Produces: `VentasPorDiaChart({ dias, sucursalId })`; `TopProductosCard({ params })`.

**Nota (recharts en jsdom):** `ResponsiveContainer` no mide ancho en jsdom y no renderiza el SVG. En el test se mockea a un `<div>` de tamaño fijo. Los componentes envuelven el chart en `ResponsiveContainer`; el test asevera que el componente monta y muestra su encabezado/estado, sin depender de paths SVG.

- [ ] **Step 1: Escribir el test que falla**

Crear `src/features/dashboard/components/VentasPorDiaChart.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { dashboardHandlers } from '@/test/msw/dashboard-handlers'

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>()
  return { ...actual, ResponsiveContainer: ({ children }: { children: ReactNode }) => <div style={{ width: 500, height: 300 }}>{children}</div> }
})

import { VentasPorDiaChart } from './VentasPorDiaChart'

const server = setupServer(...dashboardHandlers)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('VentasPorDiaChart', () => {
  it('renderiza el encabezado tras cargar datos', async () => {
    render(<VentasPorDiaChart dias={30} />, { wrapper })
    await waitFor(() => expect(screen.getByText(/ventas por día/i)).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/features/dashboard/components/VentasPorDiaChart.test.tsx`
Expected: FAIL — `./VentasPorDiaChart` no existe.

- [ ] **Step 3: Implementar VentasPorDiaChart**

Crear `src/features/dashboard/components/VentasPorDiaChart.tsx`:

```tsx
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, Spinner, EmptyState } from '@/design-system'
import { useVentasPorDia } from '../hooks'

export function VentasPorDiaChart({ dias, sucursalId }: { dias: number; sucursalId?: number }) {
  const { data, isLoading, isError } = useVentasPorDia({ dias, sucursalId })
  return (
    <Card className="p-4">
      <h2 className="mb-3 font-display text-base font-semibold text-ink">Ventas por día</h2>
      {isLoading ? <div className="flex justify-center py-6"><Spinner /></div>
        : isError || !data?.length ? <EmptyState title="Sin datos" hint="No hay ventas en el período." />
        : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.map((d) => ({ ...d, dia: d.fecha.slice(5, 10) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e1d4" />
              <XAxis dataKey="dia" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Area type="monotone" dataKey="totalVentas" stroke="#1f6b4f" fill="#e7efe9" />
            </AreaChart>
          </ResponsiveContainer>
        )}
    </Card>
  )
}
```

- [ ] **Step 4: Implementar TopProductosCard**

Crear `src/features/dashboard/components/TopProductosCard.tsx`:

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, Spinner, EmptyState } from '@/design-system'
import { useTopProductos } from '../hooks'
import type { RangoParams } from '../types'

export function TopProductosCard({ params }: { params: RangoParams }) {
  const { data, isLoading, isError } = useTopProductos({ ...params, top: 10 })
  return (
    <Card className="p-4">
      <h2 className="mb-3 font-display text-base font-semibold text-ink">Top productos</h2>
      {isLoading ? <div className="flex justify-center py-6"><Spinner /></div>
        : isError || !data?.length ? <EmptyState title="Sin datos" hint="No hay productos vendidos en el período." />
        : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart layout="vertical" data={data} margin={{ left: 24 }}>
              <XAxis type="number" fontSize={11} />
              <YAxis type="category" dataKey="nombreProducto" width={120} fontSize={11} />
              <Tooltip />
              <Bar dataKey="totalVentas" fill="#c2922e" />
            </BarChart>
          </ResponsiveContainer>
        )}
    </Card>
  )
}
```

- [ ] **Step 5: Correr y verificar que pasa**

Run: `npx vitest run src/features/dashboard/components/VentasPorDiaChart.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/dashboard/components/VentasPorDiaChart.tsx src/features/dashboard/components/TopProductosCard.tsx src/features/dashboard/components/VentasPorDiaChart.test.tsx
git commit -m "feat(dashboard): charts ventas-por-día y top-productos (recharts)"
```

---

## Task 8: Categoría (sección + detalle paginado)

**Files:**
- Create: `src/features/dashboard/components/CategoriaDetalleTable.tsx`, `VentasPorCategoriaSection.tsx`, `VentasPorCategoriaSection.test.tsx`

**Interfaces:**
- Consumes: `useVentasPorCategoria`, `useCategoriaDetalle` (Task 5); `Table`, `Card`, `Button`, `Input`, `Spinner`, `EmptyState`; recharts.
- Produces: `CategoriaDetalleTable({ params })`; `VentasPorCategoriaSection({ params })`.

- [ ] **Step 1: Escribir el test que falla**

Crear `src/features/dashboard/components/VentasPorCategoriaSection.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { dashboardHandlers } from '@/test/msw/dashboard-handlers'

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>()
  return { ...actual, ResponsiveContainer: ({ children }: { children: ReactNode }) => <div style={{ width: 500, height: 300 }}>{children}</div> }
})

import { VentasPorCategoriaSection } from './VentasPorCategoriaSection'

const server = setupServer(...dashboardHandlers)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('VentasPorCategoriaSection', () => {
  it('muestra el chart y al pedir detalle carga la tabla paginada', async () => {
    render(<VentasPorCategoriaSection params={{ fechaInicio: 'a', fechaFin: 'b' }} />, { wrapper })
    await waitFor(() => expect(screen.getByText(/ventas por categoría/i)).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /ver detalle/i }))
    await waitFor(() => expect(screen.getByText('DTE-01-0001')).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/features/dashboard/components/VentasPorCategoriaSection.test.tsx`
Expected: FAIL — `./VentasPorCategoriaSection` no existe.

- [ ] **Step 3: Implementar CategoriaDetalleTable**

Crear `src/features/dashboard/components/CategoriaDetalleTable.tsx`:

```tsx
import { useState } from 'react'
import { Table, Input, Spinner, EmptyState } from '@/design-system'
import { useCategoriaDetalle } from '../hooks'
import type { RangoParams, VentaCategoriaDetalle } from '../types'

export function CategoriaDetalleTable({ params }: { params: RangoParams }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { data, isLoading, isError } = useCategoriaDetalle({ ...params, page, pageSize: 20, search: search || undefined })

  const columns = [
    { key: 'numeroControl', header: 'Nº control', render: (r: VentaCategoriaDetalle) => <span className="cifra text-xs">{r.numeroControl}</span> },
    { key: 'productoNombre', header: 'Producto' },
    { key: 'categoriaNombre', header: 'Categoría', render: (r: VentaCategoriaDetalle) => r.categoriaNombre ?? '—' },
    { key: 'cantidad', header: 'Cant.', render: (r: VentaCategoriaDetalle) => <span className="cifra">{r.cantidad}</span> },
    { key: 'totalVenta', header: 'Total', render: (r: VentaCategoriaDetalle) => <span className="cifra">${r.totalVenta.toFixed(2)}</span> },
  ]

  return (
    <div className="mt-3 space-y-3">
      <Input placeholder="Buscar producto…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="max-w-xs" />
      {isLoading ? <Spinner />
        : isError || !data?.items.length ? <EmptyState title="Sin detalle" hint="No hay líneas para el período." />
        : <Table columns={columns} rows={data.items} getRowKey={(r) => r.facturaDetalleId} serverPagination={{ page: data.pageNumber, totalPages: data.totalPages, onPageChange: setPage }} />}
    </div>
  )
}
```

- [ ] **Step 4: Implementar VentasPorCategoriaSection**

Crear `src/features/dashboard/components/VentasPorCategoriaSection.tsx`:

```tsx
import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, Button, Spinner, EmptyState } from '@/design-system'
import { useVentasPorCategoria } from '../hooks'
import type { RangoParams } from '../types'
import { CategoriaDetalleTable } from './CategoriaDetalleTable'

export function VentasPorCategoriaSection({ params }: { params: RangoParams }) {
  const { data, isLoading, isError } = useVentasPorCategoria(params)
  const [verDetalle, setVerDetalle] = useState(false)
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-ink">Ventas por categoría</h2>
        <Button variant="ghost" size="sm" onClick={() => setVerDetalle((v) => !v)}>{verDetalle ? 'Ocultar detalle' : 'Ver detalle'}</Button>
      </div>
      {isLoading ? <div className="flex justify-center py-6"><Spinner /></div>
        : isError || !data?.length ? <EmptyState title="Sin datos" hint="No hay ventas por categoría en el período." />
        : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data}>
              <XAxis dataKey="nombreCategoria" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Bar dataKey="totalVentas" fill="#1f6b4f" />
            </BarChart>
          </ResponsiveContainer>
        )}
      {verDetalle && <CategoriaDetalleTable params={params} />}
    </Card>
  )
}
```

- [ ] **Step 5: Correr y verificar que pasa**

Run: `npx vitest run src/features/dashboard/components/VentasPorCategoriaSection.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/dashboard/components/CategoriaDetalleTable.tsx src/features/dashboard/components/VentasPorCategoriaSection.tsx src/features/dashboard/components/VentasPorCategoriaSection.test.tsx
git commit -m "feat(dashboard): sección ventas por categoría + detalle paginado"
```

---

## Task 9: Vendedor (sección + detalle paginado)

**Files:**
- Create: `src/features/dashboard/components/VendedorDetalleTable.tsx`, `VentasPorVendedorSection.tsx`, `VentasPorVendedorSection.test.tsx`

**Interfaces:**
- Consumes: `useVentasPorVendedor`, `useVendedorDetalle` (Task 5); `Table`, `Card`, `Button`, `Input`, `Spinner`, `EmptyState`.
- Produces: `VendedorDetalleTable({ params })`; `VentasPorVendedorSection({ params })`.

- [ ] **Step 1: Escribir el test que falla**

Crear `src/features/dashboard/components/VentasPorVendedorSection.test.tsx`:

```tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { dashboardHandlers } from '@/test/msw/dashboard-handlers'
import { VentasPorVendedorSection } from './VentasPorVendedorSection'

const server = setupServer(...dashboardHandlers)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('VentasPorVendedorSection', () => {
  it('lista vendedores y al pedir detalle carga la tabla', async () => {
    render(<VentasPorVendedorSection params={{ fechaInicio: 'a', fechaFin: 'b' }} />, { wrapper })
    await waitFor(() => expect(screen.getByText('Ana Vendedora')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /ver detalle/i }))
    await waitFor(() => expect(screen.getByText('DTE-01-0001')).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/features/dashboard/components/VentasPorVendedorSection.test.tsx`
Expected: FAIL — `./VentasPorVendedorSection` no existe.

- [ ] **Step 3: Implementar VendedorDetalleTable**

Crear `src/features/dashboard/components/VendedorDetalleTable.tsx`:

```tsx
import { useState } from 'react'
import { Table, Input, Spinner, EmptyState } from '@/design-system'
import { useVendedorDetalle } from '../hooks'
import type { RangoParams, VentaVendedorDetalle } from '../types'

export function VendedorDetalleTable({ params }: { params: RangoParams }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { data, isLoading, isError } = useVendedorDetalle({ ...params, page, pageSize: 20, search: search || undefined })

  const columns = [
    { key: 'numeroControl', header: 'Nº control', render: (r: VentaVendedorDetalle) => <span className="cifra text-xs">{r.numeroControl}</span> },
    { key: 'vendedorNombre', header: 'Vendedor', render: (r: VentaVendedorDetalle) => r.vendedorNombre ?? '—' },
    { key: 'receptorNombre', header: 'Cliente' },
    { key: 'totalPagar', header: 'Total', render: (r: VentaVendedorDetalle) => <span className="cifra">${r.totalPagar.toFixed(2)}</span> },
    { key: 'estadoHacienda', header: 'Estado' },
  ]

  return (
    <div className="mt-3 space-y-3">
      <Input placeholder="Buscar…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="max-w-xs" />
      {isLoading ? <Spinner />
        : isError || !data?.items.length ? <EmptyState title="Sin detalle" hint="No hay facturas para el período." />
        : <Table columns={columns} rows={data.items} getRowKey={(r) => r.facturaId} serverPagination={{ page: data.pageNumber, totalPages: data.totalPages, onPageChange: setPage }} />}
    </div>
  )
}
```

- [ ] **Step 4: Implementar VentasPorVendedorSection**

Crear `src/features/dashboard/components/VentasPorVendedorSection.tsx`:

```tsx
import { useState } from 'react'
import { Card, Button, Spinner, EmptyState, Table } from '@/design-system'
import { useVentasPorVendedor } from '../hooks'
import type { RangoParams, VentasPorVendedor } from '../types'
import { VendedorDetalleTable } from './VendedorDetalleTable'

export function VentasPorVendedorSection({ params }: { params: RangoParams }) {
  const { data, isLoading, isError } = useVentasPorVendedor(params)
  const [verDetalle, setVerDetalle] = useState(false)

  const columns = [
    { key: 'nombreVendedor', header: 'Vendedor' },
    { key: 'cantidadFacturas', header: 'Facturas', render: (r: VentasPorVendedor) => <span className="cifra">{r.cantidadFacturas}</span> },
    { key: 'totalVentas', header: 'Total ventas', render: (r: VentasPorVendedor) => <span className="cifra">${r.totalVentas.toFixed(2)}</span> },
    { key: 'promedioVenta', header: 'Promedio', render: (r: VentasPorVendedor) => <span className="cifra">${r.promedioVenta.toFixed(2)}</span> },
  ]

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-ink">Ventas por vendedor</h2>
        <Button variant="ghost" size="sm" onClick={() => setVerDetalle((v) => !v)}>{verDetalle ? 'Ocultar detalle' : 'Ver detalle'}</Button>
      </div>
      {isLoading ? <div className="flex justify-center py-6"><Spinner /></div>
        : isError || !data?.length ? <EmptyState title="Sin datos" hint="No hay ventas por vendedor en el período." />
        : <Table columns={columns} rows={data} getRowKey={(r) => r.vendedorId} />}
      {verDetalle && <VendedorDetalleTable params={params} />}
    </Card>
  )
}
```

- [ ] **Step 5: Correr y verificar que pasa**

Run: `npx vitest run src/features/dashboard/components/VentasPorVendedorSection.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/dashboard/components/VendedorDetalleTable.tsx src/features/dashboard/components/VentasPorVendedorSection.tsx src/features/dashboard/components/VentasPorVendedorSection.test.tsx
git commit -m "feat(dashboard): sección ventas por vendedor + detalle paginado"
```

---

## Task 10: `ComparativoSucursalesTable` + `CajeroDashboard`

**Files:**
- Create: `src/features/dashboard/components/ComparativoSucursalesTable.tsx`, `ComparativoSucursalesTable.test.tsx`, `CajeroDashboard.tsx`, `CajeroDashboard.test.tsx`

**Interfaces:**
- Consumes: `useComparativoSucursales`, `useDashboardCajero` (Task 5); `KpiCard` (Task 6); `Table`, `Card`, `Spinner`, `EmptyState`; recharts.
- Produces: `ComparativoSucursalesTable({ params })`; `CajeroDashboard({ params })` donde `params: RangoParams`.

- [ ] **Step 1: Escribir los tests que fallan**

Crear `src/features/dashboard/components/ComparativoSucursalesTable.test.tsx`:

```tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { dashboardHandlers } from '@/test/msw/dashboard-handlers'
import { ComparativoSucursalesTable } from './ComparativoSucursalesTable'

const server = setupServer(...dashboardHandlers)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('ComparativoSucursalesTable', () => {
  it('lista sucursales', async () => {
    render(<ComparativoSucursalesTable params={{ fechaInicio: 'a', fechaFin: 'b' }} />, { wrapper })
    await waitFor(() => expect(screen.getByText('Casa Matriz')).toBeInTheDocument())
  })
})
```

Crear `src/features/dashboard/components/CajeroDashboard.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { dashboardHandlers } from '@/test/msw/dashboard-handlers'

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>()
  return { ...actual, ResponsiveContainer: ({ children }: { children: ReactNode }) => <div style={{ width: 500, height: 300 }}>{children}</div> }
})

import { CajeroDashboard } from './CajeroDashboard'

const server = setupServer(...dashboardHandlers)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('CajeroDashboard', () => {
  it('muestra los KPIs personales del cajero', async () => {
    render(<CajeroDashboard params={{ fechaInicio: 'a', fechaFin: 'b' }} />, { wrapper })
    await waitFor(() => expect(screen.getByText('Mis ventas')).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Correr y verificar que fallan**

Run: `npx vitest run src/features/dashboard/components/ComparativoSucursalesTable.test.tsx src/features/dashboard/components/CajeroDashboard.test.tsx`
Expected: FAIL — los componentes no existen.

- [ ] **Step 3: Implementar ComparativoSucursalesTable**

Crear `src/features/dashboard/components/ComparativoSucursalesTable.tsx`:

```tsx
import { useState } from 'react'
import { Card, Table, Spinner, EmptyState } from '@/design-system'
import { useComparativoSucursales } from '../hooks'
import type { RangoParams, ComparativoSucursal } from '../types'

export function ComparativoSucursalesTable({ params }: { params: RangoParams }) {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useComparativoSucursales({ ...params, page, pageSize: 20 }, true)

  const columns = [
    { key: 'nombreSucursal', header: 'Sucursal' },
    { key: 'totalFacturas', header: 'Facturas', render: (r: ComparativoSucursal) => <span className="cifra">{r.totalFacturas}</span> },
    { key: 'totalVentas', header: 'Total ventas', render: (r: ComparativoSucursal) => <span className="cifra">${r.totalVentas.toFixed(2)}</span> },
    { key: 'porcentajeDelTotal', header: '% del total', render: (r: ComparativoSucursal) => <span className="cifra">{r.porcentajeDelTotal.toFixed(1)}%</span> },
  ]

  return (
    <Card className="p-4">
      <h2 className="mb-3 font-display text-base font-semibold text-ink">Comparativo de sucursales</h2>
      {isLoading ? <div className="flex justify-center py-6"><Spinner /></div>
        : isError || !data?.items.length ? <EmptyState title="Sin datos" hint="No hay datos de sucursales para el período." />
        : <Table columns={columns} rows={data.items} getRowKey={(r) => r.sucursalId} serverPagination={{ page: data.pageNumber, totalPages: data.totalPages, onPageChange: setPage }} />}
    </Card>
  )
}
```

- [ ] **Step 4: Implementar CajeroDashboard**

Crear `src/features/dashboard/components/CajeroDashboard.tsx`:

```tsx
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, Spinner, EmptyState } from '@/design-system'
import { useDashboardCajero } from '../hooks'
import type { RangoParams } from '../types'
import { KpiCard } from './KpiCard'

const money = (n: number) => `$${n.toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function CajeroDashboard({ params }: { params: RangoParams }) {
  const { data, isLoading, isError } = useDashboardCajero(params, true)
  if (isLoading) return <div className="flex justify-center py-6"><Spinner /></div>
  if (isError || !data) return <EmptyState title="Sin datos" hint="No se pudo cargar tu dashboard." />
  return (
    <div className="space-y-4">
      <h2 className="font-display text-base font-semibold text-ink">Mis ventas</h2>
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Nº facturas" valor={String(data.totalFacturas)} />
        <KpiCard label="Monto vendido" valor={money(data.montoTotalVendido)} />
        <KpiCard label="Promedio" valor={money(data.promedioVenta)} />
      </div>
      <Card className="p-4">
        {!data.ventasPorDia.length ? <EmptyState title="Sin ventas" hint="No hay ventas en el período." />
          : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data.ventasPorDia.map((d) => ({ ...d, dia: d.fecha.slice(5, 10) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e1d4" />
                <XAxis dataKey="dia" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="montoTotal" stroke="#1f6b4f" fill="#e7efe9" />
              </AreaChart>
            </ResponsiveContainer>
          )}
      </Card>
    </div>
  )
}
```

- [ ] **Step 5: Correr y verificar que pasan**

Run: `npx vitest run src/features/dashboard/components/ComparativoSucursalesTable.test.tsx src/features/dashboard/components/CajeroDashboard.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/dashboard/components/ComparativoSucursalesTable.tsx src/features/dashboard/components/ComparativoSucursalesTable.test.tsx src/features/dashboard/components/CajeroDashboard.tsx src/features/dashboard/components/CajeroDashboard.test.tsx
git commit -m "feat(dashboard): comparativo de sucursales + dashboard de cajero"
```

---

## Task 11: `PeriodoSelector` + `SucursalSelector`

**Files:**
- Create: `src/features/dashboard/components/PeriodoSelector.tsx`, `PeriodoSelector.test.tsx`, `SucursalSelector.tsx`

**Interfaces:**
- Consumes: `rangoDePreset`, `type Preset` (Task 2); `useSucursales` de `@/features/facturacion/hooks`; `Button`, `Input`.
- Produces:
  - `PeriodoSelector({ value, onChange })` con `value: { preset: Preset | 'custom'; fechaInicio: string; fechaFin: string }` y `onChange(next)`.
  - `SucursalSelector({ value, onChange })` con `value: number | undefined` y `onChange(id?)`.

- [ ] **Step 1: Escribir el test que falla**

Crear `src/features/dashboard/components/PeriodoSelector.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PeriodoSelector } from './PeriodoSelector'
import { rangoDePreset } from '../date-range'

describe('PeriodoSelector', () => {
  it('al elegir un preset emite el rango correspondiente', () => {
    const onChange = vi.fn()
    const inicial = { preset: '30d' as const, ...rangoDePreset('30d') }
    render(<PeriodoSelector value={inicial} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /^hoy$/i }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ preset: 'hoy' }))
  })
  it('modo personalizado emite preset custom al cambiar una fecha', () => {
    const onChange = vi.fn()
    const inicial = { preset: '30d' as const, ...rangoDePreset('30d') }
    render(<PeriodoSelector value={inicial} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /personalizado/i }))
    const desde = screen.getByLabelText(/desde/i)
    fireEvent.change(desde, { target: { value: '2026-01-01' } })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ preset: 'custom' }))
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/features/dashboard/components/PeriodoSelector.test.tsx`
Expected: FAIL — `./PeriodoSelector` no existe.

- [ ] **Step 3: Implementar PeriodoSelector**

Crear `src/features/dashboard/components/PeriodoSelector.tsx`:

```tsx
import { useState } from 'react'
import { Button, Input } from '@/design-system'
import { rangoDePreset, type Preset } from '../date-range'

export interface PeriodoValue { preset: Preset | 'custom'; fechaInicio: string; fechaFin: string }
interface Props { value: PeriodoValue; onChange: (v: PeriodoValue) => void }

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'hoy', label: 'Hoy' }, { key: '7d', label: '7 días' }, { key: '30d', label: '30 días' }, { key: 'mes', label: 'Este mes' },
]

export function PeriodoSelector({ value, onChange }: Props) {
  const [custom, setCustom] = useState(value.preset === 'custom')

  const elegirPreset = (p: Preset) => { setCustom(false); onChange({ preset: p, ...rangoDePreset(p) }) }
  const cambiarFecha = (campo: 'fechaInicio' | 'fechaFin', v: string) => {
    onChange({ ...value, preset: 'custom', [campo]: v ? new Date(v).toISOString() : value[campo] })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <Button key={p.key} variant={!custom && value.preset === p.key ? 'primary' : 'ghost'} size="sm" onClick={() => elegirPreset(p.key)}>{p.label}</Button>
      ))}
      <Button variant={custom ? 'primary' : 'ghost'} size="sm" onClick={() => setCustom(true)}>Personalizado</Button>
      {custom && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate" htmlFor="f-desde">Desde</label>
          <Input id="f-desde" type="date" onChange={(e) => cambiarFecha('fechaInicio', e.target.value)} className="w-40" />
          <label className="text-xs text-slate" htmlFor="f-hasta">Hasta</label>
          <Input id="f-hasta" type="date" onChange={(e) => cambiarFecha('fechaFin', e.target.value)} className="w-40" />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Implementar SucursalSelector**

Crear `src/features/dashboard/components/SucursalSelector.tsx`:

```tsx
import { useSucursales } from '@/features/facturacion/hooks'

interface Props { value: number | undefined; onChange: (id: number | undefined) => void }

export function SucursalSelector({ value, onChange }: Props) {
  const { data } = useSucursales()
  return (
    <select
      aria-label="Sucursal"
      className="rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
    >
      <option value="">Todas las sucursales</option>
      {(data ?? []).map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
    </select>
  )
}
```

- [ ] **Step 5: Correr y verificar que pasa**

Run: `npx vitest run src/features/dashboard/components/PeriodoSelector.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/dashboard/components/PeriodoSelector.tsx src/features/dashboard/components/PeriodoSelector.test.tsx src/features/dashboard/components/SucursalSelector.tsx
git commit -m "feat(dashboard): selectores de período y sucursal"
```

---

## Task 12: `DashboardPage` (orquestación + curación por rol)

**Files:**
- Create: `src/features/dashboard/pages/DashboardPage.tsx`, `DashboardPage.test.tsx`

**Interfaces:**
- Consumes: todo lo anterior; `Can` de `@/lib/authz/Can`; `useAuthStore` de `@/app/auth-store`; `DASHBOARD_GERENCIAL`, `DASHBOARD_CAJERO` (Task 3); `periodoAnterior`, `rangoDePreset` (Task 2).
- Produces: `DashboardPage` (named export).

- [ ] **Step 1: Escribir el test que falla**

Crear `src/features/dashboard/pages/DashboardPage.test.tsx`:

```tsx
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { dashboardHandlers } from '@/test/msw/dashboard-handlers'
import { useAuthStore } from '@/app/auth-store'
import { DashboardPage } from './DashboardPage'

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>()
  return { ...actual, ResponsiveContainer: ({ children }: { children: ReactNode }) => <div style={{ width: 500, height: 300 }}>{children}</div> }
})

const server = setupServer(...dashboardHandlers)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><DashboardPage /></QueryClientProvider>)
}
function auth(rolNombre: string, accesoTodasSucursales = false) {
  useAuthStore.setState({ token: 't', status: 'authenticated', user: { userId: 1, nombreCompleto: 'X', email: 'x@x.com', rolId: 1, rolNombre, emisorId: 3, emisorNombre: 'E', accesoTodasSucursales, sucursalIds: [2], permisos: [] } })
}

describe('DashboardPage — curación por rol', () => {
  it('EmisorAdmin (todas sucursales) ve KPIs, selector de sucursal y comparativo', async () => {
    auth('EmisorAdmin', true)
    setup()
    await waitFor(() => expect(screen.getByText('Total ventas')).toBeInTheDocument())
    expect(screen.getByLabelText('Sucursal')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText(/comparativo de sucursales/i)).toBeInTheDocument())
  })
  it('Auditor (scope) ve KPIs pero NO selector de sucursal ni comparativo', async () => {
    auth('Auditor', false)
    setup()
    await waitFor(() => expect(screen.getByText('Total ventas')).toBeInTheDocument())
    expect(screen.queryByLabelText('Sucursal')).toBeNull()
    expect(screen.queryByText(/comparativo de sucursales/i)).toBeNull()
  })
  it('Cajero ve su sección personal y NO las gerenciales', async () => {
    auth('Cajero', false)
    setup()
    await waitFor(() => expect(screen.getByText('Mis ventas')).toBeInTheDocument())
    expect(screen.queryByText('Total ventas')).toBeNull()
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/features/dashboard/pages/DashboardPage.test.tsx`
Expected: FAIL — `./DashboardPage` no existe.

- [ ] **Step 3: Implementar DashboardPage**

Crear `src/features/dashboard/pages/DashboardPage.tsx`:

```tsx
import { useMemo, useState } from 'react'
import { Can } from '@/lib/authz/Can'
import { useAuthStore } from '@/app/auth-store'
import { DASHBOARD_GERENCIAL, DASHBOARD_CAJERO } from '../roles'
import { rangoDePreset, periodoAnterior } from '../date-range'
import { PeriodoSelector, type PeriodoValue } from '../components/PeriodoSelector'
import { SucursalSelector } from '../components/SucursalSelector'
import { KpisSection } from '../components/KpisSection'
import { VentasPorDiaChart } from '../components/VentasPorDiaChart'
import { TopProductosCard } from '../components/TopProductosCard'
import { VentasPorCategoriaSection } from '../components/VentasPorCategoriaSection'
import { VentasPorVendedorSection } from '../components/VentasPorVendedorSection'
import { ComparativoSucursalesTable } from '../components/ComparativoSucursalesTable'
import { CajeroDashboard } from '../components/CajeroDashboard'

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const puedeElegirSucursal = user?.accesoTodasSucursales === true
  const [periodo, setPeriodo] = useState<PeriodoValue>(() => ({ preset: '30d', ...rangoDePreset('30d') }))
  const [sucursalId, setSucursalId] = useState<number | undefined>(undefined)

  const rango = { fechaInicio: periodo.fechaInicio, fechaFin: periodo.fechaFin, sucursalId }
  const kpiParams = useMemo(() => ({ ...rango, ...periodoAnterior({ fechaInicio: periodo.fechaInicio, fechaFin: periodo.fechaFin }) }), [periodo.fechaInicio, periodo.fechaFin, sucursalId])
  const dias = 30

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodoSelector value={periodo} onChange={setPeriodo} />
          {puedeElegirSucursal && <SucursalSelector value={sucursalId} onChange={setSucursalId} />}
        </div>
      </div>

      <Can roles={DASHBOARD_CAJERO}>
        <CajeroDashboard params={rango} />
      </Can>

      <Can roles={DASHBOARD_GERENCIAL}>
        <div className="space-y-6">
          <KpisSection params={kpiParams} />
          <div className="grid gap-4 lg:grid-cols-2">
            <VentasPorDiaChart dias={dias} sucursalId={sucursalId} />
            <TopProductosCard params={rango} />
          </div>
          <VentasPorCategoriaSection params={rango} />
          <VentasPorVendedorSection params={rango} />
          {puedeElegirSucursal && <ComparativoSucursalesTable params={rango} />}
        </div>
      </Can>
    </div>
  )
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npx vitest run src/features/dashboard/pages/DashboardPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/pages/DashboardPage.tsx src/features/dashboard/pages/DashboardPage.test.tsx
git commit -m "feat(dashboard): DashboardPage con curación por rol y scope"
```

---

## Task 13: Router (lazy-load) + retiro del placeholder

**Files:**
- Modify: `src/app/router.tsx` (import lazy + Suspense + ruta)
- Delete: `src/features/dashboard/DashboardPlaceholder.tsx`
- Test: `src/app/router.dashboard.test.tsx` (crear)

**Interfaces:**
- Consumes: `DashboardPage` (Task 12).

- [ ] **Step 1: Escribir el test que falla**

Crear `src/app/router.dashboard.test.tsx`:

```tsx
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { dashboardHandlers } from '@/test/msw/dashboard-handlers'
import { useAuthStore } from '@/app/auth-store'
import { AppRoutes } from './router'

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>()
  return { ...actual, ResponsiveContainer: ({ children }: { children: ReactNode }) => <div style={{ width: 500, height: 300 }}>{children}</div> }
})

const server = setupServer(...dashboardHandlers)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())

describe('/dashboard', () => {
  it('renderiza el dashboard real (lazy) para un usuario autenticado', async () => {
    useAuthStore.setState({ token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', status: 'authenticated', user: { userId: 1, nombreCompleto: 'X', email: 'x@x.com', rolId: 1, rolNombre: 'EmisorAdmin', emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [2], permisos: [] } })
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(<QueryClientProvider client={qc}><MemoryRouter initialEntries={['/dashboard']}><AppRoutes /></MemoryRouter></QueryClientProvider>)
    await waitFor(() => expect(screen.getByText('Total ventas')).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/app/router.dashboard.test.tsx`
Expected: FAIL — hoy `/dashboard` renderiza el placeholder ("Los KPIs… llegan en fases siguientes"), no "Total ventas".

- [ ] **Step 3: Implementar (router lazy)**

En `src/app/router.tsx`:
1. Añadir al tope: `import { lazy, Suspense } from 'react'` y `import { Spinner } from '@/design-system'`.
2. Quitar `import { DashboardPlaceholder } from '@/features/dashboard/DashboardPlaceholder'`.
3. Añadir el lazy import (después de los imports estáticos):
```tsx
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
```
4. Reemplazar la ruta `<Route path="/dashboard" element={<DashboardPlaceholder />} />` por:
```tsx
<Route path="/dashboard" element={<Suspense fallback={<div className="flex justify-center p-10"><Spinner /></div>}><DashboardPage /></Suspense>} />
```

- [ ] **Step 4: Borrar el placeholder**

Run: `git rm src/features/dashboard/DashboardPlaceholder.tsx`
(No hay más referencias tras el paso 3; si `npm run lint`/`build` reporta un import colgante, elimínalo.)

- [ ] **Step 5: Correr y verificar que pasa**

Run: `npx vitest run src/app/router.dashboard.test.tsx src/app/router.test.tsx`
Expected: PASS (dashboard real + sin regresión en el resto de rutas).

- [ ] **Step 6: Commit**

```bash
git add src/app/router.tsx src/app/router.dashboard.test.tsx
git commit -m "feat(dashboard): montar DashboardPage (lazy) en /dashboard; retirar placeholder"
```

---

## Task 14: Verificación global (suite + lint + build)

**Files:** ninguno (verificación). Si algo falla, arreglar en la tarea correspondiente.

- [ ] **Step 1: Suite completa**

Run: `npm run test`
Expected: TODOS los archivos verdes.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: sin errores (vigilar imports sin usar y el placeholder borrado).

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: build OK. Verificar que recharts salió a un chunk aparte (por el `lazy`), no al `index` principal.

- [ ] **Step 4: Commit (si hubo arreglos)**

```bash
git add -A
git commit -m "test(dashboard): verificación global verde (suite/lint/build)"
```

- [ ] **Step 5: Push y PR**

```bash
git push -u origin feat/dashboard-real
```
Crear el PR por web hacia `development`. Enlazar spec y plan en la descripción.

---

## Notas de verificación del plan

- **Cobertura del spec:** recharts+types (T1) ✓; date-range (T2) ✓; roles curación (T3) ✓; api mapeo params (T4) ✓; hooks (T5) ✓; KPIs (T6) ✓; charts ventas-día/top-productos (T7) ✓; categoría+detalle (T8) ✓; vendedor+detalle (T9) ✓; comparativo+cajero (T10) ✓; selectores período/sucursal (T11) ✓; DashboardPage curación por rol+scope (T12) ✓; router lazy + retiro placeholder (T13) ✓; verificación global (T14) ✓. Los 9 endpoints cubiertos; lazy-load presente; mock de `ResponsiveContainer` en todos los tests de chart.
- **Consistencia de tipos:** `RangoParams` (`fechaInicio/fechaFin/sucursalId`) fluye de T1 a T12; `dashboardApi` métodos (T4) == hooks (T5) == componentes; `PeriodoValue` definido en T11 y consumido en T12.
- **Riesgos:** (1) recharts v3 + React 19 — si `npm install` reporta conflicto de peer deps, verificar versión de recharts que soporte React 19 (v3.x); no usar `--force` sin confirmar. (2) recharts en jsdom — el mock de `ResponsiveContainer` es obligatorio en cada test que renderice un chart (T7, T8, T10 cajero, T12, T13). (3) `Input type="date"` emite `YYYY-MM-DD`; `PeriodoSelector` lo convierte a ISO — el rango custom queda a medianoche local, aceptable para v1.
