# Formato JSON del tablero

Documento deducido del código de `pizarra.html` (rama `dev`, 8103 líneas), no solo del README. La fuente de verdad es `sanitize()` (`pizarra.html:4590-4668`): todo lo que entra (localStorage, «Abrir», historial) pasa por ella, así que **lo que no figura en `sanitize` se pierde al cargar**.

## 1. Dónde se escribe y se lee

| Qué | Dónde | Notas |
| --- | --- | --- |
| Clave localStorage `matia-pizarra-v1` | `pizarra.html:4546` (KEY), `load()` 4578, `save()` 4674 | `save()` espera 350 ms (debounce) y guarda `JSON.stringify(board)` tal cual. |
| Guardar como archivo (`#saveFile`) | `pizarra.html:7697` | Escribe `board` **sin** `app`, `formato`, `guardado`. |
| Historial / guardado rápido | `boardJSON()` `pizarra.html:7442-7444` | Añade `{app:'MatIA Pizarra', formato:1, guardado: ISO}` delante de `board`. |
| Abrir archivo | `#fileIn` `pizarra.html:7710-7727` | `sanitize(JSON.parse(...))`; devuelve `null` (archivo no válido) si no hay `pages` o está vacío. |
| Abrir desde historial | `pizarra.html:7532` | Mismo `sanitize`. |

`app`, `formato` y `guardado` son metadatos solo de escritura: `sanitize` los ignora. Los archivos antiguos sin ellos se abren igual. No hay migración por versión: `formato` nunca se lee.

## 2. Objeto raíz (`board`)

`defaults()` está en `pizarra.html:4576`. `sanitize` parte de `defaults()` y lo sobrescribe (4593-4604).

| Campo | Tipo | Defecto | Validación en `sanitize` |
| --- | --- | --- | --- |
| `app` | string | — | Solo escritura (historial). Ignorado al leer. |
| `formato` | number (=1) | — | Solo escritura (historial). Ignorado al leer. |
| `guardado` | string ISO | — | Solo escritura (historial). Ignorado al leer. |
| `v` | number | `1` | No se valida, viene de `defaults()`; se conserva siempre como 1. Distinto de `formato`. |
| `title` | string | `''` | Solo si es string; se corta a 120 caracteres. |
| `paper` | `'free'`\|`'a4p'`\|`'a4l'`\|`'a3l'`\|`'slide'` | `'free'` | Fuera de la lista pasa a `'free'`. Tamaños en `PAPERS` (`pizarra.html:4709`): a4p 794×1123, a4l 1123×794, a3l 1587×1123, slide 1280×720; `free` = sin papel. |
| `pages` | array de página | `[newPage()]` | **Obligatorio**, array no vacío; si no, `sanitize` devuelve `null`. |
| `cur` | entero | `0` | Se acota a `[0, pages.length-1]`. |
| `theme` | `'dark'`\|`'light'`\|`null` | `null` (sigue al sistema) | Otro valor pasa a `null`. |
| `accent` | `'math'`\|`''` | `''` | |
| `scale` | número 80–260 | `140` | Acotado; no numérico = 140. |
| `color` | `'ink'`\|`'data-1'`..`'data-6'` | `'ink'` | Regex `^(ink\|data-[1-6])$`. Color de trazo/fórmula actual. |
| `tool` | `'pen'`\|`'hl'`\|`'arrow'`\|`'shape'`\|`'eraser'` | `'pen'` | |
| `shape` | `'line'`\|`'rect'`\|`'ellipse'`\|`'tri'`\|`'rtri'`\|`'diamond'`\|`'para'`\|`'hex'` | `'rect'` | Figura elegida para la herramienta «Figuras». |
| `dash` | `'solid'`\|`'dash'`\|`'dot'` | `'solid'` | Tipo de línea de figuras y flechas. |
| `fill` | `'none'`\|`'soft'`\|`'solid'` | `'none'` | Relleno de las figuras. |
| `width` | número 1–12 | `3` | Grosor del lápiz. |
| `histAuto` | boolean | `false` | `!!b.histAuto`. Guardado automático en historial. |
| `lineNums` | boolean | `true` | `b.lineNums !== false`. |

Los campos de ajustes (`theme`…`lineNums`) son preferencias de vista guardadas junto al contenido; no pertenecen a ningún bloque.

## 3. Página

