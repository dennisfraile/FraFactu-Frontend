# Semilla del emisor de pruebas (e2e de F5.1 — Facturación: Factura 01)

Este documento habilita el **e2e manual** de F5.1 sobre una base de datos limpia. La BD recién
migrada **no siembra** roles, usuarios ni emisores (solo catálogos vía `HasData`), así que para
poder iniciar sesión **y** emitir una Factura (01) hay que provisionar a mano:

1. un **rol** y un **usuario admin** (problema chicken-and-egg del bootstrap; ver más abajo),
2. un **emisor de pruebas** con datos fiscales mínimos y **ambiente Pruebas (`00`)**,
3. una **sucursal** ligada al emisor,
4. (opcional) un **producto** y un **receptor** de prueba para los flujos de búsqueda.

> **Alcance F5.1 — modo PENDIENTE (sin MH).** La emisión de F5.1 crea el DTE con
> `identificacion.crearEventoAutomatico = false`: **no se transmite a Hacienda**. Por eso el
> emisor de pruebas se siembra con **credenciales MH de relleno** (las columnas `Mh*` son
> `NOT NULL` en el esquema, pero su contenido no se usa mientras no haya transmisión). La
> transmisión real (sello de recepción) y la invalidación oficial se difieren a **F5.4**.

Los nombres de tablas/columnas de este documento están verificados contra el
`ApplicationDbContextModelSnapshot.cs` del backend (EF Core). Aun así, **confirma los códigos de
catálogo contra la BD viva** si algún INSERT falla por FK: los IDs de catálogo se resuelven por
**subconsulta sobre la columna `Codigo`**, así que el script no depende de IDs fijos.

---

## 0. Prerrequisitos

- Los dos repos como **carpetas hermanas**: `FraFactu-Backend` y `FraFactu-Frontend`.
- **Docker Desktop encendido.** En esta máquina suele estar apagado; arráncalo y espera al daemon:
  ```powershell
  Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  # esperar ~1-2 min hasta que `docker info` responda
  ```
- Levantar el stack desde `FraFactu-Backend`:
  ```powershell
  docker compose up --build
  ```
  - Backend: http://localhost:8080 (Swagger en `/swagger`).
  - Frontend: http://localhost:5173.
  - Postgres: `localhost:5432` (user/pass/db = `frafactu`).
- El backend migra solo al arrancar (`MigrateAsync`).

---

## 1. Abrir psql dentro del contenedor de Postgres

```powershell
# nombre del contenedor (ajusta si difiere):
docker ps --format "{{.Names}}" | Select-String postgres
# abrir psql:
docker exec -it <contenedor_postgres> psql -U frafactu -d frafactu
```

> En PostgreSQL los identificadores con mayúsculas **van entre comillas dobles** (las tablas de
> este esquema usan PascalCase y prefijo `TBL_` en algunas). Los literales de texto van entre
> comillas simples.

---

## 2. Semilla (un solo bloque transaccional)

Pega esto en psql. Usa subconsultas para resolver los IDs de catálogo por su `Codigo` (MH):
departamento San Salvador (`06`), un municipio de ese departamento, ambiente **Pruebas** (`00`),
unidad de medida **Unidad** (`59`), tipo de ítem **Bien** (`1`). Si algún `Codigo` no existe en
tu catálogo, ajústalo con un `SELECT "Id","Codigo","Valor" FROM "<CatX>" ...` previo.

