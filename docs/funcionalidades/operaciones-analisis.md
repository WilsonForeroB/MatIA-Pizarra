# Operaciones de análisis (`OPS`): árbol de expresiones, derivadas, gráficas y extremos

Fuente: `pizarra.html:1829-2230` (árbol de expresiones) y `pizarra.html:3287-3666` (derivadas, gráficas y extremos). Convenciones de bloques, `src`/`full` y errores como en `operaciones-algebra.md`. Ejemplos reales: `tests/golden/cases.js` y `expected.json` (`derivative`, `graphOf`, `valueTable`, `extrema1`, `extrema2`, `compileFn`).

## 1. Árbol de expresiones (`pizarra.html:1829-2230`)

Es el **motor simbólico/numérico en coma flotante** de `OPS`, independiente de `ME.evaluate` (que sólo calcula con fracciones y matrices exactas). Convierte LaTeX en un árbol, lo simplifica, lo imprime en LaTeX, lo evalúa y lo reduce a polinomio.

### 1.1 Nodos (`N`, `pizarra.html:1832`)
`{t:'num', v: Fracción}`, `{t:'var', n}`, `{t:'c', n:'pi'|'e'}`, `{t:'add'|'sub'|'mul'|'div'|'pow', a, b}`, `{t:'neg', a}`, `{t:'fn', f, a}`. Sólo para salida existe `{t:'raw', s}` (LaTeX ya formateado, lo crea `polish`).
`f` válidos (`FN`, `:1830`): `sin cos tan(tg) cot sec csc arcsin arccos arctan ln log(base 10) exp sinh cosh tanh sen(=sin)`, y los internos `abs` (de `|x|`) y `fact` (de `n!`).

### 1.2 `parseExpr(src, opts={}) -> AST` (`:1839`)
`src`: LaTeX (string) o lista de tokens de `ME.tokenize`. `opts.var === 'e'` hace que la letra `e` sea variable en lugar de la constante de Euler; `opts.logBase10` no se usa.

Gramática: `expr` (`+ -`), `unary` (`-`), `term` (`\cdot \times * \div / :` y **multiplicación implícita**), `power` (un solo `^`, base `postfix`, `x^{-1}`, exponente `{}` o un único número/letra), `postfix` (`!`), `primary`:
número, `{...}`, `(...)`, `[...]`, `|...|`, `\frac`, `\dfrac`, `\tfrac`, `\sqrt{x}` y `\sqrt[n]{x}` (se guardan como potencias `x^{1/2}`, `x^{1/n}`), `\pi`, funciones de `FN` con exponente opcional (`\sin^{2}x`, `\sin(x)`, `\sin x`), letras griegas (`GREEK` propio, `:1831`, distinto del de `ME`), letras con subíndice (`x_1` -> `x_{1}`).
Errores: «Falta un operando.», «Expresión mal escrita.», «Falta el exponente.», «Exponente mal escrito.», «Falta cerrar un paréntesis.», «No puedo operar con ∞.», «No sé interpretar «...».».

Auxiliares: `varsOf(ast)` (conjunto de variables, `:1951`), `pickVar(ast)` (preferencia `x, t, y, z, n`, `:1956`).

### 1.3 Simplificación (`simp`, `simpAll`, `same`; `:1963-2067`)
- `simp` aplica una pasada recursiva: neutros (0, 1), aritmética de números exactos, `neg(neg)`, normalización de signos en `add/sub`, `mul` aplanado con coeficiente numérico y **agrupación de potencias de la misma base**, `div`, `pow` (enteras hasta |exp| < 64), `ln e = 1`, `ln 1 = 0`, `sin 0`, `tan 0`, `cos 0`.
- `simpAll` repite hasta punto fijo (comparado con `same`, por JSON) con máximo 12 iteraciones.
- Código sin efecto: el caso `'mul_old'` (`:2019`) nunca se genera; el caso `'mul2'` de `L` (`:2097`) tampoco.

### 1.4 Impresión LaTeX (`L(ast)`, `Lmul`, `fnName`, `fnArg`, `prec`; `:2070-2138`)
Escribe fracciones `\frac`, raíces (`pow` con 1/2 o 1/n), potencias negativas como fracción, multiplicación implícita o `\cdot`, paréntesis según `PREC`, funciones `\sin x`, `\sin\left(2x\right)`, `\mathrm{e}`, `\pi`. Separa en `\frac` los factores con exponente negativo.

