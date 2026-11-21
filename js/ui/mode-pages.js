/* Modo Escribir/Dibujar, presentación, páginas, tema/escala/acento, pantalla completa y ayuda (pizarra.html 7347-7422). */
MatIA.define('ui/mode-pages', ['core/dom', 'model/board', 'model/schema', 'ui/state', 'ui/toast'], (dom, S, schema, st, toast) => {
  'use strict';
  const { $, $$ } = dom;
  const { root, body } = dom;
  const blocksEl = $('#blocks'), wrap = $('#wrap');
  const { newPage } = schema;
  const R = (n) => MatIA.require(n);
  /* ---------------- Modo, páginas y ajustes ---------------- */
  function setMode(m) {
    body.dataset.mode = m;
    $$('[data-mode]', $('#top')).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
    if (m === 'draw' && document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }
  $$('button[data-mode]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
  /* ---------------- Modo presentación ---------------- */
  let presT = null;
  const presBar = $('#presBar');
  function presIdle() { presBar.classList.remove('idle'); clearTimeout(presT); presT = setTimeout(() => presBar.classList.add('idle'), 2500); }
  function updatePres() {
    $('#presOut').textContent = (S.board.cur + 1) + ' / ' + S.board.pages.length;
    $('#presPrev').disabled = S.board.cur === 0;
    $('#presNext').disabled = S.board.cur === S.board.pages.length - 1;
    $('#presDraw').setAttribute('aria-pressed', String(body.dataset.mode === 'draw'));
  }
  function startPresent() {
    R('ui/popovers').closePop();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    body.classList.add('presenting');
    body.classList.toggle('pres-paper', !!R('ui/view').PAPERS[S.board.paper]);
    if (!document.fullscreenElement && root.requestFullscreen) root.requestFullscreen().catch(() => { /* sin pantalla completa: se presenta en la ventana */ });
    updatePres();
    presIdle();
    requestAnimationFrame(() => { R('ui/drawing').sizeCanvas(); wrap.scrollTop = 0; });
    if (S.board.paper === 'free') toast('Consejo: elige Vista ▾ → Tamaño de página → Diapositiva 16:9 para que cada página quepa entera en la pantalla.');
  }
  function endPresent() {
    if (!body.classList.contains('presenting')) return;
    body.classList.remove('presenting', 'pres-paper');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => { /* */ });
    requestAnimationFrame(R('ui/drawing').sizeCanvas);
  }
  $('#presBtn').addEventListener('click', startPresent);
  $('#presExit').addEventListener('click', endPresent);
  $('#presPrev').addEventListener('click', () => { goPage(S.board.cur - 1); updatePres(); });
  $('#presNext').addEventListener('click', () => { goPage(S.board.cur + 1); updatePres(); });
  $('#presDraw').addEventListener('click', () => { setMode(body.dataset.mode === 'draw' ? 'write' : 'draw'); updatePres(); });
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) endPresent(); });
  document.addEventListener('pointermove', () => { if (body.classList.contains('presenting')) presIdle(); });
  $('#paperSel').addEventListener('change', (e) => { S.board.paper = e.target.value; body.classList.toggle('pres-paper', body.classList.contains('presenting') && !!R('ui/view').PAPERS[S.board.paper]); R('ui/view').applyPaper(); S.save(); requestAnimationFrame(R('ui/drawing').sizeCanvas); });
  window.addEventListener('resize', () => requestAnimationFrame(R('ui/drawing').sizeCanvas));

  function goPage(i) {
    if (i < 0 || i >= S.board.pages.length) return;
    S.board.cur = i;
    R('blocks/editor').renderPage();
    S.save();
  }
  $('#pgPrev').addEventListener('click', () => goPage(S.board.cur - 1));
  $('#pgNext').addEventListener('click', () => goPage(S.board.cur + 1));
  $('#pgAdd').addEventListener('click', () => { S.board.pages.splice(S.board.cur + 1, 0, newPage()); goPage(S.board.cur + 1); });
  $('#scale').addEventListener('input', (e) => { S.board.scale = +e.target.value; R('ui/view').applySettings(); S.save(); requestAnimationFrame(R('ui/drawing').sizeCanvas); });
  $$('[data-accent]').forEach((b) => b.addEventListener('click', () => { S.board.accent = b.dataset.accent; R('ui/view').applySettings(); S.save(); }));
  $$('[data-theme-set]').forEach((b) => b.addEventListener('click', () => { S.board.theme = b.dataset.themeSet; R('ui/view').applySettings(); refreshColors(); S.save(); }));
  $('#viewBtn').addEventListener('click', (e) => { if (st.openPop && st.openPop.p.id === 'viewPop') R('ui/popovers').closePop(); else R('ui/popovers').showPop('viewPop', e.currentTarget); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (!S.board.theme) { R('ui/view').applySettings(); refreshColors(); } });
  function refreshColors() {
    // Vuelve a pintar las fórmulas con colores y los trazos con los tonos del tema actual
    $$('math-field', blocksEl).forEach((mf) => { if (/\\textcolor|\\color/.test(mf.value)) { const v = mf.value; mf.value = ''; mf.value = v; } });
    R('ui/drawing').redraw();
    for (const f of R('blocks/graph3d').redrawers) { try { f(); } catch (e) { /* bloque ya eliminado */ } }
  }
  function toggleFull() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (root.requestFullscreen) root.requestFullscreen().catch(() => toast('Tu navegador no permite pantalla completa aquí.', 'aviso'));
  }
  $('#fsBtn').addEventListener('click', toggleFull);
  document.addEventListener('fullscreenchange', () => { const fl = document.fullscreenElement ? 'Salir de pantalla completa (F)' : 'Pantalla completa (F)'; $('#fsBtn').title = fl; $('#fsBtn').setAttribute('aria-label', fl); $('#fsBtn').setAttribute('aria-pressed', String(!!document.fullscreenElement)); requestAnimationFrame(R('ui/drawing').sizeCanvas); });
  const toggleChrome = () => { body.classList.toggle('chrome-off'); requestAnimationFrame(R('ui/drawing').sizeCanvas); };
  $('#hideBtn').addEventListener('click', () => { R('ui/popovers').closePop(); toggleChrome(); });
  $('#showChrome').addEventListener('click', toggleChrome);
  const help = $('#help');
  $('#helpBtn').addEventListener('click', () => help.showModal());
  $('#helpClose').addEventListener('click', () => help.close());
  return { setMode, presT, presBar, presIdle, updatePres, startPresent, endPresent, goPage, refreshColors, toggleFull, toggleChrome, help };
});