`newPage()` (`pizarra.html:4575`): `{ blocks: [newBlock()], strokes: [], minH: 0 }`.

| Campo | Tipo | Defecto | Validación |
| --- | --- | --- | --- |
| `blocks` | array de bloque | `[newBlock()]` (una línea `math` vacía) | Si falta o está vacío se crea una línea vacía. |
| `strokes` | array de trazo | `[]` | Solo se filtra que cada elemento sea objeto con `pts` array y, si es una figura (`tool:'shape'`), que `shape` sea una de las conocidas. **No se validan** `color`, `w` ni los puntos. |
| `minH` | número | `0` | `+p.minH \|\| 0`. Altura mínima de la hoja en px (crece cuando se dibuja cerca del borde inferior, `pizarra.html:7987`). |

## 4. Campos comunes de todo bloque

`sanitize` construye `base` (4605):

| Campo | Tipo | Defecto | Notas |
| --- | --- | --- | --- |
| `id` | string | **regenerado siempre** con `uid()` | Se escribe en el JSON (`b<tiempo36><contador36>`, `pizarra.html:4571`) pero se descarta al cargar: no es estable entre sesiones. |
| `type` | string | — | Ver tipos. Un tipo desconocido cae en `math` (4662). |
| `align` | `'left'`\|`'center'`\|`'right'` | `'left'` | |
| `boxed` | boolean | `false` | Recuadro. En `deriv` el recuadro por bloque se ignora al pintar (`el.classList.remove('is-boxed')`, 4837); se usa `rows[].boxed`. |

Orden de despacho en `sanitize`: `deriv`, `table`, `graph3d`, `chart`, `ptree`, `geo`, `venn`, `net`, `graph`, y por último `text`/`math`.

### 4.1 `math` (línea de fórmula)

`newBlock()` (4572): `{ id, type:'math', v:'', align:'left', boxed:false }`.

| Campo | Tipo | Defecto | Notas |
| --- | --- | --- | --- |
| `v` | string LaTeX | `''` | Valor del `math-field` (`getValue('latex')`). |
| `result` | boolean | `false` | `true` si la línea la creó una operación (`specToBlock`, 7083): se pinta con clase `is-result`. Se pone a `false` en cuanto el usuario edita (4856). |
| `note` | string | — | Explicación de la línea, a la derecha de la fórmula (botón 💬, `blocks/editor.js` `makeNote`). Se elimina al vacía el campo. Al convertir la línea en desarrollo (`deriv.js`) pasa a `rows[0].note`. |

### 4.2 `text` (línea de texto)

Igual que `math` con `type:'text'`. `v` es texto plano (se lee con `innerText`, sin saltos finales) y es lo que usan la búsqueda y el respaldo. `result` se conserva si existe (la rama final es común, 4662) pero no se usa en la práctica.

`html` (opcional, `js/blocks/text.js`) guarda el texto con formato, saneado con una lista blanca: solo las etiquetas `b i u s br p div ul ol li span`, las clases `tf-*` (`tf-c0`…`tf-c6` color, `tf-hl0`…`tf-hl3` resaltado, `tf-sz-n|lg|sub|title` tamaño, `tf-f-def|sans|serif|mono|hand` tipo de letra, `tf-al-left|center|right|justify` alineación, `tf-indent-1`…`tf-indent-6` sangría) y `span.math-inline` con `data-latex` (fórmula dentro del texto). Cualquier otra etiqueta, atributo o clase se descarta al cargar. Si `html` falta o queda vacío, se muestra `v`.

### 4.3 `deriv` (desarrollo alineado por el «=»)

`newDeriv()` (4574): `{ id, type:'deriv', rows:[newRow()], align:'left', boxed:false }`; `newRow()` (4573): `{ l:'', r:'', note:'', boxed:false }`. Validación en 4608-4613.

| Campo | Tipo | Defecto |
| --- | --- | --- |
| `rows` | array de fila, mín. 1 | `[newRow()]` si queda vacío |
| `rows[].l` | string LaTeX (lado izquierdo) | `''` |
| `rows[].r` | string LaTeX (lado derecho) | `''` |
| `rows[].note` | string texto (explicación) | `''` |
| `rows[].boxed` | boolean | `false` |

Un bloque `deriv` no tiene `v` ni `result` (se borran al convertir: 5033). Ejemplo real de motor: `{"type":"deriv","rows":[{"l":"2x+1","r":"5","note":"Ecuación","boxed":false}, ...]}` (`tests/golden/expected.json`, `engine.solveEquation`).

