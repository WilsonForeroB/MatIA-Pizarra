# Atajos de teclado

Fuente principal: manejador global `document.addEventListener('keydown', ..., true)` en `pizarra.html:8027-8071`. Se ignora si hay diálogo abierto (`askDlg`, `nnDlg`, `bayesDlg`, 8030; NO se comprueba `#hist`, `#help` ni `#about`). `editing` = foco en `math-field`, `contenteditable`, `input`, `select`, `textarea` (8028).

## Globales

| Atajo | Acción | Condición | Línea |
|---|---|---|---|
| Alt+D | Alternar Escribir/Dibujar | siempre (usa `e.code`) | 8045 |
| D | Alternar Escribir/Dibujar | sin modificadores y sin editar | 8067 |
| Alt+M | Insertar matriz 2x2 | | 8046 |
| Alt+S | Insertar sistema 2x2 | | 8047 |
| Alt+L | Nuevo desarrollo / convertir línea (`startDeriv`) | | 8048 |
| Alt+T | Añadir línea de texto (`#textBtn`) | | 8049 |
| Alt+1 ... Alt+6 | Color (ink, data-1..data-5) | | 8050 |
| Alt+RePág / Alt+AvPág | Página anterior / siguiente | | 8051-8052 |
| RePág / AvPág | Página anterior / siguiente | sin modificadores y sin editar | 8068-8069 |
| Ctrl/Cmd+S | Guardar (`quickSave`) | siempre | 8054 |
| Ctrl/Cmd+D | Duplicar línea o paso (`duplicateActive`) | modo escribir, sin Alt/Mayús | 8055 |
| Ctrl/Cmd+= | Calcular (`runCalc`) | sin Alt | 8056 |
| Ctrl/Cmd+Z | Deshacer trazo | modo dibujo y no editando | 8057 |
| Escape | Cierra popover abierto | si `openPop` | 8042 |
| Escape | Cierra popover; en dibujo vuelve a escribir | sin editar | 8059 |
| ? | Abrir ayuda (`help.showModal`) | sin editar | 8060 |
| H | Mostrar/ocultar barras | sin editar | 8061 |
| F | Pantalla completa | sin editar | 8062 |
| P R A E | Lápiz, rotulador, flecha, goma | modo dibujo, sin editar | 8063-8066 |
| Intro | Enfocar la línea activa | modo escribir, hay `activeId`, sin editar | 8070 |

## Modo presentación (8031-8040)

| Atajo | Acción | Línea |
|---|---|---|
| Escape | Si se edita: quita foco; si no: sale | 8033 |
| Flecha der./abajo, AvPág, Espacio | Página siguiente | 8035 |
| Flecha izq./arriba, RePág | Página anterior | 8036 |
| Inicio / Fin | Primera / última página | 8037-8038 |
| D | Alternar dibujo | 8039 |

## Selección de línea para una operación (7239-7243)

| Atajo | Acción |
|---|---|
| Escape | Cancela (`endPick`) |
| Intro | Aceptar (`pkUse.click()`) |

## Dentro de las líneas (`blocksEl` keydown, 5284-5316)

Excluidos los gráficos/SVG/INPUT (5285).

| Atajo | Acción | Línea |
|---|---|---|
| Alt+Flecha arriba/abajo | Mover línea (`moveBlock`) | 5291 |
| Alt+Supr / Alt+Retroceso | Borrar línea | 5293 |
| Intro | Nueva línea matemática debajo (conserva alineación); en LaTeX mode no actúa; Alt+Intro no actúa | 5294-5303 |
| Mayús+Intro | Nueva fila (matriz/sistema, `addRowAfter`) | 5296 |
| Ctrl/Cmd+Intro | Nueva columna (`addColumnAfter`) | 5297 |
| Mayús+Intro en texto | Salto de línea (no se intercepta) | 5298 |
| Retroceso en línea vacía | Borrar la línea | 5304-5308 |
| Flecha arriba/abajo en texto | Cambia de línea si se está en el borde | 5309-5314 |

## Dentro de un desarrollo (`derivKey`, 5055-5120)

