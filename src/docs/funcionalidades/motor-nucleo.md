# Motor matemático: núcleo (`ME`)

Fuente: `pizarra.html:960-1736` (marcadores `/*ENGINE-START*/` ... `/*ENGINE-END*/`). Es una IIFE `const ME = (() => {...})()` sin dependencias del DOM. Recibe el LaTeX que genera MathLive y calcula con **aritmética exacta** (fracciones de `BigInt`). Las operaciones paso a paso (`OPS`, ver los otros documentos) se construyen encima.

Ejemplos reales de entrada y salida: `tests/golden/cases.js` y `tests/golden/expected.json` (campo `engine`).

## 1. Qué hace, en dos líneas

- **Profesor**: el botón *Calcular* (`=`) resuelve la línea (`\frac{3}{4}+\frac{1}{6}=` produce `\frac{11}{12}`), admite matrices, determinantes, inversas, potencias y nombres definidos en otras líneas (`A=...`). Los botones *Gauss* y *Gauss-Jordan* escalonan una matriz o un sistema y dicen si es SCD, SCI o SI.
- **Desarrollador**: `ME.compute` y `ME.gaussLines` son los dos puntos de entrada que usa la interfaz (`pizarra.html:5703,5714,5730`). El resto de `ME` lo usa `OPS` (`pizarra.html:1741-1742`).

## 2. Representación de datos

| Concepto | Forma | Dónde |
|---|---|---|
| Fracción | `{n: BigInt, d: BigInt}` siempre irreducible, `d > 0` | `F(n, d)` `pizarra.html:968` |
| Escalar evaluado | `{t:'s', v: Fracción}` | `S` `:998` |
| Matriz evaluada | `{t:'m', a: Fracción[][], r, c, aug}`; `aug` = nº de columnas antes de la barra de matriz ampliada (o `null`) | `M` `:999` |
| Error de usuario | `class MErr extends Error` (mensaje en español, listo para mostrar en un aviso) | `:965` |
| Constantes | `ZERO`, `ONE` | `:976` |

Convenciones:
- `F(x)` acepta número, `BigInt` o texto; `F(a,0)` lanza `MErr('División por cero.')`.
- Los decimales se leen exactos: `fromDec('0.25')` da `1/4` (`:985`). `\{,\}` entre dígitos se convierte en `.` (`:1167`).
- `fLatex(a)` da `3`, `\frac{3}{4}` o `-\frac{3}{4}` (`:993`).

### Aritmética de fracciones (`pizarra.html:977-992`)
`add, sub, mul, div, neg, isZ, isInt, isUnit, gcd, abs, fromDec`. `div` lanza `MErr` si el divisor es 0.

### Aritmética escalar/matricial (`:1004-1122`)
| Función | Qué hace | Errores (MErr) |
|---|---|---|
| `opAdd(x,y,sign)` | suma/resta número-número o matriz-matriz | tamaños distintos; número con matriz |
| `opMul(x,y)` | número·número, número·matriz, matriz·matriz | columnas de la 1ª distintas de filas de la 2ª |
| `opDiv(x,y)` | divide por un escalar | dividir entre matriz; entre 0 |
| `det(m)` | determinante por eliminación gaussiana con cambio de signo por intercambio (`:1040`) | no cuadrada |
| `rref(a, ncols)` | forma escalonada reducida; devuelve `{a, piv}` (`:1058`) | — |
| `rank(m)` | rango (usa `rref`) | — |
| `inv(m)` | inversa por `rref` de `(A|I)` | no cuadrada; "no tiene inversa: su determinante es 0" |
| `transpose(m)` | traspuesta (en escalar devuelve igual) | — |
| `trace(m)` | traza | no cuadrada |
| `pow(x, e)` | potencia entera; escalar hasta 4096, matriz hasta 512 (cuadrados sucesivos); exponente negativo invierte | exponente no entero; demasiado grande |
| `sqrtExact(x)` | raíz de escalar sólo si numerador y denominador son cuadrados perfectos | raíz de matriz; no exacta |

## 3. Tokenizador LaTeX (`pizarra.html:1124-1243`)

`tokenize(src)` primero pasa `unwrap` (`:1129`), que elimina envolturas de formato:
`\textcolor{c}{X}`, `\colorbox`, `\color{c}` (se descarta el color), `\boxed`, `\mathbf`, `\mathrm`, `\mathit`, `\mathsf`, `\boldsymbol`, `\bm`, `\operatorname`, `\mathop`, `\text*` (se conserva su contenido). `\placeholder` lanza `MErr('Hay huecos sin rellenar.')`. `\operatorname{det|tr|rg|rang|rank|rango|traza}` se normaliza al comando (`FUNCS`, `:1127`).

Tokens producidos (`{k, v}`):

