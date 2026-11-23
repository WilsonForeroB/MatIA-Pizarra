# Estilos de la pizarra (`pizarra.html`)

Todo el CSS está en el bloque `<style>` de `pizarra.html`: líneas 22 (`<style>`) a 553 (`</style>`). El contenido útil va de la 23 a la 552.

Estructura del bloque:

| Líneas | Sección |
|---|---|
| 23-61 | `tokens.css` (Apéndice A): variables en `:root` |
| 62-101 | `matia.css` (Apéndice C): componentes `mi-*` y animaciones usadas |
| 102-552 | Estilos propios de la pizarra |

---

## 1. Tokens (variables CSS)

### 1.1 Colores, tema claro (`:root, [data-theme="light"]`, líneas 24-31)

| Variable | Valor | Uso |
|---|---|---|
| `--surface` | `#f7faf6` | Fondo de la página (`body`) |
| `--surface-raised` | `#ffffff` | Cabecera, paneles, hoja, diálogos, botones |
| `--surface-sunken` | `#ebf1ea` | Fondos hundidos: `kbd`, resultados, lienzos de gráficas, notas |
| `--ink` | `#14201a` | Texto principal |
| `--ink-muted` | `#46554c` | Texto secundario, iconos, placeholders |
| `--border` | `#d5e0d4` | Bordes finos y separadores |
| `--border-strong` | `#76867b` | Bordes de botones, campos y paneles |
| `--brand` | `#0f5a3a` | Marca «Pizarra», enlaces, títulos de diálogos |
| `--on-brand` | `#ffffff` | Texto sobre `--brand` |
| `--brand-soft` | `#e2f0e7` | Fondo suave de marca (fallback de acento) |
| `--focus-ring` | `#0f7a4d` | Contorno de foco (`:focus-visible`) |
| `--mod-math` | `#1d58c9` | Acento del módulo matemáticas (`[data-module="math"]`) |
| `--mod-math-soft` | `#e3ebfa` | Fondo suave del módulo matemáticas |
| `--on-mod` | `#ffffff` | Texto sobre `--mod-math` |
| `--data-1` … `--data-8` | `#009b71`, `#0072b2`, `#b87f00`, `#bc6f9a`, `#d55e00`, `#4590ba`, `#7b5ea7`, `#8f8f00` | Series de datos: gráficas, redes, tablas de verdad, colores de trazo (`.sw`) |
| `--selection` / `--selection-strong` | `#cfe2f6` / `#0072b2` | Selección de texto y bloques en azul. No usar el verde de marca, que es el de la línea activa. |
| `--warning` | `#a8480c` | Avisos, salto de página, errores, `×` de borrar |
| `--pio-tile` | `#fff6d6` | Fondo de la mascota Pío |
| `color-scheme` | `light` | Scrollbars y controles nativos |

### 1.2 Colores, tema oscuro

Hay tres bloques que redefinen los mismos tokens:

| Bloque | Líneas | Cuándo aplica |
|---|---|---|
| `[data-theme="dark"]` | 32-39 | Tema forzado a oscuro por el atributo |
| `@media (prefers-color-scheme: dark)` + `:root:not([data-theme="light"])` | 40-49 | Sistema en oscuro y sin tema forzado a claro |

Valores del tema oscuro (iguales en los dos bloques):

| Variable | Valor |
|---|---|
| `--surface` / `--surface-sunken` | `#0e1612` / `#0a110e` |
| `--surface-raised` | `#151f1a` |
| `--ink` / `--ink-muted` | `#e8f1ea` / `#a6b8ac` |
| `--border` / `--border-strong` | `#25352d` / `#6c8074` |
| `--brand` / `--on-brand` / `--brand-soft` | `#6fd3a0` / `#08140e` / `#123324` |
| `--focus-ring` | `#7fe0ae` |
| `--mod-math` / `--mod-math-soft` / `--on-mod` | `#7fa8f5` / `#14274a` / `#0b1220` |
| `--data-1` … `--data-8` | `#2fc79a`, `#4aa3df`, `#f5b62e`, `#e59ac3`, `#f0824a`, `#7cc8f2`, `#a58bd4`, `#d6d34a` |
| `--selection` / `--selection-strong` | `#1e4467` / `#4aa3df` |
| `--warning` | `#f2a068` |
| `--pio-tile` | `#fff6d6` (sin cambio) |
| `color-scheme` | `dark` |