```sql
BEGIN;

-- 2.1 Rol base
INSERT INTO "Roles" ("Nombre", "Activo", "FechaCreacion")
VALUES ('EmisorAdmin', true, NOW())
ON CONFLICT DO NOTHING;

-- 2.2 Emisor de pruebas (ambiente 00 = Pruebas; credenciales MH de relleno: NO se transmite en F5.1)
INSERT INTO "TBL_Emisores" (
  "Nit", "Nrc", "NombreRazonSocial", "NombreComercial",
  "CodigoActividad", "DescripcionActividad",
  "CorreoElectronico", "Telefono", "Direccion",
  "CatDepartamentoId", "CatMunicipioId", "CatAmbienteDestinoId",
  "MhUsuario", "MhPassPrivada", "MhLlavePrivada", "MhLlavePublica", "MhClaveApi",
  "Activo", "FechaCreacion",
  "EmailHabilitado", "GmailConectado", "LecturaCorreoHabilitada"
) VALUES (
  '06140000000001', '1234567', 'Empresa de Pruebas, S.A. de C.V.', 'Pruebas FraFactu',
  '47640', 'Venta al por menor (pruebas)',
  'pruebas@frafactu.local', '22220000', 'Col. Escalón, San Salvador',
  (SELECT "Id" FROM "CatDepartamento"    WHERE "Codigo" = '06' LIMIT 1),
  (SELECT "Id" FROM "CatMunicipio"       WHERE "CodigoDepartamento" = '06' ORDER BY "Codigo" LIMIT 1),
  (SELECT "Id" FROM "CatAmbienteDestino" WHERE "Codigo" = '00' LIMIT 1),
  'PRUEBA', 'PRUEBA', 'PRUEBA', 'PRUEBA', 'PRUEBA',
  true, NOW(),
  false, false, false
);

-- 2.3 Sucursal ligada al emisor
INSERT INTO "TBL_Sucursales" (
  "Codigo", "Nombre", "EmisorId",
  "CatDepartamentoId", "CatMunicipioId", "CatTipoEstablecimientoId",
  "CodigoEstablecimiento", "Activo", "FechaCreacion"
) VALUES (
  'CASA-MATRIZ', 'Casa Matriz',
  (SELECT "Id" FROM "TBL_Emisores" WHERE "Nit" = '06140000000001'),
  (SELECT "Id" FROM "CatDepartamento" WHERE "Codigo" = '06' LIMIT 1),
  (SELECT "Id" FROM "CatMunicipio"    WHERE "CodigoDepartamento" = '06' ORDER BY "Codigo" LIMIT 1),
  (SELECT "Id" FROM "CatTipoEstablecimiento" ORDER BY "Codigo" LIMIT 1),
  '0001', true, NOW()
);

-- 2.4 Producto de prueba (gravado, precio IVA-incluido para Factura 01; visible en todas las sucursales)
INSERT INTO "TBL_ProductosServicios" (
  "Codigo", "Nombre", "Descripcion", "PrecioVenta",
  "EmisorId", "CatUnidadMedidaId", "CatTipoItemId",
  "TipoImpuesto", "PrecioIncluyeIva", "AccesoTodasSucursales",
  "Activo", "FechaCreacion"
) VALUES (
  'P001', 'Producto de prueba', 'Bien gravado para e2e', 56.50000000,
  (SELECT "Id" FROM "TBL_Emisores" WHERE "Nit" = '06140000000001'),
  (SELECT "Id" FROM "CatUnidadMedida" WHERE "Codigo" = '59' LIMIT 1),
  (SELECT "Id" FROM "CatTipoItem"     WHERE "Codigo" = '1'  LIMIT 1),
  1, true, true,
  true, NOW()
);

-- 2.5 Receptor de prueba (para el flujo NO consumidor final; opcional)
INSERT INTO "Receptores" (
  "EmisorId", "NombreRazonSocial", "CorreoElectronico", "Telefono", "Direccion",
  "Activo", "FechaCreacion"
) VALUES (
  (SELECT "Id" FROM "TBL_Emisores" WHERE "Nit" = '06140000000001'),
  'Cliente de Prueba, S.A.', 'cliente@pruebas.local', '22221111', 'San Salvador',
  true, NOW()
);

-- 2.6 Usuario admin (Local). PasswordHash NULL: se fija luego vía reset-password (BCrypt).
--     Reemplaza <SHA256_HEX_DEL_TOKEN> por el hash del paso 3.
INSERT INTO "Usuarios" (
  "Email", "NombreCompleto", "RolId", "EmisorId",
  "ProveedorAuth", "Estado", "AccesoTodasSucursales",
  "Activo", "FechaCreacion",
  "PermiteCambioPwd", "RequiereCambioPwd", "TokenVersion", "IntentosFallidos",
  "PasswordResetTokenHash", "PasswordResetTokenExpira"
) VALUES (
  'admin@pruebas.local', 'Admin Pruebas',
  (SELECT "Id" FROM "Roles" WHERE "Nombre" = 'EmisorAdmin'),
  (SELECT "Id" FROM "TBL_Emisores" WHERE "Nit" = '06140000000001'),
  1, 1, true,
  true, NOW(),
  true, false, 0, 0,
  '<SHA256_HEX_DEL_TOKEN>', NOW() + INTERVAL '1 day'
);

COMMIT;
```

