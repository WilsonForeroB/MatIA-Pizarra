# Gráficos y bloques visuales

Tipos tratados: `table`, `graph`, `graph3d`, `solid` (§13), `chart`, `ptree`, `geo`, `venn`, `net`, más el asistente de red neuronal, el asistente de Bayes, el panel «Gráficos» y la exportación como imagen. Todo está en la IIFE de `pizarra.html` (rango 5739-6982). Formato de datos de cada tipo: `docs/FORMATO-JSON.md`; ciclo de vida común (crear, borrar, activar): `docs/funcionalidades/bloques.md`.

## 0. Piezas compartidas

| Pieza | Líneas | Uso |
| --- | --- | --- |
| `SVGNS` | 5806 | Namespace SVG; lo usan `graph`, `chart`, `geo`, `ptree`, `venn`, `net`, `svgForExport`. |
| `niceStep(r)` | 5807-5810 | Paso «redondo» de rejilla (1, 2, 5, 10 × 10^k) para ~8 divisiones. `graph`, `chart`, `geo`. |
| `fmtNum(v)` | 5811 | Número con coma decimal y signo menos tipográfico (3 decimales). `graph`, `geo`. |
| `fmtC(v)` | 6231 | Igual pero entero si \|v\| ≥ 100. Solo `chart`. |
| `MARK_TXT`, `markPath(kind,x,y,r)`, `markLegend(marks)` | 5789-5804 | Marcas de extremos/inflexión/silla (forma + color + rótulo). `graph` y `graph3d` (3d usa `new Path2D(markPath(...))`). |
| `cleanMarks`, `MARK_KINDS` | 4585-4589 | Saneado de `marks`; en la zona de estado. |
| `redrawers` (Set) | 5922 | Funciones `draw` de los `graph3d` vivos; `refreshColors()` (7405) las llama al cambiar el tema. Único mecanismo de «repintado por tema» (los SVG se repintan solos con variables CSS `var(--data-N)`). |
| `hexRGB`, `mixRGB` | 5923-5927 | Colores para el canvas 3D. |
| Helpers `el`/`txt`/`mk` | repetidos en `buildGraph` 5833, `buildChart` 6236-6238, `buildGeo` 6325-6326, `buildPTree` 6507-6508, `buildVenn` 6615, `buildNet` 6768 | Cada uno redefine su propia versión de «crear elemento SVG con atributos y clase». Candidato a helper común. |

Convención de clases CSS: contenedor por tipo (`.graph`, `.g3d`, `.chart`, `.geo`, `.ptree`, `.venn`, `.net`, `.mtable-wrap`); todos con `tabIndex=0`. El CSS de cada clase está fuera de este rango (bloque `<style>` al inicio de `pizarra.html`).

Parámetro `ro` (solo lectura): lo reciben `buildGraph`, `buildGraph3d`, `buildVenn`, `buildNet`. Con `ro=true` (impresión, `printAll` 7772) se omiten controles y listeners. `buildTable`, `buildChart`, `buildGeo`, `buildPTree` no tienen controles.

Ninguno de los tipos visuales se edita con el teclado de bloque: el listener central ignora `.net,.g3d,.graph,.venn,.chart,.ptree,.geo` (5285).

---

## 1. `table` — `buildTable(b, bd)` (5740-5787)

- **Ve el usuario**: una tabla HTML (Ruffini, valores, tabla de verdad, frecuencias, signos…) con cabecera opcional, barra vertical, rayas horizontales, celda destacada y pie.
- **Controles**: ninguno; no es editable desde la interfaz (se crea desde operaciones del motor).
- **Cómo se dibuja**: DOM `<table class="mtable <kind>">`, `<thead>` si hay `head`, `<tbody>`; `vbar` → clase `vbar` en la columna `vbar-1`; `hline/hlines` → clase `hline` en la `tr`; `mark` → clase `mark` en `[fila,col]`; `lastBold` → `bold`; `kind==='truth'` marca `V` con clase `t` (5757); `kind==='ruffini'` sin `mark` marca el último valor no vacío de cada fila par (resto, 5762-5764); `caption` → `<p class="mtable-cap">`.
- **No es exportable** (no está en `EXPORTABLE`).
- Depende solo de `$$`.

