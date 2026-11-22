/* Bloque «Sólido de revolución»: perfil 2D (SVG) + sólido 3D (canvas) + volumen. */
/* IMPORTANTE: este script debe cargarse ANTES de js/model/board.js (el tablero se sanea al crearse el módulo, y el
   saneador de 'solid' tiene que estar ya registrado). Por eso no depende de model/board: lo usa con enlace tardío. */
MatIA.define('blocks/solid', ['blocks/registry', 'blocks/canvas3d'], (registry, c3) => {
  'use strict';
  const R = (n) => MatIA.require(n);
  const S = { save: () => R('model/board').save() };
  const cssVar = (...a) => R('ui/view').cssVar(...a);
  const NS = 'http://www.w3.org/2000/svg';
  const AXES = [['x', 'Eje X'], ['y', 'Eje Y'], ['y=k', 'Recta y = k'], ['x=k', 'Recta x = k']];
  const fmt = (v) => v.toFixed(4).replace('.', ',');
  const fnum = (v) => String(Math.round(v * 1e6) / 1e6).replace('.', ',');

  const horizontal = (b) => b.axis === 'x' || b.axis === 'y=k';
  const axisPos = (b) => (b.axis === 'y=k' || b.axis === 'x=k' ? b.k : 0);

  function compile(b) {
    const ops = R('engine/ops');
    let src = b.fn;
    if (typeof ops.normalizeFn === 'function') { try { const s = ops.normalizeFn(src); if (typeof s === 'string' && s) src = s; } catch (e) { /* se usa el original */ } }
    return ops.compileFn(src);
  }

  function simpson(g, a, bb, n) {
    n = n || 1000;
    const h = (bb - a) / n;
    let s = g(a) + g(bb);
    for (let i = 1; i < n; i++) s += g(a + i * h) * (i % 2 ? 4 : 2);
    return s * h / 3;
  }
  /** Volumen numérico (unidades³), NaN si el integrando no es finito. */
  function volume(F, b) {
    const k = b.k;
    const kp = axisPos(b);
    if (horizontal(b)) return simpson((x) => Math.PI * (F.f(x) - kp) ** 2, b.a, b.b, 1000);
    if (b.a < kp && kp < b.b) {
      // el eje vertical corta la región: las dos partes giran sobre el mismo sitio; cuenta la mayor altura a cada radio
      const Rmax = Math.max(kp - b.a, b.b - kp);
      const h = (r) => Math.max(kp + r <= b.b ? Math.abs(F.f(kp + r)) : 0, kp - r >= b.a ? Math.abs(F.f(kp - r)) : 0);
      return simpson((r) => 2 * Math.PI * r * h(r), 0, Rmax, 1000);
    }
    return simpson((x) => 2 * Math.PI * Math.abs(x - kp) * Math.abs(F.f(x)), b.a, b.b, 1000);
  }
  function integralLatex(F, b) {
    const k = axisPos(b), fx = '\\left(' + F.latex + '\\right)';
    const sh = (v, s) => (k === 0 ? v : v + (k > 0 ? '-' : '+') + fnum(Math.abs(k)).replace(',', '{,}'));
    const n = (v) => fnum(v).replace(',', '{,}'); // coma decimal escapada en LaTeX
    if (horizontal(b)) return 'V=\\pi\\int_{' + n(b.a) + '}^{' + n(b.b) + '}\\left(' + (k === 0 ? F.latex : F.latex + (k > 0 ? '-' : '+') + n(Math.abs(k))) + '\\right)^{2}dx';
    if (b.a < k && k < b.b) return 'V=2\\pi\\int_{0}^{' + n(Math.max(k - b.a, b.b - k)) + '}r\\cdot h(r)\\,dr';
    return 'V=2\\pi\\int_{' + n(b.a) + '}^{' + n(b.b) + '}\\left|' + sh('x') + '\\right|\\cdot\\left|' + F.latex + '\\right|dx';
  }


  /* Volumen exacto con el módulo de integrales (si sabe integrar): devuelve LaTeX como «8\\pi» o «\\frac{2\\pi}{3}», o ''. */
  function exactVolume(F, b) {
    const ops = R('engine/ops');
    if (typeof ops.integralLine !== 'function') return '';
    const k = axisPos(b), lim = '_{' + fnum(b.a).replace(',', '.') + '}^{' + fnum(b.b).replace(',', '.') + '}';
    const kk = k === 0 ? '' : (k > 0 ? '-' : '+') + String(Math.abs(k));
    let factor, integrand;
    if (horizontal(b)) { factor = 1; integrand = '\\left(' + F.latex + kk + '\\right)^{2}'; }
    else {
      // capas: |x−k|·|f(x)| solo se integra si no cambian de signo en [a, b]
      const xs = Array.from({ length: 21 }, (_, i) => b.a + (b.b - b.a) * i / 20), ys = xs.map((x) => F.f(x));
      const sx = xs.every((x) => x - k >= 0) ? 1 : xs.every((x) => x - k <= 0) ? -1 : 0;
      const sy = ys.every((y) => y >= 0) ? 1 : ys.every((y) => y <= 0) ? -1 : 0;
      if (!sx || !sy) return '';
      factor = 2 * sx * sy; integrand = '\\left(x' + kk + '\\right)\\cdot\\left(' + F.latex + '\\right)';
    }
    const r = ops.integralLine('\\int' + lim + integrand + '\\,dx').latex;
    const val = r.slice(r.lastIndexOf('=') + 1).trim();
    if (!val || /approx|int|NaN/.test(val)) return '';
    const m = /^(-?)\\frac\{(\d+)\}\{(\d+)\}$/.exec(val), n = /^-?\d+$/.test(val) ? +val : null;
    if (m) { const num = factor * (m[1] ? -1 : 1) * +m[2], den = +m[3]; return (num < 0 ? '-' : '') + '\\frac{' + (Math.abs(num) === 1 ? '' : Math.abs(num)) + '\\pi}{' + den + '}'; }
    if (n !== null) { const t = factor * n; return t === 0 ? '0' : (t === 1 ? '' : t === -1 ? '-' : t) + '\\pi'; }
    return '';
  }

  function el(tag, attrs) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; }

  /* ---------- perfil 2D ---------- */
  function profileSvg(F, b) {
    const W = 360, H = 150, m = 22;
    const N = 120, xs = [], ys = [];
    for (let i = 0; i <= N; i++) { const x = b.a + (b.b - b.a) * i / N; xs.push(x); ys.push(F.f(x)); }
    const fin = ys.filter(Number.isFinite);
    const ap = axisPos(b);
    let x0 = b.a, x1 = b.b, y0 = Math.min(0, ...fin), y1 = Math.max(0, ...fin);
    if (horizontal(b)) { y0 = Math.min(y0, ap); y1 = Math.max(y1, ap); } else { x0 = Math.min(x0, ap, 0); x1 = Math.max(x1, ap, 0); }
    if (x1 - x0 < 1e-9) { x0 -= 1; x1 += 1; }
    if (y1 - y0 < 1e-9) { y0 -= 1; y1 += 1; }
    const sx = (x) => m + (x - x0) / (x1 - x0) * (W - 2 * m), sy = (y) => H - m - (y - y0) / (y1 - y0) * (H - 2 * m);
    const svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'sol-prof', role: 'img', 'aria-label': 'Perfil de la función y eje de giro' });
    const base = horizontal(b) ? ap : 0;
    // región sombreada entre la curva y la base
    let d = '', open = false;
    const segs = [];
    let cur = [];
    xs.forEach((x, i) => { if (Number.isFinite(ys[i])) cur.push([x, ys[i]]); else if (cur.length) { segs.push(cur); cur = []; } });
    if (cur.length) segs.push(cur);
    segs.forEach((s) => {
      d += 'M' + sx(s[0][0]) + ' ' + sy(base) + s.map((p) => 'L' + sx(p[0]).toFixed(1) + ' ' + sy(p[1]).toFixed(1)).join('') + 'L' + sx(s[s.length - 1][0]) + ' ' + sy(base) + 'Z';
    });
    svg.appendChild(el('path', { d, class: 'sol-region' }));
    // ejes de referencia
    svg.appendChild(el('line', { x1: sx(x0), x2: sx(x1), y1: sy(0), y2: sy(0), class: 'sol-ref' }));
    svg.appendChild(el('line', { x1: sx(0), x2: sx(0), y1: sy(y0), y2: sy(y1), class: 'sol-ref' }));
    // curva
    svg.appendChild(el('path', { d: segs.map((s) => 'M' + s.map((p) => sx(p[0]).toFixed(1) + ' ' + sy(p[1]).toFixed(1)).join('L')).join(''), class: 'sol-curve' }));
    // eje de giro
    let lab;
    if (horizontal(b)) {
      svg.appendChild(el('line', { x1: sx(x0), x2: sx(x1), y1: sy(ap), y2: sy(ap), class: 'sol-axis' }));
      lab = el('text', { x: sx(x1) - 2, y: sy(ap) - 5, 'text-anchor': 'end', class: 'sol-lab' });
      lab.textContent = b.axis === 'x' ? 'eje de giro: eje X' : 'eje de giro: y = ' + fnum(ap);
    } else {
      svg.appendChild(el('line', { x1: sx(ap), x2: sx(ap), y1: sy(y0), y2: sy(y1), class: 'sol-axis' }));
      lab = el('text', { x: sx(ap) + 5, y: sy(y1) + 10, class: 'sol-lab' });
      lab.textContent = b.axis === 'y' ? 'eje de giro: eje Y' : 'eje de giro: x = ' + fnum(ap);
    }
    svg.appendChild(lab);
    [b.a, b.b].forEach((x) => { const t = el('text', { x: sx(x), y: H - 5, 'text-anchor': 'middle', class: 'sol-tick' }); t.textContent = fnum(x); svg.appendChild(t); svg.appendChild(el('line', { x1: sx(x), x2: sx(x), y1: H - m, y2: H - m + 4, class: 'sol-ref' })); });
    return svg;
  }

  /* ---------- malla 3D ---------- */
  function buildMesh(F, b) {
    const NX = 48, NT = 36, k = axisPos(b), hor = horizontal(b);
    // punto del sólido en coordenadas de visualización (Z hacia arriba = y matemática)
    const pt = (x, r, th) => (hor ? [x, r * Math.sin(th), k + r * Math.cos(th)] : [k + r * Math.cos(th), r * Math.sin(th), x]);
    const rows = [];
    for (let i = 0; i <= NX; i++) {
      const t = b.a + (b.b - b.a) * i / NX, v = F.f(t);
      rows.push({ t, v });
    }
    const quads = [];
    const th = (j) => 2 * Math.PI * j / NT;
    const surf = (i, j) => {
      const { t, v } = rows[i];
      if (!Number.isFinite(v)) return null;
      return hor ? pt(t, v - k, th(j)) : pt(v, t - k, th(j));
    };
    for (let i = 0; i < NX; i++) for (let j = 0; j < NT; j++) {
      const q = [surf(i, j), surf(i + 1, j), surf(i + 1, j + 1), surf(i, j + 1)];
      if (q.every(Boolean)) quads.push({ p: q, t: i / NX, cap: 0 });
    }
    const ring = (fnr, fnp, cap) => { // anillo plano entre dos radios
      for (let j = 0; j < NT; j++) quads.push({ p: [fnp(0, j), fnp(1, j), fnp(1, j + 1), fnp(0, j + 1)], t: cap, cap: 1 });
    };
    if (hor) {
      [rows[0], rows[NX]].forEach((e) => { if (Number.isFinite(e.v)) ring(null, (u, j) => pt(e.t, u * (e.v - k), th(j)), e === rows[0] ? 0 : 1); });
    } else {
      const f0 = rows[0].v, f1 = rows[NX].v; // v = f(x) en rows[i].v ; t = x
      const lo = Math.min(b.a - k, b.b - k), hi = Math.max(b.a - k, b.b - k);
      const rmin = lo > 0 ? lo : (hi < 0 ? -hi : 0), rmax = Math.max(Math.abs(lo), Math.abs(hi));
      const fb = (u, j) => pt(0, rmin + u * (rmax - rmin), th(j));
      ring(null, fb, 0.5);
      [[b.a, f0, 0], [b.b, f1, 1]].forEach(([x, fv, tt]) => { // paredes cilíndricas en x=a y x=b
        if (!Number.isFinite(fv)) return;
        for (let j = 0; j < NT; j++) quads.push({ p: [pt(0, x - k, th(j)), pt(fv, x - k, th(j)), pt(fv, x - k, th(j + 1)), pt(0, x - k, th(j + 1))], t: tt, cap: 1 });
      });
    }
    return quads;
  }

  function buildSolid(b, bd, ro) {
    const box = document.createElement('div');
    box.className = 'sol';
    box.tabIndex = 0;
    const prof = document.createElement('div'); prof.className = 'sol-profile';
    const wrap = document.createElement('div'); wrap.className = 'sol-wrap';
    const cv = document.createElement('canvas'); cv.setAttribute('role', 'img');
    wrap.append(cv);
    const vol = document.createElement('div'); vol.className = 'sol-vol';
    const err = document.createElement('div'); err.className = 'g-err';
    box.append(prof, wrap, vol, err);
    let F = null;

    function refresh() { // recompila, perfil y volumen
      err.textContent = '';
      F = null;
      prof.textContent = ''; vol.textContent = '';
      try { F = compile(b); } catch (e) { err.textContent = 'Aviso: ' + (e.message || 'no puedo dibujar esa función'); }
      if (F && !(b.a < b.b)) { err.textContent = 'Aviso: el límite inferior a debe ser menor que b.'; F = null; }
      if (F && !Number.isFinite(F.f((b.a + b.b) / 2)) && !Number.isFinite(F.f(b.a)) && !Number.isFinite(F.f(b.b))) { err.textContent = 'Aviso: la función no tiene valores reales en ese intervalo.'; F = null; }
      if (!F) { draw(); return; }
      prof.appendChild(profileSvg(F, b));
      const v = volume(F, b);
      const line = document.createElement('div'); line.className = 'sol-vline';
      const lx = integralLatex(F, b);
      const ml = R('ui/state').mlReady;
      if (ml) {
        const mf = document.createElement('math-field'); mf.readOnly = true; mf.className = 'sol-int'; mf.setAttribute('aria-label', 'Integral del volumen');
        mf.dataset.aux = '1';
        line.appendChild(mf); mf.value = lx;
      } else { const t = document.createElement('span'); t.className = 'sol-int'; t.textContent = lx.replace(/\\left|\\right|\\cdot/g, '').replace(/\\(pi)/g, 'π').replace(/[{}\\]/g, ''); line.appendChild(t); }
      const num = document.createElement('div'); num.className = 'sol-num';
      const kp = axisPos(b);
      const method = horizontal(b) ? 'discos' : b.a < kp && kp < b.b ? 'capas cilíndricas; el eje corta la región, h(r) es la mayor altura a distancia r' : 'capas cilíndricas';
      if (!Number.isFinite(v)) { num.textContent = 'No se puede calcular el volumen (la función no es finita en el intervalo).'; }
      else {
        let exact = '';
        try {
          exact = exactVolume(F, b);
        } catch (e) { /* solo numérico */ }
        const vn = document.createElement('span'); vn.className = 'sol-vn'; vn.dataset.v = String(v);
        vn.textContent = fmt(v);
        num.append('Volumen (' + method + '): V ≈ ', vn, ' u³');
        if (exact) { const sp = document.createElement('span'); sp.className = 'sol-exact'; sp.textContent = ' (exacto: ' + exact.replace(/\\left|\\right|\\cdot/g, '').replace(/\\pi/g, 'π').replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2').replace(/[{}\\]/g, '') + ')'; num.appendChild(sp); }
      }
      vol.append(line, num);
      draw();
    }

    function draw(expScale) {
      // antes de entrar en la página aún no está conectado: solo se olvida si ya estuvo (se borró el bloque)
      if (!box.isConnected && !ro) { if (box.dataset.wasConnected) R('blocks/graph3d').redrawers.delete(draw); return; }
      box.dataset.wasConnected = '1';
      const W = Math.max(280, Math.round(cv.clientWidth || 720)), H = 320;
      const dpr = (window.devicePixelRatio || 1) * (typeof expScale === 'number' ? expScale : 1);
      cv.width = W * dpr; cv.height = H * dpr;
      const c = cv.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, W, H);
      const ax = AXES.find((a) => a[0] === b.axis);
      cv.setAttribute('aria-label', 'Sólido de revolución de ' + b.fn + ' entre ' + b.a + ' y ' + b.b + ' girando alrededor de ' + (ax ? ax[1] : 'un eje'));
      if (!F) return;
      const mesh = buildMesh(F, b);
      if (!mesh.length) { err.textContent = 'Aviso: no hay valores reales para dibujar el sólido.'; return; }
      let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
      mesh.forEach((q) => q.p.forEach((p) => p.forEach((v, i) => { if (v < mn[i]) mn[i] = v; if (v > mx[i]) mx[i] = v; })));
      const ctr = mn.map((v, i) => (v + mx[i]) / 2);
      const half = Math.max(...mn.map((v, i) => (mx[i] - v) / 2), 1e-9);
      const N = (p) => [(p[0] - ctr[0]) / half, (p[1] - ctr[1]) / half, (p[2] - ctr[2]) / half];
      const P = c3.projector({ az: b.az, el: b.el, zoom: b.zoom, W, H, k: 0.34 });
      const pr = (p) => { const n = N(p); return P(n[0], n[1], n[2]); };
      const c1 = c3.hexRGB(cssVar('data-1')), c2 = c3.hexRGB(cssVar('data-2')), c3c = c3.hexRGB(cssVar('data-3')), ink = c3.hexRGB(cssVar('ink')), axc = c3.hexRGB(cssVar('data-5'));
      const quads = mesh.map((m) => ({ q: m.p.map(pr), color: m.cap ? c3c : c3.mixRGB(c1, c2, m.t) }));
      const ref = P.scale * P.scale * 4 / (48 * 36);
      // eje de giro (detrás, discontinuo)
      const k = axisPos(b), ext = 1.25;
      const A = horizontal(b) ? [[mn[0] - (mx[0] - mn[0]) * 0.1, 0, k], [mx[0] + (mx[0] - mn[0]) * 0.1, 0, k]] : [[k, 0, mn[2] - (mx[2] - mn[2]) * 0.1], [k, 0, mx[2] + (mx[2] - mn[2]) * 0.1]];
      const a0 = pr(A[0]), a1 = pr(A[1]);
      c.save(); c.strokeStyle = 'rgb(' + axc.join(',') + ')'; c.lineWidth = 1.6; c.setLineDash([6, 4]);
      c.beginPath(); c.moveTo(a0[0], a0[1]); c.lineTo(a1[0], a1[1]); c.stroke(); c.restore();
      c3.paintQuads(c, quads, { ink, ref });
      c.save(); c.strokeStyle = 'rgb(' + axc.join(',') + ')'; c.lineWidth = 1.6; c.setLineDash([6, 4]);
      c.beginPath(); c.moveTo(a0[0], a0[1]); c.lineTo(a1[0], a1[1]); c.stroke(); c.restore();
      c.fillStyle = 'rgb(' + axc.join(',') + ')';
      c.font = '600 12px ' + (getComputedStyle(document.body).getPropertyValue('--font-sans') || 'sans-serif');
      c.fillText(b.axis === 'x' ? 'eje X' : b.axis === 'y' ? 'eje Y' : b.axis === 'y=k' ? 'y = ' + fnum(k) : 'x = ' + fnum(k), a1[0] + 6, a1[1] - 4);
    }

    if (!ro) {
      const save = () => S.save();
      const ctrl = document.createElement('div'); ctrl.className = 'g-ctrl sol-ctrl';
      const lab = (t, child) => { const l = document.createElement('label'); l.append(t + ' ', child); return l; };
      const keys = (e) => { if (e.key === 'Enter' || e.key === 'Escape') { e.stopPropagation(); if (e.key === 'Enter') e.preventDefault(); e.target.blur && e.target.blur(); } };
      const sync = (fn) => { b.fn = fn; save(); refresh(); };
      let fld;
      if (R('ui/state').mlReady) {
        fld = document.createElement('math-field'); fld.dataset.aux = '1'; fld.className = 'sol-fn';
        R('blocks/editor').configureField(fld);
        fld.setAttribute('aria-label', 'Función f(x)');
        fld.value = b.fn;
        fld.addEventListener('input', () => sync(fld.getValue('latex')));
      } else {
        fld = document.createElement('input'); fld.className = 'g-fns sol-fn'; fld.value = b.fn; fld.setAttribute('aria-label', 'Función f(x)');
        fld.addEventListener('input', () => sync(fld.value));
      }
      fld.addEventListener('keydown', keys);
      const num = (key, label) => {
        const i = document.createElement('input'); i.type = 'number'; i.step = 'any'; i.value = b[key]; i.setAttribute('aria-label', label);
        i.addEventListener('input', () => { const v = parseFloat(i.value); if (Number.isFinite(v)) { b[key] = v; save(); refresh(); } else { err.textContent = 'Aviso: escribe un número en «' + label + '».'; } });
        i.addEventListener('keydown', keys);
        return i;
      };
      const sel = document.createElement('select'); sel.setAttribute('aria-label', 'Eje de giro');
      AXES.forEach(([v, t]) => { const o = document.createElement('option'); o.value = v; o.textContent = t; sel.appendChild(o); });
      sel.value = b.axis;
      const ki = num('k', 'k');
      const kl = lab('k =', ki);
      const showK = () => { kl.hidden = !/=k$/.test(b.axis); kl.style.display = kl.hidden ? 'none' : ''; };
      sel.addEventListener('change', () => { b.axis = sel.value; showK(); save(); refresh(); });
      sel.addEventListener('keydown', keys);
      showK();
      const fl = lab('f(x) =', fld); fl.classList.add('sol-fl');
      ctrl.append(fl, lab('a', num('a', 'a')), lab('b', num('b', 'b')), lab('Girar alrededor de', sel), kl);
      box.appendChild(ctrl);
      wrap.appendChild(c3.viewPad(cv, b, draw, save, { az: -0.8, el: 0.5, zoom: 1 }));
      c3.attachRotate(cv, b, draw, save, () => R('blocks/editor').setActive(b.id));
      new ResizeObserver(() => draw()).observe(cv);
      R('blocks/graph3d').redrawers.add(draw);
    }
    bd.appendChild(box);
    refresh();
    cv._draw = draw;
    requestAnimationFrame(() => draw());
    if (ro) setTimeout(() => draw(), 50);
  }

  registry.register({ type: 'solid', build: buildSolid, exportable: true });
  R('model/schema').register('solid', (x, base) => {
    const num = (v, d) => (Number.isFinite(+v) && v !== '' && v !== null ? +v : d);
    let a = num(x.a, 0), bb = num(x.b, 4);
    if (!(a < bb)) { a = 0; bb = 4; }
    return Object.assign(base, {
      type: 'solid', fn: typeof x.fn === 'string' && x.fn.trim() ? x.fn : 'f(x)=\\sqrt{x}', a, b: bb,
      axis: ['x', 'y', 'y=k', 'x=k'].includes(x.axis) ? x.axis : 'x', k: num(x.k, 0),
      az: num(x.az, -0.8), el: num(x.el, 0.5), zoom: num(x.zoom, 1),
    });
  });
  return { buildSolid, volume, simpson };
});
