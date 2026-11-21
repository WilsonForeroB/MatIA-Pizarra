# Bloques: ciclo de vida, render, edición y desarrollo (`deriv`)

Todo el código vive dentro de una única IIFE `(() => { 'use strict'; ... })()` (`pizarra.html:4542-8101`). Los bloques comparten ese ámbito: no hay módulos ni inyección, todo son variables y funciones locales de la IIFE. Formato de datos: ver `docs/FORMATO-JSON.md`.

## 1. Modelo y estado

- Estado global: `let board = load() || defaults()` (`pizarra.html:4670`); página actual `page()` = `board.pages[board.cur]` (4671). Un bloque es un objeto plano dentro de `page().blocks`.
- Constructores: `uid()` (4571), `newBlock(type='math', v='', extra={})` (4572), `newRow` (4573), `newDeriv` (4574), `newPage` (4575).
- El DOM de un bloque se localiza por `data-id`: `elById(id)` (4754), `blockById(id)` (4753); el campo editable con `fieldOf(el)` (4755: `math-field` o `.blk-text`).
- Estado de edición (variables de la IIFE): `activeId` (4751, bloque activo), `mlReady` (4752, MathLive cargado), `activeCell = {id,row,col}` (4874, celda activa dentro de un `deriv`), `dragId` (5326), `undoStack` (7851, solo para trazos; los bloques usan el aviso «Deshacer» de `toast`).
- Persistencia: `save()` (4674) debounced 350 ms; cada edición llama a `save()`.
- Avisos: `toast(text, kind='nota'|'aviso', action={label,fn})` (4685).
- Pío (aviso de página vacía): `maybePio()` 5156, `hidePio()` 5165 (se llama al teclear).

## 2. Creación

| Vía | Dónde |
| --- | --- |
| Intro dentro de una línea (`math`/`text`) → `addBlockAfter(id, newBlock('math','',{align}))` | `pizarra.html:5294-5302` |
| Botones «+ Nueva línea» y fin de página: `newLine(atEnd)` | 5658-5666, listeners 5667-5668 |
| Botón Texto (`#textBtn`, Alt+T): `addBlockAfter(..., newBlock('text'))` | 5633 |
| Desarrollo (Alt+L, `#derivBtn`): `startDeriv()` | 5025-5051 |
| Operaciones/gráficos: `insertSpecs(afterId, specs, ref)` → `specToBlock` → `addBlockAfter` | 7082-7092 |
| Duplicar: `duplicateBlock`, `duplicateRow`, `duplicateActive` (Ctrl+D) | 5635-5657 |
| Página nueva / vaciar página: `newPage()` | 7399 (`#pgAdd`), `#clearPage` 7730 |

`addBlockAfter(id, b, focus=true)` (5205-5217): inserta en el modelo (`splice`), construye el DOM con `makeBlockEl(b)` y lo coloca tras el elemento de `id` (o al final si `id` es null), llama a `hidePio()`, `save()`, enfoca y pide `sizeCanvas` en el siguiente frame (la capa de tinta debe crecer con el contenido).

`specToBlock(spec, ref)` (7082): `math` → `newBlock` con `result:true` y `align` del bloque de referencia; `deriv` → `newDeriv` normalizando filas; cualquier otro tipo → `Object.assign({id, align:'left', boxed:false}, clon(spec))` (sin `sanitize`).

`startDeriv` (5025): si el bloque activo ya es `deriv`, añade una fila; si es `math` vacío o con un `=` de nivel superior (`splitTopEq`, 5009), **convierte el bloque en sitio** (`b.type='deriv'`, `rows=[...]`, borra `v`/`result`, `old.replaceWith(makeBlockEl(b))`); en otro caso crea un `deriv` nuevo detrás.

## 3. Render: cómo se despacha por tipo

**No hay registro ni tabla: hay un `if / else if` en cada sitio donde se pinta o se trata un bloque.** Los sitios que ramifican por `type` son:

