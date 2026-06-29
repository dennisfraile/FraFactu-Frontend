# F5.4 S6 — Cuentas por cobrar (frontend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el frontend de cuentas por cobrar (gestión de planes con saldo, cobro de cuotas, crear venta a crédito, refinanciar, configuración de mora y reportes) consumiendo el `CuentasPorCobrarController` ya existente.

**Architecture:** Nuevo feature `src/features/cuentas-por-cobrar/` que sigue el patrón de `compras`/`dtes-recibidos` (api.ts / hooks.ts con React Query / types.ts / mappers.ts / calc/ / components/ / pages/). La página "Crear venta a crédito" REUSA los componentes de facturación (`DatosGeneralesSection`, `CuerpoDocumentoTable`, `TotalesPanel`, `buildCreateFacturaDto`, `getStrategy`) sin modificarlos, y postea al endpoint de cuentas-por-cobrar. El gating de rol se delega al 403 del backend (deuda abierta).

**Tech Stack:** React + TypeScript + Vite, React Router, @tanstack/react-query, axios (`@/lib/http/axios`), design-system propio (`@/design-system`), Vitest + Testing Library + MSW.

## Global Constraints

- `npm run build` debe pasar tras CADA tarea (vitest NO ve errores de `tsc`; el build sí).
- ESLint prohíbe `react-hooks/set-state-in-effect`: NO usar `useEffect`+`setState` para inicializar formularios desde datos cargados ni para polling. Usar split loader / inner-form con `key`, y `refetchInterval` de React Query para polling.
- Todos los `import` van al tope del archivo (regla `import/first`).
- Rutas del backend tal cual el controller (con guiones donde el backend los tiene): base `/cuentas-por-cobrar`, `/configuracion-mora`, `/{planId}/cuotas/{numero}/mora-estimada`, `/{planId}/cuotas/{numero}/pagar`, `/{planId}/refinanciar`, `/reportes/...`. El cliente axios (`api`) ya antepone `/api`.
- El cuerpo JSON va en camelCase (ASP.NET enlaza camelCase): `{ venta, cuotas, observaciones }`, `{ catFormaPagoId, referencia }`, etc.
- Manejo de error igual que S4/S5: `e.response?.data?.error` → toast tono `rojo`.
- El total del plan al crear venta = `Venta.Resumen.TotalPagar` (lo calcula `buildCreateFacturaDto` vía la estrategia). La suma de cuotas DEBE cuadrar con ese total (±0.01) o el backend rechaza.
- Las tareas de e2e contra Docker y la revisión final whole-branch (opus) las hace el CONTROLADOR, no subagentes.

## Contrato del backend (referencia)

Base `api/cuentas-por-cobrar` (`[Authorize]`, scoped por `EmisorId` del token):

- `POST /` ← `CrearVentaCreditoDto { venta: CreateFacturaDto, cuotas: DefinicionCuotaDto[] (≥2), observaciones? }` → `PlanCuotasDto` (201). Condición (2|3) va en `venta.resumen.condicionOperacion`. Emite la cuota 1 con la forma de pago del primer `venta.resumen.pagos[0].catFormaPagoId` (o 1).
- `GET /?soloConSaldo=true` → `PlanCuotasDto[]`.
- `GET /{planId}` → `PlanCuotasDto` | 404.
- `POST /{planId}/cuotas/{numero}/pagar` ← `RegistrarPagoCuotaDto { catFormaPagoId, referencia? }` → `PlanCuotasDto`.
- `GET /{planId}/cuotas/{numero}/mora-estimada` → `MoraEstimadaDto`.
- `GET /configuracion-mora` → `ConfiguracionCuotasDto`. `PUT /configuracion-mora` ← `ActualizarConfiguracionCuotasDto` → `ConfiguracionCuotasDto`.
- `POST /{planId}/refinanciar` ← `RefinanciarPlanDto { motivo, nuevasCuotas: DefinicionCuotaDto[] }` → `PlanCuotasDto`.
- `GET /reportes/antiguedad/{excel|pdf}` → archivo. `GET /reportes/estado-cuenta/plan/{planId}/{pdf|excel}` → archivo. `GET /reportes/estado-cuenta/cliente/{receptorId}/{pdf|excel}` → archivo.

DTOs:
- `DefinicionCuotaDto { numero: number; monto?: number; porcentaje?: number; fechaPactada: string }` (monto XOR porcentaje).
- `PlanCuotasDto { id; receptorId?; receptorNombre?; condicionOperacion; montoTotal; montoPagado; saldoAdeudado; estadoCobro; cuotas: CuotaDto[] }`.
- `CuotaDto { numero; monto; fechaPactada; estado; fechaPago?; facturaId?; codigoGeneracion?; esCuotaFinal; interesMora }`.
- `MoraEstimadaDto { numero; monto; fechaPactada; diasAtraso; interesMora; moraHabilitada }`.
- `ConfiguracionCuotasDto / ActualizarConfiguracionCuotasDto { tasaMoraMensual; diasGracia; moraHabilitada; recordatoriosHabilitados; diasAntesRecordatorio }`.

---

### Task 1: Tipos del feature + icono de navegación

**Files:**
- Create: `src/features/cuentas-por-cobrar/types.ts`
- Modify: `src/design-system/Icon.tsx` (añadir icono `cobros` al objeto `paths`)
- Test: `src/features/cuentas-por-cobrar/types.test.ts`

**Interfaces:**
- Produces: tipos `EstadoCobro`, `EstadoCuota`, `CuotaDto`, `PlanCuotasDto`, `DefinicionCuotaDto`, `RegistrarPagoCuotaDto`, `MoraEstimadaDto`, `ConfiguracionCuotasDto`, `RefinanciarPlanDto`, `CrearVentaCreditoDto`. Icono `cobros` disponible como `IconName`.

- [ ] **Step 1: Escribir el test (type-level + icono)**

```ts
// src/features/cuentas-por-cobrar/types.test.ts
import { describe, it, expect } from 'vitest'
import type { PlanCuotasDto, CuotaDto, DefinicionCuotaDto, ConfiguracionCuotasDto } from './types'
import type { IconName } from '@/design-system'

describe('tipos cuentas por cobrar', () => {
  it('PlanCuotasDto admite la forma del backend', () => {
    const cuota: CuotaDto = {
      numero: 1, monto: 50, fechaPactada: '2026-07-01', estado: 'Pendiente',
      esCuotaFinal: false, interesMora: 0,
    }
    const plan: PlanCuotasDto = {
      id: 1, condicionOperacion: 2, montoTotal: 100, montoPagado: 0,
      saldoAdeudado: 100, estadoCobro: 'Pendiente', cuotas: [cuota],
    }
    expect(plan.cuotas[0].numero).toBe(1)
  })
  it('DefinicionCuotaDto y ConfiguracionCuotasDto compilan', () => {
    const def: DefinicionCuotaDto = { numero: 1, monto: 50, fechaPactada: '2026-07-01' }
    const cfg: ConfiguracionCuotasDto = {
      tasaMoraMensual: 2, diasGracia: 3, moraHabilitada: true,
      recordatoriosHabilitados: false, diasAntesRecordatorio: 2,
    }
    expect(def.numero + cfg.diasGracia).toBe(4)
  })
  it('cobros es un IconName válido', () => {
    const icon: IconName = 'cobros'
    expect(icon).toBe('cobros')
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/features/cuentas-por-cobrar/types.test.ts`
Expected: FAIL (no existe `./types`, `'cobros'` no es `IconName`).

- [ ] **Step 3: Crear los tipos**

```ts
// src/features/cuentas-por-cobrar/types.ts
import type { CreateFacturaDto } from '@/features/facturacion/types'

export type EstadoCobro = 'Pendiente' | 'Parcial' | 'Pagado' | 'EnMora' | 'Refinanciado' | string
export type EstadoCuota = 'Pendiente' | 'Pagada' | 'Vencida' | 'Refinanciada' | string

export interface CuotaDto {
  numero: number
  monto: number
  fechaPactada: string
  estado: EstadoCuota
  fechaPago?: string | null
  facturaId?: number | null
  codigoGeneracion?: string | null
  esCuotaFinal: boolean
  interesMora: number
}

export interface PlanCuotasDto {
  id: number
  receptorId?: number | null
  receptorNombre?: string | null
  condicionOperacion: number
  montoTotal: number
  montoPagado: number
  saldoAdeudado: number
  estadoCobro: EstadoCobro
  cuotas: CuotaDto[]
}

export interface DefinicionCuotaDto {
  numero: number
  monto?: number | null
  porcentaje?: number | null
  fechaPactada: string
}

export interface RegistrarPagoCuotaDto {
  catFormaPagoId: number
  referencia?: string | null
}

export interface MoraEstimadaDto {
  numero: number
  monto: number
  fechaPactada: string
  diasAtraso: number
  interesMora: number
  moraHabilitada: boolean
}

export interface ConfiguracionCuotasDto {
  tasaMoraMensual: number
  diasGracia: number
  moraHabilitada: boolean
  recordatoriosHabilitados: boolean
  diasAntesRecordatorio: number
}

export type ActualizarConfiguracionCuotasDto = ConfiguracionCuotasDto

export interface RefinanciarPlanDto {
  motivo: string
  nuevasCuotas: DefinicionCuotaDto[]
}

export interface CrearVentaCreditoDto {
  venta: CreateFacturaDto
  cuotas: DefinicionCuotaDto[]
  observaciones?: string | null
}
```

- [ ] **Step 4: Añadir el icono `cobros` a `Icon.tsx`**

En `src/design-system/Icon.tsx`, dentro del objeto `paths` (después de `recibidos`), añadir:

```tsx
  cobros: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 10v4" />
      <path d="M18 10v4" />
    </>
  ),
```

- [ ] **Step 5: Correr el test y verificar que pasa**

Run: `npx vitest run src/features/cuentas-por-cobrar/types.test.ts`
Expected: PASS.

- [ ] **Step 6: Build + commit**

```bash
npm run build
git add src/features/cuentas-por-cobrar/types.ts src/features/cuentas-por-cobrar/types.test.ts src/design-system/Icon.tsx
git commit -m "feat(f5.4-s6): tipos de cuentas por cobrar + icono cobros"
```

---

### Task 2: Lógica de cuotas (`calc/cuotas.ts`)

**Files:**
- Create: `src/features/cuentas-por-cobrar/calc/cuotas.ts`
- Test: `src/features/cuentas-por-cobrar/calc/cuotas.test.ts`

**Interfaces:**
- Consumes: `DefinicionCuotaDto` de `../types`.
- Produces:
  - `type ModoCuota = 'monto' | 'porcentaje'`
  - `interface CuotaDraft { fechaPactada: string; valor: number }`
  - `montoDeCuota(d: CuotaDraft, modo: ModoCuota, total: number): number`
  - `validarCuotas(drafts: CuotaDraft[], modo: ModoCuota, total: number): string | null` (null = válido)
  - `construirDefiniciones(drafts: CuotaDraft[], modo: ModoCuota): DefinicionCuotaDto[]`

- [ ] **Step 1: Escribir el test**

