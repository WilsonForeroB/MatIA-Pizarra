/* Editor de bloques: crear/pintar/enfocar/borrar/mover líneas, teclado y arrastre (pizarra.html 4750-4873 y 5120-5362). */
MatIA.define('blocks/editor', ['core/dom', 'model/board', 'model/schema', 'ui/state', 'ui/toast', 'assets/pio'], (dom, S, schema, st, toast, pio) => {
  'use strict';
  const R = (n) => MatIA.require(n);
  const { $, $$, body } = dom;
  const blocksEl = dom.$('#blocks');
  const markRow = (...a) => R('blocks/deriv').markRow(...a);
  const focusCell = (...a) => R('blocks/deriv').focusCell(...a);
  const derivKey = (...a) => R('blocks/deriv').derivKey(...a);
  const cellEl = (...a) => R('blocks/deriv').cellEl(...a);
  const sizeCanvas = (...a) => R('ui/drawing').sizeCanvas(...a);
  const updatePres = (...a) => R('ui/mode-pages').updatePres(...a);
  const duplicateBlock = (...a) => R('ui/toolbar').duplicateBlock(...a);
  const cssVar = (...a) => R('ui/view').cssVar(...a);
  const openExport = (...a) => R('ui/export-image').openExport(...a);

  /* ---------------- Bloques ---------------- */
  const blockById = (id) => S.page().blocks.find((b) => b.id === id);
  const elById = (id) => blocksEl.querySelector('.blk[data-id="' + id + '"]');
  // campo principal de la línea; los math-field auxiliares (data-aux: funciones de gráficas, sólidos…) no cuentan
  const fieldOf = (el) => el && (el.querySelector('math-field:not([data-aux])') || el.querySelector('.blk-text'));

  function configureField(mf) {
    mf.smartFence = true;
    mf.smartSuperscript = true;
    mf.mathVirtualKeyboardPolicy = 'manual';
    mf.popoverPolicy = 'auto';
    mf.colorMap = (name) => (R('ui/view').COLOR_NAMES.includes(name) ? cssVar(name) : undefined);
    try {
      mf.inlineShortcuts = Object.assign({}, mf.inlineShortcuts, {
        RR: '\\mathbb{R}', NN: '\\mathbb{N}', ZZ: '\\mathbb{Z}', QQ: '\\mathbb{Q}', CC: '\\mathbb{C}', lam: '\\lambda', pp: '\\partial',
      });
    } catch (e) { /* opción no disponible */ }
  }

  /* Explicación de una línea de fórmula (campo b.note), con el estilo de las notas del desarrollo. */
  function makeNote(b, ro) {
    const n = document.createElement('div');
    n.className = 'blk-note';
    n.textContent = b.note || '';
    if (ro) return n;
    n.contentEditable = 'true';
    n.setAttribute('role', 'textbox');
    n.setAttribute('aria-label', 'Explicación de la línea');
    n.dataset.ph = 'Explicación…';
    n.addEventListener('input', () => { b.note = n.innerText.replace(/\n$/, ''); S.save(); });
    n.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey || e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); focusBlock(b.id, 'end'); }
    });
    n.addEventListener('blur', () => { if (!n.textContent.trim()) { delete b.note; n.remove(); S.save(); } });
    return n;
  }

  function makeBlockEl(b) {
    const el = document.createElement('div');
    el.className = 'blk';
    el.dataset.id = b.id;
    el.dataset.align = b.align;
    el.classList.toggle('is-boxed', !!b.boxed);
    el.classList.toggle('is-result', !!b.result);
    const h = document.createElement('button');
    h.type = 'button';
    h.className = 'blk-handle';
    h.draggable = true;
    h.textContent = '⋮⋮';
    h.setAttribute('aria-label', 'Mover línea: arrastra o usa Alt+flechas');
    h.title = 'Arrastra para mover la línea';
    el.appendChild(h);
    const bd = document.createElement('div');
    bd.className = 'blk-body';
    el.appendChild(bd);
    const x = document.createElement('button');
    x.type = 'button';
    x.className = 'x-del blk-del';
    x.textContent = '×';
    const xl = b.type === 'deriv' ? 'Borrar todo el desarrollo' : b.type === 'table' ? 'Borrar la tabla' : b.type === 'graph' || b.type === 'graph3d' ? 'Borrar la gráfica' : b.type === 'net' ? 'Borrar el grafo' : b.type === 'venn' || b.type === 'chart' || b.type === 'ptree' || b.type === 'geo' ? 'Borrar el diagrama' : 'Borrar esta línea';
    x.title = xl;
    x.setAttribute('aria-label', xl);
    x.addEventListener('mousedown', (e) => e.preventDefault());
    x.addEventListener('click', () => deleteBlock(b.id));
    if (R('ui/export-image').EXPORTABLE.has(b.type)) {
      const ex = document.createElement('button');
      ex.type = 'button';
      ex.className = 'x-del blk-del blk-exp';
      ex.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2v8M4.5 6.5L8 10l3.5-3.5M3 13h10"/></svg>';
      ex.title = 'Exportar como imagen (PNG, SVG o copiar)';
      ex.setAttribute('aria-label', 'Exportar como imagen');
      ex.setAttribute('aria-haspopup', 'true');
      ex.addEventListener('mousedown', (e) => e.preventDefault());
      ex.addEventListener('click', (e) => { e.stopPropagation(); openExport(b, el, ex); });
      el.appendChild(ex);
    }
    if (b.type === 'math') {
      // explicación en la misma línea (a la derecha de la fórmula), sin crear una línea nueva
      const nb = document.createElement('button');
      nb.type = 'button';
      nb.className = 'x-del blk-del blk-dup blk-note-btn';
      nb.textContent = '💬';
      nb.title = 'Añadir una explicación a la derecha de esta fórmula';
      nb.setAttribute('aria-label', 'Añadir explicación a la línea');
      nb.addEventListener('mousedown', (e) => e.preventDefault());
      nb.addEventListener('click', () => { const n = bd.querySelector('.blk-note') || bd.appendChild(makeNote(b)); n.focus(); });
      el.appendChild(nb);
    }
    const du = document.createElement('button');
    du.type = 'button';
    du.className = 'x-del blk-del blk-dup';
    du.textContent = '⧉';
    du.title = 'Duplicar (Ctrl+D)';
    du.setAttribute('aria-label', 'Duplicar la línea');
    du.addEventListener('mousedown', (e) => e.preventDefault());
    du.addEventListener('click', () => duplicateBlock(b.id));
    el.appendChild(du);
    el.appendChild(x);
    const def = R('blocks/registry').get(b.type);
    if (def) {
      if (b.type === 'deriv') {
        el.classList.add('blk-deriv');
        el.classList.remove('is-boxed');
      }
      def.build(b, bd, false);
    } else if (st.mlReady) {
      const mf = document.createElement('math-field');
      mf.setAttribute('aria-label', 'Línea de fórmula');
      configureField(mf);
      bd.appendChild(mf);
      mf.value = b.v;
      if (b.note) bd.appendChild(makeNote(b));
      mf.addEventListener('input', () => { b.v = mf.getValue('latex'); b.result = false; el.classList.remove('is-result'); hidePio(); S.save(); });
      if (MatIA.has('blocks/fit')) R('blocks/fit').watch(el, mf);
      mf.addEventListener('move-out', (e) => {
        const d = e.detail.direction;
        if (d === 'upward' || d === 'backward') { if (focusSibling(b.id, -1, d === 'backward' ? 'end' : 'end')) e.preventDefault(); }
        else if (d === 'downward' || d === 'forward') { if (focusSibling(b.id, 1, 'start')) e.preventDefault(); }
      });
    } else {
      const t = document.createElement('div');
      t.className = 'blk-text';
      t.textContent = b.v;
      bd.appendChild(t);
    }
    bd.addEventListener('mousedown', (e) => {
      if (e.target === bd) { e.preventDefault(); focusBlock(b.id, 'end'); }
    });
    return el;
  }

  /* ---------------- Desarrollo alineado por el = ---------------- */
  function syncBlock(b) {
    if (!b) return b;
    const el = elById(b.id);
    if (!el) return b;
    if (b.type === 'deriv') {
      $$('[data-col]', el).forEach((c) => {
        const r = b.rows[+c.dataset.row];
        if (!r) return;
        r[c.dataset.col] = c.tagName === 'MATH-FIELD' ? c.getValue('latex') : c.innerText.replace(/\n$/, '');
      });
    } else if (b.type === 'math') {
      const mf = fieldOf(el);
      if (mf && mf.getValue) b.v = mf.getValue('latex');
    }
    S.save();
    return b;
  }

  function renderPage() {
    blocksEl.innerHTML = '';
    for (const b of S.page().blocks) blocksEl.appendChild(makeBlockEl(b));
    maybePio();
    $('#pgOut').textContent = (S.board.cur + 1) + ' / ' + S.board.pages.length;
    if (typeof updatePres === 'function') updatePres();
    $('#pgPrev').disabled = S.board.cur === 0;
    $('#pgNext').disabled = S.board.cur === S.board.pages.length - 1;
    { const dr = R('ui/drawing'); if (dr.resetUndo) dr.resetUndo(); }
    requestAnimationFrame(() => { sizeCanvas(); });
    const first = S.page().blocks[0];
    if (first) setActive(first.id);
  }

  function isPageEmpty() {
    const p = S.page();
    return p.blocks.length === 1 && p.blocks[0].type === 'math' && !p.blocks[0].v && !p.strokes.length;
  }
  function maybePio() {
    hidePio();
    if (!isPageEmpty()) return;
    const box = document.createElement('div');
    box.className = 'mi-callout mi-callout--pio empty-pio';
    box.innerHTML = '<div class="mi-pio"><img alt="Pío explicando en la pizarra"></div><div><span class="mi-label">Pío dice</span><p>Escribe aquí tu primera fórmula: prueba <kbd>x^2</kbd> o pulsa <b>Matriz</b>. Con <kbd>Intro</kbd> pasas a la línea siguiente y con <kbd>?</kbd> ves todos los atajos.</p></div>';
    box.querySelector('img').src = pio.src('pizarra');
    blocksEl.appendChild(box);
  }
  function hidePio() { const p = blocksEl.querySelector('.empty-pio'); if (p) p.remove(); }

  function setActive(id) {
    st.activeId = id;
    $$('.blk', blocksEl).forEach((e) => e.classList.toggle('is-active', e.dataset.id === id));
    const b = blockById(id);
    if (b) {
      $$('#alignSeg button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.align === b.align)));
      $('#boxBtn').setAttribute('aria-pressed', String(!!b.boxed));
      $('#delBtn').textContent = b.type === 'deriv' ? 'Borrar paso' : 'Borrar línea';
      $('#delDerivBtn').hidden = b.type !== 'deriv';
    }
  }
  function focusBlock(id, where = 'end') {
    const db = blockById(id);
    if (db && db.type === 'deriv') return where === 'start' ? focusCell(id, 0, 'l', 'start') : focusCell(id, db.rows.length - 1, 'r', 'end');
    const el = elById(id);
    const f = fieldOf(el);
    if (!f) return false;
    setActive(id);
    if (f.tagName === 'MATH-FIELD') {
      f.focus();
      try { f.position = where === 'start' ? 0 : f.lastOffset; } catch (e) { /* */ }
    } else {
      f.focus();
      const r = document.createRange();
      r.selectNodeContents(f);
      r.collapse(where === 'start');
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    }
    el.scrollIntoView({ block: 'nearest' });
    return true;
  }
  function focusSibling(id, dir, where) {
    const bl = S.page().blocks;
    const i = bl.findIndex((b) => b.id === id);
    const j = i + dir;
    if (j < 0 || j >= bl.length) return false;
    return focusBlock(bl[j].id, where);
  }
  function addBlockAfter(id, b, focus = true) {
    const bl = S.page().blocks;
    const i = id ? bl.findIndex((x) => x.id === id) : bl.length - 1;
    bl.splice(i + 1, 0, b);
    const el = makeBlockEl(b);
    const ref = id ? elById(id) : null;
    if (ref && ref.nextSibling) blocksEl.insertBefore(el, ref.nextSibling); else if (ref) blocksEl.appendChild(el); else blocksEl.appendChild(el);
    hidePio();
    S.save();
    if (focus) focusBlock(b.id, 'end');
    requestAnimationFrame(sizeCanvas);
    return b;
  }
  function deleteBlock(id, focusPrev = true) {
    const bl = S.page().blocks;
    const i = bl.findIndex((b) => b.id === id);
    if (i < 0) return;
    const gone = JSON.parse(JSON.stringify(bl[i]));
    const empty = gone.type === 'math' || gone.type === 'text' ? !gone.v : gone.type === 'deriv' ? gone.rows.every((r) => !r.l && !r.r && !r.note) : false;
    if (!empty) {
      const pg = S.board.cur, only = bl.length === 1;
      toast((gone.type === 'deriv' ? 'Desarrollo borrado.' : gone.type === 'table' ? 'Tabla borrada.' : gone.type === 'graph' || gone.type === 'graph3d' ? 'Gráfica borrada.' : gone.type === 'net' ? 'Grafo borrado.' : gone.type === 'venn' || gone.type === 'chart' || gone.type === 'ptree' || gone.type === 'geo' ? 'Diagrama borrado.' : 'Línea borrada.'), 'nota', { label: 'Deshacer', fn: () => {
        if (S.board.cur !== pg) { S.board.cur = pg; }
        const blocks = S.page().blocks;
        gone.id = schema.uid();
        if (only && blocks.length === 1 && blocks[0].type === 'math' && !blocks[0].v) blocks.splice(0, 1, gone);
        else blocks.splice(Math.min(i, blocks.length), 0, gone);
        renderPage();
        S.save();
        focusBlock(gone.id, 'end');
      } });
    }
    if (bl.length === 1) {
      bl[0].v = '';
      bl[0].type = 'math'; bl[0].boxed = false; bl[0].result = false;
      delete bl[0].rows;
      renderPage();
      S.save();
      focusBlock(bl[0].id);
      return;
    }
    bl.splice(i, 1);
    const el = elById(id);
    if (el) el.remove();
    S.save();
    const t = bl[Math.max(0, i - 1)];
    if (focusPrev && t) focusBlock(t.id, 'end');
    requestAnimationFrame(sizeCanvas);
  }
  function moveBlock(id, dir) {
    const bl = S.page().blocks;
    const i = bl.findIndex((b) => b.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= bl.length) return;
    [bl[i], bl[j]] = [bl[j], bl[i]];
    const el = elById(id), other = elById(bl[i].id);
    if (dir < 0) blocksEl.insertBefore(el, other); else blocksEl.insertBefore(other, el);
    S.save();
    focusBlock(id);
  }

  function activeBlock() { return st.activeId ? blockById(st.activeId) : null; }
  // Devuelve el math-field activo; si la línea activa es texto o no hay ninguna, crea una línea de fórmula
  function activeField() {
    let b = activeBlock();
    if (b && b.type === 'deriv') {
      const mine = st.activeCell && st.activeCell.id === b.id;
      const row = mine ? Math.min(st.activeCell.row, b.rows.length - 1) : b.rows.length - 1;
      const col = mine && st.activeCell.col !== 'note' ? st.activeCell.col : 'r';
      return cellEl(b.id, row, col);
    }
    if (!b || b.type !== 'math') {
      b = addBlockAfter(b ? b.id : null, schema.newBlock(), false);
      setActive(b.id);
    }
    return fieldOf(elById(b.id));
  }

  /* ---------------- Teclado dentro de las líneas ---------------- */
  blocksEl.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'svg' || e.target.closest('.net,.g3d,.graph,.venn,.chart,.ptree,.geo,.sol,[data-aux],.blk-note')) return;
    const el = e.target.closest && e.target.closest('.blk');
    if (!el) return;
    const id = el.dataset.id, b = blockById(id);
    const mf = e.target.tagName === 'MATH-FIELD' ? e.target : null;
    const isText = !mf && e.target.classList.contains('blk-text');
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); e.stopPropagation(); moveBlock(id, e.key === 'ArrowUp' ? -1 : 1); return; }
    if (b && b.type === 'deriv') { if (derivKey(e, b)) { e.preventDefault(); e.stopPropagation(); } return; }
    if (e.altKey && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); e.stopPropagation(); deleteBlock(id); return; }
    if (e.key === 'Enter') {
      if (mf && mf.mode === 'latex') return;
      if (mf && e.shiftKey) { e.preventDefault(); e.stopPropagation(); mf.executeCommand('addRowAfter'); return; }
      if (mf && (e.ctrlKey || e.metaKey)) { e.preventDefault(); e.stopPropagation(); mf.executeCommand('addColumnAfter'); return; }
      if (isText && e.shiftKey) return;
      if (e.altKey) return;
      e.preventDefault(); e.stopPropagation();
      addBlockAfter(id, schema.newBlock('math', '', { align: b ? b.align : 'left' }));
      return;
    }
    if (e.key === 'Backspace' && !e.altKey) {
      const empty = mf ? !mf.getValue('latex') : isText ? !e.target.textContent : false;
      if (empty) { e.preventDefault(); e.stopPropagation(); deleteBlock(id); }
      return;
    }
    if (isText && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      const s = getSelection();
      const atStart = s.anchorOffset === 0, atEnd = s.anchorOffset >= (s.anchorNode.textContent || '').length;
      if (e.key === 'ArrowUp' && atStart && focusSibling(id, -1, 'end')) e.preventDefault();
      if (e.key === 'ArrowDown' && atEnd && focusSibling(id, 1, 'start')) e.preventDefault();
    }
  }, true);
  blocksEl.addEventListener('focusin', (e) => {
    const el = e.target.closest && e.target.closest('.blk');
    if (!el) return;
    setActive(el.dataset.id);
    const c = e.target.dataset && e.target.dataset.col;
    if (c) { st.activeCell = { id: el.dataset.id, row: +e.target.dataset.row, col: c }; markRow(el.dataset.id, +e.target.dataset.row); }
    else { st.activeCell = null; markRow(null, -1); }
  });

  /* ---------------- Arrastrar líneas ---------------- */
  let dragId = null;
  blocksEl.addEventListener('dragstart', (e) => {
    const h = e.target.closest && e.target.closest('.blk-handle');
    if (!h) { e.preventDefault(); return; }
    dragId = h.closest('.blk').dataset.id;
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', dragId); } catch (x) { /* */ }
  });
  blocksEl.addEventListener('dragover', (e) => {
    if (!dragId) return;
    const el = e.target.closest && e.target.closest('.blk');
    $$('.drop-before,.drop-after', blocksEl).forEach((x) => x.classList.remove('drop-before', 'drop-after'));
    if (!el || el.dataset.id === dragId) return;
    e.preventDefault();
    const r = el.getBoundingClientRect();
    el.classList.add(e.clientY < r.top + r.height / 2 ? 'drop-before' : 'drop-after');
  });
  blocksEl.addEventListener('drop', (e) => {
    const el = e.target.closest && e.target.closest('.blk');
    if (!dragId || !el) return;
    e.preventDefault();
    const before = el.classList.contains('drop-before');
    const bl = S.page().blocks;
    const from = bl.findIndex((b) => b.id === dragId);
    const [m] = bl.splice(from, 1);
    let to = bl.findIndex((b) => b.id === el.dataset.id);
    if (!before) to++;
    bl.splice(to, 0, m);
    const dEl = elById(dragId);
    if (before) blocksEl.insertBefore(dEl, el); else blocksEl.insertBefore(dEl, el.nextSibling);
    S.save();
  });
  blocksEl.addEventListener('dragend', () => {
    dragId = null;
    $$('.drop-before,.drop-after', blocksEl).forEach((x) => x.classList.remove('drop-before', 'drop-after'));
  });
  return { blockById, elById, fieldOf, configureField, makeNote, makeBlockEl, syncBlock, renderPage, isPageEmpty, maybePio, hidePio, setActive, focusBlock, focusSibling, addBlockAfter, deleteBlock, moveBlock, activeBlock, activeField };
});
