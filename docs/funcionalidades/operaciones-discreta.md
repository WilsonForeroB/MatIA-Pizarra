# Operaciones de matemática discreta (`OPS`): combinatoria, Pascal, lógica, conjuntos y Venn

Fuente: `pizarra.html:3058-3285`. Mismas convenciones que `operaciones-algebra.md` (bloques `math`/`deriv`/`table`, errores `ME.MErr`, `src`/`full`/`env`; `runOp` en `pizarra.html:7244`). Ejemplos reales: `tests/golden/cases.js` y `expected.json` (`combinatorics`, `pascal`, `truthTable`, `setOperate`, `vennEval`).

## 1. Combinatoria (`pizarra.html:3058-3100`)

- **Clave de menú**: `comb` -> `OPS.combinatorics(full)` (`pizarra.html:7284`).
- **Para el profesor**: muestra la fórmula, la simplificación y el valor numérico de factoriales, permutaciones, variaciones (con y sin repetición) y combinaciones.
- **Entrada**: se eliminan los espacios y se prueban estos patrones por regex, en este orden (`:3065-3094`); los números pueden ser expresiones (se evalúan con `ME.evaluate`, deben ser naturales):

| Patrón | Ejemplo | Significado |
|---|---|---|
| `\binom{n}{k}`, `C_{n,k}`, `C_{n}^{k}` | `\binom{5}{2}` | combinaciones (k ≤ n) |
| `VR_{n,k}`, `VR_{n}^{k}` | `VR_{3,4}` | variaciones con repetición, n^k |
| `V_{n,k}`, `V_{n}^{k}` | `V_{5,2}` | variaciones (k ≤ n) |
| `P_{n}` o `P_n` | `P_{4}` | permutaciones |
| `n!` | `6!` | factorial (n ≤ 3000) |

- **Salida**: 1 bloque `deriv` de 3 filas: fórmula (`l` -> `r`) con nota, simplificación (abrevia con `\cdots` si hay más de 8 factores, helper `dots`) y valor `boxed` (BigInt exacto, `fact`, `:1751`). `C(n,k)` reduce con `k = min(k, n−k)`.
- **Errores**: «Escribe n!, \binom{n}{k}, C_{n,k}, V_{n,k}, VR_{n,k} o P_{n}.», «Necesito números naturales.», «En C(n,k) debe ser k ≤ n.», «En V(n,k) debe ser k ≤ n.», «Número demasiado grande.».
- **Depende de**: `ME.evaluate`, `tokenize`, `fact`, `derivBlock`.

## 2. Triángulo de Pascal (`pizarra.html:3101-3112`)

- **Clave**: `pascal` -> `OPS.pascal(src || '')` (se permite línea vacía, `:7285`).
- **Entrada**: un natural n entre 0 y 20 (p. ej. `5`). Si falta o no vale se usa **n = 6 sin avisar** (el `try/catch` es silencioso).
- **Salida**: n+1 bloques `{type:'math', v:'1\quad 3\quad 3\quad 1', align:'center'}` (filas 0..n). Con `5` hay 6 filas (golden).
- **Depende de**: `ME.evaluate`, `lastSeg` (helper común de entrada).

## 3. Lógica: tabla de verdad (`pizarra.html:3114-3182`)

- **Clave**: `truth` -> `OPS.truthTable(full)`.
- **Entrada**: fórmula con variables de **una letra** y constantes `0`/`1`. Conectivas reconocidas (`parseLogic`, `:3115`):

| Conectiva | LaTeX / símbolo |
|---|---|
| Negación | `\neg`, `\lnot`, `\sim`, `¬`, `~`, `!`; `\overline{...}` (exige llaves) |
| Y | `\land`, `\wedge` |
| O | `\lor`, `\vee` |
| O exclusivo | `\veebar`, `\oplus` |
| Implica | `\Rightarrow`, `\rightarrow`, `\to`, `\implies`, `\Longrightarrow` |
| Si y sólo si | `\Leftrightarrow`, `\leftrightarrow`, `\iff`, `\Longleftrightarrow` |

  Paréntesis `()` y llaves `{}` (se tratan como paréntesis). Se ignoran `\left \right \, \; \quad`.
