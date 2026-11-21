/* Archivo: guardar/abrir .json, vaciar y eliminar página, acerca de, pizarra nueva, imprimir (pizarra.html 7696-7771). */
MatIA.define('storage/file', ['core/dom', 'model/board', 'model/schema', 'ui/toast'], (dom, S, schema, toast) => {
  'use strict';
  const { $, $$ } = dom;
  const { newPage, defaults, sanitize } = schema;
  const R = (n) => MatIA.require(n);
  /* ---------------- Archivo ---------------- */
  $('#saveFile').addEventListener('click', () => {
    R('ui/popovers').closePop();
    const blob = new Blob([JSON.stringify(S.board, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    const d = new Date();
    a.href = URL.createObjectURL(blob);
    a.download = 'pizarra-' + d.toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    R('storage/dirty').markSaved();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  });
  $('#openFile').addEventListener('click', async () => { R('ui/popovers').closePop(); if (await R('storage/dirty').guardUnsaved('abrir otro archivo')) $('#fileIn').click(); });
  $('#fileIn').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    R('ui/popovers').closePop();
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const b = sanitize(JSON.parse(String(rd.result)));
        if (!b) throw new Error('vacío');
        S.replace(b);
        R('ui/view').applySettings();
        R('blocks/editor').renderPage();
        S.save();
        R('storage/dirty').markSaved();
        toast('Pizarra abierta: ' + S.board.pages.length + (S.board.pages.length === 1 ? ' página.' : ' páginas.'));
      } catch (x) { toast('Ese archivo no es una pizarra válida.', 'aviso'); }
    };
    rd.readAsText(f);
    e.target.value = '';
  });
  $('#clearPage').addEventListener('click', async () => {
    R('ui/popovers').closePop();
    const ok = await R('ui/dialogs').ask({ title: '¿Vaciar esta página?', text: 'Se borran todas sus líneas y su dibujo. El resto de páginas no cambia.', pio: 'pizarra', warn: true, label: 'Aviso',
      buttons: [{ label: 'Cancelar', value: false, kind: 'ghost', focus: true }, { label: 'Vaciar página', value: true, kind: 'danger' }] });
    if (!ok) return;
    S.board.pages[S.board.cur] = newPage();
    R('blocks/editor').renderPage();
    S.save();
  });
  $('#pgDel').addEventListener('click', () => $('#delPage').click());
  $('#delPage').addEventListener('click', async () => {
    R('ui/popovers').closePop();
    if (S.board.pages.length === 1) { toast('Es la única página: en lugar de eliminarla, la vaciamos.'); $('#clearPage').click(); return; }
    const ok = await R('ui/dialogs').ask({ title: '¿Eliminar la página ' + (S.board.cur + 1) + '?', text: 'La página ' + (S.board.cur + 1) + ' de ' + S.board.pages.length + ' desaparecerá con todo su contenido.', pio: 'pizarra', warn: true, label: 'Aviso',
      buttons: [{ label: 'Cancelar', value: false, kind: 'ghost', focus: true }, { label: 'Eliminar página', value: true, kind: 'danger' }] });
    if (!ok) return;
    S.board.pages.splice(S.board.cur, 1);
    S.board.cur = Math.min(S.board.cur, S.board.pages.length - 1);
    R('blocks/editor').renderPage();
    S.save();
  });
  const aboutDlg = $('#about');
  $('#aboutBtn').addEventListener('click', () => { R('ui/popovers').closePop(); aboutDlg.showModal(); });
  $('#aboutClose').addEventListener('click', () => aboutDlg.close());
  $('#helpAbout').addEventListener('click', () => { $('#help').close(); aboutDlg.showModal(); });
  $('#newBoard').addEventListener('click', async () => {
    R('ui/popovers').closePop();
    if (R('storage/dirty').isDirty()) { if (!(await R('storage/dirty').guardUnsaved('empezar una pizarra nueva'))) return; }
    else {
      const ok = await R('ui/dialogs').ask({ title: '¿Empezar una pizarra nueva?', text: 'La pizarra se quedará en blanco, con una sola página.', pio: 'idea',
        buttons: [{ label: 'Cancelar', value: false, kind: 'ghost' }, { label: 'Pizarra nueva', value: true, kind: 'primary', focus: true }] });
      if (!ok) return;
    }
    R('storage/history').clearSession();
    const keep = { theme: S.board.theme, accent: S.board.accent, scale: S.board.scale };
    S.replace(Object.assign(defaults(), keep));
    R('ui/view').applySettings();
    R('blocks/editor').renderPage();
    S.save();
  });
  $('#printBtn').addEventListener('click', () => { R('ui/popovers').closePop(); R('ui/print').printAll(); });
  $('#fileBtn').addEventListener('click', (e) => { if (st.openPop && st.openPop.p.id === 'filePop') R('ui/popovers').closePop(); else R('ui/popovers').showPop('filePop', e.currentTarget); });
  return { aboutDlg };
});