## 2. `graph` — `buildGraph(b, bd, ro)` (5812-5920)

- **Ve el usuario**: gráfica 2D de hasta 6 funciones con rejilla, ejes, escala automática en Y, leyenda y marcas notables (máx., mín., inflexión, absolutos) con su leyenda.
- **Controles** (solo si `!ro`, 5895-5917): una lista visible de funciones (un campo por función, «+ Añadir función» hasta 6 —pone el cursor en la nueva—, × para quitar), una **ayuda de Pío** (`.g-help`) que dice que caben varias funciones y cómo moverse, campos «x desde / hasta» e «y desde / hasta» (vacíos = automático), y un panel de botones Acercar, Alejar, ←↑↓→ y Ajustar. **La rueda ya no hace zoom**; **arrastrar** desplaza (se ignora si el modo es `draw` o es lápiz, 5913).
- **Texto plano**: las funciones pasan por `OPS.normalizeFn` (`engine/ops/analisis.js`) antes de `compileFn`, así que `sin x`, `sen x`, `ln x` o `x^(1/2)` funcionan. Ver `operaciones-analisis.md` §5.
- Capturas: `docs/img/grafica-2d.png`.
- **Cómo se dibuja**: SVG de viewBox 720×400, `pad=28`. `draw()` (5833-5893):
  1. compila cada función con `OPS.compileFn(src)` (error → mensaje «Aviso: no puedo dibujar…» en `.g-err`);
  2. muestrea 900 puntos; rango Y = percentiles 2%–98% con margen y ajustes para que el eje 0 quede visible; las marcas amplían el rango;
  3. rejilla y ticks con `niceStep`; ejes; curvas como `path` cortando en discontinuidades (saltos > 1,5× el rango) y límites; color `var(--data-<k%6+1>)`, trazo discontinuo por función (`i>0`);
  4. leyenda con la fuente de la función normalizada a texto; marcas con `markPath` y etiquetas que evitan solaparse; anillo para absolutos.
- **Estado persistente**: `b.fns`, `b.xmin`, `b.xmax`, `b.ymin`, `b.ymax` (opcionales, solo si el usuario fija el rango Y) y `b.marks`.
- **Exportable** (PNG/SVG/copiar).
- **Particularidades**: el factor `720 / 664` del arrastre (5914) es un número mágico (ancho útil del SVG en pantalla); el zoom con rueda modifica el modelo sin comprobar `xmax>xmin` mínimo.

## 3. `graph3d` — `compile3d` (5928-5937) y `buildGraph3d(b, bd, ro)` (5938-6064)

- **Ve el usuario**: una o varias superficies `z = f(x,y)` (hasta 4, `b.fns`) sombreadas en canvas, caja y ejes, rótulos x/y/z, valores extremos de z, marcas 3D (mín., máx., silla) con línea discontinua a la base y leyenda. Con una superficie el color va por altura (`data-2 → data-1 → data-3`); con varias, cada una tiene su color (`data-1…`) y aparece una leyenda `.g-legend`. Pie `g-cap` con la ecuación y los rangos.
- **Controles** (si `!ro`): lista de superficies como la gráfica 2D (campo de fórmula, muestra de color, «×» y **«+ Añadir superficie»**); **ayuda de Pío** (`.g-help`) que explica que caben varias superficies y cómo girar; rangos x/y. Sobre el dibujo, **panel de vista** (`.v3-pad`, de `canvas3d.viewPad`): acercar, alejar, girar ⟲ ⟳, inclinar ▲ ▼ y **⌂ vista inicial** (centra el dibujo). Con el foco en el dibujo: flechas, `+`/`−` y `0`. **Arrastrar** = rotar (`az`, `el` acotado ±1,45); el aviso «Arrastra el dibujo para girarlo» desaparece tras el primer giro. Tocar el dibujo activa su línea, así «Centro» lo centra. Las gráficas nuevas del panel «Gráficos» (2D, 3D y sólido) salen centradas.
- **Cómo se dibuja**: `<canvas>` 2D propio (sin WebGL), con `canvas3d.projector` y `canvas3d.paintQuads`. Malla 38×38 (30 o 24 con varias superficies), z normalizado al percentil 1–99 de todas, y todas las caras se ordenan juntas por profundidad (algoritmo del pintor) para que las superficies se corten bien. `draw(expScale)` solo acepta escalas de 0 a 8: antes `requestAnimationFrame(draw)` pasaba la marca de tiempo como escala y el lienzo crecía a cientos de miles de píxeles y **quedaba en blanco al girar**.
- **Compilación**: `compile3d(src)` normaliza el texto plano con `normalizeFn` (como la 2D), quita el prefijo `z=`/`f(x,y)=`, parsea con `OPS.parseExpr(rhs,{var:'x'})`, comprueba que solo haya variables `x` e `y` (si no, `ME.MErr`) y evalúa con `OPS.evalNum(ast,{x,y})`; `latex = OPS.L(ast)`.
- **Ciclo de vida**: registra `draw` en `redrawers` (tema) y un `ResizeObserver` por bloque que **nunca se desconecta** (6063); `draw` se da de baja de `redrawers` cuando `!box.isConnected` (5960). `cv3._draw = draw` lo usa la exportación.
- **Exportable** solo PNG/copiar (el SVG se oculta para `graph3d`, 6073).

