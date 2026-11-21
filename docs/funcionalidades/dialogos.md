# Sistema de diálogos y avisos

Resumen: hoy hay CINCO mecanismos separados, sin API común. No existe ningún `alert`/`confirm`/`prompt` nativo (grep: 0 coincidencias); el comentario 7634 indica que `ask` sustituye a `confirm`.

| Mecanismo | Elemento | Línea (HTML / JS) | Modal | Devuelve |
|---|---|---|---|---|
| Preguntas con Pío `ask()` | `<dialog id="ask">` | 793-803 / 7634-7663 | Sí (`showModal`) | `Promise` con `value` del botón o `null` |
| Toast `toast()` | `<div id="toast" role="status" aria-live="polite">` | 650 / 4683-4706 | No | nada |
| Popovers | `.pop` | 652-778 / 5515-5538 | No | nada (ver `interfaz.md` §3) |
| Diálogos `<dialog>` de contenido | `help`, `about`, `hist` | 846, 805, 826 / 7420-7421, 7751-7754, 7607-7624 | Sí | nada (se cierran con botón o Esc) |
| Asistentes con promesa | `bayesDlg`, `nnDlg` (clase `ask`) | 688, 707 / 6538-6575, 6913-6942 | Sí | `Promise` con datos o `null` |
| Barra de selección | `#pickBar` | JS 7095-7107 | No | (ver `interfaz.md` §5) |

## 1. `ask({title, text, label, pio, warn, buttons})` (7638)

- `buttons`: `[{label, value, kind: 'primary'|'danger'|'ghost', focus}]`. `kind` -> clases `mi-btn--primary|--danger|--ghost` (7650). `warn` añade clase `aviso` (7643). `pio` elige pose de Pío (`pioBadge`). `label` por defecto "Pío pregunta".
- Texto vía `textContent` (sin HTML: seguro).
- Cierre: clic en botón -> resuelve `value` y `askDlg.close()` (7652); Escape -> evento `cancel` resuelve `null` (7662); `close` resuelve `null` (7663). Llamar a `ask` con otra pregunta abierta resuelve la anterior con `null` (7639).
- Foco: botón con `focus:true`, si no el último botón (7659). El foco anterior NO se restaura explícitamente (lo hace `<dialog>` nativo al cerrar).
- Sin botón de cerrar visible ni clic en el fondo para cancelar; Escape es el único cierre sin botón. `aria-labelledby=askTitle`, `aria-describedby=askText` (793).
- Usos (todos 7xxx salvo grafos): borrar clase (7521), `guardUnsaved` (7686), vaciar página (7732), eliminar página (7743), nueva pizarra (7759), sustituir grafo (6833), vaciar grafo (6850).
- `ask` es `function` dentro de la IIFE: hoisting permite usarla antes (6833, 6850 la referencian antes de su definición textual).

## 2. `toast(text, kind='nota'|'aviso', action)` (4685)

- Un solo toast a la vez (se reemplaza `innerHTML`); contenedor `role=status` `aria-live=polite`.
- Estructura `.mi-callout--nota|aviso` con Pío (`idea`/`lectura`). `action = {label, fn}` añade un botón (p. ej. Deshacer); `mousedown` previene pérdida de foco.
- Tiempos: 4 s nota, 6,5 s aviso, 7 s con acción (4705). No se detiene al pasar el ratón ni al enfocarse; no hay botón de cerrar; no hay cola.
- Con `aria-live` se reanuncia al reemplazar contenido, pero la sustitución con `innerHTML=''` puede perderse en lectores de pantalla; los avisos de error usan el mismo canal `polite` (no `assertive`).

## 3. Popovers (5515-5538)

Ver `interfaz.md`. Accesibilidad: foco inicial al primer botón (5527), `aria-expanded` en el ancla, Escape y clic fuera cierran (8042, 5536). No hay trampa de foco, ni retorno del foco al ancla al cerrar, ni navegación con flechas en `role=menu`.

## 4. `<dialog>` de contenido y asistentes

- `help`, `about`, `hist`: `showModal()` (foco y Escape nativos, `aria-labelledby`), cierre con botón propio (`#helpClose` 7631, `#aboutClose` 7753, `#histClose` 7624). Sin clic en el fondo para cerrar. `#help` se cierra antes de abrir `#about` (7754).
- `bayesDlg`/`nnDlg`: patrón "abrir devuelve promesa": `openBayes()` (6560) y `openNN()` (6930) hacen `showModal()`, enfocan su primer campo y devuelven `Promise` que se resuelve en `bayesDone`/`nnDone` (con datos validados o `null`); `close` y `cancel` resuelven `null` (6575, 6942). Reutilizan estilo `ask` y su propia cabecera con Pío.
- El atajo global se silencia con `askDlg.open || nnDlg.open || bayesDlg.open` (8030): `#help`, `#hist`, `#about` NO están en esa lista, de modo que con `#hist` abierto atajos como `H`, `F`, `D` o `?` siguen actuando si el foco no está en un campo.

