# Operaciones de trigonometría y geometría (`OPS`)

Fuente: `pizarra.html:3959-4525` (sección «14. Trigonometría y geometría»). Convenciones de bloques y errores como en `operaciones-algebra.md`; en el `switch` de la interfaz todas reciben `full` (`pizarra.html:7296-7301`). Ejemplos reales: `tests/golden/cases.js` y `expected.json` (`angleConvert`, `trigRatios`, `notableTable`, `solveTriangle`, `linesRelative`, `transversal`).

Bloques propios de este grupo:
- `{type:'deriv', rows}` y `{type:'table', head, rows, kind:'trig', hlines, caption}`.
- `{type:'geo', kind, ...}`: figuras que dibuja la interfaz. Variantes: `unit` (círculo unidad con `deg`, `label`), `unitAll` (círculo con todos los ángulos notables), `tri` (`a,b,c,A,B,C,label`), `lines` (`lines:[{a,b,c,name,dash}]`, `points:[{x,y,name,kind}]`) y `transv` (`deg`).

## Infraestructura de lectura (`pizarra.html:3959-4115`)

Esta sección usa **su propio mini-analizador**, distinto de `ME` y de `parseExpr`:

| Función | Línea | Qué hace |
|---|---|---|
| `geoText(latex)` | 3961 | LaTeX -> texto plano: `^{\circ}`/`\degree` -> `°`, `\prime` -> `′`, `''` -> `″`, griegas a símbolos, `\frac`/`\sqrt` a `((a)/(b))`/`sqrt(x)` |
| `geoSplit(t)` | 3983 | separa por `,` o `;` de primer nivel (si hay `;` la coma puede ser decimal) |
| `geoParse(s)` / `geoNum(ast)` | 3997 / 4036 | expresiones con números, `π`, `sqrt`, `x`, `y`, `+ - * / ^`, multiplicación implícita; evaluación en coma flotante |
| `geoLin(ast)` | 4053 | forma lineal **exacta** `{x, y, c}` en fracciones (para rectas); error «La ecuación no es lineal (no es una recta).» |
| `ratNear(v, maxD)` | 4069 | racional cercano de denominador pequeño (tolerancia 1e-9) |
| `piLatex/piText`, `degL/degT`, `dmsOf/dmsL/dmsT`, `radLatexOf/radTextOf`, `degExact`, `mod360` | 4075-4115 | formato de ángulos |
| `parseAngle(text, defUnit)` | 4095 | lee `150°`, `35°20′15″`, `5π/6`, `\frac{5\pi}{6}`, `2.5 rad`; **un número sin unidad se toma en grados**; devuelve `{deg, unit, dms?, parts?, rad?, piQ?, bare?}` |

## 1. Ángulos: conversión y posición

- **Clave**: `ang` -> `OPS.angleConvert(full)` (`:4117`).
- **Para el profesor**: grados <-> radianes (con π exacto), grados-minutos-segundos, ángulo coterminal en [0°, 360°) y cuadrante.
- **Entrada**: uno o varios ángulos separados por coma/`;`: `150°`, `35°20′15″`, `\frac{5\pi}{6}`, `2.5 rad`, `30`. Si hay `x = ...`, se usa lo de la derecha.
- **Salida**:
  - Un ángulo: `[deriv, geo unit]`. Filas: conversión («multiplicamos por π/180» o «por 180°/π»), forma DMS si procede, coterminal si el ángulo es ≥ 360° o negativo, «Posición» (cuadrante I a IV o «sobre un eje», con signos de seno, coseno y tangente, `quadName/quadNote`, `:4157-4162`).
  - Varios ángulos: un único `table` (`Ángulo, Grados, Radianes, Decimal, G° M′ S″, En [0°, 360°)`).
- **Errores**: «Escribe un ángulo: 150°, 35°20′15″, \frac{5\pi}{6} o 2.5 rad.», «El ángulo no es un número.», «No entiendo «...».».

## 2. Razones trigonométricas

