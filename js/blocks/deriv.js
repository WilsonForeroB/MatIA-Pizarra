/* Bloque «desarrollo alineado por el =» y su teclado (pizarra.html 4874-5119). */
MatIA.define('blocks/deriv', ['core/dom', 'model/board', 'model/schema', 'ui/state', 'ui/toast', 'blocks/registry'], (dom, S, schema, st, toast, registry) => {
  'use strict';
  const R = (n) => MatIA.require(n);
  const { $$, body } = dom;
  const blocksEl = dom.$('#blocks');
  const syncBlock = (...a) => R('blocks/editor').syncBlock(...a);
  const focusSibling = (...a) => R('blocks/editor').focusSibling(...a);
  const elById = (...a) => R('blocks/editor').elById(...a);
  const addBlockAfter = (...a) => R('blocks/editor').addBlockAfter(...a);
  const hidePio = (...a) => R('blocks/editor').hidePio(...a);
  const setActive = (...a) => R('blocks/editor').setActive(...a);
  const makeBlockEl = (...a) => R('blocks/editor').makeBlockEl(...a);
  const focusBlock = (...a) => R('blocks/editor').focusBlock(...a);
  const deleteBlock = (...a) => R('blocks/editor').deleteBlock(...a);
  const configureField = (...a) => R('blocks/editor').configureField(...a);
  const blockById = (...a) => R('blocks/editor').blockById(...a);
  const syncActive = (...a) => R('ui/calc').syncActive(...a);
  const sizeCanvas = (...a) => R('ui/drawing').sizeCanvas(...a);
  const setMode = (...a) => R('ui/mode-pages').setMode(...a);
  const goPage = (...a) => R('ui/mode-pages').goPage(...a);
  const duplicateRow = (...a) => R('ui/toolbar').duplicateRow(...a);

  function buildDeriv(b, bd, ro) {
    const g = document.createElement('div');
    g.className = 'deriv';
    g.setAttribute('role', 'group');
    g.setAttribute('aria-label', 'Desarrollo alineado por el igual');
    b.rows.forEach((row, i) => {
      const rw = document.createElement('div');
      rw.className = 'drow';
      const cell = (cls) => { const c = document.createElement('div'); c.className = 'dcell ' + cls + (row.boxed ? ' boxed' : ''); c.dataset.row = i; return c; };
      const L = cell('dl'), E = cell('deq'), R = cell('dr');
      E.textContent = '=';
      E.setAttribute('aria-hidden', 'true');
      for (const [box, col] of [[L, 'l'], [R, 'r']]) {
        if (st.mlReady) {
          const mf = document.createElement('math-field');
          mf.setAttribute('aria-label', (col === 'l' ? 'Lado izquierdo' : 'Lado derecho') + ' del paso ' + (i + 1));
          if (ro) mf.setAttribute('read-only', '');
          configureField(mf);
          mf.dataset.row = i; mf.dataset.col = col;
          box.appendChild(mf);
          mf.value = row[col];
          if (!ro) {
            mf.addEventListener('input', () => { row[col] = mf.getValue('latex'); hidePio(); S.save(); });
            mf.addEventListener('move-out', (e) => { if (derivMove(b, i, col, e.detail.direction)) e.preventDefault(); });
          }
        } else {
          box.textContent = row[col];
        }
      }
      const N = document.createElement('div');
      N.className = 'dnote';
      N.dataset.row = i; N.dataset.col = 'note';
      N.textContent = row.note;
      if (!ro) {
        N.contentEditable = 'true';
        N.setAttribute('role', 'textbox');
        N.setAttribute('aria-label', 'Explicación del paso ' + (i + 1));
        N.dataset.ph = i === 0 ? 'Planteamiento…' : 'Explica el paso…';
        N.addEventListener('input', () => { row.note = N.innerText.replace(/\n$/, ''); S.save(); });
      }
      rw.append(L, E, R, N);
      if (!ro) {
        const X = document.createElement('button');
        X.type = 'button';
        X.className = 'x-del drow-del';
        X.dataset.row = i;
        X.textContent = '×';
        X.title = 'Borrar este paso';
        X.setAttribute('aria-label', 'Borrar el paso ' + (i + 1));
        X.addEventListener('mousedown', (e) => e.preventDefault());
        X.addEventListener('click', () => { syncBlock(b); removeRow(b, i); });
        rw.appendChild(X);
        const D = document.createElement('button');
        D.type = 'button';
        D.className = 'x-del drow-dup';
        D.dataset.row = i;
        D.textContent = '⧉';
        D.title = 'Duplicar este paso (Ctrl+D)';
        D.setAttribute('aria-label', 'Duplicar el paso ' + (i + 1));
        D.addEventListener('mousedown', (e) => e.preventDefault());
        D.addEventListener('click', () => duplicateRow(b, i));
        rw.appendChild(D);
      }
      for (const c of rw.children) { c.style.setProperty('--gr', String(i + 1)); c.style.setProperty('--gm', String(2 * i + 1)); c.style.setProperty('--gn', String(2 * i + 2)); }
      g.appendChild(rw);
    });
    bd.appendChild(g);
  }
  function rebuildDeriv(b) {
    const bd = elById(b.id).querySelector('.blk-body');
    bd.innerHTML = '';
    buildDeriv(b, bd, false);
    requestAnimationFrame(sizeCanvas);
  }
  const cellEl = (id, row, col) => { const el = elById(id); return el && el.querySelector('[data-row="' + row + '"][data-col="' + col + '"]'); };
  function markRow(id, row) {
    $$('.dcell.on,.dnote.on,.drow-del.on,.drow-dup.on', blocksEl).forEach((c) => c.classList.remove('on'));
    const el = elById(id);
    if (el) $$('[data-row="' + row + '"]', el).forEach((c) => { if (c.classList.contains('dcell') || c.classList.contains('dnote') || c.classList.contains('drow-del') || c.classList.contains('drow-dup')) c.classList.add('on'); });
  }
  function focusCell(id, row, col, where = 'end') {
    const f = cellEl(id, row, col);
    if (!f) return false;
    setActive(id);
    st.activeCell = { id, row, col };
    markRow(id, row);
    f.focus();
    if (f.tagName === 'MATH-FIELD') {
      try { f.position = where === 'start' ? 0 : f.lastOffset; } catch (e) { /* */ }
    } else {
      const r = document.createRange();
      r.selectNodeContents(f);
      r.collapse(where === 'start');
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    }
    (f.closest('.dcell') || f).scrollIntoView({ block: 'nearest' });
    return true;
  }
  function derivMove(b, i, col, dir) {
    const last = b.rows.length - 1;
    if (dir === 'forward') return col === 'l' ? focusCell(b.id, i, 'r', 'start') : focusCell(b.id, i, 'note', 'start');
    if (dir === 'backward') {
      if (col === 'r') return focusCell(b.id, i, 'l', 'end');
      return i > 0 ? focusCell(b.id, i - 1, 'note', 'end') : focusSibling(b.id, -1, 'end');
    }
    if (dir === 'upward') return i > 0 ? focusCell(b.id, i - 1, col, 'end') : focusSibling(b.id, -1, 'end');
    if (dir === 'downward') return i < last ? focusCell(b.id, i + 1, col, 'end') : focusSibling(b.id, 1, 'start');
    return false;
  }
  function removeRow(b, i) {
    if (b.rows.length === 1) { deleteBlock(b.id); return; }
    const gone = JSON.parse(JSON.stringify(b.rows[i]));
    const pg = S.board.cur;
    toast('Paso ' + (i + 1) + ' borrado.', 'nota', { label: 'Deshacer', fn: () => {
      if (S.board.cur !== pg) goPage(pg);
      const bb = blockById(b.id);
      if (!bb || bb.type !== 'deriv') return;
      bb.rows.splice(Math.min(i, bb.rows.length), 0, gone);
      rebuildDeriv(bb);
      S.save();
      focusCell(bb.id, Math.min(i, bb.rows.length - 1), 'r', 'end');
    } });
    b.rows.splice(i, 1);
    rebuildDeriv(b);
    S.save();
    focusCell(b.id, Math.max(0, i - 1), 'r', 'end');
  }
  function addRow(b, i, row, col = 'r') {
    b.rows.splice(i + 1, 0, row);
    rebuildDeriv(b);
    S.save();
    focusCell(b.id, i + 1, col, 'end');
  }
  // Busca el primer = fuera de llaves y de entornos (matrices, sistemas…)
  function splitTopEq(L) {
    let d = 0, env = 0;
    for (let i = 0; i < L.length; i++) {
      const c = L[i];
      if (c === '\\') {
        if (L.startsWith('\\begin', i)) env++;
        else if (L.startsWith('\\end', i)) env--;
        i++;
        continue;
      }
      if (c === '{') d++;
      else if (c === '}') d--;
      else if (c === '=' && d === 0 && env === 0) return [L.slice(0, i), L.slice(i + 1)];
    }
    return null;
  }
  function startDeriv() {
    if (body.dataset.mode !== 'write') setMode('write');
    const b = syncActive();
    if (b && b.type === 'deriv') {
      const i = st.activeCell && st.activeCell.id === b.id ? st.activeCell.row : b.rows.length - 1;
      addRow(b, i, schema.newRow(), 'l');
      return;
    }
    if (b && b.type === 'math') {
      const sp = b.v.trim() ? splitTopEq(b.v) : null;
      if (!b.v.trim() || sp) {
        b.type = 'deriv';
        b.rows = [sp ? schema.newRow(sp[0], sp[1]) : schema.newRow()];
        delete b.v; delete b.result;
        b.boxed = false;
        const old = elById(b.id);
        old.replaceWith(makeBlockEl(b));
        hidePio();
        S.save();
        focusCell(b.id, 0, sp ? 'r' : 'l', 'end');
        return;
      }
    }
    const nb = schema.newDeriv();
    addBlockAfter(b ? b.id : null, nb, false);
    focusCell(nb.id, 0, 'l', 'start');
  }
  // Teclado propio de las filas del desarrollo. Devuelve true si consume la tecla.
  function derivKey(e, b) {
    const t = e.target;
    const col = t.dataset && t.dataset.col;
    if (!col) return false;
    const i = +t.dataset.row;
    const row = b.rows[i];
    const mf = t.tagName === 'MATH-FIELD' ? t : null;
    if (mf && mf.mode === 'latex') return false;
    if (e.altKey && (e.key === 'Delete' || e.key === 'Backspace')) { removeRow(b, i); return true; }
    if (e.key === 'Enter') {
      if (mf && e.shiftKey) { mf.executeCommand('addRowAfter'); return true; }
      if (mf && (e.ctrlKey || e.metaKey)) { mf.executeCommand('addColumnAfter'); return true; }
      syncBlock(b);
      if (!row.l.trim() && !row.r.trim() && !row.note.trim() && b.rows.length > 1) {
        b.rows.splice(i, 1);
        rebuildDeriv(b);
        S.save();
        addBlockAfter(b.id, schema.newBlock());
        return true;
      }
      addRow(b, i, e.altKey ? schema.newRow() : schema.newRow(row.l, row.r), e.altKey ? 'l' : 'r');
      return true;
    }
    if (e.key === 'Escape' && !e.shiftKey) {
      syncBlock(b);
      const nxt = S.page().blocks[S.page().blocks.findIndex((x) => x.id === b.id) + 1];
      if (nxt && nxt.type === 'math' && !nxt.v) focusBlock(nxt.id, 'start');
      else addBlockAfter(b.id, schema.newBlock());
      return true;
    }
    // Tab salta entre huecos de una plantilla mientras queden; si no, pasa a la celda siguiente
    if (mf && e.key === 'Tab' && !e.shiftKey && !/\\placeholder/.test(mf.getValue('latex'))) {
      return col === 'l' ? focusCell(b.id, i, 'r', 'start') : focusCell(b.id, i, 'note', 'end');
    }
    if (mf && e.key === 'Tab' && e.shiftKey) {
      if (col === 'r') return focusCell(b.id, i, 'l', 'end');
      return i > 0 ? focusCell(b.id, i - 1, 'note', 'end') : true;
    }
    if (mf && col === 'l' && e.key === '=' && !e.ctrlKey && !e.altKey && !e.metaKey && mf.position === mf.lastOffset) {
      focusCell(b.id, i, 'r', 'start');
      return true;
    }
    if (e.key === 'Backspace') {
      const empty = mf ? !mf.getValue('latex') : !t.textContent;
      if (!empty) return false;
      syncBlock(b);
      if (!row.l && !row.r && !row.note) { removeRow(b, i); return true; }
      if (col === 'r') return focusCell(b.id, i, 'l', 'end');
      if (col === 'note') return focusCell(b.id, i, 'r', 'end');
      return false;
    }
    if (!mf) {
      const sel = getSelection();
      const len = (t.textContent || '').length;
      const off = sel.rangeCount ? (() => { const r = sel.getRangeAt(0).cloneRange(); r.selectNodeContents(t); r.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset); return r.toString().length; })() : 0;
      if (e.key === 'Tab') {
        if (e.shiftKey) return focusCell(b.id, i, 'r', 'end');
        if (i < b.rows.length - 1) return focusCell(b.id, i + 1, 'l', 'end');
        return focusSibling(b.id, 1, 'start') || true;
      }
      if (e.key === 'ArrowLeft' && off === 0) return focusCell(b.id, i, 'r', 'end');
      if (e.key === 'ArrowUp' && off === 0) return derivMove(b, i, 'note', 'upward');
      if (e.key === 'ArrowDown' && off === len) return derivMove(b, i, 'note', 'downward');
    }
    return false;
  }
  // Copia al modelo lo que hay en pantalla (por si algún cambio no ha disparado «input»)
  registry.register({ type: 'deriv', build: (b, bd, ro) => buildDeriv(b, bd, ro) });
  return { buildDeriv, rebuildDeriv, cellEl, markRow, focusCell, derivMove, removeRow, addRow, splitTopEq, startDeriv, derivKey };
});
