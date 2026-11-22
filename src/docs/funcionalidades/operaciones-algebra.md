# Operaciones de álgebra (`OPS`): matrices, vectores, ecuaciones, aritmética y polinomios

Fuente: `pizarra.html:1737-3056` (dentro de `const OPS = ((ME) => {...})(ME)`). Todas las operaciones **devuelven una lista de bloques** (`specs`) que la interfaz inserta tras la línea activa (`insertSpecs`, `pizarra.html:7340`) y lanzan `ME.MErr` con un mensaje en español si la entrada no vale (la interfaz lo muestra como aviso, `:7343`).

Tipos de bloque que producen estas operaciones:
- `{type:'math', v}`: una línea LaTeX (`math()`, `:1749`).
- `{type:'deriv', rows:[{l, r, note, boxed}]}`: desarrollo en filas con lado izquierdo `l`, derecho `r`, nota explicativa y marca de resultado `boxed` (`derivBlock()`, `:1750`).
- `{type:'table', rows, vbar, hline|hlines, mark, caption, kind}`: tabla (sólo Ruffini en este grupo).

Convenciones de entrada de la interfaz (`runOp`, `pizarra.html:7244-7260`): `src` = la celda `r` (o `l`) de la fila activa o el LaTeX de la línea; `full` = `l=r` si la fila tiene ambos lados; `env` = definiciones de las demás líneas (`ME.definitions`). Si `src` está vacío se lanza «La línea está vacía: escribe primero los datos.» (salvo `next, check, pascal, gauss, gj`).

## Helpers comunes que usa este grupo

| Helper | Línea | Uso |
|---|---|---|
| `math`, `derivBlock`, `fText`, `fNum`, `fParen`, `fact` | 1743-1751 | construir bloques y texto de fracciones |
| `P` (polinomios con coeficientes fracción) | 1754-1790 | `norm, deg, add, sub, scale, mul, pow, eval, isZero, divmod, latex` |
| `termL(c, sym, first)` | 1792 | término con signo (`+2x`, `-x`) |
| `rationalRoots(p)` | 1800 | raíces racionales (con multiplicidad) por divisores del término independiente y principal; devuelve `{roots, rest}` |
| `toPoly(ast, v)`, `terms(ast, v)`, `termsLatex`, `termText`, `hasParenOrFrac` | 2189-2230 | del árbol de expresiones a polinomio / lista de términos (ver `operaciones-analisis.md`) |
| `splitTop(toks, isSep)`, `lastSeg`, `matrixOf`, `squareOf`, `vm`, `pm`, `prodTxt` | 2233-2253 | utilidades de entrada y de impresión de matrices |
| `arrow(ops)` | 2268 | `\xrightarrow[..]{..}` (duplica `ME.arrowLatex`) |
| `sqrtSimp`, `sqrtLatex`, `coefI`, `latexText`, `topEqIndex` | 2566-2575, 2549, 2842, 2784 | definidos en medio de otras secciones pero de uso transversal |
| `quadRootsLatex(p, v, idx)` | 2719 | raíces de un cuadrático en LaTeX (usado también por `eigen`, `polyRoots` y `zerosOf` de extremos) |
| `polyFactorLatex(poly, roots, rest, v)` | 2766 | factorización en LaTeX |

`matrixOf(latex, env)` (`:2245`): toma el último miembro tras flechas y `=` (`lastSeg`, `:2244`, que usa `ME.afterArrows` y `ME.splitEq`), lo evalúa con `ME.evaluate` y exige matriz: «Necesito una matriz (o su nombre) en la línea.». Por eso valen `A`, `\begin{pmatrix}...\end{pmatrix}` o `A=\begin{pmatrix}...\end{pmatrix}`.

---

## 1. Matrices (`pizarra.html:2255-2547`)