### 1.5 Evaluación (`:2140-2186`)
| Función | `env` | Devuelve | Notas |
|---|---|---|---|
| `evalNum(ast, env)` | `{x: número}` | número JS | `Falta el valor de x.` si falta; raíces impares de base negativa (`pow` con exponente de denominador impar) devuelven valor real |
| `evalExact(ast, env)` | `{x: Fracción}` | `Fracción` | sólo `num, var, + - * /, pow` entero (|exp| ≤ 200), `abs`, `fact`; para el resto lanza `MErr('no exacto')`, que se usa como señal interna para caer a `evalNum` |

### 1.6 Del árbol a polinomio (`:2188-2230`)
- `toPoly(ast, v) -> Fracción[]` (coeficientes de menor a mayor grado). Errores: «Hay otra letra (y) además de x.», «Hay x en un denominador.», «Solo trabajo con potencias enteras positivas de x.» (exponente > 40), «La expresión no es un polinomio en x.».
- `terms(ast, v) -> [{c, d}]` desarrolla sin agrupar (para mostrar pasos de ecuaciones). `termsLatex`, `termText`, `hasParenOrFrac` son sus utilidades de impresión.

Exportados: `parseExpr, L, simpAll, D, evalNum, compileFn, P, rationalRoots` (`pizarra.html:4530`). La interfaz usa `parseExpr`, `evalNum` y `L` para la gráfica 3D (`compile3d`, `pizarra.html:5929-5936`).

---

## 2. Derivadas (`pizarra.html:3287-3381`)

- **Clave de menú**: `deriv` -> `OPS.derivative(full)`.
- **Entrada** (`funcLine`, `:3348`): `f(x)=x^2\sin x`, `y=...` o sólo la expresión. Si el lado izquierdo no es `f(x)`/`y`/una letra, no se interpreta como definición (y el `=` provoca error de interpretación). Variable: la de `f(t)` o `pickVar`.
- **Salida**: 1 `deriv`:
  1. (si hay nombre distinto de `y`) fila «Función»: `f(x) = ...`;
  2. `f'(x)` (o `y'`, o `\frac{d}{dx}\left(...\right)`) = derivada tras una pasada de `simp`, con nota «Reglas: potencia, cadena, ...»;
  3. fila «Simplificamos» (`simpAll` + `polish`) si difiere de la anterior; la última fila va `boxed`.
- **`D(ast, v, R)`** (`:3288`): derivación estructural; `R` es un `Set` donde se acumulan los nombres de reglas usadas (`constante, potencia, suma, constante por función, producto, cociente, cadena, exponencial, logaritmo, trigonométricas, trigonométricas inversas, derivación logarítmica, valor absoluto`). Casos de `pow`: exponente constante (regla de la potencia + cadena), base constante (exponencial), ambos con `v` (derivación logarítmica). Soporta todas las `FN` salvo `fact`.
- **Errores**: errores de `parseExpr`; «No sé derivar esa función.» (p. ej. factorial), «No sé derivar esta expresión.».
- `polish(ast, v)` (`:3362`): si el resultado es polinomio lo devuelve ordenado de mayor a menor grado como nodo `raw`; si es `P/Q` con `P` polinomio, `\frac{P ordenado}{Q}`.
- **Depende de**: `parseExpr`, `simp`, `simpAll`, `L`, `toPoly`, `P`, `varsOf`, `pickVar`, `topEqIndex` (de ecuaciones).

---

## 3. Gráficas y tablas de valores (`pizarra.html:3383-3404`)

| Clave | Función | Entrada | Salida |
|---|---|---|---|
| `graph` | `graphOf(full)` | una o varias funciones separadas por `;` o `\;`: `f(x)=x^2; g(x)=\sin x` | `[{type:'graph', fns:[texto original de cada función], xmin:-5, xmax:5}]` |
| `values` | `valueTable(latex)` | `f(x)=x^2-1` | `[{type:'table', rows:[[x,-3..3],[f(x),valores]], vbar:1, kind:'values', caption}]` |

- `compileFn(latex) -> {name, v, ast, latex, f}` (`:3384`): `f` es una función JS `x -> número` (NaN si falla). Falla con «La función tiene otras letras (a, b).» si hay parámetros. `graphOf` sólo **valida** cada función con `compileFn` y devuelve el texto; **es la interfaz quien dibuja**, recompilando con `OPS.compileFn` (`pizarra.html:5828`).
- `valueTable`: x = -3..3 (`F(x)` exacto con `evalExact`, texto `a/b`; si no es exacto, aproximación de 3 decimales con coma; `—` si no es finito, p. ej. 1/0).
- **Dependen de**: `funcLine`, `varsOf`, `evalNum`, `evalExact`, `L`.