## 4. `chart` — `buildChart(b, bd)` (6232-6317), subtipos por `b.kind`

Un único contenedor `.chart` con `<p class="c-title">` y un SVG de ancho 720; helpers `el`/`txt` propios.

| `kind` | Líneas | Qué se ve |
| --- | --- | --- |
| `bars` | 6244-6264 | Barras con rejilla y eje Y con `niceStep`; `hi` (índices) resalta barras con clase `hi`; etiquetas X si ≤30 barras; valor sobre la barra si ≤16 (`valueLabels` o `fmtC`); `ylabel`. `aria-label` enumera los valores. |
| `box` | 6265-6290 | Diagrama de caja con bigotes `min..max`, caja `q1..q3`, mediana, rombo de la media opcional, puntos `data` y rótulos `mín, Q₁, Me, Q₃, máx`; añade una leyenda `.mk-legend` propia (con `innerHTML`). |
| `normal` | 6291-6316 | Campana de Gauss N(μ,σ) a ±4σ, área sombreada entre `a` y `b` (si hay alguno y `c>a`), ticks de μ±kσ (k = −3..3) y líneas de corte con valor. |

- **Controles**: ninguno. **Exportable**. Se crea desde el motor (`statsSummary`, `freqTable`, `sampleSpace`, `binomial`, `normal`).
- Cuidado: `box` y `normal` no validan `min/max/q1/med/q3` ni `mu` (en `sanitize` son `null` por defecto y el dibujo hace aritmética con ellos).

## 5. `geo` — `buildGeo(b, bd)` (6319-6500)

Un contenedor `.geo` con `<p.c-title>`, SVG 720 de ancho y, si procede, leyenda `.g-legend` (helper `leg(texto, color, dash)`; los colores se pasan con `style --sw`). Constantes `R2D/D2R`, `fmtD` (grados), `arcPath(cx,cy,r,t0,t1,closed)` (sector antihorario).

| `kind` | Líneas | Qué se ve |
| --- | --- | --- |
| `unit` | 6341-6390 | Circunferencia goniométrica con ejes, cuadrantes I–IV, ángulo `deg` con sector, seno/coseno/tangente coloreados (tangente solo si \|tg\|<2,3), punto P con coordenadas y leyenda. `label` sustituye al valor de θ en el título. |
| `unitAll` | 6351-6371 (misma rama) | 16 ángulos notables con grados y radianes. |
| `tri` | 6391-6426 | Triángulo escalado y centrado con ángulos (arco o marca de recto a 90°), vértices A/B/C y lados a/b/c. Se construye con `c`, `b`, `A`; los demás valores solo se rotulan. |
| `lines` | 6427-6467 | Plano cartesiano que se encuadra automáticamente alrededor de rectas `ax+by+c=0` (nombre, equación en leyenda, discontinua opcional) y puntos (`cut`, `mid`, normal). |
| `transv` | 6468-6498 | Dos paralelas `r ∥ s` cortadas por la secante `t`; 8 ángulos numerados α / 180°−α con leyenda. |

- **Controles**: ninguno. **Exportable**. Se crea desde el motor (`angleConvert`, `trigRatios`, `notableTable`, `solveTriangle`, `linesRelative`, `transversal`).

