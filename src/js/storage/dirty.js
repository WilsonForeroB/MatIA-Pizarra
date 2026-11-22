/* Cambios sin guardar: indicador del botón Guardar y aviso antes de sustituir la pizarra (pizarra.html 7665-7695). */
MatIA.define('storage/dirty', ['core/dom', 'model/board', 'core/event-bus'], (dom, S, bus) => {
  'use strict';
  const { $, $$ } = dom;
  const R = (n) => MatIA.require(n);
  // ¿Hay cambios que no están guardados en el historial ni en un archivo?
  let savedSnap = null;
  const snap = () => JSON.stringify({ t: S.board.title || '', p: S.board.pages });
  const boardEmpty = () => S.board.pages.every((p) => !p.strokes.length && p.blocks.every((x) => (x.type === 'math' || x.type === 'text' ? !x.v : x.type === 'deriv' ? x.rows.every((r) => !r.l && !r.r && !r.note) : false)));
  const isDirty = () => !boardEmpty() && snap() !== savedSnap;
  const markSaved = () => { savedSnap = snap(); updSaved(); bus.emit('board:saved', S.board); };
  function updSaved() {
    const d = isDirty(), bt = $('#saveBtn');
    bt.classList.toggle('dirty', d);
    bt.title = (d ? 'Hay cambios sin guardar. ' : 'Todo guardado. ') + 'Guardar la clase en tu carpeta de clases (Ctrl+S)';
    bt.setAttribute('aria-label', d ? 'Guardar: hay cambios sin guardar' : 'Guardar: todo guardado');
  }
  bus.on('board:persisted', updSaved);
  async function quickSave() {
    if (await R('storage/history').saveToHistory()) updSaved();
  }
  $('#saveBtn').addEventListener('click', quickSave);
  updSaved();
  // Antes de sustituir la pizarra: guardar, seguir sin guardar o cancelar
  async function guardUnsaved(what) {
    if (!isDirty()) return true;
    const r = await R('ui/dialogs').ask({
      title: 'Hay cambios sin guardar',
      text: 'Antes de ' + what + ', ¿guardamos la clase actual' + (R('storage/history').histDir ? ' en la carpeta «' + R('storage/history').histDir.name + '»' : '') + '? Si no la guardas, sus cambios se perderán.',
      pio: 'escribiendo', warn: true, label: 'Aviso',
      buttons: [{ label: 'Cancelar', value: null, kind: 'ghost' }, { label: 'Continuar sin guardar', value: 'skip', kind: 'danger' }, { label: 'Guardar y continuar', value: 'save', kind: 'primary', focus: true }],
    });
    if (r === 'save') return await R('storage/history').saveToHistory();
    return r === 'skip';
  }
  return { snap, boardEmpty, isDirty, markSaved, updSaved, quickSave, guardUnsaved };
});
