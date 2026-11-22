/* Bloque tabla (pizarra.html 5739-5788). */
MatIA.define('blocks/table', ['core/dom', 'blocks/registry'], (dom, registry) => {
  'use strict';
  const { $$ } = dom;

  /* ---------------- Tablas ---------------- */
  function buildTable(b, bd) {
    const w = document.createElement('div');
    w.className = 'mtable-wrap';
    w.tabIndex = 0;
    w.setAttribute('role', 'group');
    w.setAttribute('aria-label', b.caption || 'Tabla');
    const t = document.createElement('table');
    t.className = 'mtable ' + (b.kind || '');
    const vb = b.vbar;
    const ncols = Math.max(b.head ? b.head.length : 0, ...b.rows.map((r) => r.length));
    if (b.head) {
      const tr = t.createTHead().insertRow();
      b.head.forEach((h, j) => {
        const th = document.createElement('th');
        th.textContent = h;
        if (vb != null && j === vb - 1) th.className = 'vbar';
        if (b.lastBold && j === ncols - 1) th.classList.add('bold');
        tr.appendChild(th);
      });
    }
    const tb = t.createTBody();
    const hl = new Set([].concat(b.hline != null ? [b.hline] : [], b.hlines || []));
    b.rows.forEach((r, i) => {
      const tr = tb.insertRow();
      if (hl.has(i)) tr.className = 'hline';
      for (let j = 0; j < ncols; j++) {
        const td = tr.insertCell();
        td.textContent = r[j] == null ? '' : r[j];
        if (vb != null && j === vb - 1) td.className = 'vbar';
        if (b.lastBold && j === ncols - 1) td.classList.add('bold');
        if (b.kind === 'truth' && r[j] === 'V') td.classList.add('t');
        if (b.mark && b.mark[0] === i && b.mark[1] === j) td.classList.add('mark');
      }
    });
    if (b.kind === 'ruffini' && !b.mark) {
      // resto de cada división en Ruffini encadenado
      $$('tr', tb).forEach((tr, i) => { if (i > 0 && i % 2 === 0) { const cells = $$('td', tr).filter((c) => c.textContent !== ''); const last = cells[cells.length - 1]; if (last) last.classList.add('mark'); } });
    }
    w.appendChild(t);
    if (b.caption) {
      const c = document.createElement('p');
      c.className = 'mtable-cap';
      c.textContent = b.caption;
      w.appendChild(c);
    }
    bd.appendChild(w);
  }

  /* Marcas de máximos, mínimos, inflexión y silla: forma + color + rótulo */
  registry.register({ type: 'table', build: buildTable });
  return { buildTable };
});