| Clave menú | Función | Línea | Entrada (ejemplo) | Salida |
|---|---|---|---|---|
| `inv` | `inverseSteps(src, env)` | 2256 | `\begin{pmatrix}1&2\\3&4\end{pmatrix}` o `A` | varios `math`: `(A\,|\,I)=...`, un `math` por paso Gauss-Jordan (`\xrightarrow{F_{2}-3F_{1}}...`) y `A^{-1}=...`. Si el rango < n: `\operatorname{rg}(A)=k<n\Rightarrow\text{ A no tiene inversa}` |
| `detS` | `detSarrus(src, env)` | 2271 | `A` (3x3 del caso `cases.js`) | 1 `deriv`. 1x1: `math`. 2x2: diagonal principal menos secundaria. 3x3: regla de Sarrus con los 6 productos de tres elementos. n>3: delega en `detCofactor` |
| `detC` | `detCofactor(src, env)` | 2298 | matriz n×n | 1 `deriv`: desarrolla por la fila/columna con más ceros, signo (-1)^(i+j), calcula cada menor con `detValue`. n≤2 delega en `detSarrus` |
| `detG` | `detGauss(src, env)` | 2326 | matriz n×n | 1 `deriv`: triangulación con `F_i − k·F_j`, cambios de signo por intercambios, producto de la diagonal; columna sin pivote -> 0 (`fixFirst` une la primera fila) |
| `cramer` | `cramer(src)` | 2357 | `\begin{cases}2x+y=3\\x-y=0\end{cases}` (sin `env`) | 1 `deriv`: `\Delta`, `\Delta_x`, `\Delta_y`..., soluciones. Si Δ=0: aconseja usar Gauss |
| `prod` | `productDeveloped(src, env)` | 2375 | `A\cdot B` (dos matrices separadas por `\cdot`, `\times` o `*`) | 1 `deriv`: cada celda desarrollada `c_ij = Σ a_ik·b_kj` y el resultado |
| `param` | `paramDiscussion(src)` | 2455 | sistema cuadrado con un parámetro: `\begin{cases}x+y+az=1\\x+ay+z=1\\ax+y+z=1\end{cases}` | varios `math`: `(A|b)` con polinomios, `|A|` como polinomio, raíces racionales de `|A|`, caso general (SCD) y cada valor crítico del parámetro resuelto con `ME.solve` (SI/SCI/SCD) |
| `eigen` | `eigen(latex, env)` | 2498 | matriz cuadrada, p. ej. `\begin{pmatrix}2&0\\0&3\end{pmatrix}` | varios `math`: polinomio característico `|A-\lambda I|`, factorización, autovalores (con multiplicidad), subespacios `V_λ` con base y dimensión, y si es diagonalizable (`P`, `D`, `A=PDP^{-1}`) |

### Detalles y límites
- `inverseSteps` usa `ME.gauss(aug, {jordan:true, aug:n})`; la comprobación de existencia es por rango.
- `paramDiscussion`:
  - Parámetro = la única letra que no es incógnita (`x y z t w u v` o `x_{k}`, función `isUnknown`, `:2414`). Más de una letra libre: «Solo sé discutir sistemas con un parámetro...»; ninguna: «No encuentro el parámetro...».
  - Sólo sistemas **cuadrados**: «Por ahora discuto sistemas cuadrados...» (se lanza **después** de emitir `(A|b)`, por lo que no se muestra).
  - Usa `pterms` (`:2416`, términos con coeficiente polinómico en el parámetro), `detPoly` (`:2400`, cofactores por la primera fila) y `rationalRoots`. Las raíces irracionales de `|A|` sólo se mencionan, no se discuten.
- `eigen`: sólo autovalores racionales; un resto cuadrático se resuelve con `quadRootsLatex` (si Δ<0 sale `\lambda\notin\mathbb{R}`); resto de grado >2 se indica sin resolver. Hay código residual sin efecto (`vecsFor`, `Dg`, `void`, `:2538-2542`).
- `cramer` y `param` **no reciben `env`**: no sirven con matrices por nombre.

Errores típicos: «La inversa solo existe para matrices cuadradas y esta es 2×3.» (`squareOf`, `:2250`), «El determinante solo existe...», «Cramer necesita tantas ecuaciones como incógnitas (a y b).», «Cada ecuación debe tener exactamente un signo =.», «Escribe el producto de dos matrices, por ejemplo A\cdot B.», «Los dos factores deben ser matrices.».

