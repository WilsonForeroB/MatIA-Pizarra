# Dibujo a mano alzada

Código: `pizarra.html:7849-8024` (más UI en 595-614 y ajustes en 4730-4745).

## Herramientas

| Herramienta | `board.tool` | Botón / tecla | Render (`drawStroke`, 7877) |
|---|---|---|---|
| Lápiz | `pen` | `[data-tool=pen]` (597) / P | Trazo con curvas cuadráticas suavizadas; ancho = `w` x presión media (7904-7918); un solo punto = círculo (7905) |
| Rotulador | `hl` | 598 / R | `globalAlpha .32`, ancho `w*5`, `lineCap butt` (7886-7893) |
| Flecha | `arrow` | 599 / A | Línea del primer al último punto + cabeza rellena de longitud `10+3w` (7894-7903); en `pointermove` solo se actualiza `pts[1]` (7981) |
| Goma | `eraser` | 600 / E | No dibuja; borra trazos completos (`eraseAt`, 7944). Con el botón de borrar del lápiz digital (`button===5`) se usa goma temporal (7967) |

Selección: `toolSeg` (4740, `aria-pressed`), teclas P R A E solo en modo dibujo (8063-8066). Valida `tool` en `sanitize` (4598).

## Grosor y colores

- `#penWidth` 1-12 px (604, 8024); `board.width` validado 1-12 (4602).
- Colores: `ink`, `data-1`..`data-5` (Verde, Azul, Ámbar, Rosa, Bermellón) en 607-614; atajos Alt+1..Alt+6 (8050); `COLOR_NAMES` (4748); `board.color` validado con `/^(ink|data-[1-6])$/` (4597). `setColor` (5595) cambia el color del trazo y, en modo escribir, aplica estilo a la fórmula.
- Los trazos guardan el NOMBRE del color (no el hex): se resuelve con `cssVar` (4747) según el tema (`drawStroke(c, s, colorOf=cssVar)`, 7877). Impresión usa paleta clara fija (7831).

## Modelo de datos del trazo

En `board.pages[i].strokes[]` (4575, 4664):

```
{ tool: 'pen'|'hl'|'arrow', color: 'ink'|'data-N', w: <1..12>, pts: [[x, y, presion], ...] }
```

- Coordenadas en píxeles de `#sheet` SIN zoom (`sheetPoint`, 7931: divide por `zoomF`, redondea a 0,1; presión 0,35 + p*1,3 solo con `pointerType==='pen'`, si no 1).
- `sanitize` solo exige `s.pts` array (4664); no valida `tool`, `color`, `w` ni los puntos (riesgo: datos externos mal formados llegan a `drawStroke`).
- `minH` por página (4665): altura mínima ampliada al dibujar cerca del borde inferior (`y > clientHeight-160` -> `minH = clientHeight+400`, 7985-7987).
- Se persisten con la pizarra (localStorage y JSON, ver `persistencia.md`) mediante `save()` (8001).

## Captura de eventos

| Evento | Línea | Detalle |
|---|---|---|
| `pointerdown` en `#sheet` (captura) | 7957 | Dibuja si modo `draw` o `pointerType==='pen'`; ignora botón secundario, `.blk-handle`; en modo escribir ignora si hay `picking` o se pulsa un `button`; `setPointerCapture`; crea `cur` |
| `pointermove` | 7974 | Usa `getCoalescedEvents`; filtra puntos a menos de 1,5 px; goma borra en cada punto |
| `pointerup` / `pointercancel` | 8004-8005 | `endStroke` (7990): añade trazo a la página y a `undoStack`; flecha con menos de 2 puntos se descarta |

## Deshacer

`undoStack` (7851) global (NO por página, no se vacía al cambiar de página; `undo` actúa sobre `page()` actual, 8006-8014 -> riesgo de incoherencia entre páginas). Entradas `{type:'add', s}` o `{type:'erase', items:[{s,i}]}`. `#undoBtn` (8015), Ctrl+Z en modo dibujo (8057). `#clearInkBtn` (8016) borra todos los trazos de la página, deshacible. No hay rehacer. No se persiste.

## Canvas y redimensionado

- `<canvas id="ink">` dentro de `#sheet` (643), `role="img"`.
- `sizeCanvas` (7853): llama a `fitZoom`, calcula altura necesaria (papel fijo: max(alto del papel, contenido, `minH`); libre: ventana/zoom o contenido), marca `.page-end` (7860-7864), ajusta `sheet.style.minHeight`, escala por `devicePixelRatio` (7867-7871) y llama a `redraw`.
- Disparadores: `ResizeObserver` de `wrap` y `blocksEl` (7874-7875), `window.resize` (7389), cambio de escala/papel/presentación, pantalla completa, ocultar barras (7417).
- `redraw` (7923): limpia y repinta todos los trazos de `page()` y el trazo en curso; `scheduleRedraw` agrupa con `requestAnimationFrame` (7930). `refreshColors` (7405) fuerza repintado al cambiar tema (usa `redrawers` de bloques).
- En modo escribir el canvas no recibe eventos (`pointer-events` solo en `body[data-mode=draw] #ink`, CSS línea 167), salvo el lápiz digital, que captura en `#sheet`.

## Presentación

`#presDraw` y tecla D alternan dibujo sobre la diapositiva (7385, 8039).

## Propuesta de módulos

| Fichero | Líneas origen | Dependencias externas |
|---|---|---|
| `js/draw/render.js` (`drawStroke`, `redraw`, `sizeCanvas`, `scheduleRedraw`) | 7850-7873, 7877-7930 | `cv`, `sheet`, `wrap`, `blocksEl`, `page()`, `PAPERS`, `fitZoom`/`zoomF`, `cssVar` |
| `js/draw/input.js` (punteros, goma, deshacer, borrar) | 7931-8024 | `board` (`tool`, `color`, `width`), `page()`, `body.dataset.mode`, `picking`, `hidePio`, `save`, `toast`, `applySettings` |
| `js/draw/tools-ui.js` (selector herramienta, color, grosor) | 4739-4742, 5591-5608, 8024 | `board`, `applySettings`, `save`, `activeField` (setColor en modo escribir) |
| Sanitizado de trazos | 4664 -> `js/storage/sanitize.js` | Ampliar validación de `tool/color/w/pts` |

Dependencias circulares a romper: `sizeCanvas` <- `fitZoom` (ajustes visuales), `endPresent`/`startPresent`, y `refreshColors` <- `redrawers` de gráficos.