### 4.4 `table`

Validación 4614-4619. Todas las celdas se convierten a string.

| Campo | Tipo | Defecto | Significado |
| --- | --- | --- | --- |
| `rows` | `string[][]` | `[]` | Cuerpo; filas de longitud distinta se rellenan con vacío (ncols = máximo). |
| `head` | `string[]`\|`null` | `null` | Cabecera (`<thead>`). |
| `vbar` | entero\|`null` | `null` | Barra vertical tras la columna `vbar` (clase `vbar` en la celda `j === vbar-1`, 5754). |
| `hline` | entero\|`null` | `null` | Raya horizontal bajo la fila de índice `hline` del cuerpo (clase `hline` en esa `tr`). |
| `hlines` | `entero[]`\|`null` | `null` | Varias rayas (se unen con `hline`). |
| `mark` | `[fila, col]`\|`null` | `null` | Celda destacada (clase `mark`). Se guarda `slice(0,2).map(Number)`. |
| `caption` | string | `''` | Pie de tabla y `aria-label`. |
| `kind` | string | `''` | Estilo/semántica: `ruffini`, `values`, `truth`, `freq`, `mono`, `trig` (los que produce el motor, ver golden). Solo `ruffini` y `truth` tienen lógica propia en JS (5757-5765). El resto es solo clase CSS `mtable <kind>`. |
| `lastBold` | boolean | `false` | Última columna en negrita (cabecera y cuerpo). |

Ejemplo real: `{"type":"table","caption":"Ruffini: (x^3-1) : (x − 1)","rows":[["","1","0","0","-1"],["1","","1","1","1"],["","1","1","1","0"]],"vbar":1,"hline":2,"mark":[2,4],"kind":"ruffini"}`.

### 4.5 `graph` (gráfica 2D)

Validación 4658-4661.

| Campo | Tipo | Defecto | Notas |
| --- | --- | --- | --- |
| `fns` | `string[]` (máx. 6) | `[]` | Funciones en LaTeX o `f(x)=...`; se compilan con `OPS.compileFn`. |
| `xmin` | número | `-5` | Se fuerza `xmin ≤ xmax − 0.001`. |
| `xmax` | número | `5` | |
| `ymin` | número\|ausente | automático | Opcional. Rango vertical fijo; solo se usa si `ymin < ymax`. Ausente = automático. |
| `ymax` | número\|ausente | automático | Opcional. Igual que `ymin`. |
| `marks` | `mark[]` (máx. 40) | `[]` | `cleanMarks(x.marks,false)`. |

`mark` 2D: `{ x:number, y:number, kind, label }`; `kind` ∈ `min, max, absmin, absmax, infl, saddle, deg` (`MARK_KINDS`, 4585); `label` string máx. 40. Marcas con `x`/`y` no finitas o `kind` ajeno se descartan. El rango Y **solo se guarda si lo fija el usuario** (`ymin`/`ymax`); si no, se calcula al dibujar.

### 4.6 `graph3d`

Validación 4620-4623.

| Campo | Tipo | Defecto |
| --- | --- | --- |
| `fns` | string[] (1-4) | `[fn]` — superficies del dibujo, en LaTeX o texto plano (`z=sin(x)*cos(y)`). |
| `fn` | string | `'z=x^2-y^2'` — la primera superficie no vacía; se mantiene por compatibilidad (los archivos antiguos solo traen `fn`). |
| `xmin`, `xmax`, `ymin`, `ymax` | número | `-3, 3, -3, 3` |
| `az` | número (rad, azimut) | `-0.8` |
| `el` | número (rad, elevación) | `0.55` |
| `zoom` | número | `1` |
| `marks` | `mark3[]` (máx. 40) | `[]` |

`mark3` = `mark` más `z:number` obligatorio (`cleanMarks(…, true)`). Nota: aquí `sanitize` **no** corrige `xmax<xmin`; lo hace la interfaz al editar (5990-5992).

### 4.7 `chart` (gráficos de estadística)

Validación 4624-4630. `kind` ∈ `bars`\|`box`\|`normal` (defecto `bars`). Los campos no usados por el `kind` se guardan igual (con vacío/null). Listas numéricas: `Number()` y se descartan no finitos, máx. 400.

