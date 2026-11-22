/* Esquema del tablero: limpia y normaliza lo que llega de localStorage o de un archivo .json.
   Cada tipo de bloque tiene su función de limpieza en SANITIZERS. Un tipo nuevo se añade con
   schema.register('tipo', (x, base, h) => bloque) sin tocar este fichero (abierto/cerrado).
   Formato documentado en docs/FORMATO-JSON.md. */
MatIA.define('model/schema', [], () => {
  'use strict';
  let uidN = 0;
  const uid = () => 'b' + Date.now().toString(36) + (uidN++).toString(36);
  const newBlock = (type = 'math', v = '', extra = {}) => Object.assign({ id: uid(), type, v, align: 'left', boxed: false }, extra);
  const newRow = (l = '', r = '', note = '') => ({ l, r, note, boxed: false });
  const newDeriv = (rows) => ({ id: uid(), type: 'deriv', rows: rows || [newRow()], align: 'left', boxed: false });
  const newPage = () => ({ blocks: [newBlock()], strokes: [], minH: 0 });
  const defaults = () => ({ v: 1, paper: 'free', pages: [newPage()], cur: 0, theme: null, accent: '', scale: 140, color: 'ink', tool: 'pen', width: 3 });

  const MARK_KINDS = ['min', 'max', 'absmin', 'absmax', 'infl', 'saddle', 'deg'];
  function cleanMarks(ms, three) {
    return (Array.isArray(ms) ? ms : []).filter((m) => m && Number.isFinite(+m.x) && Number.isFinite(+m.y) && (!three || Number.isFinite(+m.z)) && MARK_KINDS.includes(m.kind)).slice(0, 40)
      .map((m) => Object.assign({ x: +m.x, y: +m.y, kind: m.kind, label: String(m.label || '').slice(0, 40) }, three ? { z: +m.z } : {}));
  }

  // Limpieza por tipo. Reciben el bloque crudo x y la base común { id, align, boxed }.
  const SANITIZERS = {
    deriv(x, base) {
    const str = (v) => (typeof v === 'string' ? v : '');
    const rows = (Array.isArray(x.rows) ? x.rows : []).filter((r) => r && typeof r === 'object')
      .map((r) => ({ l: str(r.l), r: str(r.r), note: str(r.note), boxed: !!r.boxed }));
    return Object.assign(base, { type: 'deriv', rows: rows.length ? rows : [newRow()] });
    },
    table(x, base) {
    const strs = (a) => (Array.isArray(a) ? a.map((c) => String(c == null ? '' : c)) : []);
    return Object.assign(base, { type: 'table', rows: (Array.isArray(x.rows) ? x.rows : []).map(strs), head: x.head ? strs(x.head) : null,
      vbar: Number.isInteger(x.vbar) ? x.vbar : null, hline: Number.isInteger(x.hline) ? x.hline : null, hlines: Array.isArray(x.hlines) ? x.hlines.filter(Number.isInteger) : null,
      mark: Array.isArray(x.mark) ? x.mark.slice(0, 2).map(Number) : null, caption: typeof x.caption === 'string' ? x.caption : '', kind: typeof x.kind === 'string' ? x.kind : '', lastBold: !!x.lastBold });
    },
    graph3d(x, base) {
    const num = (v, d) => (Number.isFinite(+v) ? +v : d);
    const fn0 = typeof x.fn === 'string' ? x.fn : 'z=x^2-y^2';
    // varias superficies en el mismo dibujo (máx. 4); los archivos antiguos solo traen fn
    const fns = Array.isArray(x.fns) ? x.fns.filter((f) => typeof f === 'string').slice(0, 4) : [];
    if (!fns.length) fns.push(fn0);
    return Object.assign(base, { type: 'graph3d', marks: cleanMarks(x.marks, true), fn: fns.find((f) => f.trim()) || fn0, fns, xmin: num(x.xmin, -3), xmax: num(x.xmax, 3), ymin: num(x.ymin, -3), ymax: num(x.ymax, 3), az: num(x.az, -0.8), el: num(x.el, 0.55), zoom: num(x.zoom, 1) });
    },
    chart(x, base) {
    const nums = (a) => (Array.isArray(a) ? a.map(Number).filter(Number.isFinite).slice(0, 400) : []);
    const kind = ['bars', 'box', 'normal'].includes(x.kind) ? x.kind : 'bars';
    const num = (v) => (v == null || v === '' || !Number.isFinite(+v) ? null : +v);
    return Object.assign(base, { type: 'chart', kind, title: String(x.title || '').slice(0, 160), labels: (Array.isArray(x.labels) ? x.labels : []).map(String).slice(0, 400), values: nums(x.values), valueLabels: Array.isArray(x.valueLabels) ? x.valueLabels.map(String).slice(0, 400) : null, hi: nums(x.hi), ylabel: String(x.ylabel || ''),
      data: nums(x.data), min: num(x.min), max: num(x.max), q1: num(x.q1), med: num(x.med), q3: num(x.q3), mean: num(x.mean), mu: num(x.mu), sigma: num(x.sigma), a: num(x.a), b: num(x.b) });
    },
    ptree(x, base) {
    const str = (v) => String(v == null ? '' : v).slice(0, 24);
    return Object.assign(base, { type: 'ptree', ev: str(x.ev) || 'B', causes: (Array.isArray(x.causes) ? x.causes : []).slice(0, 6).map((c) => ({ name: str(c.name), p: str(c.p), l: str(c.l), nl: str(c.nl), prod: str(c.prod), nprod: str(c.nprod) })) });
    },
    geo(x, base) {
    const kind = ['unit', 'unitAll', 'tri', 'lines', 'transv'].includes(x.kind) ? x.kind : 'unit';
    const num = (v, d) => (Number.isFinite(+v) ? +v : d);
    const o = Object.assign(base, { type: 'geo', kind, deg: num(x.deg, 30), label: String(x.label || '').slice(0, 60) });
    if (kind === 'tri') ['a', 'b', 'c', 'A', 'B', 'C'].forEach((k) => { o[k] = num(x[k], 1); });
    if (kind === 'lines') {
      o.lines = (Array.isArray(x.lines) ? x.lines : []).slice(0, 6).map((l) => ({ a: num(l.a, 0), b: num(l.b, 1), c: num(l.c, 0), name: String(l.name || 'r').slice(0, 8), dash: !!l.dash })).filter((l) => l.a || l.b);
      o.points = (Array.isArray(x.points) ? x.points : []).slice(0, 12).map((q) => ({ x: num(q.x, 0), y: num(q.y, 0), name: String(q.name || 'P').slice(0, 8), kind: ['cut', 'mid'].includes(q.kind) ? q.kind : '' }));
    }
    return o;
    },
    venn(x, base) {
    return Object.assign(base, { type: 'venn', n: x.n === 3 ? 3 : 2, expr: typeof x.expr === 'string' ? x.expr.slice(0, 200) : '', shade: (Array.isArray(x.shade) ? x.shade : []).map(Number).filter((m) => Number.isInteger(m) && m >= 0 && m < 8), showEls: x.showEls !== false });
    },
    net(x, base) {
    const nodes = (Array.isArray(x.nodes) ? x.nodes : []).filter((n) => n && Number.isFinite(+n.x) && Number.isFinite(+n.y)).slice(0, 120)
      .map((n) => ({ id: String(n.id || uid()), x: +n.x, y: +n.y, label: String(n.label == null ? '' : n.label).slice(0, 24), kind: ['in', 'hid', 'out', 'bias'].includes(n.kind) ? n.kind : '' }));
    const ids = new Set(nodes.map((n) => n.id));
    const edges = (Array.isArray(x.edges) ? x.edges : []).filter((e) => e && ids.has(String(e.a)) && ids.has(String(e.b))).slice(0, 600)
      .map((e) => ({ a: String(e.a), b: String(e.b), w: e.w == null || e.w === '' ? null : String(e.w).slice(0, 16) }));
    const caps = (Array.isArray(x.caps) ? x.caps : []).filter((c) => c && Number.isFinite(+c.x)).map((c) => ({ x: +c.x, text: String(c.text || '').slice(0, 40) }));
    return Object.assign(base, { type: 'net', nodes, edges, caps, directed: !!x.directed, h: Math.min(1200, Math.max(260, +x.h || 420)) });
    },
    graph(x, base) {
    const xmin = Number.isFinite(+x.xmin) ? +x.xmin : -5, xmax = Number.isFinite(+x.xmax) ? +x.xmax : 5;
    return Object.assign(base, { type: 'graph', marks: cleanMarks(x.marks, false), fns: (Array.isArray(x.fns) ? x.fns : []).map(String).slice(0, 6), xmin: Math.min(xmin, xmax - 0.001), xmax }, (typeof x.ymin === 'number' && typeof x.ymax === 'number' && Number.isFinite(x.ymin) && Number.isFinite(x.ymax) && x.ymin < x.ymax) ? { ymin: x.ymin, ymax: x.ymax } : {});
    },
  };
  const sanitizeText = (x, base) => {
    const o = Object.assign(base, { type: x.type === 'text' ? 'text' : 'math', v: typeof x.v === 'string' ? x.v : '', result: !!x.result });
    if (o.type === 'math' && typeof x.note === 'string' && x.note.trim()) o.note = x.note.slice(0, 500); // explicación a la derecha
    return o;
  };

  function sanitizeBlock(x) {
    const base = { id: uid(), align: ['left', 'center', 'right'].includes(x.align) ? x.align : 'left', boxed: !!x.boxed };
    const fn = Object.prototype.hasOwnProperty.call(SANITIZERS, x.type) ? SANITIZERS[x.type] : sanitizeText;
    return fn(x, base);
  }

  /** Devuelve un tablero válido o null si los datos no lo son. */
  function sanitize(b) {
    if (!b || !Array.isArray(b.pages) || !b.pages.length) return null;
    const d = defaults();
    const out = Object.assign(d, {
      theme: b.theme === 'dark' || b.theme === 'light' ? b.theme : null,
      accent: b.accent === 'math' ? 'math' : '',
      scale: Math.min(260, Math.max(80, +b.scale || 140)),
      color: typeof b.color === 'string' && /^(ink|data-[1-6])$/.test(b.color) ? b.color : 'ink',
      tool: ['pen', 'hl', 'arrow', 'eraser'].includes(b.tool) ? b.tool : 'pen',
      histAuto: !!b.histAuto,
      lineNums: b.lineNums !== false,
      paper: ['free', 'a4p', 'a4l', 'a3l', 'slide'].includes(b.paper) ? b.paper : 'free',
      width: Math.min(12, Math.max(1, +b.width || 3)),
      title: typeof b.title === 'string' ? b.title.slice(0, 120) : '',
    });
    out.pages = b.pages.map((p) => ({
      blocks: (Array.isArray(p.blocks) && p.blocks.length ? p.blocks : [newBlock()]).map(sanitizeBlock),
      strokes: Array.isArray(p.strokes) ? p.strokes.filter((s) => s && Array.isArray(s.pts)) : [],
      minH: +p.minH || 0,
    }));
    out.cur = Math.min(out.pages.length - 1, Math.max(0, +b.cur || 0));
    return out;
  }

  return {
    uid, newBlock, newRow, newDeriv, newPage, defaults, sanitize, cleanMarks, MARK_KINDS,
    register(type, fn) { SANITIZERS[type] = fn; },
  };
});