```ts
// src/features/cuentas-por-cobrar/calc/cuotas.test.ts
import { describe, it, expect } from 'vitest'
import { montoDeCuota, validarCuotas, construirDefiniciones, type CuotaDraft } from './cuotas'

const dos = (a: number, b: number): CuotaDraft[] => [
  { fechaPactada: '2026-07-01', valor: a },
  { fechaPactada: '2026-08-01', valor: b },
]

describe('montoDeCuota', () => {
  it('en modo monto devuelve el valor', () => {
    expect(montoDeCuota({ fechaPactada: '2026-07-01', valor: 40 }, 'monto', 100)).toBe(40)
  })
  it('en modo porcentaje aplica el % sobre el total', () => {
    expect(montoDeCuota({ fechaPactada: '2026-07-01', valor: 25 }, 'porcentaje', 200)).toBe(50)
  })
})

describe('validarCuotas', () => {
  it('exige al menos 2 cuotas', () => {
    expect(validarCuotas([{ fechaPactada: '2026-07-01', valor: 100 }], 'monto', 100))
      .toMatch(/al menos 2/i)
  })
  it('en modo monto exige que sumen el total (±0.01)', () => {
    expect(validarCuotas(dos(40, 50), 'monto', 100)).toMatch(/no coincide|suma/i)
    expect(validarCuotas(dos(40, 60), 'monto', 100)).toBeNull()
    expect(validarCuotas(dos(40, 60.005), 'monto', 100)).toBeNull() // tolerancia
  })
  it('en modo porcentaje exige que sumen 100', () => {
    expect(validarCuotas(dos(40, 50), 'porcentaje', 100)).toMatch(/100/)
    expect(validarCuotas(dos(40, 60), 'porcentaje', 100)).toBeNull()
  })
  it('exige fechas ascendentes', () => {
    const malas: CuotaDraft[] = [
      { fechaPactada: '2026-08-01', valor: 50 },
      { fechaPactada: '2026-07-01', valor: 50 },
    ]
    expect(validarCuotas(malas, 'monto', 100)).toMatch(/fecha/i)
  })
  it('exige valores positivos', () => {
    expect(validarCuotas(dos(0, 100), 'monto', 100)).toMatch(/mayor a 0|positiv/i)
  })
})

describe('construirDefiniciones', () => {
  it('numera correlativo desde 1 y usa monto en modo monto', () => {
    const defs = construirDefiniciones(dos(40, 60), 'monto')
    expect(defs).toEqual([
      { numero: 1, monto: 40, fechaPactada: '2026-07-01' },
      { numero: 2, monto: 60, fechaPactada: '2026-08-01' },
    ])
  })
  it('usa porcentaje en modo porcentaje', () => {
    const defs = construirDefiniciones(dos(40, 60), 'porcentaje')
    expect(defs[0]).toEqual({ numero: 1, porcentaje: 40, fechaPactada: '2026-07-01' })
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/features/cuentas-por-cobrar/calc/cuotas.test.ts`
Expected: FAIL (no existe `./cuotas`).

- [ ] **Step 3: Implementar**

```ts
// src/features/cuentas-por-cobrar/calc/cuotas.ts
import type { DefinicionCuotaDto } from '../types'

export type ModoCuota = 'monto' | 'porcentaje'

export interface CuotaDraft {
  fechaPactada: string
  valor: number
}

export function montoDeCuota(d: CuotaDraft, modo: ModoCuota, total: number): number {
  return modo === 'monto' ? d.valor : Math.round((d.valor / 100) * total * 100) / 100
}

export function validarCuotas(drafts: CuotaDraft[], modo: ModoCuota, total: number): string | null {
  if (drafts.length < 2) return 'Un plan requiere al menos 2 cuotas.'
  if (drafts.some((d) => !d.fechaPactada)) return 'Cada cuota necesita una fecha pactada.'
  if (drafts.some((d) => !(d.valor > 0))) return 'El valor de cada cuota debe ser mayor a 0.'

  for (let i = 1; i < drafts.length; i++) {
    if (drafts[i].fechaPactada <= drafts[i - 1].fechaPactada)
      return 'Las fechas de las cuotas deben ir en orden ascendente.'
  }

  if (modo === 'porcentaje') {
    const suma = drafts.reduce((acc, d) => acc + d.valor, 0)
    if (Math.abs(suma - 100) > 0.01) return `Los porcentajes deben sumar 100 (suman ${suma.toFixed(2)}).`
    return null
  }

  const suma = drafts.reduce((acc, d) => acc + d.valor, 0)
  if (Math.abs(suma - total) > 0.01)
    return `La suma de las cuotas (${suma.toFixed(2)}) no coincide con el total (${total.toFixed(2)}).`
  return null
}

export function construirDefiniciones(drafts: CuotaDraft[], modo: ModoCuota): DefinicionCuotaDto[] {
  return drafts.map((d, i) =>
    modo === 'monto'
      ? { numero: i + 1, monto: d.valor, fechaPactada: d.fechaPactada }
      : { numero: i + 1, porcentaje: d.valor, fechaPactada: d.fechaPactada },
  )
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run src/features/cuentas-por-cobrar/calc/cuotas.test.ts`
Expected: PASS.

- [ ] **Step 5: Build + commit**

```bash
npm run build
git add src/features/cuentas-por-cobrar/calc/
git commit -m "feat(f5.4-s6): lógica de validación y armado de cuotas"
```

---

### Task 3: Cliente API (`api.ts`) + helper de descarga

**Files:**
- Create: `src/features/cuentas-por-cobrar/api.ts`
- Test: `src/features/cuentas-por-cobrar/api.test.ts`

**Interfaces:**
- Consumes: tipos de `./types`; `api` de `@/lib/http/axios`.
- Produces: objeto `cuentasPorCobrarApi` con métodos `listar(soloConSaldo)`, `getById(planId)`, `crear(dto)`, `pagarCuota(planId, numero, dto)`, `moraEstimada(planId, numero)`, `getConfiguracion()`, `actualizarConfiguracion(dto)`, `refinanciar(planId, dto)`, `descargarAntiguedad(formato)`, `descargarEstadoCuentaPlan(planId, formato)`, `descargarEstadoCuentaCliente(receptorId, formato)`. `formato: 'pdf' | 'excel'`.

- [ ] **Step 1: Escribir el test (con MSW inline para la descarga)**

```ts
// src/features/cuentas-por-cobrar/api.test.ts
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { cuentasPorCobrarApi } from './api'

const base = 'http://localhost:8080/api'
const plan = { id: 1, condicionOperacion: 2, montoTotal: 100, montoPagado: 0, saldoAdeudado: 100, estadoCobro: 'Pendiente', cuotas: [] }

const server = setupServer(
  http.get(`${base}/cuentas-por-cobrar`, ({ request }) => {
    const url = new URL(request.url)
    expect(url.searchParams.get('soloConSaldo')).toBe('true')
    return HttpResponse.json([plan])
  }),
  http.post(`${base}/cuentas-por-cobrar/1/cuotas/1/pagar`, () => HttpResponse.json(plan)),
  http.get(`${base}/cuentas-por-cobrar/reportes/antiguedad/pdf`, () =>
    HttpResponse.arrayBuffer(new ArrayBuffer(8), {
      headers: { 'content-disposition': 'attachment; filename="Antiguedad.pdf"', 'content-type': 'application/pdf' },
    })),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('cuentasPorCobrarApi', () => {
  it('listar manda soloConSaldo y devuelve los planes', async () => {
    const res = await cuentasPorCobrarApi.listar(true)
    expect(res[0].id).toBe(1)
  })
  it('pagarCuota postea y devuelve el plan', async () => {
    const res = await cuentasPorCobrarApi.pagarCuota(1, 1, { catFormaPagoId: 1 })
    expect(res.saldoAdeudado).toBe(100)
  })
  it('descargarAntiguedad dispara la descarga del blob', async () => {
    const click = vi.fn()
    const createEl = vi.spyOn(document, 'createElement')
    // jsdom no implementa createObjectURL/revoke: stub.
    ;(URL as unknown as { createObjectURL: () => string }).createObjectURL = () => 'blob:x'
    ;(URL as unknown as { revokeObjectURL: () => void }).revokeObjectURL = () => {}
    createEl.mockImplementationOnce(() => ({ href: '', download: '', click, remove: () => {} }) as unknown as HTMLAnchorElement)
    await cuentasPorCobrarApi.descargarAntiguedad('pdf')
    expect(click).toHaveBeenCalled()
    createEl.mockRestore()
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/features/cuentas-por-cobrar/api.test.ts`
Expected: FAIL (no existe `./api`).

- [ ] **Step 3: Implementar**

```ts
// src/features/cuentas-por-cobrar/api.ts
import { api } from '@/lib/http/axios'
import type {
  PlanCuotasDto, CrearVentaCreditoDto, RegistrarPagoCuotaDto, MoraEstimadaDto,
  ConfiguracionCuotasDto, ActualizarConfiguracionCuotasDto, RefinanciarPlanDto,
} from './types'

export type FormatoReporte = 'pdf' | 'excel'

const BASE = '/cuentas-por-cobrar'

async function descargarArchivo(url: string, fallbackName: string): Promise<void> {
  const res = await api.get(url, { responseType: 'blob' })
  const dispo = (res.headers['content-disposition'] as string | undefined) ?? ''
  const match = dispo.match(/filename="?([^";]+)"?/i)
  const nombre = match?.[1] ?? fallbackName
  const blobUrl = URL.createObjectURL(res.data as Blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = nombre
  a.click()
  a.remove()
  URL.revokeObjectURL(blobUrl)
}

export const cuentasPorCobrarApi = {
  async listar(soloConSaldo: boolean): Promise<PlanCuotasDto[]> {
    const { data } = await api.get<PlanCuotasDto[]>(BASE, { params: { soloConSaldo } })
    return data
  },
  async getById(planId: number): Promise<PlanCuotasDto> {
    const { data } = await api.get<PlanCuotasDto>(`${BASE}/${planId}`)
    return data
  },
  async crear(dto: CrearVentaCreditoDto): Promise<PlanCuotasDto> {
    const { data } = await api.post<PlanCuotasDto>(BASE, dto)
    return data
  },
  async pagarCuota(planId: number, numero: number, dto: RegistrarPagoCuotaDto): Promise<PlanCuotasDto> {
    const { data } = await api.post<PlanCuotasDto>(`${BASE}/${planId}/cuotas/${numero}/pagar`, dto)
    return data
  },
  async moraEstimada(planId: number, numero: number): Promise<MoraEstimadaDto> {
    const { data } = await api.get<MoraEstimadaDto>(`${BASE}/${planId}/cuotas/${numero}/mora-estimada`)
    return data
  },
  async getConfiguracion(): Promise<ConfiguracionCuotasDto> {
    const { data } = await api.get<ConfiguracionCuotasDto>(`${BASE}/configuracion-mora`)
    return data
  },
  async actualizarConfiguracion(dto: ActualizarConfiguracionCuotasDto): Promise<ConfiguracionCuotasDto> {
    const { data } = await api.put<ConfiguracionCuotasDto>(`${BASE}/configuracion-mora`, dto)
    return data
  },
  async refinanciar(planId: number, dto: RefinanciarPlanDto): Promise<PlanCuotasDto> {
    const { data } = await api.post<PlanCuotasDto>(`${BASE}/${planId}/refinanciar`, dto)
    return data
  },
  descargarAntiguedad(formato: FormatoReporte): Promise<void> {
    return descargarArchivo(`${BASE}/reportes/antiguedad/${formato}`, `Antiguedad_Saldos.${formato === 'pdf' ? 'pdf' : 'xlsx'}`)
  },
  descargarEstadoCuentaPlan(planId: number, formato: FormatoReporte): Promise<void> {
    return descargarArchivo(`${BASE}/reportes/estado-cuenta/plan/${planId}/${formato}`, `EstadoCuenta_Plan_${planId}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`)
  },
  descargarEstadoCuentaCliente(receptorId: number, formato: FormatoReporte): Promise<void> {
    return descargarArchivo(`${BASE}/reportes/estado-cuenta/cliente/${receptorId}/${formato}`, `EstadoCuenta_Cliente_${receptorId}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`)
  },
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run src/features/cuentas-por-cobrar/api.test.ts`
Expected: PASS.

