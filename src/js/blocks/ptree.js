/* Bloque árbol de probabilidad (pizarra.html 6503-6537). */
MatIA.define('blocks/ptree', ['blocks/svg-utils', 'blocks/registry'], (svgu, registry) => {
  'use strict';
  const { SVGNS } = svgu;

  function buildPTree(b, bd) {
    const box = document.createElement('div');
    box.className = 'ptree';
    box.tabIndex = 0;
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('role', 'img');
    const el = (tag, attrs, cls) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (cls) e.setAttribute('class', cls); svg.appendChild(e); return e; };
    const txt = (x, y, t, cls, anchor) => { const e = el('text', { x, y, 'text-anchor': anchor || 'middle' }, cls); e.textContent = t; return e; };
    const cs = b.causes, n = cs.length;
    const W = 720, rowH = 58, H = Math.max(220, n * 2 * rowH + 30);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    const rx = 40, ry = H / 2, cx = 250, lx = 470;
    const bar = (t) => t + '̅';
    cs.forEach((c, i) => {
      const cy = 15 + (i * 2 + 1) * rowH;
      el('path', { d: 'M' + rx + ' ' + ry + 'L' + cx + ' ' + cy }, 'pt-edge');
      txt((rx + cx) / 2 - 6, (ry + cy) / 2 - 8, c.p, 'pt-p', 'middle');
      [[cy - rowH * 0.5, b.ev, c.l, c.prod, true], [cy + rowH * 0.5, bar(b.ev), c.nl, c.nprod, false]].forEach(([y, nm, pr, prod, isEv]) => {
        el('path', { d: 'M' + cx + ' ' + cy + 'L' + lx + ' ' + y }, 'pt-edge');
        txt((cx + lx) / 2, (cy + y) / 2 - 7, pr, 'pt-p');
        el('circle', { cx: lx, cy: y, r: 17 }, 'pt-node' + (isEv ? ' ev' : ''));
        txt(lx, y, nm, 'pt-txt');
        txt(lx + 28, y + 5, 'P(' + c.name + ' ∩ ' + nm + ') = ' + prod, 'pt-leaf' + (isEv ? ' ev' : ''), 'start');
      });
      el('circle', { cx, cy, r: 19 }, 'pt-node');
      txt(cx, cy, c.name, 'pt-txt');
    });
    el('circle', { cx: rx, cy: ry, r: 8 }, 'pt-node');
    svg.setAttribute('aria-label', 'Árbol de probabilidad: ' + cs.map((c) => c.name + ' con probabilidad ' + c.p + ' y P(' + b.ev + ' | ' + c.name + ') = ' + c.l).join('; '));
    const leg = document.createElement('div'); leg.className = 'mk-legend';
    leg.textContent = 'Cada rama lleva su probabilidad; al final de cada camino, el producto de las ramas. ' + bar(b.ev) + ' es el suceso contrario de ' + b.ev + '.';
    box.append(svg, leg);
    bd.appendChild(box);
  }
  /* Asistente de Bayes */
  registry.register({ type: 'ptree', build: buildPTree, exportable: true });
  return { buildPTree };
});
