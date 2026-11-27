# Interfaz de la pizarra

Estado documentado: `pizarra.html` (rama dev, 8103 líneas). Todo el código vive en una IIFE (`pizarra.html:4543`), por lo que las funciones citadas comparten ámbito.

## 1. Cabecera (`<header id="top">`, 557-578)

| Elemento | id / atributo | Línea | Acción |
|---|---|---|---|
| Marca + Pío | `.brand[data-pio=logo]` | 558 | Inserta el SVG de Pío (`pioBadge`, 4558; `[data-pio]` se rellena en 4567) |
| Modo Escribir / Dibujar | `button[data-mode]` | 560-561 | `setMode(m)` (7348); pone `body.dataset.mode` |
| Páginas | `#pgPrev` `#pgOut` `#pgNext` `#pgAdd` `#pgDel` | 564-568 | `goPage` (7391), añadir (7399), eliminar (7739, pasa por `#delPage`) |
| Presentar | `#presBtn` | 571 | `startPresent` (7364) |
| PDF | `#pdfBtn` | (versión actual) | Guardar como PDF: ventana MatIA y luego impresión (`js/ui/print.js`) |
| Pantalla completa | `#fsBtn` | 572 | `toggleFull` (7411) |
| Vista | `#viewBtn` -> `#viewPop` | 573 | `showPop` (7403) |
| Guardar | `#saveBtn` | 574 | `quickSave` (7678); clase `dirty` según `isDirty` (7669) |
| Historial | `#histBtn` | 575 | abre `<dialog id="hist">` (7607) |
| Archivo | `#fileBtn` -> `#filePop` | 576 | `showPop` (7632) |
| Ayuda | `#helpBtn` | 577 | `help.showModal()` (7421) |

## 2. Barra de herramientas (`#toolbar`, 580-639)

Los grupos llevan `only-write` / `only-draw`; el CSS los muestra según `body[data-mode]`. Handler único (`5581`) por delegación; el `mousedown` se cancela (5580) para no robar el foco a la fórmula.

| Grupo | Controles (id / data) | Línea |
|---|---|---|
| Insertar (escribir) | `data-pop=matPop` Matriz, `data-pop=sysPop` Sistema, `#newLineBtn`, `#derivBtn` (Alt+L), `data-cmd=addRowAfter`, `data-cmd=addColumnAfter` | 581-588 |
| Símbolos (escribir) | `data-pop=symPop`, `data-pop=calcPop`, `data-pop=grafPop` | 589-593 |
| Dibujo | `#toolSeg [data-tool]` pen/hl/arrow/eraser, `#penWidth` (1-12) / `#widthOut` | 595-605 |
| Color | `#swatches .sw[data-color]` ink, data-1..data-5 | 607-614 |
| Línea (escribir) | `#alignSeg [data-align]`, `#boxBtn`, `#textBtn`, `#imgBtn` (Imagen; `#imgIn` oculto), `#kbdBtn`, `#dupBtn`, `#delBtn`, `#delDerivBtn` (oculto salvo desarrollo) | 616-628 |
| Deshacer (dibujo) | `#undoBtn`, `#clearInkBtn` | 630-633 |
| Calcular (escribir) | `data-pop=opsPop` Operaciones, `#calcBtn` (Ctrl+=) | 635-638 |

Ramas del handler de barra (5581-5594): `data-pop` (abre/cierra), `data-tpl` (`TPL`, 5376), `data-cmd` (MathLive `executeCommand`), `data-color` (`setColor` 5595), `data-align` (`setAlign` 5609), `data-tool` (asigna `board.tool`).

Otros botones de la barra: Recuadrar (5618), Texto (5633), Duplicar (`duplicateActive` 5652), Teclado virtual (5678, usa `mathVirtualKeyboard`), borrar línea (5671), `#newLineBtn`/`#addLineEnd` (`newLine`, 5658).

## 3. Popovers (`.pop`)

Gestor único: `showPop(id, anchor)` (5517), `closePop()` (5530), variable `openPop = {p, anchor}` (5516). Solo hay UNO abierto a la vez; se posiciona bajo el ancla con `getBoundingClientRect`; `aria-expanded` en el ancla; el foco va al primer botón salvo en `matPop`. Se cierran con clic fuera (`pointerdown`, 5536) y con Escape (8042).

