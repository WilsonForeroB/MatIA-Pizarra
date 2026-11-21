# Persistencia

Todo el código vive en la IIFE de `pizarra.html` (4543-8100). Resumen: autoguardado en `localStorage`, Historial en carpeta (File System Access API + IndexedDB para el handle), alternativa de descarga/lectura en navegadores sin la API, y Archivo (JSON manual).

## 1. Modelo y autoguardado local

| Elemento | Línea | Detalle |
|---|---|---|
| Clave | 4547 | `KEY = 'matia-pizarra-v1'` |
| `defaults()` | 4576 | `{v:1, paper:'free', pages:[newPage()], cur:0, theme:null, accent:'', scale:140, color:'ink', tool:'pen', width:3}` |
| `newPage()` | 4575 | `{blocks:[newBlock()], strokes:[], minH:0}` |
| `load()` | 4578 | Lee y `sanitize(JSON.parse(...))`; ante error devuelve null (arranca con `defaults()`, 4670) |
| `sanitize(b)` | 4590-4669 | Valida/normaliza tema, acento, escala 80-260, color, herramienta, `histAuto`, `lineNums`, papel, ancho, `title` (<=120), páginas y bloques (tipos: deriv, table, graph3d, chart, ptree, geo, venn, net, graph, text, math). IDs de bloque se regeneran siempre (`uid()`, 4607). `strokes` solo se filtra por `pts` array (4664) |
| `save()` | 4674 | Debounce 350 ms -> `localStorage.setItem(KEY, JSON.stringify(board))` (try/catch silencioso) -> `window.__histAutoHook()` -> `window.__updSaved()` |

- Se guarda el tablero completo, incluidos ajustes visuales (`theme`, `scale`, ...) y `title`, `histAuto`.
- No hay `beforeunload`: el debounce de 350 ms puede perder el último cambio al cerrar (no inventado: no existe tal manejador en el fichero).
- No hay límite de tamaño ni aviso de cuota (el error de `setItem` se ignora, 4677).
- Acoplamiento por globales `window.__histAutoHook` (7606) y `window.__updSaved` (7677).

## 2. Estado "sin guardar"

`savedSnap`, `snap()` (7667: título + páginas), `boardEmpty()` (7668), `isDirty()` (7669: no vacío y distinto del último guardado), `markSaved()` (7670), `updSaved()` (7671: clase `dirty` y título/aria-label de `#saveBtn`). `guardUnsaved(what)` (7684) pregunta con `ask`: Cancelar / Continuar sin guardar / Guardar y continuar. Se usa en: abrir desde historial (7540), abrir archivo (7709), nueva pizarra (7757).

`markSaved` se invoca tras: guardar al historial (7587), descargar (7579), autoguardado (7603), Guardar archivo (7706), abrir historial/archivo (7545, 7723). NOTA: `#fileIn` `onload` y `openHist` llaman a `markSaved` pero la apertura de archivo NO restaura `sessionFile` (queda el anterior).

## 3. Historial con carpeta (7423-7632)

Diálogo `<dialog id="hist">` (826-844): `#histStatus`, `#histConnect`, `#histReconnect`, `#histPickRO`, `#histDirIn`, `#histHelp`, `#histName`, `#histSave`, `#histAuto`, `#histList`.

Variables (7428): `histDir` (handle de escritura), `histRO` (solo lectura, `{name, files}`), `sessionFile` (nombre de la clase actual), `autoT`, `lastAutoJSON`. `FS_OK = typeof window.showDirectoryPicker === 'function'` (7427).

### 3.1 Conectar carpeta
- `#histConnect` (7466): `showDirectoryPicker({id:'matia-historial', mode:'readwrite'})` -> `useDir(d)`. `AbortError` se ignora; otros errores -> toast de aviso (7468).
- `useDir(dir)` (7456): si el nombre != `historial`, intenta `getDirectoryHandle('historial', {create:true})` (7458-7460) y, si falla, usa la elegida. Fija `histDir`, anula `histRO`, guarda el handle en IndexedDB (`IDB.set('histDir', dir)`, 7462), `setStatus()`, `listHist()`.
- `setStatus()` (7445): texto de estado, botón Conectar/Cambiar, etiqueta del botón guardar ("Descargar para el historial" si no hay API), `#histAuto` solo habilitado con `histDir`; ayuda alternativa para Firefox/Safari (7454).