## 6. `ptree` — `buildPTree(b, bd)` (6503-6535)

- **Ve el usuario**: árbol de probabilidad de dos niveles (raíz → causas → suceso / contrario) con probabilidades en las ramas y, a la derecha de cada hoja, `P(causa ∩ suceso) = producto`. El suceso contrario se rotula con un `U+0305` combinante (`bar()`, 6510). Leyenda `.mk-legend` explicativa.
- **Cómo se dibuja**: SVG 720 × `max(220, n·116+30)`; texto de las probabilidades **ya formateado** (strings).
- **Controles**: ninguno. **Exportable** (con `exportTexts` especial: su leyenda se pasa como texto inferior, no como leyenda de colores, 6091).
- **Se crea con el asistente de Bayes** (§7).

## 7. Asistente de Bayes (diálogo `#bayesDlg`) (6537-6584)

- **Ve el usuario**: diálogo modal con campo «suceso» y tabla de 2–6 causas (nombre, P(causa), P(suceso | causa)), previsualización «N causas · todo correcto» o el error de validación, botones Añadir/Quitar causa, Aceptar, Cancelar.
- **Código**: `bayesRow`, `bayesHeader`, `bayesData`, `bayesPrev` (valida con `OPS.bayes(causes, ev)`), `openBayes()` (devuelve una `Promise` que resuelve con los datos o `null`), `runBayes()` (6576): `OPS.bayes` devuelve las specs (`ptree` + `deriv`) que se insertan con `insertSpecs(b.id, specs, b)`.
- **Se invoca** desde el menú «Operaciones» (`startPick` → `if (key==='bayes') runBayes()`, `pizarra.html:7246`).

## 8. `venn` — `buildVenn(b, bd, ro)` (6606-6720) y datos 6587-6605

- **Ve el usuario**: diagrama de Venn de 2 o 3 conjuntos dentro de un rectángulo universal `U`, con la región sombreada (trama diagonal) y, opcionalmente, los elementos de cada conjunto dentro de las zonas; debajo, texto de resultado `expr = {…}`.
- **Controles** (si `!ro`, 6674-6720): selector «2 conjuntos / 3 conjuntos» (`mi-seg`), campo de expresión (`A ∩ B`, `(A ∪ B)ᶜ`, `A ∖ B`, `Δ`; se aplica con `change`/Intro), teclado de símbolos `∪ ∩ ∖ ᶜ Δ ( ) A B C U`, casilla «Elementos», botón «Limpiar» y **clic en una zona** para sombrearla a mano (pasa de modo expresión a modo manual copiando `lastMasks`).
- **Cómo se dibuja**: SVG 720×420, `VENN_LAYOUT` por `n` con círculos, nombres y puntos de anclaje de elementos (6588-6591). `render()` (6620-6673): calcula máscaras con `OPS.vennEval(expr, VENN_NAMES, n)` o usa `b.shade`; cada zona se pinta con `<mask>` + `clipPath` anidados (ids únicos con `uid0 = 'v'+random`); los elementos vienen de `OPS.vennElements(pageLines(), VENN_NAMES, n)` leyendo **las demás líneas de la página**; `setPretty` convierte LaTeX a símbolos. `maskAt(e)` convierte el clic en máscara de bits.
- **Estado**: `b.n`, `b.expr`, `b.shade`, `b.showEls`.
- **Exportable**. `vennExprFrom(src)` (6594) extrae la expresión de una línea tipo `X = A ∩ B` (lo usa el panel Gráficos).
- **Acoplamiento**: `pageLines()` (6601) accede a `page().blocks` y a `deriv.rows`; `ME.MErr` para el error de expresión vacía.

## 9. `net` — `buildNet(b, bd, ro)` (6763-6910), `nnBuild` (6731-6761)

