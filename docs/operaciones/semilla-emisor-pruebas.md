# Semilla del emisor de pruebas (e2e de F5.1 — Facturación: Factura 01)

Habilita el **e2e manual** de F5.1 sobre una base de datos limpia. La BD recién migrada **no
siembra** roles, usuarios, emisores, cajas ni bodegas (solo catálogos vía `HasData`), así que para
iniciar sesión **y** emitir una Factura (01) hay que provisionar a mano:

1. un **rol** y un **usuario admin** (problema chicken-and-egg del bootstrap),
2. un **emisor de pruebas** (datos fiscales, **ambiente Pruebas `00`**),
3. una **sucursal** ligada al emisor,
4. una **caja** (POS) — obligatoria para emitir Factura 01,
5. una **bodega** — obligatoria por cada ítem de tipo **Bien** (producto físico),
6. (opcional) un **producto** de prueba para el flujo de búsqueda.

> **Alcance F5.1 — modo PENDIENTE (sin MH).** La emisión de F5.1 usa el endpoint
> **`POST /api/facturas/guardar-pendiente`** (NO `POST /api/facturas`, que intenta transmitir a MH y
> falla sin credenciales reales). El DTE queda en estado `PENDIENTE_ENVIO`. El emisor de pruebas se
> siembra con **credenciales MH de relleno** (`Mh*` son `NOT NULL` pero no se usan sin transmisión).
> En ambiente `00` el backend **no valida ni descuenta stock**: basta con que la bodega exista.

> **Convención de nombres (verificado contra el esquema vivo, no asumir):**
> - Tablas principales en **PascalCase**: `"Roles"`, `"Usuarios"`, `"TBL_Emisores"`,
>   `"TBL_Sucursales"`, `"TBL_ProductosServicios"`, `"Receptores"`, `"Cajas"`.
> - Tablas de catálogo y `bodegas` en **snake_case**, pero con **columnas en PascalCase**:
>   `cat_departamento`, `cat_municipio`, `cat_ambiente_destino`, `cat_uni_medida`, `cat_tipo_item`,
>   `cat_tipo_establecimiento`, `bodegas` — columnas `"Id"`, `"Codigo"`, `"Valor"`, etc.
> En PostgreSQL los identificadores con mayúsculas **van entre comillas dobles**.

---

## 0. Prerrequisitos

- Repos como **carpetas hermanas**: `FraFactu-Backend` y `FraFactu-Frontend`.
- **Docker Desktop encendido** (en esta máquina suele estar apagado):
  ```powershell
  Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"   # esperar al daemon
  ```
- Levantar el stack desde `FraFactu-Backend`: `docker compose up --build`
  - Backend http://localhost:8080 (Swagger `/swagger`) · Frontend http://localhost:5173 · Postgres `localhost:5432` (`frafactu`/`frafactu`/`frafactu`).
- Abrir psql: `docker exec -it <contenedor_postgres> psql -U frafactu -d frafactu`
  (el contenedor suele llamarse `frafactu-db`).

---

## 1. Semilla base (rol, emisor, sucursal, bodega, producto, usuario)

Pega esto en psql. Resuelve los IDs de catálogo por subconsulta sobre `"Codigo"` (departamento
San Salvador `06`, ambiente Pruebas `00`, tipo establecimiento `01`, unidad `59`, tipo ítem `1`).
**Reemplaza `<SHA256_HEX_DEL_TOKEN>`** por el hash del paso 3.