### 3.2 IndexedDB del handle
`IDB` (7429-7433): BD `matia-pizarra` v1, almacén `kv`; `db()`, `get(k)`, `set(k,v)`. Errores tragados (devuelven null). Solo se usa la clave `histDir`. Nunca se borra el handle.

### 3.3 Reconectar y permisos
- Al pulsar `#histBtn` (7607): rellena nombre/auto, `showModal()`, y si `FS_OK` y no hay `histDir`, lee el handle de IDB y `queryPermission({mode:'readwrite'})` (7614-7616): `granted` -> `useDir`; si no, muestra `#histReconnect` y el texto "pulsa Reconectar para dar permiso" (7618).
- `#histReconnect` (7470): `requestPermission({mode:'readwrite'})` (7473, requiere gesto de usuario); si `granted`, `useDir(d)`; fallo -> toast.
- Arranque (7626-7630): si `FS_OK` y `board.histAuto`, consulta `queryPermission`; si `granted`, `histDir = d` (la expresión `d.name === 'historial' ? d : d` es redundante) y marca `#histAuto`. No llama a `setStatus()` ni `listHist()`.
- Si no hay permiso al arrancar, el autoguardado no se activa hasta abrir Historial y Reconectar.

### 3.4 Listar y abrir
- `readEntries()` (7485): itera `histDir.values()`, solo `*.json`, ordena por nombre descendente (el nombre empieza por fecha). En modo RO usa `histRO.files`.
- `listHist()` (7498): una fila por archivo con título "bonito" derivado del nombre (7511-7513), fecha, KB; botones Abrir (7518), Añadir páginas (7519), Borrar (7520, solo con handle).
- `openHist(it, append)` (7530): `sanitize(JSON.parse(texto))`; si no es válido -> toast. Añadir: concatena páginas y salta a la primera añadida (no pide confirmación). Abrir: `guardUnsaved`, conserva `theme/accent/scale` del tablero actual (7541), `sessionFile = it.name` si hay `histDir`, `lastAutoJSON`, `markSaved`, `applySettings`, `renderPage`, `save`, cierra el diálogo.
- Borrar (7520-7525): `ask` con aviso y `histDir.removeEntry(name)`.

### 3.5 Guardar y nombre de archivo
- Formato: `boardJSON()` (7442): `{app:'MatIA Pizarra', formato:1, guardado: ISO, ...board}` con sangría 1.
- Nombre: `stampName()` (7436): `AAAA-MM-DD_HH-MM[_slug-del-titulo].json`; `slug` (7435) quita acentos, minúsculas, `-`, máx. 50. Se fija una vez por clase (`sessionFile`, 7584); luego se reescribe el mismo archivo (cambiar el título NO renombra el archivo). `sessionFile` se resetea con Nueva pizarra (7763) y al borrar el archivo actual (7524).
- `#histSave` (7560): copia `#histName` a `board.title`, `save()`, `saveToHistory()`. `#histName` `change` (7593).
- `saveToHistory()` (7565): (1) si `FS_OK` y no hay `histDir`: `showDirectoryPicker` -> `useDir`; cancelar -> `false`; (2) si no hay `histDir` (sin API): descarga con `<a download>` (7572-7578) y toast "Muévelo a la carpeta pizarramatia/historial"; (3) con `histDir`: `writeHist(sessionFile)` (7554: `getFileHandle(create)`, `createWritable`, `write`, `close`), toast, `listHist()`.
- Disparadores: `#histSave`, `#saveBtn` y Ctrl+S (`quickSave`, 7678/8054), `guardUnsaved` -> "Guardar y continuar".

### 3.6 Guardado automático
`#histAuto` `change` (7594): `board.histAuto` + `autoSave()`. `window.__histAutoHook` (7606): debounce 4 s tras cada `save()`. `autoSave` (7595): requiere `histDir` y casilla; no escribe si `JSON.stringify(board) === lastAutoJSON` (compara con tablero sin cabecera); errores silenciosos "se reintenta". Se desactiva el check (disabled) sin `histDir`.

