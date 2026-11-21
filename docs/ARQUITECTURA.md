# Arquitectura de la pizarra MatIA

La pizarra se usa **abriendo `pizarra.html` con doble clic**, en cualquier navegador, sin servidor, sin instalar nada y sin conexión.
Esa condición manda sobre todo lo demás:

- **No hay módulos ES** (`import`/`export`): con `file://`, Chrome los bloquea por CORS. Cada fichero `.js` es un `<script>` clásico.
- **No hay `fetch` de ficheros locales** (también lo bloquea `file://`): los datos (plantillas, SVG de Pío…) viven dentro de los `.js`.
- **No hay paso de compilación**: lo que está en el repositorio es lo que se ejecuta.
- **Las dependencias van en `vendor/`**: MathLive 0.108.2 (MIT) y las fuentes (SIL OFL 1.1).

## Estructura

```
pizarra.html            ← único punto de ensamblado: HTML + <link> de estilos + <script> en orden
css/                    ← estilos (orden de carga = orden de la cascada original)
  tokens.css            · colores, tipografía, espacios (claro/oscuro)
  components/matia.css  · componentes mi-* del sistema de diseño
  layout.css · blocks.css · fit.css · components/{popovers,dialogs,tools}.css · graphics.css · solid.css · text.css · image.css · print.css · responsive.css
js/
  core/                 ← infraestructura, sin lógica de la pizarra
    namespace.js        · cargador MatIA.define / MatIA.require / MatIA.start
    dom.js              · $, $$, el(), root, body
    event-bus.js        · on / off / emit
  assets/pio.js         ← dibujos de Pío e insignia
  model/                ← datos de la clase (sin DOM)
    schema.js           · tablero por defecto, uid, sanitize por tipo de bloque
    board.js            · estado único (S.board), autoguardado en localStorage, toJSON
  engine/               ← motor matemático puro (sin DOM): se prueba en Node
    core/*.js + core.js · fracciones BigInt, tokenizador LaTeX, parser, Gauss y sistemas  → 'engine/core'
    ops/*.js  + ops.js  · operaciones paso a paso por tema (p. ej. ops/integrales.js)     → 'engine/ops'
                          · cálculo vectorial: ops/vec-input.js (lee «f(x,y)=…, P=(…), u=(…)», campos y cambios de variables),
                            ops/vectorial.js (parciales, gradiente, hessiana, jacobiana) y ops/campos.js (divergencia, rotacional, laplaciano)
  blocks/               ← tipos de bloque
    registry.js         · registro de tipos visuales
    editor.js           · ciclo de vida de líneas (math/text), página, foco, arrastre
    deriv.js            · desarrollo alineado por el «=»; `fitStack`: si las fórmulas son anchas, la clase `.deriv.stacked` pasa las notas bajo cada paso
    table, graph, graph3d (varias superficies), chart, ptree, geo, venn, net .js · un fichero por tipo, se registran solos
    solid.js            · sólido de revolución (perfil 2D, volumen y dibujo 3D)
    canvas3d.js         · proyector 2D, pintor, giro y panel de vista compartidos por graph3d y solid (sin WebGL)
    text.js             · texto enriquecido (línea de texto con formato, saneado de html)
    image.js            · bloque imagen (figura, pie de foto, ancho)
    fit.js              · fórmulas que no caben: reducción hasta el 60 % y «Partir»
    svg-utils.js        · ayudas SVG comunes
  ui/                   ← interfaz
    state.js            · estado de interfaz compartido (línea activa, celda activa, …)
    toast.js · dialogs.js · popovers.js · toolbar.js · templates.js · calc.js · ops-menu.js
    view.js · mode-pages.js · print.js (PDF e impresión) · drawing.js · shortcuts.js
    text-format.js · barra flotante de formato del texto · image-insert.js · botón Imagen, pegar y arrastrar
    examples.js         · ventana «Ejemplos» (temas, buscador, abrir copia, añadir páginas)
    export-image.js · bayes-dialog.js · nn-dialog.js · graphics-panel.js
  storage/              ← persistencia
    kv-store.js         · IndexedDB (recordar la carpeta)
    folders.js          · interfaz Folder + implementaciones (lectura/escritura y solo lectura)
    folder-access.js    · ÚNICO módulo que usa las APIs nativas de carpetas; ventanas con estilo antes
    history.js          · panel Historial: listar, abrir, añadir páginas, guardar, borrar, autoguardado
    assets.js           · imágenes de la clase en «imagenes/» (huella, sin duplicados, máx. 1600 px)
    dirty.js            · cambios sin guardar, botón Guardar, «¿guardar antes de…?»
    file.js             · Archivo: descargar/abrir .json, nueva pizarra, acerca de
  app/start.js          ← arranque (espera a MathLive, primer render)
  app/main.js           ← MatIA.start()
ejemplos/               ← banco de ejemplos: un <script> por ejemplo con MatIA.ejemplo({…}); miniaturas en ejemplos/img/
vendor/                 ← MathLive y fuentes, con sus licencias
tests/                  ← pruebas (ver «Pruebas»)
legacy/pizarra.html     ← prototipo original de un único fichero (referencia de las pruebas)
```