```sql
BEGIN;

-- 1.1 Rol base
INSERT INTO "Roles" ("Nombre","Activo","FechaCreacion")
VALUES ('EmisorAdmin', true, NOW()) ON CONFLICT DO NOTHING;

-- 1.2 Emisor de pruebas (ambiente 00 = Pruebas; credenciales MH de relleno).
--     OJO: CatTipoEstablecimientoId es nullable pero su DEFAULT es 0 y rompe el FK si se omite.
INSERT INTO "TBL_Emisores" (
  "Nit","Nrc","NombreRazonSocial","NombreComercial","CodigoActividad","DescripcionActividad",
  "CorreoElectronico","Telefono","Direccion",
  "CatDepartamentoId","CatMunicipioId","CatTipoEstablecimientoId","CatAmbienteDestinoId",
  "MhUsuario","MhPassPrivada","MhLlavePrivada","MhLlavePublica","MhClaveApi",
  "Activo","FechaCreacion","EmailHabilitado","GmailConectado","LecturaCorreoHabilitada"
) VALUES (
  '06140000000001','1234567','Empresa de Pruebas, S.A. de C.V.','Pruebas FraFactu','47640','Venta al por menor (pruebas)',
  'pruebas@frafactu.local','22220000','Col. Escalon, San Salvador',
  (SELECT "Id" FROM cat_departamento         WHERE "Codigo"='06' LIMIT 1),
  (SELECT "Id" FROM cat_municipio            WHERE "CodigoDepartamento"='06' ORDER BY "Codigo" LIMIT 1),
  (SELECT "Id" FROM cat_tipo_establecimiento WHERE "Codigo"='01' LIMIT 1),
  (SELECT "Id" FROM cat_ambiente_destino     WHERE "Codigo"='00' LIMIT 1),
  'PRUEBA','PRUEBA','PRUEBA','PRUEBA','PRUEBA', true, NOW(), false,false,false
);

-- 1.3 Sucursal ligada al emisor
INSERT INTO "TBL_Sucursales" (
  "Codigo","Nombre","EmisorId","CatDepartamentoId","CatMunicipioId","CatTipoEstablecimientoId","CodigoEstablecimiento","Activo","FechaCreacion"
) VALUES (
  'CASA-MATRIZ','Casa Matriz',(SELECT "Id" FROM "TBL_Emisores" WHERE "Nit"='06140000000001'),
  (SELECT "Id" FROM cat_departamento         WHERE "Codigo"='06' LIMIT 1),
  (SELECT "Id" FROM cat_municipio            WHERE "CodigoDepartamento"='06' ORDER BY "Codigo" LIMIT 1),
  (SELECT "Id" FROM cat_tipo_establecimiento WHERE "Codigo"='01' LIMIT 1), '0001', true, NOW()
);

-- 1.4 Bodega (snake_case 'bodegas'; columnas PascalCase; tiene "Activa" Y "Activo", ambas NOT NULL)
INSERT INTO bodegas ("Codigo","Nombre","SucursalId","EsPrincipal","Activa","Activo","FechaCreacion")
VALUES ('BOD-01','Bodega Principal',
  (SELECT "Id" FROM "TBL_Sucursales" WHERE "Codigo"='CASA-MATRIZ'), true, true, true, NOW());

-- 1.5 Producto de prueba (Bien gravado; precio IVA-incluido para Factura 01; visible en todas las sucursales)
INSERT INTO "TBL_ProductosServicios" (
  "Codigo","Nombre","Descripcion","PrecioVenta","EmisorId","CatUnidadMedidaId","CatTipoItemId",
  "TipoImpuesto","PrecioIncluyeIva","AccesoTodasSucursales","Activo","FechaCreacion"
) VALUES (
  'P001','Producto de prueba','Bien gravado para e2e',56.50000000,
  (SELECT "Id" FROM "TBL_Emisores" WHERE "Nit"='06140000000001'),
  (SELECT "Id" FROM cat_uni_medida WHERE "Codigo"='59' LIMIT 1),
  (SELECT "Id" FROM cat_tipo_item  WHERE "Codigo"='1'  LIMIT 1),
  1, true, true, true, NOW()
);

-- 1.6 Usuario admin (Local). PasswordHash NULL: se fija luego vía reset-password (BCrypt).
INSERT INTO "Usuarios" (
  "Email","NombreCompleto","RolId","EmisorId","ProveedorAuth","Estado","AccesoTodasSucursales",
  "Activo","FechaCreacion","PermiteCambioPwd","RequiereCambioPwd","TokenVersion","IntentosFallidos",
  "PasswordResetTokenHash","PasswordResetTokenExpira"
) VALUES (
  'admin@pruebas.local','Admin Pruebas',
  (SELECT "Id" FROM "Roles" WHERE "Nombre"='EmisorAdmin'),
  (SELECT "Id" FROM "TBL_Emisores" WHERE "Nit"='06140000000001'),
  1, 1, true, true, NOW(), true, false, 0, 0,
  '<SHA256_HEX_DEL_TOKEN>', NOW() + INTERVAL '1 day'
);

COMMIT;
```

Enumeraciones (enteros): `Usuarios.ProveedorAuth` **1=Local**, 2=Google, 3=SmartHub ·
`Usuarios.Estado` **1=Activo**, 2=Bloqueado, 3=Suspendido, 4=Inactivo ·
`ProductosServicios.TipoImpuesto` **1=Gravado**, 2=Exento, 3=NoSujeto ·
`cat_ambiente_destino.Codigo` **'00'=Pruebas**, '01'=Producción.