| Sitio | Líneas | Qué hace por tipo |
| --- | --- | --- |
| `makeBlockEl(b)` — **render principal** | 4770-4872 (cadena `if` en 4819-4863) | Construye el contenedor común y llama a `buildTable/Graph/Graph3d/Net/Venn/Chart/PTree/Geo/Deriv` o crea `text`/`math-field`. |
| `printAll()` — **segundo despacho** (versión solo lectura para imprimir) | 7772-7840 (cadena en 7792-7822) | Mismas funciones `build*` con `ro=true` donde existe el parámetro; `math` como `math-field` `read-only`; resto como texto. |
| `sanitize()` | 4607-4662 | Esquema por tipo. |
| Etiqueta del botón borrar (`xl`) | 4792 | `deriv`→«Borrar todo el desarrollo»; `table`→«la tabla»; `graph`/`graph3d`→«la gráfica»; `net`→«el grafo»; `venn`/`chart`/`ptree`/`geo`→«el diagrama». |
| Texto del aviso al borrar | 5226 (en `deleteBlock`) | Misma clasificación. |
| Botón «Exportar como imagen» | `EXPORTABLE` 6068, uso 4797 | Solo `graph, graph3d, net, venn, chart, ptree, geo`. |
| Selector de teclado a ignorar | 5285 | `.net,.g3d,.graph,.venn,.chart,.ptree,.geo` (clases CSS de los contenedores). |
| `deriv` especial en teclado/selección | 5284+ (`derivKey`), 5267 (`activeField`), 5167-5176 (`setActive`), 5178-5180 (`focusBlock`), 7112-7210 (elegir línea) | Ver §8. |
| Líneas vacías / `boardEmpty` / `isPageEmpty` | 5152, 7668 | Cada tipo decide «vacío»: `math/text` por `v`, `deriv` por filas, el resto nunca es vacío. |

Firma de los `build*`: `buildX(b, bd, ro)` o `buildX(b, bd)` donde `bd` es el `div.blk-body` donde se inserta el contenido y `ro` indica solo lectura (impresión). Los que reciben `ro`: `buildDeriv`, `buildGraph`, `buildGraph3d`, `buildNet`, `buildVenn`. `buildTable`, `buildChart`, `buildPTree`, `buildGeo` son siempre de solo lectura (no tienen controles de edición).

### Estructura DOM de un bloque (`makeBlockEl`, 4770-4872)

```
div.blk[data-id][data-align]  (.is-boxed, .is-result, .is-active, .blk-deriv)
  button.blk-handle           ⋮⋮  draggable (4776-4783)
  div.blk-body                contenido del tipo
  button.x-del.blk-del.blk-exp  (solo EXPORTABLE) → openExport
  button.x-del.blk-del.blk-dup  ⧉ → duplicateBlock
  button.x-del.blk-del          × → deleteBlock
```

Tipos simples:

- **`text`** (4839-4848): `div.blk-text[contenteditable]`, `b.v = innerText` en `input`.
- **`math`** (4849-4863, si `mlReady`): `math-field` configurado con `configureField` (4757-4768: `smartFence`, `smartSuperscript`, teclado virtual manual, `colorMap` con `COLOR_NAMES`/`cssVar`, atajos `RR,NN,ZZ,QQ,CC,lam,pp`); en `input`: `b.v = getValue('latex')`, `b.result=false`, `hidePio()`, `save()`; en `move-out` salta a la línea anterior/siguiente con `focusSibling`.
- **Sin MathLive** (`mlReady=false`, 4864-4869): `div.blk-text` de solo lectura con `b.v`. Al cargar MathLive, `start()` (8075) pone `mlReady=true` y llama `renderPage()`. Si no carga en 4 s se hace `renderPage()` igualmente y un aviso (8092-8099).
- El `mousedown` sobre el hueco de `blk-body` enfoca el final del bloque (4870-4872).

`renderPage()` (5138-5150): vacía `#blocks`, hace `makeBlockEl` para cada bloque, `maybePio`, actualiza marcador de páginas/botones, `updatePres()`, **resetea `undoStack = []`**, pide `sizeCanvas` y deja activo el primero.

## 4. Selección y bloque activo