- [ ] **Step 5: Build + commit**

```bash
npm run build
git add src/features/cuentas-por-cobrar/api.ts src/features/cuentas-por-cobrar/api.test.ts
git commit -m "feat(f5.4-s6): cliente API de cuentas por cobrar + descarga de reportes"
```

---

### Task 4: Hooks React Query (`hooks.ts`)

**Files:**
- Create: `src/features/cuentas-por-cobrar/hooks.ts`
- Test: `src/features/cuentas-por-cobrar/hooks.test.tsx`

**Interfaces:**
- Consumes: `cuentasPorCobrarApi`, tipos de `./types`.
- Produces: `usePlanes(soloConSaldo)`, `usePlan(planId)`, `useCrearVentaCredito()`, `usePagarCuota()`, `useConfiguracionMora()`, `useActualizarConfiguracionMora()`, `useRefinanciar()`. Query keys: `['cxc-planes', soloConSaldo]`, `['cxc-plan', planId]`, `['cxc-config-mora']`.

- [ ] **Step 1: Escribir el test**

```tsx
// src/features/cuentas-por-cobrar/hooks.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { usePlanes, usePlan, usePagarCuota } from './hooks'

const base = 'http://localhost:8080/api'
const plan = { id: 1, condicionOperacion: 2, montoTotal: 100, montoPagado: 0, saldoAdeudado: 100, estadoCobro: 'Pendiente', cuotas: [] }
const server = setupServer(
  http.get(`${base}/cuentas-por-cobrar`, () => HttpResponse.json([plan])),
  http.get(`${base}/cuentas-por-cobrar/1`, () => HttpResponse.json(plan)),
  http.post(`${base}/cuentas-por-cobrar/1/cuotas/1/pagar`, () => HttpResponse.json({ ...plan, montoPagado: 50, saldoAdeudado: 50 })),
)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('hooks cxc', () => {
  it('usePlanes lista planes', async () => {
    const { result } = renderHook(() => usePlanes(true), { wrapper })
    await waitFor(() => expect(result.current.data?.[0].id).toBe(1))
  })
  it('usePlan trae el detalle', async () => {
    const { result } = renderHook(() => usePlan(1), { wrapper })
    await waitFor(() => expect(result.current.data?.id).toBe(1))
  })
  it('usePagarCuota muta', async () => {
    const { result } = renderHook(() => usePagarCuota(), { wrapper })
    const res = await result.current.mutateAsync({ planId: 1, numero: 1, dto: { catFormaPagoId: 1 } })
    expect(res.saldoAdeudado).toBe(50)
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/features/cuentas-por-cobrar/hooks.test.tsx`
Expected: FAIL (no existe `./hooks`).

- [ ] **Step 3: Implementar**

```ts
// src/features/cuentas-por-cobrar/hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cuentasPorCobrarApi } from './api'
import type {
  CrearVentaCreditoDto, RegistrarPagoCuotaDto, ActualizarConfiguracionCuotasDto, RefinanciarPlanDto,
} from './types'

export function usePlanes(soloConSaldo: boolean) {
  return useQuery({ queryKey: ['cxc-planes', soloConSaldo], queryFn: () => cuentasPorCobrarApi.listar(soloConSaldo) })
}

export function usePlan(planId: number) {
  return useQuery({
    queryKey: ['cxc-plan', planId],
    queryFn: () => cuentasPorCobrarApi.getById(planId),
    enabled: Number.isFinite(planId),
  })
}

export function useCrearVentaCredito() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CrearVentaCreditoDto) => cuentasPorCobrarApi.crear(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cxc-planes'] }),
  })
}

export function usePagarCuota() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ planId, numero, dto }: { planId: number; numero: number; dto: RegistrarPagoCuotaDto }) =>
      cuentasPorCobrarApi.pagarCuota(planId, numero, dto),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['cxc-planes'] })
      qc.invalidateQueries({ queryKey: ['cxc-plan', vars.planId] })
    },
  })
}

export function useRefinanciar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ planId, dto }: { planId: number; dto: RefinanciarPlanDto }) =>
      cuentasPorCobrarApi.refinanciar(planId, dto),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['cxc-planes'] })
      qc.invalidateQueries({ queryKey: ['cxc-plan', vars.planId] })
    },
  })
}

export function useConfiguracionMora() {
  return useQuery({ queryKey: ['cxc-config-mora'], queryFn: () => cuentasPorCobrarApi.getConfiguracion() })
}

export function useActualizarConfiguracionMora() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: ActualizarConfiguracionCuotasDto) => cuentasPorCobrarApi.actualizarConfiguracion(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cxc-config-mora'] }),
  })
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run src/features/cuentas-por-cobrar/hooks.test.tsx`
Expected: PASS.

- [ ] **Step 5: Build + commit**

```bash
npm run build
git add src/features/cuentas-por-cobrar/hooks.ts src/features/cuentas-por-cobrar/hooks.test.tsx
git commit -m "feat(f5.4-s6): hooks React Query de cuentas por cobrar"
```

---

### Task 5: Handlers MSW del feature + registro global

**Files:**
- Create: `src/test/msw/cuentas-por-cobrar-handlers.ts`
- Modify: `src/test/msw/handlers.ts` (importar y esparcir `cuentasPorCobrarHandlers`)
- Test: `src/test/msw/cuentas-por-cobrar-handlers.test.ts`

**Interfaces:**
- Produces: `cuentasPorCobrarHandlers` (array de handlers MSW), y constantes exportadas `planEjemplo`, `configMoraEjemplo` reutilizables por los tests de páginas.

- [ ] **Step 1: Escribir el test**

```ts
// src/test/msw/cuentas-por-cobrar-handlers.test.ts
import { describe, it, expect } from 'vitest'
import { cuentasPorCobrarHandlers, planEjemplo } from './cuentas-por-cobrar-handlers'

describe('cuentasPorCobrarHandlers', () => {
  it('exporta handlers y un plan de ejemplo', () => {
    expect(cuentasPorCobrarHandlers.length).toBeGreaterThan(0)
    expect(planEjemplo.id).toBe(1)
    expect(planEjemplo.cuotas.length).toBeGreaterThanOrEqual(2)
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/test/msw/cuentas-por-cobrar-handlers.test.ts`
Expected: FAIL (no existe el archivo).

- [ ] **Step 3: Implementar los handlers**

```ts
// src/test/msw/cuentas-por-cobrar-handlers.ts
import { http, HttpResponse } from 'msw'
import type { PlanCuotasDto, ConfiguracionCuotasDto, MoraEstimadaDto } from '@/features/cuentas-por-cobrar/types'

const base = 'http://localhost:8080/api'

export const planEjemplo: PlanCuotasDto = {
  id: 1, receptorId: 10, receptorNombre: 'Cliente Demo', condicionOperacion: 2,
  montoTotal: 100, montoPagado: 50, saldoAdeudado: 50, estadoCobro: 'Parcial',
  cuotas: [
    { numero: 1, monto: 50, fechaPactada: '2026-07-01', estado: 'Pagada', fechaPago: '2026-07-01', codigoGeneracion: 'GEN-1', facturaId: 100, esCuotaFinal: false, interesMora: 0 },
    { numero: 2, monto: 50, fechaPactada: '2026-08-01', estado: 'Pendiente', esCuotaFinal: true, interesMora: 0 },
  ],
}

export const configMoraEjemplo: ConfiguracionCuotasDto = {
  tasaMoraMensual: 2, diasGracia: 3, moraHabilitada: true, recordatoriosHabilitados: false, diasAntesRecordatorio: 2,
}

const moraEjemplo: MoraEstimadaDto = {
  numero: 2, monto: 50, fechaPactada: '2026-08-01', diasAtraso: 0, interesMora: 0, moraHabilitada: true,
}

export const cuentasPorCobrarHandlers = [
  http.get(`${base}/cuentas-por-cobrar`, () => HttpResponse.json([planEjemplo])),
  http.get(`${base}/cuentas-por-cobrar/1`, () => HttpResponse.json(planEjemplo)),
  http.post(`${base}/cuentas-por-cobrar`, () => HttpResponse.json(planEjemplo, { status: 201 })),
  http.get(`${base}/cuentas-por-cobrar/1/cuotas/2/mora-estimada`, () => HttpResponse.json(moraEjemplo)),
  http.post(`${base}/cuentas-por-cobrar/1/cuotas/2/pagar`, () =>
    HttpResponse.json({ ...planEjemplo, montoPagado: 100, saldoAdeudado: 0, estadoCobro: 'Pagado' })),
  http.post(`${base}/cuentas-por-cobrar/1/refinanciar`, () => HttpResponse.json({ ...planEjemplo, estadoCobro: 'Refinanciado' })),
  http.get(`${base}/cuentas-por-cobrar/configuracion-mora`, () => HttpResponse.json(configMoraEjemplo)),
  http.put(`${base}/cuentas-por-cobrar/configuracion-mora`, async ({ request }) =>
    HttpResponse.json((await request.json()) as ConfiguracionCuotasDto)),
]
```

- [ ] **Step 4: Registrar en `handlers.ts`**

En `src/test/msw/handlers.ts`: añadir el import al tope y esparcir el array.

```ts
import { cuentasPorCobrarHandlers } from './cuentas-por-cobrar-handlers'
```

y dentro de `export const handlers = [ ... ]`, junto a los demás spreads:

```ts
  ...cuentasPorCobrarHandlers,
```

- [ ] **Step 5: Correr el test y verificar que pasa**

Run: `npx vitest run src/test/msw/cuentas-por-cobrar-handlers.test.ts`
Expected: PASS.

- [ ] **Step 6: Build + commit**

```bash
npm run build
git add src/test/msw/cuentas-por-cobrar-handlers.ts src/test/msw/cuentas-por-cobrar-handlers.test.ts src/test/msw/handlers.ts
git commit -m "test(f5.4-s6): handlers MSW de cuentas por cobrar"
```

---

### Task 6: `EstadoCobroBadge`

**Files:**
- Create: `src/features/cuentas-por-cobrar/components/EstadoCobroBadge.tsx`
- Test: `src/features/cuentas-por-cobrar/components/EstadoCobroBadge.test.tsx`

**Interfaces:**
- Produces: `EstadoCobroBadge({ estado }: { estado: string })` que renderiza un `Badge` del design-system con tono según estado.

- [ ] **Step 1: Escribir el test**

```tsx
// src/features/cuentas-por-cobrar/components/EstadoCobroBadge.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EstadoCobroBadge } from './EstadoCobroBadge'

describe('EstadoCobroBadge', () => {
  it('muestra el texto del estado', () => {
    render(<EstadoCobroBadge estado="Pagado" />)
    expect(screen.getByText('Pagado')).toBeInTheDocument()
  })
  it('no rompe con un estado desconocido', () => {
    render(<EstadoCobroBadge estado="Otro" />)
    expect(screen.getByText('Otro')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/features/cuentas-por-cobrar/components/EstadoCobroBadge.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar** (verificar los tonos válidos que acepta `Badge` en `src/design-system/Badge.tsx`; usar los que existan — abajo se asume `verde|oro|rojo|neutro`. Si los nombres difieren, ajustar al prop real.)

```tsx
// src/features/cuentas-por-cobrar/components/EstadoCobroBadge.tsx
import { Badge } from '@/design-system'

type Tono = 'verde' | 'oro' | 'rojo' | 'neutro'

const TONO: Record<string, Tono> = {
  Pagado: 'verde',
  Parcial: 'oro',
  Pendiente: 'neutro',
  EnMora: 'rojo',
  Refinanciado: 'oro',
}

