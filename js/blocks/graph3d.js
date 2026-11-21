/* Bloque superficie 3D (pizarra.html 5921-6066). */
MatIA.define('blocks/graph3d', ['core/dom', 'model/board', 'blocks/svg-utils', 'blocks/registry'], (dom, S, svgu, registry) => {
  'use strict';
  const R = (n) => MatIA.require(n);
  const { $, body } = dom;
  const { markPath, markLegend } = svgu;
  const cssVar = (...a) => R('ui/view').cssVar(...a);

  /* ---------------- Gráfica 3D (superficies z = f(x, y)) ---------------- */
  const redrawers = new Set();
  function hexRGB(c) {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec((c || '').trim());
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [120, 120, 120];
  }
  const mixRGB = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  function compile3d(src) {
    let rhs = src;
    const m = /^\s*(z|f\s*(\\left)?\(\s*x\s*,\s*y\s*(\\right)?\))\s*=/.exec(src);
    if (m) rhs = src.slice(m[0].length);
    const ast = R('engine/ops').parseExpr(rhs, { var: 'x' });
    const vars = [...(function walk(a, set) { if (a.t === 'var') set.add(a.n); if (a.a) walk(a.a, set); if (a.b) walk(a.b, set); return set; })(ast, new Set())];
    const bad = vars.filter((v) => v !== 'x' && v !== 'y');
    if (bad.length) throw new R('engine/core').MErr('Solo puede depender de x e y (sobra ' + bad.join(', ') + ').');
    return { f: (x, y) => { try { return R('engine/ops').evalNum(ast, { x, y }); } catch (e) { return NaN; } }, latex: R('engine/ops').L(ast) };
  }
  function buildGraph3d(b, bd, ro) {
    const box = document.createElement('div');
    box.className = 'g3d';
    box.tabIndex = 0;
    const cv3 = document.createElement('canvas');
    cv3.setAttribute('role', 'img');
    const cap = document.createElement('div');
    cap.className = 'g-cap';
    const err = document.createElement('div');
    err.className = 'g-err';
    box.append(cv3, cap, err);
    let F3 = null;
    function recompile() {
      err.textContent = '';
      try { F3 = compile3d(b.fn); } catch (e) { F3 = null; err.textContent = 'Aviso: ' + (e.message || 'no puedo dibujar esa función'); }
    }
    function draw(expScale) {
      if (!box.isConnected && !ro) { redrawers.delete(draw); return; }
      const W = Math.max(320, Math.round(cv3.clientWidth || 720)), H = 420, dpr = (window.devicePixelRatio || 1) * (typeof expScale === 'number' ? expScale : 1);
      cv3.width = W * dpr; cv3.height = H * dpr;
      const c = cv3.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, W, H);
      cv3.setAttribute('aria-label', 'Superficie z = ' + b.fn.replace(/^\s*z\s*=/, '') + ' para x entre ' + b.xmin + ' y ' + b.xmax + ', y entre ' + b.ymin + ' y ' + b.ymax);
      cap.textContent = 'z = ' + (F3 ? F3.latex : b.fn).replace(/\\left|\\right|\\cdot/g, '').replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)').replace(/\\sqrt\{([^{}]+)\}/g, '√($1)').replace(/\\(sin|cos|tan|ln|log|exp)/g, '$1').replace(/\\pi/g, 'π').replace(/[{}\\]/g, '').replace(/\^2/g, '²') + '   ·   x ∈ [' + b.xmin + ', ' + b.xmax + '],  y ∈ [' + b.ymin + ', ' + b.ymax + ']';
      if (!F3) return;
      const N = 38;
      const Z = [];
      const zs = [];
      for (let i = 0; i <= N; i++) { Z.push([]); for (let j = 0; j <= N; j++) { const x = b.xmin + (b.xmax - b.xmin) * i / N, y = b.ymin + (b.ymax - b.ymin) * j / N; const z = F3.f(x, y); Z[i].push(z); if (Number.isFinite(z)) zs.push(z); } }
      if (!zs.length) { err.textContent = 'Aviso: la función no tiene valores reales en ese rango.'; return; }
      zs.sort((p, q) => p - q);
      let z0 = zs[Math.floor(zs.length * 0.01)], z1 = zs[Math.ceil(zs.length * 0.99) - 1];
      if (z1 - z0 < 1e-9) { z0 -= 1; z1 += 1; }
      const zc = (z0 + z1) / 2, zr = (z1 - z0) / 2;
      const ca = Math.cos(b.az), sa = Math.sin(b.az), ce = Math.cos(b.el), se = Math.sin(b.el);
      const sc = Math.min(W, H) * 0.25 * b.zoom, cx = W / 2, cy = H / 2 + 6;
      const P = (X, Y, Zv) => { const x1 = X * ca - Y * sa, y1 = X * sa + Y * ca; return [cx + x1 * sc, cy - (y1 * se + Zv * ce) * sc, y1 * ce - Zv * se]; };
      const nz = (z) => Math.max(-1.1, Math.min(1.1, (z - zc) / zr * 0.85));
      const pt = (i, j) => P(-1 + 2 * i / N, -1 + 2 * j / N, nz(Z[i][j]));
      const cLow = hexRGB(cssVar('data-2')), cMid = hexRGB(cssVar('data-1')), cHigh = hexRGB(cssVar('data-3')), ink = hexRGB(cssVar('ink'));
      // caja y ejes
      c.lineWidth = 1;
      c.strokeStyle = 'rgba(' + ink.join(',') + ',0.25)';
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      c.beginPath(); corners.forEach(([X, Y], k) => { const q = P(X, Y, -1); if (k) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.closePath(); c.stroke();
      corners.forEach(([X, Y]) => { const a = P(X, Y, -1), q = P(X, Y, 1); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(q[0], q[1]); c.stroke(); });
      const quads = [];
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const zz = [Z[i][j], Z[i + 1][j], Z[i + 1][j + 1], Z[i][j + 1]];
        if (!zz.every(Number.isFinite)) continue;
        const q = [pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)];
        const d = (q[0][2] + q[1][2] + q[2][2] + q[3][2]) / 4;
        const zm = (zz[0] + zz[1] + zz[2] + zz[3]) / 4;
        // sombreado con la normal en pantalla
        const ux = q[1][0] - q[0][0], uy = q[1][1] - q[0][1], vx = q[3][0] - q[0][0], vy = q[3][1] - q[0][1];
        const shade = Math.min(1, Math.abs(ux * vy - uy * vx) / (sc * sc * 4 / (N * N)) * 0.9);
        quads.push({ q, d, t: Math.max(0, Math.min(1, (zm - z0) / (z1 - z0))), shade });
      }
      quads.sort((p, q) => q.d - p.d);
      for (const { q, t, shade } of quads) {
        const col = t < 0.5 ? mixRGB(cLow, cMid, t * 2) : mixRGB(cMid, cHigh, (t - 0.5) * 2);
        const k = 0.62 + 0.38 * shade;
        c.fillStyle = 'rgb(' + col.map((v) => Math.round(v * k)).join(',') + ')';
        c.strokeStyle = 'rgba(' + ink.join(',') + ',0.18)';
        c.lineWidth = 0.6;
        c.beginPath(); c.moveTo(q[0][0], q[0][1]); for (let n = 1; n < 4; n++) c.lineTo(q[n][0], q[n][1]); c.closePath(); c.fill(); c.stroke();
      }
      // puntos notables (máximos, mínimos, sillas)
      const mk3 = (b.marks || []).filter((m) => m.x >= b.xmin && m.x <= b.xmax && m.y >= b.ymin && m.y <= b.ymax);
      const colOf = (k) => hexRGB(cssVar(k === 'min' || k === 'absmin' ? 'data-2' : k === 'max' || k === 'absmax' ? 'data-5' : k === 'saddle' ? 'data-4' : k === 'infl' ? 'data-3' : 'ink-muted'));
      const surf = hexRGB(cssVar('surface-raised'));
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
      const ctrl = document.createElement('div');
      ctrl.className = 'g-ctrl graph';
      ctrl.style.width = '100%';
      const inner = document.createElement('div');
      inner.className = 'g-ctrl';
      const fi = document.createElement('input');
      fi.className = 'g-fns'; fi.value = b.fn; fi.setAttribute('aria-label', 'Función z = f(x, y)');
      fi.title = 'Escribe z = f(x, y) en LaTeX, por ejemplo z=\\sin(x)\\cos(y) o z=x^2-y^2';
      fi.addEventListener('change', () => { b.fn = fi.value.trim() || 'z=0'; S.save(); recompile(); draw(); });
      const fl = document.createElement('label'); fl.textContent = 'z = f(x, y) '; fl.style.display = 'flex'; fl.style.flex = '1 1 260px'; fl.style.gap = '6px'; fl.style.alignItems = 'center'; fl.appendChild(fi);
      const num = (label, key) => { const l = document.createElement('label'); l.textContent = label + ' '; const i = document.createElement('input'); i.type = 'number'; i.step = 'any'; i.value = b[key]; i.addEventListener('change', () => { const v = parseFloat(i.value); if (Number.isFinite(v)) { b[key] = v; if (b.xmax - b.xmin < 1e-6) b.xmax = b.xmin + 1; if (b.ymax - b.ymin < 1e-6) b.ymax = b.ymin + 1; S.save(); draw(); } }); l.appendChild(i); return l; };
      const reset = document.createElement('button'); reset.type = 'button'; reset.className = 'mi-btn mi-btn--sm'; reset.textContent = 'Vista inicial';
      reset.addEventListener('click', () => { b.az = -0.8; b.el = 0.55; b.zoom = 1; S.save(); draw(); });
      inner.append(fl, num('x desde', 'xmin'), num('hasta', 'xmax'), num('y desde', 'ymin'), num('hasta', 'ymax'), reset);
      box.appendChild(inner);
      let drag = null;
      cv3.addEventListener('pointerdown', (e) => { if (body.dataset.mode === 'draw' || e.pointerType === 'pen') return; e.stopPropagation(); drag = { x: e.clientX, y: e.clientY, az: b.az, el: b.el }; cv3.setPointerCapture(e.pointerId); });
      cv3.addEventListener('pointermove', (e) => { if (!drag) return; b.az = drag.az + (e.clientX - drag.x) * 0.01; b.el = Math.max(-1.45, Math.min(1.45, drag.el + (e.clientY - drag.y) * 0.01)); requestAnimationFrame(draw); });
      cv3.addEventListener('pointerup', () => { if (drag) { drag = null; S.save(); } });
      cv3.addEventListener('wheel', (e) => { e.preventDefault(); b.zoom = Math.max(0.3, Math.min(4, b.zoom * (e.deltaY > 0 ? 0.9 : 1.1))); draw(); clearTimeout(cv3._t); cv3._t = setTimeout(() => S.save(), 400); }, { passive: false });
      new ResizeObserver(() => draw()).observe(cv3);
      redrawers.add(draw);
    }
    bd.appendChild(box);
    recompile();
    cv3._draw = draw;
    requestAnimationFrame(draw);
    if (ro) setTimeout(draw, 50);
  }
  registry.register({ type: 'graph3d', build: buildGraph3d, exportable: true });
  return { redrawers, hexRGB, mixRGB, compile3d, buildGraph3d };
});