- `setActive(id)` (5167-5177): fija `activeId`, marca `.is-active`, sincroniza los botones de alineación (`#alignSeg`), recuadro (`#boxBtn`) y el texto de «Borrar paso/línea» y `#delDerivBtn` (visible solo en `deriv`).
- `focusin` en `#blocks` (5316-5324): activa el bloque que contiene el foco y, si es una celda de `deriv`, fija `activeCell` y marca la fila (`markRow`); si no, `activeCell=null`.
- `activeBlock()` (5266), `activeField()` (5268-5282: devuelve el `math-field` activo; si el activo es `deriv` devuelve la celda; si no hay bloque `math` activo **crea uno**), `syncActive()` (5695) = `syncBlock(activeBlock())`.
- `syncBlock(b)` (5120-5137): copia al modelo lo que hay en pantalla (por si no saltó `input`): para `deriv` recorre `[data-col]`, para `math` lee el `math-field`. Se usa antes de operar sobre un bloque.
- `focusBlock(id, where)` (5178-5197), `focusSibling(id, dir, where)` (5198-5204).
- «Elegir la línea» para operaciones (`pickable`, `startPick`): fuera del alcance de este documento (7112-7250); solo admite `math`, `deriv` y `text` para `stats/freq/space`.

## 5. Alineación y recuadro

- `setAlign(a)` (5609-5617): `b.align = a`, `el.dataset.align`, `save()`. Los botones `#alignSeg` están conectados fuera del rango leído.
- Recuadro `#boxBtn` (5618-5632): `b.boxed` (clase `is-boxed`); en `deriv` alterna `rows[i].boxed` de la fila activa y la clase `boxed` de sus celdas.
- Color (`setColor`, 5595-5608): cambia `board.color` y, si el activo es `math`/`deriv`, aplica `mf.applyStyle` al campo.

## 6. Duplicar y borrar

- `duplicateBlock(id)` (5635-5645): `syncBlock`, clona con `JSON.parse(JSON.stringify(b))`, nuevo `id`, `addBlockAfter(id, copy, false)`, enfoca, `flashBlock`, aviso con números de línea (`lineNo`, 5634).
- `duplicateRow(b,i)` (5646): copia `{l,r,note,boxed}` con `addRow`.
- `duplicateActive()` (5652): si la celda activa es de un `deriv` duplica la fila; si no, el bloque. Atajo Ctrl+D solo en modo `write` (8055).
- `deleteBlock(id, focusPrev=true)` (5218-5253): guarda copia (`gone`); si no estaba vacío, `toast(..., 'nota', {label:'Deshacer', fn})` que re-inserta `gone` con id nuevo (cambia a la página `pg` si hace falta) y llama `renderPage()` (re-render completo de la página). Si era el único bloque, lo convierte en `math` vacío (`delete bl[0].rows`) en lugar de borrarlo. Si no, lo quita del modelo y del DOM, `save()`, enfoca el anterior y `sizeCanvas`.
- `removeRow(b,i)` (4984-5001): si es la última fila borra el bloque; si no, `splice` + `rebuildDeriv` y aviso «Deshacer» que restaura la fila en `i`.
- Botón `#delBtn` (5671-5674): borra fila activa (deriv) o línea; `#delDerivBtn` borra el desarrollo entero.

## 7. Mover y arrastrar

- `moveBlock(id, dir)` (5254-5265): intercambia en el modelo y reordena el DOM sin re-render. Atajo Alt+↑/↓ (5290).
- Arrastre HTML5 desde el asa `.blk-handle` (5325-5362): `dragstart` guarda `dragId`; `dragover` marca `drop-before/drop-after` según la mitad del elemento; `drop` hace `splice` en el modelo y `insertBefore` en el DOM; `dragend` limpia. No hay reordenación entre páginas. No hay `save()` en `dragend`; el `save()` está en `drop` (5356).

## 8. Teclado dentro de las líneas

Un único listener en fase de captura sobre `#blocks` (`pizarra.html:5284-5315`):

1. Ignora `INPUT`, `SELECT`, `svg` y todo lo que esté dentro de `.net,.g3d,.graph,.venn,.chart,.ptree,.geo` (5285): los visuales gestionan su propio teclado.
2. Alt+↑/↓ → `moveBlock`.
3. Si el bloque es `deriv` → `derivKey(e,b)` (5053-5119) y termina.
4. Alt+Supr/Retroceso → `deleteBlock`.
5. Intro: en modo LaTeX de MathLive no actúa; Mayús+Intro → `addRowAfter` (matriz); Ctrl/Cmd+Intro → `addColumnAfter`; Mayús+Intro en `text` es salto de línea; en el resto crea línea nueva debajo heredando `align`.
6. Retroceso en línea vacía → `deleteBlock`.
7. Flechas ↑/↓ en `text` en el borde saltan a la línea vecina (`math-field` lo hace con el evento `move-out`).