No hay modo de alto contraste.

### 1.3 Tipografía

| Variable | Valor | Uso |
|---|---|---|
| `--font-sans` | IBM Plex Sans, system-ui, … | Interfaz: botones, menús, etiquetas |
| `--font-mono` | JetBrains Mono, ui-monospace, … | Valores numéricos, `kbd`, atajos, números de línea, estados |
| `--font-serif` | Source Serif 4, Iowan Old Style, … | Texto de bloques, celdas de tablas, leyendas de gráficas, herramientas |
| `--scale` | `1.4` | Multiplica tamaños de matemáticas, texto de bloques, tablas y notas (`calc(24px * var(--scale))`) |

### 1.4 Espaciado, radios, bordes

| Token | Valor |
|---|---|
| `--space-1` … `--space-8` | 4, 8, 12, 16, 24, 32, 48, 64 px |
| `--radius-sm` | 4px (`kbd`, celdas de rejilla, `sym`) |
| `--radius-md` | 8px (botones, paneles, campos, bloques con foco) |
| `--radius-lg` | 14px (hoja `.sheet`, `dialog`) |
| `--radius-pill` | 999px (píldoras: barra de presentación, «+ Nueva línea», selección de línea) |
| `--border-width-thin` | 1px |
| `--border-width-medium` | 2px (foco, celda marcada, bloque activo al elegir) |
| `--border-width-thick` | 3px. Definido, sin uso en este bloque |

### 1.5 Movimiento

| Token | Valor | Uso |
|---|---|---|
| `--duration-fast` | 150ms | Hover, `:active`, opacidad de botones de borrar |
| `--duration-base` | 220ms | Entradas `mi-rise`, barra de presentación |
| `--duration-slow` | 320ms | Animación `mi-pop` de Pío |
| `--duration-demo` | 600ms | Definido, sin uso en este bloque |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Transiciones generales |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entradas y animaciones |
| `--ease-in-out` | `cubic-bezier(0.45, 0, 0.55, 1)` | Definido, sin uso en este bloque |

Media query `prefers-reduced-motion: reduce` (línea 100, también 364): anula animaciones y transiciones globalmente. Línea 364 quita además las animaciones de selección.

### 1.6 Variables de acento (no globales)

Definidas en las líneas 63-64. `.mi-scope` y `[data-module]` toman el acento de marca. `[data-module="math"]` toma el acento de matemáticas. Los componentes usan `--accent`, `--on-accent` y `--accent-soft`.

### 1.7 Media queries

| Línea | Condición | Efecto |
|---|---|---|
| 40 | `prefers-color-scheme: dark` | Tokens oscuros |
| 100, 364 | `prefers-reduced-motion: reduce` | Sin animaciones ni transiciones |
| 128 | `max-width: 720px` | Barra de herramientas en una línea con scroll horizontal |
| 243 | `hover: none` | Botones de borrar con opacidad .7 |
| 246 | `max-width: 640px` | Layout de derivación en móvil |
| 304, 315 | `max-width: 520px` | Diálogo de Pío y «Acerca de» en columna |
| 365 | `max-width: 640px` | Barra de selección de línea en dos columnas |
| 536 | `print` | Solo la hoja imprimible |
| 547 | `max-width: 640px` | Márgenes reducidos en móvil |

---

## 2. Componentes base `mi-*` (líneas 63-101)