### 3.7 Alternativa Firefox / Safari (sin `showDirectoryPicker`)
- `#histConnect` oculto, `#histPickRO` visible (7449-7451): abre `<input type=file webkitdirectory multiple id=histDirIn>` (7475). `change` (7476): filtra `.json`, crea `histRO = {name, files}` (el nombre sale de `webkitRelativePath`), `histDir = null`.
- Se puede listar y Abrir/Añadir, pero no Borrar (`it.handle` ausente), ni autoguardado, ni escribir: guardar = descarga manual y mover el archivo (7572-7578). Texto en `#histHelp` (7454).
- `histRO` no se persiste: hay que volver a elegir la carpeta en cada sesión.

## 4. Archivo (7696-7770)

| Acción | Línea | Detalle |
|---|---|---|
| Guardar archivo (.json) | 7697-7708 | `JSON.stringify(board, null, 1)` (SIN cabecera `app/formato`, a diferencia de `boardJSON`), nombre `pizarra-AAAA-MM-DD.json`, `<a download>`, `markSaved()` |
| Abrir archivo... | 7709-7729 | `guardUnsaved` -> `fileIn.click()` (selector nativo) -> `FileReader` -> `sanitize` -> sustituye `board` ENTERO (incluye tema/escala del archivo, a diferencia de Historial que los conserva) -> `applySettings`, `renderPage`, `save`, `markSaved`, toast |
| Imprimir o PDF | 7770 | ver `interfaz.md` §11 |
| Vaciar / Eliminar página, Nueva pizarra | 7730-7769 | confirmaciones con `ask` |

Inconsistencias: dos formatos de JSON (con/sin cabecera); `openFile` no actualiza `sessionFile`, ni `title` en `#histName` (se refresca al abrir el diálogo, 7608).

## 5. Problemas detectados

### (a) Subcarpeta `historial` forzada
- `useDir` (7456-7460): si la carpeta elegida no se llama `historial`, crea/usa la subcarpeta `historial` DENTRO de ella. Es decir, elegir "Documentos" crea `Documentos/historial` y escribe allí; la lista solo muestra esa subcarpeta.
- Textos que lo asumen: `#histHelp` (836: "Elige la carpeta historial ... o pizarramatia"), cabecera del bloque (7423 "carpeta pizarramatia/historial"), toast de descarga (7578), `title` del botón (575 "carpeta historial"), ayuda (952, texto sobre Historial), `id:'matia-historial'` del picker (7467, 7568).
- Mala interacción con el reinicio: el handle guardado en IDB es el de la subcarpeta ya resuelta (7462), por lo que `setStatus` muestra "historial" en lugar del nombre real elegido; y en el arranque (7629) la expresión ternaria no hace nada.
- Cambio propuesto: eliminar el bloque 7458-7460 (usar el handle tal cual), cambiar los textos a "carpeta de clases", mantener `id` del picker y valorar `startIn:'documents'`. Migración: quien ya tenga `historial` guardado en IDB sigue funcionando sin cambios.

### (b) Inventario de ventanas nativas del navegador

Búsqueda con grep en todo el fichero: `alert(`, `confirm(`, `prompt(` -> 0 coincidencias (el comentario 7634 confirma que `ask` sustituyó a `confirm`).

