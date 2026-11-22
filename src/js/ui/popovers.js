/* Ventanas emergentes de la barra y selector de tamaño de matriz (pizarra.html 5515-5577). */
MatIA.define('ui/popovers', ['core/dom', 'ui/state'], (dom, st) => {
  'use strict';
  const { $, $$ } = dom;
  const R = (n) => MatIA.require(n);
  /* ---------------- Ventanas emergentes ---------------- */
  function showPop(id, anchor) {
    closePop();
    const p = $('#' + id);
    p.hidden = false;
    const r = anchor.getBoundingClientRect();
    const w = p.offsetWidth;
    p.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + 'px';
    p.style.top = (r.bottom + 6) + 'px';
    anchor.setAttribute('aria-expanded', 'true');
    st.openPop = { p, anchor };
    const f = p.querySelector('button');
    if (f && id !== 'matPop') f.focus();
  }
  function closePop() {
    if (!st.openPop) return;
    st.openPop.p.hidden = true;
    st.openPop.anchor.setAttribute('aria-expanded', 'false');
    st.openPop = null;
  }
  document.addEventListener('pointerdown', (e) => {
    if (st.openPop && !st.openPop.p.contains(e.target) && !st.openPop.anchor.contains(e.target)) closePop();
  });

  // Selector de tamaño de matriz
  let matR = 2, matC = 2, matEnv = 'pmatrix';
  const grid = $('#matGrid');
  for (let i = 1; i <= 6; i++) for (let j = 1; j <= 6; j++) {
    const c = document.createElement('button');
    c.type = 'button';
    c.dataset.r = i; c.dataset.c = j;
    c.setAttribute('aria-label', i + ' filas por ' + j + ' columnas');
    grid.appendChild(c);
  }
  function paintGrid(r, c) {
    $$('button', grid).forEach((b) => b.classList.toggle('on', +b.dataset.r <= r && +b.dataset.c <= c));
    $('#matOut').textContent = r + ' × ' + c;
  }
  grid.addEventListener('pointerover', (e) => { const b = e.target.closest('button'); if (b) paintGrid(+b.dataset.r, +b.dataset.c); });
  grid.addEventListener('focusin', (e) => { const b = e.target.closest('button'); if (b) paintGrid(+b.dataset.r, +b.dataset.c); });
  grid.addEventListener('pointerleave', () => paintGrid(matR, matC));
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    matR = +b.dataset.r; matC = +b.dataset.c;
    closePop();
    R('ui/templates').insertLatex(R('ui/templates').matrixLatex(matR, matC, matEnv));
  });
  $('#matType').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    matEnv = b.dataset.env;
    $$('#matType button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  });
  $$('[data-chain]').forEach((b) => b.addEventListener('click', () => {
    const env = matEnv === 'aug' || matEnv === 'vmatrix' ? 'pmatrix' : matEnv;
    closePop();
    R('ui/templates').insertLatex(R('ui/templates').matrixLatex(matR, matC, env) + b.dataset.chain + R('ui/templates').matrixLatex(b.dataset.chain === '+' ? matR : matC, matC, env) + '=');
  }));
  $$('[data-sys]').forEach((b) => b.addEventListener('click', () => { closePop(); R('ui/templates').insertLatex(R('ui/templates').systemLatex(+b.dataset.sys)); }));
  paintGrid(matR, matC);
  return { showPop, closePop, paintGrid };
});
