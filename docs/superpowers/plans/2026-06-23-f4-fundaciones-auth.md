# F4 — Frontend: fundaciones y autenticación — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el design system "Tinta y Sello, en cálido", el shell de la app y las cuatro pantallas de autenticación conectadas a la API real de F2, sobre el esqueleto F0 de `FraFactu-Frontend`.

**Architecture:** Frontend React 19 + TypeScript organizado por features. Capa de infraestructura (env, axios+interceptores, jwt puro, store Zustand, queryClient) → design system (tokens Tailwind v4 + primitivos) → shell (sidebar+topbar+rutas protegidas) → features/auth (4 pantallas). TDD en toda la lógica (jwt, store, interceptores, esquemas de validación, ProtectedRoute).

**Tech Stack:** Vite 7, Vitest 3, @vitejs/plugin-react 5, React 19, TypeScript, Tailwind v4, TanStack Query 5, Zustand 5, React Router 7, axios, framer-motion, react-hook-form + zod, @react-oauth/google, @fontsource, MSW (tests).

## Global Constraints

- **NO subir Vite a 8** ni desalinear Vitest 3 / @vitejs/plugin-react 5 / Tailwind v4. La config de Vitest vive en `vitest.config.ts` separado.
- **Idioma de UI y copy:** español. Mensajes de commit en español + línea `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- **Backend real, no mocks** en runtime: API en `http://localhost:8080`, prefijo `/api`. Respuestas en **camelCase**. Mocks (MSW) solo en tests.
- **Sin refresh token:** la revocación es por `TokenVersion`; 401/403 → limpiar sesión + re-login.
- **Accesibilidad AA:** `focus-visible`, roles/aria, navegación por teclado, `prefers-reduced-motion`, contraste verificado en claro y oscuro.
- **Alias** `@` → `src` (ya configurado en `vite.config.ts`).
- **Paleta clara:** canvas `#F6F3EC`, surface `#FFFDF9`, ink `#16241F`, sello `#1F6B4F`, sello-bright `#2E9E74`, ambar `#E08A3C`, ambar-ink `#B5681E`, rojo `#C2453B`, slate `#5B6B66`, hairline `#E7E3DA`. **Oscuro:** canvas `#0F1C18`, surface `#16241F`, hairline `#26342E`, texto `#FAFAF8`, acento `sello-bright`.
- **Semántica fiscal fija:** recibido→sello · contingencia/pendiente→ambar · rechazado/anulado→rojo · borrador→slate.
- **Tipografía:** display Space Grotesk · cuerpo IBM Plex Sans · datos IBM Plex Mono. Montos/cantidades en cifras tabulares.
- **Git:** trabajo en rama `feat/f4-fundaciones-auth` (desde `development`). `main` solo producción. Push solo cuando el usuario lo pida y preguntando a qué rama. PRs por web.

---

## File Structure

```
src/
  styles/globals.css            # @theme tokens + base + dark variant + imports @fontsource
  lib/
    config/env.ts               # lectura/validación de VITE_*
    auth/jwt.ts                 # decodeJwt / isExpired / getClaims (puro)
    http/axios.ts               # instancia api + interceptores
    query/queryClient.ts        # QueryClient con defaults
  app/
    theme-store.ts              # tema claro/oscuro (Zustand) + aplicar a <html>
    auth-store.ts               # sesión (Zustand)
    router.tsx                  # definición de rutas
    ProtectedRoute.tsx          # guard de sesión / restricted
    AppLayout.tsx  Sidebar.tsx  Topbar.tsx
    EmpresaSucursalSelector.tsx AmbienteBadge.tsx UserMenu.tsx ThemeToggle.tsx
    nav-config.ts               # estructura de navegación del sidebar
  design-system/
    Button.tsx Card.tsx Badge.tsx Spinner.tsx EmptyState.tsx
    Input.tsx FormField.tsx
    Toast.tsx                   # provider + useToast
    Modal.tsx Drawer.tsx
    Combobox.tsx Tabs.tsx
    Table.tsx                   # con paginación
    index.ts                    # barrel
  features/
    auth/
      types.ts api.ts schemas.ts
      LoginPage.tsx GoogleButton.tsx
      ForgotPasswordPage.tsx ResetPasswordPage.tsx FirstLoginPage.tsx
    dashboard/DashboardPlaceholder.tsx
    ui-kit/UiKitPage.tsx
  test/
    setup.ts                    # ya existe; se amplía
    msw/handlers.ts msw/server.ts
  App.tsx                       # se reemplaza por <RouterProvider/>
  main.tsx                      # se ajusta (GoogleOAuthProvider, hydrate, ThemeProvider)
```

---

## Task 1: Dependencias + tokens del design system + tema claro/oscuro

**Files:**
- Modify: `package.json` (deps)
- Modify: `src/styles/globals.css`
- Create: `src/app/theme-store.ts`
- Create: `src/app/ThemeToggle.tsx`
- Test: `src/app/theme-store.test.ts`

**Interfaces:**
- Produces: `useThemeStore` → `{ theme: 'light'|'dark', toggle(): void, init(): void }`; tokens Tailwind (`bg-canvas`, `bg-surface`, `text-ink`, `bg-sello`, `text-sello`, `border-hairline`, `bg-ambar`, `text-ambar-ink`, `bg-rojo`, `text-slate`, fuentes `font-display`/`font-sans`/`font-mono`) disponibles en clases utilitarias; variante `dark:` activa por clase `.dark` en `<html>`.

- [ ] **Step 1: Instalar dependencias**

```bash
npm install @fontsource/space-grotesk @fontsource/ibm-plex-sans @fontsource/ibm-plex-mono @react-oauth/google react-hook-form zod
npm install -D msw
```

- [ ] **Step 2: Verificar que el lockfile sigue alineado (no se coló Vite 8)**

Run: `npm ls vite vitest @vitejs/plugin-react`
Expected: `vite@7.x`, `vitest@3.x`, `@vitejs/plugin-react@5.x` (una sola copia de cada uno).

- [ ] **Step 3: Escribir el test rojo del theme-store**

```ts
// src/app/theme-store.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useThemeStore } from './theme-store'

describe('theme-store', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    useThemeStore.setState({ theme: 'light' })
  })

  it('toggle alterna entre light y dark y aplica la clase en <html>', () => {
    useThemeStore.getState().toggle()
    expect(useThemeStore.getState().theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    useThemeStore.getState().toggle()
    expect(useThemeStore.getState().theme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('persiste la preferencia en localStorage', () => {
    useThemeStore.getState().toggle()
    expect(localStorage.getItem('frafactu-theme')).toBe('dark')
  })
})
```

- [ ] **Step 4: Ejecutar y verificar que falla**

Run: `npm run test -- theme-store`
Expected: FAIL ("Cannot find module './theme-store'").

- [ ] **Step 5: Implementar theme-store**

```ts
// src/app/theme-store.ts
import { create } from 'zustand'

type Theme = 'light' | 'dark'
const KEY = 'frafactu-theme'

function apply(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

function initialTheme(): Theme {
  const saved = localStorage.getItem(KEY) as Theme | null
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

interface ThemeState {
  theme: Theme
  toggle: () => void
  init: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  toggle: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem(KEY, next)
    apply(next)
    set({ theme: next })
  },
  init: () => {
    const theme = initialTheme()
    apply(theme)
    set({ theme })
  },
}))
```

- [ ] **Step 6: Definir tokens y variante dark en globals.css**

```css
/* src/styles/globals.css */
@import "tailwindcss";

@import "@fontsource/space-grotesk/400.css";
@import "@fontsource/space-grotesk/500.css";
@import "@fontsource/space-grotesk/700.css";
@import "@fontsource/ibm-plex-sans/400.css";
@import "@fontsource/ibm-plex-sans/500.css";
@import "@fontsource/ibm-plex-sans/600.css";
@import "@fontsource/ibm-plex-mono/400.css";
@import "@fontsource/ibm-plex-mono/500.css";

/* Dark mode por clase (.dark en <html>) */
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-canvas: #f6f3ec;
  --color-surface: #fffdf9;
  --color-ink: #16241f;
  --color-sello: #1f6b4f;
  --color-sello-bright: #2e9e74;
  --color-ambar: #e08a3c;
  --color-ambar-ink: #b5681e;
  --color-rojo: #c2453b;
  --color-slate: #5b6b66;
  --color-hairline: #e7e3da;

  --font-sans: "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 12px;
}

/* Tokens que cambian con el tema (se leen vía clases bg-canvas, etc. no aplican;
   usamos utilidades dark: en los componentes. Aquí solo el lienzo base). */
html, body, #root { height: 100%; }
body {
  margin: 0;
  font-family: var(--font-sans);
  background-color: var(--color-canvas);
  color: var(--color-ink);
}
.dark body {
  background-color: #0f1c18;
  color: #fafaf8;
}
.tabular { font-variant-numeric: tabular-nums; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .001ms !important; transition-duration: .001ms !important; }
}
```

- [ ] **Step 7: Implementar ThemeToggle**

```tsx
// src/app/ThemeToggle.tsx
import { useThemeStore } from './theme-store'

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme)
  const toggle = useThemeStore((s) => s.toggle)
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
      className="rounded-md border border-hairline px-2 py-1 text-sm hover:bg-sello/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sello"
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  )
}
```

- [ ] **Step 8: Ejecutar test y verificar verde**