| `k` | Significado |
|---|---|
| `num` | `\d+\.?\d*` o `.\d+` (decimal con punto) |
| `id` | una letra (cada letra es un identificador independiente) |
| `cmd` | `\comando` (p. ej. `frac`, `cdot`, `begin`, `end`, `alpha`) |
| `op` | operador de un carácter (`+ - * / ^ _ ( ) [ ] | = ' :` ...); `\{ \}` -> `(` `)`, `\lbrack` -> `[`, `\vert`, `\lvert`... -> `|` |
| `{`, `}` | llaves de grupo |
| `amp`, `row` | `&` y `\\` (separadores de celda y fila) |

Se ignoran (`SKIP`, `:1125`): `\, \; \! \: \quad \qquad \left \right \big... \displaystyle \limits`. `\text{...}` se descarta con su contenido.

Auxiliares: `splitEq` (divide por `=` de nivel superior, equilibrando `{}` y `\begin/\end`, `:1210`); `readName` (lee `A`, `A_1`, `A_{12}`, `\lambda`; devuelve `{key, latex, end}`, `:1224`); `isPureName` (`:1243`); `afterArrows` (se queda con lo que hay tras la última `\xrightarrow{..}`, `\sim`, `\to`, `\Rightarrow`, `\approx`, `:1681`).

## 4. Gramática soportada (`evaluate`, `pizarra.html:1246-1435`)

Descenso recursivo sobre los tokens, con entorno `env` (nombre -> valor evaluado):

```
expr    := unary (('+'|'-') term)*
unary   := '-' term | '+' term | term
term    := postfix ( ('\cdot'|'\times'|'*') postfix | ('\div'|'/'|':') postfix | postfix )*   // la yuxtaposición multiplica
postfix := primary ( '^' exponente | "'" )*
primary := número | {expr} | (expr) | [expr] | |expr| | \frac{a}{b} | \sqrt{x} | \det X | \tr X | \rg X
         | \begin{matriz}...\end{matriz} | nombre
```

Detalles útiles:
- **Matrices**: entornos `pmatrix, bmatrix, Bmatrix, matrix, smallmatrix, vmatrix, Vmatrix, array, pmatrix*, bmatrix*` (`:1399`). `vmatrix` devuelve directamente el determinante. Celdas sólo escalares, filas del mismo largo, no vacía. `cases` lanza «Para resolver un sistema usa Operaciones -> Gauss (o Cramer)».
- **Matriz ampliada**: `array{cc|c}`, `pmatrix}[cc|c]` o `\left(A \middle| b \right)` rellenan `aug`.
- **Traspuesta**: `^T`, `^t`, `^\top`, `^\intercal`, `^{\mathsf T}`, `'` (`:1299-1305`). **Inversa**: `^{-1}` sobre matriz. Otras potencias: `pow`.
- **Valor absoluto** `|x|`: escalar -> valor absoluto; matriz -> determinante. `absDepth` evita anidamiento ambiguo.
- **Funciones**: `\det`, `\tr`/`traza`, `\rg`/`rang`/`rank`/`rango`. Sólo raíz cuadrada (`\sqrt[n]` lanza MErr).
- **Nombres**: una letra o letra griega (`GREEK`, `:1126`) con subíndice; deben estar en `env` o `MErr('No conozco «X». Defínela antes en otra línea...')`.
- Sobra algo al final -> `MErr('No sé interpretar «...»')`.

Mensajes típicos de `MErr`: `La expresión está incompleta o mal escrita.`, `Falta un operando.`, `Falta cerrar un paréntesis.`, `Dentro de una matriz solo puede haber números.`, `Hay filas con distinto número de elementos (o huecos vacíos).`, `Solo calculo potencias con exponente entero.`, `Exponente demasiado grande.`.

## 5. Salida LaTeX (`:1437-1448`)

- `matLatex(a, aug, env='pmatrix')`: `\begin{pmatrix}..\end{pmatrix}`; con `aug` genera `\left(\begin{matrix}L\end{matrix}\,\middle|\,\begin{matrix}R\end{matrix}\right)`.
- `toLatex(v)`: escalar -> `fLatex`, matriz -> `matLatex(v.a, null)`. Nota: `toLatex` descarta `aug`.

## 6. Entorno de definiciones y `compute` (`:1450-1496`)

### `ME.definitions(latexList) -> env`
Para cada línea LaTeX con forma `Nombre = expresión` (nombre puro, tiene lado derecho) evalúa el lado derecho con el entorno acumulado hasta ese momento y lo guarda en `env[key]`. Las líneas que fallan (no son definiciones o dependen de algo que aún no existe) se **ignoran en silencio** (`try/catch` vacío, `:1459`). El orden importa: una definición sólo ve las anteriores.
La interfaz construye la lista con todas las líneas `math` de la página (menos la actual) y las filas `deriv` con `l=r` (`otherDefs`, `pizarra.html:5686-5694`).