> **Receptor (opcional).** No hace falta para Consumidor Final: el frontend envía un receptor
> inline `{ nombre: "Consumidor Final" }`. Si quieres un receptor registrado, inserta en
> `"Receptores"` con `"EmisorId"`, `"NombreRazonSocial"`, `"CorreoElectronico"`, `"Telefono"`,
> `"Direccion"` y pon **explícitamente en NULL** las FK de catálogo opcionales
> (`"CatTipoDocumentoIdentificacionReceptorId"`, `"CatDepartamentoId"`, `"CatMunicipioId"`,
> `"CatDistritoId"`) — su DEFAULT 0 rompe el FK.

---

## 2. Fijar la contraseña del admin (BCrypt vía endpoint anónimo)

`PasswordResetTokenHash` = `sha256hex(token)` (minúsculas):
```bash
printf '%s' 'MiTokenSecreto123' | sha256sum   # primer campo = <SHA256_HEX_DEL_TOKEN>
```
```bash
curl -X POST http://localhost:8080/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"MiTokenSecreto123","newPassword":"Pruebas#2026","confirmPassword":"Pruebas#2026"}'
```
Como `RequiereCambioPwd=true`, el primer login entra por **primer ingreso** (cambio de clave). Para
saltarlo, pon `"RequiereCambioPwd"=false` en el INSERT 1.6.

---

## 3. Caja (POS) — vía API tras el login

La caja se crea más cómodo por API (auto-genera `Codigo`/`CodPuntoVenta`). Tras obtener el JWT:
```bash
TOKEN=...   # del login
curl -X POST http://localhost:8080/api/cajas \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"sucursalId": <sucursalId>, "nombre":"Caja Principal", "codigo":null, "codPuntoVenta":null, "codPuntoVentaMH":"01"}'
```

---

## 4. Verificación e2e

1. **Login** y forma del JWT:
   ```bash
   curl -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" \
     -d '{"email":"admin@pruebas.local","password":"Pruebas#2026"}'
   ```
   El `token` debe traer **`EmisorId`** y `emisores_accesibles`. (`AccesoTodasSucursales=true` deja
   `sucursalIds` vacío en la respuesta; en la UI se elige la sucursal del selector.)