## 5. Ventanas nativas pendientes (flujos sin diálogo propio)

Detalle completo en `persistencia.md` (§5b). Para el servicio de diálogos son relevantes los puntos donde conviene un paso previo propio:
- `showDirectoryPicker` (7467, 7568) y `requestPermission` (7473): explicar qué carpeta elegir y por qué se pide permiso.
- `input type=file` (790, 834), descargas (7574, 7702, 6181), `window.print` (7845): confirmación/ayuda opcional.
- Errores de carpeta/guardado hoy se muestran como toast `aviso` de 6,5 s (7468, 7473, 7524, 7569, 7591), demasiado efímeros para acciones críticas como "no se ha podido guardar".

## 6. Qué faltaría para un servicio único de diálogos

API propuesta (todas devuelven `Promise`):

| Función | Equivale a | Resultado |
|---|---|---|
| `Dialogs.alert({title, text, pio, kind})` | `alert` | `undefined` |
| `Dialogs.confirm({title, text, confirmLabel, cancelLabel, danger})` | `confirm` | `true/false` |
| `Dialogs.prompt({title, text, value, placeholder, validate, multiline})` | `prompt` | `string/null` |
| `Dialogs.choose({title, text, options:[{label, value, kind}], focus})` | el `ask` actual con 3 botones (`guardUnsaved`) | `value/null` |
| `Dialogs.ask(spec)` | `ask` actual (compatibilidad) | igual que hoy |
| `Dialogs.toast(text, kind, action)` | `toast` | nada; mantener en `ui/toast.js` |

Elementos que faltan hoy:
1. Un único `<dialog>` reutilizable con cola (varias llamadas encadenadas) en lugar de `askResolve = null` que cancela la anterior (7639).
2. Campo de entrada (`prompt`) con validación y Intro = aceptar; hoy solo existen formularios ad hoc en `nnDlg`/`bayesDlg` y `<input>` flotantes en grafos (6816).
3. Lista de opciones (`choose`) con radio/botones y navegación por teclado.
4. Restauración explícita del foco al elemento que abrió el diálogo (popovers incluidos).
5. Cierre por clic en el fondo opcional (`cancelable`), `aria-modal`, `role=alertdialog` para destructivos.
6. Detección centralizada de "modal abierto" (`Dialogs.isOpen()`), para que `shortcuts.js` no necesite conocer `askDlg/nnDlg/bayesDlg` (8030) y cubra también `help/about/hist`.
7. Anuncio accesible (`aria-live=assertive`) para errores y toast con pausa al hover/foco y botón cerrar.
8. Estilo común (los `<dialog>` `help/about/hist` usan `.dlg-head`; `ask` usa `.ask-box`; unificar).
9. Variante "pre-nativa": `Dialogs.beforeNative({title, text, proceed})` para explicar selector de carpeta/permiso antes de invocarlos (7467, 7473, 7568).
10. Sustituir el acoplamiento por globales `window.__*` por eventos.
11. Pruebas: resolver `null` en Escape, en cierre programático y al abrir otra.

## Propuesta de módulos

| Fichero | Líneas origen | Dependencias externas |
|---|---|---|
| `js/ui/dialogs.js` (`ask` generalizado + `alert/confirm/prompt/choose`, cola, foco) | 793-803 (HTML), 7634-7663 | `pioBadge` (de `js/ui/pio.js`), CSS `.ask*` |
| `js/ui/toast.js` | 650, 4683-4706 | `pioBadge` |
| `js/ui/popovers.js` | 5515-5538 | DOM; `openPop` compartido con atajos y toolbar |
| `js/ui/dialog-help.js`, `dialog-about.js` | 805-824, 846-956, 7420-7421, 7631, 7751-7754 | `showModal`; coordinación con `Dialogs` para el estado "modal abierto" |
| `js/ui/dialog-bayes.js`, `dialog-nn.js` | 688-727, 6538-6575, 6913-6942 | `ask`/`Dialogs`, `OPS`/`ME` para validar, bloques para insertar (`runBayes`, grafo) |
| `js/ui/dialog-history.js` | 826-844 | ver `persistencia.md` |
