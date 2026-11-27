/* Barra de herramientas: color, alineación, caja, duplicar, nueva línea, borrar (pizarra.html 5578-5685). */
MatIA.define('ui/toolbar', ['core/dom', 'model/board', 'model/schema', 'ui/state', 'ui/toast'], (dom, S, schema, st, toast) => {
  'use strict';
  const { $, $$ } = dom;
  const { body } = dom;
  const { uid, newBlock } = schema;
  const R = (n) => MatIA.require(n);
  /* ---------------- Barra de herramientas ---------------- */
  // Los botones no roban el foco a la fórmula activa
  const onBar = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.pop) { if (st.openPop && st.openPop.p.id === b.dataset.pop) R('ui/popovers').closePop(); else R('ui/popovers').showPop(b.dataset.pop, b); return; }
    if (b.dataset.tpl) { R('ui/templates').insertLatex(R('ui/templates').TPL[b.dataset.tpl]); return; }
    if (b.dataset.cmd) {
      const mf = R('blocks/editor').activeField();
      if (mf && mf.executeCommand) { mf.focus(); mf.executeCommand(b.dataset.cmd); R('blocks/editor').syncBlock(R('blocks/editor').activeBlock()); }
      return;
    }
    if (b.dataset.color) { setColor(b.dataset.color); return; }
    if (b.dataset.align) { setAlign(b.dataset.align); return; }
    if (b.dataset.tool) { S.board.tool = b.dataset.tool; R('ui/view').applySettings(); S.save(); }
    for (const k of ['shape', 'dash', 'fill']) if (b.dataset[k]) { S.board[k] = b.dataset[k]; R('ui/view').applySettings(); S.save(); }
  };
  // Barra lateral y barrita flotante de la línea activa
  for (const bar of [$('#toolbar'), $('#lineBar')]) {
    bar.addEventListener('mousedown', (e) => { if (e.target.closest('button')) e.preventDefault(); });
    bar.addEventListener('click', onBar);
  }
  function setColor(name) {
    S.board.color = name;
    R('ui/view').applySettings();
    S.save();
    if (body.dataset.mode === 'write') {
      const b = R('blocks/editor').activeBlock();
      const mf = b && (b.type === 'math' || b.type === 'deriv') ? R('blocks/editor').activeField() : null;
      if (mf && mf.applyStyle) {
        mf.focus();
        mf.applyStyle({ color: name === 'ink' ? 'none' : name });
        R('blocks/editor').syncBlock(b);
      }
    }
  }
  function setAlign(a) {
    const b = R('blocks/editor').activeBlock();
    if (!b) return;
    b.align = a;
    R('blocks/editor').elById(b.id).dataset.align = a;
    R('blocks/editor').setActive(b.id);
    S.save();
    R('blocks/editor').focusBlock(b.id);
  }
  $('#boxBtn').addEventListener('click', () => {
    const b = R('blocks/editor').activeBlock();
    if (!b) return;
    if (b.type === 'deriv') {
      const i = st.activeCell && st.activeCell.id === b.id ? st.activeCell.row : b.rows.length - 1;
      b.rows[i].boxed = !b.rows[i].boxed;
      $$('.dcell[data-row="' + i + '"]', R('blocks/editor').elById(b.id)).forEach((c) => c.classList.toggle('boxed', b.rows[i].boxed));
      S.save();
      return;
    }
    b.boxed = !b.boxed;
    R('blocks/editor').elById(b.id).classList.toggle('is-boxed', b.boxed);
    R('blocks/editor').setActive(b.id);
    S.save();
  });
  $('#textBtn').addEventListener('click', () => { const b = R('blocks/editor').activeBlock(); R('blocks/editor').addBlockAfter(b ? b.id : null, newBlock('text')); });
  const lineNo = (id) => S.page().blocks.findIndex((x) => x.id === id) + 1;
  function duplicateBlock(id) {
    const b = R('blocks/editor').syncBlock(R('blocks/editor').blockById(id));
    if (!b) return;
    const copy = JSON.parse(JSON.stringify(b));
    copy.id = uid();
    R('blocks/editor').addBlockAfter(id, copy, false);
    if (!R('blocks/editor').focusBlock(copy.id)) R('blocks/editor').setActive(copy.id);
    const el = R('blocks/editor').elById(copy.id);
    if (el) { el.scrollIntoView({ block: 'nearest' }); R('ui/ops-menu').flashBlock(el); }
    toast('Línea ' + lineNo(id) + ' duplicada: la copia es la línea ' + lineNo(copy.id) + '.');
  }
  function duplicateRow(b, i) {
    R('blocks/editor').syncBlock(b);
    const r = b.rows[i];
    if (!r) return;
    R('blocks/deriv').addRow(b, i, { l: r.l, r: r.r, note: r.note, boxed: !!r.boxed });
  }
  function duplicateActive() {
    const b = R('blocks/editor').activeBlock();
    if (!b) { toast('Haz clic primero en la línea que quieres duplicar.'); return; }
    if (b.type === 'deriv' && st.activeCell && st.activeCell.id === b.id) { duplicateRow(b, st.activeCell.row); return; }
    duplicateBlock(b.id);
  }
  function newLine(atEnd) {
    if (body.dataset.mode !== 'write') R('ui/mode-pages').setMode('write');
    const bl = S.page().blocks;
    const after = atEnd ? (bl.length ? bl[bl.length - 1].id : null) : (st.activeId || (bl.length ? bl[bl.length - 1].id : null));
    const nb = newBlock();
    R('blocks/editor').addBlockAfter(after, nb);
    const el = R('blocks/editor').elById(nb.id);
    if (el) { el.scrollIntoView({ block: 'nearest' }); R('ui/ops-menu').flashBlock(el); }
  }
  $('#newLineBtn').addEventListener('click', () => newLine(false));
  $('#addLineEnd').addEventListener('click', () => newLine(true));
  $('#dupBtn').addEventListener('click', duplicateActive);
  $$('#lnSeg button').forEach((x) => x.addEventListener('click', () => { S.board.lineNums = x.dataset.ln === '1'; R('ui/view').applySettings(); S.save(); }));
  $('#delBtn').addEventListener('click', () => {
    const b = R('blocks/editor').activeBlock();
    if (b && b.type === 'deriv' && st.activeCell && st.activeCell.id === b.id) { R('blocks/deriv').removeRow(b, st.activeCell.row); return; }
    if (st.activeId) R('blocks/editor').deleteBlock(st.activeId);
  });
  $('#derivBtn').addEventListener('click', () => R('blocks/deriv').startDeriv());
  $('#delDerivBtn').addEventListener('click', () => { const b = R('blocks/editor').activeBlock(); if (b && b.type === 'deriv') R('blocks/editor').deleteBlock(b.id); });
  $('#kbdBtn').addEventListener('click', () => {
    const kb = window.mathVirtualKeyboard;
    if (!kb) return;
    const mf = R('blocks/editor').activeField();
    if (mf) mf.focus();
    if (kb.visible) kb.hide(); else kb.show();
  });
  return { setColor, setAlign, lineNo, duplicateBlock, duplicateRow, duplicateActive, newLine };
});
