/* Bloque gráfica 2D (pizarra.html 5812-5920). */
MatIA.define('blocks/graph', ['core/dom', 'model/board', 'blocks/svg-utils', 'blocks/registry'], (dom, S, svgu, registry) => {
  'use strict';
  const R = (n) => MatIA.require(n);
  const { body } = dom;
  const { SVGNS, niceStep, fmtNum, markPath, markLegend } = svgu;
  const pio = () => R('assets/pio');

  const DASH = ['', '8 5', '2 5', '10 4 2 4', '4 4', '12 6'];

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
    let lastY = [-5, 5];
    function draw() {
      svg.textContent = ''; legend.textContent = ''; err.textContent = '';
      const fs = [];
      const ops = R('engine/ops');
      b.fns.forEach((src, k) => { if (!String(src).trim()) return; try { fs.push({ F: ops.compileFn(typeof ops.normalizeFn === 'function' ? ops.normalizeFn(src) : src), k, src }); } catch (e) { err.textContent = 'Aviso: no puedo dibujar «' + src + '»: ' + e.message; } });
      svg.setAttribute('aria-label', 'Gráfica de ' + (fs.map((f) => f.src).join('; ') || 'ninguna función') + ' entre x = ' + b.xmin + ' y x = ' + b.xmax);
      const x0 = b.xmin, x1 = b.xmax, n = 900;
      const samples = fs.map(({ F }) => { const pts = []; for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; pts.push([x, F.f(x)]); } return pts; });
      const ys = samples.flat().map((p) => p[1]).filter(Number.isFinite).sort((a, c) => a - c);
      const mks = (b.marks || []).filter((m) => m.x >= x0 && m.x <= x1);
      let y0 = -5, y1 = 5;
      const fixedY = Number.isFinite(b.ymin) && Number.isFinite(b.ymax) && b.ymin < b.ymax;
      if (fixedY) { y0 = b.ymin; y1 = b.ymax; }
      else if (ys.length) {
        const q = (t) => ys[Math.min(ys.length - 1, Math.max(0, Math.floor(t * (ys.length - 1))))];
        y0 = q(0.02); y1 = q(0.98);
        if (y1 - y0 < 1e-9) { y0 -= 1; y1 += 1; }
        const m = (y1 - y0) * 0.12; y0 -= m; y1 += m;
        if (y0 > 0 && y0 < (y1 - y0) * 0.6) y0 = -(y1 - y0) * 0.05;
        if (y1 < 0 && -y1 < (y1 - y0) * 0.6) y1 = (y1 - y0) * 0.05;
        for (const m of mks) { const mg = (y1 - y0) * 0.08; if (m.y - mg < y0) y0 = m.y - mg; if (m.y + mg > y1) y1 = m.y + mg; }
      }
      lastY = [y0, y1];
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
        if (DASH[fs[i].k % 6]) path.style.strokeDasharray = DASH[fs[i].k % 6];
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
      const fnList = document.createElement('div');
      fnList.className = 'g-fnlist';
      fnList.setAttribute('role', 'group');
      fnList.setAttribute('aria-label', 'Funciones de la gráfica');
      const swatch = (k) => {
        const sv = document.createElementNS(SVGNS, 'svg');
        sv.setAttribute('viewBox', '0 0 28 10'); sv.setAttribute('class', 'g-fn-sw'); sv.setAttribute('aria-hidden', 'true');
        const ln = document.createElementNS(SVGNS, 'line');
        ln.setAttribute('x1', 2); ln.setAttribute('x2', 26); ln.setAttribute('y1', 5); ln.setAttribute('y2', 5);
        ln.style.stroke = 'var(--data-' + ((k % 6) + 1) + ')'; ln.style.strokeWidth = '3'; ln.style.strokeLinecap = 'round';
        if (DASH[k % 6]) ln.style.strokeDasharray = DASH[k % 6];
        sv.appendChild(ln); return sv;
      };
      const change = () => { S.save(); draw(); };
      function renderFns() {
        fnList.textContent = '';
        const useMF = MatIA.require('ui/state').mlReady && customElements.get('math-field');
        b.fns.forEach((src, k) => {
          const row = document.createElement('div');
          row.className = 'g-fn';
          let f;
          if (useMF) {
            f = document.createElement('math-field');
            f.dataset.aux = '1';
            R('blocks/editor').configureField(f);
            f.value = src;
            f.addEventListener('input', () => { b.fns[k] = f.getValue('latex'); change(); });
          } else {
            f = document.createElement('input');
            f.type = 'text'; f.dataset.aux = '1'; f.value = src;
            f.addEventListener('input', () => { b.fns[k] = f.value; change(); });
          }
          f.classList.add('g-fn-field');
          f.setAttribute('aria-label', 'Función ' + (k + 1));
          f.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); f.blur(); }
          });
          const rm = document.createElement('button');
          rm.type = 'button'; rm.className = 'mi-btn mi-btn--sm g-fn-rm'; rm.textContent = '×';
          rm.title = 'Quitar función ' + (k + 1); rm.setAttribute('aria-label', 'Quitar función ' + (k + 1));
          rm.addEventListener('click', () => { b.fns.splice(k, 1); renderFns(); change(); });
          row.append(swatch(k), f, rm);
          fnList.appendChild(row);
        });
        const add = document.createElement('button');
        add.type = 'button'; add.className = 'mi-btn mi-btn--sm g-fn-add'; add.textContent = '+ Añadir función';
        add.disabled = b.fns.length >= 6;
        add.title = 'Añadir otra función (máximo 6)'; add.setAttribute('aria-label', 'Añadir función');
        add.addEventListener('click', () => {
          if (b.fns.length >= 6) return;
          b.fns.push(''); renderFns(); S.save();
          const fl = fnList.querySelectorAll('.g-fn-field'); const last = fl[fl.length - 1]; if (last) setTimeout(() => last.focus(), 0);
        });
        fnList.appendChild(add);
      }
      renderFns();
      // ayuda: que se vea que caben varias funciones y cómo moverse
      const help = document.createElement('div');
      help.className = 'g-help';
      help.append(pio().badge('idea', 'pio-sm', 'Pío da una idea'));
      const ht = document.createElement('p');
      ht.innerHTML = 'Puedes dibujar <b>varias funciones en la misma gráfica</b> (hasta 6): pulsa «+ Añadir función» y escribe otra, por ejemplo <code>g(x)=sin(x)</code>. '
        + '<b>Arrastra</b> la gráfica para moverla y usa <b>+</b> / <b>−</b> para acercar o alejar.';
      help.appendChild(ht);
      const inputs = {};
      const num = (label, key, aria) => {
        const l = document.createElement('label'); l.textContent = label + ' ';
        const i = document.createElement('input'); i.type = 'number'; i.step = 'any'; i.setAttribute('aria-label', aria);
        if (key[1] === 'y') i.placeholder = 'auto';
        i.addEventListener('change', () => {
          const v = parseFloat(i.value);
          if (key === 'ymin' || key === 'ymax') {
            if (Number.isFinite(v)) b[key] = v; else delete b[key];
            if (Number.isFinite(b.ymin) && Number.isFinite(b.ymax) && b.ymax <= b.ymin) { delete b.ymin; delete b.ymax; }
          } else if (Number.isFinite(v)) { b[key] = v; if (b.xmax - b.xmin < 1e-6) b.xmax = b.xmin + 1; }
          sync(); change();
        });
        inputs[key] = i; l.appendChild(i); return l;
      };
      function sync() { for (const k in inputs) inputs[k].value = Number.isFinite(b[k]) ? b[k] : ''; }
      const rangeGrp = document.createElement('div'); rangeGrp.className = 'g-range';
      rangeGrp.append(num('x desde', 'xmin', 'x desde'), num('hasta', 'xmax', 'x hasta'), num('y desde', 'ymin', 'y desde (vacío = automático)'), num('hasta', 'ymax', 'y hasta (vacío = automático)'));
      const zoom = (k) => {
        const cx = (b.xmin + b.xmax) / 2, hx = (b.xmax - b.xmin) / 2 * k;
        b.xmin = +(cx - hx).toFixed(6); b.xmax = +(cx + hx).toFixed(6);
        const cy = (lastY[0] + lastY[1]) / 2, hy = (lastY[1] - lastY[0]) / 2 * k;
        b.ymin = +(cy - hy).toFixed(6); b.ymax = +(cy + hy).toFixed(6);
      };
      const pan = (dx, dy) => {
        const w = b.xmax - b.xmin; b.xmin = +(b.xmin + dx * w).toFixed(6); b.xmax = +(b.xmax + dx * w).toFixed(6);
        if (dy) { const h = lastY[1] - lastY[0]; b.ymin = +(lastY[0] + dy * h).toFixed(6); b.ymax = +(lastY[1] + dy * h).toFixed(6); }
      };
      const fit = () => {
        delete b.ymin; delete b.ymax;
        const xs = (b.marks || []).map((m) => m.x).filter(Number.isFinite);
        if (xs.length) { const a = Math.min(...xs), c = Math.max(...xs), m = Math.max((c - a) * 0.15, 1); b.xmin = +(a - m).toFixed(6); b.xmax = +(c + m).toFixed(6); }
        else { b.xmin = -5; b.xmax = 5; }
      };
      const zbar = document.createElement('div');
      zbar.className = 'g-zoom'; zbar.setAttribute('role', 'group'); zbar.setAttribute('aria-label', 'Zoom y desplazamiento');
      [['+', 'Acercar', () => zoom(1 / 1.25)], ['−', 'Alejar', () => zoom(1.25)], ['←', 'Desplazar a la izquierda', () => pan(-0.2, 0)], ['↑', 'Desplazar hacia arriba', () => pan(0, 0.2)], ['↓', 'Desplazar hacia abajo', () => pan(0, -0.2)], ['→', 'Desplazar a la derecha', () => pan(0.2, 0)], ['Ajustar', 'Ajustar al rango automático', fit]].forEach(([t, title, fn]) => {
        const bt = document.createElement('button');
        bt.type = 'button'; bt.className = 'mi-btn mi-btn--sm'; bt.textContent = t; bt.title = title; bt.setAttribute('aria-label', title);
        bt.addEventListener('click', () => { draw(); fn(); sync(); change(); });
        zbar.appendChild(bt);
      });
      sync();
      ctrl.append(fnList, help, zbar, rangeGrp);
      box.appendChild(ctrl);
      // arrastrar para desplazar (la rueda desplaza la página)
      let drag = null;
      svg.addEventListener('pointerdown', (e) => { if (body.dataset.mode === 'draw' || e.pointerType === 'pen') return; drag = { x: e.clientX, a: b.xmin, b: b.xmax, w: svg.getBoundingClientRect().width }; svg.setPointerCapture(e.pointerId); e.stopPropagation(); R('blocks/editor').setActive(b.id); });
      svg.addEventListener('pointermove', (e) => { if (!drag) return; const dx = (e.clientX - drag.x) / drag.w * (drag.b - drag.a) * (720 / 664); b.xmin = +(drag.a - dx).toFixed(4); b.xmax = +(drag.b - dx).toFixed(4); draw(); });
      svg.addEventListener('pointerup', () => { if (drag) { drag = null; sync(); S.save(); } });
    }
    bd.appendChild(box);
    draw();
  }
  registry.register({ type: 'graph', build: buildGraph, exportable: true });
  return { buildGraph };
});
