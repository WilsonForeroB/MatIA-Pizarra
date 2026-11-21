/* Bloque gráfica 2D (pizarra.html 5812-5920). */
MatIA.define('blocks/graph', ['core/dom', 'model/board', 'blocks/svg-utils', 'blocks/registry'], (dom, S, svgu, registry) => {
  'use strict';
  const R = (n) => MatIA.require(n);
  const { body } = dom;
  const { SVGNS, niceStep, fmtNum, markPath, markLegend } = svgu;

  function buildGraph(b, bd, ro) {
    const box = document.createElement('div');
    box.className = 'graph';
    box.tabIndex = 0;
    const W = 720, H = 400, pad = 28;
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('role', 'img');
    const legend = document.createElement('div');
    legend.className = 'g-legend';
    const err = document.createElement('div');
    err.className = 'g-err';
    box.append(svg, legend, err);
    function draw() {
      svg.textContent = ''; legend.textContent = ''; err.textContent = '';
      const fs = [];
      b.fns.forEach((src, k) => { try { fs.push({ F: R('engine/ops').compileFn(src), k, src }); } catch (e) { err.textContent = 'Aviso: no puedo dibujar «' + src + '»: ' + e.message; } });
      svg.setAttribute('aria-label', 'Gráfica de ' + (fs.map((f) => f.src).join('; ') || 'ninguna función') + ' entre x = ' + b.xmin + ' y x = ' + b.xmax);
      const x0 = b.xmin, x1 = b.xmax, n = 900;
      const samples = fs.map(({ F }) => { const pts = []; for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; pts.push([x, F.f(x)]); } return pts; });
      const ys = samples.flat().map((p) => p[1]).filter(Number.isFinite).sort((a, c) => a - c);
      const mks = (b.marks || []).filter((m) => m.x >= x0 && m.x <= x1);
      let y0 = -5, y1 = 5;
      if (ys.length) {
        const q = (t) => ys[Math.min(ys.length - 1, Math.max(0, Math.floor(t * (ys.length - 1))))];
        y0 = q(0.02); y1 = q(0.98);
        if (y1 - y0 < 1e-9) { y0 -= 1; y1 += 1; }
        const m = (y1 - y0) * 0.12; y0 -= m; y1 += m;
        if (y0 > 0 && y0 < (y1 - y0) * 0.6) y0 = -(y1 - y0) * 0.05;
        if (y1 < 0 && -y1 < (y1 - y0) * 0.6) y1 = (y1 - y0) * 0.05;
        for (const m of mks) { const mg = (y1 - y0) * 0.08; if (m.y - mg < y0) y0 = m.y - mg; if (m.y + mg > y1) y1 = m.y + mg; }
      }
      const sx = (x) => pad + (x - x0) / (x1 - x0) * (W - 2 * pad);
      const sy = (y) => H - pad - (y - y0) / (y1 - y0) * (H - 2 * pad);
      const el = (tag, attrs, cls) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (cls) e.setAttribute('class', cls); svg.appendChild(e); return e; };
      const stx = niceStep(x1 - x0), sty = niceStep(y1 - y0);
      for (let x = Math.ceil(x0 / stx) * stx; x <= x1 + 1e-9; x += stx) {
        el('line', { x1: sx(x), y1: pad, x2: sx(x), y2: H - pad }, 'g-grid');
        if (Math.abs(x) > stx / 2) { const t = el('text', { x: sx(x), y: Math.min(H - pad + 16, Math.max(pad + 12, sy(0) + 16)), 'text-anchor': 'middle' }, 'g-tick'); t.textContent = fmtNum(x); }
      }
      for (let y = Math.ceil(y0 / sty) * sty; y <= y1 + 1e-9; y += sty) {
        el('line', { x1: pad, y1: sy(y), x2: W - pad, y2: sy(y) }, 'g-grid');
        if (Math.abs(y) > sty / 2) { const t = el('text', { x: Math.min(W - pad - 4, Math.max(pad + 30, sx(0) - 6)), y: sy(y) + 4, 'text-anchor': 'end' }, 'g-tick'); t.textContent = fmtNum(y); }
      }
      if (y0 <= 0 && y1 >= 0) el('line', { x1: pad, y1: sy(0), x2: W - pad, y2: sy(0) }, 'g-axis');
      if (x0 <= 0 && x1 >= 0) el('line', { x1: sx(0), y1: pad, x2: sx(0), y2: H - pad }, 'g-axis');
      const o = el('text', { x: sx(0) - 6, y: sy(0) + 16, 'text-anchor': 'end' }, 'g-tick'); o.textContent = '0';
      samples.forEach((pts, i) => {
        const span = y1 - y0;
        let d = '', pen = false, prev = null;
        for (const [x, y] of pts) {
          if (!Number.isFinite(y) || y < y0 - span * 3 || y > y1 + span * 3 || (prev !== null && Math.abs(y - prev) > span * 1.5)) { pen = false; prev = Number.isFinite(y) ? y : null; continue; }
          d += (pen ? 'L' : 'M') + sx(x).toFixed(1) + ' ' + sy(Math.max(y0 - span, Math.min(y1 + span, y))).toFixed(1);
          pen = true; prev = y;
        }
        const color = 'var(--data-' + ((fs[i].k % 6) + 1) + ')';
        const path = el('path', { d }, 'g-curve');
        path.style.stroke = color;
        if (i > 0) path.style.strokeDasharray = ['', '8 5', '2 5', '10 4 2 4', '4 4', '12 6'][i % 6];
        const lg = document.createElement('span');
        lg.style.setProperty('--sw', color);
        lg.textContent = fs[i].src.replace(/\\left|\\right|\\cdot/g, '').replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)').replace(/\\sqrt\{([^{}]+)\}/g, '√($1)').replace(/\\(sin|cos|tan|ln|log|pi)/g, (m, f) => (f === 'pi' ? 'π' : f)).replace(/[{}\\]/g, '').replace(/\^2/g, '²').replace(/\^3/g, '³');
        legend.appendChild(lg);
      });
      // puntos notables
      const absSet = mks.filter((m) => m.kind === 'absmin' || m.kind === 'absmax');
      for (const m of absSet) el('circle', { cx: sx(m.x), cy: sy(m.y), r: 13 }, 'mk-ring mk-' + m.kind);
      const placed = [];
      for (const m of mks.filter((q) => q.kind !== 'absmin' && q.kind !== 'absmax')) {
        el('path', { d: markPath(m.kind, sx(m.x), sy(m.y), 8) }, 'mk mk-' + m.kind);
        let ty = m.kind === 'min' ? sy(m.y) + 24 : sy(m.y) - 14;
        while (placed.some((p) => Math.abs(p[0] - sx(m.x)) < 90 && Math.abs(p[1] - ty) < 14)) ty += m.kind === 'min' ? 14 : -14;
        placed.push([sx(m.x), ty]);
        const t = el('text', { x: sx(m.x), y: ty, 'text-anchor': 'middle' }, 'mk-lab');
        const ab = absSet.find((q) => Math.abs(q.x - m.x) < 1e-9 && Math.abs(q.y - m.y) < 1e-9);
        t.textContent = m.label + (ab ? ' · absoluto' : '');
      }
      for (const m of absSet) {
        if (mks.some((q) => q.kind !== m.kind && q.kind !== 'absmin' && q.kind !== 'absmax' && Math.abs(q.x - m.x) < 1e-9)) continue;
        el('path', { d: markPath(m.kind === 'absmax' ? 'max' : 'min', sx(m.x), sy(m.y), 7) }, 'mk mk-' + m.kind);
        const t = el('text', { x: sx(m.x), y: m.kind === 'absmin' ? sy(m.y) + 26 : sy(m.y) - 16, 'text-anchor': 'middle' }, 'mk-lab'); t.textContent = m.label;
      }
      const old = box.querySelector('.mk-legend'); if (old) old.remove();
      if (mks.length) legend.after(markLegend(mks));
    }
    if (!ro) {
      const ctrl = document.createElement('div');
      ctrl.className = 'g-ctrl';
      const mk = (label, val, set) => { const l = document.createElement('label'); l.textContent = label + ' '; const i = document.createElement('input'); i.type = 'number'; i.step = 'any'; i.value = val; i.addEventListener('change', () => { const v = parseFloat(i.value); if (Number.isFinite(v)) { set(v); if (b.xmax - b.xmin < 1e-6) b.xmax = b.xmin + 1; S.save(); draw(); } }); l.appendChild(i); return l; };
      const fi = document.createElement('input');
      fi.className = 'g-fns';
      fi.value = b.fns.join(' ; ');
      fi.setAttribute('aria-label', 'Funciones separadas por punto y coma');
      fi.title = 'Funciones separadas por ; (LaTeX), por ejemplo f(x)=x^2 ; g(x)=\\sin x';
      fi.addEventListener('change', () => { b.fns = fi.value.split(';').map((t) => t.trim()).filter(Boolean).slice(0, 6); S.save(); draw(); });
      const fl = document.createElement('label'); fl.textContent = 'Funciones '; fl.style.display = 'flex'; fl.style.flex = '1 1 260px'; fl.style.gap = '6px'; fl.style.alignItems = 'center'; fl.appendChild(fi);
      ctrl.append(mk('x desde', b.xmin, (v) => { b.xmin = v; }), mk('hasta', b.xmax, (v) => { b.xmax = v; }), fl);
      box.appendChild(ctrl);
      // zoom con la rueda y arrastre para desplazar
      svg.addEventListener('wheel', (e) => { e.preventDefault(); const k = e.deltaY > 0 ? 1.15 : 1 / 1.15; const c = (b.xmin + b.xmax) / 2, h = (b.xmax - b.xmin) / 2 * k; b.xmin = +(c - h).toFixed(4); b.xmax = +(c + h).toFixed(4); ctrl.querySelectorAll('input[type=number]')[0].value = b.xmin; ctrl.querySelectorAll('input[type=number]')[1].value = b.xmax; S.save(); draw(); }, { passive: false });
      let drag = null;
      svg.addEventListener('pointerdown', (e) => { if (body.dataset.mode === 'draw' || e.pointerType === 'pen') return; drag = { x: e.clientX, a: b.xmin, b: b.xmax, w: svg.getBoundingClientRect().width }; svg.setPointerCapture(e.pointerId); e.stopPropagation(); });
      svg.addEventListener('pointermove', (e) => { if (!drag) return; const dx = (e.clientX - drag.x) / drag.w * (drag.b - drag.a) * (720 / 664); b.xmin = +(drag.a - dx).toFixed(4); b.xmax = +(drag.b - dx).toFixed(4); draw(); });
      svg.addEventListener('pointerup', () => { if (drag) { drag = null; ctrl.querySelectorAll('input[type=number]')[0].value = b.xmin; ctrl.querySelectorAll('input[type=number]')[1].value = b.xmax; S.save(); } });
    }
    bd.appendChild(box);
    draw();
  }
  registry.register({ type: 'graph', build: buildGraph, exportable: true });
  return { buildGraph };
});