| Clase | Líneas | Variantes y estados |
|---|---|---|
| `.mi-btn` | 67-78 | `--primary` (74 relleno de acento), `--ghost` (75-76), `--sm` (77), `[aria-pressed="true"]` (78), `:hover`, `:active`, `:disabled` |
| `.mi-seg` | 79-84 | Contenedor segmentado. Hijos `button`, `button[aria-pressed="true"]` |
| `.mi-field` | 85-87 | Campo con `output` y `input[type=range]` |
| `.mi-callout` | 88-90 | Recuadro de texto con `.mi-label` y `p`. Variantes `--nota` (91-92), `--aviso` (93-94), `--pio` (95) |
| `.mi-pio` | 96-97 | Mascota Pío en círculo, con `img` |
| `.mi-label` | 89 | Etiqueta en mayúsculas (dentro de `.mi-callout`) |
| `.mi-btn--danger` | 302-303 | Botón de acción destructiva, definido en la sección de diálogos |
| `.mi-check` | 325-326 | Casilla con etiqueta |
| `.mi-row` | (sin regla) | Se usa en el HTML (línea 732) pero no tiene CSS |

Animaciones: `mi-rise` (98), `mi-pop` (99). Dentro de la pizarra se definen también `pk-nudge` (361), `pick-pulse` (362) y `pick-flash` (363).

---

## 3. Estilos de la pizarra por zona

| Zona | Líneas | Notas |
|---|---|---|
| Base, reset y `kbd` | 103-109 | `box-sizing`, `[hidden]`, `body` en flex |
| Cabecera (`.top`, marca, Pío, páginas) | 110-126 | `.top .mi-field` en 124 |
| Barra de herramientas (`.toolbar`, `.grp`, `.tb-btn`, `.sw`) | 127-142 | `body[data-mode]` oculta `.only-draw` / `.only-write` (142) |
| Cabecera y barra lateral (diseño «C»): `.hb`, `.mode-seg`, `.app-row`, `.toolbar.rail`, `.rgrp`, `.rb`, `.rb-pri`, `.rail-colors`, `.line-bar` | `css/chrome.css` | Se carga tras `layout.css` y sobrescribe `.top`/`.toolbar`. La barrita `.line-bar` la coloca `js/ui/line-bar.js` sobre la línea activa; las ventanas abiertas desde la barra lateral salen a su derecha (`ui/popovers`). |
| Ventana «Migraciones»: `.mg-body`, `.mg-grid`, `.mg-card`, `.mg-step`, `.mg-opts`, `.mg-report`, `.sr-only` | `css/migrations.css` | La crea `js/ui/migrations.js`; reutiliza `.mi-check` y `.mi-btn`. |
| Hoja y páginas (`.wrap`, `.sheet.paper`, `.page-end`, `.paper-sel`) | 143-151 | `#viewPop` y `#presBtn` en 150-151 |
| Modo presentación | 152-164 | `body.presenting`, `.pres-bar` |
| Hoja y lienzo de dibujo (`.sheet`, `#ink`, `#blocks`) | 165-170 | Dibujo: 166-168 |
| Bloques (`.blk`, `.blk-handle`, `.blk-body`, `math-field`, `.blk-text`) | 171-191 | Estados `is-active`, `is-boxed`, `is-result`, `drop-before/after` |
| Derivación (`.deriv`, `.dcell`, `.drow`, `.dnote`) | 192-211 | Rejilla de 6 columnas (193) |
| Derivación en móvil | 246-253 | Redefine la rejilla de `.deriv` a 640px |
| Botones de borrar y duplicar (`.x-del`, `.blk-exp`, `.blk-dup`, `.drow-dup`) | 212-228 | `.blk-dup` ajusta `font-size` (225) y debe ir después de `.x-del` |
| Números de línea | 229-236 | `counter-reset` y `::before`. Ocultos en `no-ln` y presentación |
| Botón «+ Nueva línea» | 237-243 | `.add-line`. Oculto en dibujo y presentación |
| Pío vacío | 254-255 | `.empty-pio` |
| Popovers y menús (`.pop`, `.grid-pick`, `.sym`, `.menu-list`) | 256-278 | `.pop-sym` (263-266) |
| Toasts (`#toast`) | 244-245, 279-282 | 244-245 pertenecen a toast, pero están dentro del bloque de derivación |
| Botón de mostrar cabecera (`.show-chrome`) | 283-286 | `body.chrome-off` |
| Diálogos base (`dialog`, `.pio-title`, `.ops-head`) | 287-290 | Incluye un primer `.hist-empty` (289) |
| Diálogo de confirmación con Pío (`dialog.ask`, `.ask-box`) | 291-304 | Variante `.aviso` |
| Diálogo «Acerca de» (`.about-*`, `.help-foot`) | 305-315 | |
| Historial (`.hist-*`) | 316-334 | Incluye un segundo `.hist-empty` (334) |
| Diálogo de ayuda (`dlg-head`, `dlg-body`, `.keys`) | 335-343 | `dialog::backdrop` en 335 |
| Elegir línea (`.pick-bar`, `body.picking`) | 344-365 | Animaciones de selección y `prefers-reduced-motion` |
| Operaciones (`.pop-ops`, `.ops-grid`) | 366-370 | |
| Tablas (`.mtable`, Ruffini, verdad, valores) | 371-384 | |
| Panel de gráficos (`.pop-graf`, `.graf-opt`, `.nn-*`) | 385-401 | |
| Gráfica 3D (`.g3d`) | 402-406 | |
| Estadística y árboles de probabilidad (`.chart`, `.ptree`, `.c-*`, `.pt-*`, `.bayes-grid`) | 407-436 | |
| Trigonometría y geometría (`.geo`, `.geo-*`) | 437-478 | |
| Diagramas de Venn (`.venn`) | 479-496 | |
| Redes neuronales (`.net`, `.net-*`) | 497-513 | |
| Grafos (`.graph`, `.mk-*`, `.g-*`) | 514-534 | |
| Impresión (`@media print`, `#print-root`) | 535-546 | |
| Responsive general | 547-552 | Debe ir la última: sobrescribe `.wrap`, `.sheet` y `.top .mi-field` |