| Campo | Tipo | Defecto | Usado por |
| --- | --- | --- | --- |
| `kind` | string | `'bars'` | todos |
| `title` | string (máx. 160) | `''` | todos (`<p class="c-title">`) |
| `labels` | `string[]` (máx. 400) | `[]` | bars (etiquetas del eje X) |
| `values` | `number[]` | `[]` | bars (alturas) |
| `valueLabels` | `string[]`\|`null` | `null` | bars (texto sobre la barra en lugar del número) |
| `hi` | `number[]` | `[]` | bars (**índices** de barras resaltadas) |
| `ylabel` | string | `''` | bars (rótulo del eje Y) |
| `data` | `number[]` | `[]` | box (puntos de datos) |
| `min`, `max`, `q1`, `med`, `q3` | número\|`null` | `null` | box (cinco números) |
| `mean` | número\|`null` | `null` | box (rombo de la media, opcional) |
| `mu`, `sigma` | número\|`null` | `null` | normal (`sigma` nulo o 0 se usa como 1 al dibujar) |
| `a`, `b` | número\|`null` | `null` | normal (límites del área sombreada; `null` = sin límite por ese lado) |

Ojo: `box` exige `min,max,q1,med,q3` numéricos y `normal` exige `mu`; si son `null` el dibujo no valida (hay NaN/errores, ver acoplamientos en `graficos.md`).

### 4.8 `ptree` (árbol de probabilidad)

Validación 4631-4634. Todos los textos se cortan a 24 caracteres.

| Campo | Tipo | Defecto |
| --- | --- | --- |
| `ev` | string (suceso, p. ej. `B`) | `'B'` |
| `causes` | array (máx. 6) | `[]` |
| `causes[].name` | string | `''` |
| `causes[].p` | string, P(causa) | `''` |
| `causes[].l` | string, P(suceso\|causa) | `''` |
| `causes[].nl` | string, P(no suceso\|causa) | `''` |
| `causes[].prod` | string, producto P(causa∩suceso) | `''` |
| `causes[].nprod` | string, producto con el contrario | `''` |

Las probabilidades son **texto ya formateado** (p. ej. `"0,3"`), no números.

### 4.9 `geo` (trigonometría y geometría)

Validación 4635-4645. `kind` ∈ `unit`\|`unitAll`\|`tri`\|`lines`\|`transv` (defecto `unit`). Campos comunes: `deg` (número, defecto `30`), `label` (string máx. 60, defecto `''`).

| `kind` | Campos extra | Defectos |
| --- | --- | --- |
| `unit` | `deg`, `label` | `deg` 30. `label` sustituye al texto de θ. |
| `unitAll` | ninguno | Ángulos notables fijos. |
| `tri` | `a,b,c` (lados), `A,B,C` (ángulos en grados) | todos `1` si faltan. |
| `lines` | `lines[]` (máx. 6): `{a,b,c,name,dash}` recta ax+by+c=0 (`a`=0, `b`=1, `c`=0 por defecto; `name` máx. 8, defecto `'r'`; `dash` bool). Se descartan rectas con `a=b=0`. `points[]` (máx. 12): `{x,y,name,kind}` (`name` máx. 8, defecto `'P'`; `kind` ∈ `cut`\|`mid`\|`''`). | |
| `transv` | `deg` (ángulo α, se acota 10–170 al dibujar) | 30 si falta (60 al dibujar si es 0). |

### 4.10 `venn`

Validación 4646-4648.

| Campo | Tipo | Defecto | Notas |
| --- | --- | --- | --- |
| `n` | `2`\|`3` | `2` | Número de conjuntos. |
| `expr` | string (máx. 200) | `''` | Expresión de conjuntos (LaTeX o símbolos). Si no vacía, manda sobre `shade`. |
| `shade` | `entero[]` | `[]` | Zonas sombreadas a mano como máscaras de bits: A=1, B=2, C=4 (mask 0 = fuera de todos; 3 = A∩B; 7 = A∩B∩C). Solo enteros 0–7. |
| `showEls` | boolean | `true` | `x.showEls !== false`. Muestra los elementos de los conjuntos definidos en otras líneas de la página. |

### 4.11 `net` (grafo)

Validación 4649-4657.