---

## 4. Máximos, mínimos y puntos de silla (`pizarra.html:3406-3666`)

### 4.1 Una variable: `extrema1(latex)` (clave `extr1`, `:3484`)
- **Entrada**: `f(x)=x^3-3x`, opcionalmente con intervalo cerrado al final: `f(x)=x^3-3x,\ x\in[-2,3]` (`parseInterval`, `:3476`; extremos evaluables con `parseExpr`/`evalNum`; debe ser a < b).
- **Salida**: 3 bloques `[deriv, table, graph]`:
  1. `deriv`: función, `f'`, ecuación `f'=0` y puntos críticos, `f''`, clasificación de cada punto (`f''>0` mínimo, `f''<0` máximo; si `f''=0` se mira el signo de `f'` a ambos lados), puntos de inflexión (cambio de signo de `f''`), y extremos absolutos: con intervalo, comparando extremos del intervalo y puntos críticos; sin intervalo, con límites en ±∞ (muestreo numérico en ±10^3, 10^4, 10^5) para decidir si existen.
  2. `table` `kind:'mono'` de crecimiento y decrecimiento con signo de `f'` por tramos.
  3. `graph` con `marks:[{x, y, kind:'max'|'min'|'infl'|'absmax'|'absmin', label}]` y ventana `xmin/xmax` ajustada a los puntos o al intervalo.
- **Puntos críticos** (`zerosOf`, `:3443`): si `f'` es polinomio, exactos con `rationalRoots` + fórmula cuadrática (resto de grado 2) o bisección numérica (resto de grado >2); si no es polinomio, **bisección numérica** (`rootsNumeric`, 4000 subdivisiones, 80 bisecciones) en `[-50, 50]` o en el intervalo. Las soluciones aproximadas se marcan `\approx`.
- **Formato de números** (`numL`, `isNice`, `numT`, `:3408-3422`): fracción sencilla (denominador ≤ 12), múltiplo racional de π, o 4 decimales.
- **Errores**: «La función tiene otras letras (...). Para f(x, y) usa «Extremos de f(x, y)».», «La función es constante: todos sus puntos son a la vez máximos y mínimos.», «Intervalo no válido.», «En el intervalo [a, b] debe ser a < b.».
- **Depende de**: `funcLine`, `D`, `simpAll`, `polish`, `L`, `evalNum`, `evalExact`, `zerosOf`, `toPoly`, `P`, `rationalRoots`, `quadRootsLatex` (ecuaciones), `latexText`, `fLatex`, `derivBlock`.

### 4.2 Dos variables: `extrema2(latex)` (clave `extr2`, `:3600`)
- **Entrada**: `z=x^2+y^2-2x`, `f(x,y)=x^3-3xy+y^3` o sólo la expresión; debe depender de `x` e `y` (sólo esas letras).
- **Método**: derivadas parciales `f_x`, `f_y`, `f_xx`, `f_xy`, `f_yy` (`D` + `simpAll`); puntos críticos por **Newton 2D numérico** desde una rejilla 9×9 de `-6` a `6` paso `1.5`, con redondeo a valores sencillos si siguen siendo críticos (se pueden perder puntos críticos fuera de esa zona). Clasificación por la matriz hessiana: `|H|<0` silla; `|H|>0` y `f_xx>0` mínimo; `|H|>0` y `f_xx<0` máximo; `|H|≈0` caso dudoso.
- **Salida**: `[deriv, graph3d]`. `deriv`: `f`, `f_x`, `f_y`, sistema `∇f=0`, puntos críticos `P_1...` (aprox. si no son «bonitos»), matriz `H`, y una fila `|H(P_i)|` por punto con la clasificación y `f(P_i)`; nota final sobre extremos absolutos («en un recinto cerrado»). `graph3d` = `{type:'graph3d', fn:'z=...', xmin,xmax,ymin,ymax, az:-0.8, el:0.55, zoom:1, marks:[{x,y,z,kind:'min'|'max'|'saddle'|'deg',label}]}`.
- **Errores**: «Solo puede depender de x e y (sobra a).», «La función no depende de y: usa «Máximos y mínimos de f(x)».».
- **Depende de**: `parseExpr`, `varsOf`, `D`, `simpAll`, `evalNum`, `L`, `numL`, `numT`, `isNice`.

