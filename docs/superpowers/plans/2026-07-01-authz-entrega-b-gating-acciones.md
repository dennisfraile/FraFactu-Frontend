# Entrega B — Gating de acciones por rol — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ocultar cada disparador de operación de escritura del frontend a los roles que el backend no autoriza, espejando los `[Authorize(Roles=...)]` de los controllers.

**Architecture:** Dos capas. (1) Matriz central `src/lib/authz/acciones.ts` con constantes `RolNombre[]` por acción. (2) `<Can roles={CONST} fallback={null}>` en ~28 disparadores de 5 features + un endurecimiento de ruta en `router.tsx`. Sobre el módulo authz ya existente de la Entrega A (`useAuthz`, `<Can>`, `RoleRoute`).

**Tech Stack:** React 18 + TypeScript + Vite 7, Vitest 3 + Testing Library, MSW, TanStack Query, react-router-dom, Zustand (`useAuthStore`).

## Global Constraints

- Rama: `feat/authz-entrega-b` (ya creada desde `development`).
- `<Can>` vive en `@/lib/authz/Can`; firma `<Can roles={RolNombre[]} fallback?={ReactNode}>children</Can>`; oculta children si el rol del usuario no está en `roles`. Usar `fallback` por defecto (null).
- Gating **por rol** (`user.rolNombre`), NO por `permisos`. `useAuthz()` ya lee `useAuthStore` → `user.rolNombre`.
- Imports SIEMPRE al tope del archivo. No `useEffect`+`setState`.
- El objeto `<Can roles={...}>` recibe un `RolNombre[]`; las constantes de `acciones.ts` ya son `RolNombre[]`, se pasan directas: `<Can roles={COMPRA_ESCRIBIR}>`.
- Cada tarea termina con la suite del feature verde. La verificación global (Task 10) corre `npm run test`, `npm run lint`, `npm run build`.
- Comando de test único: `npx vitest run <ruta>` (no watch).
- Patrón de autenticación en tests (copiar verbatim, variando `rolNombre`):
  ```ts
  useAuthStore.setState({
    token: 't', status: 'authenticated',
    user: { userId: 1, nombreCompleto: 'X', email: 'x@x.com', rolId: 1, rolNombre: 'EmisorAdmin', emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] },
  })
  ```

---

## File Structure

- `src/lib/authz/roles.ts` — **Modify**: añadir rol `EncargadoInventario`.
- `src/lib/authz/acciones.ts` — **Create**: matriz de constantes por acción.
- `src/lib/authz/acciones.test.ts` — **Create**: verifica membresía de cada constante.
- `src/app/router.tsx` — **Modify**: separar rutas de form de producto a `RoleRoute` de escritura.
- `src/app/router.inventario.test.tsx` — **Modify**: test de la ruta endurecida.
- `src/features/compras/pages/{ComprasListPage,CompraDetallePage,ProveedoresPage}.tsx` + sus `.test.tsx` — **Modify**.
- `src/features/facturacion/pages/DteDetallePage.tsx` + `.test.tsx` — **Modify**.
- `src/features/inventario/components/{ProductosTab,CategoriasTab,MarcasTab,ExistenciasTab}.tsx` — **Modify**; tests: `CategoriasTab.test.tsx`, `ExistenciasTab.test.tsx` (Modify), `ProductosTab.test.tsx`, `MarcasTab.test.tsx` (Create).
- `src/features/cuentas-por-cobrar/components/PlanCuotasTable.tsx`, `pages/PlanDetallePage.tsx` + sus `.test.tsx` — **Modify**.
- `src/features/dtes-recibidos/pages/{DtesRecibidosListPage,DteRecibidoDetallePage}.tsx` + sus `.test.tsx` — **Modify**.
- `src/features/usuarios/pages/UsuariosPage.tsx`, `components/UsuariosTable.tsx` — **Modify**: consumir `USUARIOS_ESCRIBIR` del módulo central (eliminar duplicado).

---

## Task 1: Añadir rol `EncargadoInventario` a `roles.ts`

**Files:**
- Modify: `src/lib/authz/roles.ts`
- Test: `src/lib/authz/roles.test.ts` (ya existe)

**Interfaces:**
- Produces: `type RolNombre` ahora incluye `'EncargadoInventario'`; `ROLES` incluye el string.

- [ ] **Step 1: Escribir el test que falla**

Añadir al final del `describe` en `src/lib/authz/roles.test.ts`:

```ts
it('incluye EncargadoInventario como rol válido', () => {
  expect(ROLES).toContain('EncargadoInventario')
  expect(puede('EncargadoInventario', ['EncargadoInventario'])).toBe(true)
})
```

Asegúrate de que `ROLES` y `puede` estén importados en el archivo (ya lo están si el test existente los usa; si no, `import { ROLES, puede } from './roles'`).

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/lib/authz/roles.test.ts`
Expected: FAIL — `ROLES` no contiene `'EncargadoInventario'`.

- [ ] **Step 3: Implementar**

En `src/lib/authz/roles.ts`, añadir el rol al type y al array:

```ts
export type RolNombre =
  | 'SuperAdmin'
  | 'EmisorAdmin'
  | 'GerenteSucursal'
  | 'Cajero'
  | 'Auditor'
  | 'Contador'
  | 'EncargadoInventario'

