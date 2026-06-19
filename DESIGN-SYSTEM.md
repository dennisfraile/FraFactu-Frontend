# FraFactu — Bosquejo de Design System (F0)

> Borrador para aprobar **antes de F4**. Aquí se fija la dirección visual; los
> primitivos y el catálogo de componentes se construyen en F4. Deliberadamente
> **distinto** del look actual (Vuetify Material, azul `#3b509d` + dorado
> `#c19d65`, *Reddit Sans*, glassmorphism), que se abandona.

## Tesis: "Tinta y Sello"

El mundo de FraFactu son **documentos fiscales oficiales**: sellos de recepción
del Ministerio de Hacienda, correlativos, códigos de generación, NIT, montos que
deben cuadrar. La facturación es una tarea regulada y tensa; el diseño la hace
sentir **precisa, calmada y confiable**. Nada de gradientes corporativos ni
cristales: superficies planas tipo papel, tipografía técnica y **color con
significado fiscal**.

## Color — el color codifica el estado fiscal

El acento no es decorativo: mapea los estados reales de un DTE.

| Token            | Hex       | Uso |
|------------------|-----------|-----|
| `ink`            | `#0F1C18` | Texto principal / superficies modo oscuro ("tinta") |
| `paper`          | `#FAFAF8` | Fondo claro (off-white frío, **no** el cream serif cliché) |
| `sello` (primary)| `#1F6B4F` | Marca y acción primaria; verde de "sello / recibido" |
| `sello-bright`   | `#2E9E74` | Estado interactivo (hover/focus), enlaces |
| `ambar`          | `#E08A3C` | Contingencia / pendiente / advertencia (uso escaso) |
| `rojo-sello`     | `#C2453B` | Rechazado / anulado / error |
| `slate`          | `#5B6B66` | Texto secundario, iconos |
| `hairline`       | `#E3E6E2` | Bordes finos, divisores, líneas de tabla |

**Semántica fija de estados** (se respeta en toda la app):
aprobado/recibido → `sello` · contingencia/pendiente → `ambar` ·
rechazado/anulado → `rojo-sello` · borrador → `slate`.

**Modo oscuro ("tinta"):** fondo `ink`, papel → `#16241F`, hairlines `#26342E`,
acento `sello-bright`. WCAG AA en ambos modos.

## Tipografía — herencia de documento técnico

Pareo elegido para alejarse de *Reddit Sans* y dar carácter "de oficina técnica":

- **Display / títulos:** `Space Grotesk` — grotesca geométrica, precisa y con
  carácter; se usa con moderación en titulares y números grandes.
- **Cuerpo / UI:** `IBM Plex Sans` — claridad técnica y **excelentes cifras
  tabulares** para tablas de montos.
- **Datos / monoespaciada:** `IBM Plex Mono` — correlativos, código de
  generación, sello de recepción, NIT, QR. Refuerza el "mundo documento".

**Reglas de tipo:**
- Todo **monto y cantidad** va en cifras tabulares (alineadas, no bailan).
- Escala (rem): 0.75 · 0.875 · 1 · 1.25 · 1.5 · 2 · 3. Pesos: 400 cuerpo,
  500 UI, 600/700 display.

## Layout y estructura

- Densidad controlada tipo "hoja de cálculo legible": jerarquía por tipografía y
  espacio, **no** por cajas con sombra ni glass.
- Superficies planas de papel separadas por `hairline`; radios pequeños (4–8px).
- Numeración correlativa (01/02/03) **solo donde hay secuencia real** (p. ej.
  pasos de emisión de un DTE), nunca como adorno.
- Tablas con paginación (mejora explícita sobre el inventario actual).

## Elemento de firma: el "sello"

El componente memorable es el **chip de sello fiscal**: un distintivo plano con
el estado y, debajo, el código en `IBM Plex Mono` (sello de recepción /
código de generación). Es el ancla visual de DTEs, historial y dashboard, y la
única pieza que se permite destacar; todo lo demás se mantiene quieto.

## Piso de calidad

Responsive hasta móvil · foco de teclado visible · `prefers-reduced-motion`
respetado · movimiento sobrio (revelado al cargar, micro-interacción en hover),
sin animación de relleno.

---

### Fuentes de verdad para tokens (Tailwind v4)

Se definirán como variables `@theme` en `src/styles/globals.css` (F4). En F0
solo hay una **semilla** con la paleta principal para el placeholder.
