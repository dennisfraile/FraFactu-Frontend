# F6 — Inventario (frontend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el frontend de inventario (catálogo de productos/servicios + categorías/marcas con activo fijo; stock con ajuste y traslado; movimientos + kardex; reportes como tablas), consumiendo los controllers de inventario ya existentes.

**Architecture:** Nuevo feature `src/features/inventario/` siguiendo el patrón de `compras`/`cuentas-por-cobrar` (api.ts / hooks.ts React Query / types.ts / schemas.ts zod / calc/ / components/ / pages/ + handlers MSW + rutas + nav). Sidebar "Inventario" = 3 entradas (Productos, Stock, Reportes) con pestañas internas (`Tabs` del design-system). Reusa `bodegasApi`/`sucursalesApi`/`useCatalogo` de facturación.

**Tech Stack:** React + TypeScript + Vite, React Router, @tanstack/react-query, axios (`@/lib/http/axios`), design-system propio (`@/design-system`), Vitest + Testing Library + MSW.

## Global Constraints

- `npm run build` debe pasar tras CADA tarea (vitest NO ve errores de `tsc`).
- ESLint prohíbe `react-hooks/set-state-in-effect`: NO `useEffect`+`setState`. Para inicializar formularios desde datos cargados usar **inner-form con `key`** (componente interno que recibe los datos como prop inicial, remontado con `key`). Para polling, `refetchInterval`.
- Imports al tope (`import/first`).
- Rutas del backend tal cual (atributo `[Route("api/[controller]")]`, sin kebab-case salvo donde el backend lo use). El cliente axios (`api`) ya antepone `/api`.
- El `Button` del design-system es un `<button>` plano: NO soporta `as={Link}`. Para CTAs que deban ser links reales usar `<Link>` estilado; para navegación imperativa `useNavigate()`.
- `EmptyState` usa el prop `hint` (NO `description`). `Tabs` API: `<Tabs tabs={[{id,label}]} active={id} onChange={fn} />`.
- Manejo de error: `e.response?.data?.error ?? e.response?.data?.message ?? '<fallback>'` → `toast.show(msg, { tone: 'rojo' })`.
- Cuerpo JSON en camelCase. La app está envuelta en `<ToastProvider>` (main.tsx); los tests de páginas/componentes que usen toast deben envolver el render en `<ToastProvider>`.
- Wrappers de paginado: **productos** usa `PaginatedResponse<T> = { items, totalCount, pageNumber, pageSize, totalPages }`; **reportes** usa `PagedResult<T> = { items, totalItems, pageNumber, pageSize, totalPages }` (estilo compras — confirmar el nombre exacto de los campos del PagedResult del backend al leer un endpoint; usar `items` + total).
- Catálogos (de facturación, `useCatalogo`): `unidadesMedida` → `/api/catalogos/unidades-medida`; `tiposItems` → `/api/catalogos/tipos-items`. Ítems `{ id, valor }`.
- Gating de rol: se confía en el 403 del backend (deuda app-wide conocida). No ocultar por rol.

## Contrato del backend (referencia)

- **Productos `/api/productosservicios`:** `GET /` (query `pageNumber,pageSize,searchTerm?` + `sucursalId? categoriaId? marcaId? unidadMedida? tipo? incluirInactivos`) → `PaginatedResponse<ProductoServicioListDto>`; `GET /search?searchTerm&sucursalId?`; `GET /{id}` → `ProductoServicioDto`; `POST /` ← `CreateProductoServicioDto` → 201; `PUT /{id}` ← `UpdateProductoServicioDto`; `PATCH /{id}/toggle-active`; `POST /{id}/desactivar` ← `{ motivo }`.
- **Categorías `/api/categorias`:** `GET /`, `GET /{id}`, `POST` ← `CrearCategoriaDto { codigo, nombre, descripcion?, categoriaPadreId? }`, `PUT /{id}`, `DELETE /{id}` (solo EmisorAdmin), `PATCH /{id}/toggle-active`. `CategoriaDto { id, codigo, nombre, descripcion?, categoriaPadreId?, categoriaPadreNombre?, totalProductos, activo, fechaCreacion }`.
- **Marcas `/api/marcas`:** igual, `CrearMarcaDto { nombre, descripcion? }`. `MarcaDto { id, nombre, descripcion?, totalProductos, activa, fechaCreacion }`.
- **Bodegas `/api/bodegas/sucursal/{sucursalId}`** → `BodegaItem[]` (ya tipado en facturación).
- **Inventario escritura `/api/inventario`:** `POST /ajustes` ← `AjusteInventarioDto { productoId, bodegaId, cantidad(±), motivo, observaciones(10-1000) }`; `POST /traslado` ← `TrasladoInventarioDto { productoId, bodegaOrigenId, bodegaDestinoId, cantidad, observaciones? }`.
- **Reportes `/api/inventarioreportes`:** `GET /stock` (`bodegaId? productoId? search? page pageSize sucursalId? categoriaId? marcaId?`) → `PagedResult<StockPorBodegaDto>`; `GET /stock/bajo-minimo` → `ProductoBajoMinimoDto[]`; `GET /stock/sin-movimiento` → `ProductoSinMovimientoDto[]`; `GET /movimientos` (`desde hasta` obligatorios + filtros) → `PagedResult<MovimientoInventarioDto>`; `GET /kardex/{productoId}` (`bodegaId? desde? hasta? page pageSize ...`) → `KardexProductoDto`; `GET /valoracion` → `ValoracionInventarioDto`; `GET /cmv`; `GET /rotacion` → `RotacionProductoDto[]`; `GET /rotacion-abc` → `RotacionAbcItemDto[]`; `GET /kpis` → `InventarioKPIsDto`.

Formas de DTOs de reporte (ya leídas): ver `types.ts` en Task 1.

---

### Task 1: Tipos del feature + icono(s) de navegación

**Files:**
- Create: `src/features/inventario/types.ts`
- Modify: `src/design-system/Icon.tsx` (añadir icono `inventario` si no existe uno apropiado; ya existen `productos` y `stock`)
- Test: `src/features/inventario/types.test.ts`

**Interfaces:**
- Produces: tipos `ProductoListItem`, `ProductoDetalle`, `CrearProductoDto`, `ActualizarProductoDto`, `DesactivarProductoDto`, `ProductoTributo`, `Categoria`, `CrearCategoriaDto`, `Marca`, `CrearMarcaDto`, `AjusteInventarioDto`, `TrasladoInventarioDto`, `StockPorBodega`, `ProductoBajoMinimo`, `ProductoSinMovimiento`, `MovimientoInventario`, `KardexProducto`, `ValoracionInventario`, `ValoracionPorProducto`, `RotacionProducto`, `RotacionAbcItem`, `InventarioKPIs`, `PagedResult<T>`. Constante `MOTIVOS_AJUSTE` y `TIPO_INVENTARIO`.

- [ ] **Step 1: Escribir el test**

```ts
// src/features/inventario/types.test.ts
import { describe, it, expect } from 'vitest'
import type { ProductoDetalle, CrearProductoDto, StockPorBodega, KardexProducto } from './types'
import { MOTIVOS_AJUSTE, TIPO_INVENTARIO } from './types'

describe('tipos inventario', () => {
  it('CrearProductoDto admite la forma del backend', () => {
    const dto: CrearProductoDto = {
      codigo: 'P002', nombre: 'Tornillo', precioVenta: 1.5, catUnidadMedidaId: 39,
      catTipoItemId: 1, tipoImpuesto: 1, precioIncluyeIva: false, costoIncluyeIva: false,
      tipoInventario: 0, accesoTodasSucursales: true,
    }
    expect(dto.codigo).toBe('P002')
  })
  it('StockPorBodega y KardexProducto compilan', () => {
    const s: StockPorBodega = {
      productoId: 1, productoCodigo: 'P001', productoNombre: 'X', bodegaId: 1, bodegaNombre: 'B',
      sucursalNombre: 'S', cantidadDisponible: 5, cantidadReservada: 0, cantidadTotal: 5,
      costoPromedio: 10, valorStock: 50, fechaUltimoMovimiento: null, stockMinimo: 1, stockMaximo: 100,
    }
    const k: Pick<KardexProducto, 'saldoFinal'> = { saldoFinal: 5 }
    expect(s.cantidadTotal + k.saldoFinal).toBe(10)
  })
  it('catálogos de UI', () => {
    expect(MOTIVOS_AJUSTE).toContain('MERMA')
    expect(TIPO_INVENTARIO.MOBILIARIO_EQUIPO).toBe(1)
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/features/inventario/types.test.ts`
Expected: FAIL (no existe `./types`).

- [ ] **Step 3: Crear los tipos**

```ts
// src/features/inventario/types.ts
export interface PagedResult<T> {
  items: T[]
  totalItems: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

export const TIPO_INVENTARIO = { VENTAS: 0, MOBILIARIO_EQUIPO: 1, INSUMOS: 2 } as const
export const TIPO_IMPUESTO = { GRAVADO: 1, EXENTO: 2, NO_SUJETO: 3 } as const
export const MOTIVOS_AJUSTE = ['CORRECCION', 'MERMA', 'FALTANTE', 'SOBRANTE', 'DAÑADO', 'OTRO'] as const

export interface ProductoTributo {
  codigo: string
  tipoCalculo?: string | null
  valor?: number | null
}

export interface SucursalAsignada { sucursalId: number; sucursalNombre?: string }

export interface ProductoListItem {
  id: number
  codigo: string
  nombre: string
  descripcion?: string | null
  precioVenta: number
  precioCosto?: number | null
  activo: boolean
  unidadMedida: string
  tipoItem: string
  categoriaId?: number | null
  categoriaNombre?: string | null
  marcaId?: number | null
  marcaNombre?: string | null
  tipoImpuesto: number
  porcentajeIVA?: number | null
  precioIncluyeIva: boolean
  costoIncluyeIva: boolean
  codigoBarras?: string | null
  stockMinimo?: number | null
  stockMaximo?: number | null
  puntoReorden?: number | null
  permiteVentaSinStock?: boolean | null
  fechaCreacion: string
  accesoTodasSucursales: boolean
  tipoInventario: number
  fechaAdquisicion?: string | null
  aniosVidaUtil?: number | null
  valorActual?: number | null
  valorResidual?: number | null
  tributosAdicionales: ProductoTributo[]
}

export interface ProductoDetalle {
  id: number
  codigo: string
  nombre: string
  descripcion?: string | null
  precioVenta: number
  activo: boolean
  fechaCreacion: string
  unidadMedida: { id: number; valor: string }
  tipoItem: { id: number; valor: string }
  emisorId: number
  codigoBarras?: string | null
  categoriaId?: number | null
  categoriaNombre?: string | null
  marcaId?: number | null
  marcaNombre?: string | null
  precioCosto?: number | null
  accesoTodasSucursales: boolean
  sucursales: SucursalAsignada[]
  tipoImpuesto: number
  porcentajeIVA?: number | null
  precioIncluyeIva: boolean
  costoIncluyeIva: boolean
  stockMinimo?: number | null
  stockMaximo?: number | null
  puntoReorden?: number | null
  permiteVentaSinStock?: boolean | null
  tipoInventario: number
  fechaAdquisicion?: string | null
  aniosVidaUtil?: number | null
  valorActual?: number | null
  valorResidual?: number | null
  tributosAdicionales: ProductoTributo[]
}

export interface CrearProductoDto {
  codigo: string
  nombre: string
  descripcion?: string | null
  precioVenta: number
  catUnidadMedidaId: number
  catTipoItemId: number
  codigoBarras?: string | null
  categoriaId?: number | null
  marcaId?: number | null
  precioCosto?: number | null
  tipoImpuesto: number
  porcentajeIVA?: number | null
  precioIncluyeIva: boolean
  costoIncluyeIva: boolean
  stockMinimo?: number | null
  stockMaximo?: number | null
  puntoReorden?: number | null
  permiteVentaSinStock?: boolean | null
  tipoInventario: number
  fechaAdquisicion?: string | null
  aniosVidaUtil?: number | null
  valorActual?: number | null
  valorResidual?: number | null
  accesoTodasSucursales: boolean
  sucursalIds?: number[] | null
  tributosAdicionales?: ProductoTributo[] | null
}

export type ActualizarProductoDto = CrearProductoDto
export interface DesactivarProductoDto { motivo: string }

export interface Categoria {
  id: number
  codigo: string
  nombre: string
  descripcion?: string | null
  categoriaPadreId?: number | null
  categoriaPadreNombre?: string | null
  totalProductos: number
  activo: boolean
  fechaCreacion: string
}
export interface CrearCategoriaDto { codigo: string; nombre: string; descripcion?: string | null; categoriaPadreId?: number | null }

export interface Marca {
  id: number
  nombre: string
  descripcion?: string | null
  totalProductos: number
  activa: boolean
  fechaCreacion: string
}
export interface CrearMarcaDto { nombre: string; descripcion?: string | null }

export interface AjusteInventarioDto {
  productoId: number
  bodegaId: number
  cantidad: number
  motivo: string
  observaciones: string
}
export interface TrasladoInventarioDto {
  productoId: number
  bodegaOrigenId: number
  bodegaDestinoId: number
  cantidad: number
  observaciones?: string | null
}

export interface StockPorBodega {
  productoId: number
  productoCodigo: string
  productoNombre: string
  bodegaId: number
  bodegaNombre: string
  sucursalNombre: string
  cantidadDisponible: number
  cantidadReservada: number
  cantidadTotal: number
  costoPromedio: number
  valorStock: number
  fechaUltimoMovimiento?: string | null
  stockMinimo?: number | null
  stockMaximo?: number | null
}
export interface ProductoBajoMinimo {
  productoId: number; productoCodigo: string; productoNombre: string
  stockMinimo: number; stockActual: number; diferencia: number; estado: string
}
export interface ProductoSinMovimiento {
  productoId: number; productoCodigo: string; productoNombre: string
  stockActual: number; valorStock: number; diasSinMovimiento: number; ultimoMovimiento?: string | null
}
export interface MovimientoInventario {
  id: number; fechaMovimiento: string; tipoMovimiento: string; tipoDocumento: string
  numeroDocumento?: string | null; documentoId?: number | null
  productoId: number; productoCodigo: string; productoNombre: string
  bodegaId: number; bodegaNombre: string
  cantidad: number; costoUnitario: number; saldoAnterior: number; nuevoSaldo: number
  observaciones?: string | null; usuarioId?: number | null; usuarioNombre?: string | null
}
export interface KardexProducto {
  productoId: number; productoCodigo: string; productoNombre: string
  bodegaId?: number | null; bodegaNombre?: string | null
  fechaDesde: string; fechaHasta: string
  saldoInicial: number; totalEntradas: number; totalSalidas: number; saldoFinal: number
  movimientos: PagedResult<MovimientoInventario>
}
export interface ValoracionPorProducto {
  productoId: number; productoCodigo: string; productoNombre: string
  cantidad: number; costoPromedio: number; valorTotal: number; porcentajeDelTotal: number
}
export interface ValoracionInventario {
  bodegaId?: number | null; bodegaNombre?: string | null
  totalProductos: number; cantidadTotalUnidades: number; valorTotal: number
  detalleProductos: ValoracionPorProducto[]
}
export interface RotacionProducto {
  productoId: number; productoCodigo: string; productoNombre: string
  cantidadVendida: number; promedioStock: number; indiceRotacion: number
  diasPromediInventario: number; clasificacion: string
}
export interface RotacionAbcItem {
  productoId: number; productoCodigo: string; productoNombre: string
  unidadesVendidas: number; valorVendido: number; porcentajeAcumulado: number; clasificacion: string
}
export interface InventarioKPIs {
  totalProductos: number; valorTotalInventario: number; productosBajoMinimo: number; productosSinStock: number
  totalMovimientosUltimoMes: number; totalEntradasUltimoMes: number; totalSalidasUltimoMes: number
  costoMercanciaVendidaMesActual: number; valorComprasMesActual: number
  rotacionPromedioAnual: number; diasPromedioInventario: number
}
```

- [ ] **Step 4: Confirmar iconos de nav**

