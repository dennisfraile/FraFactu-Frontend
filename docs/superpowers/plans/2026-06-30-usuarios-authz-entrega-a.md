# Gestión de usuarios + autorización por rol (Entrega A) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Activar `/config/usuarios` con un CRUD completo sobre el backend existente e introducir un módulo reutilizable de autorización por rol aplicado app-wide a nav y rutas.

**Architecture:** Módulo `src/lib/authz/` (lógica pura + hook + `<Can>`), wrappers de ruta en `src/app/` (`RoleRoute`, `AccesoDenegado`), nav y router gateados por rol, y un feature `src/features/usuarios/` que consume el API ya completo (`/api/usuarios`, `/api/roles`, `/api/cajas`, `/sucursales/todas-activas`). Gating **por rol** (`user.rolNombre`); `permisos` llega vacío y NO se usa.

**Tech Stack:** React 18 + TypeScript + Vite, React Router v6, @tanstack/react-query v5, zod, Vitest + Testing Library + MSW, design-system propio (`@/design-system`), axios (`@/lib/http/axios`).

## Global Constraints

- Cliente HTTP: `import { api } from '@/lib/http/axios'`; baseURL `http://localhost:8080/api` (los handlers MSW usan `http://localhost:8080/api`).
- Gating **por rol** usando `user.rolNombre`. NO usar `user.permisos` (llega `[]`).
- Roles del sistema: `SuperAdmin | EmisorAdmin | GerenteSucursal | Cajero | Auditor | Contador`.
- Contrato paginado backend: `{ items, currentPage, totalPages, pageSize, totalCount }` (es `currentPage`, NO `pageNumber`). Query params: `pageNumber`, `pageSize`, `searchTerm`, `soloActivos`.
- Patrón de formularios: inner-form con `key` para resetear estado; **prohibido** `useEffect`+`setState` para sincronizar props→estado. Imports al tope del archivo.
- `useAuthStore` en `@/app/auth-store`, selector `s.user`, campos `user.rolNombre`, `user.sucursalIds`.
- Reutilizar `useSucursales` de `@/features/facturacion/hooks` (→ `/sucursales/todas-activas`, items `{ id, nombre }`).
- design-system exporta: `Button, Card, Badge, Spinner, Input, FormField, ToastProvider, useToast, Modal, Drawer, Combobox, Tabs, Table, EmptyState, Icon`. NO hay `Select` (usar `<select>` nativo dentro de `FormField`).
- Tras cada tarea: `npm run test -- --run <archivo>` en verde antes de commitear. Comandos desde `c:\Users\LENOVO\Documents\Portafolio\FraFactu-Planning\FraFactu-Frontend`.
- Rama: `feat/usuarios-authz`. Commits frecuentes, uno por tarea.

---

## Fase 0 — Núcleo de autorización (`src/lib/authz/`)

### Task 1: Roles y función pura `puede`

**Files:**
- Create: `src/lib/authz/roles.ts`
- Test: `src/lib/authz/roles.test.ts`

**Interfaces:**
- Produces: `type RolNombre`, `const ROLES: RolNombre[]`, `puede(rol: string | undefined | null, allow: RolNombre[]): boolean`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/authz/roles.test.ts
import { describe, it, expect } from 'vitest'
import { puede, ROLES } from './roles'

