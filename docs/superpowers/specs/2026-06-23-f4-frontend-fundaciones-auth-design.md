# F4 — Frontend: fundaciones y autenticación (diseño)

> Fecha: 2026-06-23 · Repo: `FraFactu-Frontend` · Rama destino: `feat/f4-...` (parte de `development`).
> Primera fase de frontend. Backend (F1–F3) estable y mergeado a `development`.

## Objetivo

Establecer el **design system nuevo**, el **shell** de la app y todas las **pantallas de
identidad**, con login real contra el backend de F2. Sin módulos de negocio
(Facturación = F5, Inventario = F6, Config/usuarios/dashboard = F7).

## Dirección visual: "Tinta y Sello, en cálido" (fusión A × C)

Documento fiscal sereno y preciso (lenguaje de A) sobre superficies cálidas y
cercanas (calidez de C). Claramente distinto del look anterior (Vuetify azul
`#3b509d`/dorado, Reddit Sans, glassmorphism), que se abandona.

### Tokens de color

**Modo claro:**

| Token              | Hex       | Uso |
|--------------------|-----------|-----|
| `canvas`           | `#F6F3EC` | Fondo de app (papel cálido) |
| `surface`          | `#FFFDF9` | Tarjetas y superficies elevadas |
| `ink`              | `#16241F` | Texto principal |
| `sello` (primary)  | `#1F6B4F` | Marca y acción primaria (verde "sello/recibido") |
| `sello-bright`     | `#2E9E74` | Hover/focus, enlaces |
| `ambar`            | `#E08A3C` | Contingencia/pendiente/advertencia |
| `ambar-ink`        | `#B5681E` | Texto sobre fondos ámbar suaves (contraste AA) |
| `rojo`             | `#C2453B` | Rechazado/anulado/error |
| `slate`            | `#5B6B66` | Texto secundario, iconos, borrador |
| `hairline`         | `#E7E3DA` | Bordes finos, divisores, líneas de tabla |

**Modo oscuro ("tinta"):** `canvas` `#0F1C18`, `surface` `#16241F`, `hairline`
`#26342E`, texto `#FAFAF8`, acento `sello-bright`. WCAG AA en ambos modos.

**Semántica fiscal fija** (en toda la app): recibido/aprobado → `sello` ·
contingencia/pendiente → `ambar` · rechazado/anulado → `rojo` · borrador → `slate`.

### Tipografía

- **Display:** Space Grotesk (titulares, números grandes, con moderación).
- **Cuerpo/UI:** IBM Plex Sans (claridad técnica, cifras tabulares).
- **Datos/mono:** IBM Plex Mono (correlativos, código de generación, sello, NIT).
- Todo **monto y cantidad** en cifras tabulares (`font-variant-numeric: tabular-nums`).
- Escala (rem): 0.75 · 0.875 · 1 · 1.25 · 1.5 · 2 · 3. Pesos 400/500/600/700.
- Fuentes **auto-hospedadas** vía `@fontsource` (fiable en Docker/offline, sin FOUT).

### Forma y movimiento

- Tarjetas con **elevación suave** (sombra sutil) y radios 6/10/12; hairlines presentes.
- Densidad controlada tipo "hoja legible"; jerarquía por tipografía y espacio.
- Movimiento sobrio (revelado al cargar, micro-interacción en hover); respeta
  `prefers-reduced-motion`. Foco de teclado siempre visible.

### Mecánica de tema (Tailwind v4)

Tokens como variables `@theme` en `src/styles/globals.css`. Dark mode por
`@custom-variant dark (&:where(.dark, .dark *))` (estrategia de clase). Un
`ThemeToggle` alterna `.dark` en `<html>`, persiste en `localStorage` y por
defecto sigue `prefers-color-scheme`.

## Estructura de carpetas (`src/`)

```
src/
  design-system/        # tokens (via globals.css) + primitivos + tests
    Button/ Input/ Select/ Modal/ Drawer/ Table/ Toast/ Tabs/ Card/ Badge/
    FormField/ Spinner/ EmptyState/
    index.ts            # barrel de exportación
  styles/globals.css    # @theme tokens, base, dark variant
  lib/
    config/env.ts       # lee y valida VITE_*
    http/axios.ts       # instancia + interceptores
    auth/jwt.ts         # decode / isExpired / claims (puro, TDD)
    query/queryClient.ts
  app/                  # shell + routing + sesión
    router.tsx
    AppLayout.tsx       # sidebar + topbar
    ProtectedRoute.tsx
    Sidebar.tsx  Topbar.tsx
    EmpresaSucursalSelector.tsx  AmbienteBadge.tsx  UserMenu.tsx  ThemeToggle.tsx
    auth-store.ts       # Zustand (TDD)
  features/
    auth/
      api.ts            # llamadas a /auth/* tipadas
      schemas.ts        # esquemas zod (TDD)
      LoginPage.tsx  ForgotPasswordPage.tsx  ResetPasswordPage.tsx  FirstLoginPage.tsx
      GoogleButton.tsx
    dashboard/
      DashboardPlaceholder.tsx   # área protegida mínima en F4
    ui-kit/
      UiKitPage.tsx              # catálogo vivo de primitivos (entregable F4)
  test/
    setup.ts            # ya existe
    server.ts           # MSW (handlers de /auth/*)
```