### `ME.compute(L, env) -> {latex, value} | {info}`
- Evalúa el último miembro **no vacío** de la línea separada por `=`. Si la línea termina en `=` (`trailing`), se añade el resultado detrás; si no, se añade `=` + resultado.
- Devuelve `{info: 'Esta línea ya está calculada.'}` si el miembro anterior ya vale lo mismo.
- Devuelve `{info: 'A queda guardada (matriz 2×2). Ya puedes usarla...'}` si es una definición literal (`A = número` o `A = \begin{...}` sin operadores de nivel superior).
- Error si no hay operación: `Escribe primero una operación, por ejemplo A\cdot B.` (caso `compute-err` en `expected.json`).

Ejemplo (`cases.js`): `ME.compute('\frac{3}{4}+\frac{1}{6}=', {})` -> `{latex:'\frac{3}{4}+\frac{1}{6}=\frac{11}{12}', value:{t:'s',...}}`.

Función interna: `depthAt` (`:1489`).

## 7. Gauss paso a paso (`:1498-1558`)

`gauss(a0, {jordan, aug}) -> {steps, a, rank}`; cada `step = {ops: string[], a: matriz}` donde `ops` son operaciones elementales en LaTeX (`F_{2}-3F_{1}`, `F_{2}\leftrightarrow F_{3}`, `F_{1}\to \frac{1}{2}F_{1}`).
- Elige pivote prefiriendo un 1 o -1 en la columna; si hace falta intercambia filas.
- Sin `jordan`: sólo anula debajo del pivote; con `jordan`: normaliza el pivote a 1 y anula arriba y abajo.
- Si el cociente no es entero y todos los elementos son enteros, evita fracciones con `alpha*Fi - beta*Fr` (`:1542-1546`).
- `aug` limita las columnas donde se buscan pivotes (matriz ampliada).
- `termLatex(coef, sym, first)` y `arrowLatex(ops)` formatean (`\xrightarrow[abajo]{arriba}` repartiendo las operaciones).

## 8. Sistemas lineales (`:1560-1678`)

- `linear(seg)` (interno): interpreta un lado de ecuación como `{coef: Map(nombre->Frac), k}`; admite `2x`, `\frac{1}{2}y`, `3\cdot z`, `x_1`. Si no es lineal: `Solo sé resolver sistemas lineales: revisa «...»`.
- `orderVars(names)` (interno): orden `x y z w t u v`, luego `x_{1}, x_{2}`...
- **`ME.parseSystem(L) -> {vars, a}`**: acepta `\begin{cases|aligned|...}` (cualquier entorno) o ecuaciones separadas por `\\`; cada ecuación debe tener exactamente un `=`; `a` = matriz ampliada (`vars.length` columnas + términos independientes).
- **`ME.solve(a, vars) -> {kind, rA, rAb, latex, sol?}`**: usa `rref`. `kind` es `'SI'` (incompatible), `'SCD'` o `'SCI'`. En SCI los parámetros libres se llaman `\lambda, \mu, \alpha, \beta, \gamma, \delta, t_{k}`. `latex` es la discusión de Rouché-Frobenius y `sol` la solución (`x=..,\quad y=..`).

### `ME.gaussLines(L, env, jordan) -> string[]` (`:1701`)
Punto de entrada del botón Gauss. Si la línea contiene `\begin{cases|dcases|rcases|aligned}` interpreta un sistema; si no, evalúa la matriz del último miembro tras flechas (`afterArrows`). Devuelve líneas LaTeX a insertar: matriz inicial (sólo en sistemas), una línea por paso (`\xrightarrow{...}` + matriz), y al final la discusión/solución (con `aug`/sistema) o `\operatorname{rg}=k` (matriz sin ampliar). Si no hay pasos: `\text{La matriz ya está escalonada|reducida}`. Errores: `Escribe una matriz o un sistema en la línea.`, `Gauss necesita una matriz o un sistema de ecuaciones.`.
Ejemplo `SYS = \begin{cases}2x+y=3\\x-y=0\end{cases}` en `cases.js`.

## 9. API pública exportada (`pizarra.html:1734`)

`return { MErr, F, fLatex, tokenize, splitEq, evaluate, definitions, compute, gauss, gaussLines, parseSystem, solve, toLatex, matLatex, det, inv, rref, readName, isPureName, afterArrows, fr: {...}, M, S }`