Atajos globales que afectan a bloques (fuera del rango leído, `pizarra.html:8026-8071`): Alt+M matriz, Alt+S sistema, Alt+L desarrollo, Alt+T texto, Ctrl+D duplicar, Ctrl+= calcular, Intro con línea activa sin foco → `focusBlock`.

## 9. Desarrollo alineado por el «=» (`deriv`) en detalle

**Desde una línea de fórmula** (`deriv.js`, `startDeriv`): cualquier línea `math` se convierte en desarrollo, tenga o no «=». Con «=» el texto se reparte en `l` y `r`; sin «=», todo pasa a `l` y el cursor queda a la derecha para seguir escribiendo. La explicación `note` de la línea (botón 💬, `blocks/editor.js` `makeNote`) pasa a `rows[0].note`.

Datos: `rows[{l, r, note, boxed}]` (ver FORMATO-JSON §4.3).

**Render** `buildDeriv(b, bd, ro)` (4875-4942): crea `div.deriv[role=group]` y una `div.drow` por fila, cada una con 4 celdas hijas directas en una rejilla CSS con variables `--gr`, `--gm`, `--gn` (4939: `--gr`=fila, `--gm`=2i+1, `--gn`=2i+2; sirven al CSS para numerar «3.1, 3.2…»):

- `.dcell.dl` (lado izquierdo, `math-field` con `data-row`/`data-col="l"`), `.dcell.deq` (el signo `=` fijo, `aria-hidden`), `.dcell.dr` (`math-field data-col="r"`), `.dnote` (`div[contenteditable]`, `data-col="note"`, placeholder «Planteamiento…»/«Explica el paso…»).
- Si no hay MathLive, `l` y `r` se muestran como texto.
- En modo editable añade botones `×` (`drow-del`, → `syncBlock` + `removeRow`) y `⧉` (`drow-dup`, → `duplicateRow`).
- Con `ro=true` (impresión) los campos son `read-only` y sin botones ni listeners.
- Cada edición actualiza `row[col]` en `input` y llama `save()`.

**Reconstrucción**: `rebuildDeriv(b)` (4943-4948) rehace todo `.blk-body` (se pierde el foco, de ahí que cada operación termine con `focusCell`). Se llama desde `removeRow`, `addRow`, `derivKey` (borrar fila vacía) y otros sitios fuera de rango (7312, 7335).

**Foco por celda**: `cellEl(id,row,col)` (4949) busca por `[data-row][data-col]`; `focusCell(id,row,col,where)` (4955-4972) hace `setActive`, fija `activeCell`, `markRow` (4950: resalta la fila con clase `on`), enfoca y coloca el cursor. `derivMove(b,i,col,dir)` (4973-4983) traduce `move-out` de MathLive (forward/backward/upward/downward) al movimiento entre `l → r → note → fila siguiente` y salta al bloque vecino con `focusSibling` en los extremos.

**Teclado de filas** `derivKey(e,b)` (5053-5119), devuelve `true` si consume la tecla:

| Tecla | Efecto |
| --- | --- |
| Alt+Supr/Retroceso | borra la fila |
| Intro | fila vacía (y hay más de una) → la quita y crea línea `math` debajo; si no, `addRow` copiando `l` y `r` de la anterior (Alt+Intro: fila en blanco empezando por `l`) |
| Mayús/Ctrl+Intro en `math-field` | añade fila/columna de matriz |
| Esc | sale del desarrollo: enfoca la línea `math` vacía siguiente o crea una |
| Tab / Mayús+Tab | `l → r → note → fila siguiente`; en `math-field` respeta los `\placeholder` pendientes |
| `=` al final de `l` | pasa a `r` |
| Retroceso en celda vacía | `r → l`, `note → r`, y si toda la fila está vacía la borra |
| Flechas/Tab en `note` | navegación manual (no hay `move-out`) |

`splitTopEq(L)` (5009-5024): primer `=` fuera de llaves y de entornos `\begin..\end`; lo usa `startDeriv` para partir una ecuación en `l` y `r`.

Interacciones con el resto (acoplamientos): `activeField()` (5268), `setActive` (5167), `focusBlock` (5178), `#boxBtn` (5618), `duplicateActive` (5652), `runCalc` (5697) y todo el flujo de «elegir línea» (7112-7210) leen `activeCell`/`b.rows`/`derivRowIndex(b)` (5696) directamente.