describe('puede', () => {
  it('true si el rol está en la lista permitida', () => {
    expect(puede('EmisorAdmin', ['SuperAdmin', 'EmisorAdmin'])).toBe(true)
  })
  it('false si el rol no está', () => {
    expect(puede('Cajero', ['SuperAdmin', 'EmisorAdmin'])).toBe(false)
  })
  it('false si el rol es undefined/null', () => {
    expect(puede(undefined, ['EmisorAdmin'])).toBe(false)
    expect(puede(null, ['EmisorAdmin'])).toBe(false)
  })
  it('ROLES contiene los 6 roles del sistema', () => {
    expect(ROLES).toHaveLength(6)
    expect(ROLES).toContain('SuperAdmin')
    expect(ROLES).toContain('Contador')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/lib/authz/roles.test.ts`
Expected: FAIL (módulo `./roles` no existe).

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/authz/roles.ts
export type RolNombre =
  | 'SuperAdmin'
  | 'EmisorAdmin'
  | 'GerenteSucursal'
  | 'Cajero'
  | 'Auditor'
  | 'Contador'

export const ROLES: RolNombre[] = [
  'SuperAdmin', 'EmisorAdmin', 'GerenteSucursal', 'Cajero', 'Auditor', 'Contador',
]

/** True si `rol` está dentro de `allow`. Gating por nombre de rol (espeja [Authorize(Roles=...)] del backend). */
export function puede(rol: string | undefined | null, allow: RolNombre[]): boolean {
  if (!rol) return false
  return (allow as string[]).includes(rol)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/lib/authz/roles.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/authz/roles.ts src/lib/authz/roles.test.ts
git commit -m "feat(authz): tipo RolNombre y función pura puede()"
```

---

### Task 2: Hook `useAuthz`

**Files:**
- Create: `src/lib/authz/useAuthz.ts`
- Test: `src/lib/authz/useAuthz.test.tsx`

**Interfaces:**
- Consumes: `puede` (Task 1), `useAuthStore` de `@/app/auth-store` (selector `s.user`, campo `user.rolNombre`).
- Produces: `useAuthz(): { rol: string | undefined; hasRole(r: RolNombre): boolean; hasAnyRole(rs: RolNombre[]): boolean }`

- [ ] **Step 1: Write the failing test**

```tsx
// src/lib/authz/useAuthz.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAuthz } from './useAuthz'
import { useAuthStore } from '@/app/auth-store'

const baseUser = {
  userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 5, rolNombre: 'EmisorAdmin',
  emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [2], permisos: [],
}

describe('useAuthz', () => {
  beforeEach(() => { useAuthStore.setState({ token: 't', status: 'authenticated', user: { ...baseUser } }) })

  it('expone el rol actual', () => {
    const { result } = renderHook(() => useAuthz())
    expect(result.current.rol).toBe('EmisorAdmin')
  })
  it('hasRole / hasAnyRole', () => {
    const { result } = renderHook(() => useAuthz())
    expect(result.current.hasRole('EmisorAdmin')).toBe(true)
    expect(result.current.hasRole('Cajero')).toBe(false)
    expect(result.current.hasAnyRole(['SuperAdmin', 'EmisorAdmin'])).toBe(true)
    expect(result.current.hasAnyRole(['Cajero'])).toBe(false)
  })
  it('sin usuario, todo false', () => {
    useAuthStore.setState({ token: null, status: 'anon', user: null })
    const { result } = renderHook(() => useAuthz())
    expect(result.current.rol).toBeUndefined()
    expect(result.current.hasAnyRole(['EmisorAdmin'])).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/lib/authz/useAuthz.test.tsx`
Expected: FAIL (`./useAuthz` no existe).

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/authz/useAuthz.ts
import { useAuthStore } from '@/app/auth-store'
import { puede, type RolNombre } from './roles'

export function useAuthz() {
  const rol = useAuthStore((s) => s.user?.rolNombre)
  return {
    rol,
    hasRole: (r: RolNombre) => puede(rol, [r]),
    hasAnyRole: (rs: RolNombre[]) => puede(rol, rs),
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/lib/authz/useAuthz.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/authz/useAuthz.ts src/lib/authz/useAuthz.test.tsx
git commit -m "feat(authz): hook useAuthz (rol/hasRole/hasAnyRole)"
```

---

### Task 3: Componente `<Can>`

**Files:**
- Create: `src/lib/authz/Can.tsx`
- Test: `src/lib/authz/Can.test.tsx`

**Interfaces:**
- Consumes: `useAuthz` (Task 2), `RolNombre` (Task 1).
- Produces: `<Can roles={RolNombre[]} fallback?={ReactNode}>children</Can>`

- [ ] **Step 1: Write the failing test**

```tsx
// src/lib/authz/Can.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Can } from './Can'
import { useAuthStore } from '@/app/auth-store'

function setRol(rolNombre: string) {
  useAuthStore.setState({
    token: 't', status: 'authenticated',
    user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 1, rolNombre, emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [2], permisos: [] },
  })
}

describe('Can', () => {
  beforeEach(() => setRol('EmisorAdmin'))

  it('renderiza children si el rol califica', () => {
    render(<Can roles={['EmisorAdmin']}><button>Nuevo</button></Can>)
    expect(screen.getByRole('button', { name: 'Nuevo' })).toBeInTheDocument()
  })
  it('no renderiza nada si no califica y no hay fallback', () => {
    setRol('Cajero')
    render(<Can roles={['EmisorAdmin']}><button>Nuevo</button></Can>)
    expect(screen.queryByRole('button', { name: 'Nuevo' })).toBeNull()
  })
  it('renderiza fallback si no califica', () => {
    setRol('Cajero')
    render(<Can roles={['EmisorAdmin']} fallback={<span>Sin permiso</span>}><button>Nuevo</button></Can>)
    expect(screen.getByText('Sin permiso')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/lib/authz/Can.test.tsx`
Expected: FAIL (`./Can` no existe).

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/lib/authz/Can.tsx
import type { ReactNode } from 'react'
import { useAuthz } from './useAuthz'
import type { RolNombre } from './roles'

interface Props { roles: RolNombre[]; fallback?: ReactNode; children: ReactNode }

export function Can({ roles, fallback = null, children }: Props) {
  const { hasAnyRole } = useAuthz()
  return <>{hasAnyRole(roles) ? children : fallback}</>
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/lib/authz/Can.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/authz/Can.tsx src/lib/authz/Can.test.tsx
git commit -m "feat(authz): componente <Can> para gating de UI por rol"
```

---

## Fase 1 — Gating app-wide de nav + rutas

### Task 4: Página `AccesoDenegado`

**Files:**
- Create: `src/app/AccesoDenegado.tsx`
- Test: `src/app/AccesoDenegado.test.tsx`

**Interfaces:**
- Produces: `<AccesoDenegado />` (página 403 con enlace a `/dashboard`).

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/AccesoDenegado.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AccesoDenegado } from './AccesoDenegado'

describe('AccesoDenegado', () => {
  it('muestra el mensaje 403 y enlace al dashboard', () => {
    render(<MemoryRouter><AccesoDenegado /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /acceso denegado/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/app/AccesoDenegado.test.tsx`
Expected: FAIL (`./AccesoDenegado` no existe).

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/app/AccesoDenegado.tsx
import { Link } from 'react-router-dom'
import { Icon } from '@/design-system'

export function AccesoDenegado() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <Icon name="lock" size={48} className="text-slate" />
      <h1 className="text-xl font-semibold text-ink">Acceso denegado</h1>
      <p className="max-w-md text-sm text-slate">
        Tu rol no tiene permiso para ver esta sección. Si crees que es un error, contacta a un administrador.
      </p>
      <Link to="/dashboard" className="text-sm font-medium text-sello underline">Volver al Dashboard</Link>
    </div>
  )
}
```

> NOTA implementador: verifica que el icono `lock` exista en `IconName` (`src/design-system/Icon`). Si no existe, usa uno presente (p. ej. `usuarios` o `historial`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/app/AccesoDenegado.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/app/AccesoDenegado.tsx src/app/AccesoDenegado.test.tsx
git commit -m "feat(authz): página AccesoDenegado (403)"
```

---

### Task 5: Wrapper de ruta `RoleRoute`

**Files:**
- Create: `src/app/RoleRoute.tsx`
- Test: `src/app/RoleRoute.test.tsx`

**Interfaces:**
- Consumes: `useAuthz` (Task 2), `AccesoDenegado` (Task 4).
- Produces: `<RoleRoute allow={RolNombre[]}>` — renderiza `<Outlet />` si califica, si no `<AccesoDenegado />`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/RoleRoute.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { RoleRoute } from './RoleRoute'
import { useAuthStore } from './auth-store'

function setRol(rolNombre: string) {
  useAuthStore.setState({
    token: 't', status: 'authenticated',
    user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 1, rolNombre, emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [2], permisos: [] },
  })
}

function setup() {
  return render(
    <MemoryRouter initialEntries={['/x']}>
      <Routes>
        <Route element={<RoleRoute allow={['EmisorAdmin']} />}>
          <Route path="/x" element={<div>Contenido protegido</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('RoleRoute', () => {
  beforeEach(() => setRol('EmisorAdmin'))
  it('renderiza el contenido si el rol califica', () => {
    setup()
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument()
  })
  it('muestra AccesoDenegado si no califica', () => {
    setRol('Cajero')
    setup()
    expect(screen.getByRole('heading', { name: /acceso denegado/i })).toBeInTheDocument()
    expect(screen.queryByText('Contenido protegido')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/app/RoleRoute.test.tsx`
Expected: FAIL (`./RoleRoute` no existe).

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/app/RoleRoute.tsx
import { Outlet } from 'react-router-dom'
import { useAuthz } from '@/lib/authz/useAuthz'
import type { RolNombre } from '@/lib/authz/roles'
import { AccesoDenegado } from './AccesoDenegado'

export function RoleRoute({ allow }: { allow: RolNombre[] }) {
  const { hasAnyRole } = useAuthz()
  return hasAnyRole(allow) ? <Outlet /> : <AccesoDenegado />
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/app/RoleRoute.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/RoleRoute.tsx src/app/RoleRoute.test.tsx
git commit -m "feat(authz): RoleRoute (guard de ruta por rol → AccesoDenegado)"
```

---

### Task 6: `nav-config` con roles + `Sidebar` filtra por rol

**Files:**
- Modify: `src/app/nav-config.ts` (añadir `roles?` a `NavItem`; poblar la matriz)
- Modify: `src/app/Sidebar.tsx` (filtrar items/secciones por rol)
- Test: `src/app/Sidebar.test.tsx`

**Interfaces:**
- Consumes: `useAuthz` (Task 2), `RolNombre` (Task 1).
- Produces: `NavItem.roles?: RolNombre[]`. Matriz rol→nav (derivada del `[Authorize]` del GET/landing de cada controlador).

**Matriz rol→nav (derivada del backend; verificar cada fila contra el `[Authorize(Roles=...)]` del GET de landing del controlador):**

| Nav item | Ruta | roles |
|---|---|---|
| Dashboard | `/dashboard` | todos (sin `roles`) |
| Emitir DTE | `/facturacion/emitir` | EmisorAdmin, GerenteSucursal, Cajero |
| Historial | `/facturacion/historial` | EmisorAdmin, GerenteSucursal, Cajero, Contador, Auditor |
| Compras externas | `/compras` | EmisorAdmin, GerenteSucursal, Contador |
| Proveedores | `/proveedores` | EmisorAdmin, GerenteSucursal, Contador, Auditor |
| DTEs recibidos | `/dtes-recibidos` | EmisorAdmin, GerenteSucursal, Contador, Auditor |
| Planes (CxC) | `/cuentas-por-cobrar` | EmisorAdmin, GerenteSucursal, Cajero |
| Nueva venta a crédito | `/cuentas-por-cobrar/nueva` | EmisorAdmin, GerenteSucursal, Cajero |
| Configuración de mora | `/cuentas-por-cobrar/configuracion-mora` | EmisorAdmin, GerenteSucursal |
| Productos (inv.) | `/inventario/productos` | EmisorAdmin, GerenteSucursal, Cajero, Contador, Auditor |
| Stock | `/inventario/stock` | EmisorAdmin, GerenteSucursal, Cajero, Contador, Auditor |
| Reportes (inv.) | `/inventario/reportes` | EmisorAdmin, GerenteSucursal, Contador, Auditor |
| Usuarios | `/config/usuarios` | SuperAdmin, EmisorAdmin, GerenteSucursal, Auditor |

> Nota: SuperAdmin solo aparece en Dashboard y Usuarios — mirror fiel del backend (los GET de los demás controladores no incluyen SuperAdmin). Documentado, no es bug.

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/Sidebar.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useAuthStore } from './auth-store'

function setRol(rolNombre: string) {
  useAuthStore.setState({
    token: 't', status: 'authenticated',
    user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 1, rolNombre, emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [2], permisos: [] },
  })
}
const renderSidebar = () =>
  render(<MemoryRouter><Sidebar collapsed={false} onToggle={() => {}} /></MemoryRouter>)

describe('Sidebar gating por rol', () => {
  beforeEach(() => setRol('EmisorAdmin'))
  it('EmisorAdmin ve Usuarios y Emitir DTE', () => {
    renderSidebar()
    expect(screen.getByRole('link', { name: /usuarios/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /emitir dte/i })).toBeInTheDocument()
  })
  it('Cajero NO ve Usuarios ni Configuración de mora', () => {
    setRol('Cajero')
    renderSidebar()
    expect(screen.queryByRole('link', { name: /usuarios/i })).toBeNull()
    expect(screen.queryByRole('link', { name: /configuración de mora/i })).toBeNull()
  })
  it('Auditor ve Usuarios pero NO Emitir DTE', () => {
    setRol('Auditor')
    renderSidebar()
    expect(screen.getByRole('link', { name: /usuarios/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /emitir dte/i })).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/app/Sidebar.test.tsx`
Expected: FAIL (Sidebar aún no filtra; Cajero seguiría viendo Usuarios).

- [ ] **Step 3: Implementation — `nav-config.ts`**

Reemplaza el contenido por:

```ts
// src/app/nav-config.ts
import type { IconName } from '@/design-system'
import type { RolNombre } from '@/lib/authz/roles'

export interface NavItem { label: string; to: string; icon: IconName; roles?: RolNombre[] }
export interface NavSection { title: string | null; items: NavItem[] }

export const navSections: NavSection[] = [
  { title: null, items: [{ label: 'Dashboard', to: '/dashboard', icon: 'dashboard' }] },
  { title: 'Facturación', items: [
    { label: 'Emitir DTE', to: '/facturacion/emitir', icon: 'factura', roles: ['EmisorAdmin', 'GerenteSucursal', 'Cajero'] },
    { label: 'Historial', to: '/facturacion/historial', icon: 'historial', roles: ['EmisorAdmin', 'GerenteSucursal', 'Cajero', 'Contador', 'Auditor'] },
  ] },
  { title: 'Compras', items: [
    { label: 'Compras externas', to: '/compras', icon: 'compras', roles: ['EmisorAdmin', 'GerenteSucursal', 'Contador'] },
    { label: 'Proveedores', to: '/proveedores', icon: 'proveedores', roles: ['EmisorAdmin', 'GerenteSucursal', 'Contador', 'Auditor'] },
    { label: 'DTEs recibidos', to: '/dtes-recibidos', icon: 'recibidos', roles: ['EmisorAdmin', 'GerenteSucursal', 'Contador', 'Auditor'] },
  ] },
  { title: 'Cuentas por cobrar', items: [
    { label: 'Planes', to: '/cuentas-por-cobrar', icon: 'cobros', roles: ['EmisorAdmin', 'GerenteSucursal', 'Cajero'] },
    { label: 'Nueva venta a crédito', to: '/cuentas-por-cobrar/nueva', icon: 'factura', roles: ['EmisorAdmin', 'GerenteSucursal', 'Cajero'] },
    { label: 'Configuración de mora', to: '/cuentas-por-cobrar/configuracion-mora', icon: 'historial', roles: ['EmisorAdmin', 'GerenteSucursal'] },
  ] },
  { title: 'Inventario', items: [
    { label: 'Productos', to: '/inventario/productos', icon: 'productos', roles: ['EmisorAdmin', 'GerenteSucursal', 'Cajero', 'Contador', 'Auditor'] },
    { label: 'Stock', to: '/inventario/stock', icon: 'stock', roles: ['EmisorAdmin', 'GerenteSucursal', 'Cajero', 'Contador', 'Auditor'] },
    { label: 'Reportes', to: '/inventario/reportes', icon: 'historial', roles: ['EmisorAdmin', 'GerenteSucursal', 'Contador', 'Auditor'] },
  ] },
  { title: 'Configuración', items: [
    { label: 'Usuarios', to: '/config/usuarios', icon: 'usuarios', roles: ['SuperAdmin', 'EmisorAdmin', 'GerenteSucursal', 'Auditor'] },
  ] },
]
```

- [ ] **Step 4: Implementation — `Sidebar.tsx`**

Añade el import y filtra `navSections`. Inserta tras los imports existentes:

```tsx
import { useAuthz } from '@/lib/authz/useAuthz'
import { puede } from '@/lib/authz/roles'
```

Dentro de `Sidebar`, antes del `return`:

```tsx
  const { rol } = useAuthz()
  const secciones = navSections
    .map((sec) => ({ ...sec, items: sec.items.filter((it) => !it.roles || puede(rol, it.roles)) }))
    .filter((sec) => sec.items.length > 0)
```

Y cambia `{navSections.map((sec, i) => (` por `{secciones.map((sec, i) => (`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test -- --run src/app/Sidebar.test.tsx src/app/nav-config.test.ts`
Expected: PASS (Sidebar 3 tests; nav-config sigue verde).

- [ ] **Step 6: Commit**

```bash
git add src/app/nav-config.ts src/app/Sidebar.tsx src/app/Sidebar.test.tsx
git commit -m "feat(authz): nav-config con roles y Sidebar filtrado por rol"
```

---

### Task 7: Router — proteger rutas restringidas con `RoleRoute`

**Files:**
- Modify: `src/app/router.tsx`
- Test: `src/app/router.gating.test.tsx`

**Interfaces:**
- Consumes: `RoleRoute` (Task 5).
- Produces: rutas restringidas envueltas en `<Route element={<RoleRoute allow={[...]} />}>` con la misma matriz de Task 6 (excepto Dashboard, que es para todos). `/config/usuarios` se añade en Task 17 (aquí solo se protegen las rutas ya existentes).

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/router.gating.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/design-system'
import { AppRoutes } from './router'
import { useAuthStore } from './auth-store'

function setRol(rolNombre: string) {
  useAuthStore.setState({
    token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', status: 'authenticated',
    user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 1, rolNombre, emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [2], permisos: [] },
  })
}
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

describe('router gating por rol', () => {
  beforeEach(() => setRol('Cajero'))
  it('Cajero entrando a /cuentas-por-cobrar/configuracion-mora ve AccesoDenegado', async () => {
    setup('/cuentas-por-cobrar/configuracion-mora')
    expect(await screen.findByRole('heading', { name: /acceso denegado/i })).toBeInTheDocument()
  })
  it('EmisorAdmin sí accede a configuracion-mora', async () => {
    setRol('EmisorAdmin')
    setup('/cuentas-por-cobrar/configuracion-mora')
    // No debe mostrar AccesoDenegado (renderiza la página real o su loader)
    expect(screen.queryByRole('heading', { name: /acceso denegado/i })).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/app/router.gating.test.tsx`
Expected: FAIL (sin gating, Cajero no ve AccesoDenegado).

- [ ] **Step 3: Implementation — `router.tsx`**

Añade el import:

```tsx
import { RoleRoute } from './RoleRoute'
```

Envuelve cada grupo de rutas restringidas en un `<Route element={<RoleRoute allow={[...]} />}>`. Mantén `/dashboard` y `/` fuera de cualquier RoleRoute. Estructura resultante dentro de `<Route element={<AppLayout />}>`:

```tsx
          <Route path="/dashboard" element={<DashboardPlaceholder />} />

          <Route element={<RoleRoute allow={['EmisorAdmin', 'GerenteSucursal', 'Cajero']} />}>
            <Route path="/facturacion/emitir" element={<EmitirLandingPage />} />
            <Route path="/facturacion/emitir/:tipo" element={<EmitirDtePage />} />
          </Route>
          <Route element={<RoleRoute allow={['EmisorAdmin', 'GerenteSucursal', 'Cajero', 'Contador', 'Auditor']} />}>
            <Route path="/facturacion/historial" element={<HistorialPage />} />
            <Route path="/facturacion/:id" element={<DteDetallePage />} />
          </Route>

          <Route element={<RoleRoute allow={['EmisorAdmin', 'GerenteSucursal', 'Contador']} />}>
            <Route path="/compras" element={<ComprasListPage />} />
            <Route path="/compras/nueva" element={<CompraFormPage />} />
            <Route path="/compras/:id" element={<CompraDetallePage />} />
            <Route path="/compras/:id/editar" element={<CompraFormPage />} />
          </Route>
          <Route element={<RoleRoute allow={['EmisorAdmin', 'GerenteSucursal', 'Contador', 'Auditor']} />}>
            <Route path="/proveedores" element={<ProveedoresPage />} />
            <Route path="/dtes-recibidos" element={<DtesRecibidosListPage />} />
            <Route path="/dtes-recibidos/configuracion" element={<ConfiguracionCorreoPage />} />
            <Route path="/dtes-recibidos/gmail/callback" element={<GmailCallbackPage />} />
            <Route path="/dtes-recibidos/:id" element={<DteRecibidoDetallePage />} />
            <Route path="/dtes-recibidos/:id/mapear" element={<MapearDtePage />} />
          </Route>

          <Route element={<RoleRoute allow={['EmisorAdmin', 'GerenteSucursal', 'Cajero']} />}>
            <Route path="/cuentas-por-cobrar" element={<PlanesListPage />} />
            <Route path="/cuentas-por-cobrar/nueva" element={<CrearVentaCreditoPage />} />
            <Route path="/cuentas-por-cobrar/:planId" element={<PlanDetallePage />} />
          </Route>
          <Route element={<RoleRoute allow={['EmisorAdmin', 'GerenteSucursal']} />}>
            <Route path="/cuentas-por-cobrar/configuracion-mora" element={<ConfiguracionMoraPage />} />
          </Route>

          <Route element={<RoleRoute allow={['EmisorAdmin', 'GerenteSucursal', 'Cajero', 'Contador', 'Auditor']} />}>
            <Route path="/inventario/productos" element={<ProductosPage />} />
            <Route path="/inventario/productos/nuevo" element={<ProductoFormPage />} />
            <Route path="/inventario/productos/:id/editar" element={<ProductoFormPage />} />
            <Route path="/inventario/stock" element={<StockPage />} />
          </Route>
          <Route element={<RoleRoute allow={['EmisorAdmin', 'GerenteSucursal', 'Contador', 'Auditor']} />}>
            <Route path="/inventario/reportes" element={<ReportesInventarioPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
```

> Nota: `/inventario/productos/nuevo` y `/:id/editar` son POST/PUT (solo `EmisorAdmin,GerenteSucursal`), pero la visibilidad de la PÁGINA se gatea con los roles de lectura; el botón "Nuevo/Editar" se gatea a nivel de acción en la Entrega B. Aquí basta el grupo de lectura.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- --run src/app/router.gating.test.tsx src/app/router.inventario.test.tsx src/app/router.compras.test.tsx src/app/router.cxc.test.tsx src/app/router.dtes.test.tsx`
Expected: PASS. Los tests de ruta existentes usan `EmisorAdmin`, que califica en todos los grupos → siguen verdes.

- [ ] **Step 5: Commit**

```bash
git add src/app/router.tsx src/app/router.gating.test.tsx
git commit -m "feat(authz): proteger rutas existentes con RoleRoute (gating app-wide)"
```

---

## Fase 2 — Feature Usuarios (`src/features/usuarios/`)

### Task 8: Tipos del dominio

**Files:**
- Create: `src/features/usuarios/types.ts`
- Test: `src/features/usuarios/types.test.ts`

**Interfaces:**
- Produces: `UsuarioListDto`, `UsuarioDto`, `SucursalAsignada`, `CajaAsignada`, `Rol`, `CajaUsuario`, `PaginatedResponse<T>`, `CrearUsuarioDto`, `ActualizarUsuarioDto`, `ListarUsuariosParams`.

- [ ] **Step 1: Write the failing test**

```ts
// src/features/usuarios/types.test.ts
import { describe, it, expect } from 'vitest'
import type { UsuarioListDto, CrearUsuarioDto } from './types'

describe('tipos usuarios', () => {
  it('UsuarioListDto y CrearUsuarioDto compilan con la forma esperada', () => {
    const u: UsuarioListDto = {
      id: 1, nombreCompleto: 'Ana', email: 'a@x.com', activo: true, rolId: 5, rolNombre: 'EmisorAdmin',
      emisorNombre: 'E', accesoTodasSucursales: true, cantidadSucursales: 1, sucursalesNombres: 'Casa Matriz',
      sucursalIds: [2], fechaCreacion: '2026-06-30', ultimoAcceso: null,
    }
    const dto: CrearUsuarioDto = {
      nombreCompleto: 'Ana', email: 'a@x.com', rolId: 5, accesoTodasSucursales: true,
      sucursalIds: [], cajaIds: [], requiereCambioPwd: false,
    }
    expect(u.id).toBe(1)
    expect(dto.rolId).toBe(5)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/features/usuarios/types.test.ts`
Expected: FAIL (`./types` no existe).

- [ ] **Step 3: Write minimal implementation**

```ts
// src/features/usuarios/types.ts
export interface PaginatedResponse<T> {
  items: T[]
  currentPage: number
  totalPages: number
  pageSize: number
  totalCount: number
}

export interface SucursalAsignada { id: number; nombre: string }
export interface CajaAsignada { id: number; nombre: string; sucursalNombre?: string | null }

export interface UsuarioListDto {
  id: number
  nombreCompleto: string
  email: string
  activo: boolean
  rolId: number
  rolNombre: string
  emisorNombre: string
  accesoTodasSucursales: boolean
  cantidadSucursales: number
  sucursalesNombres: string
  sucursalIds: number[]
  cajas?: CajaAsignada[]
  fechaCreacion: string
  ultimoAcceso: string | null
}

export interface UsuarioDto {
  id: number
  nombreCompleto: string
  email: string
  requiereCambioPwd: boolean
  permiteCambioPwd: boolean
  activo: boolean
  fechaCreacion: string
  emisorId: number
  emisorNombre: string
  rolId: number
  rolNombre: string
  accesoTodasSucursales: boolean
  sucursales: SucursalAsignada[]
  cajas: CajaAsignada[]
  ultimoAcceso: string | null
}

export interface Rol { id: number; nombre: string }
export interface CajaUsuario { id: number; nombre: string; sucursalId: number; codigo: string }

export interface CrearUsuarioDto {
  nombreCompleto: string
  email: string
  password?: string
  requiereCambioPwd: boolean
  rolId: number
  accesoTodasSucursales: boolean
  sucursalIds: number[]
  cajaIds: number[]
}

export interface ActualizarUsuarioDto {
  nombreCompleto: string
  email: string
  activo: boolean
  rolId: number
  accesoTodasSucursales: boolean
  sucursalIds: number[]
  cajaIds: number[]
  requiereCambioPwd: boolean
  password?: string
}

export interface ListarUsuariosParams {
  pageNumber: number
  pageSize: number
  searchTerm?: string
  soloActivos?: boolean
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/features/usuarios/types.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/usuarios/types.ts src/features/usuarios/types.test.ts
git commit -m "feat(usuarios): tipos del dominio"
```

---

### Task 9: Capa API

**Files:**
- Create: `src/features/usuarios/api.ts`
- Test: `src/features/usuarios/api.test.ts`

**Interfaces:**
- Consumes: tipos (Task 8), `api` de `@/lib/http/axios`.
- Produces: `usuariosApi { listar, getById, crear, actualizar, toggleActive, eliminar }`, `rolesApi { listar }`, `cajasApi { listarTodas }`.

- [ ] **Step 1: Write the failing test**

```ts
// src/features/usuarios/api.test.ts
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { usuariosApi, rolesApi, cajasApi } from './api'

const base = 'http://localhost:8080/api'
const server = setupServer(
  http.get(`${base}/usuarios`, () => HttpResponse.json({ items: [{ id: 1, nombreCompleto: 'Ana' }], currentPage: 1, totalPages: 1, pageSize: 10, totalCount: 1 })),
  http.post(`${base}/usuarios`, () => HttpResponse.json({ id: 9 }, { status: 201 })),
  http.put(`${base}/usuarios/9`, () => HttpResponse.json({ id: 9 })),
  http.patch(`${base}/usuarios/9/toggle-active`, () => HttpResponse.json({ activo: false })),
  http.delete(`${base}/usuarios/9`, () => new HttpResponse(null, { status: 204 })),
  http.get(`${base}/roles`, () => HttpResponse.json([{ id: 5, nombre: 'EmisorAdmin' }])),
  http.get(`${base}/cajas`, () => HttpResponse.json([{ id: 1, nombre: 'Caja 1', sucursalId: 2, codigo: 'C1' }])),
)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('usuariosApi', () => {
  it('listar devuelve la página', async () => {
    const r = await usuariosApi.listar({ pageNumber: 1, pageSize: 10 })
    expect(r.totalCount).toBe(1)
    expect(r.items[0].nombreCompleto).toBe('Ana')
  })
  it('crear devuelve el creado', async () => {
    const r = await usuariosApi.crear({ nombreCompleto: 'X', email: 'x@x.com', rolId: 5, accesoTodasSucursales: true, sucursalIds: [], cajaIds: [], requiereCambioPwd: false })
    expect(r.id).toBe(9)
  })
  it('roles y cajas', async () => {
    expect((await rolesApi.listar())[0].nombre).toBe('EmisorAdmin')
    expect((await cajasApi.listarTodas())[0].id).toBe(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/features/usuarios/api.test.ts`
Expected: FAIL (`./api` no existe).

- [ ] **Step 3: Write minimal implementation**

```ts
// src/features/usuarios/api.ts
import { api } from '@/lib/http/axios'
import type {
  PaginatedResponse, UsuarioListDto, UsuarioDto, CrearUsuarioDto, ActualizarUsuarioDto,
  ListarUsuariosParams, Rol, CajaUsuario,
} from './types'

export const usuariosApi = {
  async listar(params: ListarUsuariosParams): Promise<PaginatedResponse<UsuarioListDto>> {
    const { data } = await api.get<PaginatedResponse<UsuarioListDto>>('/usuarios', { params })
    return data
  },
  async getById(id: number): Promise<UsuarioDto> {
    const { data } = await api.get<UsuarioDto>(`/usuarios/${id}`)
    return data
  },
  async crear(dto: CrearUsuarioDto): Promise<UsuarioDto> {
    const { data } = await api.post<UsuarioDto>('/usuarios', dto)
    return data
  },
  async actualizar(id: number, dto: ActualizarUsuarioDto): Promise<UsuarioDto> {
    const { data } = await api.put<UsuarioDto>(`/usuarios/${id}`, dto)
    return data
  },
  async toggleActive(id: number): Promise<void> { await api.patch(`/usuarios/${id}/toggle-active`) },
  async eliminar(id: number): Promise<void> { await api.delete(`/usuarios/${id}`) },
}

export const rolesApi = {
  async listar(): Promise<Rol[]> { const { data } = await api.get<Rol[]>('/roles'); return data },
}

export const cajasApi = {
  async listarTodas(): Promise<CajaUsuario[]> {
    const { data } = await api.get<CajaUsuario[]>('/cajas', { params: { soloActivos: true } })
    return data
  },
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/features/usuarios/api.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/usuarios/api.ts src/features/usuarios/api.test.ts
git commit -m "feat(usuarios): capa API (usuarios/roles/cajas)"
```

---

### Task 10: Schemas de validación (zod)

**Files:**
- Create: `src/features/usuarios/schemas.ts`
- Test: `src/features/usuarios/schemas.test.ts`

**Interfaces:**
- Produces: `crearUsuarioSchema`, `actualizarUsuarioSchema`, `type CrearUsuarioForm`, `type ActualizarUsuarioForm`, `toCrearDto(form)`, `toActualizarDto(form)`.

- [ ] **Step 1: Write the failing test**

```ts
// src/features/usuarios/schemas.test.ts
import { describe, it, expect } from 'vitest'
import { crearUsuarioSchema, toCrearDto } from './schemas'

const baseManual = {
  nombreCompleto: 'Ana Pérez', email: 'ana@x.com', rolId: 5,
  accesoTodasSucursales: true, sucursalIds: [] as number[], cajaIds: [] as number[],
  modoPassword: 'manual' as const, password: 'Secreta123', confirmar: 'Secreta123', requiereCambioPwd: true,
}

describe('crearUsuarioSchema', () => {
  it('válido en modo manual con passwords coincidentes', () => {
    expect(crearUsuarioSchema.safeParse(baseManual).success).toBe(true)
  })
  it('falla si las contraseñas no coinciden', () => {
    const r = crearUsuarioSchema.safeParse({ ...baseManual, confirmar: 'otra' })
    expect(r.success).toBe(false)
  })
  it('falla si password < 8 en modo manual', () => {
    const r = crearUsuarioSchema.safeParse({ ...baseManual, password: 'corta', confirmar: 'corta' })
    expect(r.success).toBe(false)
  })
  it('modo correo no exige password', () => {
    const r = crearUsuarioSchema.safeParse({ ...baseManual, modoPassword: 'correo', password: '', confirmar: '' })
    expect(r.success).toBe(true)
  })
  it('exige al menos una sucursal si no es acceso a todas', () => {
    const r = crearUsuarioSchema.safeParse({ ...baseManual, accesoTodasSucursales: false, sucursalIds: [] })
    expect(r.success).toBe(false)
  })
  it('toCrearDto: modo correo => password undefined', () => {
    const form = { ...baseManual, modoPassword: 'correo' as const, password: '', confirmar: '' }
    const dto = toCrearDto(form)
    expect(dto.password).toBeUndefined()
  })
  it('toCrearDto: modo manual => password presente', () => {
    expect(toCrearDto(baseManual).password).toBe('Secreta123')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/features/usuarios/schemas.test.ts`
Expected: FAIL (`./schemas` no existe).

- [ ] **Step 3: Write minimal implementation**

```ts
// src/features/usuarios/schemas.ts
import { z } from 'zod'
import type { CrearUsuarioDto, ActualizarUsuarioDto } from './types'

const sucursalesValidas = (d: { accesoTodasSucursales: boolean; sucursalIds: number[] }) =>
  d.accesoTodasSucursales || d.sucursalIds.length > 0

export const crearUsuarioSchema = z.object({
  nombreCompleto: z.string().trim().min(1, 'Nombre requerido'),
  email: z.string().trim().email('Email inválido'),
  rolId: z.number().int().positive('Seleccione un rol'),
  accesoTodasSucursales: z.boolean(),
  sucursalIds: z.array(z.number().int()),
  cajaIds: z.array(z.number().int()),
  modoPassword: z.enum(['correo', 'manual']),
  password: z.string().optional().default(''),
  confirmar: z.string().optional().default(''),
  requiereCambioPwd: z.boolean(),
})
  .refine(sucursalesValidas, { message: 'Seleccione al menos una sucursal', path: ['sucursalIds'] })
  .refine((d) => d.modoPassword !== 'manual' || (d.password ?? '').length >= 8, { message: 'Mínimo 8 caracteres', path: ['password'] })
  .refine((d) => d.modoPassword !== 'manual' || d.password === d.confirmar, { message: 'Las contraseñas no coinciden', path: ['confirmar'] })

export type CrearUsuarioForm = z.input<typeof crearUsuarioSchema>

export const actualizarUsuarioSchema = z.object({
  nombreCompleto: z.string().trim().min(1, 'Nombre requerido'),
  email: z.string().trim().email('Email inválido'),
  rolId: z.number().int().positive('Seleccione un rol'),
  activo: z.boolean(),
  accesoTodasSucursales: z.boolean(),
  sucursalIds: z.array(z.number().int()),
  cajaIds: z.array(z.number().int()),
  requiereCambioPwd: z.boolean(),
  resetPassword: z.boolean(),
  password: z.string().optional().default(''),
  confirmar: z.string().optional().default(''),
})
  .refine(sucursalesValidas, { message: 'Seleccione al menos una sucursal', path: ['sucursalIds'] })
  .refine((d) => !d.resetPassword || (d.password ?? '').length >= 8, { message: 'Mínimo 8 caracteres', path: ['password'] })
  .refine((d) => !d.resetPassword || d.password === d.confirmar, { message: 'Las contraseñas no coinciden', path: ['confirmar'] })

export type ActualizarUsuarioForm = z.input<typeof actualizarUsuarioSchema>

export function toCrearDto(f: CrearUsuarioForm): CrearUsuarioDto {
  return {
    nombreCompleto: f.nombreCompleto.trim(),
    email: f.email.trim(),
    rolId: f.rolId,
    accesoTodasSucursales: f.accesoTodasSucursales,
    sucursalIds: f.accesoTodasSucursales ? [] : f.sucursalIds,
    cajaIds: f.cajaIds,
    requiereCambioPwd: f.requiereCambioPwd,
    password: f.modoPassword === 'manual' ? f.password : undefined,
  }
}

export function toActualizarDto(f: ActualizarUsuarioForm): ActualizarUsuarioDto {
  return {
    nombreCompleto: f.nombreCompleto.trim(),
    email: f.email.trim(),
    rolId: f.rolId,
    activo: f.activo,
    accesoTodasSucursales: f.accesoTodasSucursales,
    sucursalIds: f.accesoTodasSucursales ? [] : f.sucursalIds,
    cajaIds: f.cajaIds,
    requiereCambioPwd: f.requiereCambioPwd,
    password: f.resetPassword ? f.password : undefined,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/features/usuarios/schemas.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/usuarios/schemas.ts src/features/usuarios/schemas.test.ts
git commit -m "feat(usuarios): schemas zod (crear/actualizar) + mappers a DTO"
```

---

### Task 11: Hooks React Query

**Files:**
- Create: `src/features/usuarios/hooks.ts`
- Test: `src/features/usuarios/hooks.test.tsx`

**Interfaces:**
- Consumes: `usuariosApi`, `rolesApi`, `cajasApi` (Task 9), tipos (Task 8).
- Produces: `useUsuarios(params)`, `useUsuario(id)`, `useRoles()`, `useCajasUsuarios()`, `useCrearUsuario()`, `useActualizarUsuario()`, `useToggleUsuario()`, `useEliminarUsuario()`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/usuarios/hooks.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { useUsuarios, useRoles } from './hooks'

const base = 'http://localhost:8080/api'
const server = setupServer(
  http.get(`${base}/usuarios`, () => HttpResponse.json({ items: [{ id: 1, nombreCompleto: 'Ana' }], currentPage: 1, totalPages: 1, pageSize: 10, totalCount: 1 })),
  http.get(`${base}/roles`, () => HttpResponse.json([{ id: 5, nombre: 'EmisorAdmin' }])),
)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('hooks usuarios', () => {
  it('useUsuarios carga la lista', async () => {
    const { result } = renderHook(() => useUsuarios({ pageNumber: 1, pageSize: 10 }), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.totalCount).toBe(1)
  })
  it('useRoles carga los roles', async () => {
    const { result } = renderHook(() => useRoles(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.[0].nombre).toBe('EmisorAdmin')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/features/usuarios/hooks.test.tsx`
Expected: FAIL (`./hooks` no existe).

- [ ] **Step 3: Write minimal implementation**

```ts
// src/features/usuarios/hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usuariosApi, rolesApi, cajasApi } from './api'
import type { ListarUsuariosParams, CrearUsuarioDto, ActualizarUsuarioDto } from './types'

const HORA = 1000 * 60 * 60

export function useUsuarios(params: ListarUsuariosParams) {
  return useQuery({ queryKey: ['usuarios', params], queryFn: () => usuariosApi.listar(params) })
}
export function useUsuario(id: number) {
  return useQuery({ queryKey: ['usuario', id], queryFn: () => usuariosApi.getById(id), enabled: Number.isFinite(id) && id > 0 })
}
export function useRoles() {
  return useQuery({ queryKey: ['roles'], queryFn: () => rolesApi.listar(), staleTime: HORA })
}
export function useCajasUsuarios() {
  return useQuery({ queryKey: ['cajas-todas'], queryFn: () => cajasApi.listarTodas(), staleTime: HORA })
}
export function useCrearUsuario() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (dto: CrearUsuarioDto) => usuariosApi.crear(dto), onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }) })
}
export function useActualizarUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: ActualizarUsuarioDto }) => usuariosApi.actualizar(id, dto),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ['usuarios'] }); qc.invalidateQueries({ queryKey: ['usuario', v.id] }) },
  })
}
export function useToggleUsuario() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: number) => usuariosApi.toggleActive(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }) })
}
export function useEliminarUsuario() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: number) => usuariosApi.eliminar(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }) })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/features/usuarios/hooks.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/usuarios/hooks.ts src/features/usuarios/hooks.test.tsx
git commit -m "feat(usuarios): hooks React Query (queries + mutaciones)"
```

---

### Task 12: Handlers MSW + registro

**Files:**
- Create: `src/test/msw/usuarios-handlers.ts`
- Modify: `src/test/msw/handlers.ts` (registrar `usuariosHandlers`)
- Test: `src/test/msw/usuarios-handlers.test.ts`

**Interfaces:**
- Produces: `usuariosHandlers`, `usuarioListaEjemplo`, `usuarioDetalleEjemplo`, `rolesEjemplo`, `cajasEjemplo`.

- [ ] **Step 1: Write the failing test**

```ts
// src/test/msw/usuarios-handlers.test.ts
import { describe, it, expect } from 'vitest'
import { usuariosHandlers } from './usuarios-handlers'

describe('usuariosHandlers', () => {
  it('cubre usuarios, roles y cajas', () => {
    expect(usuariosHandlers.length).toBeGreaterThanOrEqual(6)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/test/msw/usuarios-handlers.test.ts`
Expected: FAIL (`./usuarios-handlers` no existe).

- [ ] **Step 3: Write minimal implementation**

```ts
// src/test/msw/usuarios-handlers.ts
import { http, HttpResponse } from 'msw'
import type { UsuarioListDto, UsuarioDto } from '@/features/usuarios/types'

const base = 'http://localhost:8080/api'

export const usuarioListaEjemplo: UsuarioListDto = {
  id: 1, nombreCompleto: 'Ana Pérez', email: 'ana@x.com', activo: true, rolId: 5, rolNombre: 'EmisorAdmin',
  emisorNombre: 'Empresa E2E', accesoTodasSucursales: true, cantidadSucursales: 1, sucursalesNombres: 'Casa Matriz',
  sucursalIds: [2], cajas: [], fechaCreacion: '2026-06-30', ultimoAcceso: null,
}
export const usuarioDetalleEjemplo: UsuarioDto = {
  id: 1, nombreCompleto: 'Ana Pérez', email: 'ana@x.com', requiereCambioPwd: false, permiteCambioPwd: true,
  activo: true, fechaCreacion: '2026-06-30', emisorId: 3, emisorNombre: 'Empresa E2E', rolId: 5, rolNombre: 'EmisorAdmin',
  accesoTodasSucursales: true, sucursales: [{ id: 2, nombre: 'Casa Matriz' }], cajas: [], ultimoAcceso: null,
}
export const rolesEjemplo = [
  { id: 1, nombre: 'SuperAdmin' }, { id: 5, nombre: 'EmisorAdmin' }, { id: 6, nombre: 'GerenteSucursal' },
  { id: 7, nombre: 'Cajero' }, { id: 8, nombre: 'Auditor' }, { id: 9, nombre: 'Contador' },
]
export const cajasEjemplo = [{ id: 1, nombre: 'Caja Principal', sucursalId: 2, codigo: 'C1' }]

const page = (item: UsuarioListDto) => ({ items: [item], currentPage: 1, totalPages: 1, pageSize: 10, totalCount: 1 })

export const usuariosHandlers = [
  http.get(`${base}/usuarios`, () => HttpResponse.json(page(usuarioListaEjemplo))),
  http.get(`${base}/usuarios/1`, () => HttpResponse.json(usuarioDetalleEjemplo)),
  http.post(`${base}/usuarios`, () => HttpResponse.json({ ...usuarioDetalleEjemplo, id: 2 }, { status: 201 })),
  http.put(`${base}/usuarios/:id`, () => HttpResponse.json(usuarioDetalleEjemplo)),
  http.patch(`${base}/usuarios/:id/toggle-active`, () => HttpResponse.json({ activo: false })),
  http.delete(`${base}/usuarios/:id`, () => new HttpResponse(null, { status: 204 })),
  http.get(`${base}/roles`, () => HttpResponse.json(rolesEjemplo)),
  http.get(`${base}/cajas`, () => HttpResponse.json(cajasEjemplo)),
]
```

- [ ] **Step 4: Register in `handlers.ts`**

Lee `src/test/msw/handlers.ts` y añade el import y el spread, igual que con `inventarioHandlers`:

```ts
import { usuariosHandlers } from './usuarios-handlers'
```

y dentro del array exportado (`export const handlers = [ ... ]`), añade `...usuariosHandlers,`.

> NOTA: el handler `/cajas` ya podría existir en otro archivo de handlers (facturación). MSW usa el primero que matchea; si hay colisión en el array global, coloca `...usuariosHandlers` ANTES o ajusta para evitar duplicar `/cajas`/`/roles`. Para los tests de unidad de usuarios usamos servers locales, así que la colisión global solo afectaría tests que monten el router completo (Task 17); ahí el detalle de cajas/roles no se asercióna.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test -- --run src/test/msw/usuarios-handlers.test.ts`
Expected: PASS. Además corre la suite de MSW handlers existente si la hay: `npm run test -- --run src/test/msw/`.

- [ ] **Step 6: Commit**

```bash
git add src/test/msw/usuarios-handlers.ts src/test/msw/handlers.ts src/test/msw/usuarios-handlers.test.ts
git commit -m "test(usuarios): handlers MSW (usuarios/roles/cajas) registrados"
```

---

### Task 13: Componente `UsuariosTable`

**Files:**
- Create: `src/features/usuarios/components/UsuariosTable.tsx`
- Test: `src/features/usuarios/components/UsuariosTable.test.tsx`

**Interfaces:**
- Consumes: `UsuarioListDto` (Task 8), design-system (`Badge`, `Button`, `EmptyState`, `Icon`), `Can` (Task 3).
- Produces: `<UsuariosTable usuarios={UsuarioListDto[]} onEditar onToggle onEliminar />`. Acciones envueltas en `<Can roles={['SuperAdmin','EmisorAdmin','GerenteSucursal']}>`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/usuarios/components/UsuariosTable.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UsuariosTable } from './UsuariosTable'
import { useAuthStore } from '@/app/auth-store'
import type { UsuarioListDto } from '../types'

function setRol(rolNombre: string) {
  useAuthStore.setState({ token: 't', status: 'authenticated', user: { userId: 1, nombreCompleto: 'X', email: 'x@x.com', rolId: 1, rolNombre, emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [2], permisos: [] } })
}
const u: UsuarioListDto = {
  id: 1, nombreCompleto: 'Ana Pérez', email: 'ana@x.com', activo: true, rolId: 5, rolNombre: 'EmisorAdmin',
  emisorNombre: 'E', accesoTodasSucursales: true, cantidadSucursales: 1, sucursalesNombres: 'Casa Matriz',
  sucursalIds: [2], cajas: [], fechaCreacion: '2026-06-30', ultimoAcceso: null,
}

describe('UsuariosTable', () => {
  beforeEach(() => setRol('EmisorAdmin'))
  it('muestra nombre, email y rol', () => {
    render(<UsuariosTable usuarios={[u]} onEditar={() => {}} onToggle={() => {}} onEliminar={() => {}} />)
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument()
    expect(screen.getByText('ana@x.com')).toBeInTheDocument()
    expect(screen.getByText('EmisorAdmin')).toBeInTheDocument()
  })
  it('estado vacío si no hay usuarios', () => {
    render(<UsuariosTable usuarios={[]} onEditar={() => {}} onToggle={() => {}} onEliminar={() => {}} />)
    expect(screen.getByText(/sin usuarios/i)).toBeInTheDocument()
  })
  it('Auditor no ve botón Editar', () => {
    setRol('Auditor')
    render(<UsuariosTable usuarios={[u]} onEditar={() => {}} onToggle={() => {}} onEliminar={() => {}} />)
    expect(screen.queryByRole('button', { name: /editar/i })).toBeNull()
  })
  it('click Editar dispara onEditar con el usuario', async () => {
    const onEditar = vi.fn()
    render(<UsuariosTable usuarios={[u]} onEditar={onEditar} onToggle={() => {}} onEliminar={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /editar/i }))
    expect(onEditar).toHaveBeenCalledWith(u)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/features/usuarios/components/UsuariosTable.test.tsx`
Expected: FAIL (`./UsuariosTable` no existe).

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/features/usuarios/components/UsuariosTable.tsx
import { Badge, Button, EmptyState } from '@/design-system'
import { Can } from '@/lib/authz/Can'
import type { UsuarioListDto } from '../types'

interface Props {
  usuarios: UsuarioListDto[]
  onEditar: (u: UsuarioListDto) => void
  onToggle: (u: UsuarioListDto) => void
  onEliminar: (u: UsuarioListDto) => void
}

const ROLES_ESCRITURA = ['SuperAdmin', 'EmisorAdmin', 'GerenteSucursal'] as const

export function UsuariosTable({ usuarios, onEditar, onToggle, onEliminar }: Props) {
  if (usuarios.length === 0) return <EmptyState title="Sin usuarios" hint="No hay usuarios que coincidan con el filtro." />

  return (
    <div className="overflow-x-auto rounded-lg border border-hairline dark:border-white/10">
      <table className="w-full text-sm">
        <thead className="bg-surface text-left text-xs uppercase tracking-wide text-slate dark:bg-surface-dark">
          <tr>
            <th className="px-3 py-2">Nombre</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Rol</th>
            <th className="px-3 py-2">Sucursales</th>
            <th className="px-3 py-2">Estado</th>
            <th className="px-3 py-2 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id} className="border-t border-hairline dark:border-white/10">
              <td className="px-3 py-2 font-medium text-ink">{u.nombreCompleto}</td>
              <td className="px-3 py-2 text-slate">{u.email}</td>
              <td className="px-3 py-2">{u.rolNombre}</td>
              <td className="px-3 py-2 text-slate">{u.accesoTodasSucursales ? 'Todas' : (u.sucursalesNombres || `${u.cantidadSucursales}`)}</td>
              <td className="px-3 py-2">
                <Badge estado={u.activo ? 'recibido' : 'rechazado'}>{u.activo ? 'Activo' : 'Inactivo'}</Badge>
              </td>
              <td className="px-3 py-2">
                <Can roles={[...ROLES_ESCRITURA]}>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => onEditar(u)}>Editar</Button>
                    <Button variant="ghost" onClick={() => onToggle(u)}>{u.activo ? 'Desactivar' : 'Activar'}</Button>
                    <Button variant="ghost" onClick={() => onEliminar(u)}>Eliminar</Button>
                  </div>
                </Can>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

> NOTA implementador: confirma los `estado` válidos de `Badge` (memoria: `recibido/pendiente/rechazado/borrador`) y que `EmptyState` acepte `hint`. Ajusta si la firma difiere.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/features/usuarios/components/UsuariosTable.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/usuarios/components/UsuariosTable.tsx src/features/usuarios/components/UsuariosTable.test.tsx
git commit -m "feat(usuarios): UsuariosTable con acciones gateadas por rol"
```

---

### Task 14: Componente `UsuarioFormModal` (crear/editar)

**Files:**
- Create: `src/features/usuarios/components/UsuarioFormModal.tsx`
- Test: `src/features/usuarios/components/UsuarioFormModal.test.tsx`

**Interfaces:**
- Consumes: `Modal, Button, FormField, Input` (design-system), `useRoles`, `useCajasUsuarios` (Task 11), `useSucursales` de `@/features/facturacion/hooks`, schemas + mappers (Task 10), tipos (Task 8).
- Produces: `<UsuarioFormModal inicial?={UsuarioDto | null} onGuardarCrear onGuardarEditar onClose cargando />`. Usa inner-form con `key` (patrón sin `useEffect`).

> Diseño del componente: `UsuarioFormModal` (export) renderiza `<Modal>` y dentro un `<UsuarioFormInner key={inicial?.id ?? 'nuevo'} ... />` que contiene todo el estado del form. Crear → muestra radio de modo de password; editar → checkbox "Resetear contraseña" + select de estado activo.

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/usuarios/components/UsuarioFormModal.test.tsx
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { UsuarioFormModal } from './UsuarioFormModal'

const base = 'http://localhost:8080/api'
const server = setupServer(
  http.get(`${base}/roles`, () => HttpResponse.json([{ id: 5, nombre: 'EmisorAdmin' }, { id: 7, nombre: 'Cajero' }])),
  http.get(`${base}/cajas`, () => HttpResponse.json([{ id: 1, nombre: 'Caja 1', sucursalId: 2, codigo: 'C1' }])),
  http.get(`${base}/sucursales/todas-activas`, () => HttpResponse.json([{ id: 2, nombre: 'Casa Matriz' }])),
)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('UsuarioFormModal (crear)', () => {
  it('valida que el nombre es requerido', async () => {
    const onGuardarCrear = vi.fn()
    render(<UsuarioFormModal inicial={null} onGuardarCrear={onGuardarCrear} onGuardarEditar={() => {}} onClose={() => {}} cargando={false} />, { wrapper })
    await screen.findByText('Casa Matriz')
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }))
    expect(await screen.findByText(/nombre requerido/i)).toBeInTheDocument()
    expect(onGuardarCrear).not.toHaveBeenCalled()
  })

  it('crea en modo correo con datos válidos', async () => {
    const onGuardarCrear = vi.fn()
    render(<UsuarioFormModal inicial={null} onGuardarCrear={onGuardarCrear} onGuardarEditar={() => {}} onClose={() => {}} cargando={false} />, { wrapper })
    await screen.findByText('Casa Matriz')
    await userEvent.type(screen.getByLabelText(/nombre completo/i), 'Ana Pérez')
    await userEvent.type(screen.getByLabelText(/email/i), 'ana@x.com')
    await userEvent.selectOptions(screen.getByLabelText(/rol/i), '5')
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }))
    await waitFor(() => expect(onGuardarCrear).toHaveBeenCalledTimes(1))
    expect(onGuardarCrear.mock.calls[0][0]).toMatchObject({ nombreCompleto: 'Ana Pérez', email: 'ana@x.com', rolId: 5 })
    expect(onGuardarCrear.mock.calls[0][0].password).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/features/usuarios/components/UsuarioFormModal.test.tsx`
Expected: FAIL (`./UsuarioFormModal` no existe).

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/features/usuarios/components/UsuarioFormModal.tsx
import { useState } from 'react'
import { Modal, Button, FormField, Input } from '@/design-system'
import { useRoles, useCajasUsuarios } from '../hooks'
import { useSucursales } from '@/features/facturacion/hooks'
import { crearUsuarioSchema, actualizarUsuarioSchema, toCrearDto, toActualizarDto } from '../schemas'
import type { UsuarioDto, CrearUsuarioDto, ActualizarUsuarioDto } from '../types'

interface Props {
  inicial?: UsuarioDto | null
  onGuardarCrear: (dto: CrearUsuarioDto) => void
  onGuardarEditar: (id: number, dto: ActualizarUsuarioDto) => void
  onClose: () => void
  cargando: boolean
}

export function UsuarioFormModal({ inicial, onGuardarCrear, onGuardarEditar, onClose, cargando }: Props) {
  return (
    <Modal open onClose={onClose} title={inicial ? 'Editar usuario' : 'Nuevo usuario'}>
      <UsuarioFormInner
        key={inicial?.id ?? 'nuevo'}
        inicial={inicial}
        onGuardarCrear={onGuardarCrear}
        onGuardarEditar={onGuardarEditar}
        onClose={onClose}
        cargando={cargando}
      />
    </Modal>
  )
}

function UsuarioFormInner({ inicial, onGuardarCrear, onGuardarEditar, onClose, cargando }: Props) {
  const esEdicion = !!inicial
  const roles = useRoles()
  const sucursales = useSucursales()
  const cajas = useCajasUsuarios()

  const [nombreCompleto, setNombre] = useState(inicial?.nombreCompleto ?? '')
  const [email, setEmail] = useState(inicial?.email ?? '')
  const [rolId, setRolId] = useState<number>(inicial?.rolId ?? 0)
  const [activo, setActivo] = useState(inicial?.activo ?? true)
  const [accesoTodas, setAccesoTodas] = useState(inicial?.accesoTodasSucursales ?? true)
  const [sucursalIds, setSucursalIds] = useState<number[]>(inicial?.sucursales.map((s) => s.id) ?? [])
  const [cajaIds, setCajaIds] = useState<number[]>(inicial?.cajas.map((c) => c.id) ?? [])
  const [modoPassword, setModoPassword] = useState<'correo' | 'manual'>('correo')
  const [resetPassword, setResetPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [requiereCambioPwd, setRequiere] = useState(esEdicion ? (inicial?.requiereCambioPwd ?? false) : true)
  const [errores, setErrores] = useState<Record<string, string>>({})

  const rolSeleccionado = roles.data?.find((r) => r.id === rolId)
  const esCajero = rolSeleccionado?.nombre === 'Cajero'

  const toggleEn = (arr: number[], id: number) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id])

  const guardar = () => {
    setErrores({})
    if (esEdicion && inicial) {
      const form = { nombreCompleto, email, rolId, activo, accesoTodasSucursales: accesoTodas, sucursalIds, cajaIds: esCajero ? cajaIds : [], requiereCambioPwd, resetPassword, password, confirmar }
      const res = actualizarUsuarioSchema.safeParse(form)
      if (!res.success) { setErrores(mapErrores(res.error)); return }
      onGuardarEditar(inicial.id, toActualizarDto(res.data))
    } else {
      const form = { nombreCompleto, email, rolId, accesoTodasSucursales: accesoTodas, sucursalIds, cajaIds: esCajero ? cajaIds : [], modoPassword, password, confirmar, requiereCambioPwd }
      const res = crearUsuarioSchema.safeParse(form)
      if (!res.success) { setErrores(mapErrores(res.error)); return }
      onGuardarCrear(toCrearDto(res.data))
    }
  }

  return (
    <div className="space-y-3">
      <FormField label="Nombre completo" htmlFor="u-nombre" error={errores.nombreCompleto}>
        <Input id="u-nombre" value={nombreCompleto} onChange={(e) => setNombre(e.target.value)} />
      </FormField>
      <FormField label="Email" htmlFor="u-email" error={errores.email}>
        <Input id="u-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </FormField>
      <FormField label="Rol" htmlFor="u-rol" error={errores.rolId}>
        <select id="u-rol" className="w-full rounded-md border border-hairline bg-transparent px-3 py-2 text-sm" value={rolId} onChange={(e) => setRolId(Number(e.target.value))}>
          <option value={0}>Seleccione…</option>
          {roles.data?.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
        </select>
      </FormField>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={accesoTodas} onChange={(e) => setAccesoTodas(e.target.checked)} />
        Acceso a todas las sucursales
      </label>

      {!accesoTodas && (
        <FormField label="Sucursales" htmlFor="u-sucs" error={errores.sucursalIds}>
          <div id="u-sucs" className="space-y-1">
            {sucursales.data?.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={sucursalIds.includes(s.id)} onChange={() => setSucursalIds((a) => toggleEn(a, s.id))} />
                {s.nombre}
              </label>
            ))}
          </div>
        </FormField>
      )}

      {esCajero && (
        <FormField label="Cajas asignadas" htmlFor="u-cajas">
          <div id="u-cajas" className="space-y-1">
            {cajas.data?.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={cajaIds.includes(c.id)} onChange={() => setCajaIds((a) => toggleEn(a, c.id))} />
                {c.nombre}
              </label>
            ))}
          </div>
        </FormField>
      )}

      {!esEdicion && (
        <fieldset className="space-y-2 rounded-md border border-hairline p-3">
          <legend className="px-1 text-xs uppercase tracking-wide text-slate">Contraseña</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="modo-pwd" checked={modoPassword === 'correo'} onChange={() => setModoPassword('correo')} />
            Enviar clave temporal por correo
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="modo-pwd" checked={modoPassword === 'manual'} onChange={() => setModoPassword('manual')} />
            Fijar contraseña ahora
          </label>
          {modoPassword === 'manual' && (
            <>
              <FormField label="Contraseña" htmlFor="u-pwd" error={errores.password}>
                <Input id="u-pwd" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </FormField>
              <FormField label="Confirmar contraseña" htmlFor="u-pwd2" error={errores.confirmar}>
                <Input id="u-pwd2" type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
              </FormField>
            </>
          )}
        </fieldset>
      )}

      {esEdicion && (
        <>
          <FormField label="Estado" htmlFor="u-activo">
            <select id="u-activo" className="w-full rounded-md border border-hairline bg-transparent px-3 py-2 text-sm" value={activo ? '1' : '0'} onChange={(e) => setActivo(e.target.value === '1')}>
              <option value="1">Activo</option>
              <option value="0">Inactivo</option>
            </select>
          </FormField>
          <fieldset className="space-y-2 rounded-md border border-hairline p-3">
            <legend className="px-1 text-xs uppercase tracking-wide text-slate">Contraseña</legend>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={resetPassword} onChange={(e) => setResetPassword(e.target.checked)} />
              Resetear contraseña
            </label>
            {resetPassword && (
              <>
                <FormField label="Nueva contraseña" htmlFor="u-rpwd" error={errores.password}>
                  <Input id="u-rpwd" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </FormField>
                <FormField label="Confirmar contraseña" htmlFor="u-rpwd2" error={errores.confirmar}>
                  <Input id="u-rpwd2" type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
                </FormField>
              </>
            )}
          </fieldset>
        </>
      )}

      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={requiereCambioPwd} onChange={(e) => setRequiere(e.target.checked)} />
        Requiere cambio de contraseña en el próximo ingreso
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={guardar} disabled={cargando}>{cargando ? 'Guardando…' : 'Guardar'}</Button>
      </div>
    </div>
  )
}

function mapErrores(err: import('zod').ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? '_')
    if (!out[key]) out[key] = issue.message
  }
  return out
}
```

> NOTA implementador: verifica que `FormField` acepte la prop `error` (CategoriaFormModal mostraba el error manualmente; si `FormField` no la soporta, muestra `errores.campo` como `<p className="text-sm text-rojo">` bajo cada `Input`, o usa la firma real de `FormField`). El test asercióna el texto "Nombre requerido" presente — adapta la presentación para que ese texto se renderice.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/features/usuarios/components/UsuarioFormModal.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/usuarios/components/UsuarioFormModal.tsx src/features/usuarios/components/UsuarioFormModal.test.tsx
git commit -m "feat(usuarios): UsuarioFormModal (crear/editar, ambos modos de password)"
```

---

### Task 15: Página `UsuariosPage`

**Files:**
- Create: `src/features/usuarios/pages/UsuariosPage.tsx`
- Test: `src/features/usuarios/pages/UsuariosPage.test.tsx`

**Interfaces:**
- Consumes: hooks (Task 11), `UsuariosTable` (Task 13), `UsuarioFormModal` (Task 14), `Can` (Task 3), design-system (`Button, Input, Spinner, useToast`).
- Produces: `<UsuariosPage />` (heading "Usuarios"). Buscador + filtro activos + paginación simple + botón "Nuevo usuario" (gateado) + flujo crear/editar/toggle/eliminar con toasts.

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/usuarios/pages/UsuariosPage.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { ToastProvider } from '@/design-system'
import type { ReactNode } from 'react'
import { UsuariosPage } from './UsuariosPage'
import { useAuthStore } from '@/app/auth-store'
import { usuariosHandlers } from '@/test/msw/usuarios-handlers'

const server = setupServer(...usuariosHandlers)
beforeEach(() => {
  useAuthStore.setState({ token: 't', status: 'authenticated', user: { userId: 1, nombreCompleto: 'X', email: 'x@x.com', rolId: 5, rolNombre: 'EmisorAdmin', emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [2], permisos: [] } })
})
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider><UsuariosPage /></ToastProvider>
    </QueryClientProvider>,
  )
}

describe('UsuariosPage', () => {
  it('lista usuarios y muestra el botón Nuevo para EmisorAdmin', async () => {
    setup()
    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /nuevo usuario/i })).toBeInTheDocument()
  })
  it('Auditor no ve el botón Nuevo', async () => {
    useAuthStore.setState({ token: 't', status: 'authenticated', user: { userId: 1, nombreCompleto: 'X', email: 'x@x.com', rolId: 8, rolNombre: 'Auditor', emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [2], permisos: [] } })
    setup()
    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /nuevo usuario/i })).toBeNull()
  })
})
```

> NOTA: añade los imports `beforeAll, afterEach, afterAll` desde `vitest` al inicio del archivo de test.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/features/usuarios/pages/UsuariosPage.test.tsx`
Expected: FAIL (`./UsuariosPage` no existe).

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/features/usuarios/pages/UsuariosPage.tsx
import { useState } from 'react'
import { Button, Input, Spinner, useToast } from '@/design-system'
import { Can } from '@/lib/authz/Can'
import { UsuariosTable } from '../components/UsuariosTable'
import { UsuarioFormModal } from '../components/UsuarioFormModal'
import {
  useUsuarios, useUsuario, useCrearUsuario, useActualizarUsuario, useToggleUsuario, useEliminarUsuario,
} from '../hooks'
import type { CrearUsuarioDto, ActualizarUsuarioDto, UsuarioListDto } from '../types'

const ROLES_ESCRITURA = ['SuperAdmin', 'EmisorAdmin', 'GerenteSucursal'] as const

export function UsuariosPage() {
  const toast = useToast()
  const [pageNumber, setPage] = useState(1)
  const [busqueda, setBusqueda] = useState('')
  const [soloActivos, setSoloActivos] = useState(false)
  const [modal, setModal] = useState<{ abierto: boolean; editId: number | null }>({ abierto: false, editId: null })

  const lista = useUsuarios({ pageNumber, pageSize: 10, searchTerm: busqueda || undefined, soloActivos: soloActivos || undefined })
  const detalle = useUsuario(modal.editId ?? 0)
  const crear = useCrearUsuario()
  const actualizar = useActualizarUsuario()
  const toggle = useToggleUsuario()
  const eliminar = useEliminarUsuario()

  const abrirNuevo = () => setModal({ abierto: true, editId: null })
  const abrirEditar = (u: UsuarioListDto) => setModal({ abierto: true, editId: u.id })
  const cerrar = () => setModal({ abierto: false, editId: null })

  const onCrear = (dto: CrearUsuarioDto) => {
    crear.mutate(dto, {
      onSuccess: () => { toast.show({ tone: 'success', mensaje: 'Usuario creado' }); cerrar() },
      onError: () => toast.show({ tone: 'error', mensaje: 'No se pudo crear el usuario' }),
    })
  }
  const onEditar = (id: number, dto: ActualizarUsuarioDto) => {
    actualizar.mutate({ id, dto }, {
      onSuccess: () => { toast.show({ tone: 'success', mensaje: 'Usuario actualizado' }); cerrar() },
      onError: () => toast.show({ tone: 'error', mensaje: 'No se pudo actualizar' }),
    })
  }
  const onToggle = (u: UsuarioListDto) => {
    toggle.mutate(u.id, {
      onSuccess: () => toast.show({ tone: 'success', mensaje: u.activo ? 'Usuario desactivado' : 'Usuario activado' }),
      onError: () => toast.show({ tone: 'error', mensaje: 'No se pudo cambiar el estado' }),
    })
  }
  const onEliminar = (u: UsuarioListDto) => {
    if (!window.confirm(`¿Desactivar a ${u.nombreCompleto}?`)) return
    eliminar.mutate(u.id, {
      onSuccess: () => toast.show({ tone: 'success', mensaje: 'Usuario desactivado' }),
      onError: () => toast.show({ tone: 'error', mensaje: 'No se pudo desactivar' }),
    })
  }

  const totalPages = lista.data?.totalPages ?? 1

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Usuarios</h1>
        <Can roles={[...ROLES_ESCRITURA]}>
          <Button onClick={abrirNuevo}>Nuevo usuario</Button>
        </Can>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="Buscar por nombre o email…" value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPage(1) }} className="max-w-xs" />
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={soloActivos} onChange={(e) => { setSoloActivos(e.target.checked); setPage(1) }} />
          Solo activos
        </label>
      </div>

      {lista.isLoading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : lista.isError ? (
        <p className="rounded-md bg-rojo/10 px-3 py-2 text-sm text-rojo">No se pudieron cargar los usuarios.</p>
      ) : (
        <>
          <UsuariosTable usuarios={lista.data?.items ?? []} onEditar={abrirEditar} onToggle={onToggle} onEliminar={onEliminar} />
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" disabled={pageNumber <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
              <span className="text-sm text-slate">Página {pageNumber} de {totalPages}</span>
              <Button variant="ghost" disabled={pageNumber >= totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
            </div>
          )}
        </>
      )}

      {modal.abierto && (modal.editId === null || detalle.isSuccess) && (
        <UsuarioFormModal
          inicial={modal.editId === null ? null : detalle.data}
          onGuardarCrear={onCrear}
          onGuardarEditar={onEditar}
          onClose={cerrar}
          cargando={crear.isPending || actualizar.isPending}
        />
      )}
    </div>
  )
}
```

> NOTA implementador: verifica la firma real de `useToast` (en `src/design-system/Toast`). Si la API es `toast.success('...')` u otra, adapta las llamadas `toast.show(...)`. El test no asercióna toasts, así que basta con que compile y no rompa en runtime.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/features/usuarios/pages/UsuariosPage.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/usuarios/pages/UsuariosPage.tsx src/features/usuarios/pages/UsuariosPage.test.tsx
git commit -m "feat(usuarios): UsuariosPage (lista, buscador, CRUD, gating de acciones)"
```

---

### Task 16: Cablear ruta `/config/usuarios` + nav vivo

**Files:**
- Modify: `src/app/router.tsx` (import + ruta bajo RoleRoute)
- Test: `src/app/router.usuarios.test.tsx`

**Interfaces:**
- Consumes: `UsuariosPage` (Task 15), `RoleRoute` (Task 5).
- Produces: ruta `/config/usuarios` con `allow={['SuperAdmin','EmisorAdmin','GerenteSucursal','Auditor']}`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/router.usuarios.test.tsx
import { describe, it, expect, beforeEach, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { setupServer } from 'msw/node'
import { ToastProvider } from '@/design-system'
import { AppRoutes } from './router'
import { useAuthStore } from './auth-store'
import { usuariosHandlers } from '@/test/msw/usuarios-handlers'

const server = setupServer(...usuariosHandlers)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function setRol(rolNombre: string) {
  useAuthStore.setState({ token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', status: 'authenticated', user: { userId: 1, nombreCompleto: 'Ana', email: 'a@x.com', rolId: 5, rolNombre, emisorId: 3, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [2], permisos: [] } })
}
function setup(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider><MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter></ToastProvider>
    </QueryClientProvider>,
  )
}

describe('ruta /config/usuarios', () => {
  beforeEach(() => setRol('EmisorAdmin'))
  it('EmisorAdmin monta la página de usuarios', async () => {
    setup('/config/usuarios')
    expect(await screen.findByRole('heading', { name: 'Usuarios' })).toBeInTheDocument()
  })
  it('Cajero ve AccesoDenegado', async () => {
    setRol('Cajero')
    setup('/config/usuarios')
    expect(await screen.findByRole('heading', { name: /acceso denegado/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/app/router.usuarios.test.tsx`
Expected: FAIL (ruta inexistente → cae en `*` → redirige a dashboard; no encuentra el heading "Usuarios").

- [ ] **Step 3: Implementation**

En `src/app/router.tsx` añade el import:

```tsx
import { UsuariosPage } from '@/features/usuarios/pages/UsuariosPage'
```

y dentro de `<Route element={<AppLayout />}>`, antes de `<Route path="/" ... />`:

```tsx
          <Route element={<RoleRoute allow={['SuperAdmin', 'EmisorAdmin', 'GerenteSucursal', 'Auditor']} />}>
            <Route path="/config/usuarios" element={<UsuariosPage />} />
          </Route>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- --run src/app/router.usuarios.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/router.tsx src/app/router.usuarios.test.tsx
git commit -m "feat(usuarios): cablear ruta /config/usuarios bajo RoleRoute"
```

---

### Task 17: Verificación whole-branch (suite + lint + build)

**Files:** (ninguno nuevo; corrida de verificación)

- [ ] **Step 1: Suite completa**

Run: `npm run test -- --run`
Expected: toda la suite verde (incluye los tests preexistentes de F0–F6). Si algún test de ruta existente falla por el gating, revisa que su usuario de prueba tenga un `rolNombre` que califique (los existentes usan `EmisorAdmin`, que pasa todos los grupos).

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: sin errores. Corrige imports no usados / tipos.

- [ ] **Step 3: Typecheck + build**

Run: `npm run build`
Expected: build OK (tsc + vite).

- [ ] **Step 4: Commit (si hubo correcciones)**

```bash
git add -A
git commit -m "chore(usuarios): correcciones de lint/build whole-branch"
```

---

### Task 18: e2e con Docker (manual, al cerrar la rama)

**Files:** (ninguno; checklist manual)

**Pre-requisito:** backend levantado (`docker compose up -d` desde `FraFactu-Backend`) y frontend apuntando a `http://localhost:8080/api`. Seed: `admin@pruebas.local` / `Pruebas#2026` (rol EmisorAdmin, emisorId 3).

- [ ] **Step 1:** Login como `admin@pruebas.local`. Verifica que el nav muestra "Configuración → Usuarios".
- [ ] **Step 2:** Ir a `/config/usuarios`. La lista carga al menos el admin actual.
- [ ] **Step 3:** Crear usuario en modo "Fijar contraseña ahora" (correo no configurado en dev). Verifica toast de éxito y que aparece en la lista.
- [ ] **Step 4:** Editar ese usuario: cambiar rol y (si Cajero) asignar caja; guardar; verificar cambios.
- [ ] **Step 5:** Desactivar y reactivar (toggle). Verificar badge de estado.
- [ ] **Step 6:** (Opcional, gating) Cambiar el rol del usuario de prueba a Cajero, re-loguear con él e intentar `/config/usuarios` por URL → debe mostrar AccesoDenegado, y el nav no debe listar "Usuarios".
- [ ] **Step 7:** Documentar resultado del e2e en el commit/PR.

---

## Self-Review (cobertura del spec)

- §1 módulo authz → Tasks 1–3 (roles/puede, useAuthz, Can). ✅
- §2 gating nav/rutas → Tasks 4–7 (AccesoDenegado, RoleRoute, nav-config+Sidebar, router). ✅
- §3 feature usuarios → Tasks 8–16 (types, api, schemas, hooks, MSW, table, form, page, ruta). ✅
  - CRUD completo: listar/buscar/paginar (Task 15), crear+editar+toggle+eliminar (Tasks 14–15), reset pwd (Task 14). ✅
  - Sucursales + cajas (Cajero) (Task 14). ✅
  - Ambos modos de password (Task 10 schema + Task 14 UI). ✅
  - Gating de acciones dentro de usuarios (`<Can>` en Table y Page). ✅
- Manejo de errores (toasts/AccesoDenegado) → Tasks 5, 15. ✅
- Testing por unidad + e2e → cada task + Tasks 17–18. ✅
- Entrega B (barrido de acciones en otros features) → fuera de este plan (spec/plan propios). ✅

**Notas de verificación para el implementador (no son placeholders; valores concretos provistos arriba):**
- Confirmar firma real de `FormField` (prop `error`?), `useToast` (`show` vs `success`), `Badge` (`estado` válidos), `EmptyState` (`hint`), e `IconName` (`lock`). Ajustar a la API real si difiere; los tests fijan el comportamiento observable.
- Confirmar cada fila de la matriz rol→ruta (Task 6/7) contra el `[Authorize(Roles=...)]` del GET de landing del controlador respectivo antes de fijarla.