- **Clave**: `trig` -> `OPS.trigRatios(full)` (`:4195`).
- **Entrada**: un ángulo, con o sin nombre de razón: `\sin 150°`, `\tan 45°`, `5\pi/6`, `\cos 3\pi/4`. Reconoce `sen/sin, cos, tg/tan, cosec/csc, sec, cotg/cot`. Con razón: calcula sólo esa; sin razón: seno, coseno y tangente. Las inversas (`arcsin`...) lanzan «Esta operación calcula las razones de un ángulo...».
- **Salida**: `[deriv, table kind:'trig', geo unit]`. `deriv`: θ en grados y radianes, reducción a [0°, 360°), cuadrante y signos, **ángulo de referencia** α, y cada razón con su valor. La tabla muestra las 6 razones (definición, valor y decimal; «∄» si no existe, p. ej. tg 90°) y la comprobación sen²θ+cos²θ.
- **Valores exactos** (`EX_SIN`, `EX_TAN`, `EX_CSC`, `trigValue`, `:4164-4194`): sólo para ángulos de referencia múltiplos de 15° (0, 15, 30, 45, 60, 75, 90), con el signo del cuadrante (`sgnOf`); en el resto, decimal a 4 cifras («Valor aproximado con calculadora»).
- **Depende de**: `geoText`, `parseAngle`, `refAngle`, `quadOf`, `TRIG`, `dec/decT`.

## 3. Tabla de ángulos notables

- **Clave**: `notable` -> `OPS.notableTable()` (sin entrada). La interfaz la trata **antes** de comprobar la línea activa (`pizarra.html:7247`), por lo que funciona sin cursor en una línea.
- **Salida**: `[table, geo unitAll]`. Tabla con 17 ángulos (0°, 30°, 45°, 60°, 90°, 120°... 360°): `Grados, Radianes, sen, cos, tg`, `hlines:[4,8,12]`, y un `caption` con la regla mnemotécnica de √0/2..√4/2 (`:4231`).

## 4. Resolución de triángulos

- **Clave**: `tri` -> `OPS.solveTriangle(full)` (`:4245`).
- **Entrada**: tres o más datos separados por comas, lados `a,b,c` y ángulos opuestos `A,B,C` (o `α,β,γ`): `a=5, b=7, C=60°`. Mínimo 3 datos y al menos un lado. Ángulos en grados por defecto (`parseAngle`).
- **Casos que resuelve** (según nº de lados `ns`):

| Datos | Caso | Método |
|---|---|---|
| 3 lados | LLL | teorema del coseno para A y B; C = 180° − A − B; comprueba desigualdad triangular |
| 2 lados + ángulo comprendido | LAL | coseno para el lado que falta, coseno para un ángulo, resta a 180° |
| 2 lados + ángulo no comprendido | LLA (ambiguo) | teorema del seno; da 0, 1 o 2 triángulos y explica por qué |
| 1 lado + 2 ángulos | ALA/AAL | tercer ángulo y teorema del seno |

- **Salida**: `[deriv, geo tri (uno por solución)]`. `deriv`: datos, caso, pasos con las fórmulas sustituidas, «Solución» (`boxed`, con `triKind`: equilátero/isósceles/escaleno y rectángulo/acutángulo/obtusángulo), área `S` (½·b·c·sen A) y perímetro. Resultados aproximados a 4 decimales (lados) y 2 (ángulos).
- **Errores**: «Escribe los datos así: a=5, b=7, C=60° (lados a, b, c; ángulos A, B, C opuestos).», «Hacen falta tres datos (con al menos un lado)...», «Con solo ángulos hay infinitos triángulos semejantes: añade un lado.», «Los ángulos suman 180° o más: no hay triángulo.», «Estos lados no cumplen la desigualdad triangular...», «Los lados deben ser positivos.», «Cada ángulo de un triángulo está entre 0° y 180°.», y en LLA «no hay triángulo» (seno > 1 o ángulos que superan 180°).
- **Casos no cubiertos o dudosos** (observación del código, no hay golden): con 4 o más datos no se comprueba la coherencia (se resuelve con el caso por nº de lados); con 1 lado y 3 ángulos el `find` del ángulo que falta es `undefined` y el resultado no está definido.

## 5. Rectas en el plano

- **Clave**: `lines` -> `OPS.linesRelative(full)` (`:4407`).
- **Entrada**: elementos separados por comas o `;`: **rectas** en cualquier forma lineal (`2x+3y-6=0`, `y=2x+1`, `x=3`, con nombre `r:y=2x`) y **puntos** `P=(1,2)` o `(1,2)`. Coeficientes racionales, sin π ni raíces (`geoLin`).
- **Combinaciones**:

| Datos | Resultado |
|---|---|
| 2 puntos | vector director, pendiente, ecuación continua, general y explícita, distancia, punto medio M |
| 1 recta | ecuación general, explícita, pendiente, vector normal |
| 2 rectas | comparación de coeficientes; secantes (punto de corte por Cramer, ángulo, perpendicularidad), paralelas (distancia) o coincidentes. Con más de 2 rectas sólo se comparan las dos primeras |
| recta + punto | distancia punto-recta, paralela y perpendicular por el punto, pie H de la perpendicular. Sólo se procesa el primer punto (`:4498`) y la primera recta |

- **Salida**: `[deriv, geo lines]` con `geo = {type:'geo', kind:'lines', lines:[{a,b,c,name,dash}], points:[{x,y,name,kind:'cut'|'mid'}]}` (rectas auxiliares con `dash:true`).
- **Errores**: «No reconozco «...». Escribe rectas (2x+3y-6=0, y=2x+1, x=3) y puntos P=(1,2), separados por comas.», «Escribe dos rectas (...), una recta y un punto ... o dos puntos ...», «Los dos puntos son el mismo.», ««...» no es una recta: no tiene x ni y.», «La ecuación no es lineal (no es una recta).».
- **Depende de**: `geoText`, `geoSplit`, `geoParse`, `geoLin`, `lineOf` (4359), `pointOf` (4375), `genL`, `explicitL`, `overSqrt`, `termL`, `sqrtSimp`, `sqrtLatex`, `latexText`, `dec`, `fParen`.

## 6. Paralelas cortadas por una secante

- **Clave**: `transv` -> `OPS.transversal(full)` (`:4505`).
- **Entrada**: un ángulo, 0° < α < 180°: `65°`.
- **Salida**: `[deriv, table, geo transv]`. `deriv`: ángulos 1̂ a 8̂ con su justificación (opuestos por el vértice, adyacentes/suplementarios, correspondientes, alternos internos/externos, conjugados). Tabla `Ángulo, Medida, Relación` para los 8 ángulos (sólo hay dos medidas: α y 180°−α).
- **Error**: «Escribe un ángulo entre 0° y 180°, por ejemplo 65°.».

---

## Propuesta de módulos (este grupo)

| Fichero | Líneas | Contenido |
|---|---|---|
| `js/engine/ops/geo-base.js` | 3959-4115 | `geoText`, `geoSplit`, `geoParse`, `geoNum`, `hasPi`, `geoLin`, `ratNear`, `piLatex/piText`, `degL/degT`, `dmsOf/dmsL/dmsT`, `parseAngle`, `degExact`, `radLatexOf/radTextOf`, `mod360` |
| `js/engine/ops/angulos.js` | 4117-4162 | `angleConvert`, `quadOf`, `ROM`, `quadName`, `quadNote` |
| `js/engine/ops/trigonometria.js` | 4163-4241 | `EX_*`, `TRIG`, `sgnOf`, `refAngle`, `trigValue`, `trigRatios`, `notableTable` |
| `js/engine/ops/triangulos.js` | 4243-4356 | `SIDE`, `ANG`, `solveTriangle`, `triKind` |
| `js/engine/ops/rectas.js` | 4358-4525 | `lineOf`, `pointOf`, `genL/genT`, `explicitL`, `ptL`, `overSqrt`, `sqF`, `linesRelative`, `transversal` |

Dependencias cruzadas:
- **Compartidos de otras secciones**: `dec`/`decT` (estadística, `:3669`) en todos los módulos; `sqrtSimp`/`sqrtLatex` (vectores, `:2566-2575`) y `termL` (`:1792`) en `rectas.js` y `triangulos.js`; `latexText` (`:2842`) en `angulos.js`/`rectas.js`; `fParen`, `fLatex`, `gcd`, `derivBlock`. Estos deben ir a `ops/common.js` antes de extraer la geometría.
- `trigonometria.js` y `triangulos.js` dependen de `geo-base.js` (`parseAngle`, `degL`, `ratNear`); `trigonometria.js` usa `quadOf/quadName/quadNote` de `angulos.js` (ciclo si `angulos.js` usara `trigValue`; no lo hace).
- `geo-base.js` no depende de `ME` ni de `parseExpr` (sólo fracciones `fr` y `MErr`).
- Exportados hoy (`pizarra.html:4537`): `angleConvert, trigRatios, notableTable, solveTriangle, linesRelative, transversal, geoText, parseAngle`. `geoText` y `parseAngle` son API pública además de las seis operaciones.