Enumeraciones (enteros) usadas arriba, del dominio:
- `Usuarios.ProveedorAuth`: **1 = Local**, 2 = Google, 3 = SmartHub.
- `Usuarios.Estado`: **1 = Activo**, 2 = Bloqueado, 3 = Suspendido, 4 = Inactivo.
- `ProductosServicios.TipoImpuesto`: **1 = Gravado**, 2 = Exento, 3 = NoSujeto.
- Ambiente MH: `CatAmbienteDestino.Codigo = '00'` (Pruebas), `'01'` (Producción).

---

## 3. Fijar la contraseña del admin (BCrypt vía endpoint anónimo)

El backend hashea con BCrypt al consumir el token de reset. El `PasswordResetTokenHash` de la
fila es `sha256hex(token)` (minúsculas), reproducible con:

```bash
# en Git Bash:
printf '%s' 'MiTokenSecreto123' | sha256sum
# -> usa el primer campo (hex) como <SHA256_HEX_DEL_TOKEN> en el INSERT 2.6
```

Luego fija la contraseña (anónimo):

```bash
curl -X POST http://localhost:8080/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"MiTokenSecreto123","newPassword":"Pruebas#2026","confirmPassword":"Pruebas#2026"}'
```

> Como `RequiereCambioPwd = true`, el primer login entra por el flujo de **primer ingreso**
> (JWT restringido → cambio de contraseña → sesión completa). Si prefieres saltarlo, pon
> `"RequiereCambioPwd" = false` en el INSERT 2.6.

---

## 4. Verificación

1. **Login** y forma del JWT:
   ```bash
   curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@pruebas.local","password":"Pruebas#2026"}'
   ```
   Decodifica el `token` (jwt.io) y confirma que trae **`emisorId`** y **`sucursalIds`** (o el
   claim equivalente). El frontend (F4) usa el `exp` del token; `ExpiresIn` puede venir `0` y no
   afecta.
2. **e2e en el navegador** (http://localhost:5173):
   - Iniciar sesión → **Facturación → Emitir DTE**.
   - Agregar el **Producto de prueba** (o un ítem manual), una **forma de pago** que cuadre el total.
   - **Revisar y emitir** → vista previa (totales, **QR**, total en letras) → **Emitir DTE**
     → queda **PENDIENTE** (sin transmisión MH).
   - **Historial** → aparece el DTE; abrir **detalle**; **Anular** con motivo.
   - Confirmar que los totales/tributos no producen `400` del backend.

Registrar el resultado (qué pasó, qué quedó diferido por falta de credenciales MH).

---

## Notas

- **Bootstrap chicken-and-egg:** `POST /api/usuarios` exige rol de admin autenticado, así que el
  primer usuario **no** se puede crear por API sobre BD limpia → de ahí el INSERT directo + el
  flujo de `reset-password`. Recomendación (fase backend, no F5): un **seeder de arranque**
  idempotente (rol base + admin con clave temporal/`RequiereCambioPwd`) o un endpoint de bootstrap
  protegido.
- **Credenciales MH de relleno:** válidas solo para F5.1 (modo PENDIENTE). Para F5.4 (transmisión
  real) habrá que cargar usuario/clave MH, certificado (`MhLlavePrivada`/`MhLlavePublica`) y
  `MhClaveApi` reales del ambiente de Pruebas de Hacienda.
- Si un INSERT falla por FK de catálogo, lista el catálogo y ajusta el `Codigo`:
  `SELECT "Id","Codigo","Valor" FROM "CatAmbienteDestino";` (idem CatDepartamento, CatMunicipio,
  CatUnidadMedida, CatTipoItem, CatTipoEstablecimiento).