Abrir `src/design-system/Icon.tsx`. Ya existen `productos` y `stock` (usados por la nav actual). Para "Reportes" reusar `historial` (reloj) o añadir uno. Si añades, sigue el patrón SVG existente (trazo en `currentColor`, viewBox 24). Esta tarea NO modifica Icon si `productos`/`stock`/`historial` bastan — en ese caso omite el cambio y nótalo en el reporte.

- [ ] **Step 5: Correr el test y verificar que pasa**

Run: `npx vitest run src/features/inventario/types.test.ts`
Expected: PASS.

- [ ] **Step 6: Build + commit**

```bash
npm run build
git add src/features/inventario/types.ts src/features/inventario/types.test.ts src/design-system/Icon.tsx
git commit -m "feat(f6): tipos de inventario"
```

---

### Task 2: Cliente API (`api.ts`)

**Files:**
- Create: `src/features/inventario/api.ts`
- Test: `src/features/inventario/api.test.ts`

**Interfaces:**
- Consumes: tipos de `./types`; `api` de `@/lib/http/axios`.
- Produces: objetos `productosApi`, `categoriasApi`, `marcasApi`, `inventarioApi`, `reportesApi` con métodos tipados (ver implementación).

- [ ] **Step 1: Escribir el test (MSW inline)**

```ts
// src/features/inventario/api.test.ts
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { productosApi, categoriasApi, inventarioApi, reportesApi } from './api'

const base = 'http://localhost:8080/api'
const prod = { id: 1, codigo: 'P001', nombre: 'X', precioVenta: 10, activo: true, unidadMedida: 'Unidad', tipoItem: 'Bienes', tipoImpuesto: 1, precioIncluyeIva: true, costoIncluyeIva: false, fechaCreacion: '2026-06-01', accesoTodasSucursales: true, tipoInventario: 0, tributosAdicionales: [] }
const server = setupServer(
  http.get(`${base}/productosservicios`, ({ request }) => {
    const u = new URL(request.url)
    expect(u.searchParams.get('pageNumber')).toBe('1')
    return HttpResponse.json({ items: [prod], totalCount: 1, pageNumber: 1, pageSize: 20, totalPages: 1 })
  }),
  http.post(`${base}/productosservicios`, () => HttpResponse.json({ ...prod }, { status: 201 })),
  http.get(`${base}/categorias`, () => HttpResponse.json([{ id: 1, codigo: 'C1', nombre: 'Cat', totalProductos: 0, activo: true, fechaCreacion: '2026-06-01' }])),
  http.post(`${base}/inventario/ajustes`, () => HttpResponse.json({ ok: true })),
  http.get(`${base}/inventarioreportes/kpis`, () => HttpResponse.json({ totalProductos: 3 })),
)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())

describe('inventario api', () => {
  it('productos listar manda paginado', async () => {
    const r = await productosApi.listar({ pageNumber: 1, pageSize: 20 })
    expect(r.items[0].codigo).toBe('P001')
  })
  it('productos crear', async () => {
    const r = await productosApi.crear({ codigo: 'P002', nombre: 'Y', precioVenta: 1, catUnidadMedidaId: 39, catTipoItemId: 1, tipoImpuesto: 1, precioIncluyeIva: false, costoIncluyeIva: false, tipoInventario: 0, accesoTodasSucursales: true })
    expect(r.id).toBe(1)
  })
  it('categorias listar', async () => { expect((await categoriasApi.listar()).length).toBe(1) })
  it('ajuste', async () => { await expect(inventarioApi.ajustar({ productoId: 1, bodegaId: 1, cantidad: -2, motivo: 'MERMA', observaciones: 'rotura en bodega' })).resolves.toBeTruthy() })
  it('kpis', async () => { expect((await reportesApi.kpis()).totalProductos).toBe(3) })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/features/inventario/api.test.ts`
Expected: FAIL (no existe `./api`).

- [ ] **Step 3: Implementar**

```ts
// src/features/inventario/api.ts
import { api } from '@/lib/http/axios'
import type {
  PaginatedResponseLike, ProductoListItem, ProductoDetalle, CrearProductoDto, ActualizarProductoDto,
  DesactivarProductoDto, Categoria, CrearCategoriaDto, Marca, CrearMarcaDto, AjusteInventarioDto,
  TrasladoInventarioDto, PagedResult, StockPorBodega, ProductoBajoMinimo, ProductoSinMovimiento,
  MovimientoInventario, KardexProducto, ValoracionInventario, RotacionProducto, RotacionAbcItem, InventarioKPIs,
} from './types'

// PaginatedResponse de productos (estilo F2)
export interface PaginatedResponse<T> { items: T[]; totalCount: number; pageNumber: number; pageSize: number; totalPages: number }

export interface ListarProductosParams {
  pageNumber: number
  pageSize: number
  searchTerm?: string
  sucursalId?: number
  categoriaId?: number
  marcaId?: number
  tipo?: string
  incluirInactivos?: boolean
}

export const productosApi = {
  async listar(params: ListarProductosParams): Promise<PaginatedResponse<ProductoListItem>> {
    const { data } = await api.get<PaginatedResponse<ProductoListItem>>('/productosservicios', { params })
    return data
  },
  async getById(id: number): Promise<ProductoDetalle> {
    const { data } = await api.get<ProductoDetalle>(`/productosservicios/${id}`)
    return data
  },
  async crear(dto: CrearProductoDto): Promise<ProductoDetalle> {
    const { data } = await api.post<ProductoDetalle>('/productosservicios', dto)
    return data
  },
  async actualizar(id: number, dto: ActualizarProductoDto): Promise<ProductoDetalle> {
    const { data } = await api.put<ProductoDetalle>(`/productosservicios/${id}`, dto)
    return data
  },
  async toggleActivo(id: number): Promise<void> { await api.patch(`/productosservicios/${id}/toggle-active`) },
  async desactivar(id: number, dto: DesactivarProductoDto): Promise<void> { await api.post(`/productosservicios/${id}/desactivar`, dto) },
}

export const categoriasApi = {
  async listar(): Promise<Categoria[]> { const { data } = await api.get<Categoria[]>('/categorias'); return data },
  async crear(dto: CrearCategoriaDto): Promise<Categoria> { const { data } = await api.post<Categoria>('/categorias', dto); return data },
  async actualizar(id: number, dto: CrearCategoriaDto): Promise<Categoria> { const { data } = await api.put<Categoria>(`/categorias/${id}`, dto); return data },
  async toggleActivo(id: number): Promise<void> { await api.patch(`/categorias/${id}/toggle-active`) },
  async eliminar(id: number): Promise<void> { await api.delete(`/categorias/${id}`) },
}

export const marcasApi = {
  async listar(): Promise<Marca[]> { const { data } = await api.get<Marca[]>('/marcas'); return data },
  async crear(dto: CrearMarcaDto): Promise<Marca> { const { data } = await api.post<Marca>('/marcas', dto); return data },
  async actualizar(id: number, dto: CrearMarcaDto): Promise<Marca> { const { data } = await api.put<Marca>(`/marcas/${id}`, dto); return data },
  async toggleActivo(id: number): Promise<void> { await api.patch(`/marcas/${id}/toggle-active`) },
  async eliminar(id: number): Promise<void> { await api.delete(`/marcas/${id}`) },
}

export const inventarioApi = {
  async ajustar(dto: AjusteInventarioDto): Promise<unknown> { const { data } = await api.post('/inventario/ajustes', dto); return data ?? true },
  async trasladar(dto: TrasladoInventarioDto): Promise<unknown> { const { data } = await api.post('/inventario/traslado', dto); return data ?? true },
}

export interface ListarStockParams { bodegaId?: number; productoId?: number; search?: string; page?: number; pageSize?: number; sucursalId?: number; categoriaId?: number; marcaId?: number }
export interface ListarMovimientosParams { desde: string; hasta: string; productoId?: number; bodegaId?: number; tipoMovimiento?: string; search?: string; page?: number; pageSize?: number; sucursalId?: number; ocultarAnulaciones?: boolean }

export const reportesApi = {
  async stock(params: ListarStockParams): Promise<PagedResult<StockPorBodega>> { const { data } = await api.get<PagedResult<StockPorBodega>>('/inventarioreportes/stock', { params }); return data },
  async bajoMinimo(sucursalId?: number): Promise<ProductoBajoMinimo[]> { const { data } = await api.get<ProductoBajoMinimo[]>('/inventarioreportes/stock/bajo-minimo', { params: { sucursalId } }); return data },
  async sinMovimiento(sucursalId?: number): Promise<ProductoSinMovimiento[]> { const { data } = await api.get<ProductoSinMovimiento[]>('/inventarioreportes/stock/sin-movimiento', { params: { sucursalId } }); return data },
  async movimientos(params: ListarMovimientosParams): Promise<PagedResult<MovimientoInventario>> { const { data } = await api.get<PagedResult<MovimientoInventario>>('/inventarioreportes/movimientos', { params }); return data },
  async kardex(productoId: number, params: { bodegaId?: number; desde?: string; hasta?: string; page?: number; pageSize?: number; sucursalId?: number }): Promise<KardexProducto> { const { data } = await api.get<KardexProducto>(`/inventarioreportes/kardex/${productoId}`, { params }); return data },
  async valoracion(bodegaId?: number, sucursalId?: number): Promise<ValoracionInventario> { const { data } = await api.get<ValoracionInventario>('/inventarioreportes/valoracion', { params: { bodegaId, sucursalId } }); return data },
  async rotacion(sucursalId?: number): Promise<RotacionProducto[]> { const { data } = await api.get<RotacionProducto[]>('/inventarioreportes/rotacion', { params: { sucursalId } }); return data },
  async rotacionAbc(sucursalId?: number): Promise<RotacionAbcItem[]> { const { data } = await api.get<RotacionAbcItem[]>('/inventarioreportes/rotacion-abc', { params: { sucursalId } }); return data },
  async kpis(sucursalId?: number): Promise<InventarioKPIs> { const { data } = await api.get<InventarioKPIs>('/inventarioreportes/kpis', { params: { sucursalId } }); return data },
}
```

> NOTA al implementador: el import de `PaginatedResponseLike` arriba es un error de borrador — NO lo importes; `PaginatedResponse` se define en este archivo. Importa solo los tipos que realmente uses de `./types`. Ajusta la lista de imports a lo necesario y que `tsc` quede limpio. Confirma la forma real de `PagedResult` del backend (`items` + total) leyendo `FraFactu.Application/Common/PagedResult.cs` si el test de stock falla por nombres de campo.

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run src/features/inventario/api.test.ts`
Expected: PASS.

- [ ] **Step 5: Build + commit**

```bash
npm run build
git add src/features/inventario/api.ts src/features/inventario/api.test.ts
git commit -m "feat(f6): cliente API de inventario"
```

---

### Task 3: Cálculo de precios + schemas zod

**Files:**
- Create: `src/features/inventario/calc/precio.ts`, `src/features/inventario/schemas.ts`
- Test: `src/features/inventario/calc/precio.test.ts`, `src/features/inventario/schemas.test.ts`

**Interfaces:**
- Produces: `precioConIva(neto, pct)`, `precioSinIva(conIva, pct)` (calc/precio.ts); `productoSchema`, `categoriaSchema`, `marcaSchema`, `ajusteSchema`, `trasladoSchema` (schemas.ts, zod) con sus tipos inferidos.

- [ ] **Step 1: Escribir el test (calc + schemas)**

```ts
// src/features/inventario/calc/precio.test.ts
import { describe, it, expect } from 'vitest'
import { precioConIva, precioSinIva } from './precio'

describe('precio IVA', () => {
  it('agrega IVA', () => { expect(precioConIva(100, 13)).toBe(113) })
  it('extrae IVA', () => { expect(precioSinIva(113, 13)).toBe(100) })
  it('redondea a 2', () => { expect(precioConIva(9.99, 13)).toBe(11.29) })
})
```

```ts
// src/features/inventario/schemas.test.ts
import { describe, it, expect } from 'vitest'
import { productoSchema, ajusteSchema } from './schemas'

describe('productoSchema', () => {
  it('exige código y nombre y precio >= 0', () => {
    const bad = productoSchema.safeParse({ codigo: '', nombre: '', precioVenta: -1, catUnidadMedidaId: 0, catTipoItemId: 0, tipoImpuesto: 1, precioIncluyeIva: false, costoIncluyeIva: false, tipoInventario: 0, accesoTodasSucursales: true })
    expect(bad.success).toBe(false)
  })
  it('acepta un producto válido', () => {
    const ok = productoSchema.safeParse({ codigo: 'P002', nombre: 'Tornillo', precioVenta: 1.5, catUnidadMedidaId: 39, catTipoItemId: 1, tipoImpuesto: 1, precioIncluyeIva: false, costoIncluyeIva: false, tipoInventario: 0, accesoTodasSucursales: true })
    expect(ok.success).toBe(true)
  })
})

describe('ajusteSchema', () => {
  it('observaciones >= 10 chars', () => {
    expect(ajusteSchema.safeParse({ productoId: 1, bodegaId: 1, cantidad: -2, motivo: 'MERMA', observaciones: 'corto' }).success).toBe(false)
    expect(ajusteSchema.safeParse({ productoId: 1, bodegaId: 1, cantidad: -2, motivo: 'MERMA', observaciones: 'rotura en bodega' }).success).toBe(true)
  })
})
```

- [ ] **Step 2: Correr y verificar que fallan**

Run: `npx vitest run src/features/inventario/calc/precio.test.ts src/features/inventario/schemas.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```ts
// src/features/inventario/calc/precio.ts
const r2 = (n: number) => Math.round(n * 100) / 100
export function precioConIva(neto: number, pct: number): number { return r2(neto * (1 + pct / 100)) }
export function precioSinIva(conIva: number, pct: number): number { return r2(conIva / (1 + pct / 100)) }
```

```ts
// src/features/inventario/schemas.ts
import { z } from 'zod'
import { MOTIVOS_AJUSTE } from './types'

export const productoSchema = z.object({
  codigo: z.string().min(1, 'El código es obligatorio'),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  descripcion: z.string().optional().nullable(),
  precioVenta: z.number().min(0, 'El precio no puede ser negativo'),
  catUnidadMedidaId: z.number().int().positive('Seleccione la unidad de medida'),
  catTipoItemId: z.number().int().positive('Seleccione el tipo de ítem'),
  codigoBarras: z.string().optional().nullable(),
  categoriaId: z.number().int().positive().optional().nullable(),
  marcaId: z.number().int().positive().optional().nullable(),
  precioCosto: z.number().min(0).optional().nullable(),
  tipoImpuesto: z.number().int(),
  porcentajeIVA: z.number().min(0).optional().nullable(),
  precioIncluyeIva: z.boolean(),
  costoIncluyeIva: z.boolean(),
  stockMinimo: z.number().min(0).optional().nullable(),
  stockMaximo: z.number().min(0).optional().nullable(),
  puntoReorden: z.number().min(0).optional().nullable(),
  permiteVentaSinStock: z.boolean().optional().nullable(),
  tipoInventario: z.number().int(),
  fechaAdquisicion: z.string().optional().nullable(),
  aniosVidaUtil: z.number().int().min(0).optional().nullable(),
  valorActual: z.number().min(0).optional().nullable(),
  valorResidual: z.number().min(0).optional().nullable(),
  accesoTodasSucursales: z.boolean(),
  sucursalIds: z.array(z.number().int()).optional().nullable(),
})

export const categoriaSchema = z.object({
  codigo: z.string().min(1, 'El código es obligatorio'),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  descripcion: z.string().optional().nullable(),
  categoriaPadreId: z.number().int().positive().optional().nullable(),
})

export const marcaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  descripcion: z.string().optional().nullable(),
})

export const ajusteSchema = z.object({
  productoId: z.number().int().positive('Seleccione un producto'),
  bodegaId: z.number().int().positive('Seleccione una bodega'),
  cantidad: z.number().refine((n) => n !== 0, 'La cantidad no puede ser 0'),
  motivo: z.enum(MOTIVOS_AJUSTE),
  observaciones: z.string().min(10, 'Las observaciones deben tener al menos 10 caracteres').max(1000),
})

export const trasladoSchema = z.object({
  productoId: z.number().int().positive('Seleccione un producto'),
  bodegaOrigenId: z.number().int().positive('Seleccione la bodega origen'),
  bodegaDestinoId: z.number().int().positive('Seleccione la bodega destino'),
  cantidad: z.number().positive('La cantidad debe ser mayor a 0'),
  observaciones: z.string().optional().nullable(),
}).refine((v) => v.bodegaOrigenId !== v.bodegaDestinoId, { message: 'Origen y destino deben ser distintos', path: ['bodegaDestinoId'] })
```

