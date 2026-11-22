/* Bloque geometría (pizarra.html 6319-6502). */
MatIA.define('blocks/geo', ['model/board', 'blocks/svg-utils', 'blocks/registry'], (S, svgu, registry) => {
  'use strict';
  const { SVGNS, niceStep, fmtNum } = svgu;

  function buildGeo(b, bd) {
    const box = document.createElement('div');
    box.className = 'geo';
    box.tabIndex = 0;
    const title = document.createElement('p');
    title.className = 'c-title';
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('role', 'img');
    const el = (tag, attrs, cls, parent) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (cls) e.setAttribute('class', cls); (parent || svg).appendChild(e); return e; };
    const txt = (x, y, t, cls, anchor, parent) => { const e = el('text', { x, y, 'text-anchor': anchor || 'middle' }, cls, parent); e.textContent = t; return e; };
    const legend = document.createElement('div');
    legend.className = 'g-legend';
    const leg = (t, color, dash) => { const s = document.createElement('span'); s.textContent = t; s.style.setProperty('--sw', color); if (dash) s.classList.add('dash'); legend.appendChild(s); };
    const R2D = 180 / Math.PI, D2R = Math.PI / 180;
    const fmtD = (v) => fmtNum(Math.round(v * 100) / 100) + '°';
    // sector de ángulo (en grados matemáticos, sentido antihorario) con centro (cx, cy)
    const arcPath = (cx, cy, r, t0, t1, closed) => {
      const p0 = [cx + r * Math.cos(t0 * D2R), cy - r * Math.sin(t0 * D2R)], p1 = [cx + r * Math.cos(t1 * D2R), cy - r * Math.sin(t1 * D2R)];
      const large = t1 - t0 > 180 ? 1 : 0;
      return (closed ? 'M' + cx + ' ' + cy + 'L' : 'M') + p0[0] + ' ' + p0[1] + 'A' + r + ' ' + r + ' 0 ' + large + ' 0 ' + p1[0] + ' ' + p1[1] + (closed ? 'Z' : '');
    };
    const W = 720;
    if (b.kind === 'unit' || b.kind === 'unitAll') {
      const H = b.kind === 'unitAll' ? 480 : 440, cx = 360, cy = H / 2, R = 170;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      const ax = b.kind === 'unit' ? 1 : 0;
      el('line', { x1: cx - R - (ax ? 40 : 6), y1: cy, x2: cx + R + (ax ? 40 : 6), y2: cy }, 'c-axis');
      el('line', { x1: cx, y1: cy - R - (ax ? 30 : 6), x2: cx, y2: cy + R + (ax ? 30 : 6) }, 'c-axis');
      el('circle', { cx, cy, r: R }, 'geo-circ');
      if (ax) { txt(cx + R + 44, cy + 5, 'x', 'geo-ax', 'start'); txt(cx + 6, cy - R - 32, 'y', 'geo-ax', 'start'); }
      if (b.kind === 'unit') txt(cx + R + 6, cy + 18, '1', 'c-tick', 'start'); if (b.kind === 'unit') { txt(cx - R - 6, cy + 18, '−1', 'c-tick', 'end'); txt(cx + 6, cy - R - 6, '1', 'c-tick', 'start'); txt(cx + 6, cy + R + 16, '−1', 'c-tick', 'start'); }
      [['I', 1, -1], ['II', -1, -1], ['III', -1, 1], ['IV', 1, 1]].forEach(([q, sx, sy]) => txt(cx + sx * (R + 30), cy + sy * (R - 10), q, 'geo-quad'));
      if (b.kind === 'unitAll') {
        const angs = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
        const RAD = { 0: '0', 30: 'π/6', 45: 'π/4', 60: 'π/3', 90: 'π/2', 120: '2π/3', 135: '3π/4', 150: '5π/6', 180: 'π', 210: '7π/6', 225: '5π/4', 240: '4π/3', 270: '3π/2', 300: '5π/3', 315: '7π/4', 330: '11π/6' };
        for (const g of angs) {
          const c = Math.cos(g * D2R), s = Math.sin(g * D2R);
          el('line', { x1: cx, y1: cy, x2: cx + R * c, y2: cy - R * s }, 'geo-ray');
          el('circle', { cx: cx + R * c, cy: cy - R * s, r: 4.5 }, 'geo-pt');
          const lx = cx + (R + 26) * c, ly = cy - (R + 22) * s;
          const anchor = Math.abs(c) < 0.2 ? 'middle' : c > 0 ? 'start' : 'end';
          txt(lx - (anchor === 'start' ? 8 : anchor === 'end' ? -8 : 0), ly - 2, g + '°', 'geo-lab', anchor);
          txt(lx - (anchor === 'start' ? 8 : anchor === 'end' ? -8 : 0), ly + 13, RAD[g], 'geo-lab2', anchor);
        }
        title.textContent = 'Circunferencia goniométrica: ángulos notables en grados y radianes';
        svg.setAttribute('aria-label', 'Circunferencia de radio 1 con los ángulos notables de 0° a 330° marcados en grados y radianes');
      } else {
        const d = ((b.deg % 360) + 360) % 360, c = Math.cos(d * D2R), s = Math.sin(d * D2R);
        const P = [cx + R * c, cy - R * s];
        if (d > 0.01) el('path', { d: arcPath(cx, cy, 38, 0, d, true) }, 'geo-sector');
        const mid = d / 2;
        txt(cx + 56 * Math.cos(mid * D2R), cy - 56 * Math.sin(mid * D2R) + 5, 'θ', 'geo-theta');
        // tangente sobre x = 1
        const tg = Math.abs(c) > 1e-9 ? s / c : null;
        if (tg != null && Math.abs(tg) < 2.3) {
          el('line', { x1: cx + R, y1: cy - R * 2.4, x2: cx + R, y2: cy + R * 2.4 }, 'geo-tanaxis');
          el('line', { x1: cx, y1: cy, x2: cx + R, y2: cy - R * tg }, 'geo-ray dash');
          el('line', { x1: cx + R, y1: cy, x2: cx + R, y2: cy - R * tg }, 'geo-tan');
          txt(cx + R + 8, cy - R * tg / 2 + 5, 'tg θ', 'geo-lab tan', 'start');
        }
        el('line', { x1: cx, y1: cy, x2: P[0], y2: P[1] }, 'geo-radius');
        if (Math.abs(c) > 1e-9) el('line', { x1: cx, y1: cy, x2: P[0], y2: cy }, 'geo-cos');
        if (Math.abs(s) > 1e-9) el('line', { x1: P[0], y1: cy, x2: P[0], y2: P[1] }, 'geo-sin');
        if (Math.abs(c) > 0.12) txt((cx + P[0]) / 2, cy + (s >= 0 ? 20 : -10), 'cos θ', 'geo-lab cos');
        if (Math.abs(s) > 0.12) txt(P[0] + (c >= 0 ? 8 : -8), (cy + P[1]) / 2 + 5, 'sen θ', 'geo-lab sin', c >= 0 ? 'start' : 'end');
        el('circle', { cx: P[0], cy: P[1], r: 6 }, 'geo-pt main');
        const r4 = (v) => fmtNum(Math.round(v * 1e4) / 1e4);
        txt(P[0] + (c >= 0 ? 12 : -12), P[1] + (s >= 0 ? -12 : 22), 'P(' + r4(c) + ', ' + r4(s) + ')', 'geo-lab', c >= 0 ? 'start' : 'end');
        title.textContent = 'Circunferencia goniométrica: θ = ' + (b.label || fmtD(d));
        leg('cos θ (abscisa de P)', 'var(--data-2)'); leg('sen θ (ordenada de P)', 'var(--data-5)'); if (tg != null && Math.abs(tg) < 2.3) leg('tg θ (sobre la recta x = 1)', 'var(--data-3)');
        svg.setAttribute('aria-label', 'Circunferencia de radio 1 con el ángulo ' + (b.label || fmtD(d)) + ': coseno ' + r4(c) + ', seno ' + r4(s));
      }
    } else if (b.kind === 'tri') {
      const H = 420, pad = 60;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      const A0 = [0, 0], B0 = [b.c, 0], C0 = [b.b * Math.cos(b.A * D2R), b.b * Math.sin(b.A * D2R)];
      const xs = [A0[0], B0[0], C0[0]], ys = [A0[1], B0[1], C0[1]];
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y1 = Math.max(...ys);
      const k = Math.min((W - 2 * pad) / (x1 - x0 || 1), (H - 2 * pad) / (y1 || 1));
      const ox = (W - (x1 - x0) * k) / 2 - x0 * k, oy = H - (H - y1 * k) / 2;
      const T = (p) => [ox + p[0] * k, oy - p[1] * k];
      const [A, B, C] = [A0, B0, C0].map(T);
      const G = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3];
      el('path', { d: 'M' + A.join(' ') + 'L' + B.join(' ') + 'L' + C.join(' ') + 'Z' }, 'geo-tri');
      const vert = [[A, 'A', b.A, B, C], [B, 'B', b.B, C, A], [C, 'C', b.C, A, B]];
      for (const [V, nm, ang, P1, P2] of vert) {
        const t1 = Math.atan2(-(P1[1] - V[1]), P1[0] - V[0]) * R2D, t2 = Math.atan2(-(P2[1] - V[1]), P2[0] - V[0]) * R2D;
        let a0 = t1, a1 = t2; let span = ((a1 - a0) % 360 + 360) % 360; if (span > 180) { [a0, a1] = [t2, t1]; span = 360 - span; }
        const r = 30;
        if (Math.abs(ang - 90) < 1e-6) {
          const u1 = [(P1[0] - V[0]), (P1[1] - V[1])], u2 = [(P2[0] - V[0]), (P2[1] - V[1])];
          const n1 = Math.hypot(...u1), n2 = Math.hypot(...u2), q = 16;
          const p1 = [V[0] + u1[0] / n1 * q, V[1] + u1[1] / n1 * q], p2 = [V[0] + u2[0] / n2 * q, V[1] + u2[1] / n2 * q];
          el('path', { d: 'M' + p1.join(' ') + 'L' + (p1[0] + p2[0] - V[0]) + ' ' + (p1[1] + p2[1] - V[1]) + 'L' + p2.join(' ') }, 'geo-right');
        } else el('path', { d: arcPath(V[0], V[1], r, a0, a0 + span, true) }, 'geo-sector');
        const mid = (a0 + span / 2) * D2R;
        const lr = span < 35 ? 58 : 48;
        txt(V[0] + lr * Math.cos(mid), V[1] - lr * Math.sin(mid) + 5, fmtD(ang), 'geo-angl');
        const dv = [V[0] - G[0], V[1] - G[1]], dn = Math.hypot(...dv) || 1;
        txt(V[0] + dv[0] / dn * 22, V[1] + dv[1] / dn * 22 + 6, nm, 'geo-vert');
      }
      const sides = [[B, C, 'a', b.a], [C, A, 'b', b.b], [A, B, 'c', b.c]];
      for (const [P, Q, nm, len] of sides) {
        const M = [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2], dv = [M[0] - G[0], M[1] - G[1]], dn = Math.hypot(...dv) || 1;
        txt(M[0] + dv[0] / dn * 20, M[1] + dv[1] / dn * 20 + 5, nm + ' = ' + fmtNum(Math.round(len * 1e4) / 1e4), 'geo-side');
      }
      title.textContent = (b.label ? b.label + ': ' : 'Triángulo: ') + 'a = ' + fmtNum(Math.round(b.a * 1e4) / 1e4) + ', b = ' + fmtNum(Math.round(b.b * 1e4) / 1e4) + ', c = ' + fmtNum(Math.round(b.c * 1e4) / 1e4);
      svg.setAttribute('aria-label', 'Triángulo de lados a ' + fmtNum(b.a) + ', b ' + fmtNum(b.b) + ', c ' + fmtNum(b.c) + ' y ángulos A ' + fmtD(b.A) + ', B ' + fmtD(b.B) + ', C ' + fmtD(b.C));
    } else if (b.kind === 'lines') {
      const H = 460, L = 0, T0 = 0;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      const pts = b.points || [], lns = b.lines || [];
      const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
      for (const l of lns) { if (Math.abs(l.b) > 1e-12) { ys.push(-l.c / l.b); xs.push(0); } if (Math.abs(l.a) > 1e-12) { xs.push(-l.c / l.a); ys.push(0); } }
      xs.push(0); ys.push(0);
      const clampA = (a) => a.filter((v) => Number.isFinite(v) && Math.abs(v) < 1e6);
      const X = clampA(xs), Y = clampA(ys);
      let cxm = (Math.min(...X) + Math.max(...X)) / 2, cym = (Math.min(...Y) + Math.max(...Y)) / 2;
      let span = Math.max(10, (Math.max(...X) - Math.min(...X)) * 1.35, (Math.max(...Y) - Math.min(...Y)) * 1.35 * W / H);
      const xmin = cxm - span / 2, xmax = cxm + span / 2, ySpan = span * H / W, ymin = cym - ySpan / 2, ymax = cym + ySpan / 2;
      const sx = (x) => L + (x - xmin) / (xmax - xmin) * W, sy = (y) => T0 + (ymax - y) / (ymax - ymin) * H;
      const st = niceStep(span);
      for (let x = Math.ceil(xmin / st) * st; x <= xmax; x += st) { el('line', { x1: sx(x), y1: 0, x2: sx(x), y2: H }, 'c-grid'); if (Math.abs(x) > 1e-9) txt(sx(x), Math.min(H - 4, Math.max(14, sy(0) + 15)), fmtNum(x), 'c-tick'); }
      for (let y = Math.ceil(ymin / st) * st; y <= ymax; y += st) { el('line', { x1: 0, y1: sy(y), x2: W, y2: sy(y) }, 'c-grid'); if (Math.abs(y) > 1e-9) txt(Math.min(W - 6, Math.max(26, sx(0) - 6)), sy(y) + 4, fmtNum(y), 'c-tick', 'end'); }
      if (ymin < 0 && ymax > 0) el('line', { x1: 0, y1: sy(0), x2: W, y2: sy(0) }, 'c-axis');
      if (xmin < 0 && xmax > 0) el('line', { x1: sx(0), y1: 0, x2: sx(0), y2: H }, 'c-axis');
      const COLS = ['var(--data-2)', 'var(--data-5)', 'var(--data-1)', 'var(--data-7)'];
      lns.forEach((l, i) => {
        let p, q;
        if (Math.abs(l.b) >= Math.abs(l.a)) { p = [xmin, -(l.a * xmin + l.c) / l.b]; q = [xmax, -(l.a * xmax + l.c) / l.b]; }
        else { p = [-(l.b * ymin + l.c) / l.a, ymin]; q = [-(l.b * ymax + l.c) / l.a, ymax]; }
        const col = COLS[i % COLS.length];
        const ln = el('line', { x1: sx(p[0]), y1: sy(p[1]), x2: sx(q[0]), y2: sy(q[1]) }, 'geo-line' + (l.dash ? ' dash' : ''));
        ln.style.stroke = col;
        // etiqueta cerca del borde, dentro del dibujo
        const tt = 0.86 - 0.1 * (i % 3);
        const lx = sx(p[0] + (q[0] - p[0]) * tt), ly = sy(p[1] + (q[1] - p[1]) * tt);
        const lb = txt(Math.max(14, Math.min(W - 14, lx + 8)), Math.max(18, Math.min(H - 8, ly - 8)), l.name, 'geo-lname', 'start');
        lb.style.fill = col;
        const eq = (() => { const f = (v) => fmtNum(Math.round(v * 1000) / 1000); let s = ''; if (l.a) s += (l.a === 1 ? '' : l.a === -1 ? '−' : f(l.a)) + 'x'; if (l.b) s += (s ? (l.b > 0 ? ' + ' : ' − ') : l.b < 0 ? '−' : '') + (Math.abs(l.b) === 1 ? '' : f(Math.abs(l.b))) + 'y'; if (l.c) s += (l.c > 0 ? ' + ' : ' − ') + f(Math.abs(l.c)); return s + ' = 0'; })();
        leg(l.name + ': ' + eq, col, l.dash);
      });
      for (const p of pts) {
        if (p.x < xmin || p.x > xmax || p.y < ymin || p.y > ymax) continue;
        el('circle', { cx: sx(p.x), cy: sy(p.y), r: p.kind === 'cut' ? 6.5 : 5.5 }, 'geo-pt' + (p.kind === 'cut' ? ' main' : p.kind === 'mid' ? ' mid' : ''));
        txt(sx(p.x) + 10, sy(p.y) - 10, p.name + '(' + fmtNum(Math.round(p.x * 1000) / 1000) + ', ' + fmtNum(Math.round(p.y * 1000) / 1000) + ')', 'geo-lab', 'start');
      }
      title.textContent = lns.length >= 2 && !lns[1].dash ? 'Posición relativa de ' + lns[0].name + ' y ' + lns[1].name : lns.length > 1 ? 'Recta ' + lns[0].name + ', su paralela y su perpendicular por el punto' : 'Recta y puntos';
      svg.setAttribute('aria-label', title.textContent + '. ' + lns.map((l) => l.name).join(', '));
    } else if (b.kind === 'transv') {
      const H = 420;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      const al = Math.min(170, Math.max(10, +b.deg || 60)), y1 = 140, y2 = 290, gap = y2 - y1;
      const dx = gap / Math.tan(al * D2R);
      const T1 = [W / 2 + dx / 2, y1], T2 = [W / 2 - dx / 2, y2];
      el('line', { x1: 40, y1, x2: W - 40, y2: y1 }, 'geo-par');
      el('line', { x1: 40, y1: y2, x2: W - 40, y2 }, 'geo-par');
      txt(W - 36, y1 - 8, 'r', 'geo-lname', 'end'); txt(W - 36, y2 - 8, 's', 'geo-lname', 'end');
      // marcas de paralelas
      [[W - 120, y1], [W - 120, y2]].forEach(([x, y]) => el('path', { d: 'M' + (x - 6) + ' ' + (y - 7) + 'L' + (x + 2) + ' ' + y + 'L' + (x - 6) + ' ' + (y + 7) }, 'geo-parmark'));
      const ext = 130, ux = Math.cos(al * D2R), uy = Math.sin(al * D2R);
      el('line', { x1: T1[0] + ux * ext, y1: T1[1] - uy * ext, x2: T2[0] - ux * ext, y2: T2[1] + uy * ext }, 'geo-trans');
      txt(T1[0] + ux * ext + 8, T1[1] - uy * ext + 4, 't', 'geo-lname', 'start');
      const be = 180 - al;
      const pos = [[0, al], [al, 180], [180, 180 + al], [180 + al, 360]];
      [T1, T2].forEach((V, j) => {
        pos.forEach(([a0, a1], i) => {
          const n = j * 4 + i + 1, isA = i % 2 === 0;
          const r = isA ? 34 : 26;
          el('path', { d: arcPath(V[0], V[1], r, a0, a1, true) }, 'geo-ang ' + (isA ? 'al' : 'be'));
          const mid = (a0 + a1) / 2 * D2R;
          const lr = (a1 - a0 < 40 ? 78 : 62);
          txt(V[0] + lr * Math.cos(mid), V[1] - lr * Math.sin(mid) + 5, n + ': ' + (isA ? fmtD(al) : fmtD(be)), 'geo-angl ' + (isA ? 'al' : 'be'));
        });
      });
      title.textContent = 'Paralelas r ∥ s cortadas por la secante t: α = ' + fmtD(al) + ', 180° − α = ' + fmtD(be);
      leg('Ángulos α = ' + fmtD(al) + ' (1, 3, 5, 7)', 'var(--data-2)'); leg('Ángulos 180° − α = ' + fmtD(be) + ' (2, 4, 6, 8)', 'var(--data-5)');
      svg.setAttribute('aria-label', title.textContent + '. Los ángulos 1, 3, 5 y 7 miden ' + fmtD(al) + ' y los 2, 4, 6 y 8 miden ' + fmtD(be));
    }
    box.append(title, svg);
    if (legend.childNodes.length) box.appendChild(legend);
    bd.appendChild(box);
  }
  /* Árbol de probabilidad */
  registry.register({ type: 'geo', build: buildGeo, exportable: true });
  return { buildGeo };
});