- **Precedencia** (de mayor a menor): `¬`, `∧`, `∨`, `⊻`, `→` (asociativa por la derecha), `↔`. Ejemplo golden: `p\land q\Rightarrow r` se lee `(p∧q)→r`.
- **Salida**: un único bloque `{type:'table', head, rows, vbar, kind:'truth', caption, lastBold:true}`:
  - `head`: variables (orden alfabético) y luego cada subfórmula distinta (texto con `¬ ∧ ∨ ⊻ → ↔`, `ltext`, `:3155`), la última es la fórmula completa.
  - `rows`: `'V'`/`'F'`; la primera fila es todo verdadero (cuenta binaria descendente). `vbar` = nº de variables (línea vertical tras ellas).
  - `caption`: «Tautología: siempre verdadera», «Contradicción: siempre falsa» o «Contingencia: a veces verdadera y a veces falsa».
- **Errores**: «No reconozco «x» en la fórmula lógica.», «Fórmula lógica incompleta.», «Falta cerrar un paréntesis.», «Sobra algo al final de la fórmula.», «Como mucho 5 variables (32 filas).».
- **Caso no aclarado**: una fórmula de un solo símbolo (`p`) deja `subs` vacío (sólo se añaden subfórmulas no atómicas, `:3166`); el resultado/caption para ese caso no está cubierto por los golden y no se ha verificado.
- **Depende de**: nada del resto del motor, salvo `MErr`.

## 4. Conjuntos (`pizarra.html:3184-3285`)

### 4.1 Operar con conjuntos
- **Clave**: `sets` -> `OPS.setOperate(full, lines)`. `lines` = LaTeX de **todas** las demás líneas `math` de la página y de las filas `deriv` `l=r` (`pizarra.html:7257`); de ahí se sacan las definiciones (`setDefs`, `:3225`).
- **Definiciones**: líneas con forma `A=\{1,2,3\}`; el nombre es una **mayúscula** (con subíndice opcional); los elementos son números (también negativos y decimales) o **minúsculas** (con subíndice), conjuntos anidados `\{1,\{2,3\}\}` y `\emptyset`/`\varnothing`. El orden importa (cada definición ve las anteriores). Las líneas que fallan se ignoran.
- **Entrada**: p. ej. `A\cup B` con `A=\{1,2,3\}` y `B=\{3,4\}` definidos (golden).
- **Operadores** (`setTokens`, `:3185`): `\cup` unión, `\cap` intersección, `\setminus`/`\backslash` diferencia, `\triangle`/`\Delta` diferencia simétrica, `\times` producto cartesiano (pares), `\mathcal{P}`/`\wp` partes (máx. 6 elementos), `|A|` cardinal, complementario `A^c`, `A^{c}` o `A'` (exige un conjunto universal `U` definido: «Para el complementario define el universal en otra línea: U = {…}.»).
- **Precedencia** (`setEval`, `:3206`): complementario (postfijo) > `∩`, `×` > `∪`, `∖`, `Δ`; asocia por la izquierda.
- **Salida**: un bloque `{type:'math', v:'A\cup B=\left\lbrace 1,\ 2,\ 3,\ 4\right\rbrace '}`; el cardinal da `|A|=3`. Conjunto vacío: `\emptyset`. Elementos ordenados numéricamente (`mkSet`, `:3204`), sin duplicados (`setKey`).
- **Errores**: «No reconozco «x» en la expresión de conjuntos.», «No conozco el conjunto A. Defínelo en otra línea: A = {…}.», «𝒫(A) solo hasta 6 elementos (64 subconjuntos).», «Expresión de conjuntos incompleta.», «Falta cerrar un paréntesis.», «No esperaba «x».».