> NOTA: confirma la versión de zod del repo (F5.2 usó zod v4: `z.enum(arrayConst)` funciona con `as const`). Si `z.enum(MOTIVOS_AJUSTE)` se queja del tipo readonly, usa `z.enum([...MOTIVOS_AJUSTE] as [string, ...string[]])`.

- [ ] **Step 4: Correr y verificar que pasan**

Run: `npx vitest run src/features/inventario/calc/precio.test.ts src/features/inventario/schemas.test.ts`
Expected: PASS.

- [ ] **Step 5: Build + commit**

```bash
npm run build
git add src/features/inventario/calc/ src/features/inventario/schemas.ts src/features/inventario/schemas.test.ts
git commit -m "feat(f6): cálculo de precios + schemas zod de inventario"
```

---

### Task 4: Hooks React Query (`hooks.ts`)

**Files:**
- Create: `src/features/inventario/hooks.ts`
- Test: `src/features/inventario/hooks.test.tsx`

**Interfaces:**
- Consumes: las apis de `./api`, tipos de `./types`.
- Produces: `useProductos(params)`, `useProducto(id)`, `useCrearProducto()`, `useActualizarProducto()`, `useToggleProducto()`, `useDesactivarProducto()`, `useCategorias()`, `useCrearCategoria()`, `useActualizarCategoria()`, `useToggleCategoria()`, `useEliminarCategoria()`, `useMarcas()` + mutaciones análogas, `useAjustarStock()`, `useTrasladarStock()`, `useStock(params)`, `useBajoMinimo()`, `useSinMovimiento()`, `useMovimientos(params)`, `useKardex(productoId, params)`, `useValoracion()`, `useRotacion()`, `useRotacionAbc()`, `useKpis()`. Query keys: `['inv-productos', params]`, `['inv-producto', id]`, `['inv-categorias']`, `['inv-marcas']`, `['inv-stock', params]`, `['inv-bajo-minimo']`, `['inv-sin-movimiento']`, `['inv-movimientos', params]`, `['inv-kardex', id, params]`, `['inv-valoracion', ...]`, `['inv-rotacion']`, `['inv-rotacion-abc']`, `['inv-kpis']`.

- [ ] **Step 1: Escribir el test**

```tsx
// src/features/inventario/hooks.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { useProductos, useCategorias, useAjustarStock } from './hooks'

const base = 'http://localhost:8080/api'
const server = setupServer(
  http.get(`${base}/productosservicios`, () => HttpResponse.json({ items: [{ id: 1, codigo: 'P001', nombre: 'X', precioVenta: 1, activo: true, unidadMedida: 'Unidad', tipoItem: 'Bienes', tipoImpuesto: 1, precioIncluyeIva: true, costoIncluyeIva: false, fechaCreacion: 'x', accesoTodasSucursales: true, tipoInventario: 0, tributosAdicionales: [] }], totalCount: 1, pageNumber: 1, pageSize: 20, totalPages: 1 })),
  http.get(`${base}/categorias`, () => HttpResponse.json([])),
  http.post(`${base}/inventario/ajustes`, () => HttpResponse.json({ ok: true })),
)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('hooks inventario', () => {
  it('useProductos lista', async () => {
    const { result } = renderHook(() => useProductos({ pageNumber: 1, pageSize: 20 }), { wrapper })
    await waitFor(() => expect(result.current.data?.items[0].codigo).toBe('P001'))
  })
  it('useCategorias', async () => {
    const { result } = renderHook(() => useCategorias(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
  it('useAjustarStock muta', async () => {
    const { result } = renderHook(() => useAjustarStock(), { wrapper })
    await result.current.mutateAsync({ productoId: 1, bodegaId: 1, cantidad: -1, motivo: 'MERMA', observaciones: 'rotura en bodega' })
    expect(result.current.isSuccess).toBe(true)
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/features/inventario/hooks.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```ts
// src/features/inventario/hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productosApi, categoriasApi, marcasApi, inventarioApi, reportesApi, type ListarProductosParams, type ListarStockParams, type ListarMovimientosParams } from './api'
import type { CrearProductoDto, ActualizarProductoDto, DesactivarProductoDto, CrearCategoriaDto, CrearMarcaDto, AjusteInventarioDto, TrasladoInventarioDto } from './types'

const HORA = 1000 * 60 * 60

export function useProductos(params: ListarProductosParams) {
  return useQuery({ queryKey: ['inv-productos', params], queryFn: () => productosApi.listar(params) })
}
export function useProducto(id: number) {
  return useQuery({ queryKey: ['inv-producto', id], queryFn: () => productosApi.getById(id), enabled: Number.isFinite(id) })
}
export function useCrearProducto() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (dto: CrearProductoDto) => productosApi.crear(dto), onSuccess: () => qc.invalidateQueries({ queryKey: ['inv-productos'] }) })
}
export function useActualizarProducto() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, dto }: { id: number; dto: ActualizarProductoDto }) => productosApi.actualizar(id, dto), onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ['inv-productos'] }); qc.invalidateQueries({ queryKey: ['inv-producto', v.id] }) } })
}
export function useToggleProducto() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: number) => productosApi.toggleActivo(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['inv-productos'] }) })
}
export function useDesactivarProducto() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, dto }: { id: number; dto: DesactivarProductoDto }) => productosApi.desactivar(id, dto), onSuccess: () => qc.invalidateQueries({ queryKey: ['inv-productos'] }) })
}

export function useCategorias() { return useQuery({ queryKey: ['inv-categorias'], queryFn: () => categoriasApi.listar(), staleTime: HORA }) }
export function useCrearCategoria() { const qc = useQueryClient(); return useMutation({ mutationFn: (dto: CrearCategoriaDto) => categoriasApi.crear(dto), onSuccess: () => qc.invalidateQueries({ queryKey: ['inv-categorias'] }) }) }
export function useActualizarCategoria() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, dto }: { id: number; dto: CrearCategoriaDto }) => categoriasApi.actualizar(id, dto), onSuccess: () => qc.invalidateQueries({ queryKey: ['inv-categorias'] }) }) }
export function useToggleCategoria() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: number) => categoriasApi.toggleActivo(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['inv-categorias'] }) }) }
export function useEliminarCategoria() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: number) => categoriasApi.eliminar(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['inv-categorias'] }) }) }

export function useMarcas() { return useQuery({ queryKey: ['inv-marcas'], queryFn: () => marcasApi.listar(), staleTime: HORA }) }
export function useCrearMarca() { const qc = useQueryClient(); return useMutation({ mutationFn: (dto: CrearMarcaDto) => marcasApi.crear(dto), onSuccess: () => qc.invalidateQueries({ queryKey: ['inv-marcas'] }) }) }
export function useActualizarMarca() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, dto }: { id: number; dto: CrearMarcaDto }) => marcasApi.actualizar(id, dto), onSuccess: () => qc.invalidateQueries({ queryKey: ['inv-marcas'] }) }) }
export function useToggleMarca() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: number) => marcasApi.toggleActivo(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['inv-marcas'] }) }) }
export function useEliminarMarca() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: number) => marcasApi.eliminar(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['inv-marcas'] }) }) }

export function useAjustarStock() { const qc = useQueryClient(); return useMutation({ mutationFn: (dto: AjusteInventarioDto) => inventarioApi.ajustar(dto), onSuccess: () => { qc.invalidateQueries({ queryKey: ['inv-stock'] }); qc.invalidateQueries({ queryKey: ['inv-movimientos'] }) } }) }
export function useTrasladarStock() { const qc = useQueryClient(); return useMutation({ mutationFn: (dto: TrasladoInventarioDto) => inventarioApi.trasladar(dto), onSuccess: () => { qc.invalidateQueries({ queryKey: ['inv-stock'] }); qc.invalidateQueries({ queryKey: ['inv-movimientos'] }) } }) }

export function useStock(params: ListarStockParams) { return useQuery({ queryKey: ['inv-stock', params], queryFn: () => reportesApi.stock(params) }) }
export function useBajoMinimo(sucursalId?: number) { return useQuery({ queryKey: ['inv-bajo-minimo', sucursalId], queryFn: () => reportesApi.bajoMinimo(sucursalId) }) }
export function useSinMovimiento(sucursalId?: number) { return useQuery({ queryKey: ['inv-sin-movimiento', sucursalId], queryFn: () => reportesApi.sinMovimiento(sucursalId) }) }
export function useMovimientos(params: ListarMovimientosParams) { return useQuery({ queryKey: ['inv-movimientos', params], queryFn: () => reportesApi.movimientos(params) }) }
export function useKardex(productoId: number, params: { bodegaId?: number; desde?: string; hasta?: string; page?: number; pageSize?: number }) { return useQuery({ queryKey: ['inv-kardex', productoId, params], queryFn: () => reportesApi.kardex(productoId, params), enabled: Number.isFinite(productoId) && productoId > 0 }) }
export function useValoracion(bodegaId?: number) { return useQuery({ queryKey: ['inv-valoracion', bodegaId], queryFn: () => reportesApi.valoracion(bodegaId) }) }
export function useRotacion() { return useQuery({ queryKey: ['inv-rotacion'], queryFn: () => reportesApi.rotacion() }) }
export function useRotacionAbc() { return useQuery({ queryKey: ['inv-rotacion-abc'], queryFn: () => reportesApi.rotacionAbc() }) }
export function useKpis() { return useQuery({ queryKey: ['inv-kpis'], queryFn: () => reportesApi.kpis() }) }
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npx vitest run src/features/inventario/hooks.test.tsx`
Expected: PASS.

- [ ] **Step 5: Build + commit**

```bash
npm run build
git add src/features/inventario/hooks.ts src/features/inventario/hooks.test.tsx
git commit -m "feat(f6): hooks React Query de inventario"
```

---

### Task 5: Handlers MSW + registro global

**Files:**
- Create: `src/test/msw/inventario-handlers.ts`
- Modify: `src/test/msw/handlers.ts` (import + spread `...inventarioHandlers`)
- Test: `src/test/msw/inventario-handlers.test.ts`

**Interfaces:**
- Produces: `inventarioHandlers` (array MSW) + constantes exportadas `productoEjemplo`, `productoDetalleEjemplo`, `categoriaEjemplo`, `marcaEjemplo`, `stockEjemplo`, `movimientoEjemplo`, `kardexEjemplo`, `kpisEjemplo` para reutilizar en tests de páginas.

- [ ] **Step 1: Escribir el test**

```ts
// src/test/msw/inventario-handlers.test.ts
import { describe, it, expect } from 'vitest'
import { inventarioHandlers, productoEjemplo, stockEjemplo } from './inventario-handlers'

