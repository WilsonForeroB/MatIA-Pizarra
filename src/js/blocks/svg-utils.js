/* Utilidades SVG comunes a los bloques gráficos: marcas, SVGNS, niceStep, fmtNum (pizarra.html 5789-5811). */
MatIA.define('blocks/svg-utils', [], () => {
  'use strict';

  const MARK_TXT = { min: ['▼', 'mínimo relativo'], max: ['▲', 'máximo relativo'], absmin: ['◉', 'mínimo absoluto'], absmax: ['◉', 'máximo absoluto'], infl: ['◆', 'punto de inflexión'], saddle: ['✕', 'punto de silla'], deg: ['?', 'caso dudoso'] };
  function markPath(kind, x, y, r) {
    if (kind === 'max') return 'M' + x + ' ' + (y - r) + 'L' + (x + r) + ' ' + (y + r * 0.8) + 'L' + (x - r) + ' ' + (y + r * 0.8) + 'Z';
    if (kind === 'min') return 'M' + x + ' ' + (y + r) + 'L' + (x + r) + ' ' + (y - r * 0.8) + 'L' + (x - r) + ' ' + (y - r * 0.8) + 'Z';
    if (kind === 'infl') return 'M' + x + ' ' + (y - r) + 'L' + (x + r) + ' ' + y + 'L' + x + ' ' + (y + r) + 'L' + (x - r) + ' ' + y + 'Z';
    if (kind === 'saddle') { const k = r * 0.75, w = r * 0.35; return 'M' + (x - k) + ' ' + (y - k + w) + 'L' + (x - k + w) + ' ' + (y - k) + 'L' + x + ' ' + (y - w) + 'L' + (x + k - w) + ' ' + (y - k) + 'L' + (x + k) + ' ' + (y - k + w) + 'L' + (x + w) + ' ' + y + 'L' + (x + k) + ' ' + (y + k - w) + 'L' + (x + k - w) + ' ' + (y + k) + 'L' + x + ' ' + (y + w) + 'L' + (x - k + w) + ' ' + (y + k) + 'L' + (x - k) + ' ' + (y + k - w) + 'L' + (x - w) + ' ' + y + 'Z'; }
    return 'M' + (x - r) + ' ' + y + 'A' + r + ' ' + r + ' 0 1 0 ' + (x + r) + ' ' + y + 'A' + r + ' ' + r + ' 0 1 0 ' + (x - r) + ' ' + y + 'Z';
  }
  function markLegend(marks) {
    const lg = document.createElement('div');
    lg.className = 'mk-legend';
    const kinds = [...new Set(marks.map((m) => m.kind))];
    for (const k of kinds) { const sp = document.createElement('span'); sp.className = 'k-' + k; sp.innerHTML = '<i></i>'; sp.querySelector('i').textContent = MARK_TXT[k][0]; sp.appendChild(document.createTextNode(MARK_TXT[k][1])); lg.appendChild(sp); }
    return lg;
  }

  /* ---------------- Gráficas ---------------- */
  const SVGNS = 'http://www.w3.org/2000/svg';
  function niceStep(r) {
    const raw = r / 8, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
    return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
  }
  const fmtNum = (v) => { const r = Math.round(v * 1000) / 1000; return String(r).replace('.', ',').replace('-', '−'); };
  return { MARK_TXT, markPath, markLegend, SVGNS, niceStep, fmtNum };
});
