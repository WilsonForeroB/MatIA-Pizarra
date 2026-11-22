/* Bloque grafo / red neuronal (pizarra.html 6722-6911). */
MatIA.define('blocks/net', ['core/dom', 'model/board', 'model/schema', 'ui/toast', 'blocks/svg-utils', 'blocks/registry'], (dom, S, schema, toast, svgu, registry) => {
  'use strict';
  const R = (n) => MatIA.require(n);
  const { $, $$, body } = dom;
  const { SVGNS } = svgu;
  const insertSpecs = (...a) => R('ui/ops-menu').insertSpecs(...a);
  const openNN = (...a) => R('ui/nn-dialog').openNN(...a);

  /* ---------------- Grafos ---------------- */
  const SUB = '₀₁₂₃₄₅₆₇₈₉', SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const sub = (n) => String(n).split('').map((d) => SUB[+d] || d).join('');
  const sup = (n) => String(n).split('').map((d) => SUP[+d] || d).join('');
  function nextLabel(b) {
    const used = new Set(b.nodes.map((n) => n.label));
    for (let i = 0; i < 400; i++) { const l = i < 26 ? String.fromCharCode(65 + i) : String.fromCharCode(65 + (i % 26)) + Math.floor(i / 26); if (!used.has(l)) return l; }
    return '?';
  }
  function nnBuild(sizes, bias, showW) {
    const W = 720, L = sizes.length;
    const maxN = Math.max(...sizes) + (bias ? 1 : 0);
    const H = Math.max(300, maxN * 62 + 90);
    const nodes = [], edges = [], caps = [];
    const layers = [];
    sizes.forEach((n, l) => {
      const x = L === 1 ? W / 2 : 70 + l * (W - 140) / (L - 1);
      const isOut = l === L - 1, isIn = l === 0;
      const total = n + (bias && !isOut ? 1 : 0);
      const y0 = (H - 50) / 2 - (total - 1) * 31 + 6;
      const ids = [];
      let k = 0;
      if (bias && !isOut) { const id = schema.uid(); nodes.push({ id, x, y: y0, label: '+1', kind: 'bias' }); ids.push({ id, bias: true }); k++; }
      for (let j = 0; j < n; j++, k++) {
        const id = schema.uid();
        const label = isIn ? 'x' + sub(j + 1) : isOut ? 'ŷ' + sub(j + 1) : 'h' + sup(l) + sub(j + 1);
        nodes.push({ id, x, y: y0 + k * 62, label, kind: isIn ? 'in' : isOut ? 'out' : 'hid' });
        ids.push({ id, bias: false, j });
      }
      layers.push(ids);
      caps.push({ x, text: isIn ? 'Entrada' : isOut ? 'Salida' : 'Oculta ' + l });
    });
    for (let l = 0; l < L - 1; l++) {
      for (const a of layers[l]) for (const t of layers[l + 1]) {
        if (t.bias) continue;
        const ai = a.bias ? 0 : a.j + 1;
        edges.push({ a: a.id, b: t.id, w: showW ? (a.bias ? 'b' + sup(l + 1) + sub(t.j + 1) : 'w' + sup(l + 1) + sub(t.j + 1) + sub(ai)) : null });
      }
    }
    return { nodes, edges, caps, directed: true, h: H };
  }
  function buildNet(b, bd, ro) {
    const box = document.createElement('div');
    box.className = 'net';
    box.tabIndex = 0;
    const W = 720;
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('role', 'img');
    let mode = 'node', sel = null, tmp = null, drag = null, lastTap = { key: '', t: 0 };
    const mk = (tag, attrs, cls, parent) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (cls) e.setAttribute('class', cls); (parent || svg).appendChild(e); return e; };
    const byId = (id) => b.nodes.find((n) => n.id === id);
    const R = 19;
    function render() {
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + b.h);
      svg.textContent = '';
      const mid = 'arr-' + b.id;
      const defs = mk('defs', {});
      const mkr = mk('marker', { id: mid, viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' }, '', defs);
      const ap = mk('path', { d: 'M0 0L10 5L0 10Z' }, '', mkr); ap.style.fill = 'var(--ink-muted)';
      const many = b.edges.length > 60;
      b.edges.forEach((e, i) => {
        const A = byId(e.a), B = byId(e.b);
        if (!A || !B) return;
        const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1;
        const x1 = A.x + dx / d * R, y1 = A.y + dy / d * R, x2 = B.x - dx / d * (R + (b.directed ? 2 : 0)), y2 = B.y - dy / d * (R + (b.directed ? 2 : 0));
        const g = mk('g', { 'data-edge': i });
        const ln = mk('line', { x1, y1, x2, y2 }, 'net-edge', g);
        if (many) ln.style.strokeWidth = '1';
        if (b.directed) ln.setAttribute('marker-end', 'url(#' + mid + ')');
        if (!ro) mk('line', { x1, y1, x2, y2 }, 'net-hit', g);
        if (e.w != null && e.w !== '') { const t = mk('text', { x: x1 + (x2 - x1) * 0.32, y: y1 + (y2 - y1) * 0.32 - 4, 'text-anchor': 'middle' }, 'net-w', g); t.textContent = e.w; }
      });
      for (const c of b.caps || []) { const t = mk('text', { x: c.x, y: b.h - 14 }, 'net-cap'); t.textContent = c.text; }
      for (const n of b.nodes) {
        const g = mk('g', { 'data-node': n.id, transform: 'translate(' + n.x + ' ' + n.y + ')' }, 'net-node' + (n.kind ? ' k-' + n.kind : '') + (sel === n.id ? ' sel' : ''));
        mk('circle', { r: R }, '', g);
        const t = mk('text', {}, '', g); t.textContent = n.label;
      }
      const deg = b.nodes.length;
      svg.setAttribute('aria-label', 'Grafo ' + (b.directed ? 'dirigido' : 'no dirigido') + ' con ' + deg + ' nodos y ' + b.edges.length + ' aristas');
    }
    function pt(e) { const r = svg.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * b.h }; }
    const changed = () => { S.save(); render(); };
    function editText(initial, at, done) {
      const inp = document.createElement('input');
      inp.className = 'net-edit';
      inp.value = initial || '';
      const r = svg.getBoundingClientRect(), br = box.getBoundingClientRect();
      inp.style.left = (at.x / W * r.width + r.left - br.left - 55) + 'px';
      inp.style.top = (at.y / b.h * r.height + r.top - br.top - 14) + 'px';
      box.appendChild(inp);
      inp.focus(); inp.select();
      let ok = false;
      const fin = (commit) => { if (ok) return; ok = true; if (commit) done(inp.value.trim()); inp.remove(); };
      inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') fin(true); if (e.key === 'Escape') fin(false); });
      inp.addEventListener('blur', () => fin(true));
    }
    if (!ro) {
      const bar = document.createElement('div');
      bar.className = 'net-bar';
      const seg = document.createElement('div');
      seg.className = 'mi-seg'; seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', 'Herramienta del grafo');
      const MODES = [['move', 'Mover', 'Arrastra los nodos'], ['node', 'Nodo', 'Clic en un hueco: añade un nodo'], ['edge', 'Arista', 'Arrastra de un nodo a otro: crea una arista'], ['del', 'Borrar', 'Clic en un nodo o arista: lo borra']];
      for (const [k, l, t] of MODES) { const bt = document.createElement('button'); bt.type = 'button'; bt.textContent = l; bt.title = t; bt.dataset.m = k; bt.setAttribute('aria-pressed', String(k === mode)); bt.addEventListener('click', () => { mode = k; $$('button', seg).forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.m === mode))); hint.textContent = t + '. Doble clic en un nodo o arista para cambiar su nombre o peso.'; }); seg.appendChild(bt); }
      const dir = document.createElement('label'); dir.className = 'mi-check'; dir.innerHTML = '<input type="checkbox"> Dirigido';
      const dc = dir.querySelector('input'); dc.checked = b.directed; dc.addEventListener('change', () => { b.directed = dc.checked; changed(); });
      const btn = (label, title, fn) => { const x = document.createElement('button'); x.type = 'button'; x.className = 'mi-btn mi-btn--sm'; x.textContent = label; x.title = title; x.addEventListener('click', fn); bar.appendChild(x); return x; };
      bar.append(seg, dir);
      btn('Red neuronal…', 'Asistente: crea una red por capas en este grafo', async () => {
        const r = await openNN();
        if (!r) return;
        if (b.nodes.length) { const ok = await R('ui/dialogs').ask({ title: '¿Sustituir el grafo?', text: 'Los nodos y aristas actuales se cambian por la red neuronal.', pio: 'idea', buttons: [{ label: 'Cancelar', value: false, kind: 'ghost' }, { label: 'Sustituir', value: true, kind: 'primary', focus: true }] }); if (!ok) return; }
        Object.assign(b, nnBuild(r.sizes, r.bias, r.showW)); dc.checked = b.directed; changed();
      });
      btn('Matriz de adyacencia', 'Añade debajo la matriz de adyacencia del grafo', () => {
        if (!b.nodes.length) { toast('El grafo no tiene nodos.'); return; }
        const n = b.nodes.length, idx = new Map(b.nodes.map((x, i) => [x.id, i]));
        const M = Array.from({ length: n }, () => Array(n).fill('0'));
        for (const e of b.edges) { const i = idx.get(e.a), j = idx.get(e.b); const v = e.w != null && /^-?\d+([.,]\d+)?$/.test(e.w) ? e.w.replace(',', '.') : '1'; M[i][j] = v; if (!b.directed) M[j][i] = v; }
        const labels = b.nodes.map((x) => x.label.replace(/[₀-₉]/g, (c) => '_' + SUB.indexOf(c)).replace(/[⁰-⁹¹²³]/g, (c) => '^' + Math.max(0, SUP.indexOf(c))) || '?');
        const degs = b.nodes.map((x) => b.edges.filter((e) => e.a === x.id || e.b === x.id).length);
        insertSpecs(b.id, [
          { type: 'math', v: 'M_{\\text{ady}}=\\begin{pmatrix}' + M.map((r) => r.join(' & ')).join('\\\\ ') + '\\end{pmatrix}' },
          { type: 'math', v: '\\text{Orden de los nodos: }' + labels.map((l) => l.replace(/_(\d)/g, '_{$1}').replace(/\^(\d)/g, '^{$1}')).join(',\\ ') + (b.directed ? '' : '\\qquad \\text{Grados: }' + degs.join(',\\ ')) },
        ], b);
      });
      btn('Vaciar', 'Quita todos los nodos y aristas', async () => {
        if (!b.nodes.length) return;
        const ok = await R('ui/dialogs').ask({ title: '¿Vaciar el grafo?', text: 'Se borran todos los nodos y aristas de este grafo.', pio: 'pizarra', warn: true, label: 'Aviso', buttons: [{ label: 'Cancelar', value: false, kind: 'ghost', focus: true }, { label: 'Vaciar', value: true, kind: 'danger' }] });
        if (ok) { b.nodes = []; b.edges = []; b.caps = []; changed(); }
      });
      const hint = document.createElement('p');
      hint.className = 'net-hint';
      hint.textContent = 'Clic en un hueco: añade un nodo. Doble clic en un nodo o arista para cambiar su nombre o peso.';
      box.append(bar, svg, hint);
      svg.addEventListener('pointerdown', (e) => {
        if (body.dataset.mode === 'draw' || e.pointerType === 'pen' || e.button > 0) return;
        e.stopPropagation();
        const p = pt(e);
        const ng = e.target.closest('[data-node]'), eg = e.target.closest('[data-edge]');
        // doble clic propio: el dibujo se rehace entre clics y el navegador no siempre lanza dblclick
        const key = ng ? 'n' + ng.dataset.node : eg ? 'e' + eg.dataset.edge : '';
        const now = Date.now();
        if (key && lastTap.key === key && now - lastTap.t < 400 && mode !== 'del') {
          lastTap = { key: '', t: 0 };
          if (ng) { const n = byId(ng.dataset.node); editText(n.label, n, (v) => { n.label = v.slice(0, 24); changed(); }); }
          else { const ed = b.edges[+eg.dataset.edge]; const A = byId(ed.a), B = byId(ed.b); editText(ed.w || '', { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 }, (v) => { ed.w = v ? v.slice(0, 16) : null; changed(); }); }
          e.preventDefault();
          return;
        }
        lastTap = { key, t: now };
        if (mode === 'del') {
          if (ng) { const id = ng.dataset.node; b.nodes = b.nodes.filter((n) => n.id !== id); b.edges = b.edges.filter((x) => x.a !== id && x.b !== id); changed(); }
          else if (eg) { b.edges.splice(+eg.dataset.edge, 1); changed(); }
          return;
        }
        if (ng && (mode === 'move' || mode === 'node')) { const n = byId(ng.dataset.node); drag = { n, dx: p.x - n.x, dy: p.y - n.y, moved: false }; sel = n.id; svg.setPointerCapture(e.pointerId); render(); return; }
        if (ng && mode === 'edge') { const n = byId(ng.dataset.node); tmp = { from: n }; svg.setPointerCapture(e.pointerId); return; }
        if (!ng && !eg && mode === 'node') {
          const n = { id: schema.uid(), x: Math.max(R + 2, Math.min(W - R - 2, p.x)), y: Math.max(R + 2, Math.min(b.h - R - 2, p.y)), label: nextLabel(b), kind: '' };
          b.nodes.push(n); sel = n.id; changed();
        }
      });
      svg.addEventListener('pointermove', (e) => {
        const p = pt(e);
        if (drag) { drag.n.x = Math.max(R + 2, Math.min(W - R - 2, p.x - drag.dx)); drag.n.y = Math.max(R + 2, Math.min(b.h - R - 2, p.y - drag.dy)); drag.moved = true; render(); }
        else if (tmp) { render(); mk('line', { x1: tmp.from.x, y1: tmp.from.y, x2: p.x, y2: p.y }, 'net-tmp'); }
      });
      svg.addEventListener('pointerup', (e) => {
        if (drag) { if (drag.moved) S.save(); drag = null; return; }
        if (tmp) {
          const hit = document.elementFromPoint(e.clientX, e.clientY);
          const ng = hit && hit.closest && hit.closest('[data-node]');
          if (ng && ng.dataset.node !== tmp.from.id) {
            const a = tmp.from.id, c = ng.dataset.node;
            const exists = b.edges.some((x) => (x.a === a && x.b === c) || (!b.directed && x.a === c && x.b === a));
            if (!exists) b.edges.push({ a, b: c, w: null });
          }
          tmp = null; changed();
        }
      });
      box.addEventListener('keydown', (e) => {
        if (e.target !== box && e.target !== svg) return;
        if ((e.key === 'Delete' || e.key === 'Backspace') && sel) { e.preventDefault(); b.nodes = b.nodes.filter((n) => n.id !== sel); b.edges = b.edges.filter((x) => x.a !== sel && x.b !== sel); sel = null; changed(); }
      });
    } else box.appendChild(svg);
    bd.appendChild(box);
    render();
  }
  registry.register({ type: 'net', build: buildNet, exportable: true });
  return { SUB, sub, sup, nextLabel, nnBuild, buildNet };
});