## Design system — primitivos

Catálogo: **Button** (variants primary/ghost/danger/subtle, sizes, estado loading),
**Input**, **FormField** (label + hint + error + aria), **Select/Combobox**
(filtrable, accesible por teclado), **Modal** (focus trap, cierre por Esc/overlay),
**Drawer**, **Table** (con paginación; orden básico), **Toast** (provider + `useToast`),
**Tabs**, **Card**, **Badge** (variantes ligadas a estados fiscales), **Spinner**,
**EmptyState**.

- Accesibilidad AA transversal: roles/aria, `focus-visible`, navegación por teclado,
  contraste verificado en claro y oscuro, `prefers-reduced-motion`.
- **TDD** en los de lógica no trivial: Combobox (filtrado/teclado), Modal (focus
  trap), Table (paginación), Toast (cola). Los visuales (Button/Card/Badge) llevan
  test de render ligero.
- El catálogo se construye **completo en F4 por decisión del informe**, aunque
  algunos primitivos (Table, Tabs, Drawer) no tengan consumidor real hasta F5/F6.

### Catálogo documentado (`/ui-kit`)

Entregable explícito de F4 ("design system documentado"). Página viva que renderiza
cada primitivo con sus variantes y estados, en modo claro y oscuro. Sirve de
referencia visual y de prueba manual de accesibilidad. Ruta interna (no enlazada en
la navegación principal), accesible para el equipo.

## Shell

- **Sidebar persistente** con secciones agrupadas (Dashboard / Facturación /
  Inventario / Config). En F4 solo Dashboard navega a contenido real (placeholder);
  el resto se muestra como estructura. Colapsable en móvil (Drawer).
- **Topbar:** logo, **selector empresa·sucursal**, **badge de ambiente**
  (Pruebas/Producción), `ThemeToggle`, `UserMenu` (perfil, cerrar sesión).
- **`ProtectedRoute`**: exige sesión válida; si `requiresPasswordChange` redirige a
  `/first-login`; si no hay sesión o expiró, a `/login`.
- Selector empresa·sucursal: en F4 **muestra el contexto actual** (empresa/sucursal
  del store) como elemento del shell. El flujo de cambio real
  (`POST /auth/cambiar-emisor-activo` → reemite JWT → `setSession`, y
  `POST /auth/change-ambiente`) se cablea en F7, cuando exista multi-empresa/ambiente
  que probar. Los endpoints ya están listos en el backend.
- `UserMenu` → "cerrar sesión" llama `POST /auth/logout` (bump de `TokenVersion` =
  revocación) y luego limpia la sesión local y redirige a `/login`.

## Infraestructura

### `lib/config/env.ts`
Lee `VITE_API_URL` y `VITE_GOOGLE_CLIENT_ID`; valida presencia y formato; expone un
objeto tipado. Falla ruidosamente en arranque si falta `VITE_API_URL`.

### `lib/http/axios.ts`
- Instancia con `baseURL = ${VITE_API_URL}/api`.
- **Request interceptor:** añade `Authorization: Bearer <token>` desde el store si hay sesión.
- **Response interceptor:** ante **401/403**, limpia la sesión (store + localStorage)
  y redirige a `/login` con aviso "tu sesión expiró". No hay refresh token (la
  revocación es por `TokenVersion`); no se reintenta. Evita bucle: las respuestas de
  los propios endpoints `/auth/*` públicos no disparan el redirect global.
- **Navegación desde el interceptor** (fuera del árbol de React Router): el redirect
  se hace vía el `logout()` del store (que ya marca estado `anon`); la redirección de
  ruta la resuelve `ProtectedRoute` al re-render. Como respaldo duro se usa
  `window.location` solo si no hay router montado.

### `lib/auth/jwt.ts` (TDD, puro)
`decodeJwt(token)`, `isExpired(token, skew?)`, `getClaims(token)` → `exp`,
`pwd_change_required`, `token_version`, `EmisorId`, rol, sucursales,
`emisores_accesibles`. Sin dependencias de red ni de React.

### `lib/query/queryClient.ts`
`QueryClient` con defaults: `retry` acotado, `staleTime` razonable,
`refetchOnWindowFocus` desactivado. Se inyecta en `main.tsx` (ya cableado).