export const ROLES: RolNombre[] = [
  'SuperAdmin', 'EmisorAdmin', 'GerenteSucursal', 'Cajero', 'Auditor', 'Contador', 'EncargadoInventario',
]
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run src/lib/authz/roles.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/authz/roles.ts src/lib/authz/roles.test.ts
git commit -m "feat(authz): añadir rol EncargadoInventario a RolNombre/ROLES"
```

---

## Task 2: Módulo central de la matriz `acciones.ts`

**Files:**
- Create: `src/lib/authz/acciones.ts`
- Create: `src/lib/authz/acciones.test.ts`

**Interfaces:**
- Produces (todas `RolNombre[]`): `FACTURA_CREAR`, `FACTURA_ANULAR`, `COMPRA_ESCRIBIR`, `PROVEEDOR_ESCRIBIR`, `CXC_PAGAR`, `CXC_REFINANCIAR`, `PRODUCTO_ESCRIBIR`, `CATALOGO_ESCRIBIR`, `CATALOGO_ELIMINAR`, `INVENTARIO_AJUSTAR`, `DTE_RECIBIDO_GESTIONAR`, `DTE_RECIBIDO_CONFIG`, `USUARIOS_ESCRIBIR`.

- [ ] **Step 1: Escribir el test que falla**

Crear `src/lib/authz/acciones.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import * as A from './acciones'

