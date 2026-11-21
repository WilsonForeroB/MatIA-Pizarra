# Pizarra MatIA

Pizarra para dar clase de matemáticas: fórmulas con atajos de teclado, matrices, sistemas, desarrollos alineados por el «=», operaciones paso a paso, gráficas y dibujo a mano alzada. Sigue el sistema de diseño de MatIA.

> Creada por **Wilson Forero** ([github.com/WilsonForeroB](https://github.com/WilsonForeroB)) con asistencia de IA (Claude, de Anthropic). © 2026 Wilson Forero. Todos los derechos reservados.

## Cómo usarla

1. Descarga o clona el repositorio.
2. Abre **`index.html`** con doble clic. No hace falta servidor, instalar nada ni conexión a internet.
3. Para guardar las clases, pulsa **Historial → Conectar carpeta** y elige **cualquier carpeta** de tu ordenador (por ejemplo, la carpeta `historial/` del repositorio, que no se sube a Git).

## Estructura

```
index.html        ← la pizarra: ábrelo con doble clic (junta todos los módulos)
css/              ← estilos (tokens del sistema de diseño MatIA y componentes)
js/               ← código en módulos: core, model, engine (motor matemático), blocks, ui, storage, app
vendor/           ← MathLive y fuentes, incluidos para que funcione sin red
docs/             ← arquitectura, estilos, formato JSON y una ficha por funcionalidad
tests/            ← pruebas automáticas (opcionales, con Node y Playwright)
legacy/           ← prototipo original de un único fichero (referencia de las pruebas)
historial/        ← carpeta sugerida para guardar clases (su contenido no se sube a Git)
```

La organización del código y cómo ampliarlo está en [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).

## Requisitos

- **Cualquier navegador moderno** de escritorio. No necesita conexión: MathLive (MIT) y las fuentes están en `vendor/`.
- **Chrome o Edge**: la pizarra guarda directamente en la carpeta que elijas.
- **Firefox y Safari**: también sirven para dar clase. En el historial solo pueden *leer* la carpeta; para guardar descargan el JSON y hay que moverlo a esa carpeta a mano. Las imágenes de la clase se ven, pero no se pueden insertar nuevas.

## Cómo funciona el historial

1. Pulsa **Historial** y luego **Conectar carpeta**. Una ventana de MatIA explica qué va a pasar; al pulsar **Elegir carpeta** se abre la ventana del navegador para buscarla y después te pide permiso para leer y guardar en ella. Sirve **cualquier carpeta**.
2. Escribe un **título de la clase** y pulsa **Guardar en la carpeta**. Se crea un archivo con la fecha y el título, por ejemplo `2026-11-07_10-48_ecuaciones-de-primer-grado.json`.
3. Si marcas **Guardado automático**, ese mismo archivo se reescribe unos segundos después de cada cambio.
4. En la lista puedes:
   - **Abrir**: sustituye la pizarra actual por la clase guardada.
   - **Añadir páginas**: añade sus páginas detrás de las actuales, para reutilizar ejercicios.
   - **Borrar**: elimina el archivo de la carpeta, tras pedir confirmación.

La pizarra recuerda la carpeta. Por seguridad, el navegador olvida el permiso al cerrarse: la próxima vez basta con pulsar **Reconectar** (otra ventana de MatIA lo explica antes de que el navegador pregunte).

> Las ventanas del propio navegador (buscar la carpeta, conceder el permiso) no se pueden decorar: es una protección del navegador. Por eso la pizarra siempre muestra antes su propia ventana, y la del navegador solo aparece al pulsar su botón.

Además, la pizarra se guarda sola en el propio navegador (`localStorage`) y, desde **Archivo**, se puede descargar o abrir un `.json` suelto, imprimir o **Guardar como PDF**.

### Imágenes

Las imágenes (botón **Imagen**, Ctrl+V o arrastrarlas a la hoja) se guardan como archivos en la subcarpeta `imagenes/` de la carpeta de clases, con un nombre según su contenido (así no se duplican) y reducidas a 1600 px. Necesitan carpeta conectada: si no lo está, una ventana de MatIA te pide elegirla. Al pasar las clases a otro ordenador, copia también la carpeta `imagenes/`. Al conectar la carpeta, las imágenes se cargan solas.

### Formato del JSON

```json
{
  "app": "MatIA Pizarra",
  "formato": 1,
  "guardado": "2026-11-07T09:48:00.000Z",
  "title": "Ecuaciones de primer grado",
  "paper": "slide",
  "pages": [
    {
      "blocks": [
        { "type": "math", "v": "x+1=5", "align": "left" },
        { "type": "deriv", "rows": [{ "l": "x+1", "r": "5", "note": "Planteamiento" }] },
        { "type": "table", "rows": [["x", "-1", "0", "1"], ["f(x)", "1", "0", "1"]] },
        { "type": "graph", "fns": ["f(x)=x^2"], "xmin": -5, "xmax": 5 }
      ],
      "strokes": []
    }
  ],
  "cur": 0
}
```

Tipos de bloque:

| Tipo | Qué es |
| --- | --- |
| `math` | Línea de fórmula en LaTeX. |
| `text` | Línea de texto, con formato opcional (`html`; `v` es el texto plano). |
| `image` | Imagen guardada en `imagenes/`, con `w` (% del ancho), `align`, `caption` y `alt`. |
| `deriv` | Desarrollo alineado por el «=»: filas con lado izquierdo `l`, lado derecho `r` y explicación `note`. |
| `table` | Tabla de Ruffini, de verdad o de valores. |
| `graph` | Gráfica 2D de una o varias funciones (`fns`), con `xmin`/`xmax` y `ymin`/`ymax` opcionales (vacíos = automático) y `marks` opcionales (máximos, mínimos, inflexión, absolutos). |
| `graph3d` | Una o varias superficies z = f(x, y) (`fns`, hasta 4) con su rango, su vista (`az`, `el`, `zoom`) y `marks` opcionales (mínimos, máximos, puntos de silla). |
| `chart` | Gráfico estadístico: `kind` = `bars` (barras, con `hi` resaltadas), `box` (diagrama de caja) o `normal` (campana con el área entre `a` y `b`). |
| `ptree` | Árbol de probabilidad: causas con `p`, `l` = P(suceso \| causa) y los productos de cada camino. |
| `geo` | Dibujo de trigonometría y geometría: `kind` (`unit` circunferencia goniométrica con `deg` y `label`, `unitAll` ángulos notables, `tri` triángulo con `a`, `b`, `c`, `A`, `B`, `C`, `lines` rectas `lines[{a,b,c,name,dash}]` (ax + by + c = 0) y puntos `points[{x,y,name,kind}]`, `transv` paralelas y secante con `deg`). |
| `venn` | Diagrama de Venn: `n` (2 o 3), `expr` (expresión sombreada) o `shade` (zonas elegidas a mano, como máscaras A = 1, B = 2, C = 4) y `showEls`. |
| `net` | Grafo: `nodes` (con `label`, `x`, `y` y tipo de capa), `edges` (con peso opcional `w`), `directed` y rótulos de capa `caps`. |
| `solid` | Sólido de revolución: `fn`, `a`, `b`, `axis` (`x`, `y`, `y=k` o `x=k`), `k`, y la vista `az`, `el`, `zoom`. |

`strokes` guarda el dibujo a mano alzada de cada página. Los archivos antiguos sin `app` ni `formato` también se abren.

## Uso en clase (resumen)

Pulsa **?** dentro de la pizarra para ver todos los atajos.

- **Escribir**: `x^2`, `1/2`, `sqrt`, `in` (∈), `EE` (∃), `AA` (∀), `RR` (ℝ)… Intro crea una línea nueva.
- **Líneas numeradas**: cada línea lleva su número (1, 2, 3…) y los pasos de un desarrollo se numeran 3.1, 3.2… Así es fácil decir «vamos a la línea 3». Se pueden ocultar en **Vista ▾ → Líneas**; en presentación e impresión no aparecen.
- **+ Nueva línea**: en la barra y al final de la página (útil con lápiz o pantalla táctil). Intro sigue funcionando igual.
- **Duplicar** (⧉, botón «Duplicar» o **Ctrl+D**): copia la línea activa justo debajo (fórmulas, textos, tablas, gráficas, desarrollos…). Dentro de un desarrollo, ⧉ o Ctrl+D duplican solo ese paso.
- **Menús**: Matriz, Sistema, Desarrollo, **Símbolos ▾** (básicos —potencia, subíndice, fracción, raíz, paréntesis, traspuesta, inversa, flecha de paso—, lógica, conjuntos, números, relaciones, operaciones, flechas, probabilidad, **trigonometría y geometría** —°, ′, ″, sen, tg, ∠, △, ∥, ⊥, Pitágoras, teoremas del seno y del coseno, Herón, fórmulas de suma y de ángulo doble, distancias— y griegas) y **Cálculo ▾** (derivadas, integrales y límites). Los símbolos van todos dentro de los desplegables para que la barra no ocupe espacio.
- **Desarrollo** (Alt+L): pasos alineados por el «=» con explicación a la derecha. Intro copia la fila anterior para editar solo lo que cambia. Convierte **cualquier línea de fórmula**, tenga o no «=».
- **Explicación en la línea**: el botón 💬 de una línea de fórmula añade una explicación a su derecha, en la misma línea.
- **Selección en azul**: para no confundirla con el verde de la línea activa.
- **Calcular** (Ctrl+=) actúa sobre la línea en la que escribes. Con una integral (`\int f\,dx` o `\int_a^b f\,dx`) escribe la primitiva + C o el valor de la integral definida.
- **Operaciones ▾**: al elegir una operación aparece la barra **«Elige la línea»** y la pizarra lo muestra en color:
  - las líneas que sirven parpadean con un borde de color y las que no (gráficas, tablas…) se atenúan;
  - la línea activa queda resaltada con la etiqueta «↵ Línea N», y la barra dice «Vas a aplicar «…» a la línea N»;
  - al pasar el ratón, la línea (o el paso del desarrollo) se resalta con «Línea N · paso M»;
  - un clic (o toque con lápiz o dedo) **solo marca** la línea; la barra pasa a «Confirma la línea» y pregunta «¿Aplicar «…» a la línea N?»;
  - la operación **solo se lanza al pulsar «Aceptar»** (o Intro); se puede marcar otra línea o pulsar **Cancelar** sin que pase nada;
  - al terminar, Pío avisa: «aplicado a la línea 3; el resultado empieza en la línea 4», y ambas líneas destellan.
  **Intro** equivale a «Aceptar» y **Esc** cancela. Así, con varias ecuaciones en la misma página, decides cuál se resuelve.
- **Operaciones ▾**: todas paso a paso.

| Grupo | Operaciones |
| --- | --- |
| Matrices y sistemas | Gauss y Gauss-Jordan paso a paso (matriz, ampliada o sistema, con su clasificación); inversa por Gauss-Jordan; determinante por 2×2/Sarrus, cofactores o Gauss; regla de Cramer; discusión de sistemas con un parámetro; producto desarrollado; autovalores, autovectores y diagonalización. |
| Vectores | Producto escalar y vectorial, norma, ángulo y proyección. |
| Ecuaciones | Resolver paso a paso (1.º y 2.º grado, polinómicas con raíces racionales), siguiente paso y comprobación. |
| Aritmética | Simplificar y operar fracciones, m.c.d. y m.c.m. (factores primos y Euclides), descomposición en factores primos. |
| Polinomios | Desarrollar, Ruffini o división larga, raíces y factorización. |
| Estadística | Medidas de una lista de datos: media, mediana, moda, rango, varianza y desviación típica (poblacional y muestral), cuartiles, RIC y coeficiente de variación, con diagrama de caja. Tabla de frecuencias (nᵢ, fᵢ, Nᵢ, Fᵢ, %) con diagrama de barras. Los datos se separan con comas, o con `;` si usas coma decimal. |
| Probabilidad | Espacio muestral (moneda, dado, conjuntos como `{R,V,A}` o `moneda^3`) con regla de Laplace, y la tabla de sumas si son dos dados. Tabla de contingencia con marginales, conjuntas, condicionadas e independencia. **Asistente de árbol de probabilidad y Bayes**, con el árbol, la probabilidad total y las probabilidades a posteriori. Binomial `X\sim B(10, 0.3), P(X\le 3)` con diagrama de barras resaltado. Normal `X\sim N(100, 15), P(85\le X\le 115)` tipificando, con la campana y el área sombreada. |
| Combinatoria | n!, combinaciones, variaciones y permutaciones; triángulo de Pascal. |
| Lógica y conjuntos | Tabla de verdad con su clasificación; unión, intersección, diferencia, complementario, partes y producto cartesiano; **diagrama de Venn** de la expresión de la línea. |
| Trigonometría | **Convertir ángulos**: `150°`, `35°20′15″`, `\frac{5\pi}{6}` o `2.5 rad` (varios separados por comas dan una tabla); grados ↔ radianes exactos con π, grados-minutos-segundos y ángulo coterminal. **Razones trigonométricas** de `\sin 150°`, `210°` o `\cos\frac{5\pi}{3}`: cuadrante, ángulo de referencia, valores exactos (múltiplos de 15°), tabla de las seis razones y circunferencia goniométrica con seno, coseno y tangente. **Tabla de ángulos notables** de 0° a 360° (no necesita línea). |
| Geometría | **Resolver triángulos** `a=5, b=7, C=60°` con los teoremas del seno y del coseno: LLL, LAL, ALA/AAL y el caso ambiguo LLA (0, 1 o 2 triángulos), con área, perímetro, tipo y dibujo. **Rectas**: dos rectas (`2x+3y-6=0, y=2x+1`) dan la posición relativa (secantes, perpendiculares, paralelas o coincidentes), el punto de corte, el ángulo y la distancia entre paralelas; una recta y un punto (`3x+4y=10, P=(1,6)`) dan la distancia, la paralela y la perpendicular por el punto y el pie de la perpendicular; dos puntos (`A=(1,2), B=(4,6)`) dan la recta, la distancia y el punto medio. **Paralelas cortadas por una secante** `65°`: los 8 ángulos y sus relaciones. Todo con su dibujo. |
| Cálculo | Derivada con las reglas aplicadas; **máximos y mínimos de f(x)** (puntos críticos, clasificación con f″ o con el signo de f′, puntos de inflexión, tabla de crecimiento, extremos absolutos en ±∞ o en un intervalo `x∈[a,b]` y gráfica con los puntos marcados); **extremos de f(x, y)** (gradiente, puntos críticos, hessiana y clasificación en mínimo, máximo o punto de silla, con la superficie 3D marcada); gráfica de funciones y tabla de valores. **Integrales**: `\int f\,dx` da la primitiva + C y `\int_a^b f\,dx` la regla de Barrow (exacta o aproximada); **Integral paso a paso** (Operaciones ▾ → Cálculo) muestra los pasos. |

- **Gráficos ▾**:
  - **Gráfica 2D**: funciones y = f(x), una por campo, con «+ Añadir función» (hasta 6) y × para quitar; una ayuda de Pío bajo la lista lo recuerda. Acepta texto plano (`sin x`, `sen x`, `ln x`, `x^(1/2)`). Los botones Acercar, Alejar, ←↑↓→ y Ajustar mueven la vista, y los campos «x desde/hasta» e «y desde/hasta» fijan el rango (vacíos = automático). La rueda ya no hace zoom.
  - **Gráfica 3D**: una o varias superficies z = f(x, y) en el mismo dibujo («+ Añadir superficie», hasta 4; cada una con su color), también en texto plano (`z=sin(x)*cos(y)`). Se gira arrastrando o con el panel de la esquina (acercar, alejar, girar, inclinar y ⌂ para volver a la vista inicial), o con las flechas y +/− con el foco en el dibujo. Las gráficas nuevas salen centradas y «Izq./Centro/Der.» las mueve.
  - **Sólido de revolución**: perfil 2D y sólido 3D que gira, con su volumen (exacto, p. ej. 8π, o aproximado) y el método usado (discos, arandelas o capas).
  - **Grafo**: herramientas Mover, Nodo (clic en un hueco), Arista (arrastrar de un nodo a otro) y Borrar. Doble clic para renombrar un nodo o poner peso a una arista. Puede ser dirigido o no, y el botón **Matriz de adyacencia** añade la matriz y los grados debajo.
  - **Diagrama de Venn**: 2 o 3 conjuntos (A, B, C) dentro del universal U. Escribe la expresión (A ∩ B, A ∪ B, A ∖ B, Aᶜ, (A ∪ B)ᶜ, A Δ B…) con el teclado o con sus botones y se sombrea su zona, con color y rayado. Si en la página has definido `A = {…}`, `B = {…}`, `C = {…}` o `U = {…}`, cada elemento aparece en su zona y debajo sale el conjunto resultado. Con un clic en una zona la sombreas o la quitas a mano.
  - **Asistente de red neuronal**: escribe las neuronas por capa (por ejemplo `3, 4, 4, 2`) y monta el grafo por capas: entradas x₁…, ocultas h¹₁… y salidas ŷ₁…, con sesgo (+1) y pesos w opcionales. También está en el grafo, con el botón «Red neuronal…».
- **Dibujar** (Alt+D): lápiz, rotulador, flecha y goma. Un lápiz digital dibuja siempre, aunque estés en modo Escribir.
- **Texto con formato**: la línea de texto tiene una barra flotante con negrita, cursiva, subrayado, tachado (Ctrl+B/I/U), color, resaltado, tamaño, tipo de letra (también una manuscrita), alineación, listas, sangría y **∑ Fórmula** (una fórmula editable dentro del texto).
- **Fórmulas que no caben**: su letra se reduce hasta el 60 %. Si aun así no cabe, aparece el aviso «No cabe en la hoja» con el botón **Partir** (si tiene «=», la convierte en desarrollo). Una línea de fórmula que es solo `\text{…}` pasa sola a línea de texto al salir de ella; un aviso con **Deshacer** permite volver atrás.
- **Imágenes**: botón **Imagen**, Ctrl+V o arrastrar a la hoja. Se puede ajustar el ancho (10–100 %), la alineación y añadir pie de foto.
- **Tamaño de página** (Vista ▾): **Libre** (continua, como siempre), **A4 vertical**, **A4 horizontal**, **A3 horizontal** o **Diapositiva 16:9**. En los tamaños fijos se ve el borde de la hoja, la hoja se ajusta al ancho de la pantalla, se marca con una línea discontinua dónde termina la página si el contenido no cabe, y al imprimir o guardar en PDF cada página sale con ese tamaño.
- **Presentar** (botón de la cabecera): pantalla completa con solo la página actual, escalada para que quepa entera, como una diapositiva. **→ / ← / espacio / RePág / AvPág** para pasar, **Inicio / Fin** para ir a la primera o la última, **D** para dibujar encima y **Esc** para salir. Abajo hay una barra que se oculta sola. Recomendado con «Diapositiva 16:9».
- **Exportar gráficos**: cada gráfico (2D, 3D, grafo, red neuronal, Venn, barras, caja, normal, árbol, circunferencia, triángulo, rectas) tiene un botón ⤓ junto a la ×. Permite **descargar PNG** a doble resolución, **descargar SVG** (vectorial; no disponible en la 3D) o **copiar la imagen** para pegarla con Ctrl+V. La imagen incluye el título, la leyenda y el resultado. Con «Fondo claro» sale en colores claros aunque uses el tema oscuro.
- **Modo proyector**: pantalla completa (icono de la cabecera o tecla F), tamaño de letra, tema claro u oscuro y ocultar barras (H).
- **Guardar como PDF** (botón **PDF** de la cabecera o **Archivo → Guardar como PDF**): una página o diapositiva por hoja. Una ventana de MatIA explica que, en el diálogo del navegador, hay que elegir «Guardar como PDF» como destino. Espera a que carguen las imágenes y las fórmulas, y avisa de las páginas que no caben. Para presentaciones, usa antes **Vista ▾ → Diapositiva 16:9**.
- **Guardar** (botón verde de la cabecera o **Ctrl+S**): guarda la clase en tu carpeta de clases. Un punto blanco en el botón indica que hay cambios sin guardar. La primera vez pide la carpeta (cualquiera); después reescribe siempre el archivo de esa clase. En navegadores sin acceso a carpetas, descarga el JSON.
- **Páginas**: «+ Página» añade una página detrás de la actual y «− Página» elimina la actual; si es la única, la vacía.
- **Avisos con Pío**: las confirmaciones (borrar página o clase, pizarra nueva) usan un diálogo propio con los colores de la pizarra, no los avisos del navegador. Si vas a abrir otra clase, empezar una nueva o abrir un archivo con cambios sin guardar, la pizarra ofrece **Guardar y continuar**, **Continuar sin guardar** o **Cancelar**. Al cerrar la pestaña no pregunta nada: la pizarra ya está guardada en el navegador y, con el guardado automático, también en tu carpeta.
- **Pío** acompaña en la cabecera (logotipo), en la página vacía, en la barra «Elige la línea», en el menú de operaciones, en la ayuda y en el historial.

## Límites conocidos

- El cálculo es exacto con fracciones. Las raíces se simplifican, pero no hay un motor simbólico completo: las ecuaciones racionales o con varias incógnitas no se resuelven paso a paso.
- Trigonometría: no resuelve todavía ecuaciones trigonométricas ni arcoseno o arcocoseno de un valor; la geometría es del plano (2D).
- La discusión con parámetro admite un parámetro y sistemas cuadrados.
- Los autovalores irracionales se dan con la fórmula exacta en el caso de grado 2. En grados mayores solo se buscan raíces racionales.
- Integrales: no integra productos de funciones (x·sen x), cocientes racionales generales ni sustituciones no lineales; sí polinomios, potencias, exponenciales, trigonométricas, 1/x, 1/(1+u²), 1/√(1−u²) y ln(ax+b), con argumento lineal.

## Desarrollo

- Código modular sin compilación: scripts clásicos registrados con `MatIA.define` (funciona con `file://`). Ver [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).
- Estilos: [`docs/ESTILOS.md`](docs/ESTILOS.md). Formato de las clases: [`docs/FORMATO-JSON.md`](docs/FORMATO-JSON.md). Fichas por funcionalidad: [`docs/funcionalidades/`](docs/funcionalidades/).
- Pruebas (opcionales, con Node y Playwright): `node tests/golden/run.js compare index.html`, `node tests/e2e.js legacy/pizarra.html index.html`, `node tests/storage.js`, `node tests/engine-features.js` (normalización de funciones e integrales, sin navegador), `node tests/features.js` (gráfica 2D, explicación en la línea, Desarrollo, integrales y sólidos) `node tests/solid.js` (sólido de revolución), `node tests/graph3d.js` (superficies 3D y ayuda de las gráficas), `node tests/fit.js` (fórmulas que no caben), `node tests/text.js` (texto con formato), `node tests/images.js` (imágenes) y `node tests/presentation.js` (presentación de extremo a extremo; genera `docs/img/presentacion.pdf` y las capturas de `docs/img/`).
- No guarda credenciales ni datos personales. El historial vive solo en la carpeta local de quien la usa.

## Autoría y derechos

**Pizarra MatIA**, creada por **Wilson Forero** ([github.com/WilsonForeroB](https://github.com/WilsonForeroB)) con asistencia de inteligencia artificial (Claude, de Anthropic).

© 2026 Wilson Forero. **Todos los derechos reservados.** Uso exclusivamente educativo y no comercial. Queda prohibida cualquier reproducción, distribución, comunicación pública, transformación o explotación, total o parcial, con fines comerciales sin autorización expresa y por escrito del autor; su incumplimiento podrá ser objeto de acciones legales conforme a la legislación de propiedad intelectual aplicable. Ver también el `LICENSE` de la raíz del repositorio.

Componentes de terceros, con sus propias licencias: MathLive (© Arno Gourdol, licencia MIT) y las fuentes IBM Plex Sans, JetBrains Mono, Source Serif 4 y Caveat (SIL Open Font License 1.1).

El aviso aparece también dentro de la pizarra: al pie de la ayuda (**?**), en **Archivo → Acerca de y derechos** y en los metadatos del HTML.
