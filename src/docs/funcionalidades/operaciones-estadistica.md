# Operaciones de estadística y probabilidad (`OPS`)

Fuente: `pizarra.html:3668-3957` (sección «12. Estadística y probabilidad»; la numeración de secciones salta de 12 a 14, no existe la 13). Convenciones de bloques y errores como en `operaciones-algebra.md`. Ejemplos reales: `tests/golden/cases.js` y `expected.json` (`statsSummary`, `freqTable`, `sampleSpace`, `binomial`, `normal`, `bayes`).

Bloques de salida propios de este grupo:
- `{type:'deriv', rows}` (desarrollo, ver álgebra).
- `{type:'table', head, rows, vbar, hline, kind:'freq'|'cont'|'values', caption}`.
- `{type:'chart', kind:'bars'|'box'|'normal', title, ...}`: gráficos que dibuja la interfaz.
- `{type:'ptree', ev, causes:[...]}`: árbol de probabilidad (sólo `bayes`).

## Helpers comunes (`pizarra.html:3669-3671`)
`dec(v, k=4)` redondea a k decimales (sin `-0`), `decT` lo da con coma decimal y signo `−`, `fracOrDec(q, useDec)` elige fracción LaTeX o decimal. `dec/decT` también los usa la geometría (sección 14), por eso conviene sacarlos a un módulo común.

## 1. Estadística descriptiva

### 1.1 `statsSummary(latex)`: clave `stats` (`:3694`)
- **Para el profesor**: calcula media, mediana, moda, rango, varianza y desviación típica (poblacional y muestral), cuartiles, RIC, coeficiente de variación y dibuja un diagrama de caja.
- **Entrada** (`dataList`, `:3673`): lista de ≥2 datos separados por comas: `2, 3, 5, 5, 7`. Si se escribe `x = ...` sólo se usa lo que hay tras el último `=`. Con `;` como separador se admite coma decimal (`2,5; 3,5; 4`). Se ignoran llaves y paréntesis externos; los datos pueden ser fracciones o expresiones (`\frac{1}{2}`; se evalúan con `parseExpr` + `evalExact`). Si algún dato tiene punto decimal (`2.5`), todo se muestra en decimal (`useDec`). La interfaz permite lanzarla también desde un bloque de texto (`pizarra.html:7249`).
- **Salida**: `[deriv, chart box]`.
  - Filas del `deriv`: datos ordenados; `x̄ = Σxᵢ/n`; `Me` (mediana, con posición); `Mo` (moda/s; bimodal o multimodal; «no hay moda» si todo aparece una vez); rango; `σ²` y `σ` (poblacionales, con raíz simplificada con `sqrtSimp`/`sqrtLatex`); `s²` y `s` (muestrales, ÷ n−1); `Q1,Q2,Q3` (medianas de las mitades inferior y superior, excluyendo el dato central en n impar) y RIC; `CV` si la media no es 0.
  - `chart`: `{type:'chart', kind:'box', title:'Diagrama de caja', data, min, max, q1, med, q3, mean}`.
- **Errores**: «Escribe al menos dos datos separados por comas, por ejemplo 2, 3, 5, 5, 7 (con ; si usas coma decimal).», «No entiendo el dato «x».».
- **Depende de**: `dataList`, `medianOf` (`:3690`), `sqrtSimp`, `sqrtLatex`, `parseExpr`, `evalExact`, `dec`, `fracOrDec`.

### 1.2 `freqTable(latex)`: clave `freq` (`:3739`)
- **Entrada**: la misma lista de datos (valores discretos; no agrupa en intervalos).
- **Salida**: `[table, chart bars]`. Tabla `head:['xᵢ','nᵢ','fᵢ','Nᵢ','Fᵢ','%','xᵢ·nᵢ']`, una fila por valor distinto ordenado y una fila `Total`; `kind:'freq'`, `hline` antes del total, `caption` con la media Σxᵢnᵢ/n. `chart` = `{kind:'bars', labels, values, ylabel:'nᵢ'}` (diagrama de barras).
- **Depende de**: `dataList`, `fText`, `decT`.

## 2. Probabilidad básica