## 10. Acoplamientos problemáticos (resumen)

1. **Doble despacho** por tipo (`makeBlockEl` y `printAll`) más 5 listas paralelas (`xl`, aviso de borrado, `EXPORTABLE`, selector CSS de teclado, `sanitize`). Añadir un tipo obliga a tocar 7 sitios.
2. **Variables compartidas**: `activeId`, `activeCell`, `mlReady`, `board`, `undoStack` son `let` de la IIFE y las leen/escriben funciones de varios bloques de código.
3. **`deriv` no es autocontenido**: el estado `activeCell`, `focusCell`, `rebuildDeriv`, `markRow` los usan `setActive`, `focusBlock`, `activeField`, `duplicateActive`, `#boxBtn`, `runCalc` y el selector de línea.
4. `deleteBlock` y `removeRow` re-renderizan la página entera al deshacer (`renderPage()` también reinicia `undoStack` de trazos).
5. `deleteBlock` clasifica por tipo (mensajes, «vacío») con un `if` propio.
6. `toast` usa `pioBadge` por `typeof pioBadge === 'function'` (4695): dependencia implícita de otro bloque.

## Propuesta de módulos

Patrón registro: cada tipo se registra con `registry.register({ type, label, delLabel, delMsg, exportable, isEmpty(b), sanitize(raw, h), create(spec), render(b, bd, ctx), renderPrint(b, bd, ctx), keydown?(e,b,ctx), onFocus?(…) })`. `makeBlockEl` y `printAll` pasan a llamar `registry.get(b.type).render(...)`/`renderPrint(...)`, y `xl`, avisos de borrado, `EXPORTABLE`, el selector CSS de teclado y `isEmpty` salen de la definición del tipo.

| Fichero propuesto | Líneas origen | Qué necesita del exterior (contexto a inyectar) |
| --- | --- | --- |
| `js/blocks/registry.js` | (nuevo; sustituye cadenas en 4607-4662, 4792, 4819-4863, 5226, 6068, 7792-7822, 5285) | Nada. API: `register`, `get`, `has`, `types`, `exportable(type)`, `sanitize(raw)`, `create(spec)`. |
| `js/blocks/blockHost.js` (núcleo común: `makeBlockEl` sin las ramas, `renderPage`, `setActive`, `focusBlock`, `focusSibling`, `addBlockAfter`, `deleteBlock`, `moveBlock`, `duplicateBlock`, arrastre, listeners `keydown`/`focusin`) | 4750-4755, 4770-4818, 4870-4872, 5138-5282, 5283-5362, 5634-5668 | `board`/`page()`, `save`, `toast`, `hidePio/maybePio`, `blocksEl`, `body`, `sizeCanvas`, `updatePres`, `goPage` (deshacer entre páginas), `openExport`, `flashBlock` (7195), `setMode`, `$`/`$$`. Expone `ctx` a los tipos. |
| `js/blocks/math.js` | 4757-4768 (`configureField`), 4849-4869, 5120-5137 (rama `math`) | `mlReady` (getter), `COLOR_NAMES`, `cssVar` (tema), `hidePio`, `save`, `focusSibling`, `el` (para `is-result`). Registra además la rama `text`. |
| `js/blocks/text.js` | 4839-4848 | `hidePio`, `save`. |
| `js/blocks/deriv.js` | 4873-5119 (+ `syncBlock` rama deriv 5127-5133, `duplicateRow` 5646-5651, `derivRowIndex` 5696) | `page()`, `board.cur`, `blockById`, `elById`, `setActive`, `focusSibling`, `addBlockAfter`, `deleteBlock`, `newBlock`, `newRow`, `save`, `toast`, `hidePio`, `sizeCanvas`, `goPage`, `mlReady`, `configureField`, `setMode`, `syncActive`. **Exporta estado**: `activeCell` (get/set), `focusCell`, `rebuildDeriv`, `markRow`, `derivRowIndex` para `setActive/focusBlock/activeField/runCalc/selector de línea`. |
| `js/blocks/table.js` | 5739-5787 | Solo `$$` (rama `ruffini`). Sin estado. |
| resto de tipos (`graph`, `graph3d`, `chart`, `ptree`, `geo`, `venn`, `net`) | ver `docs/funcionalidades/graficos.md` | ver ese documento. |