| API nativa | Línea | Flujo |
|---|---|---|
| `showDirectoryPicker` | 7467 | Historial > Conectar/Cambiar carpeta |
| `showDirectoryPicker` | 7568 | `saveToHistory` sin carpeta (en navegadores con API): Guardar, Ctrl+S, "Guardar y continuar" de `guardUnsaved` |
| Permiso del navegador (readwrite) | 7467, 7568 | Implícito al elegir carpeta con `mode:'readwrite'` |
| `requestPermission` | 7473 | Historial > Reconectar (aviso nativo de permiso) |
| `queryPermission` | 7614 | Abrir Historial (sin ventana, solo consulta) |
| `queryPermission` | 7629 | Arranque con `histAuto` (sin ventana) |
| `<input type=file>` `#fileIn` | 790 (click en 7709) | Archivo > Abrir archivo... (tras `guardUnsaved`) |
| `<input type=file webkitdirectory>` `#histDirIn` | 834 (click en 7475) | Historial > "Elegir carpeta (solo lectura)" (sin API) |
| Descarga `<a download>` | 7574-7578 | Guardar al historial sin API (Firefox/Safari) |
| Descarga `<a download>` | 7702-7707 | Archivo > Guardar archivo (.json) |
| Descarga `download()` | 6181-6187 (llamado desde `doExport`, 6188+) | Exportar gráfico PNG/SVG (`expPop`) |
| `navigator.clipboard.write` | 6215-6216 | Exportar gráfico > Copiar imagen (puede mostrar permiso nativo) |
| `window.print()` | 7845 | Archivo > Imprimir o PDF (`printAll`) |
| `requestFullscreen` | 7369 | Presentar (aviso nativo "pulsa Esc", sin fallo visible) |
| `requestFullscreen` | 7413 | F / `#fsBtn` (en fallo, toast propio) |
| `exitFullscreen` | 7378, 7412 | salir |

No existe `beforeunload`, `window.open`, `showOpenFilePicker` ni `showSaveFilePicker`. Los selectores nativos (carpeta/archivo/permiso/impresión) no se pueden sustituir por HTML; lo que sí se puede es preceder cada uno de una explicación propia (diálogo de Pío) y envolver las confirmaciones. Ver `dialogos.md`.

### (c) Otros problemas
1. `autoSave` y `saveToHistory` comparten `sessionFile`; si el usuario abre un archivo (Archivo > Abrir) `sessionFile` no se actualiza y el autoguardado puede sobrescribir la clase anterior con el contenido nuevo (7709-7729 vs 7584/7600). Verificable por lectura.
2. `histRO` y `histDir` ofrecen "Añadir páginas" sin confirmación y sin `markSaved` (7534-7538; luego sí `save()` y `updSaved` indirecto).
3. IDB solo guarda un handle; errores del IDB se tragan, no hay mensaje (7429-7433).
4. Sin `beforeunload` ni `visibilitychange` para forzar `save()`/`autoSave`.
5. `sanitize` no valida trazos (4664).
6. `boardJSON` y Guardar archivo duplican la lógica de descarga (7572-7578, 7702-7707, 6181); candidata a `downloadBlob()`.

## Propuesta de módulos

| Fichero | Líneas origen | Dependencias externas |
|---|---|---|
| `js/storage/model.js` (`KEY`, `defaults`, `newBlock/newRow/newPage/uid`, `sanitize`, `cleanMarks`, `load`) | 4547, 4570-4669 | ninguna (puro); `MARK_KINDS` |
| `js/storage/local.js` (`save` con debounce, hooks) | 4673-4681 | `board`, hooks (sustituir `window.__histAutoHook`/`__updSaved` por eventos o callbacks registrados) |
| `js/storage/idb.js` (`IDB`) | 7429-7433 | `indexedDB` |
| `js/storage/history-fs.js` (`useDir`, `readEntries`, `writeHist`, `stampName`, `slug`, `boardJSON`, permisos, autoSave) | 7427-7473, 7485-7496, 7554-7559, 7565-7606, 7626-7630 | `board`, `sanitize`, `IDB`, `toast`/diálogos, `markSaved`, `renderPage`, `applySettings` |
| `js/ui/history-dialog.js` (diálogo `#hist`, `listHist`, `openHist`, modo RO) | 7426, 7445-7455, 7475-7484, 7498-7553, 7607-7624 | `history-fs`, `pioBadge`, `ask`, `guardUnsaved`, `hist.showModal` |
| `js/storage/dirty.js` (`snap`, `isDirty`, `markSaved`, `updSaved`, `guardUnsaved`) | 7665-7694 | `board`, `ask`, `saveToHistory`, `#saveBtn` |
| `js/storage/file.js` (descargar/abrir JSON, nueva pizarra) | 7696-7769 | `board`, `sanitize`, `guardUnsaved`, `applySettings`, `renderPage`, `save`, `toast`, `ask`; helper `downloadBlob` compartido con la exportación de gráficos (6181) |
