# FraFactu — Frontend

SPA en **React 19 + TypeScript + Vite + Tailwind v4** para FraFactu (facturación electrónica + inventario unificados). Rediseño visual total respecto a las apps actuales; identidad **"Tinta y Sello"** (ver [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md)).

## Stack

- React 19, TypeScript, **Vite 7**, Tailwind **v4**.
- Estado: TanStack Query (servidor) + Zustand (UI/sesión). Routing: React Router 7.
- Tests: **Vitest 3** + React Testing Library. Animación: framer-motion (moderado).

> Nota de versiones: se usa **Vite 7 + Vitest 3** (no Vite 8) para evitar el doble `esbuild` que rompía `npm ci`. La config de Vitest vive en `vitest.config.ts` aparte.

## Desarrollo con Docker (recomendado)

El entorno completo se levanta desde el repo **FraFactu-Backend** (contiene el `docker-compose`):

```bash
cd ../FraFactu-Backend
docker compose up --build
```

Frontend en http://localhost:5173 (Vite dev con HMR).

## Desarrollo nativo

Requiere Node 22+.

```bash
npm install
cp .env.example .env   # ajusta VITE_API_URL y VITE_GOOGLE_CLIENT_ID
npm run dev            # http://localhost:5173
npm run build          # type-check + build de producción
npm run test           # Vitest
npm run lint           # ESLint
```

## Estructura

```
src/
├── app/            # Bootstrap, providers, router (se llena en F4)
├── design-system/  # Tokens y primitivos (F4)
├── lib/            # api, auth, jwt, query-client, utils (F4)
├── features/       # auth, dashboard, facturacion, inventario, configuracion (F4+)
├── components/     # Componentes compuestos reutilizables
├── styles/         # globals.css (tokens Tailwind v4)
└── test/           # setup de Vitest
```

> Estado actual: **Fase 0**. Solo hay una pantalla placeholder; el design system y los módulos se construyen en F4+.

## Variables de entorno

Solo las `VITE_*` se exponen al cliente: `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`. Ver `.env.example`.