- **Ve el usuario**: grafo (dirigido o no) en SVG 720 × `b.h` con nodos circulares (color por capa `k-in/hid/out/bias`), aristas con peso opcional y rótulos de capa al pie.
- **Controles** (si `!ro`): barra con herramientas **Mover / Nodo / Arista / Borrar**, casilla «Dirigido», botones «Red neuronal…» (abre el asistente y sustituye el grafo, con confirmación vía `ask`), «Matriz de adyacencia» (inserta dos líneas `math` con `insertSpecs` bajo el grafo) y «Vaciar» (con `ask`); pista de uso. Clic en hueco = añadir nodo; arrastrar de nodo a nodo = arista; **doble clic** en nodo/arista = renombrar/poner peso (`editText` crea un `<input>` flotante); Supr con el contenedor enfocado borra el nodo seleccionado. Doble clic propio (400 ms) porque el SVG se redibuja entre clics (6860).
- **Cómo se dibuja**: `render()` (6774-6797) reconstruye todo el SVG en cada cambio; marcador de flecha con id `arr-<b.id>`; aristas con zona de captura `net-hit`; si hay más de 60 aristas se afinan. `pt(e)` convierte coordenadas de pantalla a viewBox.
- **`nnBuild(sizes, bias, showW)`** devuelve `{nodes, edges, caps, directed:true, h}` para una red por capas: etiquetas `x₁…`, `h¹₁…`, `ŷ₁…`, sesgos `+1`, pesos `w¹₁₂`/`b¹₁` si `showW`. Usa `uid()` y los subíndices `sub/sup` (6723-6725).
- **Estado**: `b.nodes`, `b.edges`, `b.caps`, `b.directed`, `b.h`. **Exportable**.
- **Dependencias fuera del bloque**: `ask` (7638), `openNN`, `insertSpecs`, `toast`, `uid`, `body.dataset.mode`, `save`.

## 10. Asistente de red neuronal (diálogo `#nnDlg`) (6912-6942)

- **Ve el usuario**: campo «capas» (p. ej. `3, 4, 4, 2`, 2–7 capas, 1–10 neuronas), casillas de sesgo y pesos; previsualización «Entrada 3 · Oculta 4 · … → N conexiones» o el error.
- **Código**: `nnParse()` valida y devuelve `{sizes, bias, showW}`; `openNN()` devuelve una `Promise` (resuelve `null` si se cancela o se cierra); Intro en el campo pulsa Aceptar.
- Lo invocan el botón de `buildNet` y el panel Gráficos (`data-graf="nn"`).

## 11. Panel «Gráficos» (`#grafPop`) (6944-6982; HTML en 680-686)

Menú con 4 opciones con icono (`2d`, `3d`, `net`, `venn`) y el botón «Asistente de red neuronal…» (`nn`). Un único `click` delegado:

1. `closePop()`, `syncActive()` y deduce `src` de la línea activa (fórmula `math`, o fila activa de un `deriv` como `l=r`, vía `derivRowIndex`).
2. **`2d`**: si `src` compila con `OPS.compileFn` lo usa; si no, `f(x)=x^2`. `insertSpecs(after, [{type:'graph', fns, xmin:-5, xmax:5}], b)`.
3. **`3d`**: si `src` pasa `compile3d` y contiene `y`, lo usa; si no, `z=\sin(x)\cos(y)`; rango −3..3, `az -0.8`, `el 0.55`, `zoom 1`.
4. **`net`**: grafo de ejemplo de 5 nodos A–E con 5 aristas, `directed:false`, `h:420`.
5. **`venn`**: si `src` es una expresión válida (`vennExprFrom` + `OPS.vennEval`) la usa; si no, `A\cap B`; `n` según `vennEval`.
6. **`nn`**: abre el asistente y inserta `Object.assign({type:'net'}, nnBuild(...))`.
En los casos por defecto lanza un `toast` que explica dónde escribir la función.

## 12. Exportar como imagen (6067-6228)

- **Ve el usuario**: botón con flecha en cada bloque `EXPORTABLE` (`graph, graph3d, net, venn, chart, ptree, geo`, 6068) que abre `#expPop` (HTML 671-679) con «Descargar PNG (alta resolución)», «Descargar SVG (vectorial)», «Copiar imagen» y la casilla «Fondo claro (para documentos)» (`#expLight`, marcada por defecto).
- **Flujo** `doExport(kind)` (6188-6226): fija el destino en `expTarget = {b, el}` (`openExport`, 6071); con «fondo claro» y tema oscuro **cambia temporalmente `data-theme` a `light`** y llama `refreshColors()` (espera 2 frames), y lo restaura en `finally`.
  - `graph3d`: pide a su `cv3._draw(escala)` repintar a ×2, `canvasToPngBlob(canvas, caption, bg)` añade fondo y pie, y vuelve a repintar a escala normal. SVG no disponible.
  - Resto: `svgForExport(svg, exportTexts(el), bg)` clona el SVG y **inlinea los estilos computados** (`SVG_PROPS`) porque el CSS no viaja con el SVG, añade fondo, título (`.c-title`), leyenda en filas y texto inferior (`.v-res`, `.g3d .g-cap`, leyenda de ptree); `svgToPngBlob` rasteriza vía `Image` + `canvas` a ×2.
  - `kind==='copy'` usa `navigator.clipboard.write(ClipboardItem)`; si no, `download(blob, nombre)` (nombre = `EXP_NAME[type]-fecha_hora`, 6069).
