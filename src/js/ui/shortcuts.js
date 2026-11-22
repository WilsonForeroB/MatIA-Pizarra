/* Atajos de teclado globales (pizarra.html 8026-8072). */
MatIA.define('ui/shortcuts', ['core/dom', 'model/board', 'ui/state'], (dom, S, st) => {
  'use strict';
  const { $, $$ } = dom;
  const { body } = dom;
  const R = (n) => MatIA.require(n);
  /* ---------------- Atajos globales ---------------- */
  document.addEventListener('keydown', (e) => {
    const editing = e.target.closest && e.target.closest('math-field,[contenteditable="true"],input,select,textarea');
    const k = e.key;
    if ($('#ask').open || $('#nnDlg').open || $('#bayesDlg').open) return;
    const modal = !!$('dialog[open]'); // historial, ayuda o acerca de: Ctrl+S sí funciona, las teclas sueltas no
    if (body.classList.contains('presenting')) {
      R('ui/mode-pages').presIdle();
      if (k === 'Escape') { e.preventDefault(); if (editing && document.activeElement.blur) document.activeElement.blur(); else R('ui/mode-pages').endPresent(); return; }
      if (!editing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || k === ' ') { e.preventDefault(); R('ui/mode-pages').goPage(S.board.cur + 1); return; }
        if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp') { e.preventDefault(); R('ui/mode-pages').goPage(S.board.cur - 1); return; }
        if (k === 'Home') { e.preventDefault(); R('ui/mode-pages').goPage(0); return; }
        if (k === 'End') { e.preventDefault(); R('ui/mode-pages').goPage(S.board.pages.length - 1); return; }
        if (k === 'd' || k === 'D') { e.preventDefault(); R('ui/mode-pages').setMode(body.dataset.mode === 'draw' ? 'write' : 'draw'); R('ui/mode-pages').updatePres(); return; }
      }
    }
    if (k === 'Escape' && st.openPop) { e.preventDefault(); e.stopPropagation(); R('ui/popovers').closePop(); return; }
    if (e.altKey && !e.ctrlKey && !e.metaKey) {
      const code = e.code;
      if (code === 'KeyD') { e.preventDefault(); R('ui/mode-pages').setMode(body.dataset.mode === 'draw' ? 'write' : 'draw'); return; }
      if (code === 'KeyM') { e.preventDefault(); R('ui/templates').insertLatex(R('ui/templates').matrixLatex(2, 2, 'pmatrix')); return; }
      if (code === 'KeyS') { e.preventDefault(); R('ui/templates').insertLatex(R('ui/templates').systemLatex(2)); return; }
      if (code === 'KeyL') { e.preventDefault(); R('blocks/deriv').startDeriv(); return; }
      if (code === 'KeyT') { e.preventDefault(); $('#textBtn').click(); return; }
      if (/^Digit[1-6]$/.test(code)) { e.preventDefault(); R('ui/toolbar').setColor(R('ui/view').COLOR_NAMES[+code.slice(5) - 1]); return; }
      if (k === 'PageDown') { e.preventDefault(); R('ui/mode-pages').goPage(S.board.cur + 1); return; }
      if (k === 'PageUp') { e.preventDefault(); R('ui/mode-pages').goPage(S.board.cur - 1); return; }
    }
    if ((e.ctrlKey || e.metaKey) && !e.altKey && (k === 's' || k === 'S')) { e.preventDefault(); e.stopPropagation(); R('storage/dirty').quickSave(); return; }
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (k === 'd' || k === 'D') && body.dataset.mode === 'write') { e.preventDefault(); e.stopPropagation(); R('ui/toolbar').duplicateActive(); return; }
    if ((e.ctrlKey || e.metaKey) && (k === '=' || e.code === 'Equal') && !e.altKey) { e.preventDefault(); R('ui/calc').runCalc(); return; }
    if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'z' && body.dataset.mode === 'draw' && !editing) { e.preventDefault(); R('ui/drawing').undo(); return; }
    if (modal || editing || e.ctrlKey || e.metaKey || e.altKey) return;
    if (k === 'Escape') { R('ui/popovers').closePop(); if (body.dataset.mode === 'draw') R('ui/mode-pages').setMode('write'); return; }
    if (k === '?') { e.preventDefault(); R('ui/mode-pages').help.showModal(); return; }
    if (k === 'h' || k === 'H') { R('ui/mode-pages').toggleChrome(); return; }
    if (k === 'f' || k === 'F') { R('ui/mode-pages').toggleFull(); return; }
    if (body.dataset.mode === 'draw') {
      const map = { p: 'pen', r: 'hl', a: 'arrow', e: 'eraser' };
      if (map[k.toLowerCase()]) { S.board.tool = map[k.toLowerCase()]; R('ui/view').applySettings(); S.save(); return; }
    }
    if (k === 'd' || k === 'D') { R('ui/mode-pages').setMode(body.dataset.mode === 'draw' ? 'write' : 'draw'); return; }
    if (k === 'PageDown') { R('ui/mode-pages').goPage(S.board.cur + 1); return; }
    if (k === 'PageUp') { R('ui/mode-pages').goPage(S.board.cur - 1); return; }
    if (k === 'Enter' && body.dataset.mode === 'write' && st.activeId) { e.preventDefault(); R('blocks/editor').focusBlock(st.activeId); }
  }, true);
  return {  };
});