### 2.1 Espacio muestral: `sampleSpace(latex)` clave `space` (`:3760`)
- **Entrada**: experimentos separados por comas fuera de llaves o por `\times`: `moneda, dado`, `moneda, moneda, moneda`, `\{R,V,A\}, dado`. Se aceptan `moneda^3`, `3 monedas`... (potencia o prefijo numérico, regex en `:3772-3773`), mayúsculas/minúsculas indiferentes. Valores: moneda = {C, X}, dado = {1..6}, conjunto = lo escrito entre llaves.
- **Salida**: `deriv` con `Ω` (se lista si total ≤ 64, si no «N resultados»; la enumeración sólo se construye si total ≤ 216), `|Ω|` (principio de multiplicación) y `P(cada resultado)=1/total` (Laplace). Extras: 2 dados -> `table` de sumas (6×6, `kind:'values'`) + `chart bars` de la distribución de la suma (con `valueLabels` en fracciones /36); 2 a 8 monedas -> `chart bars` del nº de caras (binomial).
- **Errores**: «No reconozco «x»: escribe moneda, dado o un conjunto como {R, V, A}, separados por comas.», «El conjunto está vacío.», «Escribe el experimento: por ejemplo moneda, dado o «moneda, moneda».».
- **Depende de**: `fact`, `derivBlock`, `fText`.

### 2.2 Tabla de contingencia: `contingency(latex, env)` clave `cont` (`:3809`)
- **Entrada**: una **matriz r×c de frecuencias** no negativas (nombre o `\begin{pmatrix}...`), evaluada con `matrixOf`. Filas = sucesos A₁..A_r, columnas = B₁..B_c.
- **Salida**: `[table, deriv, table, table]`:
  1. tabla con totales marginales (`kind:'cont'`, `caption: N = ...`);
  2. `deriv`: `P(A₁)`, `P(B₁)`, `P(A₁∩B₁)`, `P(A₁|B₁)`, `P(B₁|A₁)` y comprobación de independencia `P(A₁)·P(B₁)` frente a `P(A₁∩B₁)` (la nota indica independencia si se cumple en **todas** las casillas);
  3. tabla de condicionadas por columna `P(Aᵢ|Bⱼ)`; 4. tabla por filas `P(Bⱼ|Aᵢ)`.
- **Errores**: «Las frecuencias no pueden ser negativas.», «La tabla está vacía.», «Necesito una matriz (o su nombre) en la línea.».
- **Limitación observada**: los rótulos usan subíndices Unicode `₁..₉` (`:3817`); con más de 9 filas/columnas aparecería `undefined`.
- **Depende de**: `matrixOf`, `fText`, `fLatex`, `ME` (fracciones).

### 2.3 Árbol de probabilidad y Bayes: `bayes(causes, evName)` (`:3836`)
- **No pasa por el `switch` de `runOp`**: la clave `bayes` abre un diálogo (`runBayes`, `pizarra.html:7246`, `:6576`) que recoge las causas (2 a 6 filas) y llama a `OPS.bayes(d.causes, d.ev)`; también se llama para validar mientras se escribe (`bayesPrev`, `:6559`).
- **Entrada**: `causes = [{name, p, l}]` (`p` = P(causa), `l` = P(suceso | causa)), `evName` = nombre del suceso (por defecto `B`). Cada valor es texto: decimal (`0.3` o `0,3`), fracción/expresión (`\frac{1}{3}`) o porcentaje (`30%`); debe estar entre 0 y 1. Ejemplo golden: `[{name:'A',p:'0.3',l:'0.1'},{name:'B',p:'0.7',l:'0.2'}]`, suceso `D`.
- **Salida**: `[ptree, deriv]`. `ptree` = `{type:'ptree', ev, causes:[{name, p, l, nl, prod, nprod}]}` (probabilidades como texto; `nl` = 1−l, `prod`/`nprod` = productos de cada rama). `deriv`: probabilidad total `P(B)=Σ P(Aᵢ)P(B|Aᵢ)` y, si `P(B)≠0`, `P(Aᵢ|B)` por Bayes para cada causa. Si algún dato es decimal, todo en decimal; si no, en fracciones exactas.
- **Errores**: «Falta P(A1).», «No entiendo «x» en P(B | A1).», «... debe estar entre 0 y 1.», «Las probabilidades de las causas deben sumar 1 (ahora suman 0,9).» (tolerancia 1e-9).
- **Depende de**: `parseExpr`, `evalExact`, `fText`, `fLatex`, `dec`, `decT`.

## 3. Distribuciones