- **Acoplamientos**: depende de nombres de **clases CSS** de cada tipo (`.c-title`, `.g-legend span`, `.mk-legend span`, `.v-res`, `.g3d .g-cap`, `.ptree`, y el selector `.graph svg, .net svg, .venn svg, .chart svg, .ptree svg, .geo svg`, 6215), de `openPop/showPop/closePop` (5516-5539), de `isDark`, `root`, `refreshColors`, `cssVar` y `toast`.

---

## 13. `solid` — sólido de revolución (`js/blocks/solid.js`, `js/blocks/canvas3d.js`)

- **Ve el usuario**: en vertical, el perfil 2D de y = f(x) entre `a` y `b` con la recta de giro (`.sol-profile`), debajo el sólido 3D que gira (`.sol-wrap`, canvas) con el mismo panel de vista que la superficie (zoom, girar, inclinar, ⌂), y al final el volumen con su integral y el método (`.sol-vol`). Captura: `docs/img/solido-revolucion.png`.
- **Controles** (si `!ro`): campo de la función, campos `a` y `b`, selector de eje (`x`, `y`, `y = k`, `x = k`) con campo `k` visible solo para las rectas, **arrastrar** para girar la vista (`az`, `el`) y botones **+ / −** de zoom.
- **Volumen**: `volume(F, b)` integra numéricamente con Simpson (1000 subintervalos). Si el giro es horizontal (`x` o `y = k`) usa discos o arandelas, `π∫(f−k)²`; si es vertical (`y` o `x = k`) usa capas cilíndricas, `2π∫|x−k|·|f|`. `exactVolume` intenta el valor exacto con `OPS.integralLine` (p. ej. `8π`), y en capas solo si `x−k` y `f` no cambian de signo en `[a, b]`; si no puede, muestra el aproximado.
- **Canvas 3D**: `canvas3d.js` es un proyector 2D propio (`c3.projector({az, el, zoom, W, H, k})`), compartido por el sólido; no usa WebGL.
- **Sin pizarra**: `solid.js` no requiere `model/board`; usa `MatIA.require` con enlace tardío. **Debe cargarse antes que `model/board.js`** (el saneador de `solid` tiene que estar registrado al crearse el tablero).
- **Menú**: Gráficos ▾ → «Sólido de revolución».
- **Estado**: `fn`, `a`, `b`, `axis`, `k`, `az`, `el`, `zoom` (ver `FORMATO-JSON.md` §4.12).

## Acoplamientos problemáticos (gráficos)

1. `refreshColors` ↔ `redrawers`: solo `graph3d` se registra; es un Set global compartido con el tema (7405).
2. `exportTexts` conoce la estructura interna (clases) de cada tipo; añadir un tipo exportable exige tocar `EXPORTABLE`, `EXP_NAME`, `exportTexts` y el selector SVG.
3. `buildVenn` lee el contenido de otras líneas (`pageLines()` → `page().blocks`).
4. `buildNet` abre diálogos y confirmaciones (`ask`, `openNN`) y escribe en el tablero (`insertSpecs`) → depende del host, no es una vista pura.
5. Helpers SVG duplicados 6 veces; `niceStep`, `fmtNum`, `fmtC`, `markPath`, `markLegend` repartidos como variables globales de la IIFE.
6. `ResizeObserver` de `graph3d` sin `disconnect`; ids duplicados (`arr-<id>`) entre pantalla e impresión.
7. `buildGraph`: constante mágica `720/664` en el arrastre.
8. Los `build*` leen `body.dataset.mode` (modo `draw`) directamente para ignorar el puntero.

