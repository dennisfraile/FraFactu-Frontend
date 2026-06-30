# Diseño — Gestión de usuarios + autorización por rol en frontend

**Fecha:** 2026-06-30
**Estado:** Aprobado (brainstorming)
**Rama Entrega A:** `feat/usuarios-authz`

## Contexto y problema

El nav (`src/app/nav-config.ts`) ofrece **Configuración → Usuarios → `/config/usuarios`**, pero **no existe esa ruta** en `router.tsx`: cae en el catch-all `*` y redirige a `/dashboard`. La gestión de usuarios está "muerta" en el frontend.

El **backend está completo**:

- `GET /api/usuarios` (paginado, scoped por rol) → `PaginatedResponse<UsuarioListDto>`
- `GET /api/usuarios/{id}` → `UsuarioDto`
- `POST /api/usuarios` → crear
- `PUT /api/usuarios/{id}` → actualizar (datos, rol, sucursales, cajas, reset de password opcional)
- `DELETE /api/usuarios/{id}` → desactivar (borrado lógico)
- `PATCH /api/usuarios/{id}/toggle-active` → alternar activo
- `GET /api/roles` → `{ id, nombre }[]`
- `GET /api/cajas?sucursalId=&soloActivos=` → `CajaDto[]`
- `GET /sucursales/todas-activas` (ya consumido por `useSucursales`)

Al crear **sin** password, el backend genera una clave temporal y la **envía por correo** (no la devuelve en la respuesta); con password explícito, el admin la fija.

Decisión de autorización clave: el login **NO puebla `permisos`** (`LoginResponseDto` no lo asigna → llega `[]`). La autorización real es **por rol** (`rolNombre`) vía `[Authorize(Roles=...)]` en los controladores. Por lo tanto el gating del frontend será **basado en rol**, espejando al backend. El campo `permisos: string[]` del contrato es un hook futuro vacío y **no se usa** (gatearía todo a `off`).

Roles del sistema: **SuperAdmin, EmisorAdmin, GerenteSucursal, Cajero, Auditor, Contador**.

## Objetivos

1. Activar `/config/usuarios` con un CRUD completo de usuarios sobre el API existente.
2. Introducir un mecanismo **reutilizable** de autorización por rol en el frontend (cierra la deuda "se confía en el 403").
3. Aplicar el gating **app-wide** a nivel de nav y rutas.
4. (Entrega B) Barrer el gating a nivel de **acciones** en todos los features.

No-objetivos: tocar el backend (está completo y es la autoridad); construir un sistema de permisos por slug; modificar el flujo de auth/login existente.

## Decisiones tomadas (brainstorming)

- **Alcance usuarios:** CRUD completo (listar/buscar, crear, editar rol+datos+sucursales+cajas, activar/desactivar, resetear password).
- **Gating:** app-wide, **barrido total de acciones** (todos los features), entregado en dos PRs.
- **Password al crear:** ambos modos — "enviar clave temporal por correo" (default, prod) o "fijar contraseña ahora" (admin la teclea, útil en dev sin correo).
- **Empaque:** un documento de diseño, **dos entregas/specs/planes/PRs**:
  - **Entrega A (ahora):** módulo authz + gating de nav/rutas + Usuarios CRUD (primer consumidor pleno del gating a nivel de acción).
  - **Entrega B (follow-up):** barrido de `<Can>` en acciones del resto de features, guiado por la matriz rol→acción.

## Arquitectura

### 1. Módulo de autorización — `src/lib/authz/`

Núcleo puro y reutilizable, basado en rol:

- `roles.ts` — `export type RolNombre = 'SuperAdmin' | 'EmisorAdmin' | 'GerenteSucursal' | 'Cajero' | 'Auditor' | 'Contador'` y constante `ROLES`. Función pura `puede(rol: string | undefined, allow: RolNombre[]): boolean`.
- `useAuthz.ts` — hook que lee `useAuthStore` (selector `s.user`): expone `{ rol, hasRole(r), hasAnyRole([...]) }`. `rol = user?.rolNombre`.
- `Can.tsx` — `<Can roles={RolNombre[]} fallback={ReactNode}>children</Can>`: renderiza `children` si `hasAnyRole(roles)`, si no `fallback ?? null`.

Componentes de ruta y página (en `src/app/`, junto a `ProtectedRoute`):

- `RoleRoute.tsx` — `<RoleRoute allow={RolNombre[]}>`: si el usuario no califica, renderiza `<AccesoDenegado />` en vez de `<Outlet />` (no redirección silenciosa, para que la URL directa dé feedback claro).
- `AccesoDenegado.tsx` — página 403 con el sello visual del design system (icono, mensaje, enlace a Dashboard).

### 2. Gating app-wide de nav + rutas

- `nav-config.ts`: `interface NavItem` gana `roles?: RolNombre[]`. Sin `roles` ⇒ visible para todo autenticado. `NavSection` se filtra fuera si queda sin items visibles.
- `Sidebar.tsx`: usa `useAuthz` para filtrar `navSections` (items por `roles`, secciones vacías ocultas).
- `router.tsx`: las rutas restringidas se envuelven en `<RoleRoute allow={[...]}>`. La matriz rol→ruta se **finaliza en el plan** leyendo el `[Authorize(Roles=...)]` del GET de cada controlador. Fila confirmada:
  - `/config/usuarios` → `['SuperAdmin','EmisorAdmin','GerenteSucursal','Auditor']`.

### 3. Feature Usuarios — `src/features/usuarios/`

Estructura estilo F6:

- `types.ts` — `UsuarioListDto`, `UsuarioDto`, `SucursalAsignada`, `CajaAsignada`, `CreateUsuarioDto`, `UpdateUsuarioDto`, `Rol`, `CajaDto`.
- `api.ts` — `usuariosApi` (`list`, `getById`, `create`, `update`, `toggleActive`, `remove`), `rolesApi.list()`, `cajasApi.list(sucursalId?)`. Usa el cliente axios `api` con interceptor JWT.
- `hooks.ts` — React Query: `useUsuarios(params)`, `useUsuario(id)`, `useRoles()`, `useCajas(sucursalId)`, mutaciones `useCrearUsuario`, `useActualizarUsuario`, `useToggleUsuario`, `useEliminarUsuario` (invalidan `['usuarios']`).
- `schemas.ts` — zod: `createUsuarioSchema` (modo password discriminado: `correo` sin campos | `manual` con `password`+`confirmar` y `refine` de coincidencia y longitud mínima), `updateUsuarioSchema` (reset opcional), validación de `sucursalIds` requerido si `!accesoTodasSucursales`, `cajaIds` solo si rol = Cajero.
- `components/`:
  - `UsuariosTable.tsx` — tabla con nombre, email, rol (Badge), sucursales (resumen), estado activo, último acceso; acciones por fila.
  - `UsuarioFormModal.tsx` — crear/editar (inner-form con `key`, sin `useEffect`+`setState`). Incluye selector de rol, toggle "acceso a todas las sucursales", multiselección de sucursales, multiselección de cajas (visible solo si rol = Cajero), y el bloque de password (radio de modo en crear; reset opcional en editar).
  - `SucursalesSelector.tsx` / selección de cajas (reutiliza `useSucursales` y `useCajas`).
- `pages/UsuariosPage.tsx` — listado paginado + buscador (`search`) + filtro `soloActivos`. Botón "Nuevo usuario" y acciones de fila (editar/activar-desactivar/eliminar/reset pwd) envueltos en `<Can roles={['SuperAdmin','EmisorAdmin','GerenteSucursal']}>`; **Auditor** ve la tabla en solo lectura.
- Ruta `/config/usuarios` añadida en `router.tsx` bajo `<RoleRoute allow={[...]}>`.
- MSW: `src/test/msw/usuarios-handlers.ts` (usuarios, roles, cajas) registrado en `handlers.ts`.

### Modos de password (crear)

Radio en el form:

1. **"Enviar clave temporal por correo"** (default) → `POST` sin `password`; el backend genera y envía. UX: aviso de que en entornos sin SMTP no llegará el correo.
2. **"Fijar contraseña ahora"** → campos `password` + `confirmar`; se envía `password` y `requiereCambioPwd` configurable.

En **editar**: sección opcional "Resetear contraseña" (si se completa, envía `password`).

## Data flow

`UsuariosPage` → hooks React Query → `api.ts` → axios `api` (interceptor JWT) → backend.

Contratos respetados:
- Lista: `PaginatedResponse<UsuarioListDto>` = `{ items, totalCount, page, pageSize, ... }`.
- Roles: `{ id, nombre }[]`.
- Cajas: `CajaDto[]` (`{ id, sucursalId, codigo, nombre, activo, ... }`).
- Sucursales: `useSucursales` → `/sucursales/todas-activas`.

Invalidación de `['usuarios']` tras crear/editar/toggle/eliminar. Tras reset de password no hay estado de lista que invalidar (salvo `requiereCambioPwd` si se muestra).

## Manejo de errores

- 400 (validación / email duplicado) → mapear `errors[]`/`message` del backend a errores de campo o toast.
- 403 → toast "No tiene permiso"; si se llegó por URL directa a ruta restringida, `RoleRoute` ya muestra `AccesoDenegado`.
- 404 (usuario inexistente) → estado vacío / toast.
- El gating del frontend es **UX**: el backend sigue siendo la autoridad (defensa en profundidad).

## Testing

Estilo Vitest + MSW (como F6), unidad por unidad:

- authz: `roles.test.ts` (función pura `puede`), `useAuthz.test.tsx`, `Can.test.tsx`, `RoleRoute.test.tsx`.
- usuarios: `schemas.test.ts`, `api.test.ts`, `hooks.test.tsx`, `UsuariosTable.test.tsx`, `UsuarioFormModal.test.tsx`, `UsuariosPage.test.tsx`.
- routing/nav: `router.usuarios.test.tsx` (ruta protegida por rol), `nav-config` (item con `roles`), `Sidebar` filtra por rol.
- e2e con Docker al cerrar la rama (login admin de Pruebas, crear/editar/desactivar usuario).

## Entregas

- **Entrega A** (`feat/usuarios-authz`): §1 módulo authz + §2 gating nav/rutas + §3 Usuarios CRUD (con gating de acción dentro de usuarios). Spec = este documento; plan y PR propios.
- **Entrega B** (rama y spec aparte): barrido de `<Can>` en acciones del resto de features (facturación, compras, cuentas por cobrar, inventario, etc.), guiado por una matriz rol→acción derivada leyendo el `[Authorize(Roles=...)]` de cada endpoint de escritura. Su propio ciclo spec→plan→PR.

## Riesgos y notas

- **Matriz rol→ruta/acción:** espeja autorización del backend repartida en ~30 controladores con reglas finas (p. ej. *GerenteSucursal solo ve/edita Cajeros de sus sucursales*). El frontend NO replica el scoping fino por sucursal (eso lo resuelve el backend); solo gatea por rol a nivel de visibilidad de nav/ruta/acción.
- **Correo en dev:** el modo "clave temporal por correo" no entrega en entornos sin SMTP; por eso existe el modo "fijar contraseña ahora".
- **`permisos` vacío:** no construir gating sobre `user.permisos`; usar `user.rolNombre`.