---

## 4. Estilos en línea

`grep -c 'style="' pizarra.html` devuelve **15 líneas** con `style="`. Hay **16 atributos** en total, porque la línea 6287 tiene dos.

| Línea | Ejemplo | Propuesta |
|---|---|---|
| 604 | `style="width:130px"` en `.mi-field` | Clase `.pen-width` |
| 608-613 (6 líneas) | `style="--sw:var(--data-N)"` en cada `.sw` | Variables `--sw` sí son dinámicas. Se pueden mover a clases `.sw--ink`, `.sw--data-1`… o dejar un atributo `data-color` que lo resuelva CSS |
| 694 | `style="font:400 14px/21px … !important; color:… !important"` en `<p>` | Clase `.bayes-help`. Quitar `!important` |
| 697 | `style="display:flex;gap:8px;flex-wrap:wrap"` | Clase `.bayes-acts` |
| 732 | `style="display:flex;gap:6px"` en `.mi-row` | Clase `.mi-row` (ya referenciada en el HTML sin regla) |
| 737 | `style="margin:0;font:…;max-width:240px"` | Clase `.hint` |
| 927, 937, 952 | `style="font:400 13px/20px …;margin:var(--space-2) 0 0"` (repetido 3 veces) | Clase `.op-note` (o `.about-small`, ya existente) |
| 6287 | `style="color:var(--data-3)"` y `style="color:var(--data-2)"` en `<i>` dentro de la leyenda generada por JS | Clases `.k-mean`, `.k-data` como en `.mk-legend` |