Funciones internas de las que depende: `ME.{gauss, matLatex, det, M, rref, solve, parseSystem, evaluate, splitEq, afterArrows, tokenize}`, `P`, `rationalRoots`, `quadRootsLatex`, `detValue` (`:2270`), `minor` (`:2297`), `fixFirst` (`:2353`), `systemRows` (`:2443`), `parseExpr`/`varsOf` (árbol de expresiones).

---

## 2. Vectores (`pizarra.html:2550-2634`)

Entrada común (`vecsOf`, `:2551`): último miembro de la línea; dos vectores separados por `,` (o, si no, por `\cdot`/`\times`/`*`); cada vector puede ser tupla `(1,2,3)`, matriz fila/columna o un nombre definido (`u=\begin{pmatrix}1\\2\end{pmatrix}`).

| Clave | Función | Línea | Entrada | Salida |
|---|---|---|---|---|
| `dot` | `vecDot` | 2577 | `(1,2,3),(4,5,6)` | `deriv`: producto escalar; nota si es 0 (perpendiculares) |
| `cross` | `vecCross` | 2586 | `(1,0,0),(0,1,0)` | `deriv`: determinante simbólico i,j,k, menores, resultado. Sólo ℝ³ |
| `norm` | `vecNorm` | 2598 | `(3,4)` (1 vector) | `deriv`: `\sqrt{Σx²}` simplificada (`sqrtLatex`) con aproximación decimal |
| `angle` | `vecAngle` | 2607 | `(1,0),(0,1)` | `deriv`: `cos α = u·v/(‖u‖‖v‖)`, valor exacto y `α` en grados |
| `proj` | `vecProj` | 2624 | `(2,3),(1,0)` | `deriv`: `proy_v u = (u·v/‖v‖²) v` |

Errores: «Escribe dos vectores separados por coma o por ·...», «Las coordenadas deben ser números.», «Necesito vectores (una fila o una columna).», «Los vectores tienen distinta dimensión.», «El producto vectorial es para vectores de ℝ³.», «Un vector nulo no forma ángulo.», «No se puede proyectar sobre el vector nulo.».

Helpers propios: `dot` (2576), `tup`, `sqrtSimp` (2566; **compartido** con ecuaciones, estadística y geometría), `sqrtLatex` (2575).

---

## 3. Ecuaciones (`pizarra.html:2636-2843`)

| Clave | Función | Línea | Entrada | Salida |
|---|---|---|---|---|
| `solve` (línea suelta) | `solveEquation(latex)` | 2793 | `2x+1=5`, `x^2-5x+6=0` | 1 `deriv` con filas «Ecuación», pasos y solución; **la interfaz convierte la línea en ese desarrollo** (`pizarra.html:7315-7322`) |
| `solve` (dentro de un desarrollo) | `nextStep(rows)` repetido hasta 20 veces | 2799 | filas del `deriv` (la primera: ecuación `l=r`) | añade filas al desarrollo existente |
| `next` | `nextStep(rows.slice(0, ri+1))` | 2799 | idem | una fila nueva (`{l, r, note, boxed}`) o `null` si ya está resuelta |
| `check` | `checkSolution(rows)` | 2811 | desarrollo resuelto con filas `x = valor` (o `x_1`, `x_2`) | lista de filas «Comprobamos x = v: a = b ✓ se cumple» (sustituye en la ecuación original con `evalExact`, y si no es exacto compara numéricamente con tolerancia 1e-9) |
| (interna) | `eqSteps(l, r)` | 2696 | `'3x-2'`, `'7'` | `rows[]` (no bloque). Exportada y probada en `cases.js` |