| id | Línea HTML | Rol ARIA | Contenido / quién lo abre | Cierre específico |
|---|---|---|---|---|
| `matPop` | 652 | dialog | Rejilla 6x6 `#matGrid` (5543), tipo `#matType` (pmatrix/bmatrix/vmatrix/aug), `data-chain` A·B y A+B (5570) | `closePop()` al elegir (5561) |
| `symPop` | 669 | dialog | Se construye con `buildSymPop('symPop', SYM_GROUPS)` (5511) | queda abierto para encadenar símbolos (5507-5509) |
| `calcPop` | 728 | dialog | `buildSymPop('calcPop', CALC_GROUPS)` (5512): Derivadas, Integrales, Límites | idem |
| `opsPop` | 670 | dialog | Menú Operaciones, `buildOpsPop` (7054) | `closePop()` y `startPick` (7080) |
| `expPop` | 671 | menu | Exportar gráfico: PNG, SVG, copiar, `#expLight` (6160-6216, fuera de rango) | desde el botón de cada gráfico |
| `grafPop` | 680 | dialog | Opciones `data-graf` 2d/3d/net/venn/nn | handler fuera de rango (~6930) |
| `sysPop` | 730 | dialog | `data-sys` 2/3/4 ecuaciones (5575) | `closePop()` |
| `viewPop` | 748 | dialog | Papel `#paperSel`, `#scale`, tema `[data-theme-set]`, acento `[data-accent]`, líneas `#lnSeg`, `#hideBtn` | `showPop` en 7403 |
| `filePop` | 778 | menu | `#saveFile`, `#openFile`, `#printBtn`, `#clearPage`, `#delPage`, `#newBoard`, `#aboutBtn`; contiene `<input type=file id=fileIn>` | 7632 |

Notas: `role="menu"` sin navegación con flechas (no hay manejador de roving focus); `role="dialog"` sin `aria-modal`. `#pickBar` (7095-7107, creada por JS, `role=status`) NO es popover.

## 4. Plantillas y símbolos (5363-5513)

- `ph = '#?'` (5364): hueco de MathLive. `matrixLatex(r,c,env)` (5365), `systemLatex(n)` (5513), `TPL` (5376, atajos para `data-tpl`; no hay botones `data-tpl` en el HTML leído, 580-639).
- `insertLatex(latex)` (5383): cambia a modo escribir, usa `activeField()`, `mf.insert(..., selectionMode:'placeholder')`, llama a `syncBlock`, `hidePio`. Si MathLive no está listo: `toast(..., 'aviso')`.
- `SYM_GROUPS` (5393): Básicos, Lógica, Conjuntos, Números, Relaciones, Operaciones, Flechas, Probabilidad y estadística, Trigonometría y geometría, Letras griegas. `CALC_GROUPS` (5466): Derivadas, Integrales, Límites. Formato de cada elemento: `[etiqueta, LaTeX, nombre/atajo]`.
- `buildSymPop` (5485): botones `.sym` con `title` y `aria-label`; `mousedown` previene pérdida de foco.
- Atajos de escritura: palabras completas (`WORDS` en `js/blocks/editor.js`: pi, alpha, sin, in, lam, pp…) al terminarlas, y los de MathLive sin letras; ver `atajos.md`.

## 5. Menú Operaciones (6984-7245)

- `OPS_MENU` (6984): grupos y claves: Matrices y sistemas (gauss, gj, inv, detS, detC, detG, cramer, param, prod, eigen), Vectores (dot, cross, norm, angle, proj), Ecuaciones (solve, next, check), Aritmética (fracS, fracO, mcd, primes), Polinomios (polyOp, polyDiv, polyRoots), Combinatoria (comb, pascal), Lógica y conjuntos (truth, venn, sets), Estadística y probabilidad (stats, freq, space, cont, bayes, binom, normal), Trigonometría y geometría (ang, trig, notable, tri, lines, transv), Cálculo (deriv, extr1, extr2, graph, values).
- Flujo "elegir línea": clic en operación -> `startPick(key,label)` (7152) -> barra `#pickBar` (7095-7107) con `Aceptar` (`pkUse`)/`Cancelar` -> clic en línea marca destino (`pointerdown` captura, 7207) -> `pickAndRun` (7171) -> `runOp(key)` (7244).
- Teclado: Escape cancela, Intro acepta (7239-7243, `keydown` en captura). `NO_LINE` = pascal, bayes, notable (no piden línea, 7093).
- Texto de ayuda en 7056-7060; ratón: hover resalta (7221); lápiz/dedo: 1.er toque marca, 2.º confirma.
- `bayes` abre `<dialog id="bayesDlg">` (6538-6575, fuera de rango).

## 6. Modo escribir / dibujar (7347-7353)

`body[data-mode]` = `write|draw`. En dibujo se hace `blur()` del elemento activo. El lápiz digital dibuja siempre (7958). Alt+D / D alternan (8045, 8067). Con Escape en modo dibujo se vuelve a escribir (8059).

## 7. Páginas (7391-7399, 7730-7750)

- `goPage(i)` -> `board.cur`, `renderPage()`, `save()`.
- `+ Página` inserta después de la actual. `- Página`/`#delPage`: si es la única, avisa y llama a `#clearPage`; si no, pide confirmación con `ask` (7743).
- `#clearPage` pide confirmación y sustituye por `newPage()` (7730). `#newBoard` (7755) usa `guardUnsaved` o `ask`.
- Atajos Alt+RePág/AvPág (8051-8052) y RePág/AvPág sin modificadores (8068).

## 8. Vista y ajustes (4709-4745, 7400-7419)