2. **e2e en el navegador** (http://localhost:5173): Facturación → **Emitir DTE** →
   elegir **Sucursal** y **Caja**, agregar el **Producto de prueba** (o ítem manual) y su **Bodega**,
   forma de pago que cuadre → **Revisar y emitir** (vista previa: totales, **QR**, total en letras) →
   **Emitir DTE** → queda **PENDIENTE** (`PENDIENTE_ENVIO`). Verificar en **Historial**, abrir
   **detalle**, **Anular** con motivo. Confirmar que totales/tributos no producen 400.

---

## Notas — contrato real de emisión PENDIENTE (validado contra el backend)

El DTO que arma el frontend cumple estos requisitos del backend (verificados en e2e):
- **Endpoint** `POST /api/facturas/guardar-pendiente` (no `/api/facturas`).
- `identificacion.version = 2` para Factura 01; `numeroControl`/`codigoGeneracion` con **placeholders
  válidos** (el validador los exige; el servicio los regenera).
- `cajaId` obligatorio; `bodegaId` obligatorio por ítem **Bien**; `receptor` inline para Consumidor
  Final; `uniMedida` = **Id de catálogo** `cat_uni_medida` (no el código MH).

## Notas — bootstrap y diferidos
- **Bootstrap chicken-and-egg:** `POST /api/usuarios` exige admin autenticado → de ahí el INSERT
  directo + `reset-password`. Recomendación (fase backend, no F5): seeder de arranque idempotente.
- **Diferido a F5.4 (transmisión real a MH):** cargar usuario/clave MH, certificado
  (`MhLlavePrivada`/`MhLlavePublica`) y `MhClaveApi` reales del ambiente de Pruebas; usar
  `POST /api/facturas` (con `crearEventoAutomatico`) y validar stock real (en producción sí se descuenta).
- Si un INSERT falla por FK de catálogo, lista el catálogo y ajusta el `Codigo`:
  `SELECT "Id","Codigo","Valor" FROM cat_ambiente_destino;` (idem `cat_departamento`, `cat_municipio`,
  `cat_uni_medida`, `cat_tipo_item`, `cat_tipo_establecimiento`).

---

## F5.2 — Semilla y contrato real de CCF (03) y FSE (14)

Validado e2e contra el backend vivo (ambos → **HTTP 201 `PENDIENTE_ENVIO`**). A diferencia de la
Factura 01 (Consumidor Final inline), CCF y FSE **requieren un receptor registrado** (`receptorId`;
el backend lo resuelve a bloque completo). Crear los dos receptores con el **quick-create** del
formulario (o `POST /api/receptores`), eligiendo **departamento + municipio + DISTRITO + dirección**:

1. **Receptor contribuyente (para CCF 03):** con **NRC**, tipo de documento **NIT**, actividad
   económica, y **dirección completa con distrito**.
2. **Sujeto excluido (para FSE 14):** sin NRC, documento DUI/otro, actividad, y **dirección completa
   con distrito**.

### Diferencias de contrato frente a la Factura 01 (verificadas en e2e, ya implementadas en el frontend)
- **CCF (03) — IVA como tributo:** el backend valida
  `montoTotalOperacion = subTotal + Σ(resumen.tributos.valor)`. El IVA (código **`"20"`**) va en
  `resumen.tributos` (`[{codigo,descripcion,valor}]`) **y** cada ítem gravado lleva `tributos: ["20"]`.
  (No basta `ivaItem`/`totalIva`.) `version = 4`.
- **Receptor con distrito obligatorio (03 y 14):** `ValidarDireccionReceptorAsync` exige
  departamento+municipio+**distrito**+complemento para tipos 03/04/05/06/14. Sin distrito → 400
  "debe tener dirección completa. Falta: distrito".
- **FSE (14) requiere caja:** el backend exige `cajaId` vía `guardar-pendiente`.
  `version = 2`. El ítem es una **compra** (`compra`, sin IVA); **no** se envía `bodegaId` (FSE no
  descuenta stock — confirmado: el backend lo acepta sin bodega). Retenciones: renta 10% si
  subtotal > $100, IVA 1% si el emisor es agente de retención; `totalPagar = subtotal − retenciones`.

---

## F5.3 — Nota de Crédito (05) y Nota de Débito (06)

NC/ND **ajustan un CCF (03)** referenciándolo como **documento relacionado**. Validado e2e contra el
backend (emisión vía `guardar-pendiente` → **HTTP 201 `PENDIENTE_ENVIO`**; NC factura id 14, ND id 15).

### Cómo probar el e2e
1. Emitir (o reutilizar) un **CCF (03)** y tomar su `codigoGeneracion` y `fechaEmision` (`GET /api/facturas/{id}`).
2. Construir la NC/ND con la forma del frontend y `POST /api/facturas/guardar-pendiente`.

### Contrato (verificado en e2e, ya implementado en el frontend)
- **Documento relacionado obligatorio:** `documentosRelacionados:[{ tipoDocumento:'03', tipoGeneracion:1,
  numeroDocumento:<codigoGeneracion del CCF>, fechaEmision:<yyyy-MM-dd del CCF> }]`. `version = 4` (NC y ND).
- **Requieren caja:** `guardar-pendiente` exige `cajaId` también para 05/06 (con `cajaId:null` → 400
  "Caja no encontrada"; con caja → 201). *(Corrige la nota previa de FSE: la excepción 05/06 del validador
  MH no aplica al path de `guardar-pendiente`.)*
- **Cálculo = CCF:** IVA neto, IVA como tributo (`['20']` por ítem + `resumen.tributos`),
  `montoTotalOperacion = subTotal + Σtributos`. **No** se envía `bodegaId` (no mueven stock).
- **Receptor heredado** del CCF original (`receptorId`); requiere dirección completa con distrito (igual
  que el CCF). NC precarga ítems del original (parcial); ND lleva cargos nuevos a mano.
- **Buscador (`buscar-para-nc`/`buscar-para-nd`):** filtra `EstadoHacienda == 'PROCESADO'`, es decir solo
  CCFs **ya aceptados por MH**. En el entorno de pruebas (sin transmisión MH, todo `PENDIENTE_ENVIO`) el
  buscador devuelve `[]`; el flujo de búsqueda en la UI se valida completo con un CCF `PROCESADO` (F5.4, o
  promoviendo un CCF a `PROCESADO` por SQL). La **emisión** de la NC/ND (lo crítico) sí se valida con el
  `codigoGeneracion` de cualquier CCF.