Algoritmo lineal (`linearStep`, `:2652`), en este orden: forma `x = número` -> fin; multiplicar por m.c.m. si hay fracciones; quitar paréntesis; transponer términos (nota «El +3x pasa restando a la izquierda»); agrupar semejantes; despejar el coeficiente («pasa dividiendo» / «Cambiamos de signo»); simplificar fracción. Casos `0 = b`: «Se cumple siempre: infinitas soluciones» o «Imposible...».
Grado ≥ 2 (`quadSteps`, `:2735`): lleva todo a un miembro, discriminante `Δ = b²−4ac`, fórmula general con raíz simplificada, `Δ<0` sin soluciones reales, `Δ=0` solución doble. Grado >2: Ruffini con raíces racionales (`rationalRoots`) y resuelve el resto si es cuadrático; si no hay raíz racional lanza «No encuentro raíces racionales; esta ecuación de grado N no la sé resolver paso a paso.».

Restricciones de la incógnita (`eqVar`, `:2638`): preferencia `x, y, z, t`; si hay varias letras distintas: «Hay varias letras (...): de momento resuelvo ecuaciones con una incógnita.»; sin letra: «No hay incógnita en la ecuación.». Denominadores con la incógnita: «todavía no sé resolver ecuaciones racionales» (`terms`, `:2220`).

Entrada: `splitEquation` (`:2777`) parte por el único `=` de nivel superior (`topEqIndex`, `:2784`, equilibra `{}` y `\begin/\end`); error «Escribe una ecuación con un solo signo =, por ejemplo 2x+1=5.» (caso `solveEquation-err`).

Exportadas además: `splitEquation`, `eqSteps`, `nextStep`, `checkSolution`.

Funciones internas: `sideTerms`, `combine`, `maxDeg`, `moveNote`, `linearStep`, `quadSteps`, `quadRootsLatex`, `polyFactorLatex`, `latexText`; del árbol: `parseExpr`, `terms`, `toPoly`, `evalExact`, `evalNum`, `varsOf`; polinomios: `P`, `rationalRoots`.

---

## 4. Aritmética (`pizarra.html:2845-2959`)

| Clave | Función | Línea | Entrada | Salida |
|---|---|---|---|---|
| `fracS` | `simplifyFraction(src)` | 2906 | `\frac{12}{18}` (enteros) | 1 `deriv`: descomposición en primos, división por el m.c.d., irreducible; si ya lo es, una fila «ya es irreducible» |
| `fracO` | `fractionOps(src)` | 2921 | `\frac{1}{2}+\frac{1}{3}`, o producto/cociente `\frac{2}{3}\cdot\frac{9}{4}` | 1 `deriv`: m.c.m., numeradores, suma y simplificación; o multiplicación cruzada. Con una sola fracción delega en `simplifyFraction` |
| `mcd` | `gcdLcm(src)` | 2872 | `12, 18` (≥2 enteros; las letras y comandos se ignoran) | 1 `deriv` (factorización, m.c.d. con menores exponentes, m.c.m. con mayores) + si son 2 números, 1 `deriv` del algoritmo de Euclides |
| `primes` | `primeFactor(src)` | 2854 | `360` (entero ≥2, ≤ 10^15) | 2 `math`: tabla de divisiones sucesivas (`array{r|l}`) y `360=2^{3}\cdot 3^{2}\cdot 5` |

Errores: «Escribe un número entero mayor que 1.», «El número es demasiado grande para factorizarlo aquí.», «Escribe al menos dos números enteros, por ejemplo 12, 18.», «Solo trabajo con fracciones de números enteros.», «El denominador es 0.».
Helpers propios: `factorInt` (2846), `facLatex`, `intsOf`, `fracOf` (2893; **sin uso** dentro del rango leído, sólo se define), `rawFrac` (2900).

---

## 5. Polinomios (`pizarra.html:2961-3056`)

Reciben `full` (la línea con `l=r` si existe). Variable (`polyVar`, `:2963`): preferencia `x, t, y, z`.

| Clave | Función | Línea | Entrada | Salida |
|---|---|---|---|---|
| `polyOp` | `polyOperate(latex)` | 2964 | `(x+1)(x-2)` (si hay `=`, se toma lo de la derecha) | 1 `deriv`: expresión -> polinomio desarrollado y agrupado |
| `polyDiv` | `polyDivide(latex)` | 2972 | `(x^3-1):(x-1)` o fracción | `table` de **Ruffini** si el divisor es `x−a` (mónico), o `deriv` de división larga en otro caso; y siempre un `deriv` final con cociente, resto y comprobación D = d·C + R |
| `polyRoots` | `polyRoots(latex)` | 3025 | `x^3-6x^2+11x-6` (o `P(x)=...`) | opcional `math` (saca factor `x^k`), `table` de Ruffini encadenada con las raíces racionales, `math` de factorización y `math` «Raíces: ...» |