Recomendación: convertir primero los 3 bloques repetidos (927, 937, 952) y el de 694 en clases. Los estilos en línea dentro de JS (6287) deberían usar clases existentes, por ejemplo `.mk-legend .k-*`. Los `--sw` de la línea 608-613 pueden seguir como variable en línea, pero moviendo la paleta a CSS se evita duplicar los valores.

---

## 5. Propuesta de división

Ficheros en `css/`, en el orden de carga indicado. Los rangos son líneas de `pizarra.html`, inclusive, y cubren 23-552 sin huecos ni solapes. Los estilos en línea no están incluidos.

Orden de carga = orden de lectura. Cargar en este orden es obligatorio (ver avisos).

| # | Fichero | Líneas | Contenido |
|---|---|---|---|
| 1 | `css/tokens.css` | 23-61 | Tokens, tema claro y oscuro, media `prefers-color-scheme` |
| 2 | `css/components/matia.css` | 62-101 | Componentes `mi-*`, animaciones, `reduced-motion` global |
| 3 | `css/base.css` | 102-109 | Reset, `[hidden]`, `body`, `kbd` |
| 4 | `css/layout/header.css` | 110-126 | Cabecera `.top`, marca, Pío, páginas |
| 5 | `css/layout/toolbar.css` | 127-142 | `.toolbar`, `.grp`, `.tb-btn`, `.sw` |
| 6 | `css/layout/paper.css` | 143-151 | `.wrap`, `.sheet.paper`, `.page-end`, `.paper-sel` |
| 7 | `css/layout/presentation.css` | 152-164 | Modo presentación y `.pres-bar` |
| 8 | `css/layout/sheet.css` | 165-170 | `.sheet`, `#ink`, `#blocks` |
| 9 | `css/blocks/block.css` | 171-191 | `.blk`, asa, cuerpo, `math-field`, `.blk-text` |
| 10 | `css/blocks/deriv.css` | 192-211 | Derivación `.deriv` y sus celdas |
| 11 | `css/blocks/line-actions.css` | 212-236 | Borrar, duplicar, números de línea |
| 12 | `css/blocks/add-line.css` | 237-243 | Botón «+ Nueva línea», `hover: none` |
| 13 | `css/blocks/deriv-mobile.css` | 244-253 | Toast 244-245 (ver aviso) y derivación en móvil |
| 14 | `css/blocks/empty.css` | 254-255 | `.empty-pio` |
| 15 | `css/components/popovers.css` | 256-278 | `.pop`, `.grid-pick`, símbolos, `.menu-list` |
| 16 | `css/components/toast.css` | 279-282 | `#toast` |
| 17 | `css/layout/chrome.css` | 283-286 | `.show-chrome`, `chrome-off` |
| 18 | `css/dialogs/base.css` | 287-290 | `dialog`, `.pio-title`, `.ops-head`, primer `.hist-empty` |
| 19 | `css/dialogs/ask.css` | 291-304 | Diálogo de confirmación con Pío |
| 20 | `css/dialogs/about.css` | 305-315 | Diálogo «Acerca de» y `.help-foot` |
| 21 | `css/dialogs/history.css` | 316-334 | `.hist-*` y segundo `.hist-empty` |
| 22 | `css/dialogs/keys.css` | 335-343 | `::backdrop`, `.dlg-head`, `.dlg-body`, `.keys` |
| 23 | `css/blocks/pick.css` | 344-365 | Elegir línea (`.pick-bar`, `body.picking`) |
| 24 | `css/components/ops.css` | 366-370 | Operaciones |
| 25 | `css/components/tables.css` | 371-384 | `.mtable` |
| 26 | `css/graphs/panel.css` | 385-401 | Panel de gráficos y `.nn-*` |
| 27 | `css/graphs/g3d.css` | 402-406 | Gráfica 3D |
| 28 | `css/graphs/chart-ptree.css` | 407-436 | Estadística, árboles de probabilidad, `.bayes-grid` |
| 29 | `css/graphs/geo.css` | 437-478 | Trigonometría y geometría |
| 30 | `css/graphs/venn.css` | 479-496 | Diagramas de Venn |
| 31 | `css/graphs/net.css` | 497-513 | Redes neuronales |
| 32 | `css/graphs/graph.css` | 514-534 | Grafos |
| 33 | `css/print.css` | 535-546 | `#print-root` y `@media print` |
| 34 | `css/responsive.css` | 547-552 | Responsive general, debe ir la última |