describe('matriz de acciones (espejo del backend)', () => {
  it('facturación', () => {
    expect(A.FACTURA_CREAR).toEqual(['EmisorAdmin', 'GerenteSucursal', 'Cajero'])
    expect(A.FACTURA_ANULAR).toEqual(['EmisorAdmin', 'GerenteSucursal'])
  })
  it('compras y proveedores incluyen Contador, no Cajero', () => {
    expect(A.COMPRA_ESCRIBIR).toEqual(['EmisorAdmin', 'GerenteSucursal', 'Contador'])
    expect(A.PROVEEDOR_ESCRIBIR).toEqual(['EmisorAdmin', 'GerenteSucursal', 'Contador'])
    expect(A.COMPRA_ESCRIBIR).not.toContain('Cajero')
  })
  it('cxc: pagar incluye Cajero, refinanciar no', () => {
    expect(A.CXC_PAGAR).toEqual(['EmisorAdmin', 'GerenteSucursal', 'Cajero'])
    expect(A.CXC_REFINANCIAR).toEqual(['EmisorAdmin', 'GerenteSucursal'])
  })
  it('inventario', () => {
    expect(A.PRODUCTO_ESCRIBIR).toEqual(['EmisorAdmin', 'GerenteSucursal'])
    expect(A.CATALOGO_ESCRIBIR).toEqual(['EmisorAdmin', 'GerenteSucursal'])
    expect(A.CATALOGO_ELIMINAR).toEqual(['EmisorAdmin'])
    expect(A.INVENTARIO_AJUSTAR).toEqual(['EmisorAdmin', 'GerenteSucursal', 'EncargadoInventario'])
  })
  it('dtes recibidos: escritura sin Contador, config solo EmisorAdmin', () => {
    expect(A.DTE_RECIBIDO_GESTIONAR).toEqual(['EmisorAdmin', 'GerenteSucursal'])
    expect(A.DTE_RECIBIDO_CONFIG).toEqual(['EmisorAdmin'])
  })
  it('usuarios (Entrega A)', () => {
    expect(A.USUARIOS_ESCRIBIR).toEqual(['SuperAdmin', 'EmisorAdmin', 'GerenteSucursal'])
  })
  it('SuperAdmin NO aparece en gates de features operativos', () => {
    for (const c of [A.FACTURA_CREAR, A.FACTURA_ANULAR, A.COMPRA_ESCRIBIR, A.CXC_PAGAR, A.PRODUCTO_ESCRIBIR, A.INVENTARIO_AJUSTAR]) {
      expect(c).not.toContain('SuperAdmin')
    }
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/lib/authz/acciones.test.ts`
Expected: FAIL — `./acciones` no existe.

- [ ] **Step 3: Implementar**

Crear `src/lib/authz/acciones.ts`:

```ts
// src/lib/authz/acciones.ts
// Matriz rol -> acción. Espejo literal de los [Authorize(Roles=...)] del backend.
// Ver docs/superpowers/specs/2026-07-01-authz-entrega-b-gating-acciones-design.md
import type { RolNombre } from './roles'

// Facturación (FacturasController)
export const FACTURA_CREAR: RolNombre[] = ['EmisorAdmin', 'GerenteSucursal', 'Cajero']
export const FACTURA_ANULAR: RolNombre[] = ['EmisorAdmin', 'GerenteSucursal']

// Compras (ComprasExternasController / ProveedoresController)
export const COMPRA_ESCRIBIR: RolNombre[] = ['EmisorAdmin', 'GerenteSucursal', 'Contador']
export const PROVEEDOR_ESCRIBIR: RolNombre[] = ['EmisorAdmin', 'GerenteSucursal', 'Contador']

// Cuentas por cobrar (CuentasPorCobrarController)
export const CXC_PAGAR: RolNombre[] = ['EmisorAdmin', 'GerenteSucursal', 'Cajero']
export const CXC_REFINANCIAR: RolNombre[] = ['EmisorAdmin', 'GerenteSucursal']

// Inventario (ProductosServiciosController / CategoriasController / MarcasController / InventarioController)
export const PRODUCTO_ESCRIBIR: RolNombre[] = ['EmisorAdmin', 'GerenteSucursal']
export const CATALOGO_ESCRIBIR: RolNombre[] = ['EmisorAdmin', 'GerenteSucursal']
export const CATALOGO_ELIMINAR: RolNombre[] = ['EmisorAdmin']
export const INVENTARIO_AJUSTAR: RolNombre[] = ['EmisorAdmin', 'GerenteSucursal', 'EncargadoInventario']

// DTEs recibidos (DtesRecibidosController)
export const DTE_RECIBIDO_GESTIONAR: RolNombre[] = ['EmisorAdmin', 'GerenteSucursal']
export const DTE_RECIBIDO_CONFIG: RolNombre[] = ['EmisorAdmin']

// Usuarios (UsuariosController) — consolidado desde Entrega A
export const USUARIOS_ESCRIBIR: RolNombre[] = ['SuperAdmin', 'EmisorAdmin', 'GerenteSucursal']
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run src/lib/authz/acciones.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/authz/acciones.ts src/lib/authz/acciones.test.ts
git commit -m "feat(authz): matriz central rol->acción (acciones.ts)"
```

---

## Task 3: Endurecer rutas de formulario de producto

**Files:**
- Modify: `src/app/router.tsx:79-84`
- Test: `src/app/router.inventario.test.tsx`

**Interfaces:**
- Consumes: `RoleRoute` (ya importado en `router.tsx`).
- Produces: `/inventario/productos/nuevo` y `/:id/editar` solo accesibles a `['EmisorAdmin','GerenteSucursal']`.

**Contexto:** Hoy `router.tsx:79` envuelve productos, form nuevo, form editar y stock en un solo `RoleRoute allow={['EmisorAdmin','GerenteSucursal','Cajero','Contador','Auditor']}`. Hay que sacar las 2 rutas de form a su propio grupo de escritura.

- [ ] **Step 1: Escribir el test que falla**

Añadir a `src/app/router.inventario.test.tsx` (usa el patrón de `router.gating.test.tsx`: renderiza `<AppRoutes>` en `MemoryRouter` con `initialEntries`, autenticando vía `useAuthStore`). Añadir estos casos (ajusta el helper `renderAt(path)` si el archivo ya define uno equivalente):

```ts
it('Contador no puede abrir el form de nuevo producto (AccesoDenegado)', async () => {
  useAuthStore.setState({ token: 't', status: 'authenticated', user: { userId: 1, nombreCompleto: 'X', email: 'x@x.com', rolId: 1, rolNombre: 'Contador', emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  renderAt('/inventario/productos/nuevo')
  expect(await screen.findByText(/acceso denegado/i)).toBeInTheDocument()
})
it('EmisorAdmin sí abre el form de nuevo producto', async () => {
  useAuthStore.setState({ token: 't', status: 'authenticated', user: { userId: 1, nombreCompleto: 'X', email: 'x@x.com', rolId: 1, rolNombre: 'EmisorAdmin', emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  renderAt('/inventario/productos/nuevo')
  expect(screen.queryByText(/acceso denegado/i)).toBeNull()
})
```

Si el archivo no tiene un helper `renderAt` ni imports, replica el encabezado de `src/app/router.gating.test.tsx` (mismos imports: `render, screen`, `MemoryRouter`, `AppRoutes`, `useAuthStore`, providers y MSW si aplica). El texto exacto de `AccesoDenegado` es "Acceso denegado" (ver `src/app/AccesoDenegado.tsx`).

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/app/router.inventario.test.tsx`
Expected: FAIL — hoy `Contador` alcanza el form (no ve "Acceso denegado").

- [ ] **Step 3: Implementar**

Reemplazar el bloque `src/app/router.tsx:79-84` por dos grupos:

```tsx
          <Route element={<RoleRoute allow={['EmisorAdmin', 'GerenteSucursal', 'Cajero', 'Contador', 'Auditor']} />}>
            <Route path="/inventario/productos" element={<ProductosPage />} />
            <Route path="/inventario/stock" element={<StockPage />} />
          </Route>
          <Route element={<RoleRoute allow={['EmisorAdmin', 'GerenteSucursal']} />}>
            <Route path="/inventario/productos/nuevo" element={<ProductoFormPage />} />
            <Route path="/inventario/productos/:id/editar" element={<ProductoFormPage />} />
          </Route>
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run src/app/router.inventario.test.tsx`
Expected: PASS. Correr también `npx vitest run src/app/router.test.tsx` para no regресar otras rutas.

- [ ] **Step 5: Commit**

```bash
git add src/app/router.tsx src/app/router.inventario.test.tsx
git commit -m "feat(authz): restringir rutas de form de producto a roles de escritura"
```

---

## Task 4: Gating de acciones en Compras

**Files:**
- Modify: `src/features/compras/pages/ComprasListPage.tsx`, `CompraDetallePage.tsx`, `ProveedoresPage.tsx`
- Test: los tres `.test.tsx` homónimos.

**Interfaces:**
- Consumes: `COMPRA_ESCRIBIR`, `PROVEEDOR_ESCRIBIR` (Task 2); `Can` de `@/lib/authz/Can`.

**Nota de integración:** `ComprasListPage.test.tsx` autentica con `rolNombre: 'Admin'` (rol placeholder inexistente). Al gatear "Nueva compra" con `COMPRA_ESCRIBIR`, con `'Admin'` el botón se ocultaría. Cambiar ese `rolNombre` a `'EmisorAdmin'` en el `beforeEach` existente.

- [ ] **Step 1: Escribir los tests que fallan**

En `ComprasListPage.test.tsx`: cambiar `rolNombre: 'Admin'` → `rolNombre: 'EmisorAdmin'` en el `beforeEach`, y añadir:

```ts
it('EmisorAdmin ve "Nueva compra"', async () => {
  setup()
  expect(await screen.findByText('F-001')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /nueva compra/i })).toBeInTheDocument()
})
it('Auditor no ve "Nueva compra"', async () => {
  useAuthStore.setState({ token: 't', status: 'authenticated', user: { userId: 1, nombreCompleto: 'X', email: 'x@x.com', rolId: 1, rolNombre: 'Auditor', emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  setup()
  expect(await screen.findByText('F-001')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /nueva compra/i })).toBeNull()
})
```

En `CompraDetallePage.test.tsx`: revisar el `beforeEach`; si autentica con un rol no incluido en `COMPRA_ESCRIBIR` (p.ej. `'Admin'` o `'Auditor'`) y hay asserts sobre "Editar/Confirmar/Anular", cambiarlo a `'EmisorAdmin'`. Añadir un caso negativo:

```ts
it('Auditor no ve acciones de compra', async () => {
  useAuthStore.setState({ token: 't', status: 'authenticated', user: { userId: 1, nombreCompleto: 'X', email: 'x@x.com', rolId: 1, rolNombre: 'Auditor', emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  setup() // usa el mismo helper del archivo (carga la compra vía MSW)
  await screen.findByText(/F-/) // espera a que cargue el detalle
  expect(screen.queryByRole('button', { name: /^anular$/i })).toBeNull()
})
```

(Ajusta el `findByText` al dato real que renderiza el helper existente; el punto es esperar a que el detalle cargue antes de aseverar la ausencia.)

En `ProveedoresPage.test.tsx`: si autentica con rol sin escritura y hay asserts sobre "Nuevo proveedor", fijar `'EmisorAdmin'`. Añadir:

```ts
it('Auditor no ve "Nuevo proveedor"', async () => {
  useAuthStore.setState({ token: 't', status: 'authenticated', user: { userId: 1, nombreCompleto: 'X', email: 'x@x.com', rolId: 1, rolNombre: 'Auditor', emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  setup()
  await screen.findByText(/proveedor/i)
  expect(screen.queryByRole('button', { name: /nuevo proveedor/i })).toBeNull()
})
```

- [ ] **Step 2: Correr y verificar que fallan**

Run: `npx vitest run src/features/compras/pages`
Expected: FAIL en los casos negativos (aún sin gating los botones se muestran).

- [ ] **Step 3: Implementar el gating**

`ComprasListPage.tsx`: importar y envolver el botón:

```tsx
import { Can } from '@/lib/authz/Can'
import { COMPRA_ESCRIBIR } from '@/lib/authz/acciones'
```
```tsx
        <h1 className="text-xl font-semibold text-ink">Compras externas</h1>
        <Can roles={COMPRA_ESCRIBIR}>
          <Button onClick={() => navigate('/compras/nueva')}>Nueva compra</Button>
        </Can>
```

`CompraDetallePage.tsx`: importar (`Can`, `COMPRA_ESCRIBIR`) y envolver el bloque de acciones (`src/features/compras/pages/CompraDetallePage.tsx:74-78`):

```tsx
      <Can roles={COMPRA_ESCRIBIR}>
        <div className="flex gap-2">
          {(esBorrador || esConfirmada) && <Button variant="ghost" onClick={() => navigate(`/compras/${compraId}/editar`)}>Editar</Button>}
          {esBorrador && <Button onClick={() => setModal('confirmar')}>Confirmar</Button>}
          {(esBorrador || esConfirmada) && <Button variant="danger" onClick={() => setModal('anular')}>Anular</Button>}
        </div>
      </Can>
```

`ProveedoresPage.tsx`: importar (`Can`, `PROVEEDOR_ESCRIBIR`). Envolver el botón "Nuevo proveedor" y las acciones de fila. Para el botón:

```tsx
        <h1 className="text-xl font-semibold text-ink">Proveedores</h1>
        <Can roles={PROVEEDOR_ESCRIBIR}>
          <Button onClick={() => setEditar(null)}>Nuevo proveedor</Button>
        </Can>
```

Para la columna de acciones (`ProveedoresPage.tsx:33-38`), envolver el contenido del render:

```tsx
    { key: 'acciones', header: '', render: (p: ProveedorDto) => (
      <Can roles={PROVEEDOR_ESCRIBIR}>
        <div className="flex justify-end gap-3">
          <button className="text-xs font-medium text-sello hover:text-sello-bright" onClick={() => setEditar(p)}>Editar</button>
          <button className="text-xs font-medium text-slate hover:text-ink" onClick={() => toggle(p)}>{p.activo ? 'Desactivar' : 'Activar'}</button>
        </div>
      </Can>
    ) },
```

- [ ] **Step 4: Correr y verificar que pasan**

Run: `npx vitest run src/features/compras`
Expected: PASS (incluye los tests de hooks/components existentes del feature).

- [ ] **Step 5: Commit**

```bash
git add src/features/compras
git commit -m "feat(authz): gatear acciones de compras y proveedores por rol"
```

---

## Task 5: Gating de "Anular" en Facturación

**Files:**
- Modify: `src/features/facturacion/pages/DteDetallePage.tsx:42-45`
- Test: `src/features/facturacion/pages/DteDetallePage.test.tsx`

**Interfaces:**
- Consumes: `FACTURA_ANULAR` (Task 2); `Can`.

**Nota:** la ruta `/facturacion/:id` es visible para Cajero/Contador/Auditor (solo lectura); "Anular" debe verlo solo EmisorAdmin/GerenteSucursal.

- [ ] **Step 1: Escribir el test que falla**

En `DteDetallePage.test.tsx`, revisar el `beforeEach`; si autentica con un rol fuera de `FACTURA_ANULAR` y asevera "Anular", fijarlo a `'EmisorAdmin'`. Añadir:

```ts
it('EmisorAdmin ve "Anular"', async () => {
  setup() // helper existente que carga la factura vía MSW
  expect(await screen.findByRole('button', { name: /anular/i })).toBeInTheDocument()
})
it('Cajero no ve "Anular"', async () => {
  useAuthStore.setState({ token: 't', status: 'authenticated', user: { userId: 1, nombreCompleto: 'X', email: 'x@x.com', rolId: 1, rolNombre: 'Cajero', emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  setup()
  await screen.findByText(data => data.length > 0) // espera a que el detalle cargue
  expect(screen.queryByRole('button', { name: /anular/i })).toBeNull()
})
```

(Si `useAuthStore` no está importado en el archivo, añadir `import { useAuthStore } from '@/app/auth-store'`. Ajusta la espera de carga al dato real que renderiza el helper, p.ej. `await screen.findByText(mockFactura.numeroControl)`.)

- [ ] **Step 2: Correr y verificar que falla**

Run: `npx vitest run src/features/facturacion/pages/DteDetallePage.test.tsx`
Expected: FAIL en el caso "Cajero no ve Anular".

- [ ] **Step 3: Implementar**

En `DteDetallePage.tsx` añadir imports y envolver el botón:

```tsx
import { Can } from '@/lib/authz/Can'
import { FACTURA_ANULAR } from '@/lib/authz/acciones'
```
```tsx
        <h1 className="text-xl font-semibold text-ink">{data.numeroControl}</h1>
        <Can roles={FACTURA_ANULAR}>
          <Button variant="ghost" onClick={() => setModal(true)}>Anular</Button>
        </Can>
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npx vitest run src/features/facturacion/pages/DteDetallePage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/facturacion/pages/DteDetallePage.tsx src/features/facturacion/pages/DteDetallePage.test.tsx
git commit -m "feat(authz): gatear Anular de DTE a EmisorAdmin/GerenteSucursal"
```

---

## Task 6: Gating de acciones en Inventario

**Files:**
- Modify: `src/features/inventario/components/ProductosTab.tsx`, `CategoriasTab.tsx`, `MarcasTab.tsx`, `ExistenciasTab.tsx`
- Test: Modify `CategoriasTab.test.tsx`, `ExistenciasTab.test.tsx`; Create `ProductosTab.test.tsx`, `MarcasTab.test.tsx`

**Interfaces:**
- Consumes: `PRODUCTO_ESCRIBIR`, `CATALOGO_ESCRIBIR`, `CATALOGO_ELIMINAR`, `INVENTARIO_AJUSTAR`; `Can`.

**Nota de integración:** `ExistenciasTab.test.tsx` NO autentica; su test "abre el modal de ajuste" clickea "Ajustar". Al gatear con `INVENTARIO_AJUSTAR`, sin usuario el botón desaparece y el test rompe. Hay que añadir `useAuthStore.setState(...)` con rol de escritura en ese archivo.

- [ ] **Step 1a: Tests de ProductosTab (crear)**

Crear `src/features/inventario/components/ProductosTab.test.tsx`:

```ts
import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { setupServer } from 'msw/node'
import { ToastProvider } from '@/design-system'
import { inventarioHandlers } from '@/test/msw/inventario-handlers'
import { useAuthStore } from '@/app/auth-store'
import { ProductosTab } from './ProductosTab'

const server = setupServer(...inventarioHandlers)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><ToastProvider><MemoryRouter><ProductosTab /></MemoryRouter></ToastProvider></QueryClientProvider>)
}
function auth(rolNombre: string) {
  useAuthStore.setState({ token: 't', status: 'authenticated', user: { userId: 1, nombreCompleto: 'X', email: 'x@x.com', rolId: 1, rolNombre, emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
}

describe('ProductosTab gating', () => {
  beforeEach(() => auth('EmisorAdmin'))
  it('EmisorAdmin ve "Nuevo producto"', () => {
    setup()
    expect(screen.getByRole('button', { name: /nuevo producto/i })).toBeInTheDocument()
  })
  it('Auditor no ve "Nuevo producto"', () => {
    auth('Auditor')
    setup()
    expect(screen.queryByRole('button', { name: /nuevo producto/i })).toBeNull()
  })
})
```

- [ ] **Step 1b: Tests de MarcasTab (crear)**

Crear `src/features/inventario/components/MarcasTab.test.tsx` (mismo encabezado que ProductosTab pero sin `MemoryRouter`, ya que MarcasTab no usa router):

```ts
import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { ToastProvider } from '@/design-system'
import { inventarioHandlers } from '@/test/msw/inventario-handlers'
import { useAuthStore } from '@/app/auth-store'
import { MarcasTab } from './MarcasTab'

const server = setupServer(...inventarioHandlers)
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close())
function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><ToastProvider><MarcasTab /></ToastProvider></QueryClientProvider>)
}
function auth(rolNombre: string) {
  useAuthStore.setState({ token: 't', status: 'authenticated', user: { userId: 1, nombreCompleto: 'X', email: 'x@x.com', rolId: 1, rolNombre, emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
}
describe('MarcasTab gating', () => {
  beforeEach(() => auth('EmisorAdmin'))
  it('EmisorAdmin ve "Nueva marca"', () => { setup(); expect(screen.getByRole('button', { name: /nueva marca/i })).toBeInTheDocument() })
  it('Cajero no ve "Nueva marca"', () => { auth('Cajero'); setup(); expect(screen.queryByRole('button', { name: /nueva marca/i })).toBeNull() })
})
```

- [ ] **Step 1c: Tests de CategoriasTab (modificar) y ExistenciasTab (modificar)**

En `CategoriasTab.test.tsx`: si no autentica, añadir el helper `auth`/`beforeEach(() => auth('EmisorAdmin'))` (mismo patrón). Añadir:

```ts
it('Cajero no ve "Nueva categoría"', () => {
  auth('Cajero'); setup()
  expect(screen.queryByRole('button', { name: /nueva categoría/i })).toBeNull()
})
```

En `ExistenciasTab.test.tsx`: añadir `import { useAuthStore } from '@/app/auth-store'` y, antes de cada render, autenticar con un rol de escritura para que los tests existentes ("abre el modal de ajuste") sigan pasando:

```ts
beforeEach(() => {
  useAuthStore.setState({ token: 't', status: 'authenticated', user: { userId: 1, nombreCompleto: 'X', email: 'x@x.com', rolId: 1, rolNombre: 'EmisorAdmin', emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
})
```

Y un caso negativo:

```ts
it('Contador no ve "Ajustar" ni "Trasladar"', async () => {
  useAuthStore.setState({ token: 't', status: 'authenticated', user: { userId: 1, nombreCompleto: 'X', email: 'x@x.com', rolId: 1, rolNombre: 'Contador', emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  render(<ExistenciasTab />, { wrapper })
  await waitFor(() => screen.getByText('Producto de prueba'))
  expect(screen.queryByRole('button', { name: /ajustar/i })).toBeNull()
  expect(screen.queryByRole('button', { name: /trasladar/i })).toBeNull()
})
```

- [ ] **Step 2: Correr y verificar que fallan**

Run: `npx vitest run src/features/inventario/components`
Expected: FAIL en los casos negativos y en los `.test` nuevos (aún sin gating).

- [ ] **Step 3: Implementar el gating**

`ProductosTab.tsx` — imports y envolver el botón + la celda de acciones:

```tsx
import { Can } from '@/lib/authz/Can'
import { PRODUCTO_ESCRIBIR } from '@/lib/authz/acciones'
```
```tsx
        <Can roles={PRODUCTO_ESCRIBIR}>
          <Button onClick={() => navigate('/inventario/productos/nuevo')}>Nuevo producto</Button>
        </Can>
```
Y la celda `<td className="space-x-2 text-right">…</td>` (ProductosTab.tsx:49-52), envolver su contenido:
```tsx
                <td className="space-x-2 text-right">
                  <Can roles={PRODUCTO_ESCRIBIR}>
                    <Link className="text-xs text-sello" to={`/inventario/productos/${p.id}/editar`}>Editar</Link>
                    <button type="button" className="text-xs text-slate" onClick={() => onToggle(p.id)}>{p.activo ? 'Desactivar' : 'Activar'}</button>
                  </Can>
                </td>
```

`CategoriasTab.tsx` — imports (`Can`, `CATALOGO_ESCRIBIR`, `CATALOGO_ELIMINAR`). Envolver "Nueva categoría" con `CATALOGO_ESCRIBIR`; en la celda de acciones, envolver Editar+Desactivar con `CATALOGO_ESCRIBIR` y Eliminar con `CATALOGO_ELIMINAR`:

```tsx
      <div className="flex justify-end">
        <Can roles={CATALOGO_ESCRIBIR}><Button onClick={() => setEditando(null)}>Nueva categoría</Button></Can>
      </div>
```
```tsx
                <td className="space-x-2 text-right">
                  <Can roles={CATALOGO_ESCRIBIR}>
                    <button type="button" className="text-xs text-sello" onClick={() => setEditando(c)}>Editar</button>
                    <button type="button" className="text-xs text-slate" onClick={() => toggle.mutate(c.id)}>{c.activo ? 'Desactivar' : 'Activar'}</button>
                  </Can>
                  <Can roles={CATALOGO_ELIMINAR}>
                    <button type="button" className="text-xs text-rojo" onClick={() => onEliminar(c)}>Eliminar</button>
                  </Can>
                </td>
```

`MarcasTab.tsx` — análogo a CategoriasTab con los mismos constantes:

```tsx
import { Can } from '@/lib/authz/Can'
import { CATALOGO_ESCRIBIR, CATALOGO_ELIMINAR } from '@/lib/authz/acciones'
```
```tsx
      <div className="flex justify-end"><Can roles={CATALOGO_ESCRIBIR}><Button onClick={() => setEditando(null)}>Nueva marca</Button></Can></div>
```
```tsx
                <td className="space-x-2 text-right">
                  <Can roles={CATALOGO_ESCRIBIR}>
                    <button type="button" className="text-xs text-sello" onClick={() => setEditando(m)}>Editar</button>
                    <button type="button" className="text-xs text-slate" onClick={() => toggle.mutate(m.id)}>{m.activa ? 'Desactivar' : 'Activar'}</button>
                  </Can>
                  <Can roles={CATALOGO_ELIMINAR}>
                    <button type="button" className="text-xs text-rojo" onClick={() => onEliminar(m)}>Eliminar</button>
                  </Can>
                </td>
```

`ExistenciasTab.tsx` — imports (`Can`, `INVENTARIO_AJUSTAR`). Envolver la celda de acciones (ExistenciasTab.tsx:62-65):

```tsx
                    <td className="space-x-2 text-right">
                      <Can roles={INVENTARIO_AJUSTAR}>
                        <Button variant="ghost" onClick={() => setAjusteProd({ id: s.productoId, nombre: s.productoNombre })}>Ajustar</Button>
                        <Button variant="ghost" onClick={() => setTrasladoProd({ id: s.productoId, nombre: s.productoNombre })}>Trasladar</Button>
                      </Can>
                    </td>
```

- [ ] **Step 4: Correr y verificar que pasan**

Run: `npx vitest run src/features/inventario`
Expected: PASS (incluye ProductosPage y demás tests del feature).

- [ ] **Step 5: Commit**

```bash
git add src/features/inventario
git commit -m "feat(authz): gatear acciones de inventario (productos, catálogos, ajuste/traslado)"
```

---

## Task 7: Gating de acciones en Cuentas por Cobrar

**Files:**
- Modify: `src/features/cuentas-por-cobrar/components/PlanCuotasTable.tsx`, `pages/PlanDetallePage.tsx`
- Test: `PlanCuotasTable.test.tsx`, `PlanDetallePage.test.tsx`

**Interfaces:**
- Consumes: `CXC_PAGAR` (pagar cuota + descargar estado de cuenta), `CXC_REFINANCIAR` (refinanciar); `Can`.

- [ ] **Step 1: Escribir los tests que fallan**

En `PlanCuotasTable.test.tsx`: si no autentica y asevera el botón "Pagar", añadir el helper `auth`/`beforeEach(auth('EmisorAdmin'))` (patrón habitual; `PlanCuotasTable` no usa hooks ni router, así que basta con `render` dentro de un provider mínimo — replica el `setup` existente del archivo). Añadir:

```ts
it('Cajero ve "Pagar" (rol de escritura de cobro)', () => {
  auth('Cajero'); setup() // con al menos una cuota no pagada
  expect(screen.getByRole('button', { name: /pagar/i })).toBeInTheDocument()
})
it('Auditor no ve "Pagar"', () => {
  auth('Auditor'); setup()
  expect(screen.queryByRole('button', { name: /pagar/i })).toBeNull()
})
```

(Si el `setup` del archivo no autentica, PlanCuotasTable ahora depende de `useAuthz` vía `<Can>`; añade la autenticación en el helper para que los tests existentes que esperan ver "Pagar" sigan pasando.)

En `PlanDetallePage.test.tsx`: fijar el `beforeEach` a `'EmisorAdmin'` si asevera Refinanciar; añadir:

```ts
it('Cajero no ve "Refinanciar"', async () => {
  useAuthStore.setState({ token: 't', status: 'authenticated', user: { userId: 1, nombreCompleto: 'X', email: 'x@x.com', rolId: 1, rolNombre: 'Cajero', emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  setup() // carga el plan con saldo > 0 vía MSW
  await screen.findByText(/plan #/i)
  expect(screen.queryByRole('button', { name: /refinanciar/i })).toBeNull()
})
```

- [ ] **Step 2: Correr y verificar que fallan**

Run: `npx vitest run src/features/cuentas-por-cobrar/components/PlanCuotasTable.test.tsx src/features/cuentas-por-cobrar/pages/PlanDetallePage.test.tsx`
Expected: FAIL en casos negativos.

- [ ] **Step 3: Implementar**

`PlanCuotasTable.tsx` — imports y envolver el botón Pagar:

```tsx
import { Button } from '@/design-system'
import { Can } from '@/lib/authz/Can'
import { CXC_PAGAR } from '@/lib/authz/acciones'
import type { CuotaDto } from '../types'
```
```tsx
            <td className="text-right">
              {c.estado !== 'Pagada' && (
                <Can roles={CXC_PAGAR}>
                  <Button variant="ghost" onClick={() => onPagar(c.numero)}>Pagar</Button>
                </Can>
              )}
            </td>
```

`PlanDetallePage.tsx` — imports (`Can`, `CXC_PAGAR`, `CXC_REFINANCIAR`). Envolver el bloque de descarga + refinanciar (PlanDetallePage.tsx:76-79):

```tsx
      <div className="flex items-center justify-between">
        <Can roles={CXC_PAGAR}>
          <ReporteDescargaButtons label="Estado de cuenta" onDescargar={descargar} />
        </Can>
        {p.saldoAdeudado > 0 && (
          <Can roles={CXC_REFINANCIAR}>
            <Button variant="ghost" onClick={() => setRefinanciando(true)}>Refinanciar</Button>
          </Can>
        )}
      </div>
```

- [ ] **Step 4: Correr y verificar que pasan**

Run: `npx vitest run src/features/cuentas-por-cobrar`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/cuentas-por-cobrar
git commit -m "feat(authz): gatear pagar/refinanciar/estado de cuenta en CxC"
```

---

## Task 8: Gating de acciones en DTEs recibidos

**Files:**
- Modify: `src/features/dtes-recibidos/pages/DtesRecibidosListPage.tsx`, `DteRecibidoDetallePage.tsx`
- Test: `DtesRecibidosListPage.test.tsx`, `DteRecibidoDetallePage.test.tsx`

**Interfaces:**
- Consumes: `DTE_RECIBIDO_GESTIONAR` (leer correo, cargar JSON, mapear→compra, descartar), `DTE_RECIBIDO_CONFIG` (configurar correo); `Can`.

- [ ] **Step 1: Escribir los tests que fallan**

`DtesRecibidosListPage.test.tsx` (ya autentica con `EmisorAdmin`). Añadir:

```ts
it('EmisorAdmin ve las acciones de ingesta', async () => {
  setup()
  expect(await screen.findByRole('button', { name: /cargar json/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /leer correo/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /configurar correo/i })).toBeInTheDocument()
})
it('Auditor no ve ingesta ni configuración', async () => {
  useAuthStore.setState({ token: 't', status: 'authenticated', user: { userId: 1, nombreCompleto: 'X', email: 'x@x.com', rolId: 1, rolNombre: 'Auditor', emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  setup()
  expect(await screen.findByText('DTE-03-0001')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /cargar json/i })).toBeNull()
  expect(screen.queryByRole('button', { name: /configurar correo/i })).toBeNull()
})
```

`DteRecibidoDetallePage.test.tsx`: si asevera "Mapear"/"Descartar", fijar el `beforeEach` a `'EmisorAdmin'`; añadir:

```ts
it('Contador no ve Mapear/Descartar', async () => {
  useAuthStore.setState({ token: 't', status: 'authenticated', user: { userId: 1, nombreCompleto: 'X', email: 'x@x.com', rolId: 1, rolNombre: 'Contador', emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [1], permisos: [] } })
  setup() // DTE en estado PENDIENTE vía MSW
  await screen.findByText(/NIT/i)
  expect(screen.queryByRole('button', { name: /mapear y crear compra/i })).toBeNull()
  expect(screen.queryByRole('button', { name: /descartar/i })).toBeNull()
})
```

(Si `useAuthStore` no está importado, añadirlo.)

- [ ] **Step 2: Correr y verificar que fallan**

Run: `npx vitest run src/features/dtes-recibidos/pages`
Expected: FAIL en casos negativos.

- [ ] **Step 3: Implementar**

`DtesRecibidosListPage.tsx` — imports (`Can`, `DTE_RECIBIDO_GESTIONAR`, `DTE_RECIBIDO_CONFIG`). Envolver la barra de acciones (DtesRecibidosListPage.tsx:35-39):

```tsx
        <div className="flex gap-2">
          <Can roles={DTE_RECIBIDO_CONFIG}>
            <Button variant="ghost" onClick={() => navigate('/dtes-recibidos/configuracion')}>Configurar correo</Button>
          </Can>
          <Can roles={DTE_RECIBIDO_GESTIONAR}>
            <Button variant="ghost" onClick={() => setModal('leer')}>Leer correo</Button>
            <Button onClick={() => setModal('cargar')}>Cargar JSON</Button>
          </Can>
        </div>
```

`DteRecibidoDetallePage.tsx` — imports (`Can`, `DTE_RECIBIDO_GESTIONAR`). Envolver el bloque de acciones de estado PENDIENTE (DteRecibidoDetallePage.tsx:75-80):

```tsx
      {esPendiente && (
        <Can roles={DTE_RECIBIDO_GESTIONAR}>
          <div className="flex gap-2">
            <Button onClick={() => navigate(`/dtes-recibidos/${dteId}/mapear`)}>Mapear y crear compra</Button>
            <Button variant="danger" onClick={() => setModal(true)}>Descartar</Button>
          </div>
        </Can>
      )}
```

- [ ] **Step 4: Correr y verificar que pasan**

Run: `npx vitest run src/features/dtes-recibidos`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/dtes-recibidos
git commit -m "feat(authz): gatear ingesta/config/descarte de DTEs recibidos por rol"
```

---

## Task 9: Consolidar `ROLES_ESCRITURA` de usuarios en el módulo central

**Files:**
- Modify: `src/features/usuarios/pages/UsuariosPage.tsx`, `src/features/usuarios/components/UsuariosTable.tsx`
- Test: `src/features/usuarios/pages/UsuariosPage.test.tsx` (ya cubre el gating; debe seguir verde)

**Interfaces:**
- Consumes: `USUARIOS_ESCRIBIR` (Task 2).

**Contexto:** ambos archivos definen su propio `const ROLES_ESCRITURA = ['SuperAdmin','EmisorAdmin','GerenteSucursal'] as const` y lo usan como `<Can roles={[...ROLES_ESCRITURA]}>`. Reemplazar por la constante central.

- [ ] **Step 1: Implementar (refactor cubierto por tests existentes)**

En `UsuariosPage.tsx`: eliminar la línea `const ROLES_ESCRITURA = ... as const`, añadir `import { USUARIOS_ESCRIBIR } from '@/lib/authz/acciones'`, y cambiar `<Can roles={[...ROLES_ESCRITURA]}>` por `<Can roles={USUARIOS_ESCRIBIR}>`.

En `UsuariosTable.tsx`: idéntico — eliminar el `const ROLES_ESCRITURA`, importar `USUARIOS_ESCRIBIR`, y usar `<Can roles={USUARIOS_ESCRIBIR}>`.

- [ ] **Step 2: Correr los tests de usuarios**

Run: `npx vitest run src/features/usuarios`
Expected: PASS (los tests de gating de Entrega A siguen verdes; `USUARIOS_ESCRIBIR` == el array anterior).

- [ ] **Step 3: Commit**

```bash
git add src/features/usuarios/pages/UsuariosPage.tsx src/features/usuarios/components/UsuariosTable.tsx
git commit -m "refactor(authz): consolidar ROLES_ESCRITURA de usuarios en acciones.ts"
```

---

## Task 10: Verificación global (suite + lint + build)

**Files:** ninguno (solo verificación). Si algo falla, arreglar en la tarea correspondiente.

- [ ] **Step 1: Suite completa**

Run: `npm run test`
Expected: TODOS los archivos verdes. Prestar atención a tests pre-existentes de router (`router.compras.test.tsx`, `router.gating.test.tsx`) y de features que rendericen estos componentes sin autenticar.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: sin errores. (Vigilar imports sin usar tras los refactors.)

- [ ] **Step 3: Type-check / build**

Run: `npm run build`
Expected: build OK (sin errores de TypeScript; `RolNombre` incluye `EncargadoInventario`).

- [ ] **Step 4: Commit (si hubo arreglos de verificación)**

```bash
git add -A
git commit -m "test(authz): verificación global Entrega B verde (suite/lint/build)"
```

- [ ] **Step 5: Push y PR**

```bash
git push -u origin feat/authz-entrega-b
```
Crear el PR por web hacia `development` (política del proyecto: PRs por web). Título sugerido: "Entrega B — gating de acciones por rol". Enlazar el spec y este plan en la descripción.

---

## Notas de verificación del plan

- **Cobertura del spec:** matriz central (Task 2) ✓; +EncargadoInventario (Task 1) ✓; capa de ruta (Task 3) ✓; Compras (Task 4) ✓; Facturación/Anular (Task 5) ✓; Inventario productos+catálogos+ajuste (Task 6) ✓; CxC pagar/refinanciar/estado (Task 7) ✓; DTEs recibidos gestión+config (Task 8) ✓; consolidación ROLES_ESCRITURA (Task 9) ✓; suite/lint/build (Task 10) ✓. `EmitirLandingPage` omitido a propósito (spec).
- **Consistencia de nombres:** las 13 constantes se definen en Task 2 y se consumen con los mismos nombres en Tasks 4-9.
- **Riesgo residual:** algunos `.test.tsx` de detalle (`CompraDetallePage`, `DteDetallePage`, `PlanDetallePage`, `DteRecibidoDetallePage`) pueden autenticar con roles placeholder; cada tarea indica fijar el rol de escritura antes de envolver. Si un test existente renderiza sin `useAuthStore`, el gating ocultará el trigger y romperá — la tarea lo cubre añadiendo autenticación.