describe('inventarioHandlers', () => {
  it('exporta handlers y ejemplos', () => {
    expect(inventarioHandlers.length).toBeGreaterThan(0)
    expect(productoEjemplo.codigo).toBe('P001')
    expect(stockEjemplo.cantidadDisponible).toBeGreaterThanOrEqual(0)
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/test/msw/inventario-handlers.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar los handlers**

```ts
// src/test/msw/inventario-handlers.ts
import { http, HttpResponse } from 'msw'
import type {
  ProductoListItem, ProductoDetalle, Categoria, Marca, StockPorBodega, MovimientoInventario,
  KardexProducto, InventarioKPIs,
} from '@/features/inventario/types'

const base = 'http://localhost:8080/api'

export const productoEjemplo: ProductoListItem = {
  id: 2, codigo: 'P001', nombre: 'Producto de prueba', precioVenta: 56.5, precioCosto: 30, activo: true,
  unidadMedida: 'Unidad', tipoItem: 'Bienes', categoriaId: 1, categoriaNombre: 'General', marcaId: null, marcaNombre: null,
  tipoImpuesto: 1, porcentajeIVA: 13, precioIncluyeIva: true, costoIncluyeIva: false, codigoBarras: null,
  stockMinimo: 5, stockMaximo: 100, puntoReorden: 10, permiteVentaSinStock: false, fechaCreacion: '2026-06-25',
  accesoTodasSucursales: true, tipoInventario: 0, tributosAdicionales: [],
}
export const productoDetalleEjemplo: ProductoDetalle = {
  id: 2, codigo: 'P001', nombre: 'Producto de prueba', precioVenta: 56.5, activo: true, fechaCreacion: '2026-06-25',
  unidadMedida: { id: 39, valor: 'Unidad' }, tipoItem: { id: 1, valor: 'Bienes' }, emisorId: 3,
  codigoBarras: null, categoriaId: 1, categoriaNombre: 'General', marcaId: null, marcaNombre: null, precioCosto: 30,
  accesoTodasSucursales: true, sucursales: [], tipoImpuesto: 1, porcentajeIVA: 13, precioIncluyeIva: true,
  costoIncluyeIva: false, stockMinimo: 5, stockMaximo: 100, puntoReorden: 10, permiteVentaSinStock: false,
  tipoInventario: 0, tributosAdicionales: [],
}
export const categoriaEjemplo: Categoria = { id: 1, codigo: 'C1', nombre: 'General', totalProductos: 1, activo: true, fechaCreacion: '2026-06-25' }
export const marcaEjemplo: Marca = { id: 1, nombre: 'Genérica', totalProductos: 0, activa: true, fechaCreacion: '2026-06-25' }
export const stockEjemplo: StockPorBodega = {
  productoId: 2, productoCodigo: 'P001', productoNombre: 'Producto de prueba', bodegaId: 1, bodegaNombre: 'Bodega Principal',
  sucursalNombre: 'Casa Matriz', cantidadDisponible: 8, cantidadReservada: 0, cantidadTotal: 8, costoPromedio: 30,
  valorStock: 240, fechaUltimoMovimiento: '2026-06-27', stockMinimo: 5, stockMaximo: 100,
}
export const movimientoEjemplo: MovimientoInventario = {
  id: 1, fechaMovimiento: '2026-06-27', tipoMovimiento: 'ENTRADA', tipoDocumento: 'COMPRA_EXTERNA', numeroDocumento: 'C-1',
  documentoId: 1, productoId: 2, productoCodigo: 'P001', productoNombre: 'Producto de prueba', bodegaId: 1, bodegaNombre: 'Bodega Principal',
  cantidad: 5, costoUnitario: 30, saldoAnterior: 3, nuevoSaldo: 8, observaciones: null, usuarioId: 1, usuarioNombre: 'Ana',
}
export const kardexEjemplo: KardexProducto = {
  productoId: 2, productoCodigo: 'P001', productoNombre: 'Producto de prueba', bodegaId: 1, bodegaNombre: 'Bodega Principal',
  fechaDesde: '2026-06-01', fechaHasta: '2026-06-30', saldoInicial: 3, totalEntradas: 5, totalSalidas: 0, saldoFinal: 8,
  movimientos: { items: [movimientoEjemplo], totalItems: 1, pageNumber: 1, pageSize: 50, totalPages: 1 },
}
export const kpisEjemplo: InventarioKPIs = {
  totalProductos: 1, valorTotalInventario: 240, productosBajoMinimo: 0, productosSinStock: 0,
  totalMovimientosUltimoMes: 1, totalEntradasUltimoMes: 1, totalSalidasUltimoMes: 0,
  costoMercanciaVendidaMesActual: 0, valorComprasMesActual: 150, rotacionPromedioAnual: 0, diasPromedioInventario: 0,
}

const page = <T,>(item: T) => ({ items: [item], totalItems: 1, pageNumber: 1, pageSize: 50, totalPages: 1 })
const pageF2 = <T,>(item: T) => ({ items: [item], totalCount: 1, pageNumber: 1, pageSize: 20, totalPages: 1 })

export const inventarioHandlers = [
  http.get(`${base}/productosservicios`, () => HttpResponse.json(pageF2(productoEjemplo))),
  http.get(`${base}/productosservicios/2`, () => HttpResponse.json(productoDetalleEjemplo)),
  http.post(`${base}/productosservicios`, () => HttpResponse.json(productoDetalleEjemplo, { status: 201 })),
  http.put(`${base}/productosservicios/2`, () => HttpResponse.json(productoDetalleEjemplo)),
  http.patch(`${base}/productosservicios/:id/toggle-active`, () => HttpResponse.json({ ok: true })),
  http.post(`${base}/productosservicios/:id/desactivar`, () => HttpResponse.json({ ok: true })),
  http.get(`${base}/categorias`, () => HttpResponse.json([categoriaEjemplo])),
  http.post(`${base}/categorias`, () => HttpResponse.json(categoriaEjemplo, { status: 201 })),
  http.put(`${base}/categorias/:id`, () => HttpResponse.json(categoriaEjemplo)),
  http.patch(`${base}/categorias/:id/toggle-active`, () => HttpResponse.json({ ok: true })),
  http.delete(`${base}/categorias/:id`, () => new HttpResponse(null, { status: 204 })),
  http.get(`${base}/marcas`, () => HttpResponse.json([marcaEjemplo])),
  http.post(`${base}/marcas`, () => HttpResponse.json(marcaEjemplo, { status: 201 })),
  http.put(`${base}/marcas/:id`, () => HttpResponse.json(marcaEjemplo)),
  http.patch(`${base}/marcas/:id/toggle-active`, () => HttpResponse.json({ ok: true })),
  http.delete(`${base}/marcas/:id`, () => new HttpResponse(null, { status: 204 })),
  http.post(`${base}/inventario/ajustes`, () => HttpResponse.json({ ok: true })),
  http.post(`${base}/inventario/traslado`, () => HttpResponse.json({ ok: true })),
  http.get(`${base}/inventarioreportes/stock`, () => HttpResponse.json(page(stockEjemplo))),
  http.get(`${base}/inventarioreportes/stock/bajo-minimo`, () => HttpResponse.json([])),
  http.get(`${base}/inventarioreportes/stock/sin-movimiento`, () => HttpResponse.json([])),
  http.get(`${base}/inventarioreportes/movimientos`, () => HttpResponse.json(page(movimientoEjemplo))),
  http.get(`${base}/inventarioreportes/kardex/:id`, () => HttpResponse.json(kardexEjemplo)),
  http.get(`${base}/inventarioreportes/valoracion`, () => HttpResponse.json({ bodegaId: null, bodegaNombre: null, totalProductos: 1, cantidadTotalUnidades: 8, valorTotal: 240, detalleProductos: [] })),
  http.get(`${base}/inventarioreportes/cmv`, () => HttpResponse.json({})),
  http.get(`${base}/inventarioreportes/rotacion`, () => HttpResponse.json([])),
  http.get(`${base}/inventarioreportes/rotacion-abc`, () => HttpResponse.json([])),
  http.get(`${base}/inventarioreportes/kpis`, () => HttpResponse.json(kpisEjemplo)),
]
```

- [ ] **Step 4: Registrar en `handlers.ts`** (import al tope + `...inventarioHandlers` dentro del array `handlers`, junto a los demás spreads). No tocar los handlers existentes.

```ts
import { inventarioHandlers } from './inventario-handlers'
```
y dentro del array: `  ...inventarioHandlers,`

- [ ] **Step 5: Correr y verificar que pasa**

Run: `npx vitest run src/test/msw/inventario-handlers.test.ts`
Expected: PASS.

- [ ] **Step 6: Build + commit**

```bash
npm run build
git add src/test/msw/inventario-handlers.ts src/test/msw/inventario-handlers.test.ts src/test/msw/handlers.ts
git commit -m "test(f6): handlers MSW de inventario"
```

---

### Task 6: Modales de Categoría y Marca

**Files:**
- Create: `src/features/inventario/components/CategoriaFormModal.tsx`, `src/features/inventario/components/MarcaFormModal.tsx`
- Test: `src/features/inventario/components/CategoriaFormModal.test.tsx`, `src/features/inventario/components/MarcaFormModal.test.tsx`

**Interfaces:**
- Consumes: `categoriaSchema`/`marcaSchema`, tipos `Categoria`/`Marca`.
- Produces:
  - `CategoriaFormModal({ inicial?: Categoria | null, onGuardar: (dto: CrearCategoriaDto) => void, onClose: () => void, cargando: boolean })`
  - `MarcaFormModal({ inicial?: Marca | null, onGuardar: (dto: CrearMarcaDto) => void, onClose, cargando })`
  Validan con el schema y muestran el primer error; en edición precargan desde `inicial` (props, sin efecto).

- [ ] **Step 1: Escribir el test**

```tsx
// src/features/inventario/components/CategoriaFormModal.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CategoriaFormModal } from './CategoriaFormModal'

describe('CategoriaFormModal', () => {
  it('valida obligatorios', () => {
    const onGuardar = vi.fn()
    render(<CategoriaFormModal onGuardar={onGuardar} onClose={() => {}} cargando={false} />)
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    expect(onGuardar).not.toHaveBeenCalled()
  })
  it('guarda con código y nombre', () => {
    const onGuardar = vi.fn()
    render(<CategoriaFormModal onGuardar={onGuardar} onClose={() => {}} cargando={false} />)
    fireEvent.change(screen.getByLabelText(/código/i), { target: { value: 'C2' } })
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Bebidas' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    expect(onGuardar).toHaveBeenCalledWith(expect.objectContaining({ codigo: 'C2', nombre: 'Bebidas' }))
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/features/inventario/components/CategoriaFormModal.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```tsx
// src/features/inventario/components/CategoriaFormModal.tsx
import { useState } from 'react'
import { Modal, Button, FormField, Input } from '@/design-system'
import { categoriaSchema } from '../schemas'
import type { Categoria, CrearCategoriaDto } from '../types'

interface Props { inicial?: Categoria | null; onGuardar: (dto: CrearCategoriaDto) => void; onClose: () => void; cargando: boolean }

export function CategoriaFormModal({ inicial, onGuardar, onClose, cargando }: Props) {
  const [codigo, setCodigo] = useState(inicial?.codigo ?? '')
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '')
  const [error, setError] = useState<string | null>(null)

  const guardar = () => {
    const dto = { codigo: codigo.trim(), nombre: nombre.trim(), descripcion: descripcion.trim() || null }
    const res = categoriaSchema.safeParse(dto)
    if (!res.success) { setError(res.error.issues[0]?.message ?? 'Revise el formulario'); return }
    onGuardar(dto)
  }

  return (
    <Modal open onClose={onClose} title={inicial ? 'Editar categoría' : 'Nueva categoría'}>
      <div className="space-y-3">
        {error && <p className="rounded-md bg-rojo/10 px-3 py-2 text-sm text-rojo">{error}</p>}
        <FormField label="Código" htmlFor="cat-codigo"><Input id="cat-codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} /></FormField>
        <FormField label="Nombre" htmlFor="cat-nombre"><Input id="cat-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} /></FormField>
        <FormField label="Descripción (opcional)" htmlFor="cat-desc"><Input id="cat-desc" value={descripcion ?? ''} onChange={(e) => setDescripcion(e.target.value)} /></FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar} disabled={cargando}>{cargando ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </div>
    </Modal>
  )
}
```

```tsx
// src/features/inventario/components/MarcaFormModal.tsx
import { useState } from 'react'
import { Modal, Button, FormField, Input } from '@/design-system'
import { marcaSchema } from '../schemas'
import type { Marca, CrearMarcaDto } from '../types'

interface Props { inicial?: Marca | null; onGuardar: (dto: CrearMarcaDto) => void; onClose: () => void; cargando: boolean }

export function MarcaFormModal({ inicial, onGuardar, onClose, cargando }: Props) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '')
  const [error, setError] = useState<string | null>(null)

  const guardar = () => {
    const dto = { nombre: nombre.trim(), descripcion: descripcion.trim() || null }
    const res = marcaSchema.safeParse(dto)
    if (!res.success) { setError(res.error.issues[0]?.message ?? 'Revise el formulario'); return }
    onGuardar(dto)
  }

  return (
    <Modal open onClose={onClose} title={inicial ? 'Editar marca' : 'Nueva marca'}>
      <div className="space-y-3">
        {error && <p className="rounded-md bg-rojo/10 px-3 py-2 text-sm text-rojo">{error}</p>}
        <FormField label="Nombre" htmlFor="marca-nombre"><Input id="marca-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} /></FormField>
        <FormField label="Descripción (opcional)" htmlFor="marca-desc"><Input id="marca-desc" value={descripcion ?? ''} onChange={(e) => setDescripcion(e.target.value)} /></FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar} disabled={cargando}>{cargando ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 4: Añadir el test de MarcaFormModal** (análogo: valida nombre obligatorio, guarda con nombre).

```tsx
// src/features/inventario/components/MarcaFormModal.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MarcaFormModal } from './MarcaFormModal'

describe('MarcaFormModal', () => {
  it('no guarda sin nombre', () => {
    const onGuardar = vi.fn()
    render(<MarcaFormModal onGuardar={onGuardar} onClose={() => {}} cargando={false} />)
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    expect(onGuardar).not.toHaveBeenCalled()
  })
  it('guarda con nombre', () => {
    const onGuardar = vi.fn()
    render(<MarcaFormModal onGuardar={onGuardar} onClose={() => {}} cargando={false} />)
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Acme' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    expect(onGuardar).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Acme' }))
  })
})
```

- [ ] **Step 5: Correr y verificar que pasan**

Run: `npx vitest run src/features/inventario/components/CategoriaFormModal.test.tsx src/features/inventario/components/MarcaFormModal.test.tsx`
Expected: PASS.

- [ ] **Step 6: Build + commit**

```bash
npm run build
git add src/features/inventario/components/CategoriaFormModal.* src/features/inventario/components/MarcaFormModal.*
git commit -m "feat(f6): modales de categoría y marca"
```

---

### Task 7: Pestañas Categorías y Marcas (listas CRUD)

**Files:**
- Create: `src/features/inventario/components/CategoriasTab.tsx`, `src/features/inventario/components/MarcasTab.tsx`
- Test: `src/features/inventario/components/CategoriasTab.test.tsx`

**Interfaces:**
- Consumes: `useCategorias`/`useCrearCategoria`/`useActualizarCategoria`/`useToggleCategoria`/`useEliminarCategoria` (y análogos de marcas), `CategoriaFormModal`/`MarcaFormModal`, `useToast`.
- Produces: `CategoriasTab()` y `MarcasTab()` (sin props; usan hooks). Tabla con nombre/código/total productos/estado + acciones Editar/Activar-desactivar/Eliminar (con confirm), botón "Nueva".

- [ ] **Step 1: Escribir el test**

```tsx
// src/features/inventario/components/CategoriasTab.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { ToastProvider } from '@/design-system'
import { inventarioHandlers } from '@/test/msw/inventario-handlers'
import { CategoriasTab } from './CategoriasTab'

const server = setupServer(...inventarioHandlers)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}><ToastProvider>{children}</ToastProvider></QueryClientProvider>
}

describe('CategoriasTab', () => {
  it('lista categorías y muestra el botón de nueva', async () => {
    render(<CategoriasTab />, { wrapper })
    await waitFor(() => expect(screen.getByText('General')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /nueva categor/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/features/inventario/components/CategoriasTab.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar `CategoriasTab`**

```tsx
// src/features/inventario/components/CategoriasTab.tsx
import { useState } from 'react'
import { Button, Spinner, EmptyState, useToast } from '@/design-system'
import { useCategorias, useCrearCategoria, useActualizarCategoria, useToggleCategoria, useEliminarCategoria } from '../hooks'
import { CategoriaFormModal } from './CategoriaFormModal'
import type { Categoria, CrearCategoriaDto } from '../types'

export function CategoriasTab() {
  const lista = useCategorias()
  const crear = useCrearCategoria()
  const actualizar = useActualizarCategoria()
  const toggle = useToggleCategoria()
  const eliminar = useEliminarCategoria()
  const toast = useToast()
  const [editando, setEditando] = useState<Categoria | null | undefined>(undefined) // undefined = cerrado, null = nueva

  const onGuardar = async (dto: CrearCategoriaDto) => {
    try {
      if (editando) await actualizar.mutateAsync({ id: editando.id, dto })
      else await crear.mutateAsync(dto)
      toast.show('Categoría guardada')
      setEditando(undefined)
    } catch (e) {
      toast.show((e as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ?? 'No se pudo guardar', { tone: 'rojo' })
    }
  }
  const onEliminar = async (c: Categoria) => {
    if (!window.confirm(`¿Eliminar la categoría "${c.nombre}"?`)) return
    try { await eliminar.mutateAsync(c.id); toast.show('Categoría eliminada') }
    catch (e) { toast.show((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'No se pudo eliminar', { tone: 'rojo' }) }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditando(null)}>Nueva categoría</Button>
      </div>
      {lista.isLoading ? <Spinner /> : !lista.data?.length ? (
        <EmptyState title="Sin categorías" hint="Crea la primera categoría." />
      ) : (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-wide text-slate/70"><th className="py-2">Código</th><th>Nombre</th><th className="text-right">Productos</th><th>Estado</th><th /></tr></thead>
          <tbody>
            {lista.data.map((c) => (
              <tr key={c.id} className="border-t border-hairline">
                <td className="py-2 font-mono text-xs">{c.codigo}</td>
                <td>{c.nombre}</td>
                <td className="text-right">{c.totalProductos}</td>
                <td>{c.activo ? 'Activa' : 'Inactiva'}</td>
                <td className="space-x-2 text-right">
                  <button type="button" className="text-xs text-sello" onClick={() => setEditando(c)}>Editar</button>
                  <button type="button" className="text-xs text-slate" onClick={() => toggle.mutate(c.id)}>{c.activo ? 'Desactivar' : 'Activar'}</button>
                  <button type="button" className="text-xs text-rojo" onClick={() => onEliminar(c)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {editando !== undefined && (
        <CategoriaFormModal inicial={editando} onGuardar={onGuardar} onClose={() => setEditando(undefined)} cargando={crear.isPending || actualizar.isPending} />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Implementar `MarcasTab`** (análogo, sin código y con `activa`).

```tsx
// src/features/inventario/components/MarcasTab.tsx
import { useState } from 'react'
import { Button, Spinner, EmptyState, useToast } from '@/design-system'
import { useMarcas, useCrearMarca, useActualizarMarca, useToggleMarca, useEliminarMarca } from '../hooks'
import { MarcaFormModal } from './MarcaFormModal'
import type { Marca, CrearMarcaDto } from '../types'

export function MarcasTab() {
  const lista = useMarcas()
  const crear = useCrearMarca()
  const actualizar = useActualizarMarca()
  const toggle = useToggleMarca()
  const eliminar = useEliminarMarca()
  const toast = useToast()
  const [editando, setEditando] = useState<Marca | null | undefined>(undefined)

  const onGuardar = async (dto: CrearMarcaDto) => {
    try {
      if (editando) await actualizar.mutateAsync({ id: editando.id, dto })
      else await crear.mutateAsync(dto)
      toast.show('Marca guardada'); setEditando(undefined)
    } catch (e) { toast.show((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'No se pudo guardar', { tone: 'rojo' }) }
  }
  const onEliminar = async (m: Marca) => {
    if (!window.confirm(`¿Eliminar la marca "${m.nombre}"?`)) return
    try { await eliminar.mutateAsync(m.id); toast.show('Marca eliminada') }
    catch (e) { toast.show((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'No se pudo eliminar', { tone: 'rojo' }) }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={() => setEditando(null)}>Nueva marca</Button></div>
      {lista.isLoading ? <Spinner /> : !lista.data?.length ? (
        <EmptyState title="Sin marcas" hint="Crea la primera marca." />
      ) : (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-wide text-slate/70"><th className="py-2">Nombre</th><th className="text-right">Productos</th><th>Estado</th><th /></tr></thead>
          <tbody>
            {lista.data.map((m) => (
              <tr key={m.id} className="border-t border-hairline">
                <td className="py-2">{m.nombre}</td>
                <td className="text-right">{m.totalProductos}</td>
                <td>{m.activa ? 'Activa' : 'Inactiva'}</td>
                <td className="space-x-2 text-right">
                  <button type="button" className="text-xs text-sello" onClick={() => setEditando(m)}>Editar</button>
                  <button type="button" className="text-xs text-slate" onClick={() => toggle.mutate(m.id)}>{m.activa ? 'Desactivar' : 'Activar'}</button>
                  <button type="button" className="text-xs text-rojo" onClick={() => onEliminar(m)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {editando !== undefined && (
        <MarcaFormModal inicial={editando} onGuardar={onGuardar} onClose={() => setEditando(undefined)} cargando={crear.isPending || actualizar.isPending} />
      )}
    </div>
  )
}
```

- [ ] **Step 5: Correr y verificar que pasa**

Run: `npx vitest run src/features/inventario/components/CategoriasTab.test.tsx`
Expected: PASS.

- [ ] **Step 6: Build + commit**

```bash
npm run build
git add src/features/inventario/components/CategoriasTab.* src/features/inventario/components/MarcasTab.tsx
git commit -m "feat(f6): pestañas CRUD de categorías y marcas"
```

---

### Task 8: `TributosProductoSection`

**Files:**
- Create: `src/features/inventario/components/TributosProductoSection.tsx`
- Test: `src/features/inventario/components/TributosProductoSection.test.tsx`

**Interfaces:**
- Consumes: tipo `ProductoTributo`.
- Produces: `TributosProductoSection({ tributos: ProductoTributo[], onChange: (t: ProductoTributo[]) => void })`. Lista editable de tributos adicionales (código + tipoCalculo + valor); agregar/quitar filas. Componente controlado (estado en el padre).

- [ ] **Step 1: Escribir el test**

```tsx
// src/features/inventario/components/TributosProductoSection.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TributosProductoSection } from './TributosProductoSection'

describe('TributosProductoSection', () => {
  it('agrega una fila de tributo', () => {
    const onChange = vi.fn()
    render(<TributosProductoSection tributos={[]} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /agregar tributo/i }))
    expect(onChange).toHaveBeenCalledWith([{ codigo: '', tipoCalculo: 'porcentaje', valor: 0 }])
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/features/inventario/components/TributosProductoSection.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```tsx
// src/features/inventario/components/TributosProductoSection.tsx
import { Button, FormField, Input, Icon } from '@/design-system'
import type { ProductoTributo } from '../types'

export function TributosProductoSection({ tributos, onChange }: { tributos: ProductoTributo[]; onChange: (t: ProductoTributo[]) => void }) {
  const set = (i: number, patch: Partial<ProductoTributo>) => onChange(tributos.map((t, idx) => (idx === i ? { ...t, ...patch } : t)))
  const agregar = () => onChange([...tributos, { codigo: '', tipoCalculo: 'porcentaje', valor: 0 }])
  const quitar = (i: number) => onChange(tributos.filter((_, idx) => idx !== i))
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-slate/80"><span className="h-1.5 w-1.5 rounded-full bg-oro" />Tributos adicionales (opcional)</h2>
      {tributos.map((t, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
          <FormField label="Código" htmlFor={`trib-cod-${i}`}><Input id={`trib-cod-${i}`} value={t.codigo} onChange={(e) => set(i, { codigo: e.target.value })} /></FormField>
          <FormField label="Tipo cálculo" htmlFor={`trib-tc-${i}`}>
            <select id={`trib-tc-${i}`} className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark" value={t.tipoCalculo ?? 'porcentaje'} onChange={(e) => set(i, { tipoCalculo: e.target.value })}>
              <option value="porcentaje">Porcentaje</option>
              <option value="monto_fijo">Monto fijo</option>
            </select>
          </FormField>
          <FormField label="Valor" htmlFor={`trib-val-${i}`}><Input id={`trib-val-${i}`} type="number" value={t.valor ?? 0} onChange={(e) => set(i, { valor: Number(e.target.value) })} /></FormField>
          <button type="button" className="pb-2 text-xs text-rojo" onClick={() => quitar(i)}>Quitar</button>
        </div>
      ))}
      <Button variant="ghost" onClick={agregar}><Icon name="plus" size={16} />Agregar tributo</Button>
    </section>
  )
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npx vitest run src/features/inventario/components/TributosProductoSection.test.tsx`
Expected: PASS.

- [ ] **Step 5: Build + commit**

```bash
npm run build
git add src/features/inventario/components/TributosProductoSection.*
git commit -m "feat(f6): sección de tributos adicionales del producto"
```

---

### Task 9: `ProductoFormPage` (formulario completo)

**Files:**
- Create: `src/features/inventario/pages/ProductoFormPage.tsx`
- Test: `src/features/inventario/pages/ProductoFormPage.test.tsx`

**Interfaces:**
- Consumes: `useProducto`, `useCrearProducto`, `useActualizarProducto`, `useCategorias`, `useMarcas`, `useCrearCategoria`, `useCrearMarca`, `useCatalogo('unidadesMedida')`/`useCatalogo('tiposItems')` de `@/features/facturacion/hooks`, `useSucursales` de facturación, `productoSchema`, `TributosProductoSection`, `CategoriaFormModal`/`MarcaFormModal`, `useToast`, `useNavigate`, `useParams`.
- Produces: `ProductoFormPage()`. Lee `:id` opcional. Inner-form con `key` para precargar en edición. Campos de activo fijo visibles solo si `tipoInventario===1`. Guarda (POST/PUT) y navega a `/inventario/productos`.

- [ ] **Step 1: Escribir el test (humo: monta en modo nuevo, muestra secciones; en edición precarga)**

```tsx
// src/features/inventario/pages/ProductoFormPage.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { ToastProvider } from '@/design-system'
import { inventarioHandlers } from '@/test/msw/inventario-handlers'
import { ProductoFormPage } from './ProductoFormPage'

const base = 'http://localhost:8080/api'
const server = setupServer(
  ...inventarioHandlers,
  http.get(`${base}/catalogos/unidades-medida`, () => HttpResponse.json([{ id: 39, valor: 'Unidad' }])),
  http.get(`${base}/catalogos/tipos-items`, () => HttpResponse.json([{ id: 1, valor: 'Bienes' }, { id: 2, valor: 'Servicios' }])),
  http.get(`${base}/sucursales/todas-activas`, () => HttpResponse.json([{ id: 2, nombre: 'Casa Matriz' }])),
)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())

function renderEn(ruta: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}><ToastProvider>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/inventario/productos/nuevo" element={<ProductoFormPage />} />
          <Route path="/inventario/productos/:id/editar" element={<ProductoFormPage />} />
          <Route path="/inventario/productos" element={<div>listado</div>} />
        </Routes>
      </MemoryRouter>
    </ToastProvider></QueryClientProvider>,
  )
}

describe('ProductoFormPage', () => {
  it('monta en modo nuevo', async () => {
    renderEn('/inventario/productos/nuevo')
    await waitFor(() => expect(screen.getByText(/nuevo producto/i)).toBeInTheDocument())
    expect(screen.getByLabelText(/código/i)).toHaveValue('')
  })
  it('precarga en modo edición', async () => {
    renderEn('/inventario/productos/2/editar')
    await waitFor(() => expect(screen.getByLabelText(/código/i)).toHaveValue('P001'))
  })
  it('muestra campos de activo fijo al elegir Mobiliario y Equipo', async () => {
    renderEn('/inventario/productos/nuevo')
    await waitFor(() => screen.getByLabelText(/tipo de inventario/i))
    fireEvent.change(screen.getByLabelText(/tipo de inventario/i), { target: { value: '1' } })
    expect(screen.getByLabelText(/años de vida útil/i)).toBeInTheDocument()
  })
})
```

> NOTA al implementador: confirma los nombres de catálogo reales (`useCatalogo('unidadesMedida')` → `/catalogos/unidades-medida`; `useCatalogo('tiposItems')` → `/catalogos/tipos-items`) abriendo `src/features/facturacion/catalogos-api.ts`. Ajusta los handlers del test si difieren. `useSucursales` → `/sucursales/todas-activas`.

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/features/inventario/pages/ProductoFormPage.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar** (patrón split loader + inner-form con `key`)

```tsx
// src/features/inventario/pages/ProductoFormPage.tsx
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, FormField, Input, Spinner, useToast } from '@/design-system'
import { useCatalogo, useSucursales } from '@/features/facturacion/hooks'
import { useProducto, useCrearProducto, useActualizarProducto, useCategorias, useMarcas, useCrearCategoria, useCrearMarca } from '../hooks'
import { productoSchema } from '../schemas'
import { TIPO_INVENTARIO } from '../types'
import { TributosProductoSection } from '../components/TributosProductoSection'
import { CategoriaFormModal } from '../components/CategoriaFormModal'
import { MarcaFormModal } from '../components/MarcaFormModal'
import type { ProductoDetalle, CrearProductoDto, ProductoTributo } from '../types'

export function ProductoFormPage() {
  const { id } = useParams<{ id: string }>()
  const editId = id ? Number(id) : null
  const detalle = useProducto(editId ?? NaN)
  if (editId && detalle.isLoading) return <div className="p-6"><Spinner /></div>
  return <ProductoForm key={editId ?? 'nuevo'} editId={editId} inicial={editId ? detalle.data ?? null : null} />
}

function ProductoForm({ editId, inicial }: { editId: number | null; inicial: ProductoDetalle | null }) {
  const navigate = useNavigate()
  const toast = useToast()
  const crear = useCrearProducto()
  const actualizar = useActualizarProducto()
  const unidades = useCatalogo('unidadesMedida')
  const tipos = useCatalogo('tiposItems')
  const sucursales = useSucursales()
  const categorias = useCategorias()
  const marcas = useMarcas()
  const crearCat = useCrearCategoria()
  const crearMarca = useCrearMarca()

  const [codigo, setCodigo] = useState(inicial?.codigo ?? '')
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '')
  const [precioVenta, setPrecioVenta] = useState(inicial?.precioVenta ?? 0)
  const [precioCosto, setPrecioCosto] = useState<number | ''>(inicial?.precioCosto ?? '')
  const [catUnidadMedidaId, setUnidad] = useState<number>(inicial?.unidadMedida.id ?? 0)
  const [catTipoItemId, setTipoItem] = useState<number>(inicial?.tipoItem.id ?? 0)
  const [codigoBarras, setCodigoBarras] = useState(inicial?.codigoBarras ?? '')
  const [categoriaId, setCategoriaId] = useState<number | ''>(inicial?.categoriaId ?? '')
  const [marcaId, setMarcaId] = useState<number | ''>(inicial?.marcaId ?? '')
  const [tipoImpuesto, setTipoImpuesto] = useState(inicial?.tipoImpuesto ?? 1)
  const [porcentajeIVA, setPorcentajeIVA] = useState<number | ''>(inicial?.porcentajeIVA ?? 13)
  const [precioIncluyeIva, setPrecioIncluyeIva] = useState(inicial?.precioIncluyeIva ?? false)
  const [costoIncluyeIva, setCostoIncluyeIva] = useState(inicial?.costoIncluyeIva ?? false)
  const [stockMinimo, setStockMinimo] = useState<number | ''>(inicial?.stockMinimo ?? '')
  const [stockMaximo, setStockMaximo] = useState<number | ''>(inicial?.stockMaximo ?? '')
  const [puntoReorden, setPuntoReorden] = useState<number | ''>(inicial?.puntoReorden ?? '')
  const [permiteVentaSinStock, setPermiteVentaSinStock] = useState(inicial?.permiteVentaSinStock ?? false)
  const [tipoInventario, setTipoInventario] = useState(inicial?.tipoInventario ?? 0)
  const [fechaAdquisicion, setFechaAdquisicion] = useState(inicial?.fechaAdquisicion?.slice(0, 10) ?? '')
  const [aniosVidaUtil, setAniosVidaUtil] = useState<number | ''>(inicial?.aniosVidaUtil ?? '')
  const [valorActual, setValorActual] = useState<number | ''>(inicial?.valorActual ?? '')
  const [valorResidual, setValorResidual] = useState<number | ''>(inicial?.valorResidual ?? '')
  const [accesoTodasSucursales, setAccesoTodas] = useState(inicial?.accesoTodasSucursales ?? true)
  const [sucursalIds, setSucursalIds] = useState<number[]>(inicial?.sucursales.map((s) => s.sucursalId) ?? [])
  const [tributos, setTributos] = useState<ProductoTributo[]>(inicial?.tributosAdicionales ?? [])
  const [catModal, setCatModal] = useState(false)
  const [marcaModal, setMarcaModal] = useState(false)

  const num = (v: number | '') => (v === '' ? null : Number(v))
  const esActivo = tipoInventario === TIPO_INVENTARIO.MOBILIARIO_EQUIPO

  const onGuardar = async () => {
    const dto: CrearProductoDto = {
      codigo: codigo.trim(), nombre: nombre.trim(), descripcion: descripcion.trim() || null,
      precioVenta: Number(precioVenta), catUnidadMedidaId, catTipoItemId, codigoBarras: codigoBarras.trim() || null,
      categoriaId: categoriaId === '' ? null : Number(categoriaId), marcaId: marcaId === '' ? null : Number(marcaId),
      precioCosto: num(precioCosto), tipoImpuesto, porcentajeIVA: num(porcentajeIVA), precioIncluyeIva, costoIncluyeIva,
      stockMinimo: num(stockMinimo), stockMaximo: num(stockMaximo), puntoReorden: num(puntoReorden), permiteVentaSinStock,
      tipoInventario, fechaAdquisicion: esActivo && fechaAdquisicion ? `${fechaAdquisicion}T00:00:00Z` : null,
      aniosVidaUtil: esActivo ? num(aniosVidaUtil) : null, valorActual: esActivo ? num(valorActual) : null,
      valorResidual: esActivo ? num(valorResidual) : null, accesoTodasSucursales,
      sucursalIds: accesoTodasSucursales ? null : sucursalIds, tributosAdicionales: tributos.length ? tributos : null,
    }
    const res = productoSchema.safeParse(dto)
    if (!res.success) { toast.show(res.error.issues[0]?.message ?? 'Revise el formulario', { tone: 'rojo' }); return }
    try {
      if (editId) await actualizar.mutateAsync({ id: editId, dto })
      else await crear.mutateAsync(dto)
      toast.show(editId ? 'Producto actualizado' : 'Producto creado')
      navigate('/inventario/productos')
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string; message?: string } } })?.response?.data
      toast.show(msg?.error ?? msg?.message ?? 'No se pudo guardar el producto', { tone: 'rojo' })
    }
  }

  const inputSel = 'w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark'
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold text-ink">{editId ? 'Editar producto' : 'Nuevo producto'}</h1>

      <section className="grid gap-3 md:grid-cols-2">
        <FormField label="Código" htmlFor="p-codigo"><Input id="p-codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} /></FormField>
        <FormField label="Código de barras (opcional)" htmlFor="p-barras"><Input id="p-barras" value={codigoBarras ?? ''} onChange={(e) => setCodigoBarras(e.target.value)} /></FormField>
        <FormField label="Nombre" htmlFor="p-nombre"><Input id="p-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} /></FormField>
        <FormField label="Descripción (opcional)" htmlFor="p-desc"><Input id="p-desc" value={descripcion ?? ''} onChange={(e) => setDescripcion(e.target.value)} /></FormField>
        <FormField label="Unidad de medida" htmlFor="p-unidad">
          <select id="p-unidad" className={inputSel} value={catUnidadMedidaId} onChange={(e) => setUnidad(Number(e.target.value))}>
            <option value={0}>Seleccione…</option>
            {(unidades.data ?? []).map((u) => <option key={u.id} value={u.id}>{u.valor}</option>)}
          </select>
        </FormField>
        <FormField label="Tipo de ítem" htmlFor="p-tipoitem">
          <select id="p-tipoitem" className={inputSel} value={catTipoItemId} onChange={(e) => setTipoItem(Number(e.target.value))}>
            <option value={0}>Seleccione…</option>
            {(tipos.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.valor}</option>)}
          </select>
        </FormField>
        <FormField label="Categoría (opcional)" htmlFor="p-cat">
          <div className="flex gap-2">
            <select id="p-cat" className={inputSel} value={categoriaId} onChange={(e) => setCategoriaId(e.target.value === '' ? '' : Number(e.target.value))}>
              <option value="">—</option>
              {(categorias.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <Button variant="ghost" onClick={() => setCatModal(true)}>+</Button>
          </div>
        </FormField>
        <FormField label="Marca (opcional)" htmlFor="p-marca">
          <div className="flex gap-2">
            <select id="p-marca" className={inputSel} value={marcaId} onChange={(e) => setMarcaId(e.target.value === '' ? '' : Number(e.target.value))}>
              <option value="">—</option>
              {(marcas.data ?? []).map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
            <Button variant="ghost" onClick={() => setMarcaModal(true)}>+</Button>
          </div>
        </FormField>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <FormField label="Precio de venta" htmlFor="p-pv"><Input id="p-pv" type="number" value={precioVenta} onChange={(e) => setPrecioVenta(Number(e.target.value))} /></FormField>
        <FormField label="Precio de costo (opcional)" htmlFor="p-pc"><Input id="p-pc" type="number" value={precioCosto} onChange={(e) => setPrecioCosto(e.target.value === '' ? '' : Number(e.target.value))} /></FormField>
        <FormField label="Tipo de impuesto" htmlFor="p-imp">
          <select id="p-imp" className={inputSel} value={tipoImpuesto} onChange={(e) => setTipoImpuesto(Number(e.target.value))}>
            <option value={1}>Gravado (IVA)</option><option value={2}>Exento</option><option value={3}>No sujeto</option>
          </select>
        </FormField>
        <FormField label="% IVA" htmlFor="p-iva"><Input id="p-iva" type="number" value={porcentajeIVA} onChange={(e) => setPorcentajeIVA(e.target.value === '' ? '' : Number(e.target.value))} /></FormField>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={precioIncluyeIva} onChange={(e) => setPrecioIncluyeIva(e.target.checked)} />El precio de venta incluye IVA</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={costoIncluyeIva} onChange={(e) => setCostoIncluyeIva(e.target.checked)} />El costo incluye IVA</label>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <FormField label="Stock mínimo" htmlFor="p-smin"><Input id="p-smin" type="number" value={stockMinimo} onChange={(e) => setStockMinimo(e.target.value === '' ? '' : Number(e.target.value))} /></FormField>
        <FormField label="Stock máximo" htmlFor="p-smax"><Input id="p-smax" type="number" value={stockMaximo} onChange={(e) => setStockMaximo(e.target.value === '' ? '' : Number(e.target.value))} /></FormField>
        <FormField label="Punto de reorden" htmlFor="p-reorden"><Input id="p-reorden" type="number" value={puntoReorden} onChange={(e) => setPuntoReorden(e.target.value === '' ? '' : Number(e.target.value))} /></FormField>
        <label className="flex items-center gap-2 text-sm md:col-span-3"><input type="checkbox" checked={permiteVentaSinStock} onChange={(e) => setPermiteVentaSinStock(e.target.checked)} />Permite venta sin existencia</label>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <FormField label="Tipo de inventario" htmlFor="p-tipoinv">
          <select id="p-tipoinv" className={inputSel} value={tipoInventario} onChange={(e) => setTipoInventario(Number(e.target.value))}>
            <option value={0}>Ventas</option><option value={1}>Mobiliario y equipo (activo fijo)</option><option value={2}>Insumos</option>
          </select>
        </FormField>
        {esActivo && <>
          <FormField label="Fecha de adquisición" htmlFor="p-fadq"><Input id="p-fadq" type="date" value={fechaAdquisicion} onChange={(e) => setFechaAdquisicion(e.target.value)} /></FormField>
          <FormField label="Años de vida útil" htmlFor="p-vida"><Input id="p-vida" type="number" value={aniosVidaUtil} onChange={(e) => setAniosVidaUtil(e.target.value === '' ? '' : Number(e.target.value))} /></FormField>
          <FormField label="Valor actual" htmlFor="p-vactual"><Input id="p-vactual" type="number" value={valorActual} onChange={(e) => setValorActual(e.target.value === '' ? '' : Number(e.target.value))} /></FormField>
          <FormField label="Valor residual" htmlFor="p-vres"><Input id="p-vres" type="number" value={valorResidual} onChange={(e) => setValorResidual(e.target.value === '' ? '' : Number(e.target.value))} /></FormField>
        </>}
      </section>

      <section className="space-y-2">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={accesoTodasSucursales} onChange={(e) => setAccesoTodas(e.target.checked)} />Disponible en todas las sucursales</label>
        {!accesoTodasSucursales && (
          <div className="flex flex-wrap gap-3">
            {(sucursales.data ?? []).map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={sucursalIds.includes(s.id)} onChange={(e) => setSucursalIds(e.target.checked ? [...sucursalIds, s.id] : sucursalIds.filter((x) => x !== s.id))} />{s.nombre}
              </label>
            ))}
          </div>
        )}
      </section>

      <TributosProductoSection tributos={tributos} onChange={setTributos} />

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => navigate('/inventario/productos')}>Cancelar</Button>
        <Button onClick={onGuardar} disabled={crear.isPending || actualizar.isPending}>{(crear.isPending || actualizar.isPending) ? 'Guardando…' : 'Guardar producto'}</Button>
      </div>

      {catModal && <CategoriaFormModal onGuardar={async (dto) => { try { const c = await crearCat.mutateAsync(dto); setCategoriaId(c.id); setCatModal(false) } catch { toast.show('No se pudo crear la categoría', { tone: 'rojo' }) } }} onClose={() => setCatModal(false)} cargando={crearCat.isPending} />}
      {marcaModal && <MarcaFormModal onGuardar={async (dto) => { try { const m = await crearMarca.mutateAsync(dto); setMarcaId(m.id); setMarcaModal(false) } catch { toast.show('No se pudo crear la marca', { tone: 'rojo' }) } }} onClose={() => setMarcaModal(false)} cargando={crearMarca.isPending} />}
    </div>
  )
}
```

> NOTA: este formulario es grande; si al implementar supera lo razonable para un archivo, repórtalo como DONE_WITH_CONCERNS proponiendo extraer secciones a `components/ProductoFormFields/*` — pero NO lo dividas sin reportarlo. Verifica que `useSucursales` exista en `@/features/facturacion/hooks` y devuelva `{ id, nombre }`.

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npx vitest run src/features/inventario/pages/ProductoFormPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Build + commit**

```bash
npm run build
git add src/features/inventario/pages/ProductoFormPage.*
git commit -m "feat(f6): formulario de producto (alta/edición, activo fijo)"
```

---

### Task 10: `ProductosPage` (índice con pestañas + listado)

**Files:**
- Create: `src/features/inventario/pages/ProductosPage.tsx`, `src/features/inventario/components/ProductosTab.tsx`
- Test: `src/features/inventario/pages/ProductosPage.test.tsx`

**Interfaces:**
- Consumes: `Tabs` del design-system, `CategoriasTab`/`MarcasTab`, `useProductos`/`useToggleProducto`/`useDesactivarProducto`, `useCategorias`, `useNavigate`, `useToast`.
- Produces: `ProductosPage()` con pestañas Productos/Categorías/Marcas (estado de pestaña con `useState`). `ProductosTab()` = listado paginado con filtros (búsqueda, categoría, incluir inactivos), botón "Nuevo producto" (navega a `/inventario/productos/nuevo`), acciones por fila (Editar→`/:id/editar`, Activar/Desactivar).

- [ ] **Step 1: Escribir el test**

```tsx
// src/features/inventario/pages/ProductosPage.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { ToastProvider } from '@/design-system'
import { inventarioHandlers } from '@/test/msw/inventario-handlers'
import { ProductosPage } from './ProductosPage'

const server = setupServer(...inventarioHandlers)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}><ToastProvider><MemoryRouter>{children}</MemoryRouter></ToastProvider></QueryClientProvider>
}

describe('ProductosPage', () => {
  it('lista productos en la pestaña Productos', async () => {
    render(<ProductosPage />, { wrapper })
    await waitFor(() => expect(screen.getByText('Producto de prueba')).toBeInTheDocument())
  })
  it('cambia a la pestaña Categorías', async () => {
    render(<ProductosPage />, { wrapper })
    fireEvent.click(screen.getByRole('tab', { name: /categor/i }))
    await waitFor(() => expect(screen.getByText('General')).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/features/inventario/pages/ProductosPage.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar `ProductosTab` y `ProductosPage`**

```tsx
// src/features/inventario/components/ProductosTab.tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input, Spinner, EmptyState, Badge, useToast } from '@/design-system'
import { useProductos, useToggleProducto, useCategorias } from '../hooks'

const fmt = (n: number) => `$${n.toFixed(2)}`

export function ProductosTab() {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoriaId, setCategoriaId] = useState<number | ''>('')
  const [incluirInactivos, setIncluirInactivos] = useState(false)
  const categorias = useCategorias()
  const productos = useProductos({ pageNumber: 1, pageSize: 50, searchTerm: searchTerm || undefined, categoriaId: categoriaId === '' ? undefined : Number(categoriaId), incluirInactivos })
  const toggle = useToggleProducto()

  const onToggle = async (id: number) => {
    try { await toggle.mutateAsync(id) } catch { toast.show('No se pudo cambiar el estado', { tone: 'rojo' }) }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <Input placeholder="Buscar por nombre o código" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <select className="rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value === '' ? '' : Number(e.target.value))}>
            <option value="">Todas las categorías</option>
            {(categorias.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={incluirInactivos} onChange={(e) => setIncluirInactivos(e.target.checked)} />Incluir inactivos</label>
        </div>
        <Button onClick={() => navigate('/inventario/productos/nuevo')}>Nuevo producto</Button>
      </div>

      {productos.isLoading ? <Spinner /> : !productos.data?.items.length ? (
        <EmptyState title="Sin productos" hint="No hay productos para los filtros actuales." />
      ) : (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-wide text-slate/70"><th className="py-2">Código</th><th>Nombre</th><th>Categoría</th><th className="text-right">Precio</th><th>Estado</th><th /></tr></thead>
          <tbody>
            {productos.data.items.map((p) => (
              <tr key={p.id} className="border-t border-hairline">
                <td className="py-2 font-mono text-xs">{p.codigo}</td>
                <td><Link className="text-sello hover:underline" to={`/inventario/productos/${p.id}/editar`}>{p.nombre}</Link></td>
                <td>{p.categoriaNombre ?? '—'}</td>
                <td className="cifra text-right">{fmt(p.precioVenta)}</td>
                <td><Badge estado={p.activo ? 'recibido' : 'borrador'}>{p.activo ? 'Activo' : 'Inactivo'}</Badge></td>
                <td className="space-x-2 text-right">
                  <Link className="text-xs text-sello" to={`/inventario/productos/${p.id}/editar`}>Editar</Link>
                  <button type="button" className="text-xs text-slate" onClick={() => onToggle(p.id)}>{p.activo ? 'Desactivar' : 'Activar'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
```

```tsx
// src/features/inventario/pages/ProductosPage.tsx
import { useState } from 'react'
import { Tabs } from '@/design-system'
import { ProductosTab } from '../components/ProductosTab'
import { CategoriasTab } from '../components/CategoriasTab'
import { MarcasTab } from '../components/MarcasTab'

const TABS = [{ id: 'productos', label: 'Productos' }, { id: 'categorias', label: 'Categorías' }, { id: 'marcas', label: 'Marcas' }]

export function ProductosPage() {
  const [tab, setTab] = useState('productos')
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold text-ink">Productos y servicios</h1>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'productos' && <ProductosTab />}
      {tab === 'categorias' && <CategoriasTab />}
      {tab === 'marcas' && <MarcasTab />}
    </div>
  )
}
```

> NOTA: `useDesactivarProducto` (con motivo) queda disponible para una acción futura de baja con motivo; en esta tarea el toggle simple cubre activar/desactivar. Si el reviewer lo pide, añadir un modal de motivo reutilizando el patrón de `AnularCompraModal`.

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npx vitest run src/features/inventario/pages/ProductosPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Build + commit**

```bash
npm run build
git add src/features/inventario/pages/ProductosPage.tsx src/features/inventario/components/ProductosTab.tsx src/features/inventario/pages/ProductosPage.test.tsx
git commit -m "feat(f6): página de productos con pestañas"
```

---

### Task 11: Modales de Ajuste y Traslado de stock

**Files:**
- Create: `src/features/inventario/components/AjusteStockModal.tsx`, `src/features/inventario/components/TrasladoStockModal.tsx`
- Test: `src/features/inventario/components/AjusteStockModal.test.tsx`

**Interfaces:**
- Consumes: `ajusteSchema`/`trasladoSchema`, `MOTIVOS_AJUSTE`, `useBodegas` de facturación (`/api/bodegas/sucursal/{id}`), tipos `AjusteInventarioDto`/`TrasladoInventarioDto`.
- Produces:
  - `AjusteStockModal({ producto: { id, nombre }, sucursalId, onConfirmar: (dto: AjusteInventarioDto) => void, onClose, cargando })`
  - `TrasladoStockModal({ producto, sucursalId, onConfirmar: (dto: TrasladoInventarioDto) => void, onClose, cargando })`
  Eligen bodega(s) (de la sucursal), cantidad, motivo/observaciones; validan con el schema.

- [ ] **Step 1: Escribir el test**

```tsx
// src/features/inventario/components/AjusteStockModal.test.tsx
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { AjusteStockModal } from './AjusteStockModal'

const base = 'http://localhost:8080/api'
const server = setupServer(http.get(`${base}/bodegas/sucursal/2`, () => HttpResponse.json([{ id: 1, nombre: 'Bodega Principal' }])))
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('AjusteStockModal', () => {
  it('no confirma con observaciones cortas', async () => {
    const onConfirmar = vi.fn()
    render(<AjusteStockModal producto={{ id: 2, nombre: 'P001' }} sucursalId={2} onConfirmar={onConfirmar} onClose={() => {}} cargando={false} />, { wrapper })
    await waitFor(() => screen.getByText('Bodega Principal'))
    fireEvent.change(screen.getByLabelText(/cantidad/i), { target: { value: '-2' } })
    fireEvent.change(screen.getByLabelText(/observaciones/i), { target: { value: 'corto' } })
    fireEvent.click(screen.getByRole('button', { name: /confirmar ajuste/i }))
    expect(onConfirmar).not.toHaveBeenCalled()
  })
  it('confirma con datos válidos', async () => {
    const onConfirmar = vi.fn()
    render(<AjusteStockModal producto={{ id: 2, nombre: 'P001' }} sucursalId={2} onConfirmar={onConfirmar} onClose={() => {}} cargando={false} />, { wrapper })
    await waitFor(() => screen.getByText('Bodega Principal'))
    fireEvent.change(screen.getByLabelText(/cantidad/i), { target: { value: '-2' } })
    fireEvent.change(screen.getByLabelText(/observaciones/i), { target: { value: 'rotura en bodega' } })
    fireEvent.click(screen.getByRole('button', { name: /confirmar ajuste/i }))
    expect(onConfirmar).toHaveBeenCalledWith(expect.objectContaining({ productoId: 2, cantidad: -2, motivo: expect.any(String) }))
  })
})
```

> NOTA: confirma el hook real de bodegas (`useBodegas(sucursalId)` en `@/features/facturacion/hooks`, GET `/bodegas/sucursal/{id}`). Ajusta el handler si la ruta difiere.

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/features/inventario/components/AjusteStockModal.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar ambos modales**

```tsx
// src/features/inventario/components/AjusteStockModal.tsx
import { useState } from 'react'
import { Modal, Button, FormField, Input } from '@/design-system'
import { useBodegas } from '@/features/facturacion/hooks'
import { ajusteSchema } from '../schemas'
import { MOTIVOS_AJUSTE } from '../types'
import type { AjusteInventarioDto } from '../types'

interface Props { producto: { id: number; nombre: string }; sucursalId: number; onConfirmar: (dto: AjusteInventarioDto) => void; onClose: () => void; cargando: boolean }

export function AjusteStockModal({ producto, sucursalId, onConfirmar, onClose, cargando }: Props) {
  const bodegas = useBodegas(sucursalId)
  const [bodegaId, setBodegaId] = useState<number>(0)
  const [cantidad, setCantidad] = useState<number>(0)
  const [motivo, setMotivo] = useState<string>(MOTIVOS_AJUSTE[0])
  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState<string | null>(null)
  const sel = 'w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark'

  const confirmar = () => {
    const dto = { productoId: producto.id, bodegaId, cantidad: Number(cantidad), motivo, observaciones: observaciones.trim() }
    const res = ajusteSchema.safeParse(dto)
    if (!res.success) { setError(res.error.issues[0]?.message ?? 'Revise el formulario'); return }
    onConfirmar(dto)
  }

  return (
    <Modal open onClose={onClose} title={`Ajustar stock — ${producto.nombre}`}>
      <div className="space-y-3">
        {error && <p className="rounded-md bg-rojo/10 px-3 py-2 text-sm text-rojo">{error}</p>}
        <FormField label="Bodega" htmlFor="aj-bodega">
          <select id="aj-bodega" className={sel} value={bodegaId} onChange={(e) => setBodegaId(Number(e.target.value))}>
            <option value={0}>Seleccione…</option>
            {(bodegas.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </select>
        </FormField>
        <FormField label="Cantidad (+ incrementa / − decrementa)" htmlFor="aj-cant"><Input id="aj-cant" type="number" value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} /></FormField>
        <FormField label="Motivo" htmlFor="aj-motivo">
          <select id="aj-motivo" className={sel} value={motivo} onChange={(e) => setMotivo(e.target.value)}>
            {MOTIVOS_AJUSTE.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </FormField>
        <FormField label="Observaciones" htmlFor="aj-obs"><Input id="aj-obs" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} /></FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={confirmar} disabled={cargando}>{cargando ? 'Procesando…' : 'Confirmar ajuste'}</Button>
        </div>
      </div>
    </Modal>
  )
}
```

```tsx
// src/features/inventario/components/TrasladoStockModal.tsx
import { useState } from 'react'
import { Modal, Button, FormField, Input } from '@/design-system'
import { useBodegas } from '@/features/facturacion/hooks'
import { trasladoSchema } from '../schemas'
import type { TrasladoInventarioDto } from '../types'

interface Props { producto: { id: number; nombre: string }; sucursalId: number; onConfirmar: (dto: TrasladoInventarioDto) => void; onClose: () => void; cargando: boolean }

export function TrasladoStockModal({ producto, sucursalId, onConfirmar, onClose, cargando }: Props) {
  const bodegas = useBodegas(sucursalId)
  const [origen, setOrigen] = useState(0)
  const [destino, setDestino] = useState(0)
  const [cantidad, setCantidad] = useState(0)
  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState<string | null>(null)
  const sel = 'w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark'

  const confirmar = () => {
    const dto = { productoId: producto.id, bodegaOrigenId: origen, bodegaDestinoId: destino, cantidad: Number(cantidad), observaciones: observaciones.trim() || null }
    const res = trasladoSchema.safeParse(dto)
    if (!res.success) { setError(res.error.issues[0]?.message ?? 'Revise el formulario'); return }
    onConfirmar(dto)
  }

  return (
    <Modal open onClose={onClose} title={`Trasladar — ${producto.nombre}`}>
      <div className="space-y-3">
        {error && <p className="rounded-md bg-rojo/10 px-3 py-2 text-sm text-rojo">{error}</p>}
        <FormField label="Bodega origen" htmlFor="tr-origen">
          <select id="tr-origen" className={sel} value={origen} onChange={(e) => setOrigen(Number(e.target.value))}>
            <option value={0}>Seleccione…</option>{(bodegas.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </select>
        </FormField>
        <FormField label="Bodega destino" htmlFor="tr-destino">
          <select id="tr-destino" className={sel} value={destino} onChange={(e) => setDestino(Number(e.target.value))}>
            <option value={0}>Seleccione…</option>{(bodegas.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </select>
        </FormField>
        <FormField label="Cantidad" htmlFor="tr-cant"><Input id="tr-cant" type="number" value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} /></FormField>
        <FormField label="Observaciones (opcional)" htmlFor="tr-obs"><Input id="tr-obs" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} /></FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={confirmar} disabled={cargando}>{cargando ? 'Procesando…' : 'Confirmar traslado'}</Button>
        </div>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npx vitest run src/features/inventario/components/AjusteStockModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Build + commit**

```bash
npm run build
git add src/features/inventario/components/AjusteStockModal.* src/features/inventario/components/TrasladoStockModal.tsx
git commit -m "feat(f6): modales de ajuste y traslado de stock"
```

---

### Task 12: `StockTable` + pestaña Existencias

**Files:**
- Create: `src/features/inventario/components/ExistenciasTab.tsx`
- Test: `src/features/inventario/components/ExistenciasTab.test.tsx`

**Interfaces:**
- Consumes: `useStock`, `useBajoMinimo`, `useSinMovimiento`, `useAjustarStock`, `useTrasladarStock`, `AjusteStockModal`, `TrasladoStockModal`, `useAuthStore` (sucursal), `useToast`.
- Produces: `ExistenciasTab()`. Sub-vistas (todas / bajo-mínimo / sin-movimiento) con un selector; tabla de stock por bodega con badge de bajo-mínimo; búsqueda; acciones Ajustar/Trasladar por fila (abren modal con `{ id, nombre }` del producto y la sucursal activa).

- [ ] **Step 1: Escribir el test**

```tsx
// src/features/inventario/components/ExistenciasTab.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { ToastProvider } from '@/design-system'
import { inventarioHandlers } from '@/test/msw/inventario-handlers'
import { ExistenciasTab } from './ExistenciasTab'

const base = 'http://localhost:8080/api'
const server = setupServer(...inventarioHandlers, http.get(`${base}/bodegas/sucursal/:id`, () => HttpResponse.json([{ id: 1, nombre: 'Bodega Principal' }])))
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}><ToastProvider>{children}</ToastProvider></QueryClientProvider>
}

describe('ExistenciasTab', () => {
  it('muestra el stock por bodega', async () => {
    render(<ExistenciasTab />, { wrapper })
    await waitFor(() => expect(screen.getByText('Producto de prueba')).toBeInTheDocument())
    expect(screen.getByText('Bodega Principal')).toBeInTheDocument()
  })
  it('abre el modal de ajuste', async () => {
    render(<ExistenciasTab />, { wrapper })
    await waitFor(() => screen.getByText('Producto de prueba'))
    fireEvent.click(screen.getAllByRole('button', { name: /ajustar/i })[0])
    await waitFor(() => expect(screen.getByRole('button', { name: /confirmar ajuste/i })).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/features/inventario/components/ExistenciasTab.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```tsx
// src/features/inventario/components/ExistenciasTab.tsx
import { useState } from 'react'
import { Input, Spinner, EmptyState, Badge, Button, useToast } from '@/design-system'
import { useAuthStore } from '@/app/auth-store'
import { useStock, useBajoMinimo, useSinMovimiento, useAjustarStock, useTrasladarStock } from '../hooks'
import { AjusteStockModal } from './AjusteStockModal'
import { TrasladoStockModal } from './TrasladoStockModal'
import type { AjusteInventarioDto, TrasladoInventarioDto } from '../types'

type Vista = 'todas' | 'bajo' | 'sin'
const fmt = (n: number) => `$${n.toFixed(2)}`

export function ExistenciasTab() {
  const user = useAuthStore((s) => s.user)
  const sucursalId = user?.sucursalIds?.[0] ?? 2
  const toast = useToast()
  const [vista, setVista] = useState<Vista>('todas')
  const [search, setSearch] = useState('')
  const stock = useStock({ search: search || undefined, page: 1, pageSize: 50 })
  const bajo = useBajoMinimo()
  const sin = useSinMovimiento()
  const ajustar = useAjustarStock()
  const trasladar = useTrasladarStock()
  const [ajusteProd, setAjusteProd] = useState<{ id: number; nombre: string } | null>(null)
  const [trasladoProd, setTrasladoProd] = useState<{ id: number; nombre: string } | null>(null)
  const sel = 'rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-surface-dark'

  const onAjustar = async (dto: AjusteInventarioDto) => {
    try { await ajustar.mutateAsync(dto); toast.show('Ajuste registrado'); setAjusteProd(null) }
    catch (e) { toast.show((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'No se pudo ajustar', { tone: 'rojo' }) }
  }
  const onTrasladar = async (dto: TrasladoInventarioDto) => {
    try { await trasladar.mutateAsync(dto); toast.show('Traslado registrado'); setTrasladoProd(null) }
    catch (e) { toast.show((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'No se pudo trasladar', { tone: 'rojo' }) }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <select className={sel} value={vista} onChange={(e) => setVista(e.target.value as Vista)}>
          <option value="todas">Todas las existencias</option>
          <option value="bajo">Bajo mínimo</option>
          <option value="sin">Sin movimiento</option>
        </select>
        {vista === 'todas' && <Input placeholder="Buscar producto" value={search} onChange={(e) => setSearch(e.target.value)} />}
      </div>

      {vista === 'todas' && (
        stock.isLoading ? <Spinner /> : !stock.data?.items.length ? <EmptyState title="Sin existencias" hint="No hay stock para mostrar." /> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wide text-slate/70"><th className="py-2">Producto</th><th>Bodega</th><th className="text-right">Disponible</th><th className="text-right">Costo prom.</th><th className="text-right">Valor</th><th /></tr></thead>
            <tbody>
              {stock.data.items.map((s) => {
                const bajoMin = s.stockMinimo != null && s.cantidadDisponible <= s.stockMinimo
                return (
                  <tr key={`${s.productoId}-${s.bodegaId}`} className="border-t border-hairline">
                    <td className="py-2">{s.productoNombre} {bajoMin && <Badge estado="rechazado">Bajo mínimo</Badge>}</td>
                    <td>{s.bodegaNombre}</td>
                    <td className="cifra text-right">{s.cantidadDisponible}</td>
                    <td className="cifra text-right">{fmt(s.costoPromedio)}</td>
                    <td className="cifra text-right">{fmt(s.valorStock)}</td>
                    <td className="space-x-2 text-right">
                      <Button variant="ghost" onClick={() => setAjusteProd({ id: s.productoId, nombre: s.productoNombre })}>Ajustar</Button>
                      <Button variant="ghost" onClick={() => setTrasladoProd({ id: s.productoId, nombre: s.productoNombre })}>Trasladar</Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )
      )}

      {vista === 'bajo' && (
        bajo.isLoading ? <Spinner /> : !bajo.data?.length ? <EmptyState title="Todo en orden" hint="No hay productos bajo mínimo." /> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wide text-slate/70"><th className="py-2">Producto</th><th className="text-right">Mínimo</th><th className="text-right">Actual</th><th>Estado</th></tr></thead>
            <tbody>{bajo.data.map((b) => <tr key={b.productoId} className="border-t border-hairline"><td className="py-2">{b.productoNombre}</td><td className="cifra text-right">{b.stockMinimo}</td><td className="cifra text-right">{b.stockActual}</td><td>{b.estado}</td></tr>)}</tbody>
          </table>
        )
      )}

      {vista === 'sin' && (
        sin.isLoading ? <Spinner /> : !sin.data?.length ? <EmptyState title="Sin resultados" hint="No hay productos sin movimiento." /> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wide text-slate/70"><th className="py-2">Producto</th><th className="text-right">Stock</th><th className="text-right">Días sin mov.</th></tr></thead>
            <tbody>{sin.data.map((p) => <tr key={p.productoId} className="border-t border-hairline"><td className="py-2">{p.productoNombre}</td><td className="cifra text-right">{p.stockActual}</td><td className="text-right">{p.diasSinMovimiento}</td></tr>)}</tbody>
          </table>
        )
      )}

      {ajusteProd && <AjusteStockModal producto={ajusteProd} sucursalId={sucursalId} onConfirmar={onAjustar} onClose={() => setAjusteProd(null)} cargando={ajustar.isPending} />}
      {trasladoProd && <TrasladoStockModal producto={trasladoProd} sucursalId={sucursalId} onConfirmar={onTrasladar} onClose={() => setTrasladoProd(null)} cargando={trasladar.isPending} />}
    </div>
  )
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npx vitest run src/features/inventario/components/ExistenciasTab.test.tsx`
Expected: PASS.

- [ ] **Step 5: Build + commit**

```bash
npm run build
git add src/features/inventario/components/ExistenciasTab.*
git commit -m "feat(f6): pestaña de existencias con ajuste y traslado"
```

---

### Task 13: `MovimientosTab` + Kardex

**Files:**
- Create: `src/features/inventario/components/MovimientosTab.tsx`
- Test: `src/features/inventario/components/MovimientosTab.test.tsx`

**Interfaces:**
- Consumes: `useMovimientos`, `useKardex`, `Input`, `Spinner`, `EmptyState`, `Button`.
- Produces: `MovimientosTab()`. Rango de fechas (por defecto último mes) obligatorio; tabla de movimientos (fecha/tipo/producto/bodega/cantidad/saldo); botón "Kardex" por producto que abre un panel con el kardex (saldos + movimientos). Default de fechas calculado en el render (sin `Date.now()` prohibido en scripts — aquí es app real, `new Date()` está permitido en componentes).

- [ ] **Step 1: Escribir el test**

```tsx
// src/features/inventario/components/MovimientosTab.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { inventarioHandlers } from '@/test/msw/inventario-handlers'
import { MovimientosTab } from './MovimientosTab'

const server = setupServer(...inventarioHandlers)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('MovimientosTab', () => {
  it('lista movimientos', async () => {
    render(<MovimientosTab />, { wrapper })
    await waitFor(() => expect(screen.getByText('COMPRA_EXTERNA')).toBeInTheDocument())
  })
  it('abre el kardex de un producto', async () => {
    render(<MovimientosTab />, { wrapper })
    await waitFor(() => screen.getByText('COMPRA_EXTERNA'))
    fireEvent.click(screen.getAllByRole('button', { name: /kardex/i })[0])
    await waitFor(() => expect(screen.getByText(/saldo final/i)).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/features/inventario/components/MovimientosTab.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```tsx
// src/features/inventario/components/MovimientosTab.tsx
import { useState } from 'react'
import { Input, FormField, Spinner, EmptyState, Button } from '@/design-system'
import { useMovimientos, useKardex } from '../hooks'

function hace(dias: number) {
  const d = new Date(); d.setDate(d.getDate() - dias)
  return d.toISOString().slice(0, 10)
}
function hoy() { return new Date().toISOString().slice(0, 10) }
const fmt = (n: number) => `$${n.toFixed(2)}`

export function MovimientosTab() {
  const [desde, setDesde] = useState(hace(30))
  const [hasta, setHasta] = useState(hoy())
  const [kardexProd, setKardexProd] = useState<number | null>(null)
  const movs = useMovimientos({ desde, hasta, page: 1, pageSize: 50 })
  const kardex = useKardex(kardexProd ?? 0, { desde, hasta, page: 1, pageSize: 50 })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <FormField label="Desde" htmlFor="mv-desde"><Input id="mv-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></FormField>
        <FormField label="Hasta" htmlFor="mv-hasta"><Input id="mv-hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></FormField>
      </div>

      {movs.isLoading ? <Spinner /> : !movs.data?.items.length ? <EmptyState title="Sin movimientos" hint="No hay movimientos en el rango." /> : (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-wide text-slate/70"><th className="py-2">Fecha</th><th>Tipo</th><th>Documento</th><th>Producto</th><th>Bodega</th><th className="text-right">Cantidad</th><th className="text-right">Saldo</th><th /></tr></thead>
          <tbody>
            {movs.data.items.map((m) => (
              <tr key={m.id} className="border-t border-hairline">
                <td className="py-2">{m.fechaMovimiento?.slice(0, 10)}</td>
                <td>{m.tipoMovimiento}</td>
                <td>{m.tipoDocumento}{m.numeroDocumento ? ` ${m.numeroDocumento}` : ''}</td>
                <td>{m.productoNombre}</td>
                <td>{m.bodegaNombre}</td>
                <td className="cifra text-right">{m.cantidad}</td>
                <td className="cifra text-right">{m.nuevoSaldo}</td>
                <td className="text-right"><Button variant="ghost" onClick={() => setKardexProd(m.productoId)}>Kardex</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {kardexProd != null && (
        <div className="rounded-xl border border-hairline p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold text-ink">Kardex {kardex.data ? `— ${kardex.data.productoNombre}` : ''}</h3>
            <button type="button" className="text-xs text-slate" onClick={() => setKardexProd(null)}>Cerrar</button>
          </div>
          {kardex.isLoading || !kardex.data ? <Spinner /> : (
            <>
              <div className="grid grid-cols-4 gap-2 text-sm">
                <div>Saldo inicial<br /><span className="cifra">{kardex.data.saldoInicial}</span></div>
                <div>Entradas<br /><span className="cifra">{kardex.data.totalEntradas}</span></div>
                <div>Salidas<br /><span className="cifra">{kardex.data.totalSalidas}</span></div>
                <div>Saldo final<br /><span className="cifra">{kardex.data.saldoFinal}</span></div>
              </div>
              <table className="mt-3 w-full text-sm">
                <thead><tr className="text-left text-xs uppercase tracking-wide text-slate/70"><th className="py-1">Fecha</th><th>Tipo</th><th className="text-right">Cantidad</th><th className="text-right">Saldo</th></tr></thead>
                <tbody>{kardex.data.movimientos.items.map((m) => <tr key={m.id} className="border-t border-hairline"><td className="py-1">{m.fechaMovimiento?.slice(0, 10)}</td><td>{m.tipoMovimiento}</td><td className="cifra text-right">{m.cantidad}</td><td className="cifra text-right">{m.nuevoSaldo}</td></tr>)}</tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npx vitest run src/features/inventario/components/MovimientosTab.test.tsx`
Expected: PASS.

- [ ] **Step 5: Build + commit**

```bash
npm run build
git add src/features/inventario/components/MovimientosTab.*
git commit -m "feat(f6): pestaña de movimientos con kardex"
```

---

### Task 14: `StockPage` (índice con pestañas Existencias/Movimientos)

**Files:**
- Create: `src/features/inventario/pages/StockPage.tsx`
- Test: `src/features/inventario/pages/StockPage.test.tsx`

**Interfaces:**
- Consumes: `Tabs`, `ExistenciasTab`, `MovimientosTab`.
- Produces: `StockPage()` con pestañas Existencias/Movimientos.

- [ ] **Step 1: Escribir el test**

```tsx
// src/features/inventario/pages/StockPage.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { ToastProvider } from '@/design-system'
import { inventarioHandlers } from '@/test/msw/inventario-handlers'
import { StockPage } from './StockPage'

const base = 'http://localhost:8080/api'
const server = setupServer(...inventarioHandlers, http.get(`${base}/bodegas/sucursal/:id`, () => HttpResponse.json([{ id: 1, nombre: 'Bodega Principal' }])))
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}><ToastProvider>{children}</ToastProvider></QueryClientProvider>
}

describe('StockPage', () => {
  it('muestra existencias por defecto y cambia a movimientos', async () => {
    render(<StockPage />, { wrapper })
    await waitFor(() => expect(screen.getByText('Producto de prueba')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('tab', { name: /movimientos/i }))
    await waitFor(() => expect(screen.getByText('COMPRA_EXTERNA')).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/features/inventario/pages/StockPage.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```tsx
// src/features/inventario/pages/StockPage.tsx
import { useState } from 'react'
import { Tabs } from '@/design-system'
import { ExistenciasTab } from '../components/ExistenciasTab'
import { MovimientosTab } from '../components/MovimientosTab'

const TABS = [{ id: 'existencias', label: 'Existencias' }, { id: 'movimientos', label: 'Movimientos' }]

export function StockPage() {
  const [tab, setTab] = useState('existencias')
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold text-ink">Stock</h1>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'existencias' && <ExistenciasTab />}
      {tab === 'movimientos' && <MovimientosTab />}
    </div>
  )
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npx vitest run src/features/inventario/pages/StockPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Build + commit**

```bash
npm run build
git add src/features/inventario/pages/StockPage.*
git commit -m "feat(f6): página de stock con pestañas"
```

---

### Task 15: `ReportesInventarioPage`

**Files:**
- Create: `src/features/inventario/pages/ReportesInventarioPage.tsx`
- Test: `src/features/inventario/pages/ReportesInventarioPage.test.tsx`

**Interfaces:**
- Consumes: `useKpis`, `useValoracion`, `useRotacion`, `useRotacionAbc`, `Tabs`, `Spinner`, `EmptyState`.
- Produces: `ReportesInventarioPage()` con pestañas KPIs / Valorizado / Rotación / ABC. KPIs como tarjetas; los demás como tablas. (CMV se muestra dentro de KPIs vía `costoMercanciaVendidaMesActual`.)

- [ ] **Step 1: Escribir el test**

```tsx
// src/features/inventario/pages/ReportesInventarioPage.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { inventarioHandlers } from '@/test/msw/inventario-handlers'
import { ReportesInventarioPage } from './ReportesInventarioPage'

const server = setupServer(...inventarioHandlers)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('ReportesInventarioPage', () => {
  it('muestra las tarjetas de KPIs', async () => {
    render(<ReportesInventarioPage />, { wrapper })
    await waitFor(() => expect(screen.getByText(/valor total/i)).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/features/inventario/pages/ReportesInventarioPage.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```tsx
// src/features/inventario/pages/ReportesInventarioPage.tsx
import { useState } from 'react'
import { Tabs, Spinner, EmptyState } from '@/design-system'
import { useKpis, useValoracion, useRotacion, useRotacionAbc } from '../hooks'

const TABS = [{ id: 'kpis', label: 'KPIs' }, { id: 'valorizado', label: 'Valorizado' }, { id: 'rotacion', label: 'Rotación' }, { id: 'abc', label: 'ABC' }]
const fmt = (n: number) => `$${n.toFixed(2)}`

function Card({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-hairline px-3 py-2 text-sm"><div className="text-slate">{label}</div><div className="cifra text-lg text-ink">{value}</div></div>
}

export function ReportesInventarioPage() {
  const [tab, setTab] = useState('kpis')
  const kpis = useKpis()
  const valoracion = useValoracion()
  const rotacion = useRotacion()
  const abc = useRotacionAbc()

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold text-ink">Reportes de inventario</h1>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'kpis' && (kpis.isLoading || !kpis.data ? <Spinner /> : (
        <div className="grid gap-3 md:grid-cols-4">
          <Card label="Total productos" value={String(kpis.data.totalProductos)} />
          <Card label="Valor total del inventario" value={fmt(kpis.data.valorTotalInventario)} />
          <Card label="Bajo mínimo" value={String(kpis.data.productosBajoMinimo)} />
          <Card label="Sin stock" value={String(kpis.data.productosSinStock)} />
          <Card label="Movimientos (mes)" value={String(kpis.data.totalMovimientosUltimoMes)} />
          <Card label="CMV (mes)" value={fmt(kpis.data.costoMercanciaVendidaMesActual)} />
          <Card label="Compras (mes)" value={fmt(kpis.data.valorComprasMesActual)} />
          <Card label="Días promedio inv." value={String(kpis.data.diasPromedioInventario)} />
        </div>
      ))}

      {tab === 'valorizado' && (valoracion.isLoading || !valoracion.data ? <Spinner /> : !valoracion.data.detalleProductos.length ? <EmptyState title="Sin datos" hint="No hay valorización para mostrar." /> : (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-wide text-slate/70"><th className="py-2">Producto</th><th className="text-right">Cantidad</th><th className="text-right">Costo prom.</th><th className="text-right">Valor</th><th className="text-right">% del total</th></tr></thead>
          <tbody>{valoracion.data.detalleProductos.map((p) => <tr key={p.productoId} className="border-t border-hairline"><td className="py-2">{p.productoNombre}</td><td className="cifra text-right">{p.cantidad}</td><td className="cifra text-right">{fmt(p.costoPromedio)}</td><td className="cifra text-right">{fmt(p.valorTotal)}</td><td className="text-right">{p.porcentajeDelTotal.toFixed(1)}%</td></tr>)}</tbody>
        </table>
      ))}

      {tab === 'rotacion' && (rotacion.isLoading ? <Spinner /> : !rotacion.data?.length ? <EmptyState title="Sin datos" hint="No hay rotación para mostrar." /> : (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-wide text-slate/70"><th className="py-2">Producto</th><th className="text-right">Vendido</th><th className="text-right">Índice</th><th className="text-right">Días inv.</th><th>Clase</th></tr></thead>
          <tbody>{rotacion.data.map((r) => <tr key={r.productoId} className="border-t border-hairline"><td className="py-2">{r.productoNombre}</td><td className="cifra text-right">{r.cantidadVendida}</td><td className="cifra text-right">{r.indiceRotacion.toFixed(2)}</td><td className="text-right">{r.diasPromediInventario}</td><td>{r.clasificacion}</td></tr>)}</tbody>
        </table>
      ))}

      {tab === 'abc' && (abc.isLoading ? <Spinner /> : !abc.data?.length ? <EmptyState title="Sin datos" hint="No hay clasificación ABC para mostrar." /> : (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-wide text-slate/70"><th className="py-2">Producto</th><th className="text-right">Unidades</th><th className="text-right">Valor vendido</th><th className="text-right">% acum.</th><th>Clase</th></tr></thead>
          <tbody>{abc.data.map((a) => <tr key={a.productoId} className="border-t border-hairline"><td className="py-2">{a.productoNombre}</td><td className="cifra text-right">{a.unidadesVendidas}</td><td className="cifra text-right">{fmt(a.valorVendido)}</td><td className="text-right">{a.porcentajeAcumulado.toFixed(1)}%</td><td>{a.clasificacion}</td></tr>)}</tbody>
        </table>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npx vitest run src/features/inventario/pages/ReportesInventarioPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Build + commit**

```bash
npm run build
git add src/features/inventario/pages/ReportesInventarioPage.*
git commit -m "feat(f6): página de reportes de inventario"
```

---

### Task 16: Cableado de rutas, navegación y sidebar

**Files:**
- Modify: `src/app/router.tsx` (imports + rutas)
- Modify: `src/app/nav-config.ts` (sección Inventario a 3 entradas)
- Test: `src/app/router.inventario.test.tsx`

**Interfaces:**
- Consumes: `ProductosPage`, `ProductoFormPage`, `StockPage`, `ReportesInventarioPage`.
- Produces: rutas `/inventario/productos`, `/inventario/productos/nuevo`, `/inventario/productos/:id/editar`, `/inventario/stock`, `/inventario/reportes`; sección de nav "Inventario" con Productos/Stock/Reportes.

- [ ] **Step 1: Escribir el test de rutas** (replicar el setup de auth de `src/app/router.dtes.test.tsx`).

```tsx
// src/app/router.inventario.test.tsx
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
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())

function renderEn(ruta: string) {
  useAuthStore.setState({ token: 't', user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 5, rolNombre: 'EmisorAdmin', emisorId: 3, emisorNombre: 'E', sucursalIds: [2], accesoTodasSucursales: true, permisos: [] } } as never)
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><ToastProvider><MemoryRouter initialEntries={[ruta]}><AppRoutes /></MemoryRouter></ToastProvider></QueryClientProvider>)
}

describe('rutas inventario', () => {
  it('monta productos', async () => {
    renderEn('/inventario/productos')
    await waitFor(() => expect(screen.getByText('Productos y servicios')).toBeInTheDocument())
  })
  it('monta stock', async () => {
    renderEn('/inventario/stock')
    await waitFor(() => expect(screen.getByText('Stock')).toBeInTheDocument())
  })
  it('monta reportes', async () => {
    renderEn('/inventario/reportes')
    await waitFor(() => expect(screen.getByText('Reportes de inventario')).toBeInTheDocument())
  })
})
```

> NOTA: ABRE `src/app/router.dtes.test.tsx` y replica su forma EXACTA de sembrar la sesión y envolver el render; ajusta el `useAuthStore.setState` a la forma real del store antes de correr.

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/app/router.inventario.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Añadir imports y rutas en `router.tsx`**

Imports al tope:
```ts
import { ProductosPage } from '@/features/inventario/pages/ProductosPage'
import { ProductoFormPage } from '@/features/inventario/pages/ProductoFormPage'
import { StockPage } from '@/features/inventario/pages/StockPage'
import { ReportesInventarioPage } from '@/features/inventario/pages/ReportesInventarioPage'
```
Rutas dentro de `<Route element={<AppLayout />}>` (las estáticas `/nuevo` antes de la dinámica `/:id/editar`):
```tsx
          <Route path="/inventario/productos" element={<ProductosPage />} />
          <Route path="/inventario/productos/nuevo" element={<ProductoFormPage />} />
          <Route path="/inventario/productos/:id/editar" element={<ProductoFormPage />} />
          <Route path="/inventario/stock" element={<StockPage />} />
          <Route path="/inventario/reportes" element={<ReportesInventarioPage />} />
```

- [ ] **Step 4: Actualizar la sección "Inventario" en `nav-config.ts`**

```ts
  { title: 'Inventario', items: [
    { label: 'Productos', to: '/inventario/productos', icon: 'productos' },
    { label: 'Stock', to: '/inventario/stock', icon: 'stock' },
    { label: 'Reportes', to: '/inventario/reportes', icon: 'historial' },
  ] },
```

- [ ] **Step 5: Correr y verificar que pasa** (+ `nav-config.test.ts` si valida la sección)

Run: `npx vitest run src/app/router.inventario.test.tsx src/app/nav-config.test.ts`
Expected: PASS. (Si `nav-config.test.ts` cuenta secciones/rutas, actualizarlo.)

- [ ] **Step 6: Build + commit**

```bash
npm run build
git add src/app/router.tsx src/app/nav-config.ts src/app/router.inventario.test.tsx src/app/nav-config.test.ts
git commit -m "feat(f6): rutas y navegación de inventario"
```

---

### Task 17: Suite completa, e2e contra Docker y revisión final (CONTROLADOR)

> Esta tarea la ejecuta el controlador (no subagentes).

- [ ] **Step 1: Suite + build + lint completos**

Run:
```bash
npm run test
npm run build
npm run lint
```
Expected: todo verde. Corregir fallos de tsc/ESLint (recordar `react-hooks/set-state-in-effect`, `import/first`).

- [ ] **Step 2: Levantar Docker**

```bash
docker ps   # si no corre: docker compose up -d desde FraFactu-Backend
```
Seed: `admin@pruebas.local`/`Pruebas#2026`, emisorId3, sucursalId2, bodega1, producto P001=id2. Unidad "Unidad" = Id catálogo 39.

- [ ] **Step 3: e2e manual del flujo** (navegador o API contra el backend Docker)

1. Crear un producto nuevo (con categoría/marca alta-rápida; probar uno con tipoInventario=MobiliarioEquipo y sus campos de activo fijo). Verificar 201 y que aparece en el listado.
2. Editar el producto; verificar PUT y precarga.
3. Toggle activo/inactivo y filtro "incluir inactivos".
4. Existencias: ver stock de P001; **Ajustar** (+/−, motivo, observaciones ≥10) → verificar `stock_bodegas` actualizado; **Trasladar** entre bodegas (si hay ≥2, sembrar una segunda) → verificar saldos.
5. Movimientos: ver el movimiento del ajuste; abrir Kardex de P001 (saldos + lista).
6. Reportes: KPIs, valorizado, rotación, ABC (verificar que cargan; pueden venir vacíos según datos).

Verificar BD:
```bash
docker exec frafactu-db psql -U frafactu -d frafactu -c 'SELECT "ProductoId","BodegaId","CantidadDisponible","CostoPromedio" FROM stock_bodegas;'
```
Ajustar el frontend ante cualquier gap de contrato (lección S1–S6: emitir con la forma EXACTA y corregir donde esté el bug).

- [ ] **Step 4: Revisión final whole-branch (opus)**

Revisar TODO el diff de la rama de una vez (bugs cross-task). Corregir y commitear.

- [ ] **Step 5: Actualizar memoria + ledger SDD**

- [ ] **Step 6: Push + PR por web**

```bash
git push -u origin feat/f6-inventario
```
Crear el PR por la web hacia `development`. NO mergear por CLI.

---

## Notas de cierre

- **Deudas que NO se abordan:** gating de rol app-wide (se confía en el 403); carga masiva de productos; gráficos en reportes; baja de producto con motivo (queda `useDesactivarProducto` listo para una acción futura); teardown pre-existente en `Combobox.test.tsx`/`DocumentoOriginalSection.test.tsx`.
- **Riesgos principales:** (1) nombres exactos de catálogos (`unidadesMedida`/`tiposItems`) y de `useBodegas`/`useSucursales` en facturación — confirmar al implementar Task 9/11; (2) forma exacta de `PagedResult` del backend (campos `items` + total) — confirmar en el e2e de stock/movimientos; (3) el formulario de producto es grande — si crece demasiado, extraer secciones a `components/ProductoFormFields/*` (reportar antes de dividir).