## El cargador (`js/core/namespace.js`)

```js
MatIA.define('ui/toast', ['core/dom', 'assets/pio'], (dom, pio) => {
  // … código del módulo …
  return toast;                    // API pública
});
```

- `define(nombre, dependencias, fábrica)` registra el módulo; no lo ejecuta.
- `require(nombre)` ejecuta la fábrica la primera vez (y antes las de sus dependencias) y devuelve su API.
- `start()` (en `app/main.js`) ejecuta todos los módulos **en el orden de `pizarra.html`**.
- **Dependencias circulares**: no se permiten en la lista de dependencias (el cargador lo detecta y lo dice).
  Cuando dos módulos se necesitan mutuamente (p. ej. el editor y el desarrollo), uno usa enlace tardío dentro de una función:
  `const R = (n) => MatIA.require(n);  …  R('blocks/deriv').focusCell(…)`.

## Banco de ejemplos

Cada fichero de `ejemplos/` llama a `MatIA.ejemplo({ id, tema, titulo, resumen, board })` (definido en `core/namespace.js`) y se carga con un
`<script>` en la zona «Banco de ejemplos» de `pizarra.html`. Se eligió así, en lugar de leer la carpeta con permiso, porque `file://` no deja
hacer `fetch` y la ventana de permiso de carpeta solo existe en Chrome y Edge: así los ejemplos se ven sin preguntar nada y en cualquier navegador.
`ui/examples` los lista (`MatIA.ejemplos()`), y al abrir uno lo pasa por `schema.sanitize` y le da ids nuevos (siempre es una copia).
Cómo añadir ejemplos: `ejemplos/LEEME.md`.

## Principios SOLID aplicados

| Principio | Dónde |
| --- | --- |
| **Responsabilidad única** | El motor (`engine/`) no toca el DOM; el modelo (`model/`) no dibuja; cada tipo de bloque, en su fichero; las APIs nativas de carpetas, solo en `folder-access`. |
| **Abierto/cerrado** | `blocks/registry`: un tipo nuevo se añade con un fichero que llama a `registry.register({ type, build })`, sin tocar el editor ni la impresión. `model/schema.register(type, sanitize)` hace lo mismo con la validación de datos. |
| **Sustitución de Liskov** | `storage/folders`: `fromHandle` (Chrome/Edge) y `fromFiles` (Firefox/Safari) cumplen la misma interfaz `Folder`; el historial no sabe cuál usa (solo mira `writable`). |
| **Segregación de interfaces** | Los módulos exportan lo que otros usan; p. ej. `ui/dialogs` ofrece `alert`, `confirm`, `prompt` y `ask` en vez de exponer el `<dialog>`. |
| **Inversión de dependencias** | `storage/history` depende de la abstracción `Folder` y del servicio `folder-access`, no de `showDirectoryPicker`. El modelo avisa por el bus (`board:persisted`) en lugar de llamar al historial. |

## Estado

- **Datos de la clase**: `model/board` → `S.board` (lo que se guarda en el `.json`). Nunca se copia en una variable: al abrir otra clase se sustituye con `S.replace(nuevo)`.
- **Estado de interfaz**: `ui/state` → `st.activeId`, `st.activeCell`, `st.mlReady`, `st.openPop`, `st.picking`, `st.zoomF`.
- **Eventos** (`core/event-bus`):

| Evento | Quién lo emite | Quién escucha |
| --- | --- | --- |
| `board:persisted` | `model/board` tras guardar en localStorage | `storage/dirty` (botón Guardar), `storage/history` (autoguardado) |
| `board:replaced` | `model/board.replace()` | (libre para nuevos módulos) |
| `board:saved` | `storage/dirty.markSaved()` | (libre para nuevos módulos) |

## Ventanas