Run: `npm run test -- theme-store`
Expected: PASS (2 tests).

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json src/styles/globals.css src/app/theme-store.ts src/app/theme-store.test.ts src/app/ThemeToggle.tsx
git commit -m "F4: dependencias, tokens del design system y tema claro/oscuro"
```

---

## Task 2: Utilidades JWT (puro, TDD)

**Files:**
- Create: `src/lib/auth/jwt.ts`
- Test: `src/lib/auth/jwt.test.ts`

**Interfaces:**
- Produces: `decodeJwt(token: string): JwtClaims | null`; `isExpired(token: string, skewSeconds?: number): boolean`; `getClaims(token: string): JwtClaims | null`; tipo `JwtClaims` con `exp?, pwd_change_required?, token_version?, EmisorId?, [k]: unknown`.

- [ ] **Step 1: Escribir el test rojo**

```ts
// src/lib/auth/jwt.test.ts
import { describe, it, expect } from 'vitest'
import { decodeJwt, isExpired, getClaims } from './jwt'

// header.payload.signature con payload base64url. Helper para construir tokens.
function makeToken(payload: Record<string, unknown>): string {
  const b64 = (o: object) =>
    btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.sig`
}

describe('decodeJwt', () => {
  it('decodifica el payload', () => {
    const t = makeToken({ sub: '7', pwd_change_required: true, exp: 9999999999 })
    expect(decodeJwt(t)).toMatchObject({ sub: '7', pwd_change_required: true })
  })
  it('devuelve null ante un token malformado', () => {
    expect(decodeJwt('no-es-un-jwt')).toBeNull()
    expect(decodeJwt('')).toBeNull()
  })
})

describe('isExpired', () => {
  it('true si exp ya pasó', () => {
    expect(isExpired(makeToken({ exp: 1 }))).toBe(true)
  })
  it('false si exp está en el futuro', () => {
    expect(isExpired(makeToken({ exp: Math.floor(Date.now() / 1000) + 3600 }))).toBe(false)
  })
  it('true (fail-closed) si no hay exp o el token es inválido', () => {
    expect(isExpired(makeToken({}))).toBe(true)
    expect(isExpired('basura')).toBe(true)
  })
})

describe('getClaims', () => {
  it('expone claims relevantes', () => {
    const t = makeToken({ token_version: 3, EmisorId: '5' })
    expect(getClaims(t)).toMatchObject({ token_version: 3, EmisorId: '5' })
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm run test -- jwt`
Expected: FAIL ("Cannot find module './jwt'").

- [ ] **Step 3: Implementar jwt.ts**

```ts
// src/lib/auth/jwt.ts
export interface JwtClaims {
  exp?: number
  pwd_change_required?: boolean | string
  token_version?: number
  EmisorId?: string
  [k: string]: unknown
}

function base64UrlDecode(input: string): string {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4))
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad
  return atob(b64)
}

export function decodeJwt(token: string): JwtClaims | null {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    return JSON.parse(base64UrlDecode(parts[1])) as JwtClaims
  } catch {
    return null
  }
}

export const getClaims = decodeJwt

export function isExpired(token: string, skewSeconds = 0): boolean {
  const claims = decodeJwt(token)
  if (!claims || typeof claims.exp !== 'number') return true // fail-closed
  const now = Math.floor(Date.now() / 1000)
  return claims.exp <= now + skewSeconds
}
```

- [ ] **Step 4: Ejecutar y verificar verde**

Run: `npm run test -- jwt`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/jwt.ts src/lib/auth/jwt.test.ts
git commit -m "F4: utilidades JWT puras (decode/isExpired/getClaims) con tests"
```

---

## Task 3: Tipos de auth + store de sesión (Zustand, TDD)

**Files:**
- Create: `src/features/auth/types.ts`
- Create: `src/app/auth-store.ts`
- Test: `src/app/auth-store.test.ts`

**Interfaces:**
- Consumes: `isExpired` de `@/lib/auth/jwt`.
- Produces: tipos `LoginResponse`, `AuthUser`; `useAuthStore` con estado `{ token: string|null, user: AuthUser|null, status: 'anon'|'restricted'|'authenticated' }` y acciones `setSession(r: LoginResponse)`, `logout()`, `hydrate()`; selectores helper `selectIsAuthenticated(s)`, `selectRequiresPasswordChange(s)`.

- [ ] **Step 1: Definir tipos**

```ts
// src/features/auth/types.ts
export interface LoginResponse {
  token: string
  tokenType: string
  expiresIn: number
  userId: number
  nombreCompleto: string
  email: string
  rolId: number
  rolNombre: string
  emisorId: number | null
  emisorNombre: string | null
  accesoTodasSucursales: boolean
  sucursalIds: number[]
  permisos: string[]
  requiereCambioPwd: boolean
}

export interface AuthUser {
  userId: number
  nombreCompleto: string
  email: string
  rolId: number
  rolNombre: string
  emisorId: number | null
  emisorNombre: string | null
  accesoTodasSucursales: boolean
  sucursalIds: number[]
  permisos: string[]
}
```

- [ ] **Step 2: Escribir el test rojo**

```ts
// src/app/auth-store.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore, selectIsAuthenticated, selectRequiresPasswordChange } from './auth-store'
import type { LoginResponse } from '@/features/auth/types'

function future(secs = 3600) { return Math.floor(Date.now() / 1000) + secs }
function makeToken(payload: Record<string, unknown>): string {
  const b64 = (o: object) =>
    btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${b64({ alg: 'HS256' })}.${b64(payload)}.sig`
}
function makeLogin(over: Partial<LoginResponse> = {}): LoginResponse {
  return {
    token: makeToken({ exp: future() }), tokenType: 'Bearer', expiresIn: 3600,
    userId: 1, nombreCompleto: 'Ana', email: 'ana@x.com', rolId: 2, rolNombre: 'Admin',
    emisorId: 5, emisorNombre: 'Mi Empresa', accesoTodasSucursales: true, sucursalIds: [1],
    permisos: ['factura.crear'], requiereCambioPwd: false, ...over,
  }
}

describe('auth-store', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ token: null, user: null, status: 'anon' })
  })

  it('setSession con requiereCambioPwd=false → authenticated y persiste', () => {
    useAuthStore.getState().setSession(makeLogin())
    expect(useAuthStore.getState().status).toBe('authenticated')
    expect(selectIsAuthenticated(useAuthStore.getState())).toBe(true)
    expect(JSON.parse(localStorage.getItem('frafactu-session')!).user.email).toBe('ana@x.com')
  })

  it('setSession con requiereCambioPwd=true → restricted', () => {
    useAuthStore.getState().setSession(makeLogin({ requiereCambioPwd: true }))
    expect(useAuthStore.getState().status).toBe('restricted')
    expect(selectRequiresPasswordChange(useAuthStore.getState())).toBe(true)
    expect(selectIsAuthenticated(useAuthStore.getState())).toBe(false)
  })

  it('logout limpia estado y storage', () => {
    useAuthStore.getState().setSession(makeLogin())
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().status).toBe('anon')
    expect(localStorage.getItem('frafactu-session')).toBeNull()
  })

  it('hydrate restaura sesión válida desde storage', () => {
    useAuthStore.getState().setSession(makeLogin())
    useAuthStore.setState({ token: null, user: null, status: 'anon' })
    useAuthStore.getState().hydrate()
    expect(useAuthStore.getState().status).toBe('authenticated')
  })

  it('hydrate descarta token expirado', () => {
    const expired = makeLogin({ token: makeToken({ exp: 1 }) })
    localStorage.setItem('frafactu-session', JSON.stringify({ token: expired.token, user: { ...expired } }))
    useAuthStore.getState().hydrate()
    expect(useAuthStore.getState().status).toBe('anon')
    expect(localStorage.getItem('frafactu-session')).toBeNull()
  })
})
```

- [ ] **Step 3: Ejecutar y verificar que falla**

Run: `npm run test -- auth-store`
Expected: FAIL ("Cannot find module './auth-store'").

- [ ] **Step 4: Implementar auth-store**

```ts
// src/app/auth-store.ts
import { create } from 'zustand'
import { isExpired } from '@/lib/auth/jwt'
import type { AuthUser, LoginResponse } from '@/features/auth/types'

type Status = 'anon' | 'restricted' | 'authenticated'
const KEY = 'frafactu-session'

interface AuthState {
  token: string | null
  user: AuthUser | null
  status: Status
  setSession: (r: LoginResponse) => void
  logout: () => void
  hydrate: () => void
}

function toUser(r: LoginResponse): AuthUser {
  const { token: _t, tokenType: _tt, expiresIn: _e, requiereCambioPwd: _r, ...rest } = r
  return rest
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  status: 'anon',
  setSession: (r) => {
    const user = toUser(r)
    const status: Status = r.requiereCambioPwd ? 'restricted' : 'authenticated'
    localStorage.setItem(KEY, JSON.stringify({ token: r.token, user }))
    set({ token: r.token, user, status })
  },
  logout: () => {
    localStorage.removeItem(KEY)
    set({ token: null, user: null, status: 'anon' })
  },
  hydrate: () => {
    const raw = localStorage.getItem(KEY)
    if (!raw) return
    try {
      const { token, user } = JSON.parse(raw) as { token: string; user: AuthUser }
      if (!token || isExpired(token)) {
        localStorage.removeItem(KEY)
        return
      }
      set({ token, user, status: 'authenticated' })
    } catch {
      localStorage.removeItem(KEY)
    }
  },
}))

export const selectIsAuthenticated = (s: AuthState) => s.status === 'authenticated'
export const selectRequiresPasswordChange = (s: AuthState) => s.status === 'restricted'
```

> Nota: `hydrate` solo restaura sesión completa (`authenticated`); el estado `restricted` no se persiste (un primer ingreso a medias se reinicia con un nuevo login).

- [ ] **Step 5: Ejecutar y verificar verde**

Run: `npm run test -- auth-store`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add src/features/auth/types.ts src/app/auth-store.ts src/app/auth-store.test.ts
git commit -m "F4: tipos de auth y store de sesión Zustand con tests"
```

---

## Task 4: env + cliente axios con interceptores (TDD)

**Files:**
- Create: `src/lib/config/env.ts`
- Create: `src/lib/http/axios.ts`
- Test: `src/lib/http/axios.test.ts`

**Interfaces:**
- Consumes: `useAuthStore` de `@/app/auth-store`.
- Produces: `env` (`{ apiUrl: string, googleClientId: string }`); `api` (instancia axios con `baseURL = ${apiUrl}/api`), interceptor de request que añade Bearer, interceptor de response que en 401/403 llama `logout()` y redirige.

- [ ] **Step 1: Implementar env.ts**

```ts
// src/lib/config/env.ts
const apiUrl = import.meta.env.VITE_API_URL as string | undefined
if (!apiUrl) {
  // Falla ruidosamente: sin API no hay app.
  throw new Error('VITE_API_URL no está definida. Copia .env.example a .env.')
}

export const env = {
  apiUrl,
  googleClientId: (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? '',
}
```

- [ ] **Step 2: Escribir el test rojo del interceptor**

```ts
// src/lib/http/axios.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import { api } from './axios'
import { useAuthStore } from '@/app/auth-store'

// axios-mock-adapter intercepta la instancia sin tocar la red.
let mock: MockAdapter
beforeEach(() => {
  mock = new MockAdapter(api)
  useAuthStore.setState({ token: 'tkn-123', user: null, status: 'authenticated' })
})

describe('api interceptors', () => {
  it('añade Authorization Bearer desde el store', async () => {
    mock.onGet('/ping').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer tkn-123')
      return [200, { ok: true }]
    })
    await api.get('/ping')
  })

  it('en 401 limpia la sesión (logout)', async () => {
    const logoutSpy = vi.spyOn(useAuthStore.getState(), 'logout')
    mock.onGet('/protegido').reply(401)
    await expect(api.get('/protegido')).rejects.toBeTruthy()
    expect(logoutSpy).toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Instalar el helper de test y ejecutar (rojo)**

```bash
npm install -D axios-mock-adapter
```

Run: `npm run test -- axios`
Expected: FAIL ("Cannot find module './axios'").

- [ ] **Step 4: Implementar axios.ts**

```ts
// src/lib/http/axios.ts
import axios from 'axios'
import { env } from '@/lib/config/env'
import { useAuthStore } from '@/app/auth-store'

export const api = axios.create({ baseURL: `${env.apiUrl}/api` })

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status
    if (status === 401 || status === 403) {
      useAuthStore.getState().logout()
      // Respaldo duro fuera del árbol de React Router.
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.assign('/login?expirada=1')
      }
    }
    return Promise.reject(error)
  },
)
```

- [ ] **Step 5: Ejecutar y verificar verde**

Run: `npm run test -- axios`
Expected: PASS (2 tests).

> Si `window.location.assign` rompe en jsdom, el test ya pasa porque comprueba `logout()`; envuelve la redirección en try/catch si hace falta.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/config/env.ts src/lib/http/axios.ts src/lib/http/axios.test.ts
git commit -m "F4: configuración env y cliente axios con interceptores (Bearer + 401/403)"
```

---

## Task 5: QueryClient

**Files:**
- Create: `src/lib/query/queryClient.ts`

**Interfaces:**
- Produces: `queryClient` (instancia `QueryClient` configurada).

- [ ] **Step 1: Implementar queryClient.ts**

```ts
// src/lib/query/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/query/queryClient.ts
git commit -m "F4: QueryClient con defaults"
```

---

## Task 6: Primitivos base — Button, Card, Badge, Spinner

**Files:**
- Create: `src/design-system/Button.tsx`, `Card.tsx`, `Badge.tsx`, `Spinner.tsx`
- Test: `src/design-system/Button.test.tsx`, `src/design-system/Badge.test.tsx`

**Interfaces:**
- Produces:
  - `Button` props `{ variant?: 'primary'|'ghost'|'danger'|'subtle', size?: 'sm'|'md', loading?: boolean } & ButtonHTMLAttributes`
  - `Card` (div con surface+hairline+sombra suave) props `HTMLAttributes`
  - `Badge` props `{ estado?: 'recibido'|'pendiente'|'rechazado'|'borrador' } | { tone?: 'sello'|'ambar'|'rojo'|'slate' }` → usar `estado` (mapea a la semántica fiscal)
  - `Spinner` props `{ size?: number, label?: string }`

- [ ] **Step 1: Test rojo de Button y Badge**

```tsx
// src/design-system/Button.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renderiza el texto y dispara onClick', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Emitir</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Emitir' }))
    expect(onClick).toHaveBeenCalled()
  })
  it('loading deshabilita y marca aria-busy', () => {
    render(<Button loading>Emitir</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-busy', 'true')
  })
})
```

```tsx
// src/design-system/Badge.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'

describe('Badge', () => {
  it('renderiza el contenido según el estado fiscal', () => {
    render(<Badge estado="recibido">Recibido MH</Badge>)
    expect(screen.getByText('Recibido MH')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Ejecutar (rojo)**

Run: `npm run test -- design-system/Button design-system/Badge`
Expected: FAIL (módulos inexistentes).

- [ ] **Step 3: Instalar userEvent si falta y implementar componentes**

```bash
npm install -D @testing-library/user-event
```

```tsx
// src/design-system/Spinner.tsx
export function Spinner({ size = 16, label = 'Cargando' }: { size?: number; label?: string }) {
  return (
    <span
      role="status"
      aria-label={label}
      className="inline-block animate-spin rounded-full border-2 border-current border-t-transparent"
      style={{ width: size, height: size }}
    />
  )
}
```

```tsx
// src/design-system/Button.tsx
import type { ButtonHTMLAttributes } from 'react'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'ghost' | 'danger' | 'subtle'
type Size = 'sm' | 'md'

const base =
  'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sello ' +
  'disabled:opacity-60 disabled:cursor-not-allowed'

const variants: Record<Variant, string> = {
  primary: 'bg-sello text-white hover:bg-sello-bright',
  ghost: 'border border-hairline text-sello hover:bg-sello/10',
  danger: 'bg-rojo text-white hover:opacity-90',
  subtle: 'text-slate hover:bg-slate/10',
}
const sizes: Record<Size, string> = { sm: 'text-sm px-3 py-1.5', md: 'text-sm px-4 py-2' }

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export function Button({ variant = 'primary', size = 'md', loading = false, disabled, children, className = '', ...rest }: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner size={14} />}
      {children}
    </button>
  )
}
```

```tsx
// src/design-system/Card.tsx
import type { HTMLAttributes } from 'react'
export function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg border border-hairline bg-surface p-5 shadow-[0_4px_14px_rgba(22,36,31,0.06)] dark:bg-[#16241f] dark:shadow-none ${className}`}
      {...rest}
    />
  )
}
```

```tsx
// src/design-system/Badge.tsx
import type { HTMLAttributes } from 'react'
type Estado = 'recibido' | 'pendiente' | 'rechazado' | 'borrador'
const tones: Record<Estado, string> = {
  recibido: 'bg-sello/12 text-sello',
  pendiente: 'bg-ambar/15 text-ambar-ink',
  rechazado: 'bg-rojo/12 text-rojo',
  borrador: 'bg-slate/14 text-slate',
}
interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  estado?: Estado
}
export function Badge({ estado = 'borrador', className = '', ...rest }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tones[estado]} ${className}`}
      {...rest}
    />
  )
}
```

- [ ] **Step 4: Ejecutar y verificar verde**

Run: `npm run test -- design-system/Button design-system/Badge`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/design-system/Button.tsx src/design-system/Card.tsx src/design-system/Badge.tsx src/design-system/Spinner.tsx src/design-system/Button.test.tsx src/design-system/Badge.test.tsx package.json package-lock.json
git commit -m "F4: primitivos Button, Card, Badge, Spinner con tests"
```

---

## Task 7: Input + FormField

**Files:**
- Create: `src/design-system/Input.tsx`, `src/design-system/FormField.tsx`
- Test: `src/design-system/FormField.test.tsx`

**Interfaces:**
- Produces:
  - `Input` props `InputHTMLAttributes & { invalid?: boolean }` (forwardRef para react-hook-form)
  - `FormField` props `{ label: string, htmlFor: string, error?: string, hint?: string, children: ReactNode }`

- [ ] **Step 1: Test rojo de FormField**

```tsx
// src/design-system/FormField.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FormField } from './FormField'
import { Input } from './Input'

describe('FormField', () => {
  it('asocia label e input por id y muestra el error con role alert', () => {
    render(
      <FormField label="Correo" htmlFor="email" error="Requerido">
        <Input id="email" />
      </FormField>,
    )
    expect(screen.getByLabelText('Correo')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Requerido')
  })
})
```

- [ ] **Step 2: Ejecutar (rojo)**

Run: `npm run test -- design-system/FormField`
Expected: FAIL.

- [ ] **Step 3: Implementar Input y FormField**

```tsx
// src/design-system/Input.tsx
import { forwardRef, type InputHTMLAttributes } from 'react'
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, className = '', ...rest }, ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`w-full rounded-md border bg-surface px-3 py-2 text-sm text-ink outline-none dark:bg-[#16241f] dark:text-[#fafaf8] ${invalid ? 'border-rojo' : 'border-hairline'} focus-visible:ring-2 focus-visible:ring-sello ${className}`}
      {...rest}
    />
  )
})
```

```tsx
// src/design-system/FormField.tsx
import type { ReactNode } from 'react'
interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: ReactNode
}
export function FormField({ label, htmlFor, error, hint, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-slate">{hint}</p>}
      {error && <p role="alert" className="text-xs text-rojo">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 4: Ejecutar y verificar verde**

Run: `npm run test -- design-system/FormField`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/design-system/Input.tsx src/design-system/FormField.tsx src/design-system/FormField.test.tsx
git commit -m "F4: primitivos Input y FormField accesibles con test"
```

---

## Task 8: Toast (provider + useToast)

**Files:**
- Create: `src/design-system/Toast.tsx`
- Test: `src/design-system/Toast.test.tsx`

**Interfaces:**
- Produces: `ToastProvider` (envuelve la app); `useToast()` → `{ show(msg: string, opts?: { tone?: 'sello'|'rojo'|'ambar' }): void }`. Los toasts se apilan y se autodescartan a los 4s.

- [ ] **Step 1: Test rojo**

```tsx
// src/design-system/Toast.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToast } from './Toast'

function Trigger() {
  const { show } = useToast()
  return <button onClick={() => show('Guardado')}>Mostrar</button>
}

describe('Toast', () => {
  it('muestra un mensaje al invocar show', async () => {
    render(<ToastProvider><Trigger /></ToastProvider>)
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar' }))
    expect(await screen.findByText('Guardado')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Ejecutar (rojo)**

Run: `npm run test -- design-system/Toast`
Expected: FAIL.

- [ ] **Step 3: Implementar Toast**

```tsx
// src/design-system/Toast.tsx
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

type Tone = 'sello' | 'rojo' | 'ambar'
interface ToastItem { id: number; msg: string; tone: Tone }
interface ToastCtx { show: (msg: string, opts?: { tone?: Tone }) => void }

const Ctx = createContext<ToastCtx | null>(null)
const toneCls: Record<Tone, string> = {
  sello: 'border-sello text-sello',
  rojo: 'border-rojo text-rojo',
  ambar: 'border-ambar text-ambar-ink',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)
  const show = useCallback((msg: string, opts?: { tone?: Tone }) => {
    const id = nextId.current++
    setItems((prev) => [...prev, { id, msg, tone: opts?.tone ?? 'sello' }])
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])
  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`rounded-md border bg-surface px-4 py-2 text-sm shadow-md dark:bg-[#16241f] ${toneCls[t.tone]}`}>
            {t.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return ctx
}
```

- [ ] **Step 4: Ejecutar y verificar verde**

Run: `npm run test -- design-system/Toast`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/design-system/Toast.tsx src/design-system/Toast.test.tsx
git commit -m "F4: primitivo Toast (provider + useToast) con test"
```

---

## Task 9: Modal y Drawer (focus trap, Esc)

**Files:**
- Create: `src/design-system/Modal.tsx`, `src/design-system/Drawer.tsx`
- Test: `src/design-system/Modal.test.tsx`

**Interfaces:**
- Produces:
  - `Modal` props `{ open: boolean, onClose(): void, title?: string, children: ReactNode }` (cierra con Esc y clic en overlay; `role="dialog"` `aria-modal`)
  - `Drawer` props `{ open: boolean, onClose(): void, side?: 'left'|'right', children: ReactNode }`

- [ ] **Step 1: Test rojo de Modal**

```tsx
// src/design-system/Modal.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './Modal'

describe('Modal', () => {
  it('no renderiza cuando open=false', () => {
    render(<Modal open={false} onClose={() => {}}>Hola</Modal>)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('renderiza y cierra con Escape', async () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose} title="Confirmar">Contenido</Modal>)
    expect(screen.getByRole('dialog', { name: 'Confirmar' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Ejecutar (rojo)**

Run: `npm run test -- design-system/Modal`
Expected: FAIL.

- [ ] **Step 3: Implementar Modal y Drawer**

```tsx
// src/design-system/Modal.tsx
import { useEffect, useRef, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}
export function Modal({ open, onClose, title, children }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    ref.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md rounded-lg border border-hairline bg-surface p-5 shadow-xl outline-none dark:bg-[#16241f]"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="mb-3 font-display text-lg font-bold">{title}</h2>}
        {children}
      </div>
    </div>
  )
}
```

```tsx
// src/design-system/Drawer.tsx
import { useEffect, type ReactNode } from 'react'
interface DrawerProps {
  open: boolean
  onClose: () => void
  side?: 'left' | 'right'
  children: ReactNode
}
export function Drawer({ open, onClose, side = 'left', children }: DrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-ink/40" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        className={`absolute top-0 h-full w-72 max-w-[80%] bg-surface p-4 shadow-xl dark:bg-[#16241f] ${side === 'left' ? 'left-0' : 'right-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </aside>
    </div>
  )
}
```

- [ ] **Step 4: Ejecutar y verificar verde**

Run: `npm run test -- design-system/Modal`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/design-system/Modal.tsx src/design-system/Drawer.tsx src/design-system/Modal.test.tsx
git commit -m "F4: primitivos Modal y Drawer (Esc + overlay) con test"
```

---

## Task 10: Combobox accesible (TDD)

**Files:**
- Create: `src/design-system/Combobox.tsx`
- Test: `src/design-system/Combobox.test.tsx`

**Interfaces:**
- Produces: `Combobox<T>` props `{ items: T[], value: T|null, onChange(v: T): void, getLabel(v: T): string, placeholder?: string, id?: string }`. Filtra por texto, navegable con flechas + Enter, `role="combobox"`/`listbox`.

- [ ] **Step 1: Test rojo**

```tsx
// src/design-system/Combobox.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Combobox } from './Combobox'

const items = [{ id: 1, n: 'Centro' }, { id: 2, n: 'Norte' }, { id: 3, n: 'Sur' }]

describe('Combobox', () => {
  it('filtra por texto y selecciona una opción', async () => {
    const onChange = vi.fn()
    render(<Combobox items={items} value={null} onChange={onChange} getLabel={(i) => i.n} placeholder="Sucursal" id="suc" />)
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.type(screen.getByRole('combobox'), 'Nor')
    await userEvent.click(screen.getByText('Norte'))
    expect(onChange).toHaveBeenCalledWith(items[1])
  })
})
```

- [ ] **Step 2: Ejecutar (rojo)**

Run: `npm run test -- design-system/Combobox`
Expected: FAIL.

- [ ] **Step 3: Implementar Combobox**

```tsx
// src/design-system/Combobox.tsx
import { useMemo, useState } from 'react'

interface ComboboxProps<T> {
  items: T[]
  value: T | null
  onChange: (v: T) => void
  getLabel: (v: T) => string
  placeholder?: string
  id?: string
}
export function Combobox<T>({ items, value, onChange, getLabel, placeholder, id }: ComboboxProps<T>) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const filtered = useMemo(
    () => items.filter((i) => getLabel(i).toLowerCase().includes(query.toLowerCase())),
    [items, query, getLabel],
  )
  return (
    <div className="relative">
      <input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm dark:bg-[#16241f]"
        placeholder={placeholder}
        value={open ? query : value ? getLabel(value) : ''}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
      />
      {open && (
        <ul id={`${id}-list`} role="listbox" className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-hairline bg-surface shadow-lg dark:bg-[#16241f]">
          {filtered.map((i, idx) => (
            <li
              key={idx}
              role="option"
              aria-selected={value === i}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-sello/10"
              onMouseDown={() => { onChange(i); setQuery(''); setOpen(false) }}
            >
              {getLabel(i)}
            </li>
          ))}
          {filtered.length === 0 && <li className="px-3 py-2 text-sm text-slate">Sin resultados</li>}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Ejecutar y verificar verde**

Run: `npm run test -- design-system/Combobox`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/design-system/Combobox.tsx src/design-system/Combobox.test.tsx
git commit -m "F4: primitivo Combobox filtrable y accesible con test"
```

---

## Task 11: Tabs, Table (paginación), EmptyState + barrel

**Files:**
- Create: `src/design-system/Tabs.tsx`, `src/design-system/Table.tsx`, `src/design-system/EmptyState.tsx`, `src/design-system/index.ts`
- Test: `src/design-system/Table.test.tsx`, `src/design-system/Tabs.test.tsx`

**Interfaces:**
- Produces:
  - `Tabs` props `{ tabs: { id: string, label: string }[], active: string, onChange(id: string): void }`
  - `Table<T>` props `{ columns: { key: string, header: string, render?(row: T): ReactNode }[], rows: T[], pageSize?: number, getRowKey(row: T): string|number }` con controles de paginación
  - `EmptyState` props `{ title: string, hint?: string }`
  - `index.ts` reexporta todos los primitivos

- [ ] **Step 1: Test rojo de Table y Tabs**

```tsx
// src/design-system/Table.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Table } from './Table'

const rows = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, nombre: `Item ${i + 1}` }))
const columns = [{ key: 'nombre', header: 'Nombre' }]

describe('Table', () => {
  it('pagina: muestra pageSize filas y avanza de página', async () => {
    render(<Table columns={columns} rows={rows} pageSize={5} getRowKey={(r) => r.id} />)
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.queryByText('Item 6')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    expect(screen.getByText('Item 6')).toBeInTheDocument()
  })
})
```

```tsx
// src/design-system/Tabs.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tabs } from './Tabs'

describe('Tabs', () => {
  it('marca el activo y emite onChange al clicar otro', async () => {
    const onChange = vi.fn()
    render(<Tabs tabs={[{ id: 'a', label: 'Uno' }, { id: 'b', label: 'Dos' }]} active="a" onChange={onChange} />)
    expect(screen.getByRole('tab', { name: 'Uno' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(screen.getByRole('tab', { name: 'Dos' }))
    expect(onChange).toHaveBeenCalledWith('b')
  })
})
```

- [ ] **Step 2: Ejecutar (rojo)**

Run: `npm run test -- design-system/Table design-system/Tabs`
Expected: FAIL.

- [ ] **Step 3: Implementar Tabs, Table, EmptyState**

```tsx
// src/design-system/Tabs.tsx
interface Tab { id: string; label: string }
export function Tabs({ tabs, active, onChange }: { tabs: Tab[]; active: string; onChange: (id: string) => void }) {
  return (
    <div role="tablist" className="flex gap-1 border-b border-hairline">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={`-mb-px border-b-2 px-3 py-2 text-sm ${active === t.id ? 'border-sello font-semibold text-sello' : 'border-transparent text-slate hover:text-ink'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
```

```tsx
// src/design-system/EmptyState.tsx
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-10 text-center">
      <p className="font-medium">{title}</p>
      {hint && <p className="text-sm text-slate">{hint}</p>}
    </div>
  )
}
```

```tsx
// src/design-system/Table.tsx
import { useState, type ReactNode } from 'react'
import { Button } from './Button'

interface Column<T> { key: string; header: string; render?: (row: T) => ReactNode }
interface TableProps<T> {
  columns: Column<T>[]
  rows: T[]
  pageSize?: number
  getRowKey: (row: T) => string | number
}
export function Table<T>({ columns, rows, pageSize = 10, getRowKey }: TableProps<T>) {
  const [page, setPage] = useState(0)
  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  const slice = rows.slice(page * pageSize, page * pageSize + pageSize)
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
        <span>Página {page + 1} de {pages}</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
          <Button variant="ghost" size="sm" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
        </div>
      </div>
    </div>
  )
}
```

```ts
// src/design-system/index.ts
export { Button } from './Button'
export { Card } from './Card'
export { Badge } from './Badge'
export { Spinner } from './Spinner'
export { Input } from './Input'
export { FormField } from './FormField'
export { ToastProvider, useToast } from './Toast'
export { Modal } from './Modal'
export { Drawer } from './Drawer'
export { Combobox } from './Combobox'
export { Tabs } from './Tabs'
export { Table } from './Table'
export { EmptyState } from './EmptyState'
```

- [ ] **Step 4: Ejecutar y verificar verde**

Run: `npm run test -- design-system/Table design-system/Tabs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/design-system/Tabs.tsx src/design-system/Table.tsx src/design-system/EmptyState.tsx src/design-system/index.ts src/design-system/Table.test.tsx src/design-system/Tabs.test.tsx
git commit -m "F4: primitivos Tabs, Table (paginación), EmptyState y barrel"
```

---

## Task 12: Esquemas de validación de auth (zod, TDD)

**Files:**
- Create: `src/features/auth/schemas.ts`
- Test: `src/features/auth/schemas.test.ts`

**Interfaces:**
- Produces: `loginSchema` (`{ email, password }`), `forgotSchema` (`{ email }`), `resetSchema`/`firstLoginSchema` (`{ newPassword, confirmPassword }` con refinamiento de coincidencia y mínimo 8). Tipos inferidos `LoginValues`, etc.

- [ ] **Step 1: Test rojo**

```ts
// src/features/auth/schemas.test.ts
import { describe, it, expect } from 'vitest'
import { loginSchema, resetSchema } from './schemas'

describe('loginSchema', () => {
  it('rechaza email inválido', () => {
    expect(loginSchema.safeParse({ email: 'x', password: '12345678' }).success).toBe(false)
  })
  it('acepta datos válidos', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '12345678' }).success).toBe(true)
  })
})

describe('resetSchema', () => {
  it('falla si las contraseñas no coinciden', () => {
    const r = resetSchema.safeParse({ newPassword: '12345678', confirmPassword: 'xxxxxxxx' })
    expect(r.success).toBe(false)
  })
  it('falla si es muy corta', () => {
    expect(resetSchema.safeParse({ newPassword: '123', confirmPassword: '123' }).success).toBe(false)
  })
  it('acepta coincidentes y suficientemente largas', () => {
    expect(resetSchema.safeParse({ newPassword: '12345678', confirmPassword: '12345678' }).success).toBe(true)
  })
})
```

- [ ] **Step 2: Ejecutar (rojo)**

Run: `npm run test -- auth/schemas`
Expected: FAIL.

- [ ] **Step 3: Implementar schemas.ts**

```ts
// src/features/auth/schemas.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Correo no válido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})
export type LoginValues = z.infer<typeof loginSchema>

export const forgotSchema = z.object({
  email: z.string().email('Correo no válido'),
})
export type ForgotValues = z.infer<typeof forgotSchema>

export const resetSchema = z
  .object({
    newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
export type ResetValues = z.infer<typeof resetSchema>

export const firstLoginSchema = resetSchema
export type FirstLoginValues = ResetValues
```

- [ ] **Step 4: Ejecutar y verificar verde**

Run: `npm run test -- auth/schemas`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/schemas.ts src/features/auth/schemas.test.ts
git commit -m "F4: esquemas de validación de auth (zod) con tests"
```

---

## Task 13: Módulo API de auth

**Files:**
- Create: `src/features/auth/api.ts`

**Interfaces:**
- Consumes: `api` de `@/lib/http/axios`, tipos de `./types`.
- Produces: `authApi` con `login(email, password)`, `googleLogin(accessToken)`, `forgotPassword(email)`, `resetPassword(token, newPassword, confirmPassword)`, `changePasswordFirstLogin(newPassword, confirmPassword)`, `logout()`. Devuelven `Promise<LoginResponse>` donde aplique.

- [ ] **Step 1: Implementar api.ts**

```ts
// src/features/auth/api.ts
import { api } from '@/lib/http/axios'
import type { LoginResponse } from './types'

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
    return data
  },
  async googleLogin(accessToken: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/google', { accessToken })
    return data
  },
  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email })
  },
  async resetPassword(token: string, newPassword: string, confirmPassword: string): Promise<void> {
    await api.post('/auth/reset-password', { token, newPassword, confirmPassword })
  },
  async changePasswordFirstLogin(newPassword: string, confirmPassword: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/change-password-first-login', { newPassword, confirmPassword })
    return data
  },
  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },
}
```

- [ ] **Step 2: Verificar compilación de tipos**

Run: `npx tsc -b --noEmit`
Expected: sin errores en `api.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/features/auth/api.ts
git commit -m "F4: módulo API tipado de auth"
```

---

## Task 14: MSW — handlers y server de test

**Files:**
- Create: `src/test/msw/handlers.ts`, `src/test/msw/server.ts`
- Modify: `src/test/setup.ts`

**Interfaces:**
- Produces: `server` (MSW node server) con handlers por defecto para `/api/auth/login`, `/api/auth/google`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/change-password-first-login`, `/api/auth/logout`. Listo para `server.use(...)` por test.

- [ ] **Step 1: Implementar handlers y server**

```ts
// src/test/msw/handlers.ts
import { http, HttpResponse } from 'msw'

const base = 'http://localhost:8080/api'
const loginOk = {
  token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', tokenType: 'Bearer', expiresIn: 3600,
  userId: 1, nombreCompleto: 'Ana', email: 'ana@x.com', rolId: 2, rolNombre: 'Admin',
  emisorId: 5, emisorNombre: 'Mi Empresa', accesoTodasSucursales: true, sucursalIds: [1],
  permisos: [], requiereCambioPwd: false,
}

export const handlers = [
  http.post(`${base}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }
    if (body.password === 'mala') return new HttpResponse(null, { status: 401 })
    if (body.email === 'primer@x.com') return HttpResponse.json({ ...loginOk, requiereCambioPwd: true })
    return HttpResponse.json(loginOk)
  }),
  http.post(`${base}/auth/google`, () => HttpResponse.json(loginOk)),
  http.post(`${base}/auth/forgot-password`, () => HttpResponse.json({ message: 'ok' })),
  http.post(`${base}/auth/reset-password`, async ({ request }) => {
    const b = (await request.json()) as { token: string }
    return b.token === 'malo' ? new HttpResponse(null, { status: 400 }) : HttpResponse.json({ message: 'ok' })
  }),
  http.post(`${base}/auth/change-password-first-login`, () => HttpResponse.json(loginOk)),
  http.post(`${base}/auth/logout`, () => HttpResponse.json({ message: 'ok' })),
]
```

```ts
// src/test/msw/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'
export const server = setupServer(...handlers)
```

- [ ] **Step 2: Ampliar setup.ts para arrancar MSW**

```ts
// src/test/setup.ts  (añadir al contenido existente)
import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './msw/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

> Si `setup.ts` ya importa `@testing-library/jest-dom`, no lo dupliques: añade solo el bloque de `server`.

- [ ] **Step 3: Ejecutar la suite para verificar que MSW no rompe nada**

Run: `npm run test`
Expected: PASS (todas las suites previas siguen verdes).

- [ ] **Step 4: Commit**

```bash
git add src/test/msw/handlers.ts src/test/msw/server.ts src/test/setup.ts
git commit -m "F4: MSW (handlers de /auth/* y server) para tests de flujos"
```

---

## Task 15: ProtectedRoute (TDD)

**Files:**
- Create: `src/app/ProtectedRoute.tsx`
- Test: `src/app/ProtectedRoute.test.tsx`

**Interfaces:**
- Consumes: `useAuthStore`.
- Produces: `ProtectedRoute` (componente que envuelve rutas protegidas). Si `anon` → `<Navigate to="/login">`; si `restricted` → `<Navigate to="/first-login">`; si `authenticated` → `<Outlet/>`.

- [ ] **Step 1: Test rojo**

```tsx
// src/app/ProtectedRoute.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { useAuthStore } from './auth-store'

function setup(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>Privado</div>} />
        </Route>
        <Route path="/login" element={<div>Login</div>} />
        <Route path="/first-login" element={<div>Primer ingreso</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => useAuthStore.setState({ token: null, user: null, status: 'anon' }))
  it('anon → redirige a login', () => { setup(); expect(screen.getByText('Login')).toBeInTheDocument() })
  it('restricted → redirige a primer ingreso', () => {
    useAuthStore.setState({ status: 'restricted', token: 't', user: null })
    setup(); expect(screen.getByText('Primer ingreso')).toBeInTheDocument()
  })
  it('authenticated → renderiza el contenido', () => {
    useAuthStore.setState({ status: 'authenticated', token: 't', user: null })
    setup(); expect(screen.getByText('Privado')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Ejecutar (rojo)**

Run: `npm run test -- ProtectedRoute`
Expected: FAIL.

- [ ] **Step 3: Implementar ProtectedRoute**

```tsx
// src/app/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from './auth-store'

export function ProtectedRoute() {
  const status = useAuthStore((s) => s.status)
  if (status === 'authenticated') return <Outlet />
  if (status === 'restricted') return <Navigate to="/first-login" replace />
  return <Navigate to="/login" replace />
}
```

- [ ] **Step 4: Ejecutar y verificar verde**

Run: `npm run test -- ProtectedRoute`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/ProtectedRoute.tsx src/app/ProtectedRoute.test.tsx
git commit -m "F4: ProtectedRoute (anon/restricted/authenticated) con tests"
```

---

## Task 16: Shell — Sidebar, Topbar y AppLayout

**Files:**
- Create: `src/app/nav-config.ts`, `src/app/Sidebar.tsx`, `src/app/AmbienteBadge.tsx`, `src/app/UserMenu.tsx`, `src/app/EmpresaSucursalSelector.tsx`, `src/app/Topbar.tsx`, `src/app/AppLayout.tsx`
- Create: `src/features/dashboard/DashboardPlaceholder.tsx`
- Test: `src/app/UserMenu.test.tsx`

**Interfaces:**
- Consumes: `useAuthStore`, `authApi.logout`, `ThemeToggle`, primitivos.
- Produces: `AppLayout` (sidebar + topbar + `<Outlet/>`); `UserMenu` con botón "Cerrar sesión" que llama `authApi.logout()` y `useAuthStore.logout()`; `navSections` (estructura del sidebar).

- [ ] **Step 1: Test rojo de UserMenu (cerrar sesión)**

```tsx
// src/app/UserMenu.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { UserMenu } from './UserMenu'
import { useAuthStore } from './auth-store'
import { authApi } from '@/features/auth/api'

describe('UserMenu', () => {
  beforeEach(() => useAuthStore.setState({
    status: 'authenticated', token: 't',
    user: { userId: 1, nombreCompleto: 'Ana', email: 'ana@x.com', rolId: 1, rolNombre: 'Admin', emisorId: 1, emisorNombre: 'E', accesoTodasSucursales: true, sucursalIds: [], permisos: [] },
  }))
  it('cerrar sesión llama a authApi.logout y limpia el store', async () => {
    const apiSpy = vi.spyOn(authApi, 'logout').mockResolvedValue()
    render(<MemoryRouter><UserMenu /></MemoryRouter>)
    await userEvent.click(screen.getByRole('button', { name: /ana/i }))
    await userEvent.click(screen.getByRole('menuitem', { name: /cerrar sesión/i }))
    expect(apiSpy).toHaveBeenCalled()
    expect(useAuthStore.getState().status).toBe('anon')
  })
})
```

- [ ] **Step 2: Ejecutar (rojo)**

Run: `npm run test -- UserMenu`
Expected: FAIL.

- [ ] **Step 3: Implementar nav-config y componentes del shell**

```ts
// src/app/nav-config.ts
export interface NavItem { label: string; to: string }
export interface NavSection { title: string | null; items: NavItem[] }
export const navSections: NavSection[] = [
  { title: null, items: [{ label: 'Dashboard', to: '/dashboard' }] },
  { title: 'Facturación', items: [
    { label: 'Emitir DTE', to: '/facturacion/emitir' },
    { label: 'Historial', to: '/facturacion/historial' },
    { label: 'Recibidos', to: '/facturacion/recibidos' },
  ] },
  { title: 'Inventario', items: [
    { label: 'Productos', to: '/inventario/productos' },
    { label: 'Stock', to: '/inventario/stock' },
  ] },
  { title: 'Configuración', items: [{ label: 'Usuarios', to: '/config/usuarios' }] },
]
```

```tsx
// src/app/Sidebar.tsx
import { NavLink } from 'react-router-dom'
import { navSections } from './nav-config'
export function Sidebar() {
  return (
    <nav className="flex w-56 flex-col gap-1 border-r border-hairline bg-surface p-3 dark:bg-[#16241f]" aria-label="Navegación principal">
      {navSections.map((sec, i) => (
        <div key={i} className="mb-2">
          {sec.title && <p className="px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-slate">{sec.title}</p>}
          {sec.items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm ${isActive ? 'bg-sello text-white' : 'text-ink hover:bg-sello/10 dark:text-[#fafaf8]'}`
              }
            >
              {it.label}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  )
}
```

```tsx
// src/app/AmbienteBadge.tsx
import { Badge } from '@/design-system'
export function AmbienteBadge({ ambiente = 'Pruebas' }: { ambiente?: 'Pruebas' | 'Producción' }) {
  return <Badge estado={ambiente === 'Producción' ? 'recibido' : 'pendiente'}>{ambiente}</Badge>
}
```

```tsx
// src/app/EmpresaSucursalSelector.tsx
import { useAuthStore } from './auth-store'
export function EmpresaSucursalSelector() {
  const user = useAuthStore((s) => s.user)
  return (
    <button className="rounded-md border border-hairline px-3 py-1 text-xs" type="button">
      {user?.emisorNombre ?? 'Sin empresa'} ▾
    </button>
  )
}
```

```tsx
// src/app/UserMenu.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from './auth-store'
import { authApi } from '@/features/auth/api'

export function UserMenu() {
  const [open, setOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  async function cerrarSesion() {
    try { await authApi.logout() } catch { /* la sesión se limpia igual */ }
    logout()
    navigate('/login', { replace: true })
  }
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-sello/10">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-sello/20 text-xs">{user?.nombreCompleto?.[0] ?? '?'}</span>
        {user?.nombreCompleto ?? 'Usuario'}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-1 w-44 rounded-md border border-hairline bg-surface p-1 shadow-lg dark:bg-[#16241f]">
          <button role="menuitem" onClick={cerrarSesion} className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-rojo/10 text-rojo">
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
```

```tsx
// src/app/Topbar.tsx
import { ThemeToggle } from './ThemeToggle'
import { AmbienteBadge } from './AmbienteBadge'
import { UserMenu } from './UserMenu'
import { EmpresaSucursalSelector } from './EmpresaSucursalSelector'
export function Topbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-hairline bg-surface px-4 dark:bg-[#16241f]">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-sello font-display font-bold text-white">F</span>
        <b className="font-display tracking-tight">FraFactu</b>
      </div>
      <div className="flex items-center gap-3">
        <EmpresaSucursalSelector />
        <AmbienteBadge />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
```

```tsx
// src/app/AppLayout.tsx
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
export function AppLayout() {
  return (
    <div className="flex h-full flex-col">
      <Topbar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-canvas p-6 dark:bg-[#0f1c18]"><Outlet /></main>
      </div>
    </div>
  )
}
```

```tsx
// src/features/dashboard/DashboardPlaceholder.tsx
import { Card } from '@/design-system'
export function DashboardPlaceholder() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
      <Card><p className="text-slate">Los KPIs de facturación e inventario llegan en fases siguientes (F5–F7).</p></Card>
    </div>
  )
}
```

- [ ] **Step 4: Ejecutar y verificar verde**

Run: `npm run test -- UserMenu`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/nav-config.ts src/app/Sidebar.tsx src/app/AmbienteBadge.tsx src/app/UserMenu.tsx src/app/EmpresaSucursalSelector.tsx src/app/Topbar.tsx src/app/AppLayout.tsx src/app/UserMenu.test.tsx src/features/dashboard/DashboardPlaceholder.tsx
git commit -m "F4: shell (sidebar + topbar + AppLayout) y dashboard placeholder"
```

---

## Task 17: Pantalla de Login + GoogleButton (integración con MSW)

**Files:**
- Create: `src/features/auth/GoogleButton.tsx`, `src/features/auth/LoginPage.tsx`
- Test: `src/features/auth/LoginPage.test.tsx`

**Interfaces:**
- Consumes: `authApi`, `useAuthStore`, `loginSchema`, primitivos, `useToast`.
- Produces: `LoginPage` (form email/contraseña + GoogleButton). En éxito: `setSession`; si `requiereCambioPwd` navega a `/first-login`, si no a `/dashboard`.

- [ ] **Step 1: Test rojo de LoginPage (login local correcto y credenciales malas)**

```tsx
// src/features/auth/LoginPage.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '@/design-system'
import { LoginPage } from './LoginPage'
import { useAuthStore } from '@/app/auth-store'

function setup() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route path="/first-login" element={<div>Primer ingreso</div>} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => useAuthStore.setState({ token: null, user: null, status: 'anon' }))

  it('login correcto navega a dashboard y deja sesión authenticated', async () => {
    setup()
    await userEvent.type(screen.getByLabelText(/correo/i), 'ana@x.com')
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'secreta12')
    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(await screen.findByText('Dashboard')).toBeInTheDocument()
    expect(useAuthStore.getState().status).toBe('authenticated')
  })

  it('credenciales inválidas muestran error y no navega', async () => {
    setup()
    await userEvent.type(screen.getByLabelText(/correo/i), 'ana@x.com')
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'mala')
    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(await screen.findByText(/incorrect/i)).toBeInTheDocument()
    expect(useAuthStore.getState().status).toBe('anon')
  })
})
```

- [ ] **Step 2: Ejecutar (rojo)**

Run: `npm run test -- auth/LoginPage`
Expected: FAIL.

- [ ] **Step 3: Implementar GoogleButton y LoginPage**

```tsx
// src/features/auth/GoogleButton.tsx
import { useGoogleLogin } from '@react-oauth/google'
import { Button } from '@/design-system'

export function GoogleButton({ onToken, disabled }: { onToken: (accessToken: string) => void; disabled?: boolean }) {
  const login = useGoogleLogin({
    flow: 'implicit',
    scope: 'openid email profile',
    onSuccess: (resp) => onToken(resp.access_token),
  })
  return (
    <Button type="button" variant="ghost" disabled={disabled} onClick={() => login()} className="w-full">
      Iniciar con Google
    </Button>
  )
}
```

```tsx
// src/features/auth/LoginPage.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import { Button, Card, FormField, Input, useToast } from '@/design-system'
import { loginSchema, type LoginValues } from './schemas'
import { authApi } from './api'
import { GoogleButton } from './GoogleButton'
import { useAuthStore } from '@/app/auth-store'
import type { LoginResponse } from './types'

export function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const { show } = useToast()

  function enRespuesta(r: LoginResponse) {
    setSession(r)
    navigate(r.requiereCambioPwd ? '/first-login' : '/dashboard', { replace: true })
  }

  async function onSubmit(values: LoginValues) {
    setBusy(true)
    try {
      enRespuesta(await authApi.login(values.email, values.password))
    } catch {
      show('Email o contraseña incorrectos', { tone: 'rojo' })
    } finally { setBusy(false) }
  }

  async function onGoogle(accessToken: string) {
    setBusy(true)
    try { enRespuesta(await authApi.googleLogin(accessToken)) }
    catch { show('No se pudo iniciar con Google', { tone: 'rojo' }) }
    finally { setBusy(false) }
  }

  return (
    <div className="grid min-h-full place-items-center bg-canvas p-6 dark:bg-[#0f1c18]">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 font-display text-2xl font-bold tracking-tight">FraFactu</h1>
        <p className="mb-5 text-sm text-slate">Inicia sesión para continuar.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField label="Correo" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register('email')} />
          </FormField>
          <FormField label="Contraseña" htmlFor="password" error={errors.password?.message}>
            <Input id="password" type="password" autoComplete="current-password" invalid={!!errors.password} {...register('password')} />
          </FormField>
          <Button type="submit" loading={busy} className="w-full">Iniciar sesión</Button>
        </form>
        <div className="my-4 flex items-center gap-3 text-xs text-slate"><span className="h-px flex-1 bg-hairline" />o<span className="h-px flex-1 bg-hairline" /></div>
        <GoogleButton onToken={onGoogle} disabled={busy} />
        <div className="mt-4 text-center text-sm">
          <Link to="/forgot-password" className="text-sello hover:underline">¿Olvidaste tu contraseña?</Link>
        </div>
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: Instalar el resolver de zod si falta**

```bash
npm install @hookform/resolvers
```

- [ ] **Step 5: Ejecutar y verificar verde**

Run: `npm run test -- auth/LoginPage`
Expected: PASS (2 tests).

> Nota: `useGoogleLogin` requiere `GoogleOAuthProvider`; en el test no se hace clic en Google, así que no es necesario. Si RTL se queja al montar, envuelve el render del test en `GoogleOAuthProvider` con un clientId dummy.

- [ ] **Step 6: Commit**

```bash
git add src/features/auth/GoogleButton.tsx src/features/auth/LoginPage.tsx src/features/auth/LoginPage.test.tsx package.json package-lock.json
git commit -m "F4: pantalla de login (local + Google) con test de integración"
```

---

## Task 18: Pantallas forgot-password, reset-password y first-login

**Files:**
- Create: `src/features/auth/ForgotPasswordPage.tsx`, `src/features/auth/ResetPasswordPage.tsx`, `src/features/auth/FirstLoginPage.tsx`
- Test: `src/features/auth/ResetPasswordPage.test.tsx`, `src/features/auth/FirstLoginPage.test.tsx`

**Interfaces:**
- Consumes: `authApi`, `forgotSchema`/`resetSchema`/`firstLoginSchema`, `useAuthStore`, primitivos, `useToast`, `useSearchParams`.
- Produces: las tres páginas. `FirstLoginPage` en éxito hace `setSession` (respuesta completa → `authenticated`) y navega a `/dashboard`.

- [ ] **Step 1: Test rojo de Reset y FirstLogin**

```tsx
// src/features/auth/ResetPasswordPage.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '@/design-system'
import { ResetPasswordPage } from './ResetPasswordPage'

function setup(search = '?token=abc') {
  return render(
    <MemoryRouter initialEntries={[`/reset-password${search}`]}>
      <ToastProvider>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('ResetPasswordPage', () => {
  it('reset exitoso redirige a login', async () => {
    setup('?token=abc')
    await userEvent.type(screen.getByLabelText(/nueva contraseña/i), '12345678')
    await userEvent.type(screen.getByLabelText(/confirmar/i), '12345678')
    await userEvent.click(screen.getByRole('button', { name: /restablecer/i }))
    expect(await screen.findByText('Login')).toBeInTheDocument()
  })
  it('muestra error de validación si no coinciden', async () => {
    setup()
    await userEvent.type(screen.getByLabelText(/nueva contraseña/i), '12345678')
    await userEvent.type(screen.getByLabelText(/confirmar/i), 'xxxxxxxx')
    await userEvent.click(screen.getByRole('button', { name: /restablecer/i }))
    expect(await screen.findByText(/no coinciden/i)).toBeInTheDocument()
  })
})
```

```tsx
// src/features/auth/FirstLoginPage.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '@/design-system'
import { FirstLoginPage } from './FirstLoginPage'
import { useAuthStore } from '@/app/auth-store'

function setup() {
  return render(
    <MemoryRouter initialEntries={['/first-login']}>
      <ToastProvider>
        <Routes>
          <Route path="/first-login" element={<FirstLoginPage />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('FirstLoginPage', () => {
  beforeEach(() => useAuthStore.setState({ token: 'restringido', user: null, status: 'restricted' }))
  it('cambio exitoso deja authenticated y navega a dashboard', async () => {
    setup()
    await userEvent.type(screen.getByLabelText(/nueva contraseña/i), '12345678')
    await userEvent.type(screen.getByLabelText(/confirmar/i), '12345678')
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }))
    expect(await screen.findByText('Dashboard')).toBeInTheDocument()
    expect(useAuthStore.getState().status).toBe('authenticated')
  })
})
```

- [ ] **Step 2: Ejecutar (rojo)**

Run: `npm run test -- auth/ResetPasswordPage auth/FirstLoginPage`
Expected: FAIL.

- [ ] **Step 3: Implementar las tres páginas**

```tsx
// src/features/auth/ForgotPasswordPage.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { Button, Card, FormField, Input } from '@/design-system'
import { forgotSchema, type ForgotValues } from './schemas'
import { authApi } from './api'

export function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) })
  const [enviado, setEnviado] = useState(false)
  const [busy, setBusy] = useState(false)
  async function onSubmit(v: ForgotValues) {
    setBusy(true)
    try { await authApi.forgotPassword(v.email); setEnviado(true) } finally { setBusy(false) }
  }
  return (
    <div className="grid min-h-full place-items-center bg-canvas p-6 dark:bg-[#0f1c18]">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 font-display text-xl font-bold">Recuperar contraseña</h1>
        {enviado ? (
          <p className="text-sm text-slate">Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField label="Correo" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" invalid={!!errors.email} {...register('email')} />
            </FormField>
            <Button type="submit" loading={busy} className="w-full">Enviar enlace</Button>
          </form>
        )}
        <div className="mt-4 text-center text-sm"><Link to="/login" className="text-sello hover:underline">Volver a iniciar sesión</Link></div>
      </Card>
    </div>
  )
}
```

```tsx
// src/features/auth/ResetPasswordPage.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Card, FormField, Input, useToast } from '@/design-system'
import { resetSchema, type ResetValues } from './schemas'
import { authApi } from './api'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const { register, handleSubmit, formState: { errors } } = useForm<ResetValues>({ resolver: zodResolver(resetSchema) })
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const { show } = useToast()
  async function onSubmit(v: ResetValues) {
    setBusy(true)
    try {
      await authApi.resetPassword(token, v.newPassword, v.confirmPassword)
      show('Contraseña restablecida. Inicia sesión.')
      navigate('/login', { replace: true })
    } catch {
      show('El enlace es inválido o expiró', { tone: 'rojo' })
    } finally { setBusy(false) }
  }
  return (
    <div className="grid min-h-full place-items-center bg-canvas p-6 dark:bg-[#0f1c18]">
      <Card className="w-full max-w-sm">
        <h1 className="mb-3 font-display text-xl font-bold">Nueva contraseña</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField label="Nueva contraseña" htmlFor="np" error={errors.newPassword?.message}>
            <Input id="np" type="password" invalid={!!errors.newPassword} {...register('newPassword')} />
          </FormField>
          <FormField label="Confirmar contraseña" htmlFor="cp" error={errors.confirmPassword?.message}>
            <Input id="cp" type="password" invalid={!!errors.confirmPassword} {...register('confirmPassword')} />
          </FormField>
          <Button type="submit" loading={busy} className="w-full">Restablecer</Button>
        </form>
      </Card>
    </div>
  )
}
```

```tsx
// src/features/auth/FirstLoginPage.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { Button, Card, FormField, Input, useToast } from '@/design-system'
import { firstLoginSchema, type FirstLoginValues } from './schemas'
import { authApi } from './api'
import { useAuthStore } from '@/app/auth-store'

export function FirstLoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<FirstLoginValues>({ resolver: zodResolver(firstLoginSchema) })
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const { show } = useToast()
  async function onSubmit(v: FirstLoginValues) {
    setBusy(true)
    try {
      const r = await authApi.changePasswordFirstLogin(v.newPassword, v.confirmPassword)
      setSession(r)
      navigate('/dashboard', { replace: true })
    } catch {
      show('No se pudo cambiar la contraseña', { tone: 'rojo' })
    } finally { setBusy(false) }
  }
  return (
    <div className="grid min-h-full place-items-center bg-canvas p-6 dark:bg-[#0f1c18]">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 font-display text-xl font-bold">Cambia tu contraseña</h1>
        <p className="mb-4 text-sm text-slate">Es tu primer ingreso: define una contraseña nueva para continuar.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField label="Nueva contraseña" htmlFor="np" error={errors.newPassword?.message}>
            <Input id="np" type="password" invalid={!!errors.newPassword} {...register('newPassword')} />
          </FormField>
          <FormField label="Confirmar contraseña" htmlFor="cp" error={errors.confirmPassword?.message}>
            <Input id="cp" type="password" invalid={!!errors.confirmPassword} {...register('confirmPassword')} />
          </FormField>
          <Button type="submit" loading={busy} className="w-full">Guardar y continuar</Button>
        </form>
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: Ejecutar y verificar verde**

Run: `npm run test -- auth/ResetPasswordPage auth/FirstLoginPage`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/ForgotPasswordPage.tsx src/features/auth/ResetPasswordPage.tsx src/features/auth/FirstLoginPage.tsx src/features/auth/ResetPasswordPage.test.tsx src/features/auth/FirstLoginPage.test.tsx
git commit -m "F4: pantallas forgot-password, reset-password y first-login con tests"
```

---

## Task 19: Router + UiKitPage + cableado de main.tsx

**Files:**
- Create: `src/app/router.tsx`, `src/features/ui-kit/UiKitPage.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`
- Test: `src/app/router.test.tsx`

**Interfaces:**
- Consumes: todas las páginas, `AppLayout`, `ProtectedRoute`, `ToastProvider`, `GoogleOAuthProvider`, `queryClient`, stores.
- Produces: `router` (createBrowserRouter) o árbol `<Routes>`; `App` renderiza el router; `main.tsx` envuelve con providers e invoca `hydrate()`/`theme init()`.

- [ ] **Step 1: Test rojo del router (ruta pública y guard)**

```tsx
// src/app/router.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/design-system'
import { AppRoutes } from './router'
import { useAuthStore } from './auth-store'

function setup(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider><AppRoutes /></ToastProvider>
    </MemoryRouter>,
  )
}

describe('router', () => {
  beforeEach(() => useAuthStore.setState({ token: null, user: null, status: 'anon' }))
  it('muestra el login en /login', () => {
    setup('/login')
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })
  it('una ruta protegida redirige a login si anon', () => {
    setup('/dashboard')
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Ejecutar (rojo)**

Run: `npm run test -- app/router`
Expected: FAIL.

- [ ] **Step 3: Implementar AppRoutes, UiKitPage, App y main**

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
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
```

```tsx
// src/features/ui-kit/UiKitPage.tsx
import { Button, Card, Badge, Input, FormField, Spinner, Tabs, EmptyState } from '@/design-system'
import { useState } from 'react'
import { ThemeToggle } from '@/app/ThemeToggle'

export function UiKitPage() {
  const [tab, setTab] = useState('a')
  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Catálogo · Tinta y Sello</h1>
        <ThemeToggle />
      </div>
      <Card className="mb-4">
        <h2 className="mb-3 font-display font-bold">Botones</h2>
        <div className="flex flex-wrap gap-2">
          <Button>Primario</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Peligro</Button>
          <Button variant="subtle">Sutil</Button>
          <Button loading>Cargando</Button>
        </div>
      </Card>
      <Card className="mb-4">
        <h2 className="mb-3 font-display font-bold">Estados fiscales</h2>
        <div className="flex flex-wrap gap-2">
          <Badge estado="recibido">Recibido MH</Badge>
          <Badge estado="pendiente">Contingencia</Badge>
          <Badge estado="rechazado">Rechazado</Badge>
          <Badge estado="borrador">Borrador</Badge>
        </div>
      </Card>
      <Card className="mb-4">
        <FormField label="Correo" htmlFor="demo" hint="Ejemplo de campo"><Input id="demo" /></FormField>
      </Card>
      <Card className="mb-4">
        <Tabs tabs={[{ id: 'a', label: 'Uno' }, { id: 'b', label: 'Dos' }]} active={tab} onChange={setTab} />
        <div className="pt-3 text-sm text-slate">Pestaña activa: {tab}</div>
      </Card>
      <Card><Spinner /> <EmptyState title="Sin datos" hint="Aún no hay registros" /></Card>
    </div>
  )
}
```

```tsx
// src/App.tsx
import { AppRoutes } from '@/app/router'
export default function App() {
  return <AppRoutes />
}
```

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './styles/globals.css'
import App from './App.tsx'
import { queryClient } from '@/lib/query/queryClient'
import { ToastProvider } from '@/design-system'
import { useAuthStore } from '@/app/auth-store'
import { useThemeStore } from '@/app/theme-store'
import { env } from '@/lib/config/env'

useThemeStore.getState().init()
useAuthStore.getState().hydrate()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={env.googleClientId}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
```

- [ ] **Step 4: Ejecutar y verificar verde**

Run: `npm run test -- app/router`
Expected: PASS (2 tests).

- [ ] **Step 5: Borrar el test obsoleto del placeholder F0**

`src/App.test.tsx` probaba el placeholder "Tinta y Sello" de F0; ya no aplica. Bórralo.

```bash
git rm src/App.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add src/app/router.tsx src/features/ui-kit/UiKitPage.tsx src/App.tsx src/main.tsx src/app/router.test.tsx
git commit -m "F4: router, catálogo /ui-kit y cableado de providers en main"
```

---

## Task 20: Verificación final (build + test + lint) y prueba e2e contra el backend

**Files:** ninguno nuevo (correcciones puntuales si algo falla).

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: sin errores. Corrige los que aparezcan (imports sin usar, tipos `any`).

- [ ] **Step 2: Suite completa de tests**

Run: `npm run test`
Expected: todas las suites PASS.

- [ ] **Step 3: Build de producción**

Run: `npm run build`
Expected: `tsc -b` sin errores + `vite build` genera `dist/` sin fallos.

- [ ] **Step 4: Levantar el backend en Docker y crear `.env`**

```bash
# En FraFactu-Backend
docker compose up --build
# En FraFactu-Frontend (si no se usa el front del compose)
cp .env.example .env   # ajustar VITE_GOOGLE_CLIENT_ID si se prueba Google
```

- [ ] **Step 5: Prueba manual de las cuatro vías**

Con el front en `:5173` y backend en `:8080`:
1. **Login local** con un usuario existente → llega al dashboard.
2. **Primer ingreso**: usuario nuevo con clave temporal → login redirige a `/first-login` → cambia contraseña → dashboard.
3. **Reset por correo**: `/forgot-password` → revisar correo (o log del backend) → abrir `/reset-password?token=...` → nueva contraseña → login.
4. **Google**: botón "Iniciar con Google" (requiere `VITE_GOOGLE_CLIENT_ID` válido) → dashboard.
5. Verificar **401/403**: forzar token expirado/revocado (logout en otra pestaña) → la siguiente petición redirige a `/login?expirada=1`.
6. Revisar **modo oscuro** y el catálogo en `/ui-kit`.

- [ ] **Step 6: Commit final si hubo correcciones**

```bash
git add -A
git commit -m "F4: correcciones de lint/build y verificación e2e de autenticación"
```

---

## Self-Review (cobertura del spec)

- Design system / tokens / dark mode → Task 1. ✔
- Primitivos (Button, Input, Select/Combobox, Modal, Drawer, Table+paginación, Toast, Tabs, Card, Badge, FormField, Spinner, EmptyState) → Tasks 6–11. ✔
- Catálogo documentado `/ui-kit` → Task 19. ✔
- Shell (sidebar+topbar, selector empresa·sucursal, ambiente, user menu, theme toggle) → Task 16. ✔
- Rutas protegidas + sesión expirada → Tasks 4 (interceptor), 15 (ProtectedRoute), 19 (router). ✔
- Infra (env, axios, jwt, queryClient, store) → Tasks 1–5. ✔
- Pantallas auth (login local+Google, forgot, reset, first-login) → Tasks 17–18. ✔
- TDD en jwt, store, interceptores, esquemas, ProtectedRoute → Tasks 2,3,4,12,15. ✔
- MSW para tests → Task 14. ✔
- Build+test+lint+e2e → Task 20. ✔

**Pendiente conocido (aceptable):** focus-trap completo del Modal (atrapar Tab) se deja en versión mínima (Esc + foco inicial); se endurece si una revisión de accesibilidad lo exige. El selector empresa·sucursal queda como botón visible en F4; el flujo de cambio (`cambiar-emisor-activo`/`change-ambiente`) se cablea cuando exista una segunda empresa/ambiente que probar (F7), según el spec.
```