Cobertura: 23-61, 62-101, 102-109, 110-126, 127-142, 143-151, 152-164, 165-170, 171-191, 192-211, 212-236, 237-243, 244-253, 254-255, 256-278, 279-282, 283-286, 287-290, 291-304, 305-315, 316-334, 335-343, 344-365, 366-370, 371-384, 385-401, 402-406, 407-436, 437-478, 479-496, 497-513, 514-534, 535-546, 547-552. Son 552-23+1 = 530 líneas, sin huecos ni solapes.

### Avisos de cascada

1. **Orden obligatorio.** Cargar los ficheros en el orden de la tabla. Si cambia el orden, se rompe la cascada en estos casos:
   - `.blk-dup` (225) sobrescribe la `font-size` de `.x-del` (213). Ambos tienen la misma especificidad. Por eso 212-236 van juntos.
   - `.deriv .dl` (252) y `.deriv .dl` en 246-253 sobrescriben `.dl` (197). `deriv-mobile.css` debe ir después de `deriv.css`.
   - `.top .mi-field` (124) y el `.mi-field` de 550 solo funcionan en ese orden. `responsive.css` debe ir al final.
   - `.menu-list .mi-btn` (275) y `.ops-grid .mi-btn` (370) sobrescriben `.mi-btn`. Deben ir después de `matia.css`.
   - `.sheet` (165) y el `.sheet` de 547 se sobrescriben entre sí. `responsive.css` debe ir al final.
   - `@media print` (536) sobrescribe `body`, `.print-page` y `.blk`. Debe ir después de `base.css` y `block.css`.
2. **`.hist-empty` aparece dos veces** (289 y 334). Ambas reglas se combinan. Si se cambia el orden, el resultado cambia. Lo recomendable es fusionarlas en una sola regla (ver siguiente paso).
3. **Toast dentro del bloque de derivación.** Las líneas 244-245 (`#toast .mi-callout`) están dentro de `deriv-mobile.css` para no alterar el orden. Mover esas dos líneas a `toast.css` es seguro, porque no tienen conflicto con las reglas de bloques.

## 6. Hojas añadidas después de la modularización

Se cargan en `pizarra.html` en este orden (ver la tabla de la §5 para las demás):

| Fichero | Contenido |
| --- | --- |
| `css/fit.css` | Fórmulas que no caben: aviso «No cabe en la hoja» y botón «Partir». Va después de `blocks.css`. |
| `css/text.css` | Texto enriquecido: barra flotante de formato y clases `tf-*`. |
| `css/image.css` | Bloque imagen: figura, pie de foto y ancho. |

Clases `tf-*` (las pone la barra de formato y se validan al cargar, ver `FORMATO-JSON.md` §4.2): color `tf-c0`…`tf-c6`, resaltado `tf-hl0`…`tf-hl3`, tamaño `tf-sz-n|lg|sub|title`, tipo de letra `tf-f-def|sans|serif|mono|hand`, alineación `tf-al-left|center|right|justify` y sangría `tf-indent-1`…`tf-indent-6`. La letra manuscrita es Caveat (`vendor/fonts/fonts.css`, SIL OFL 1.1).
4. **`!important` en 400, 694 y 364.** No cambian el orden, pero conviene revisarlos al convertir los estilos en línea.