export function EstadoCobroBadge({ estado }: { estado: string }) {
  return <Badge tone={TONO[estado] ?? 'neutro'}>{estado}</Badge>
}
```

> NOTA al implementador: abrir `src/design-system/Badge.tsx` y confirmar el nombre del prop (`tone`/`variant`/`color`) y los valores admitidos. Ajustar `Tono` y el JSX a la API real ANTES de correr el test.

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run src/features/cuentas-por-cobrar/components/EstadoCobroBadge.test.tsx`
Expected: PASS.

- [ ] **Step 5: Build + commit**

```bash
npm run build
git add src/features/cuentas-por-cobrar/components/EstadoCobroBadge.*
git commit -m "feat(f5.4-s6): badge de estado de cobro"
```

---

### Task 7: `CuotasBuilder`

**Files:**
- Create: `src/features/cuentas-por-cobrar/components/CuotasBuilder.tsx`
- Test: `src/features/cuentas-por-cobrar/components/CuotasBuilder.test.tsx`

**Interfaces:**
- Consumes: `CuotaDraft`, `ModoCuota`, `validarCuotas`, `montoDeCuota` de `../calc/cuotas`.
- Produces: `CuotasBuilder({ total, drafts, modo, onDrafts, onModo, errorBackend? })`:
  - `total: number`
  - `drafts: CuotaDraft[]`, `onDrafts(d: CuotaDraft[]): void`
  - `modo: ModoCuota`, `onModo(m: ModoCuota): void`
  - `errorBackend?: string | null`
  El componente es CONTROLADO (estado vive en la página padre). Muestra el error de `validarCuotas` en vivo y el monto calculado por cuota en modo porcentaje.

- [ ] **Step 1: Escribir el test**

```tsx
// src/features/cuentas-por-cobrar/components/CuotasBuilder.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { CuotasBuilder } from './CuotasBuilder'
import type { CuotaDraft, ModoCuota } from '../calc/cuotas'

function Harness({ total }: { total: number }) {
  const [drafts, setDrafts] = useState<CuotaDraft[]>([
    { fechaPactada: '2026-07-01', valor: 40 },
    { fechaPactada: '2026-08-01', valor: 50 },
  ])
  const [modo, setModo] = useState<ModoCuota>('monto')
  return <CuotasBuilder total={total} drafts={drafts} modo={modo} onDrafts={setDrafts} onModo={setModo} />
}

describe('CuotasBuilder', () => {
  it('muestra error cuando las cuotas no cuadran con el total', () => {
    render(<Harness total={100} />)
    expect(screen.getByText(/no coincide/i)).toBeInTheDocument()
  })
  it('permite agregar una cuota', () => {
    render(<Harness total={100} />)
    fireEvent.click(screen.getByRole('button', { name: /agregar cuota/i }))
    // ahora hay 3 filas de fecha
    expect(screen.getAllByLabelText(/fecha/i).length).toBe(3)
  })
  it('llama onDrafts al cambiar un valor', () => {
    const onDrafts = vi.fn()
    render(<CuotasBuilder total={100} modo="monto" onModo={() => {}} onDrafts={onDrafts}
      drafts={[{ fechaPactada: '2026-07-01', valor: 40 }, { fechaPactada: '2026-08-01', valor: 60 }]} />)
    fireEvent.change(screen.getAllByLabelText(/monto|valor/i)[0], { target: { value: '30' } })
    expect(onDrafts).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/features/cuentas-por-cobrar/components/CuotasBuilder.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```tsx
// src/features/cuentas-por-cobrar/components/CuotasBuilder.tsx
import { Button, FormField, Input, Icon } from '@/design-system'
import { validarCuotas, montoDeCuota, type CuotaDraft, type ModoCuota } from '../calc/cuotas'

interface Props {
  total: number
  drafts: CuotaDraft[]
  modo: ModoCuota
  onDrafts: (d: CuotaDraft[]) => void
  onModo: (m: ModoCuota) => void
  errorBackend?: string | null
}

export function CuotasBuilder({ total, drafts, modo, onDrafts, onModo, errorBackend }: Props) {
  const error = validarCuotas(drafts, modo, total) ?? errorBackend ?? null
  const set = (idx: number, patch: Partial<CuotaDraft>) =>
    onDrafts(drafts.map((d, i) => (i === idx ? { ...d, ...patch } : d)))
  const agregar = () => onDrafts([...drafts, { fechaPactada: '', valor: 0 }])
  const quitar = (idx: number) => onDrafts(drafts.filter((_, i) => i !== idx))
  const fmt = (n: number) => `$${n.toFixed(2)}`

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-slate/80">
          <span className="h-1.5 w-1.5 rounded-full bg-oro" />Plan de cuotas
        </h2>
        <label className="flex items-center gap-2 text-xs">
          Modo
          <select className="rounded-md border border-hairline bg-surface px-2 py-1 text-sm dark:bg-surface-dark"
            value={modo} onChange={(e) => onModo(e.target.value as ModoCuota)}>
            <option value="monto">Monto fijo</option>
            <option value="porcentaje">Porcentaje</option>
          </select>
        </label>
      </div>

      {drafts.map((d, idx) => (
        <div key={idx} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
          <FormField label={`Cuota ${idx + 1} — fecha`} htmlFor={`cuota-fecha-${idx}`}>
            <Input id={`cuota-fecha-${idx}`} type="date" value={d.fechaPactada}
              onChange={(e) => set(idx, { fechaPactada: e.target.value })} />
          </FormField>
          <FormField label={modo === 'monto' ? 'Monto' : 'Porcentaje (valor)'} htmlFor={`cuota-valor-${idx}`}>
            <Input id={`cuota-valor-${idx}`} type="number" value={d.valor}
              onChange={(e) => set(idx, { valor: Number(e.target.value) })} />
          </FormField>
          <div className="pb-2 text-right text-xs text-slate">
            {modo === 'porcentaje' && <span className="cifra">{fmt(montoDeCuota(d, modo, total))}</span>}
            {drafts.length > 2 && (
              <button type="button" className="ml-2 text-rojo" onClick={() => quitar(idx)}>Quitar</button>
            )}
          </div>
        </div>
      ))}

      <Button variant="ghost" onClick={agregar}><Icon name="plus" size={16} />Agregar cuota</Button>
      {error && <p className="rounded-md bg-rojo/10 px-3 py-2 text-sm text-rojo">{error}</p>}
    </section>
  )
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run src/features/cuentas-por-cobrar/components/CuotasBuilder.test.tsx`
Expected: PASS.

- [ ] **Step 5: Build + commit**

```bash
npm run build
git add src/features/cuentas-por-cobrar/components/CuotasBuilder.*
git commit -m "feat(f5.4-s6): constructor de cuotas reutilizable"
```

---

### Task 8: `PlanCuotasTable`

**Files:**
- Create: `src/features/cuentas-por-cobrar/components/PlanCuotasTable.tsx`
- Test: `src/features/cuentas-por-cobrar/components/PlanCuotasTable.test.tsx`

**Interfaces:**
- Consumes: `CuotaDto` de `../types`.
- Produces: `PlanCuotasTable({ cuotas, onPagar })`:
  - `cuotas: CuotaDto[]`
  - `onPagar(numero: number): void` — se invoca al pulsar "Pagar" en una cuota pendiente.
  Muestra una fila por cuota (número, fecha pactada, monto, estado, interés mora, código de generación si pagada). El botón "Pagar" solo aparece en cuotas con `estado !== 'Pagada'`.

- [ ] **Step 1: Escribir el test**

```tsx
// src/features/cuentas-por-cobrar/components/PlanCuotasTable.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PlanCuotasTable } from './PlanCuotasTable'
import type { CuotaDto } from '../types'

const cuotas: CuotaDto[] = [
  { numero: 1, monto: 50, fechaPactada: '2026-07-01', estado: 'Pagada', codigoGeneracion: 'GEN-1', esCuotaFinal: false, interesMora: 0 },
  { numero: 2, monto: 50, fechaPactada: '2026-08-01', estado: 'Pendiente', esCuotaFinal: true, interesMora: 0 },
]

