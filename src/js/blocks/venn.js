/* Bloque diagrama de Venn (pizarra.html 6586-6721). */
MatIA.define('blocks/venn', ['core/dom', 'model/board', 'blocks/svg-utils', 'blocks/registry'], (dom, S, svgu, registry) => {
  'use strict';
  const R = (n) => MatIA.require(n);
  const { $, $$, body } = dom;
  const { SVGNS } = svgu;

  /* ---------------- Diagramas de Venn ---------------- */
  const VENN_NAMES = ['A', 'B', 'C'];
  const VENN_LAYOUT = {
    2: { circles: [[290, 215, 140], [430, 215, 140]], names: [[170, 92], [530, 92]], anchors: { 0: [78, 368], 1: [222, 215], 2: [498, 215], 3: [360, 215] } },
    3: { circles: [[300, 168, 118], [420, 168, 118], [360, 272, 118]], names: [[190, 70], [510, 70], [500, 385]], anchors: { 0: [72, 372], 1: [252, 128], 2: [468, 128], 4: [360, 330], 3: [360, 112], 5: [290, 244], 6: [430, 244], 7: [360, 203] } },
  };
  const setPretty = (t) => String(t).replace(/\\left|\\right/g, '').replace(/\\cap\s*/g, ' ∩ ').replace(/\\cup\s*/g, ' ∪ ').replace(/\\setminus\s*/g, ' ∖ ').replace(/\\backslash\s*/g, ' ∖ ')
    .replace(/\\triangle\s*/g, ' Δ ').replace(/\\Delta\s*/g, ' Δ ').replace(/\^\{c\}|\^c|\^\{\\complement\}/g, 'ᶜ').replace(/\\emptyset\s*/g, '∅').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
  function vennExprFrom(src) {
    let t = String(src || '').trim().replace(/=\s*$/, '');
    const i = t.lastIndexOf('=');
    if (i >= 0) t = t.slice(i + 1);
    if (!t.trim()) throw new R('engine/core').MErr('Escribe una expresión de conjuntos, por ejemplo A ∩ B o (A ∪ B)ᶜ.');
    return t.trim();
  }
  function pageLines() {
    const out = [];
    for (const x of S.page().blocks) { if (x.type === 'math' || x.type === 'text') out.push(x.v); if (x.type === 'deriv') x.rows.forEach((r) => { if (r.l && r.r) out.push(r.l + '=' + r.r); }); }
    return out;
  }
  function buildVenn(b, bd, ro) {
    const box = document.createElement('div');
    box.className = 'venn';
    box.tabIndex = 0;
    const W = 720, H = 420, uid0 = 'v' + Math.random().toString(36).slice(2, 8);
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('role', 'img');
    const res = document.createElement('p');
    res.className = 'v-res';
    const err = document.createElement('div');
    err.className = 'v-err';
    const mk = (tag, attrs, cls, parent) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (cls) e.setAttribute('class', cls); (parent || svg).appendChild(e); return e; };
    let lastMasks = [];
    function render() {
      svg.textContent = ''; err.textContent = '';
      const n = b.n === 3 ? 3 : 2, Lo = VENN_LAYOUT[n];
      let masks = [], manual = !b.expr;
      if (!manual) {
        try { const r = R('engine/ops').vennEval(b.expr, VENN_NAMES, n); masks = r.masks; }
        catch (e) { err.textContent = 'Aviso: ' + (e.message || 'expresión no válida'); masks = []; }
      } else masks = b.shade.filter((m) => m < (1 << n));
      lastMasks = masks;
      const defs = mk('defs', {});
      Lo.circles.forEach(([cx, cy, r], k) => { const cp = mk('clipPath', { id: uid0 + 'c' + k }, '', defs); mk('circle', { cx, cy, r }, '', cp); });
      const hatch = mk('pattern', { id: uid0 + 'h', width: 10, height: 10, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, 'v-hatch', defs);
      mk('line', { x1: 0, y1: 0, x2: 0, y2: 10 }, '', hatch);
      mk('rect', { x: 20, y: 20, width: W - 40, height: H - 40, rx: 14 }, 'v-uni');
      const t = mk('text', { x: 36, y: 50 }, 'v-name'); t.textContent = 'U';
      for (const m of masks) {
        const msk = mk('mask', { id: uid0 + 'm' + m }, '', defs);
        mk('rect', { x: 0, y: 0, width: W, height: H, fill: 'white' }, '', msk);
        Lo.circles.forEach(([cx, cy, r], k) => { if (!(m & (1 << k))) mk('circle', { cx, cy, r, fill: 'black' }, '', msk); });
        let g = svg;
        Lo.circles.forEach((_, k) => { if (m & (1 << k)) g = mk('g', { 'clip-path': 'url(#' + uid0 + 'c' + k + ')' }, '', g); });
        mk('rect', { x: 20, y: 20, width: W - 40, height: H - 40, rx: 14, mask: 'url(#' + uid0 + 'm' + m + ')' }, 'v-shade', g);
        mk('rect', { x: 20, y: 20, width: W - 40, height: H - 40, rx: 14, mask: 'url(#' + uid0 + 'm' + m + ')', fill: 'url(#' + uid0 + 'h)' }, '', g);
      }
      Lo.circles.forEach(([cx, cy, r]) => mk('circle', { cx, cy, r }, 'v-circle'));
      Lo.names.forEach(([x, y], k) => { const tt = mk('text', { x, y, 'text-anchor': 'middle' }, 'v-name'); tt.textContent = VENN_NAMES[k]; });
      // elementos
      let info = null;
      try { info = b.showEls ? R('engine/ops').vennElements(pageLines(), VENN_NAMES, n) : null; } catch (e) { info = null; }
      if (info) {
        const byMask = {};
        for (const e of info.els) (byMask[e.mask] = byMask[e.mask] || []).push(e.txt);
        for (const m in byMask) {
          const list = byMask[m], [ax, ay] = Lo.anchors[m];
          const shown = list.slice(0, 9), cols = Math.min(3, Math.ceil(Math.sqrt(shown.length)));
          shown.forEach((txt, i) => { const cx = ax + ((i % cols) - (cols - 1) / 2) * 30, cy = ay + (Math.floor(i / cols) - (Math.ceil(shown.length / cols) - 1) / 2) * 24; const tt = mk('text', { x: cx, y: cy }, 'v-el'); tt.textContent = txt.length > 4 ? txt.slice(0, 4) + '…' : txt; });
          if (list.length > 9) { const tt = mk('text', { x: ax, y: ay + 52 }, 'v-el'); tt.textContent = '+' + (list.length - 9); }
        }
      }
      // texto de resultado
      const exprTxt = manual ? 'zona elegida a mano' : setPretty(b.expr);
      svg.setAttribute('aria-label', 'Diagrama de Venn de ' + n + ' conjuntos con la zona ' + exprTxt + ' sombreada');
      res.textContent = '';
      const bb = document.createElement('b'); bb.textContent = manual ? (masks.length ? 'Sombreado a mano' : 'Haz clic en las zonas para sombrearlas') : exprTxt;
      res.appendChild(bb);
      if (info && masks.length !== undefined && (!manual || masks.length)) {
        const els = info.els.filter((e) => masks.includes(e.mask)).map((e) => e.txt);
        res.appendChild(document.createTextNode(' = {' + els.join(', ') + '}' + (els.length ? '' : ' = ∅') + (info.missing.length ? '   (sin definir: ' + info.missing.join(', ') + ')' : '') + (!info.hasU && masks.includes(0) ? '   (define U para ver los elementos de fuera)' : '')));
      }
    }
    function maskAt(e) {
      const r = svg.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
      if (x < 20 || x > W - 20 || y < 20 || y > H - 20) return -1;
      const n = b.n === 3 ? 3 : 2;
      return VENN_LAYOUT[n].circles.reduce((m, [cx, cy, rr], k) => (Math.hypot(x - cx, y - cy) <= rr ? m | (1 << k) : m), 0);
    }
    box.appendChild(svg);
    box.appendChild(res);
    box.appendChild(err);
    if (!ro) {
      const ctrl = document.createElement('div');
      ctrl.className = 'v-ctrl';
      const seg = document.createElement('div');
      seg.className = 'mi-seg'; seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', 'Número de conjuntos');
      [[2, '2 conjuntos'], [3, '3 conjuntos']].forEach(([k, l]) => { const bt = document.createElement('button'); bt.type = 'button'; bt.textContent = l; bt.setAttribute('aria-pressed', String(b.n === k)); bt.addEventListener('click', () => { b.n = k; $$('button', seg).forEach((x) => x.setAttribute('aria-pressed', String(x === bt))); S.save(); render(); }); seg.appendChild(bt); });
      const inp = document.createElement('input');
      inp.type = 'text'; inp.value = setPretty(b.expr); inp.placeholder = 'Expresión: A ∩ B, (A ∪ B)ᶜ, A ∖ B…';
      inp.setAttribute('aria-label', 'Expresión de conjuntos para sombrear');
      const apply = () => { const v = inp.value.trim(); b.expr = v; if (v) { try { const r0 = R('engine/ops').vennEval(v, VENN_NAMES); if (r0.n === 3 && b.n !== 3) { b.n = 3; $$('button', seg).forEach((x, i) => x.setAttribute('aria-pressed', String(i === 1))); } } catch (e) { /* se muestra el aviso */ } } S.save(); render(); };
      inp.addEventListener('change', apply);
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
      const keys = document.createElement('div');
      keys.className = 'v-keys';
      for (const [sym, title] of [['∪', 'Unión'], ['∩', 'Intersección'], ['∖', 'Diferencia'], ['ᶜ', 'Complementario'], ['Δ', 'Diferencia simétrica'], ['(', 'Abrir paréntesis'], [')', 'Cerrar paréntesis'], ['A', 'Conjunto A'], ['B', 'Conjunto B'], ['C', 'Conjunto C'], ['U', 'Universal']]) {
        const kb = document.createElement('button'); kb.type = 'button'; kb.textContent = sym; kb.title = title;
        kb.addEventListener('mousedown', (e) => e.preventDefault());
        kb.addEventListener('click', () => { const a = inp.selectionStart ?? inp.value.length, z = inp.selectionEnd ?? a; const ins = /[∪∩∖Δ]/.test(sym) ? ' ' + sym + ' ' : sym; inp.value = inp.value.slice(0, a) + ins + inp.value.slice(z); inp.focus(); inp.selectionStart = inp.selectionEnd = a + ins.length; apply(); });
        keys.appendChild(kb);
      }
      const els = document.createElement('label'); els.className = 'mi-check'; els.innerHTML = '<input type="checkbox"> Elementos';
      const ec = els.querySelector('input'); ec.checked = b.showEls; ec.addEventListener('change', () => { b.showEls = ec.checked; S.save(); render(); });
      const clr = document.createElement('button'); clr.type = 'button'; clr.className = 'mi-btn mi-btn--sm'; clr.textContent = 'Limpiar';
      clr.title = 'Quita el sombreado para colorear las zonas a mano';
      clr.addEventListener('click', () => { b.expr = ''; b.shade = []; inp.value = ''; S.save(); render(); });
      ctrl.append(seg, inp, els, clr);
      box.append(ctrl, keys);
      svg.addEventListener('pointerdown', (e) => {
        if (body.dataset.mode === 'draw' || e.pointerType === 'pen') return;
        e.stopPropagation();
        const m = maskAt(e);
        if (m < 0) return;
        // al tocar una zona se pasa a modo manual partiendo de lo que ya estaba sombreado
        if (b.expr) { b.shade = lastMasks.slice(); b.expr = ''; inp.value = ''; }
        b.shade = b.shade.includes(m) ? b.shade.filter((x) => x !== m) : b.shade.concat([m]);
        S.save(); render();
      });
    }
    bd.appendChild(box);
    render();
  }
  registry.register({ type: 'venn', build: buildVenn, exportable: true });
  return { VENN_NAMES, VENN_LAYOUT, setPretty, vennExprFrom, pageLines, buildVenn };
});