## Propuesta de módulos

Contrato: `register({ type, sanitize, create, render(b, bd, ctx), renderPrint(b, bd, ctx), exportable, exportName, exportTexts? })`, con `ctx = { save, toast, ask, uid, OPS, ME, cssVar, isDark, getMode(), onThemeChange(fn) → off, insertSpecs, pageLines(), svg: { NS, niceStep, fmtNum, fmtC, el }, marks, openDialog }`. `ro` pasa a ser una función distinta (`renderPrint`) o `ctx.readOnly`.

| Fichero propuesto | Líneas origen | Qué necesita del exterior |
| --- | --- | --- |
| `js/blocks/svg-util.js` | 5806-5811, 6231, helpers `el/txt/mk` | Nada (puro). Exporta `SVGNS`, `niceStep`, `fmtNum`, `fmtC`, `svgEl(parent)`. |
| `js/blocks/marks.js` | 4585-4589, 5789-5804 | Nada (puro). Lo usan `graph` y `graph3d` y sus `sanitize`. |
| `js/blocks/table.js` | 5739-5787 | `$$`. |
| `js/blocks/graph.js` | 5812-5920 | `OPS.compileFn`, `save`, `body.dataset.mode` (como `ctx.getMode()`), `svg-util`, `marks`. |
| `js/blocks/graph3d.js` | 5921-6064 | `OPS.parseExpr/evalNum/L`, `ME.MErr`, `save`, `cssVar`, `getComputedStyle(body)` (fuentes `--font-sans/--font-mono`), `redrawers` (como `ctx.onThemeChange`), `body.dataset.mode`, `marks`, `ResizeObserver`. Debe exponer `canvas._draw(scale)` o `exportRaster(scale)` para exportar. |
| `js/blocks/chart.js` | 6231-6317 | `svg-util` solamente (sin `save`, sin `toast`). |
| `js/blocks/geo.js` | 6318-6500 | `svg-util` solamente. |
| `js/blocks/ptree.js` | 6501-6535 | `SVGNS` solamente. |
| `js/dialogs/bayes.js` | 6537-6584 | DOM `#bayesDlg`, `pioBadge`, `OPS.bayes`, `insertSpecs`, `activeBlock`, `toast`. Registra la operación `bayes`; `startPick` (7246) lo invoca. |
| `js/blocks/venn.js` | 6586-6720 | `OPS.vennEval`, `OPS.vennElements`, `ME.MErr`, `pageLines()` (inyectado: lista de fórmulas de la página), `save`, `body.dataset.mode`, `$$`. |
| `js/blocks/net.js` (+ `nnBuild`) | 6722-6910 | `uid`, `save`, `toast`, `ask`, `openNN` (de `dialogs/nn.js`), `insertSpecs`, `body.dataset.mode`, `$$`, `svg-util`. |
| `js/dialogs/nn.js` | 6912-6942 | DOM `#nnDlg`, `pioBadge`. |
| `js/blocks/export.js` | 6067-6228 | `showPop/closePop/openPop` (mismo módulo de popovers), DOM `#expPop`/`#expLight`, `root`, `isDark`, `refreshColors` (con `onThemeChange`), `cssVar`, `toast`, `body`, `registry.get(type).exportName/exportTexts`. |
| `js/ui/grafPanel.js` | 6944-6982 (HTML 680-686) | `syncActive`, `derivRowIndex`, `insertSpecs`, `OPS.compileFn`, `compile3d` (de graph3d), `vennExprFrom` + `VENN_NAMES` (de venn), `nnBuild` (de net), `openNN`, `uid`, `toast`, `closePop`. |

Resumen de contexto mínimo por tipo: `table`/`chart`/`geo`/`ptree` no necesitan estado; `graph`/`graph3d`/`venn`/`net` necesitan `save` y el modo de entrada; `graph3d` además `onThemeChange` y `cssVar`; `venn` necesita `pageLines`; `net` necesita `ask`, `toast`, `insertSpecs`, `uid` y el asistente NN; `OPS`/`ME`: `graph` (`compileFn`), `graph3d` (`parseExpr`, `evalNum`, `L`, `MErr`), `venn` (`vennEval`, `vennElements`, `MErr`), Bayes (`bayes`).