describe('PlanCuotasTable', () => {
  it('renderiza una fila por cuota', () => {
    render(<PlanCuotasTable cuotas={cuotas} onPagar={() => {}} />)
    expect(screen.getByText('GEN-1')).toBeInTheDocument()
    expect(screen.getAllByText('$50.00').length).toBe(2)
  })
  it('solo muestra Pagar en cuotas no pagadas y pasa el número', () => {
    const onPagar = vi.fn()
    render(<PlanCuotasTable cuotas={cuotas} onPagar={onPagar} />)
    const botones = screen.getAllByRole('button', { name: /pagar/i })
    expect(botones.length).toBe(1)
    fireEvent.click(botones[0])
    expect(onPagar).toHaveBeenCalledWith(2)
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/features/cuentas-por-cobrar/components/PlanCuotasTable.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```tsx
// src/features/cuentas-por-cobrar/components/PlanCuotasTable.tsx
import { Button } from '@/design-system'
import type { CuotaDto } from '../types'

const fmt = (n: number) => `$${n.toFixed(2)}`

export function PlanCuotasTable({ cuotas, onPagar }: { cuotas: CuotaDto[]; onPagar: (numero: number) => void }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs uppercase tracking-wide text-slate/70">
          <th className="py-2">#</th>
          <th>Fecha pactada</th>
          <th className="text-right">Monto</th>
          <th>Estado</th>
          <th className="text-right">Mora</th>
          <th>Código gen.</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {cuotas.map((c) => (
          <tr key={c.numero} className="border-t border-hairline">
            <td className="py-2">{c.numero}</td>
            <td>{c.fechaPactada?.slice(0, 10)}</td>
            <td className="cifra text-right">{fmt(c.monto)}</td>
            <td>{c.estado}</td>
            <td className="cifra text-right">{c.interesMora > 0 ? fmt(c.interesMora) : '—'}</td>
            <td className="font-mono text-xs">{c.codigoGeneracion ?? '—'}</td>
            <td className="text-right">
              {c.estado !== 'Pagada' && (
                <Button variant="ghost" onClick={() => onPagar(c.numero)}>Pagar</Button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run src/features/cuentas-por-cobrar/components/PlanCuotasTable.test.tsx`
Expected: PASS.

- [ ] **Step 5: Build + commit**

```bash
npm run build
git add src/features/cuentas-por-cobrar/components/PlanCuotasTable.*
git commit -m "feat(f5.4-s6): tabla de cuotas del plan"
```

---

### Task 9: `PagarCuotaModal`

**Files:**
- Create: `src/features/cuentas-por-cobrar/components/PagarCuotaModal.tsx`
- Test: `src/features/cuentas-por-cobrar/components/PagarCuotaModal.test.tsx`

**Interfaces:**
- Consumes: `cuentasPorCobrarApi.moraEstimada`, `useCatalogo('formasPago')` de `@/features/facturacion/hooks`, `RegistrarPagoCuotaDto`.
- Produces: `PagarCuotaModal({ planId, numero, onConfirmar, onClose, cargando })`:
  - `planId: number`, `numero: number`
  - `onConfirmar(dto: RegistrarPagoCuotaDto): void`
  - `onClose(): void`, `cargando: boolean`
  Al abrir consulta la mora estimada de la cuota (vía React Query) y la muestra; pide forma de pago (catálogo) y referencia opcional.

- [ ] **Step 1: Escribir el test** (usa los handlers globales MSW, ya registrados en Task 5; el render helper de tests con QueryClient + ToastProvider es el del repo — usar el wrapper de pruebas existente; abajo se monta uno mínimo).

```tsx
// src/features/cuentas-por-cobrar/components/PagarCuotaModal.test.tsx
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { PagarCuotaModal } from './PagarCuotaModal'

const base = 'http://localhost:8080/api'
const server = setupServer(
  http.get(`${base}/cuentas-por-cobrar/1/cuotas/2/mora-estimada`, () =>
    HttpResponse.json({ numero: 2, monto: 50, fechaPactada: '2026-08-01', diasAtraso: 5, interesMora: 1.25, moraHabilitada: true })),
  http.get(`${base}/catalogos/formas-pago`, () => HttpResponse.json([{ id: 1, valor: 'Efectivo' }, { id: 2, valor: 'Transferencia' }])),
)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('PagarCuotaModal', () => {
  it('muestra la mora estimada y confirma con la forma de pago', async () => {
    const onConfirmar = vi.fn()
    render(<PagarCuotaModal planId={1} numero={2} onConfirmar={onConfirmar} onClose={() => {}} cargando={false} />, { wrapper })
    await waitFor(() => expect(screen.getByText(/1\.25/)).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /confirmar pago/i }))
    expect(onConfirmar).toHaveBeenCalledWith(expect.objectContaining({ catFormaPagoId: expect.any(Number) }))
  })
})
```

> NOTA al implementador: confirmar la URL real del catálogo de formas de pago que usa `useCatalogo('formasPago')` (abrir `src/features/facturacion/catalogos-api.ts` / `hooks.ts`) y ajustar el handler del test a esa ruta. El ejemplo asume `/catalogos/formas-pago`.

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/features/cuentas-por-cobrar/components/PagarCuotaModal.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```tsx
// src/features/cuentas-por-cobrar/components/PagarCuotaModal.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Modal, Button, FormField, Input } from '@/design-system'
import { useCatalogo } from '@/features/facturacion/hooks'
import { cuentasPorCobrarApi } from '../api'
import type { RegistrarPagoCuotaDto } from '../types'

interface Props {
  planId: number
  numero: number
  onConfirmar: (dto: RegistrarPagoCuotaDto) => void
  onClose: () => void
  cargando: boolean
}

export function PagarCuotaModal({ planId, numero, onConfirmar, onClose, cargando }: Props) {
  const formas = useCatalogo('formasPago')
  const mora = useQuery({
    queryKey: ['cxc-mora', planId, numero],
    queryFn: () => cuentasPorCobrarApi.moraEstimada(planId, numero),
  })
  const [catFormaPagoId, setCatFormaPagoId] = useState<number>(1)
  const [referencia, setReferencia] = useState('')
  const fmt = (n: number) => `$${n.toFixed(2)}`

  return (
    <Modal open onClose={onClose} title={`Pagar cuota ${numero}`}>
      <div className="space-y-3">
        {mora.data && (
          <div className="rounded-md border border-hairline px-3 py-2 text-sm">
            <p>Monto cuota: <span className="cifra">{fmt(mora.data.monto)}</span></p>
            {mora.data.moraHabilitada && mora.data.diasAtraso > 0 && (
              <p className="text-rojo">Mora estimada ({mora.data.diasAtraso} días): <span className="cifra">{fmt(mora.data.interesMora)}</span></p>
            )}
          </div>
        )}
        <FormField label="Forma de pago" htmlFor="pc-forma">
          <select id="pc-forma" className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark"
            value={catFormaPagoId} onChange={(e) => setCatFormaPagoId(Number(e.target.value))}>
            {(formas.data ?? []).map((f) => <option key={f.id} value={f.id}>{f.valor}</option>)}
          </select>
        </FormField>
        <FormField label="Referencia (opcional)" htmlFor="pc-ref">
          <Input id="pc-ref" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onConfirmar({ catFormaPagoId, referencia: referencia.trim() || null })} disabled={cargando}>
            {cargando ? 'Procesando…' : 'Confirmar pago'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run src/features/cuentas-por-cobrar/components/PagarCuotaModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Build + commit**

```bash
npm run build
git add src/features/cuentas-por-cobrar/components/PagarCuotaModal.*
git commit -m "feat(f5.4-s6): modal de pago de cuota con mora estimada"
```

---

### Task 10: `RefinanciarModal`

**Files:**
- Create: `src/features/cuentas-por-cobrar/components/RefinanciarModal.tsx`
- Test: `src/features/cuentas-por-cobrar/components/RefinanciarModal.test.tsx`

**Interfaces:**
- Consumes: `CuotasBuilder`, `construirDefiniciones`, `validarCuotas` de `../calc/cuotas`, `RefinanciarPlanDto`.
- Produces: `RefinanciarModal({ saldo, onConfirmar, onClose, cargando })`:
  - `saldo: number` (total a refinanciar)
  - `onConfirmar(dto: RefinanciarPlanDto): void`
  - `onClose(): void`, `cargando: boolean`
  Pide motivo + plan de cuotas nuevas (via `CuotasBuilder` con `total = saldo`). Bloquea confirmar si las cuotas no cuadran o falta el motivo.

- [ ] **Step 1: Escribir el test**

```tsx
// src/features/cuentas-por-cobrar/components/RefinanciarModal.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RefinanciarModal } from './RefinanciarModal'

describe('RefinanciarModal', () => {
  it('no confirma sin motivo aunque las cuotas cuadren', () => {
    const onConfirmar = vi.fn()
    render(<RefinanciarModal saldo={100} onConfirmar={onConfirmar} onClose={() => {}} cargando={false} />)
    fireEvent.click(screen.getByRole('button', { name: /refinanciar/i }))
    expect(onConfirmar).not.toHaveBeenCalled()
    expect(screen.getByText(/motivo/i)).toBeInTheDocument()
  })
  it('confirma con motivo y cuotas que cuadran (50+50=100 por defecto)', () => {
    const onConfirmar = vi.fn()
    render(<RefinanciarModal saldo={100} onConfirmar={onConfirmar} onClose={() => {}} cargando={false} />)
    fireEvent.change(screen.getByLabelText(/motivo/i), { target: { value: 'Acuerdo con cliente' } })
    // ajustar las dos cuotas por defecto a 50 y 50
    const valores = screen.getAllByLabelText(/monto|valor/i)
    fireEvent.change(valores[0], { target: { value: '50' } })
    fireEvent.change(valores[1], { target: { value: '50' } })
    const fechas = screen.getAllByLabelText(/fecha/i)
    fireEvent.change(fechas[0], { target: { value: '2026-09-01' } })
    fireEvent.change(fechas[1], { target: { value: '2026-10-01' } })
    fireEvent.click(screen.getByRole('button', { name: /^refinanciar/i }))
    expect(onConfirmar).toHaveBeenCalledWith(expect.objectContaining({ motivo: 'Acuerdo con cliente' }))
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/features/cuentas-por-cobrar/components/RefinanciarModal.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```tsx
// src/features/cuentas-por-cobrar/components/RefinanciarModal.tsx
import { useState } from 'react'
import { Modal, Button, FormField, Input } from '@/design-system'
import { CuotasBuilder } from './CuotasBuilder'
import { validarCuotas, construirDefiniciones, type CuotaDraft, type ModoCuota } from '../calc/cuotas'
import type { RefinanciarPlanDto } from '../types'

interface Props {
  saldo: number
  onConfirmar: (dto: RefinanciarPlanDto) => void
  onClose: () => void
  cargando: boolean
}

export function RefinanciarModal({ saldo, onConfirmar, onClose, cargando }: Props) {
  const [motivo, setMotivo] = useState('')
  const [modo, setModo] = useState<ModoCuota>('monto')
  const [drafts, setDrafts] = useState<CuotaDraft[]>([
    { fechaPactada: '', valor: 0 },
    { fechaPactada: '', valor: 0 },
  ])
  const [error, setError] = useState<string | null>(null)

  const confirmar = () => {
    if (!motivo.trim()) { setError('El motivo es obligatorio.'); return }
    const errCuotas = validarCuotas(drafts, modo, saldo)
    if (errCuotas) { setError(errCuotas); return }
    onConfirmar({ motivo: motivo.trim(), nuevasCuotas: construirDefiniciones(drafts, modo) })
  }

  return (
    <Modal open onClose={onClose} title="Refinanciar plan">
      <div className="space-y-3">
        <p className="text-sm text-slate">Saldo a refinanciar: <span className="cifra">${saldo.toFixed(2)}</span></p>
        <FormField label="Motivo" htmlFor="rf-motivo">
          <Input id="rf-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </FormField>
        <CuotasBuilder total={saldo} drafts={drafts} modo={modo} onDrafts={setDrafts} onModo={setModo} />
        {error && <p className="rounded-md bg-rojo/10 px-3 py-2 text-sm text-rojo">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={confirmar} disabled={cargando}>{cargando ? 'Procesando…' : 'Refinanciar'}</Button>
        </div>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run src/features/cuentas-por-cobrar/components/RefinanciarModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Build + commit**

```bash
npm run build
git add src/features/cuentas-por-cobrar/components/RefinanciarModal.*
git commit -m "feat(f5.4-s6): modal de refinanciamiento de plan"
```

---

### Task 11: `ReporteDescargaButtons`

**Files:**
- Create: `src/features/cuentas-por-cobrar/components/ReporteDescargaButtons.tsx`
- Test: `src/features/cuentas-por-cobrar/components/ReporteDescargaButtons.test.tsx`

**Interfaces:**
- Produces: `ReporteDescargaButtons({ label, onDescargar })`:
  - `label: string` (ej. "Antigüedad de saldos")
  - `onDescargar(formato: 'pdf' | 'excel'): void`
  Renderiza dos botones (PDF / Excel) que invocan `onDescargar` con el formato. Mantiene la lógica de descarga fuera del componente (la página la conecta a `cuentasPorCobrarApi`).

- [ ] **Step 1: Escribir el test**

```tsx
// src/features/cuentas-por-cobrar/components/ReporteDescargaButtons.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReporteDescargaButtons } from './ReporteDescargaButtons'

describe('ReporteDescargaButtons', () => {
  it('invoca onDescargar con el formato correcto', () => {
    const onDescargar = vi.fn()
    render(<ReporteDescargaButtons label="Antigüedad de saldos" onDescargar={onDescargar} />)
    fireEvent.click(screen.getByRole('button', { name: /pdf/i }))
    fireEvent.click(screen.getByRole('button', { name: /excel/i }))
    expect(onDescargar).toHaveBeenNthCalledWith(1, 'pdf')
    expect(onDescargar).toHaveBeenNthCalledWith(2, 'excel')
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/features/cuentas-por-cobrar/components/ReporteDescargaButtons.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```tsx
// src/features/cuentas-por-cobrar/components/ReporteDescargaButtons.tsx
import { Button, Icon } from '@/design-system'
import type { FormatoReporte } from '../api'

export function ReporteDescargaButtons({ label, onDescargar }: { label: string; onDescargar: (f: FormatoReporte) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate">{label}</span>
      <Button variant="ghost" onClick={() => onDescargar('pdf')}><Icon name="printer" size={16} />PDF</Button>
      <Button variant="ghost" onClick={() => onDescargar('excel')}><Icon name="printer" size={16} />Excel</Button>
    </div>
  )
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run src/features/cuentas-por-cobrar/components/ReporteDescargaButtons.test.tsx`
Expected: PASS.

- [ ] **Step 5: Build + commit**

```bash
npm run build
git add src/features/cuentas-por-cobrar/components/ReporteDescargaButtons.*
git commit -m "feat(f5.4-s6): botones de descarga de reportes"
```

---

### Task 12: Mapper `form → CrearVentaCreditoDto`

**Files:**
- Create: `src/features/cuentas-por-cobrar/mappers.ts`
- Test: `src/features/cuentas-por-cobrar/mappers.test.ts`

**Interfaces:**
- Consumes: `CreateFacturaDto` de `@/features/facturacion/types`; `DefinicionCuotaDto`, `CrearVentaCreditoDto` de `./types`.
- Produces: `buildCrearVentaCreditoDto(venta: CreateFacturaDto, cuotas: DefinicionCuotaDto[], observaciones?: string | null): CrearVentaCreditoDto`.

- [ ] **Step 1: Escribir el test**

```ts
// src/features/cuentas-por-cobrar/mappers.test.ts
import { describe, it, expect } from 'vitest'
import { buildCrearVentaCreditoDto } from './mappers'
import type { CreateFacturaDto } from '@/features/facturacion/types'

const venta = { resumen: { condicionOperacion: 2, totalPagar: 100 } } as unknown as CreateFacturaDto

describe('buildCrearVentaCreditoDto', () => {
  it('envuelve venta + cuotas + observaciones', () => {
    const dto = buildCrearVentaCreditoDto(venta, [
      { numero: 1, monto: 40, fechaPactada: '2026-07-01' },
      { numero: 2, monto: 60, fechaPactada: '2026-08-01' },
    ], 'a 60 días')
    expect(dto.venta).toBe(venta)
    expect(dto.cuotas).toHaveLength(2)
    expect(dto.observaciones).toBe('a 60 días')
  })
  it('observaciones es null cuando va vacío', () => {
    const dto = buildCrearVentaCreditoDto(venta, [], '')
    expect(dto.observaciones).toBeNull()
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/features/cuentas-por-cobrar/mappers.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```ts
// src/features/cuentas-por-cobrar/mappers.ts
import type { CreateFacturaDto } from '@/features/facturacion/types'
import type { CrearVentaCreditoDto, DefinicionCuotaDto } from './types'

export function buildCrearVentaCreditoDto(
  venta: CreateFacturaDto,
  cuotas: DefinicionCuotaDto[],
  observaciones?: string | null,
): CrearVentaCreditoDto {
  return { venta, cuotas, observaciones: observaciones?.trim() ? observaciones.trim() : null }
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run src/features/cuentas-por-cobrar/mappers.test.ts`
Expected: PASS.

- [ ] **Step 5: Build + commit**

```bash
npm run build
git add src/features/cuentas-por-cobrar/mappers.*
git commit -m "feat(f5.4-s6): mapper de venta a crédito"
```

---

### Task 13: `PlanesListPage`

**Files:**
- Create: `src/features/cuentas-por-cobrar/pages/PlanesListPage.tsx`
- Test: `src/features/cuentas-por-cobrar/pages/PlanesListPage.test.tsx`

**Interfaces:**
- Consumes: `usePlanes`, `cuentasPorCobrarApi.descargarAntiguedad`, `EstadoCobroBadge`, `ReporteDescargaButtons`.
- Produces: `PlanesListPage()` (default-less named export). Tabla de planes; toggle "solo con saldo"; fila enlaza a `/cuentas-por-cobrar/:id`; botón "Nueva venta a crédito" → `/cuentas-por-cobrar/nueva`.

- [ ] **Step 1: Escribir el test**

```tsx
// src/features/cuentas-por-cobrar/pages/PlanesListPage.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { cuentasPorCobrarHandlers } from '@/test/msw/cuentas-por-cobrar-handlers'
import { PlanesListPage } from './PlanesListPage'

const server = setupServer(...cuentasPorCobrarHandlers)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>
}

describe('PlanesListPage', () => {
  it('lista los planes con su cliente y estado', async () => {
    render(<PlanesListPage />, { wrapper })
    await waitFor(() => expect(screen.getByText('Cliente Demo')).toBeInTheDocument())
    expect(screen.getByText('Parcial')).toBeInTheDocument()
  })
  it('muestra el botón de nueva venta a crédito', async () => {
    render(<PlanesListPage />, { wrapper })
    expect(screen.getByRole('link', { name: /nueva venta a crédito/i })).toHaveAttribute('href', '/cuentas-por-cobrar/nueva')
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/features/cuentas-por-cobrar/pages/PlanesListPage.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```tsx
// src/features/cuentas-por-cobrar/pages/PlanesListPage.tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Spinner, EmptyState, useToast } from '@/design-system'
import { usePlanes } from '../hooks'
import { cuentasPorCobrarApi, type FormatoReporte } from '../api'
import { EstadoCobroBadge } from '../components/EstadoCobroBadge'
import { ReporteDescargaButtons } from '../components/ReporteDescargaButtons'

const fmt = (n: number) => `$${n.toFixed(2)}`

export function PlanesListPage() {
  const [soloConSaldo, setSoloConSaldo] = useState(true)
  const planes = usePlanes(soloConSaldo)
  const toast = useToast()

  const descargar = async (formato: FormatoReporte) => {
    try {
      await cuentasPorCobrarApi.descargarAntiguedad(formato)
    } catch {
      toast.show('No se pudo descargar el reporte', { tone: 'rojo' })
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Cuentas por cobrar</h1>
        <Button as={Link} to="/cuentas-por-cobrar/nueva">Nueva venta a crédito</Button>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={soloConSaldo} onChange={(e) => setSoloConSaldo(e.target.checked)} />
          Solo planes con saldo
        </label>
        <ReporteDescargaButtons label="Antigüedad de saldos" onDescargar={descargar} />
      </div>

      {planes.isLoading ? (
        <Spinner />
      ) : !planes.data?.length ? (
        <EmptyState title="Sin planes" description="No hay planes de cuotas para mostrar." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate/70">
              <th className="py-2">Cliente</th>
              <th className="text-right">Total</th>
              <th className="text-right">Pagado</th>
              <th className="text-right">Saldo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {planes.data.map((p) => (
              <tr key={p.id} className="border-t border-hairline hover:bg-oro-tint/30">
                <td className="py-2">
                  <Link className="text-sello underline-offset-2 hover:underline" to={`/cuentas-por-cobrar/${p.id}`}>
                    {p.receptorNombre ?? 'Consumidor Final'}
                  </Link>
                </td>
                <td className="cifra text-right">{fmt(p.montoTotal)}</td>
                <td className="cifra text-right">{fmt(p.montoPagado)}</td>
                <td className="cifra text-right">{fmt(p.saldoAdeudado)}</td>
                <td><EstadoCobroBadge estado={p.estadoCobro} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
```

> NOTA al implementador: confirmar que `Button` soporta `as={Link}`. Si no, usar `<Link className="..."><Button>…</Button></Link>` o `useNavigate`. Revisar `src/design-system/Button.tsx` y seguir el patrón de navegación que ya usan ComprasListPage / DtesRecibidosListPage.

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run src/features/cuentas-por-cobrar/pages/PlanesListPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Build + commit**

```bash
npm run build
git add src/features/cuentas-por-cobrar/pages/PlanesListPage.*
git commit -m "feat(f5.4-s6): listado de planes de cuentas por cobrar"
```

---

### Task 14: `PlanDetallePage`

**Files:**
- Create: `src/features/cuentas-por-cobrar/pages/PlanDetallePage.tsx`
- Test: `src/features/cuentas-por-cobrar/pages/PlanDetallePage.test.tsx`

**Interfaces:**
- Consumes: `usePlan`, `usePagarCuota`, `useRefinanciar`, `cuentasPorCobrarApi.descargarEstadoCuentaPlan`, `PlanCuotasTable`, `PagarCuotaModal`, `RefinanciarModal`, `EstadoCobroBadge`, `ReporteDescargaButtons`. Lee `:planId` de la URL.
- Produces: `PlanDetallePage()`.

- [ ] **Step 1: Escribir el test**

```tsx
// src/features/cuentas-por-cobrar/pages/PlanDetallePage.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { ToastProvider } from '@/design-system'
import { cuentasPorCobrarHandlers } from '@/test/msw/cuentas-por-cobrar-handlers'
import { PlanDetallePage } from './PlanDetallePage'

const base = 'http://localhost:8080/api'
const server = setupServer(
  ...cuentasPorCobrarHandlers,
  http.get(`${base}/catalogos/formas-pago`, () => HttpResponse.json([{ id: 1, valor: 'Efectivo' }])),
)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderEn(ruta: string, children: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter initialEntries={[ruta]}>
          <Routes><Route path="/cuentas-por-cobrar/:planId" element={children} /></Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

describe('PlanDetallePage', () => {
  it('muestra la cabecera y las cuotas del plan', async () => {
    renderEn('/cuentas-por-cobrar/1', <PlanDetallePage />)
    await waitFor(() => expect(screen.getByText('Cliente Demo')).toBeInTheDocument())
    expect(screen.getByText('GEN-1')).toBeInTheDocument()
  })
  it('abre el modal de pago al pulsar Pagar', async () => {
    renderEn('/cuentas-por-cobrar/1', <PlanDetallePage />)
    await waitFor(() => screen.getByText('GEN-1'))
    fireEvent.click(screen.getByRole('button', { name: /^pagar/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: /confirmar pago/i })).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/features/cuentas-por-cobrar/pages/PlanDetallePage.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```tsx
// src/features/cuentas-por-cobrar/pages/PlanDetallePage.tsx
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Spinner, EmptyState, useToast } from '@/design-system'
import { usePlan, usePagarCuota, useRefinanciar } from '../hooks'
import { cuentasPorCobrarApi, type FormatoReporte } from '../api'
import { PlanCuotasTable } from '../components/PlanCuotasTable'
import { PagarCuotaModal } from '../components/PagarCuotaModal'
import { RefinanciarModal } from '../components/RefinanciarModal'
import { EstadoCobroBadge } from '../components/EstadoCobroBadge'
import { ReporteDescargaButtons } from '../components/ReporteDescargaButtons'
import type { RegistrarPagoCuotaDto, RefinanciarPlanDto } from '../types'

const fmt = (n: number) => `$${n.toFixed(2)}`

export function PlanDetallePage() {
  const { planId } = useParams<{ planId: string }>()
  const id = Number(planId)
  const plan = usePlan(id)
  const pagar = usePagarCuota()
  const refinanciar = useRefinanciar()
  const toast = useToast()
  const [cuotaAPagar, setCuotaAPagar] = useState<number | null>(null)
  const [refinanciando, setRefinanciando] = useState(false)

  const descargar = async (formato: FormatoReporte) => {
    try { await cuentasPorCobrarApi.descargarEstadoCuentaPlan(id, formato) }
    catch { toast.show('No se pudo descargar el estado de cuenta', { tone: 'rojo' }) }
  }

  const onPagar = async (dto: RegistrarPagoCuotaDto) => {
    if (cuotaAPagar == null) return
    try {
      await pagar.mutateAsync({ planId: id, numero: cuotaAPagar, dto })
      toast.show('Cuota pagada')
      setCuotaAPagar(null)
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'No se pudo pagar la cuota'
      toast.show(msg, { tone: 'rojo' })
    }
  }

  const onRefinanciar = async (dto: RefinanciarPlanDto) => {
    try {
      await refinanciar.mutateAsync({ planId: id, dto })
      toast.show('Plan refinanciado')
      setRefinanciando(false)
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'No se pudo refinanciar'
      toast.show(msg, { tone: 'rojo' })
    }
  }

  if (plan.isLoading) return <div className="p-6"><Spinner /></div>
  if (plan.isError || !plan.data) return <div className="p-6"><EmptyState title="Plan no encontrado" description="El plan no existe o no tienes acceso." /></div>

  const p = plan.data
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">{p.receptorNombre ?? 'Consumidor Final'}</h1>
          <p className="text-sm text-slate">Plan #{p.id} · Condición {p.condicionOperacion === 2 ? 'Crédito' : 'Mixto'}</p>
        </div>
        <EstadoCobroBadge estado={p.estadoCobro} />
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-lg border border-hairline px-3 py-2">Total<br /><span className="cifra text-lg">{fmt(p.montoTotal)}</span></div>
        <div className="rounded-lg border border-hairline px-3 py-2">Pagado<br /><span className="cifra text-lg">{fmt(p.montoPagado)}</span></div>
        <div className="rounded-lg border border-hairline px-3 py-2">Saldo<br /><span className="cifra text-lg">{fmt(p.saldoAdeudado)}</span></div>
      </div>

      <PlanCuotasTable cuotas={p.cuotas} onPagar={setCuotaAPagar} />

      <div className="flex items-center justify-between">
        <ReporteDescargaButtons label="Estado de cuenta" onDescargar={descargar} />
        {p.saldoAdeudado > 0 && <Button variant="ghost" onClick={() => setRefinanciando(true)}>Refinanciar</Button>}
      </div>

      {cuotaAPagar != null && (
        <PagarCuotaModal planId={id} numero={cuotaAPagar} onConfirmar={onPagar} onClose={() => setCuotaAPagar(null)} cargando={pagar.isPending} />
      )}
      {refinanciando && (
        <RefinanciarModal saldo={p.saldoAdeudado} onConfirmar={onRefinanciar} onClose={() => setRefinanciando(false)} cargando={refinanciar.isPending} />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run src/features/cuentas-por-cobrar/pages/PlanDetallePage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Build + commit**

```bash
npm run build
git add src/features/cuentas-por-cobrar/pages/PlanDetallePage.*
git commit -m "feat(f5.4-s6): detalle del plan con pago y refinanciamiento"
```

---

### Task 15: `CrearVentaCreditoPage`

**Files:**
- Create: `src/features/cuentas-por-cobrar/pages/CrearVentaCreditoPage.tsx`
- Test: `src/features/cuentas-por-cobrar/pages/CrearVentaCreditoPage.test.tsx`

**Interfaces:**
- Consumes (reuso facturación): `DatosGeneralesSection`, `CuerpoDocumentoTable`, `TotalesPanel` de `@/features/facturacion/components/*`; `buildCreateFacturaDto`, `type FormItem` de `@/features/facturacion/mappers`; `getStrategy` de `@/features/facturacion/dte/registry`; `useCatalogo` de `@/features/facturacion/hooks`; tipos `ReceptorListItem` de `@/features/facturacion/types`.
- Consumes (propios): `useCrearVentaCredito`, `buildCrearVentaCreditoDto`, `CuotasBuilder`, `construirDefiniciones`, `validarCuotas`.
- Produces: `CrearVentaCreditoPage()`. Fija `tipoDte='01'`; condición 2/3; arma `Venta` con `buildCreateFacturaDto` inyectando un `pago` con la forma de pago de la cuota 1; valida cuotas; POSTea y navega a `/cuentas-por-cobrar/:idNuevo`.

- [ ] **Step 1: Escribir el test** (de humo: la página monta, calcula total y bloquea el submit si las cuotas no cuadran; el e2e real valida el contrato completo).

```tsx
// src/features/cuentas-por-cobrar/pages/CrearVentaCreditoPage.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { ToastProvider } from '@/design-system'
import { cuentasPorCobrarHandlers } from '@/test/msw/cuentas-por-cobrar-handlers'
import { CrearVentaCreditoPage } from './CrearVentaCreditoPage'

const base = 'http://localhost:8080/api'
const server = setupServer(
  ...cuentasPorCobrarHandlers,
  // catálogos que consumen los componentes de facturación reutilizados:
  http.get(`${base}/catalogos/sucursales`, () => HttpResponse.json([{ id: 1, nombre: 'Casa Matriz' }])),
  http.get(`${base}/catalogos/formas-pago`, () => HttpResponse.json([{ id: 1, valor: 'Efectivo' }])),
  http.get(`${base}/catalogos/condiciones-operacion`, () => HttpResponse.json([{ id: 2, valor: 'Crédito' }, { id: 3, valor: 'Mixto' }])),
  http.get(`${base}/catalogos/vendedores`, () => HttpResponse.json([])),
)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}><ToastProvider><MemoryRouter>{children}</MemoryRouter></ToastProvider></QueryClientProvider>
}

describe('CrearVentaCreditoPage', () => {
  it('monta el formulario de venta a crédito con el plan de cuotas', async () => {
    render(<CrearVentaCreditoPage />, { wrapper })
    await waitFor(() => expect(screen.getByText(/plan de cuotas/i)).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /crear venta a crédito/i })).toBeInTheDocument()
  })
})
```

> NOTA al implementador: confirmar las URLs reales de los catálogos de facturación (`src/features/facturacion/catalogos-api.ts`) y ajustar los handlers del test. Las rutas de arriba son ilustrativas; deben calzar con lo que llaman `useSucursales`, `useCatalogo`, `useVendedores`.

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/features/cuentas-por-cobrar/pages/CrearVentaCreditoPage.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```tsx
// src/features/cuentas-por-cobrar/pages/CrearVentaCreditoPage.tsx
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, FormField, Input, useToast } from '@/design-system'
import { useAuthStore } from '@/app/auth-store'
import { DatosGeneralesSection } from '@/features/facturacion/components/DatosGeneralesSection'
import { CuerpoDocumentoTable } from '@/features/facturacion/components/CuerpoDocumentoTable'
import { TotalesPanel } from '@/features/facturacion/components/TotalesPanel'
import { buildCreateFacturaDto, type FormItem, type FacturaFormValues } from '@/features/facturacion/mappers'
import { getStrategy } from '@/features/facturacion/dte/registry'
import { useCatalogo } from '@/features/facturacion/hooks'
import type { ReceptorListItem } from '@/features/facturacion/types'
import { useCrearVentaCredito } from '../hooks'
import { buildCrearVentaCreditoDto } from '../mappers'
import { CuotasBuilder } from '../components/CuotasBuilder'
import { validarCuotas, construirDefiniciones, type CuotaDraft, type ModoCuota } from '../calc/cuotas'

const TIPO = '01' // Venta a crédito sobre Factura.

function ahora() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return { fecha: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, hora: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` }
}

export function CrearVentaCreditoPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const user = useAuthStore((s) => s.user)
  const crear = useCrearVentaCredito()
  const strategy = getStrategy(TIPO)
  const formas = useCatalogo('formasPago')

  const [sucursalId, setSucursalId] = useState<number>(user?.sucursalIds?.[0] ?? 1)
  const [receptor, setReceptor] = useState<ReceptorListItem | null>(null)
  const [vendedorId, setVendedorId] = useState<number | null>(null)
  const [condicionOperacion, setCondicionOperacion] = useState(2)
  const [items, setItems] = useState<FormItem[]>([])
  const [observaciones, setObservaciones] = useState('')
  const [catFormaPagoId, setCatFormaPagoId] = useState<number>(1)
  const [modo, setModo] = useState<ModoCuota>('monto')
  const [drafts, setDrafts] = useState<CuotaDraft[]>([
    { fechaPactada: '', valor: 0 },
    { fechaPactada: '', valor: 0 },
  ])

  const total = useMemo(() => {
    const calc = items
      .filter((i) => i.cantidad > 0 && i.precioUni >= 0)
      .map((i) => strategy.calcItem({ cantidad: i.cantidad, precioUni: i.precioUni, montoDescuento: i.montoDescuento, tipoImpuesto: i.tipoImpuesto }))
    return strategy.calcResumen(calc, { esAgenteRetencion: false }).totalPagar
  }, [items, strategy])

  const onCrear = async () => {
    if (condicionOperacion !== 2 && condicionOperacion !== 3) {
      toast.show('La condición debe ser Crédito o Mixto', { tone: 'rojo' }); return
    }
    const errCuotas = validarCuotas(drafts, modo, total)
    if (errCuotas) { toast.show(errCuotas, { tone: 'rojo' }); return }

    const values: FacturaFormValues = {
      sucursalId, cajaId: null, esConsumidorFinal: false, receptorId: receptor?.id ?? null,
      vendedorId, condicionOperacion, esAgenteRetencion: false, items,
      pagos: [{ catFormaPagoId, monto: total }], documentoRelacionado: null,
    }
    try {
      const venta = buildCreateFacturaDto(values, ahora(), TIPO)
      const dto = buildCrearVentaCreditoDto(venta, construirDefiniciones(drafts, modo), observaciones)
      const plan = await crear.mutateAsync(dto)
      toast.show('Venta a crédito creada (cuota 1 emitida)')
      navigate(`/cuentas-por-cobrar/${plan.id}`)
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'No se pudo crear la venta a crédito'
      toast.show(msg, { tone: 'rojo' })
    }
  }

  return (
    <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-ink">Nueva venta a crédito</h1>
        <DatosGeneralesSection
          strategy={strategy}
          sucursalId={sucursalId} onSucursalId={setSucursalId}
          cajaId={null} onCajaId={() => {}}
          esConsumidorFinal={false} onEsConsumidorFinal={() => {}}
          receptor={receptor} onReceptor={setReceptor}
          vendedorId={vendedorId} onVendedorId={setVendedorId}
          condicionOperacion={condicionOperacion} onCondicionOperacion={setCondicionOperacion}
          esAgenteRetencion={false} onEsAgenteRetencion={() => {}}
        />
        <CuerpoDocumentoTable items={items} onChange={setItems} sucursalId={sucursalId} descuentaStock={strategy.descuentaStock} />
        <FormField label="Forma de pago de la cuota inicial" htmlFor="cvc-forma">
          <select id="cvc-forma" className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark"
            value={catFormaPagoId} onChange={(e) => setCatFormaPagoId(Number(e.target.value))}>
            {(formas.data ?? []).map((f) => <option key={f.id} value={f.id}>{f.valor}</option>)}
          </select>
        </FormField>
        <CuotasBuilder total={total} drafts={drafts} modo={modo} onDrafts={setDrafts} onModo={setModo} />
        <FormField label="Observaciones (opcional)" htmlFor="cvc-obs">
          <Input id="cvc-obs" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
        </FormField>
        <Button onClick={onCrear} disabled={crear.isPending}>{crear.isPending ? 'Creando…' : 'Crear venta a crédito'}</Button>
      </div>
      <TotalesPanel items={items} tipoDte={TIPO} esAgenteRetencion={false} />
    </div>
  )
}
```

> NOTA al implementador: la forma EXACTA de `Venta` que acepta el backend se valida en el e2e (Task 18). Si el backend rechaza por algún campo del resumen/pagos, ajustar aquí (lección S1–S5: "emitir con la forma exacta del frontend y ajustar"). En particular verificar que `condicionOperacion` llega a `venta.resumen.condicionOperacion` (lo hace `strategy.buildResumenDto`) y que `pagos[0].catFormaPagoId` viaja.

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run src/features/cuentas-por-cobrar/pages/CrearVentaCreditoPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Build + commit**

```bash
npm run build
git add src/features/cuentas-por-cobrar/pages/CrearVentaCreditoPage.*
git commit -m "feat(f5.4-s6): página de creación de venta a crédito"
```

---

### Task 16: `ConfiguracionMoraPage`

**Files:**
- Create: `src/features/cuentas-por-cobrar/pages/ConfiguracionMoraPage.tsx`
- Test: `src/features/cuentas-por-cobrar/pages/ConfiguracionMoraPage.test.tsx`

**Interfaces:**
- Consumes: `useConfiguracionMora`, `useActualizarConfiguracionMora`, `ConfiguracionCuotasDto`.
- Produces: `ConfiguracionMoraPage()`. Carga la config y la edita. Para inicializar el form desde datos cargados SIN `useEffect`+setState, usar el patrón de inner-form con `key` (un componente interno recibe la config como prop inicial y se remonta con `key`).

- [ ] **Step 1: Escribir el test**

```tsx
// src/features/cuentas-por-cobrar/pages/ConfiguracionMoraPage.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { ToastProvider } from '@/design-system'
import { cuentasPorCobrarHandlers } from '@/test/msw/cuentas-por-cobrar-handlers'
import { ConfiguracionMoraPage } from './ConfiguracionMoraPage'

const server = setupServer(...cuentasPorCobrarHandlers)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}><ToastProvider>{children}</ToastProvider></QueryClientProvider>
}

describe('ConfiguracionMoraPage', () => {
  it('carga la config y permite guardar', async () => {
    render(<ConfiguracionMoraPage />, { wrapper })
    await waitFor(() => expect(screen.getByLabelText(/tasa de mora/i)).toHaveValue(2))
    fireEvent.change(screen.getByLabelText(/días de gracia/i), { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    await waitFor(() => expect(screen.getByText(/guardad/i)).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/features/cuentas-por-cobrar/pages/ConfiguracionMoraPage.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```tsx
// src/features/cuentas-por-cobrar/pages/ConfiguracionMoraPage.tsx
import { useState } from 'react'
import { Button, FormField, Input, Spinner, useToast } from '@/design-system'
import { useConfiguracionMora, useActualizarConfiguracionMora } from '../hooks'
import type { ConfiguracionCuotasDto } from '../types'

function MoraForm({ inicial }: { inicial: ConfiguracionCuotasDto }) {
  const actualizar = useActualizarConfiguracionMora()
  const toast = useToast()
  const [cfg, setCfg] = useState<ConfiguracionCuotasDto>(inicial)
  const set = (patch: Partial<ConfiguracionCuotasDto>) => setCfg((c) => ({ ...c, ...patch }))

  const guardar = async () => {
    try { await actualizar.mutateAsync(cfg); toast.show('Configuración guardada') }
    catch { toast.show('No se pudo guardar la configuración', { tone: 'rojo' }) }
  }

  return (
    <div className="max-w-md space-y-3">
      <FormField label="Tasa de mora mensual (%)" htmlFor="cm-tasa">
        <Input id="cm-tasa" type="number" value={cfg.tasaMoraMensual} onChange={(e) => set({ tasaMoraMensual: Number(e.target.value) })} />
      </FormField>
      <FormField label="Días de gracia" htmlFor="cm-gracia">
        <Input id="cm-gracia" type="number" value={cfg.diasGracia} onChange={(e) => set({ diasGracia: Number(e.target.value) })} />
      </FormField>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={cfg.moraHabilitada} onChange={(e) => set({ moraHabilitada: e.target.checked })} />
        Mora habilitada
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={cfg.recordatoriosHabilitados} onChange={(e) => set({ recordatoriosHabilitados: e.target.checked })} />
        Recordatorios habilitados
      </label>
      <FormField label="Días antes para recordatorio" htmlFor="cm-dias-rec">
        <Input id="cm-dias-rec" type="number" value={cfg.diasAntesRecordatorio} onChange={(e) => set({ diasAntesRecordatorio: Number(e.target.value) })} />
      </FormField>
      <Button onClick={guardar} disabled={actualizar.isPending}>{actualizar.isPending ? 'Guardando…' : 'Guardar'}</Button>
    </div>
  )
}

export function ConfiguracionMoraPage() {
  const cfg = useConfiguracionMora()
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold text-ink">Configuración de mora</h1>
      {cfg.isLoading || !cfg.data ? <Spinner /> : <MoraForm key={JSON.stringify(cfg.data)} inicial={cfg.data} />}
    </div>
  )
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run src/features/cuentas-por-cobrar/pages/ConfiguracionMoraPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Build + commit**

```bash
npm run build
git add src/features/cuentas-por-cobrar/pages/ConfiguracionMoraPage.*
git commit -m "feat(f5.4-s6): configuración de mora"
```

---

### Task 17: Cableado de rutas, navegación y sidebar

**Files:**
- Modify: `src/app/router.tsx` (imports + 4 rutas)
- Modify: `src/app/nav-config.ts` (nueva sección)
- Test: `src/app/router.cxc.test.tsx`

**Interfaces:**
- Consumes: las 4 páginas del feature.
- Produces: rutas `/cuentas-por-cobrar`, `/cuentas-por-cobrar/nueva`, `/cuentas-por-cobrar/configuracion-mora`, `/cuentas-por-cobrar/:planId`; sección de navegación "Cuentas por cobrar".

- [ ] **Step 1: Escribir el test de rutas** (seguir el patrón de `src/app/router.dtes.test.tsx` para el setup de render con auth/QueryClient; abajo el esqueleto).

```tsx
// src/app/router.cxc.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { setupServer } from 'msw/node'
import { ToastProvider } from '@/design-system'
import { handlers } from '@/test/msw/handlers'
import { useAuthStore } from '@/app/auth-store'
import { AppRoutes } from './router'

const server = setupServer(...handlers)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderEn(ruta: string) {
  // Sembrar sesión autenticada (replicar lo que hace router.dtes.test.tsx).
  useAuthStore.setState({
    token: 't', user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 2, rolNombre: 'Admin', emisorId: 5, sucursalIds: [1], accesoTodasSucursales: true, permisos: [] },
  } as never)
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}><ToastProvider>
      <MemoryRouter initialEntries={[ruta]}><AppRoutes /></MemoryRouter>
    </ToastProvider></QueryClientProvider>,
  )
}

describe('rutas cuentas por cobrar', () => {
  it('monta el listado en /cuentas-por-cobrar', async () => {
    renderEn('/cuentas-por-cobrar')
    await waitFor(() => expect(screen.getByText('Cuentas por cobrar')).toBeInTheDocument())
  })
  it('monta la configuración de mora', async () => {
    renderEn('/cuentas-por-cobrar/configuracion-mora')
    await waitFor(() => expect(screen.getByText(/configuración de mora/i)).toBeInTheDocument())
  })
})
```

> NOTA al implementador: ABRIR `src/app/router.dtes.test.tsx` y replicar EXACTAMENTE su forma de sembrar la sesión (`useAuthStore`) y de envolver el render. Ajustar el bloque `useAuthStore.setState` arriba a la forma real del store ANTES de correr.

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/app/router.cxc.test.tsx`
Expected: FAIL (rutas no existen).

- [ ] **Step 3: Añadir imports y rutas en `router.tsx`**

Imports al tope (junto a los demás):

```ts
import { PlanesListPage } from '@/features/cuentas-por-cobrar/pages/PlanesListPage'
import { PlanDetallePage } from '@/features/cuentas-por-cobrar/pages/PlanDetallePage'
import { CrearVentaCreditoPage } from '@/features/cuentas-por-cobrar/pages/CrearVentaCreditoPage'
import { ConfiguracionMoraPage } from '@/features/cuentas-por-cobrar/pages/ConfiguracionMoraPage'
```

Rutas dentro de `<Route element={<AppLayout />}>` (antes del `Navigate` a `/dashboard`). ORDEN IMPORTANTE: las rutas estáticas (`/nueva`, `/configuracion-mora`) ANTES de la dinámica `/:planId`.

```tsx
          <Route path="/cuentas-por-cobrar" element={<PlanesListPage />} />
          <Route path="/cuentas-por-cobrar/nueva" element={<CrearVentaCreditoPage />} />
          <Route path="/cuentas-por-cobrar/configuracion-mora" element={<ConfiguracionMoraPage />} />
          <Route path="/cuentas-por-cobrar/:planId" element={<PlanDetallePage />} />
```

- [ ] **Step 4: Añadir la sección de navegación en `nav-config.ts`**

Dentro de `navSections`, después de la sección "Compras":

```ts
  { title: 'Cuentas por cobrar', items: [
    { label: 'Planes', to: '/cuentas-por-cobrar', icon: 'cobros' },
    { label: 'Nueva venta a crédito', to: '/cuentas-por-cobrar/nueva', icon: 'factura' },
    { label: 'Configuración de mora', to: '/cuentas-por-cobrar/configuracion-mora', icon: 'historial' },
  ] },
```

- [ ] **Step 5: Correr el test (+ el de nav-config si aplica) y verificar que pasa**

Run: `npx vitest run src/app/router.cxc.test.tsx src/app/nav-config.test.ts`
Expected: PASS. (Si `nav-config.test.ts` valida nº de secciones/rutas, actualizarlo para incluir la nueva sección.)

- [ ] **Step 6: Build + commit**

```bash
npm run build
git add src/app/router.tsx src/app/nav-config.ts src/app/router.cxc.test.tsx src/app/nav-config.test.ts
git commit -m "feat(f5.4-s6): rutas y navegación de cuentas por cobrar"
```

---

### Task 18: Suite completa, e2e contra Docker y revisión final (CONTROLADOR)

> Esta tarea la ejecuta el controlador (no subagentes), por las lecciones S1–S5.

- [ ] **Step 1: Suite + build + lint completos**

Run:
```bash
npm run test
npm run build
npm run lint
```
Expected: todo verde. Corregir cualquier fallo de tsc/ESLint (recordar la regla `react-hooks/set-state-in-effect` y `import/first`).

- [ ] **Step 2: Levantar Docker y sembrar**

```bash
docker ps   # verificar; si no corre:
# desde FraFactu-Backend:  docker compose up -d
```
Seed e2e: `admin@pruebas.local` / `Pruebas#2026`, emisorId3 (NIT 06140000000001), sucursalId2 (Casa Matriz), bodega1, producto P001=id2 (Bien gravado). Sembrar lo que falte.

- [ ] **Step 3: e2e manual del flujo completo** (navegador contra el frontend apuntando al backend Docker)

1. Crear venta a crédito (condición 2): elegir receptor registrado, agregar ≥1 ítem gravado, definir 2 cuotas que sumen el total, forma de pago de la cuota 1. Verificar que el backend acepta la forma EXACTA del `Venta` (si rechaza, ajustar `CrearVentaCreditoPage` / pagos / resumen).
2. Ver el detalle del plan: cabecera y cuotas; cuota 1 debe quedar Pagada con su código de generación.
3. Pagar la cuota 2: ver mora estimada, confirmar, ver saldo → 0 y estado → Pagado.
4. Crear otro plan y refinanciar su saldo (motivo + nuevas cuotas que cuadren).
5. Configurar la mora (cambiar tasa/días de gracia y guardar).
6. Descargar antigüedad (PDF/Excel) y estado de cuenta del plan (PDF/Excel) — verificar que el archivo baja.

Verificar inventario/persistencia con:
```bash
docker exec frafactu-db psql -U frafactu -d frafactu -c 'SELECT * FROM stock_bodegas;'
```

- [ ] **Step 4: Revisión final whole-branch (opus)**

Revisar TODO el diff de la rama de una sola vez (esta revisión destapa bugs cross-task que las revisiones por-tarea no ven). Corregir y commitear los hallazgos.

- [ ] **Step 5: Actualizar el ledger SDD y la memoria**

Anotar gaps de contrato encontrados en el e2e, minors triados, y dejar el estado para la siguiente sesión.

- [ ] **Step 6: Push + PR por web**

```bash
git push -u origin feat/f5-4-s6-cuentas-por-cobrar
```
Crear el PR por la web hacia `development` (política de git). NO mergear por CLI.

---

## Notas de cierre

- **Deudas que NO se abordan** (heredadas): gating de rol app-wide (se confía en el 403), adapter axios en `cargarJson`, minors del ledger SDD, teardown de `Combobox.test.tsx`.
- **Riesgo principal:** la forma exacta de `Venta` (`CreateFacturaElectronicaDto`) que espera `CrearVentaCreditoAsync`. El test de la página es de humo; el e2e (Task 18) es el que valida el contrato y donde se ajusta si hay gap.
