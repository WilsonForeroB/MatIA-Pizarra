/* Bloque superficie 3D (pizarra.html 5921-6066): una o varias superficies z = f(x, y) en el mismo dibujo.
   Pensado para estudiantes: lista de superficies con «+ Añadir superficie», ayuda visible,
   girar arrastrando o con botones/teclado, y «⌂» para volver a la vista inicial centrada. */
MatIA.define('blocks/graph3d', ['core/dom', 'model/board', 'blocks/svg-utils', 'blocks/registry', 'blocks/canvas3d', 'assets/pio'], (dom, S, svgu, registry, c3, pio) => {
  'use strict';
  const R = (n) => MatIA.require(n);
  const { body } = dom;
  const { markPath, markLegend } = svgu;
  const cssVar = (...a) => R('ui/view').cssVar(...a);
  const { hexRGB, mixRGB } = c3;

  const MAX = 4;                // superficies por dibujo
  const VIEW = { az: -0.8, el: 0.55, zoom: 1 };
  const redrawers = new Set();
  let hintSeen = false;         // tras el primer giro ya no se muestra «Arrastra para girar»

  /** Superficies del bloque (los .json antiguos solo tienen b.fn). */
  const fnsOf = (b) => (Array.isArray(b.fns) && b.fns.length ? b.fns : [typeof b.fn === 'string' ? b.fn : '']);
  function setFns(b, list) {
    b.fns = list;
    b.fn = list.find((s) => String(s).trim()) || '';   // b.fn sigue siendo la primera (compatibilidad)
  }

  function compile3d(src) {
    const ops = R('engine/ops');
    let s = String(src);
    // acepta texto plano como en 2D: sin(x)cos(y), x^(1/2), ln(x)…
    if (typeof ops.normalizeFn === 'function') { try { s = ops.normalizeFn(s); } catch (e) { /* se usa tal cual */ } }
    let rhs = s;
    const m = /^\s*(z|f\s*(\\left)?\(\s*x\s*,\s*y\s*(\\right)?\))\s*=/.exec(s);
    if (m) rhs = s.slice(m[0].length);
    const ast = ops.parseExpr(rhs, { var: 'x' });
    const vars = [...(function walk(a, set) { if (a.t === 'var') set.add(a.n); if (a.a) walk(a.a, set); if (a.b) walk(a.b, set); return set; })(ast, new Set())];
    const bad = vars.filter((v) => v !== 'x' && v !== 'y');
    if (bad.length) throw new (R('engine/core').MErr)('Solo puede depender de x e y (sobra ' + bad.join(', ') + ').');
    return { f: (x, y) => { try { return ops.evalNum(ast, { x, y }); } catch (e) { return NaN; } }, latex: ops.L(ast) };
  }

  /** LaTeX → texto legible para pies y leyendas. */
  const pretty = (latex) => String(latex).replace(/\\left|\\right|\\cdot/g, '').replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)')
    .replace(/\\sqrt\{([^{}]+)\}/g, '√($1)').replace(/\\(sin|cos|tan|ln|log|exp)/g, '$1').replace(/\\pi/g, 'π')
    .replace(/[{}\\]/g, '').replace(/\^2/g, '²').replace(/\^3/g, '³');
  const dataVar = (k) => 'data-' + ((k % 6) + 1);

  function buildGraph3d(b, bd, ro) {
    const box = document.createElement('div');
    box.className = 'g3d';
    const wrap = document.createElement('div');
    wrap.className = 'g3d-wrap';
    const cv3 = document.createElement('canvas');
    cv3.setAttribute('role', 'img');
    wrap.appendChild(cv3);
    const legend = document.createElement('div');
    legend.className = 'g-legend';
    const cap = document.createElement('div');
    cap.className = 'g-cap';
    const err = document.createElement('div');
    err.className = 'g-err';
    box.append(wrap, legend, cap, err);

    let comp = [];   // [{ F, k, src }]
    function recompile() {
      const msgs = [];
      comp = [];
      fnsOf(b).forEach((src, k) => {
        if (!String(src).trim()) return;
        try { comp.push({ F: compile3d(src), k, src }); }
        catch (e) { msgs.push((fnsOf(b).length > 1 ? 'Superficie ' + (k + 1) + ': ' : '') + (e.message || 'no puedo dibujar esa función')); }
      });
      err.textContent = msgs.length ? 'Aviso: ' + msgs.join(' · ') : '';
    }

    function draw(expScale) {
      // antes de entrar en la página aún no está conectado: solo se olvida si ya estuvo (se borró el bloque)
      if (!box.isConnected && !ro) { if (box.dataset.wasConnected) redrawers.delete(draw); return; }
      box.dataset.wasConnected = '1';
      const W = Math.max(280, Math.round(cv3.clientWidth || 720)), H = Math.max(240, Math.round(cv3.clientHeight || 420));
      const dpr = (window.devicePixelRatio || 1) * (typeof expScale === 'number' && expScale > 0 && expScale <= 8 ? expScale : 1);
      cv3.width = Math.round(W * dpr); cv3.height = Math.round(H * dpr);
      const c = cv3.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, W, H);
      const many = comp.length > 1;
      const names = comp.map(({ F }) => 'z = ' + pretty(F.latex));
      cv3.setAttribute('aria-label', (many ? 'Superficies ' : 'Superficie ') + (names.join('; ') || 'sin función') + ', para x entre ' + b.xmin + ' y ' + b.xmax + ', y entre ' + b.ymin + ' y ' + b.ymax);
      cap.textContent = (many ? '' : (names[0] || 'z = ?') + '   ·   ') + 'x ∈ [' + b.xmin + ', ' + b.xmax + '],  y ∈ [' + b.ymin + ', ' + b.ymax + ']';
      legend.textContent = '';
      if (many) comp.forEach(({ k }, i) => { const sp = document.createElement('span'); sp.style.setProperty('--sw', 'var(--' + dataVar(k) + ')'); sp.textContent = names[i]; legend.appendChild(sp); });
      if (!comp.length) return;
      const N = many ? (comp.length > 2 ? 24 : 30) : 38;
      const grids = comp.map(({ F }) => {
        const Z = [];
        for (let i = 0; i <= N; i++) { Z.push([]); for (let j = 0; j <= N; j++) Z[i].push(F.f(b.xmin + (b.xmax - b.xmin) * i / N, b.ymin + (b.ymax - b.ymin) * j / N)); }
        return Z;
      });
      const zs = grids.flat(2).filter(Number.isFinite).sort((p, q) => p - q);
      if (!zs.length) { err.textContent = 'Aviso: ' + (many ? 'las funciones no tienen' : 'la función no tiene') + ' valores reales en ese rango.'; return; }
      let z0 = zs[Math.floor(zs.length * 0.01)], z1 = zs[Math.ceil(zs.length * 0.99) - 1];
      if (z1 - z0 < 1e-9) { z0 -= 1; z1 += 1; }
      const zc = (z0 + z1) / 2, zr = (z1 - z0) / 2;
      const P = c3.projector({ az: b.az, el: b.el, zoom: b.zoom, W, H });
      const sc = P.scale;
      const nz = (z) => Math.max(-1.1, Math.min(1.1, (z - zc) / zr * 0.85));
      const cLow = hexRGB(cssVar('data-2')), cMid = hexRGB(cssVar('data-1')), cHigh = hexRGB(cssVar('data-3')), ink = hexRGB(cssVar('ink'));
      const surf = hexRGB(cssVar('surface-raised'));
      // caja y ejes
      c.lineWidth = 1;
      c.strokeStyle = 'rgba(' + ink.join(',') + ',0.25)';
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      c.beginPath(); corners.forEach(([X, Y], k) => { const q = P(X, Y, -1); if (k) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.closePath(); c.stroke();
      corners.forEach(([X, Y]) => { const a = P(X, Y, -1), q = P(X, Y, 1); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(q[0], q[1]); c.stroke(); });
      // todas las superficies se pintan juntas, de atrás hacia delante, para que se corten bien
      const quads = [];
      const ref = sc * sc * 4 / (N * N);
      grids.forEach((Z, s) => {
        const base = hexRGB(cssVar(dataVar(comp[s].k)));
        const pt = (i, j) => P(-1 + 2 * i / N, -1 + 2 * j / N, nz(Z[i][j]));
        for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
          const zz = [Z[i][j], Z[i + 1][j], Z[i + 1][j + 1], Z[i][j + 1]];
          if (!zz.every(Number.isFinite)) continue;
          const q = [pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)];
          const t = Math.max(0, Math.min(1, ((zz[0] + zz[1] + zz[2] + zz[3]) / 4 - z0) / (z1 - z0)));
          // una sola superficie: color por altura; varias: un color por superficie (más claro arriba)
          const color = many ? mixRGB(base, surf, 0.3 * t) : (t < 0.5 ? mixRGB(cLow, cMid, t * 2) : mixRGB(cMid, cHigh, (t - 0.5) * 2));
          quads.push({ q, color });
        }
      });
      c3.paintQuads(c, quads, { ink, ref, edge: many ? 0.14 : 0.18 });
      // puntos notables (máximos, mínimos, sillas)
      const mk3 = (b.marks || []).filter((m) => m.x >= b.xmin && m.x <= b.xmax && m.y >= b.ymin && m.y <= b.ymax);
      const colOf = (k) => hexRGB(cssVar(k === 'min' || k === 'absmin' ? 'data-2' : k === 'max' || k === 'absmax' ? 'data-5' : k === 'saddle' ? 'data-4' : k === 'infl' ? 'data-3' : 'ink-muted'));
      for (const m of mk3) {
        const X = -1 + 2 * (m.x - b.xmin) / (b.xmax - b.xmin), Y = -1 + 2 * (m.y - b.ymin) / (b.ymax - b.ymin);
        const q = P(X, Y, nz(m.z));
        const base = P(X, Y, -1);
        c.setLineDash([3, 3]); c.strokeStyle = 'rgba(' + ink.join(',') + ',0.5)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(base[0], base[1]); c.lineTo(q[0], q[1]); c.stroke(); c.setLineDash([]);
        const p2 = new Path2D(markPath(m.kind, q[0], q[1], 9));
        c.fillStyle = 'rgb(' + colOf(m.kind).join(',') + ')'; c.fill(p2);
        c.strokeStyle = 'rgb(' + surf.join(',') + ')'; c.lineWidth = 2; c.stroke(p2);
        c.font = '600 12px ' + (getComputedStyle(body).getPropertyValue('--font-sans') || 'sans-serif');
        c.lineWidth = 4; c.strokeStyle = 'rgb(' + surf.join(',') + ')'; c.strokeText(m.label, q[0] + 12, q[1] - 10);
        c.fillStyle = 'rgb(' + ink.join(',') + ')'; c.fillText(m.label, q[0] + 12, q[1] - 10);
      }
      const old3 = box.querySelector('.mk-legend'); if (old3) old3.remove();
      if (mk3.length) cap.after(markLegend(mk3));
      // rótulos de los ejes
      c.fillStyle = 'rgb(' + ink.join(',') + ')';
      c.font = '600 13px ' + (getComputedStyle(body).getPropertyValue('--font-sans') || 'sans-serif');
      const lx = P(1.18, -1, -1), ly = P(-1, 1.18, -1), lz = P(-1, -1, 1.15);
      c.fillText('x', lx[0], lx[1]); c.fillText('y', ly[0], ly[1]); c.fillText('z', lz[0], lz[1]);
      c.font = '400 11px ' + (getComputedStyle(body).getPropertyValue('--font-mono') || 'monospace');
      c.fillStyle = 'rgba(' + ink.join(',') + ',0.7)';
      const zt = P(-1, -1, 1), zb = P(-1, -1, -1);
      c.fillText(String(Math.round(z1 * 100) / 100).replace('.', ','), zt[0] - 34, zt[1]);
      c.fillText(String(Math.round(z0 * 100) / 100).replace('.', ','), zb[0] - 34, zb[1]);
    }

    if (!ro) {
      const save = () => S.save();
      const change = () => { save(); recompile(); draw(); };
      /* --- lista de superficies (como las funciones de la gráfica 2D) --- */
      const ctrl = document.createElement('div');
      ctrl.className = 'g-ctrl';
      const fnList = document.createElement('div');
      fnList.className = 'g-fnlist';
      fnList.setAttribute('role', 'group');
      fnList.setAttribute('aria-label', 'Superficies del dibujo');
      const swatch = (k, single) => {
        const sw = document.createElement('span');
        sw.className = 'g3d-sw' + (single ? ' g3d-sw--height' : '');
        sw.setAttribute('aria-hidden', 'true');
        if (!single) sw.style.background = 'var(--' + dataVar(k) + ')';
        return sw;
      };
      function renderFns() {
        fnList.textContent = '';
        const list = fnsOf(b);
        const useMF = R('ui/state').mlReady && customElements.get('math-field');
        list.forEach((src, k) => {
          const row = document.createElement('div');
          row.className = 'g-fn';
          let f;
          const set = (v) => { const l = fnsOf(b).slice(); l[k] = v; setFns(b, l); change(); };
          if (useMF) {
            f = document.createElement('math-field');
            f.dataset.aux = '1';
            R('blocks/editor').configureField(f);
            f.value = src;
            f.addEventListener('input', () => set(f.getValue('latex')));
          } else {
            f = document.createElement('input');
            f.type = 'text'; f.dataset.aux = '1'; f.value = src;
            f.placeholder = 'z = sin(x)·cos(y)';
            f.addEventListener('input', () => set(f.value));
          }
          f.classList.add('g-fn-field');
          f.setAttribute('aria-label', 'Superficie ' + (k + 1) + ': z = f(x, y)');
          f.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); f.blur(); }
          });
          row.append(swatch(k, list.length === 1), f);
          if (list.length > 1) {
            const rm = document.createElement('button');
            rm.type = 'button'; rm.className = 'mi-btn mi-btn--sm g-fn-rm'; rm.textContent = '×';
            rm.title = 'Quitar la superficie ' + (k + 1); rm.setAttribute('aria-label', 'Quitar la superficie ' + (k + 1));
            rm.addEventListener('click', () => { const l = fnsOf(b).slice(); l.splice(k, 1); setFns(b, l); renderFns(); change(); });
            row.appendChild(rm);
          }
          fnList.appendChild(row);
        });
        const add = document.createElement('button');
        add.type = 'button'; add.className = 'mi-btn mi-btn--sm g-fn-add'; add.textContent = '+ Añadir superficie';
        add.disabled = list.length >= MAX;
        add.title = list.length >= MAX ? 'Como mucho ' + MAX + ' superficies en el mismo dibujo' : 'Dibujar otra superficie en el mismo dibujo';
        add.addEventListener('click', () => {
          if (fnsOf(b).length >= MAX) return;
          setFns(b, fnsOf(b).concat(['']));
          renderFns(); save();
          const fl = fnList.querySelectorAll('.g-fn-field'); const last = fl[fl.length - 1]; if (last) setTimeout(() => last.focus(), 0);
        });
        fnList.appendChild(add);
      }
      renderFns();
      /* --- ayuda --- */
      const help = document.createElement('div');
      help.className = 'g-help';
      help.append(pio.badge('idea', 'pio-sm', 'Pío da una idea'));
      const ht = document.createElement('p');
      ht.innerHTML = 'Escribe <b>z</b> en función de <b>x</b> e <b>y</b>, por ejemplo <code>z=x^2-y^2</code>. '
        + 'Puedes dibujar <b>hasta ' + MAX + ' superficies juntas</b> con «+ Añadir superficie». '
        + '<b>Arrastra</b> el dibujo para girarlo o usa los botones de la esquina; <b>⌂</b> lo vuelve a centrar.';
      help.appendChild(ht);
      /* --- rango --- */
      const range = document.createElement('div');
      range.className = 'g-range';
      const num = (label, key) => {
        const l = document.createElement('label'); l.textContent = label + ' ';
        const i = document.createElement('input'); i.type = 'number'; i.step = 'any'; i.value = b[key]; i.setAttribute('aria-label', label.replace('hasta', key[0] + ' hasta'));
        i.addEventListener('change', () => {
          const v = parseFloat(i.value);
          if (!Number.isFinite(v)) { i.value = b[key]; return; }
          b[key] = v;
          if (b.xmax - b.xmin < 1e-6) b.xmax = b.xmin + 1;
          if (b.ymax - b.ymin < 1e-6) b.ymax = b.ymin + 1;
          save(); draw();
        });
        i.addEventListener('keydown', (e) => e.stopPropagation());
        l.appendChild(i); return l;
      };
      range.append(num('x desde', 'xmin'), num('hasta', 'xmax'), num('y desde', 'ymin'), num('hasta', 'ymax'));
      ctrl.append(fnList, help, range);
      box.appendChild(ctrl);
      /* --- vista: arrastrar, botones y teclado --- */
      wrap.appendChild(c3.viewPad(cv3, b, draw, save, VIEW));
      let hintEl = null;
      if (!hintSeen) { hintEl = c3.hint('Arrastra el dibujo para girarlo'); wrap.appendChild(hintEl); }
      c3.attachRotate(cv3, b, draw, save, () => {
        hintSeen = true;
        if (hintEl) { hintEl.remove(); hintEl = null; }
        R('blocks/editor').setActive(b.id);   // así «Centro», «Duplicar»… se aplican a este dibujo
      });
      new ResizeObserver(() => draw()).observe(cv3);
      redrawers.add(draw);
    }
    bd.appendChild(box);
    recompile();
    cv3._draw = draw;
    requestAnimationFrame(() => draw());   // sin argumentos: la marca de tiempo del fotograma no es una escala
    if (ro) setTimeout(() => draw(), 50);
  }
  registry.register({ type: 'graph3d', build: buildGraph3d, exportable: true });
  return { redrawers, hexRGB, mixRGB, compile3d, buildGraph3d, fnsOf, MAX };
});