Ruffini: `ruffiniRows(p, a)` (3013) y `ruffiniTable(p, a, v)` (3020) generan `{type:'table', caption, rows, vbar, hline|hlines, mark, kind:'ruffini'}`.
Errores: «El divisor debe tener grado 1 o más.», «Escribe la división como P(x) : Q(x) o como fracción.», «Necesito un polinomio de grado 1 o más.», «Hay otra letra (y) además de x.» (`toPoly`), «Solo trabajo con potencias enteras positivas de x.» (exponente > 40).
Dependen de: `parseExpr`, `toPoly`, `varsOf` (árbol), `P`, `rationalRoots`, `polyFactorLatex`, `quadRootsLatex`, `topEqIndex`, `splitTop`.

---

## Propuesta de módulos (este grupo)

| Fichero | Líneas | Contenido |
|---|---|---|
| `js/engine/ops/common.js` | 1741-1751, 2232-2253, 2549, 2566-2575, 2842-2844, 3669-3671 | helpers transversales: `math`, `derivBlock`, `fText/fNum/fParen`, `fact`, `splitTop`, `lastSeg`, `matrixOf`, `squareOf`, `vm`, `pm`, `prodTxt`, `coefI`, `sqrtSimp/sqrtLatex`, `latexText`, y `dec/decT` (hoy en la sección 12) |
| `js/engine/ops/poly.js` | 1753-1827 | `P`, `termL`, `rationalRoots`, `numParen` (esta última sin uso) |
| `js/engine/ops/matrices.js` | 2255-2496 | `inverseSteps`, `arrow`, dets, `cramer`, `productDeveloped`, `detPoly`, `pterms`, `systemRows`, `paramDiscussion` |
| `js/engine/ops/eigen.js` (o dentro de `matrices.js`) | 2497-2547 | `eigen` |
| `js/engine/ops/vectores.js` | 2550-2634 | vectores (menos `sqrtSimp`/`sqrtLatex`, que van a `common.js`) |
| `js/engine/ops/ecuaciones.js` | 2636-2840, 2784-2792 | `eqSteps`, `quadSteps`, `quadRootsLatex`, `polyFactorLatex`, `splitEquation`, `topEqIndex`, `solveEquation`, `nextStep`, `checkSolution` |
| `js/engine/ops/aritmetica.js` | 2845-2959 | `factorInt`, `primeFactor`, `gcdLcm`, `simplifyFraction`, `fractionOps` |
| `js/engine/ops/polinomios.js` | 2961-3056 | `polyOperate`, `polyDivide`, `ruffini*`, `polyRoots` |

Dependencias cruzadas:
- `quadRootsLatex` y `polyFactorLatex` viven en ecuaciones pero los usan `eigen`, `polinomios` y `extremos` (sección 11): moverlos a `poly.js` (junto a `rationalRoots`) elimina el acoplamiento. `topEqIndex` lo usan también `polinomios` y `funcLine` (derivadas): a `common.js`.
- Todo el grupo depende del árbol de expresiones (`parseExpr`, `varsOf`, `toPoly`, `terms`, `evalExact`, `evalNum`, `termsLatex`, `termText`, `hasParenOrFrac`, `pickVar`; `pizarra.html:1829-2230`) -> módulo `expr-tree.js` (ver `operaciones-analisis.md`).
- `eigen`, `inverseSteps` y `paramDiscussion` llaman a `ME.gauss/rref/solve/matLatex` (núcleo).
- `sqrtSimp` pasa de vectores a `common.js` porque lo usan ecuaciones, estadística (`statsSummary`) y geometría.
- `fracOf` (2893) y `numParen` (1827) parecen código muerto; confirmar antes de borrar.