| Campo | Tipo | Defecto | Notas |
| --- | --- | --- | --- |
| `nodes` | array (máx. 120) | `[]` | Se descartan nodos con `x`/`y` no finitos. |
| `nodes[].id` | string | `uid()` | **Se conserva** (las aristas la referencian). |
| `nodes[].x`, `.y` | número | — | Coordenadas en el viewBox de 720 × `h`. |
| `nodes[].label` | string (máx. 24) | `''` | |
| `nodes[].kind` | `'in'`\|`'hid'`\|`'out'`\|`'bias'`\|`''` | `''` | Capa (clase `k-<kind>`). |
| `edges` | array (máx. 600) | `[]` | Se descartan aristas cuyos `a`/`b` no sean ids de `nodes`. |
| `edges[].a`, `.b` | string (id de nodo) | — | Origen y destino. |
| `edges[].w` | string (máx. 16)\|`null` | `null` | Peso/rótulo opcional. |
| `caps` | array | `[]` | Rótulos de capa al pie: `{x:number, text:string(≤40)}`. |
| `directed` | boolean | `false` | Flechas. |
| `h` | número 260–1200 | `420` | Alto del viewBox. |

### 4.12 `solid` (sólido de revolución)

Saneado en `js/blocks/solid.js` (`model/schema.register('solid', …)`). Si `a ≥ b`, se usa `a = 0`, `b = 4`.

| Campo | Tipo | Defecto | Significado |
| --- | --- | --- | --- |
| `fn` | string | `'f(x)=\\sqrt{x}'` | Perfil y = f(x), en LaTeX o texto plano (pasa por `normalizeFn`). |
| `a`, `b` | número | `0`, `4` | Intervalo de integración. |
| `axis` | `'x'`\|`'y'`\|`'y=k'`\|`'x=k'` | `'x'` | Eje o recta de giro. `k` solo se usa con `y=k` y `x=k`. |
| `k` | número | `0` | Posición de la recta de giro (`y = k` o `x = k`). |
| `az`, `el` | número (rad) | `-0.8`, `0.5` | Vista 3D (azimut y elevación). |
| `zoom` | número | `1` | Zoom de la vista 3D. |

Ejemplo: `{ "type": "solid", "fn": "f(x)=x^2", "a": 0, "b": 2, "axis": "x", "az": -0.8, "el": 0.5, "zoom": 1 }`.

El volumen no se guarda: se recalcula al dibujar (discos o arandelas si el giro es horizontal, capas cilíndricas si es vertical).

### 4.14 `image` (imagen)

Figura con pie de foto (`js/blocks/image.js`). El archivo no va en el JSON: vive en la carpeta de clases, en `imagenes/<huella>.<ext>` (`js/storage/assets.js`).

| Campo | Tipo | Defecto | Notas |
| --- | --- | --- | --- |
| `src` | string | `''` | Ruta relativa dentro de la carpeta de clases que empieza por `imagenes/`. Sin `..`, sin barras invertidas ni caracteres de control; si no cumple, la imagen queda vacía. |
| `w` | number | `60` | Ancho en % de la hoja, entre 10 y 100. |
| `align` | `'left'`\|`'center'`\|`'right'` | `'left'` | Alineación de la figura (campo común, §4). |
| `caption` | string | `''` | Pie de foto, máx. 200 caracteres. |
| `alt` | string | `''` | Texto alternativo, máx. 200 caracteres. |

El bloque no es exportable como imagen de gráfico (`exportable: false`).

### 4.13 Tipos que `sanitize` NO trata como bloque propio

Cualquier otro `type` se carga como `math` con `v` (si es string) y `result`. Los campos extra de un bloque se **descartan** (`Object.assign(base, {...})` solo copia lo listado).

## 5. Trazos (`pages[].strokes[]`)

Se crean en `endStroke` (`pizarra.html:7990-8002`) con `cur = { tool, color: board.color, w: board.width, pts:[p], erased:[], pid }` (7969) y luego se borran `erased` y `pid`.