### `app/auth-store.ts` (Zustand, TDD)
Estado `{ token, user, status }` (`status`: `anon` | `restricted` | `authenticated`).
`user` = snapshot tipado derivado de `LoginResponseDto` (userId, nombreCompleto,
email, rol, emisor, sucursales, `permisos[]`).
- **Persistencia:** se guarda en `localStorage` `{ token, user }` (no solo el token,
  porque `permisos[]` y `nombreCompleto` no están garantizados como claims del JWT).
- `setSession(loginResponse)` → calcula `status` (`restricted` si
  `requiereCambioPwd`, si no `authenticated`) y persiste.
- `logout()` → limpia estado y storage, marca `anon`.
- `hydrate()` (al arrancar) → lee storage y **valida expiración del token vía
  `jwt.ts`**; si expiró, descarta y queda `anon`.
- Selectores `isAuthenticated`, `requiresPasswordChange`.
- `/auth/me` queda disponible para refrescar el snapshot, pero no es necesario en el
  flujo normal de F4.

## Pantallas de autenticación (API real de F2)

Contratos verificados en `AuthController.cs` (respuestas en camelCase).
`LoginResponseDto`: `{ token, tokenType, expiresIn, userId, nombreCompleto, email,
rolId, rolNombre, emisorId, emisorNombre, accesoTodasSucursales, sucursalIds[],
permisos[], requiereCambioPwd }`.

- **`/login`** — email/contraseña → `POST /auth/login`. Botón "Iniciar con Google":
  flujo implícito GIS (`@react-oauth/google`, `useGoogleLogin` → `access_token`) →
  `POST /auth/google { accessToken }`. Tras éxito: si `requiereCambioPwd` →
  `setSession` en estado `restricted` y navegar a `/first-login`; si no →
  `authenticated` → dashboard.
- **`/forgot-password`** — email → `POST /auth/forgot-password`. Mensaje siempre-200
  (anti-enumeración), sin revelar si el correo existe.
- **`/reset-password`** — lee `?token=` de la URL; `newPassword` + `confirm` →
  `POST /auth/reset-password`. Éxito → aviso y redirección a `/login`. Token
  inválido/expirado → error claro.
- **`/first-login`** — accesible solo en estado `restricted` (JWT con
  `pwd_change_required`). `newPassword` + `confirm` →
  `POST /auth/change-password-first-login` → devuelve `LoginResponseDto` completo →
  `setSession` `authenticated` → dashboard.
- Validación con **react-hook-form + zod**; los esquemas (`schemas.ts`) son puros y
  se prueban con **TDD** (email, longitud/políticas de contraseña, confirmación que
  coincide).

### Routing (`react-router-dom` 7)
- Públicas: `/login`, `/forgot-password`, `/reset-password`.
- Restringida: `/first-login` (solo estado `restricted`).
- Protegidas (bajo `AppLayout`): `/` → `/dashboard` (placeholder), y rutas stub de
  los módulos futuros.

## Testing

Vitest + RTL + **MSW** (handlers de `/auth/*`).
- **TDD** (rojo→verde): `jwt.ts`, `auth-store`, interceptores axios, esquemas zod de
  validación, lógica de `ProtectedRoute`.
- Render/integración: primitivos del design system y las 4 pantallas de auth con la
  API mockeada (incluye las 4 vías y el redirect de sesión expirada).

## Dependencias nuevas (aprobadas)

Ninguna toca Vite 7 / Vitest 3 / plugin-react 5 / Tailwind v4.
- `@fontsource/*` (Space Grotesk, IBM Plex Sans, IBM Plex Mono) — runtime.
- `@react-oauth/google` — runtime.
- `react-hook-form` + `zod` — runtime.
- `msw` — devDependency (solo tests).

## Criterios de aceptación

1. Un usuario se autentica por las **cuatro vías** (login local, Google, reset por
   correo, cambio obligatorio en primer ingreso) contra el backend en Docker.
2. Navega el **shell** (sidebar + topbar) con sesión válida; "cerrar sesión" llama
   `/auth/logout`; al expirar/revocar (401/403) vuelve a login con aviso.
3. El **look es claramente distinto** del anterior; modo claro y oscuro.
4. Componentes base **reutilizables y accesibles** (WCAG AA), visibles en el
   catálogo `/ui-kit`.
5. **`npm run build` + `npm run test` + `npm run lint` verdes**, verificados.

## Fuera de alcance (fases siguientes)

Pantallas de Facturación (F5), Inventario (F6), Configuración/usuarios/dashboard
real/multi-empresa completo (F7). En F4 solo queda el cableado base del selector y un
dashboard placeholder.
