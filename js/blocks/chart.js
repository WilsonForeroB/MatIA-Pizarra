/* Bloque gráfico estadístico (pizarra.html 6230-6318). */
MatIA.define('blocks/chart', ['blocks/svg-utils', 'blocks/registry'], (svgu, registry) => {
  'use strict';
  const { SVGNS, niceStep } = svgu;

  /* ---------------- Gráficos de estadística ---------------- */
  const fmtC = (v) => { if (!Number.isFinite(v)) return ''; const r = Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 1000) / 1000; return String(r).replace('.', ',').replace('-', '−'); };
  function buildChart(b, bd) {
    const box = document.createElement('div');
    box.className = 'chart';
    box.tabIndex = 0;
    const title = document.createElement('p');
    title.className = 'c-title';
    title.textContent = b.title || '';
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('role', 'img');
    const el = (tag, attrs, cls) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (cls) e.setAttribute('class', cls); svg.appendChild(e); return e; };
    const txt = (x, y, t, cls, anchor) => { const e = el('text', { x, y, 'text-anchor': anchor || 'middle' }, cls); e.textContent = t; return e; };
    const W = 720;
    if (b.kind === 'bars') {
      const H = 320, L = 56, Rp = 16, T = 24, B = 44;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      const vals = b.values, n = vals.length || 1, mx = Math.max(1e-9, ...vals);
      const st = niceStep(mx * 1.15);
      const top = Math.ceil(mx * 1.12 / st) * st || 1;
      const sy = (v) => H - B - v / top * (H - B - T);
      for (let v = 0; v <= top + 1e-9; v += st) { el('line', { x1: L, y1: sy(v), x2: W - Rp, y2: sy(v) }, 'c-grid'); txt(L - 6, sy(v) + 4, fmtC(v), 'c-tick', 'end'); }
      const bw = (W - L - Rp) / n;
      const hi = new Set(b.hi || []);
      vals.forEach((v, i) => {
        const x = L + i * bw + bw * 0.15, w = bw * 0.7;
        const r = el('rect', { x, y: sy(v), width: Math.max(1, w), height: Math.max(0, sy(0) - sy(v)) }, 'c-bar' + (hi.has(i) ? ' hi' : ''));
        r.setAttribute('aria-hidden', 'true');
        if (n <= 30) txt(x + w / 2, sy(0) + 16, b.labels[i] || String(i), 'c-lab');
        if (n <= 16 && v > 0) txt(x + w / 2, sy(v) - 6, b.valueLabels ? b.valueLabels[i] : fmtC(v), 'c-val');
      });
      el('line', { x1: L, y1: sy(0), x2: W - Rp, y2: sy(0) }, 'c-axis');
      el('line', { x1: L, y1: T - 6, x2: L, y2: sy(0) }, 'c-axis');
      if (b.ylabel) txt(L - 6, T - 10, b.ylabel, 'c-tick', 'end');
      svg.setAttribute('aria-label', (b.title || 'Diagrama de barras') + ': ' + vals.map((v, i) => (b.labels[i] || i) + ' → ' + fmtC(v)).join(', '));
    } else if (b.kind === 'box') {
      const H = 220, L = 40, Rp = 40;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      const lo = b.min, hiV = b.max, span = (hiV - lo) || 1;
      const x0 = lo - span * 0.08, x1 = hiV + span * 0.08;
      const sx = (v) => L + (v - x0) / (x1 - x0) * (W - L - Rp);
      const yc = 90, hh = 34;
      const stp = niceStep(x1 - x0);
      for (let v = Math.ceil(x0 / stp) * stp; v <= x1 + 1e-9; v += stp) { el('line', { x1: sx(v), y1: 30, x2: sx(v), y2: 170 }, 'c-grid'); txt(sx(v), 190, fmtC(v), 'c-tick'); }
      el('line', { x1: L, y1: 172, x2: W - Rp, y2: 172 }, 'c-axis');
      el('line', { x1: sx(lo), y1: yc, x2: sx(b.q1), y2: yc }, 'c-wh');
      el('line', { x1: sx(b.q3), y1: yc, x2: sx(hiV), y2: yc }, 'c-wh');
      el('line', { x1: sx(lo), y1: yc - 14, x2: sx(lo), y2: yc + 14 }, 'c-wh');
      el('line', { x1: sx(hiV), y1: yc - 14, x2: sx(hiV), y2: yc + 14 }, 'c-wh');
      el('rect', { x: sx(b.q1), y: yc - hh, width: Math.max(1, sx(b.q3) - sx(b.q1)), height: hh * 2, rx: 3 }, 'c-box');
      el('line', { x1: sx(b.med), y1: yc - hh, x2: sx(b.med), y2: yc + hh }, 'c-med');
      if (b.mean != null) el('path', { d: 'M' + sx(b.mean) + ' ' + (yc - 7) + 'L' + (sx(b.mean) + 7) + ' ' + yc + 'L' + sx(b.mean) + ' ' + (yc + 7) + 'L' + (sx(b.mean) - 7) + ' ' + yc + 'Z' }, 'c-mean');
      (b.data || []).forEach((v, i) => el('circle', { cx: sx(v), cy: 150 + ((i % 3) - 1) * 6, r: 3.5 }, 'c-dot'));
      const labs = [[lo, 'mín'], [b.q1, 'Q₁'], [b.med, 'Me'], [b.q3, 'Q₃'], [hiV, 'máx']];
      labs.forEach(([v, t], i) => { txt(sx(v), yc - hh - 10 - (i % 2) * 14, t + ' ' + fmtC(v), 'c-lab'); });
      svg.setAttribute('aria-label', 'Diagrama de caja: mínimo ' + fmtC(lo) + ', Q1 ' + fmtC(b.q1) + ', mediana ' + fmtC(b.med) + ', Q3 ' + fmtC(b.q3) + ', máximo ' + fmtC(hiV) + (b.mean != null ? ', media ' + fmtC(b.mean) : ''));
      const leg = document.createElement('div'); leg.className = 'mk-legend';
      leg.innerHTML = '<span><i style="color:var(--data-3)">◆</i>media</span><span><i style="color:var(--data-2)">●</i>datos</span><span>caja de Q₁ a Q₃ con la mediana; bigotes hasta mínimo y máximo</span>';
      box.append(title, svg, leg);
      bd.appendChild(box);
      return;
    } else if (b.kind === 'normal') {
      const H = 300, L = 30, Rp = 30, T = 20, B = 50;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      const mu = b.mu, sg = b.sigma || 1;
      const x0 = mu - 4 * sg, x1 = mu + 4 * sg;
      const pdf = (x) => Math.exp(-((x - mu) ** 2) / (2 * sg * sg)) / (sg * Math.sqrt(2 * Math.PI));
      const pk = pdf(mu);
      const sx = (x) => L + (x - x0) / (x1 - x0) * (W - L - Rp);
      const sy = (y) => H - B - y / pk * (H - B - T);
      const N = 400, pts = [];
      for (let i = 0; i <= N; i++) { const x = x0 + (x1 - x0) * i / N; pts.push([x, pdf(x)]); }
      const a = b.a == null ? x0 : Math.max(x0, b.a), c = b.b == null ? x1 : Math.min(x1, b.b);
      if (!(b.a != null && b.b != null && b.a === b.b) && (b.a != null || b.b != null) && c > a) {
        let d = 'M' + sx(a) + ' ' + sy(0);
        for (const [x, y] of pts) if (x >= a && x <= c) d += 'L' + sx(x).toFixed(1) + ' ' + sy(y).toFixed(1);
        d += 'L' + sx(c) + ' ' + sy(pdf(c)).toFixed(1) + 'L' + sx(c) + ' ' + sy(0) + 'Z';
        el('path', { d }, 'c-area');
      }
      el('path', { d: 'M' + pts.map(([x, y]) => sx(x).toFixed(1) + ' ' + sy(y).toFixed(1)).join('L') }, 'c-curve');
      el('line', { x1: L, y1: sy(0), x2: W - Rp, y2: sy(0) }, 'c-axis');
      for (let k = -3; k <= 3; k++) { const x = mu + k * sg; el('line', { x1: sx(x), y1: sy(0), x2: sx(x), y2: sy(0) + 5 }, 'c-axis'); txt(sx(x), sy(0) + 19, fmtC(x), 'c-tick'); txt(sx(x), sy(0) + 34, k === 0 ? 'μ' : (k > 0 ? 'μ+' : 'μ−') + (Math.abs(k) === 1 ? '' : Math.abs(k)) + 'σ', 'c-tick'); }
      for (const v of [b.a, b.b]) if (v != null && v >= x0 && v <= x1) { el('line', { x1: sx(v), y1: sy(pdf(v)) - 10, x2: sx(v), y2: sy(0) }, 'c-cut'); txt(sx(v), sy(pdf(v)) - 16, fmtC(v), 'c-val'); }
      svg.setAttribute('aria-label', 'Campana de Gauss ' + (b.title || ''));
    }
    box.append(title, svg);
    bd.appendChild(box);
  }
  /* Trigonometría y geometría: circunferencia goniométrica, triángulos, rectas y paralelas con secante */
  registry.register({ type: 'chart', build: buildChart, exportable: true });
  return { fmtC, buildChart };
});