| Campo | Tipo | Notas |
| --- | --- | --- |
| `tool` | `'pen'`\|`'hl'`\|`'arrow'`\|`'shape'` | `'eraser'` no se guarda (solo elimina trazos). `hl` = resaltador (alfa 0,32, ancho ×5); `arrow` y `shape` usan solo el primer y el último punto. |
| `shape` | ver `board.shape` | Solo figuras. Entre el punto inicial `a` y el final `b`: `tri` tiene el vértice en el lado de `a`; `rtri` el ángulo recto en `(a.x, b.y)`; `ellipse` inscrita en el recuadro. |
| `dash` | `'solid'`\|`'dash'`\|`'dot'` | Figuras (siempre) y flechas (solo si no es continua). |
| `fill` | `'none'`\|`'soft'`\|`'solid'` | Solo figuras: `soft` = color con alfa 0,2. |
| `color` | string | Nombre de tema `'ink'`, `'data-1'`…`'data-6'` (se resuelve con `cssVar` según tema). Si no se resuelve, cae a `ink` (`drawStroke`, 7878). El golden usa `"#000"` y también funciona (cae a tinta). |
| `w` | número | Grosor base en px (1–12). |
| `pts` | `[x, y, presión][]` | Coordenadas en píxeles de la hoja **sin zoom** (`sheetPoint`, 7931: `/zoomF`), redondeadas a 0,1; `presión` 0,35–1,65 con lápiz, `1` con ratón/dedo. El código de dibujo accede a `p[2]` (presión) sin comprobar: con puntos de 2 elementos (como el del golden) el grosor del `pen` sale `NaN` y el navegador lo ignora (se pinta con el grosor anterior). |

## 6. Ejemplo mínimo completo

```json
{
  "app": "MatIA Pizarra", "formato": 1, "guardado": "2026-11-07T09:48:00.000Z",
  "title": "Ecuaciones", "paper": "slide",
  "pages": [{
    "blocks": [
      { "type": "math", "v": "x+1=5", "align": "left" },
      { "type": "deriv", "rows": [{ "l": "x+1", "r": "5", "note": "Planteamiento" }] },
      { "type": "graph", "fns": ["f(x)=x^2"], "xmin": -5, "xmax": 5 }
    ],
    "strokes": []
  }],
  "cur": 0
}
```

## 7. Notas para la modularización

- Un **esquema por tipo** debería vivir junto al tipo (cada fichero de bloque exporta `sanitize(raw, helpers)` y `create(spec)`), dejando en `board.js` solo la parte raíz/página/trazos. Hoy `sanitize` es un `if` encadenado de 70 líneas (4607-4662) que importa `newRow`, `newBlock`, `uid`, `cleanMarks` y `MARK_KINDS`.
- Los motores (`OPS`/`ME`) producen **specs** (`{type:'table'|'graph'|…}`) sin `id`/`align`/`boxed`; `specToBlock` (7082-7086) les añade `id`, `align:'left'`, `boxed:false` mediante `Object.assign` **sin pasar por `sanitize`**. Un spec con campos incompletos llega tal cual a los `build*`. Conviene que `registry.create(spec)` aplique la validación de su tipo.
- `id` de bloque se regenera en cada carga; `id` de nodo de `net` se conserva. `boardJSON`/`saveFile` guardan además `id` de bloque (inútil al cargar).
- `saveFile` (7697) y `boardJSON` (7443) divergen: el primero no lleva `app/formato/guardado`.

## Propuesta de módulos

Para el formato:

| Fichero propuesto | Líneas origen | Qué necesita del exterior |
| --- | --- | --- |
| `js/model/board.js` (raíz, páginas, trazos, `defaults`, `load`, `save`) | 4546, 4569-4576, 4578-4584, 4590-4604, 4663-4683 | `localStorage`, `window.__histAutoHook`, `window.__updSaved` (acoplamiento global, `pizarra.html:4678-4679`); `registry.sanitize(type, raw)`. |
| `js/blocks/registry.js` | (nuevo; sustituye 4607-4662) | Ninguna. Guarda `Map<type, def>` y expone `sanitize(raw)`, `create(spec)`, `types()`. |
| `js/blocks/<tipo>.js` (math, text, deriv, table, graph, graph3d, chart, ptree, geo, venn, net) | `sanitize` de cada tipo: 4608-4613 (deriv), 4614-4619 (table), 4620-4623 (graph3d), 4624-4630 (chart), 4631-4634 (ptree), 4635-4645 (geo), 4646-4648 (venn), 4649-4657 (net), 4658-4661 (graph), 4662 (math/text) | `uid` (net, bloque base), `newRow` (deriv), `cleanMarks` y `MARK_KINDS` (graph, graph3d) — mover `cleanMarks` a `js/blocks/marks.js` compartido entre `graph` y `graph3d`. |

El detalle de contexto por bloque (render, estado, `toast`, `OPS`/`ME`…) está en `docs/funcionalidades/bloques.md` y `docs/funcionalidades/graficos.md`.