### 4.2 Diagramas de Venn (máscaras de bits)
Las zonas del diagrama se codifican como **máscaras de bits** (`pizarra.html:3232`): bit 0 (valor 1) = pertenece a A, bit 1 (2) = B, bit 2 (4) = C; la máscara 0 es la zona fuera de todos los conjuntos. Con n=2 las zonas son 0..3 y con n=3 son 0..7.

| Función | Línea | Entrada | Devuelve |
|---|---|---|---|
| `normSetText(t)` | 3233 | texto con símbolos Unicode | LaTeX normalizado: `∩ ∪ ∖ Δ △ ᶜ ∅`, `\complement`, y `A \ B` o `A - B` -> `\setminus` |
| `vennEval(expr, names, nHint)` | 3240 | `'A\cap B'`, `['A','B','C']` (el nombre del universal es `U` = todas las zonas) | `{n, masks}`: nº de conjuntos (nHint, o 3 si se usa el tercer nombre, si no 2) y lista ordenada de máscaras sombreadas |
| `vennElements(lines, names, n)` | 3266 | líneas de la página | `{els:[{v, txt, mask}], hasU, missing}` o `null` si ningún conjunto está definido: asigna cada elemento a su zona |

- Restricciones: sólo nombres de conjuntos, `U`, `{}` y los operadores `∪ ∩ ∖ Δ ᶜ`; con elementos, `×`, `𝒫` o `| |` lanza «En el diagrama de Venn usa solo nombres de conjuntos y ∪ ∩ ∖ Δ ᶜ.». Un nombre no incluido en `names`: «En el diagrama solo hay los conjuntos A, B, C (y U)...». Más conjuntos de los del diagrama: «Este diagrama tiene N conjuntos.».
- **Menú**: `venn` **no llama a una operación `OPS` con salida de bloques**: la interfaz compone el bloque `{type:'venn', n, expr, shade:[], showEls:true}` (`pizarra.html:7294`) con `vennEval` (sólo para validar y obtener `n`). El dibujo (`pizarra.html:6625`) vuelve a llamar a `vennEval` y `vennElements(pageLines(), VENN_NAMES, n)` (`:6648`), con `VENN_NAMES=['A','B','C']` (`:6587`).
- **Depende de**: `setTokens`, `setDefs`, `setKey`, `setEval` (sólo `vennElements` vía `setDefs`).

## Propuesta de módulos (este grupo)

| Fichero | Líneas | Contenido | Dependencias |
|---|---|---|---|
| `js/engine/ops/combinatoria.js` | 3058-3112 | `combinatorics`, `pascal` | `ME` (`evaluate`, `tokenize`), `fact`, `derivBlock`, `lastSeg` (common) |
| `js/engine/ops/logica.js` | 3114-3182 | `parseLogic`, `LSYM`, `ltext`, `truthTable` | sólo `MErr` |
| `js/engine/ops/conjuntos.js` | 3184-3231, 3276-3285 | `setTokens`, `setKey`, `mkSet`, `setLatex`, `setEval`, `setDefs`, `setOperate` | `MErr`, `math` |
| `js/engine/ops/venn.js` | 3232-3275 | `normSetText`, `vennEval`, `vennElements` | `setTokens`, `setDefs`, `setKey` (conjuntos.js) |

Dependencias cruzadas:
- `fact` (`:1751`) lo comparten combinatoria, `sampleSpace` y `binomial` (estadística): a `common.js`.
- `lastSeg` (`:2244`) depende de `ME.splitEq`/`ME.afterArrows`/`tokenize`; la usa `pascal`.
- `venn.js` necesita exportar `setTokens`/`setDefs`/`setKey` desde `conjuntos.js`; hoy son privados de la clausura.
- Export público actual de este bloque (`pizarra.html:4529,4536`): `combinatorics, pascal, truthTable, setOperate, vennEval, vennElements, normSetText`. `setDefs`, `setEval` no se exportan.
