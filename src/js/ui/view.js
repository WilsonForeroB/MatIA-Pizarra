/* Ajustes visuales: papel, zoom, tema, acento, escala y colores de la barra (pizarra.html 4708-4749). */
MatIA.define('ui/view', ['core/dom', 'model/board', 'ui/state'], (dom, S, st) => {
  'use strict';
  const { $, $$ } = dom;
  const { root, body } = dom;
  const sheet = $('#sheet'), wrap = $('#wrap');
  /* ---------------- Ajustes visuales ---------------- */
  const PAPERS = { free: null, a4p: [794, 1123], a4l: [1123, 794], a3l: [1587, 1123], slide: [1280, 720] };
  const PAGE_CSS = { free: 'margin:14mm', a4p: 'size:A4 portrait;margin:0', a4l: 'size:A4 landscape;margin:0', a3l: 'size:A3 landscape;margin:0', slide: 'size:13.333in 7.5in;margin:0' };
  function fitZoom() {
    const pp = PAPERS[S.board.paper];
    let z = 1;
    const vw = wrap.clientWidth, vh = wrap.clientHeight;
    if (body.classList.contains('presenting')) z = pp ? Math.min(vw / pp[0], vh / pp[1]) : 1;
    else if (pp) z = Math.min(1, (vw - 32) / pp[0]);
    if (!Number.isFinite(z) || z <= 0) z = 1;
    st.zoomF = z;
    sheet.style.zoom = Math.abs(z - 1) < 1e-3 ? '' : String(z);
  }
  function applyPaper() {
    const pp = PAPERS[S.board.paper];
    sheet.classList.toggle('paper', !!pp);
    if (pp) { sheet.style.setProperty('--pw', pp[0] + 'px'); sheet.style.setProperty('--ph', pp[1] + 'px'); }
    $('#pageStyle').textContent = '@media print{@page{' + PAGE_CSS[S.board.paper] + '}}';
    $('#paperSel').value = S.board.paper;
    fitZoom();
  }
  function applySettings() {
    if (S.board.theme) root.setAttribute('data-theme', S.board.theme); else root.removeAttribute('data-theme');
    if (S.board.accent) body.setAttribute('data-module', S.board.accent); else body.removeAttribute('data-module');
    $$('[data-accent]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.accent === S.board.accent)));
    root.style.setProperty('--scale', String(S.board.scale / 100));
    if (typeof applyPaper === 'function' && $('#paperSel')) applyPaper();
    $('#scale').value = S.board.scale;
    $('#scaleOut').textContent = S.board.scale + ' %';
    $$('[data-theme-set]').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.themeSet === 'dark') === isDark())));
    $$('.sw').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.color === S.board.color)));
    $$('#toolSeg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tool === S.board.tool)));
    $$('#shapeOpts [data-shape]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.shape === S.board.shape)));
    $$('#shapeOpts [data-dash]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.dash === S.board.dash)));
    $$('#shapeOpts [data-fill]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.fill === S.board.fill)));
    // opciones de figura: forma y relleno con «Figuras»; el tipo de línea también con «Flecha»
    $('#shapeOpts').hidden = S.board.tool !== 'shape' && S.board.tool !== 'arrow';
    $$('#shapeOpts .so-shape').forEach((x) => { x.hidden = S.board.tool !== 'shape'; });
    $('#penWidth').value = S.board.width;
    $('#widthOut').textContent = S.board.width + ' px';
    body.classList.toggle('no-ln', S.board.lineNums === false);
    $$('#lnSeg button').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.ln === '1') === (S.board.lineNums !== false))));
  }
  const isDark = () => S.board.theme ? S.board.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const cssVar = (name) => getComputedStyle(body).getPropertyValue('--' + name).trim();
  const COLOR_NAMES = ['ink', 'data-1', 'data-2', 'data-3', 'data-4', 'data-5'];
  return { PAPERS, PAGE_CSS, fitZoom, applyPaper, applySettings, isDark, cssVar, COLOR_NAMES };
});