| Atajo | Acción | Línea |
|---|---|---|
| Alt+Supr / Alt+Retroceso | Borrar paso (`removeRow`) | 5061 |
| Intro | Paso siguiente copiando la fila; en fila vacía sale a una línea nueva; Alt+Intro paso en blanco | 5062-5075 |
| Mayús+Intro / Ctrl+Intro | Fila / columna de matriz | 5063-5064 |
| Escape | Sale del desarrollo a línea normal | 5076-5083 |
| Tab / Mayús+Tab | Izquierda -> derecha -> explicación y al revés (si no quedan huecos `\placeholder`) | 5084-5090 |
| = (final del lado izquierdo) | Salta al lado derecho | 5091-5094 |
| Retroceso en celda vacía | Borra paso vacío o retrocede de celda | 5095-5106 |
| Tab / flechas en la nota | Cambio de celda/fila | 5108-5115 |
| Ctrl+D dentro del paso | Duplica el paso (vía global 8055) | 5646, 8055 |

## Atajos de escritura MathLive (`inlineShortcuts`)

`configureField` (`js/blocks/editor.js`) cambia el comportamiento de MathLive: la barra espaciadora escribe `\ ` (`mathModeSpace`), y los atajos que son **palabras** (`pi`, `alpha`, `sin`, `in`, `del`…) se anulan porque MathLive los aplicaba en cuanto coincidían las letras y rompía palabras normales («valor» → val∨r, «pizarra» → πzarra). En su lugar, `WORDS` convierte la palabra **entera** antes del cursor al terminarla (cualquier tecla que no sea letra, Intro, Tab o al salir del campo). Se mantienen al momento los atajos sin letras (`<=`, `!=`, `->`, `+-`, `...`, `!in`…) y `KEEP`: `sqrt cbrt nthroot nabla infty AA EE RR NN ZZ QQ CC xx`. Tab salta al siguiente hueco.

En una línea de texto, `$` abre una fórmula en línea (`js/ui/text-format.js`); dentro de ella Intro, Esc, Tab o `$` vuelven al texto detrás de la fórmula (`exitMath` en `js/blocks/text.js`). Lo tecleado mientras el campo se monta se guarda y se le pasa después.

## Otros handlers de teclado (fuera de los rangos principales)

| Contexto | Teclas | Línea |
|---|---|---|
| Campo de la red neuronal `#nnLayers` | Intro = Crear | 6941 |
| Expresión de conjuntos del diagrama de Venn | Intro aplica | 6691 |
| Edición en línea sobre el grafo (buildNet, 6763) | Intro acepta, Esc cancela | 6816 |
| Grafo seleccionado | Supr / Retroceso borra nodo | 6905 |
| `<dialog>` nativo | Esc cierra (evento `cancel`) | 7662, ver `dialogos.md` |

## Observaciones

- La tabla de ayuda (846-956) lista atajos que en el código aparecen con otro alcance: "Alt+M Alt+S" crea matriz 2x2/sistema 2x2 (coherente con 8046-8047).
- Con teclas de una letra (D, H, F, ?, P, R, A, E) la condición es "no editando, sin Ctrl/Meta/Alt"; el `?` requiere Mayús en teclados ES (se compara `e.key`).
- Escape se evalúa dos veces (8042 y 8059); el primero consume si hay popover.
- No hay atajo para Historial ni para abrir archivo; Ctrl+S va siempre a `quickSave` (conecta carpeta con selector nativo si no hay, ver `persistencia.md`).

## Propuesta de módulos

| Fichero | Líneas origen | Dependencias externas |
|---|---|---|
| `js/ui/shortcuts.js` (global) | 8026-8071 | `board`, `setMode`, `goPage`, `insertLatex`, `matrixLatex`, `systemLatex`, `startDeriv`, `setColor`, `quickSave`, `duplicateActive`, `runCalc`, `undo`, `help`, `toggleChrome`, `toggleFull`, `presIdle`/`endPresent`, `closePop`/`openPop`, `focusBlock`, diálogos abiertos (convendría preguntar a un servicio de diálogos si hay modal activo) |
| `js/ui/shortcuts-pick.js` | 7239-7243 | `picking`, `endPick`, `pkUse` |
| `js/blocks/keys-block.js`, `js/blocks/keys-deriv.js` | 5284-5316, 5055-5120 | módulo de bloques (`moveBlock`, `deleteBlock`, `addBlockAfter`, `focusCell`, `removeRow`, `rebuildDeriv`) |
| `js/ui/mathlive-config.js` | 4760-4768 | MathLive, `cssVar`, `COLOR_NAMES` |