Funciones comunes:
- `probQuery(latex)` (`:3878`): extrae `P(X=a)`, `P(X≤a)`, `P(X<a)`, `P(X≥a)`, `P(X>a)` o `P(a≤X≤b)` / `P(a<X<b)` (admite `\le`, `\leq`, `\ge`, `\geq`, `\lt`, `\gt`, `≤`, `≥`, y espacios); devuelve `{op, a, b?, sa?, sb?}` o `null` (sin consulta se muestra sólo el modelo).
- `distParams(latex, letter)` (`:3886`): lee los dos parámetros de `B(n, p)` o `N(μ, σ)` (con espacios eliminados).
- `erf` (`:3870`) por serie de Taylor (|x|<3) y fracción continua en las colas (precisión ~1e-12) y `Phi(z)=½(1+erf(z/√2))`, exportada como `OPS.Phi`.

### 3.1 `binomial(latex)`: clave `binom` (`:3893`)
- **Entrada**: `X\sim B(10, 0.3),\ P(X\le 3)` o, como en el golden, `B(10, 0.5), P(X=3)`. n entero 1..200, p en [0,1] (`0.3`, `3/10`; admite coma decimal en p).
- **Salida**: `[deriv, chart bars]`. `deriv`: modelo, fórmula `P(X=k)=\binom{n}{k}p^k(1-p)^{n-k}`, cálculo de la consulta (un valor de k: sustitución; varios: suma de `P(X=k)`; si más de la mitad de valores y > 6 términos: complementario `1-(…)`; ninguno: 0), `E[X]=np`, `Var(X)=np(1-p)` y σ. `chart` = `{kind:'bars', labels, values, hi:[ks resaltados], ylabel}`.
- **Errores**: «Escribe la binomial así: X\sim B(10, 0.3),\ P(X\le 3).», «n debe ser un entero entre 1 y 200.», «p debe estar entre 0 y 1.».
- Cálculo en coma flotante (`Number`), no exacto.
- **Depende de**: `distParams`, `probQuery`, `parseExpr`, `evalNum`, `evalExact`, `fact`, `dec`, `latexText`.

### 3.2 `normal(latex)`: clave `normal` (`:3938`)
- **Entrada**: `X\sim N(100, 15),\ P(X\le 120)` (el segundo parámetro es la **desviación típica σ**, no la varianza), `N(0,1), P(X<1)` (golden).
- **Salida**: `[deriv, chart normal]`. `deriv`: modelo, tipificación `Z=(X-μ)/σ`, consulta (`P(X=a)=0` por ser continua; `≤`/`<`: `Φ(z)`; `≥`/`>`: `1-Φ(z)`; entre: `Φ(zb)-Φ(za)`) con z a 2 decimales, y valor en porcentaje. `chart` = `{kind:'normal', title, mu, sigma, a, b}` (área sombreada entre `a` y `b`; `null` = sin extremo).
- **Errores**: «Escribe la normal así: X\sim N(100, 15),\ P(X\le 120). El segundo número es la desviación típica σ.», «σ debe ser positiva.».
- **Depende de**: `distParams`, `probQuery`, `Phi`, `parseExpr`, `evalNum`, `dec`, `decT`.

---

## Propuesta de módulos (este grupo)

| Fichero | Líneas | Contenido |
|---|---|---|
| `js/engine/ops/estadistica.js` | 3673-3758 | `dataList`, `medianOf`, `statsSummary`, `freqTable` |
| `js/engine/ops/probabilidad.js` | 3759-3868 | `sampleSpace`, `contingency`, `bayes` |
| `js/engine/ops/distribuciones.js` | 3869-3957 | `erf`, `Phi`, `probQuery`, `distParams`, `binomial`, `normal` |
| `js/engine/ops/common.js` (compartido) | 3669-3671 | `dec`, `decT`, `fracOrDec` (hoy aquí pero usados también por geometría) |

Dependencias cruzadas:
- `estadistica` -> `sqrtSimp`/`sqrtLatex` (definidos en vectores, `:2566-2575`), `fText`, `derivBlock`.
- `probabilidad` -> `fact` (`:1751`), `matrixOf` (`:2245`, utilidades de entrada), `parseExpr`/`evalExact` (árbol).
- `distribuciones` -> `latexText` (`:2842`, definido en aritmética), `parseExpr`, `evalNum`, `evalExact`, `fact`.
- Todo el grupo usa el árbol de expresiones (`parseExpr`, `evalExact`, `evalNum`) sólo para leer números sueltos: es la dependencia a respetar al ordenar las cargas.
- Exportados hoy (`pizarra.html:4528`): `statsSummary, freqTable, sampleSpace, contingency, bayes, binomial, normal, Phi`.