| Export | Firma | Devuelve |
|---|---|---|
| `MErr` | `new MErr(msg)` | clase de error de usuario |
| `F` | `F(n, d=1n)` | fracción irreducible |
| `fLatex` | `(frac)` | string LaTeX |
| `tokenize` | `(latex)` | `Token[]` |
| `splitEq` | `(tokens)` | `Token[][]` (segmentos por `=`) |
| `evaluate` | `(tokens, env)` | `{t:'s'|'m', ...}` |
| `definitions` | `(latex[])` | `env` objeto nombre->valor |
| `compute` | `(latex, env)` | `{latex, value}` o `{info}` |
| `gauss` | `(matrix, {jordan, aug})` | `{steps, a, rank}` |
| `gaussLines` | `(latex, env, jordan)` | `string[]` |
| `parseSystem` | `(latex)` | `{vars:string[], a:Frac[][]}` |
| `solve` | `(a, vars)` | `{kind, rA, rAb, latex, sol?}` |
| `toLatex`, `matLatex` | ver arriba | string |
| `det`, `inv` | `(M)` | `S` / `M` evaluados (no matrices crudas) |
| `rref` | `(a, ncols?)` | `{a, piv}` (matriz cruda de fracciones) |
| `readName`, `isPureName`, `afterArrows` | utilidades de tokens | ver sección 3 |
| `fr` | objeto | `add, sub, mul, div, neg, isZ, isInt, gcd, abs, fromDec, ZERO, ONE` |
| `M`, `S` | constructores | `M(a, aug)`, `S(frac)` |

No exportados pero usados sólo dentro de `ME`: `rank, transpose, trace, pow, sqrtExact, opAdd/opMul/opDiv, unwrap, linear, orderVars, depthAt, termLatex, arrowLatex, linLatex`.

Uso desde fuera del motor (interfaz): `ME.MErr` (10 usos), `ME.compute`, `ME.definitions`, `ME.gaussLines`, `ME.toLatex` (`pizarra.html` tras la línea 4541).

## 10. Propuesta de módulos

`ME` es una sola clausura, por lo que los helpers comparten ámbito. Al extraer, hay que exportar explícitamente lo que hoy es privado y se usa entre trozos. Propuesta (rangos de `pizarra.html`):

| Fichero | Líneas | Contenido | Depende de |
|---|---|---|---|
| `js/engine/fraction.js` | 965-996 | `MErr`, `gcd`, `F`, `add/sub/mul/div/neg`, `isZ/isInt/isUnit`, `fromDec`, `fLatex`, `ZERO/ONE` | nada |
| `js/engine/matrix.js` | 998-1122 | `S`, `M`, `dim`, `copy`, `ident`, `opAdd/opMul/opDiv`, `det`, `rref`, `rank`, `inv`, `transpose`, `trace`, `pow`, `sqrtExact` | fraction |
| `js/engine/tokenizer.js` | 1124-1243 | `SKIP`, `GREEK`, `FUNCS`, `unwrap`, `tokenize`, `isOp/isCmd`, `splitEq`, `readName`, `isPureName` | fraction (`MErr`) |
| `js/engine/parser.js` | 1245-1435 | `evaluate` | fraction, matrix, tokenizer (usa `FUNCS`, `GREEK`, `isOp/isCmd`, `readName`) |
| `js/engine/latex-out.js` | 1437-1448 | `matLatex`, `toLatex` | fraction |
| `js/engine/definitions.js` | 1450-1496 | `definitions`, `compute`, `depthAt` | tokenizer, parser, latex-out, matrix (`dim` en el mensaje de `compute`) |
| `js/engine/gauss.js` | 1498-1558, 1680-1698, 1700-1732 | `termLatex`, `gauss`, `arrowLatex`, `afterArrows`, `gaussLines` | fraction, matrix (`rref`), tokenizer, parser, systems (`parseSystem`, `solve`) |
| `js/engine/systems.js` | 1560-1678 | `linear`, `orderVars`, `parseSystem`, `linLatex`, `solve` | fraction, matrix (`rref`), tokenizer, parser (`evaluate` dentro de `linear`), gauss (`termLatex`) |

Dependencias cruzadas a vigilar:
- `gauss.js` <-> `systems.js`: `solve/linLatex` usan `termLatex` (gauss) y `gaussLines` usa `parseSystem/solve` (systems). Conviene mover `termLatex` a `latex-out.js` para romper el ciclo.
- `afterArrows` (1681) lo exporta `ME` y lo usa `OPS.lastSeg` (`pizarra.html:2244`): colocarlo en `tokenizer.js` es más natural.
- `OPS` reimplementa a pequeña escala cosas de `ME`: `termL` (1792, equivale a `termLatex`), `arrow` (2268, equivale a `arrowLatex`), `isCmd/isOp` (1746-1747), `GREEK` (1831, conjunto distinto del de `ME`, no sustituible sin comprobar). Al modularizar, mejor un único `termLatex`/`arrowLatex` compartido, con un test golden previo.
- `ME.fr` es la API de fracciones que consume `OPS` (`pizarra.html:1742`); mantenerlo como reexportación de `fraction.js`.
- Código muerto detectado: `matLatex` calcula `c` (1441) sin usarla; `toLatex` pierde `aug`.