---

## 5. Normalización de funciones (`normalizeFn`, `js/engine/ops/analisis.js`)

`normalizeFn(src)` convierte texto plano o variantes en LaTeX que entiende `parseExpr`: `sen x`/`sin(x)`, `tg`, `ctg`, `cosec`, `raiz`, `pi`, `sqrt(x)`, `exp(u)`, `abs(x)`, `x^(1/2)`, `x^-2`. No toca el LaTeX ya válido. La usan la gráfica 2D (`blocks/graph.js`), el sólido (`blocks/solid.js`) y la integración. Pruebas: `node tests/engine-features.js`.

## 6. Integrales (`js/engine/ops/integrales.js`)

Expone `integrate(ast, v, rules)`, `integralLine(latex)` e `integralSteps(latex)`.

- **Calcular** (Ctrl+=, `ui/calc.js`): si la línea empieza por `\int`, sustituye la línea por el resultado.
  - Indefinida `\int f\,dx` → primitiva + C.
  - Definida `\int_a^b f\,dx` → regla de Barrow, exacta si puede o aproximada (`\approx`) con Simpson.
- **Operaciones ▾ → Cálculo → «Integral paso a paso»** (`ops-menu.js`, `integralSteps`): reglas aplicadas, primitiva + C y, si es definida, la regla de Barrow.
- **Qué integra**: polinomios, potencias y raíces, `1/x`, `e^u`, `a^u`, `sin`, `cos`, `tan`, `cot`, `sinh`, `cosh`, `sec²`, `csc²`, `1/(1+u²)`, `1/√(1−u²)`, `sin²`, `cos²`, `ln(ax+b)`, con argumento lineal `u = ax+b`.
- **Qué no integra**: productos de funciones (`x·sin x`), cocientes racionales generales y sustituciones no lineales. Responde «No sé integrar esta función de forma exacta.».
- Cada primitiva se comprueba derivándola.

## Propuesta de módulos (este grupo)

| Fichero | Líneas | Contenido |
|---|---|---|
| `js/engine/expr/parse.js` | 1829-1960 | `FN`, `GREEK` (el de `OPS`), `N`, `isNum`, `parseExpr`, `varsOf`, `pickVar` |
| `js/engine/expr/simplify.js` | 1962-2067 | `simp`, `same`, `simpAll` |
| `js/engine/expr/latex.js` | 2069-2138 | `PREC`, `prec`, `L`, `Lmul`, `fnName`, `fnArg` |
| `js/engine/expr/eval.js` | 2140-2186 | `evalNum`, `evalExact` |
| `js/engine/expr/poly.js` | 2188-2230 | `toPoly`, `terms`, `termsLatex`, `termText`, `hasParenOrFrac` (depende del `P` de `ops/poly.js`) |
| `js/engine/ops/derivadas.js` | 3287-3381 | `D`, `funcLine`, `polish`, `RULE_TXT`, `derivative` |
| `js/engine/ops/graficas.js` | 3383-3404 | `compileFn`, `graphOf`, `valueTable` |
| `js/engine/ops/extremos.js` | 3406-3666 | `numL`, `isNice`, `numT`, `rootsNumeric`, `zerosOf`, `parseInterval`, `extrema1`, `extrema2` |

Dependencias cruzadas:
- `funcLine` lo usan derivadas, gráficas y `extrema1`; depende de `topEqIndex` (ecuaciones, `:2784`) y de `parseExpr`/`pickVar`. Ubicarlo en `expr/parse.js` o `ops/common.js` evita ciclos graficas -> derivadas.
- `extremos.js` depende de `D`/`polish` (derivadas), `toPoly` (expr/poly), `P`/`rationalRoots` (ops/poly), `quadRootsLatex` (ecuaciones) y `latexText` (común). `numL`, `isNice`, `numT`, `zerosOf` no se usan fuera de la sección 11 (verificado por búsqueda), así que pueden ser privados del módulo.
- El árbol de expresiones es la base de **todo** `OPS`: álgebra (ecuaciones, polinomios, `paramDiscussion`), estadística (`evalExact`/`evalNum`/`parseExpr` en `dataList`, `bayes`, `binomial`, `normal`) y geometría (usa su propio parser pequeño `geoParse`, no éste).
- `parseExpr`, `evalNum`, `L` también los consume la interfaz directamente (`compile3d`, `pizarra.html:5932-5936`): deben seguir exportados.