- `PAPERS` (4709): free, a4p 794x1123, a4l, a3l, slide 1280x720. `PAGE_CSS` para `@page` (4710) escrito en `#pageStyle` (4726).
- `fitZoom` (4712): zoom del `#sheet` para papel/presentación. `applyPaper` (4722), `applySettings` (4730) sincroniza todos los controles desde `board`.
- Tema: `board.theme` null = sistema (`matchMedia`, 7404); `isDark` (4746). Acento: `data-module="math"` en body (4732). Escala: `--scale` (4734, 80-260 %). Líneas numeradas: clase `no-ln` (4743).
- `refreshColors` (7405): repinta fórmulas con color y trazos al cambiar tema.
- Ocultar barras: `toggleChrome` (7417), botón `#showChrome` (649), tecla H.

## 9. Ayuda y Acerca de

- `<dialog id="help">` (846-956): tablas de atajos estáticas. Abre con `?` (8060) o `#helpBtn`; cierra con `#helpClose` (7631) y Escape nativo.
- `<dialog id="about">` (805-824): `#aboutBtn` (7752), `#helpAbout` (7754), `#aboutClose` (7753).
- `<dialog id="hist">` (826-844): ver `persistencia.md`.

## 10. Presentación y pantalla completa (7354-7388, 7411-7416)

- `startPresent` (7364): `body.presenting`, `requestFullscreen` (7369, falla en silencio), `presIdle` oculta la barra `#presBar` a los 2,5 s (7357), `sizeCanvas`; consejo `toast` si el papel es libre (7373).
- `endPresent` (7375), `fullscreenchange` -> sale de presentación si se abandona fullscreen (7386).
- `#presBar` (740-746): `#presPrev`, `#presOut`, `#presNext`, `#presDraw`, `#presExit`. Teclas en presentación (8031-8040): flechas/RePág/Espacio, Inicio, Fin, D, Esc.
- Pantalla completa independiente: F / `#fsBtn` (7411-7416); si falla -> `toast('Tu navegador no permite pantalla completa aquí.')`.

## 11. Impresión (7770-7847)

`printAll` (7772) rellena `#print-root` (958) con una `.print-page` por página (reconstruye bloques con `buildDeriv`, `buildTable`, `buildGraph`, ..., fórmulas read-only), pinta los trazos en un canvas x2 con paleta clara fija (7831) y llama a `window.print()` tras 600 ms (7845). `afterprint` vacía `#print-root` (7847). El tamaño de papel viene de `@page` (4726).

**Versión actual**: el botón «PDF» (cabecera) y «Guardar como PDF» (Archivo, `#pdfFile`) abren primero una ventana de MatIA que explica elegir «Guardar como PDF» como destino en el diálogo del navegador. Antes de imprimir se espera a las imágenes y a las fórmulas, se pone una página (o diapositiva) por hoja y se avisa de las páginas que no caben. «Imprimir…» (`#printBtn`) sigue igual. Para presentaciones, Vista ▾ → Diapositiva 16:9.

## 12. Arranque (8073-8100)

`applySettings()`; `start()` (8075) configura MathLive (fuentes por CDN jsdelivr, sin sonidos), `renderPage()` y enfoca el primer bloque. Si `math-field` no se define en 4 s: `renderPage()` + toast de aviso (8092-8099).

## Propuesta de módulos

| Fichero propuesto | Líneas origen | Dependencias externas |
|---|---|---|
| `js/ui/pio.js` | 4553-4567 | DOM |
| `js/ui/toast.js` | 4683-4706 | `pioBadge`, `#toast` |
| `js/ui/popovers.js` | 5515-5538 (`showPop`, `closePop`, `openPop`) | DOM; lo usan toolbar, vista, archivo, operaciones |
| `js/ui/templates.js` | 5363-5391, 5393-5513 | `activeField`, `activeBlock`, `syncBlock`, `setMode`, `toast`, `hidePio` |
| `js/ui/toolbar.js` | 5578-5684 | `board`, `applySettings`, `save`, bloques (`addBlockAfter`, `deleteBlock`, `focusBlock`, `elById`, `setActive`), `showPop`, `insertLatex` |
| `js/ui/calc.js` | 5686-5737 | `ME` (motor), `page()`, `addRow`, `addBlockAfter`, `toast` |
| `js/ui/ops-menu.js` | 6984-7245 | `OPS`/`ME`, `page()`, `setMode`, `closePop`, `toast`, `pioBadge`, render de bloques |
| `js/ui/view-settings.js` | 4708-4748, 7400-7419 | `board`, `save`, `sizeCanvas`, `redraw`, `redrawers`, `toast` |
| `js/ui/mode-pages.js` | 7347-7353, 7391-7399, 7730-7750 | `board`, `renderPage`, `ask`, `save` |
| `js/ui/presentation.js` | 7354-7388 | `board`, `goPage`, `setMode`, `sizeCanvas`, `closePop`, `toast` |
| `js/ui/print.js` | 7770-7847 | `board`, `PAPERS`, builders de bloques, `drawStroke`, `mlReady`, `configureField` |
| `js/ui/shortcuts.js` | 8026-8071 | casi todo lo anterior (ver `atajos.md`) |
| `js/main.js` | 8073-8100 | MathLive, `renderPage`, `focusBlock` |