En la pizarra **no se usan** `alert`, `confirm` ni `prompt` del navegador: todo pasa por `ui/dialogs` (ventana con Pío).
Las ventanas del sistema que no se pueden decorar (elegir carpeta, conceder permiso, elegir archivo, imprimir) solo aparecen
**después** de una ventana de MatIA que explica qué va a pasar y cuando la persona pulsa su botón.

## Cómo añadir…

- **Un tipo de bloque**: crea `js/blocks/mi-tipo.js` con `registry.register({ type: 'mi-tipo', build(b, bd, ro) {…}, exportable: true })`,
  añade su limpieza con `schema.register('mi-tipo', (x, base) => …)` (o en `SANITIZERS` de `model/schema.js`), su CSS en `css/` y
  su `<script>` en `pizarra.html` **antes** de `blocks/editor.js`. Documenta el formato en `docs/FORMATO-JSON.md`.
  Excepción de orden: `solid.js` (y `canvas3d.js`, que necesita), `text.js` e `image.js` deben cargarse **antes** de `model/board.js`, porque sus saneadores se registran al crearse el tablero.
- **Una operación del motor**: añade la función en el `engine/ops/<tema>.js` adecuado, expórtala en `engine/ops.js`, y añádela al menú en `ui/ops-menu.js`.
  Añade un caso a `tests/golden/cases.js` y regenera la referencia.
- **Un estilo**: usa los tokens de `css/tokens.css` (ver `docs/ESTILOS.md`).

## Pruebas

Requieren Node y Playwright (no hacen falta para usar la pizarra).

| Comando | Qué comprueba |
| --- | --- |
| `node tests/golden/engine-node.js <ficheros del motor>` | El motor da los mismos 53 resultados que el prototipo (sin navegador). |
| `node tests/golden/run.js compare pizarra.html` | Motor + render de todos los tipos de bloque idénticos a la referencia. |
| `node tests/e2e.js legacy/pizarra.html pizarra.html` | Un recorrido de uso da el mismo estado en el prototipo y en la versión modular. |
| `node tests/storage.js` | Flujos de carpeta (cualquier carpeta, ventanas con estilo, guardar, abrir, borrar, solo lectura). |
| `node tests/engine-features.js` | Sin navegador: `normalizeFn` (texto plano) e integrales (primitiva, Barrow, casos no soportados). |
| `node tests/features.js` | Gráfica 2D (funciones, rango Y, sin zoom con la rueda), explicación en la línea, Desarrollo desde cualquier línea, integrales y sólido desde el menú. |
| `node tests/solid.js` | Bloque «sólido de revolución» (perfil, volumen, vista 3D). |
| `node tests/graph3d.js` | Superficies 3D: girar sin quedar en blanco, varias superficies, panel y teclado de vista, centrar, ayuda en 2D y 3D. |
| `node tests/vectorial.js [--capturas]` | Cálculo vectorial: 35 comprobaciones del motor (parciales, gradiente, hessiana, jacobiana, divergencia/rotacional) y del menú Operaciones; `--capturas` guarda imágenes. |
| `node tests/fit.js [pizarra.html]` | Fórmulas que no caben: reducción hasta el 60 %, aviso «No cabe en la hoja» con «Partir», y `\text{…}` que pasa a línea de texto. |
| `node tests/text.js [pizarra.html]` | Texto enriquecido: barra de formato, saneado de `html` y fórmulas en línea. |
| `node tests/images.js [pizarra.html]` | Bloque imagen y almacén `imagenes/` con una carpeta simulada con subcarpetas. |
| `node tests/ejemplos.js [--capturas] [id…]` | Cada ejemplo se sanea sin perder bloques y se dibuja sin errores ni avisos; la ventana «Ejemplos». `--capturas` regenera `ejemplos/img/`. |
| `node tests/presentation.js` | Presentación de extremo a extremo; genera `docs/img/presentacion.pdf` y las capturas de `docs/img/`. |

`tests/golden/expected.json` se generó con el prototipo (`node tests/golden/run.js record legacy/pizarra.html`).
Si cambias el comportamiento a propósito, regenera la referencia con `record pizarra.html` y revisa el diff.

## Documentación por funcionalidad

`docs/funcionalidades/`: motor (núcleo y operaciones por tema), bloques, gráficos, interfaz, dibujo, atajos, persistencia y diálogos.
Esos documentos describen el prototipo y citan líneas de `legacy/pizarra.html`; cada módulo de `js/` indica en su cabecera de qué líneas viene.
