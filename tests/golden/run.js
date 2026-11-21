#!/usr/bin/env node
/* Pruebas de referencia («golden»): abren la pizarra por file:// en Chromium, ejecutan el motor con
   los casos de cases.js, cargan un tablero con todos los tipos de bloque y guardan un resumen del DOM.
   Uso:
     node tests/golden/run.js record  [legacy/pizarra.html]   → escribe tests/golden/expected.json
     node tests/golden/run.js compare [pizarra.html]     → compara con expected.json (sale con código 1 si difiere)
   Las capturas de cada página quedan en tests/golden/out/ para revisarlas a ojo. */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '../..');
const mode = process.argv[2] || 'compare';
const target = path.resolve(ROOT, process.argv[3] || (mode === 'record' ? 'legacy/pizarra.html' : 'pizarra.html'));
const OUT = path.join(__dirname, 'out');
const EXPECTED = path.join(__dirname, 'expected.json');
const cases = require('./cases.js');
const baseBoard = JSON.parse(fs.readFileSync(path.join(__dirname, 'board.json'), 'utf8'));
// Operaciones cuyo resultado (bloques) se añade como páginas extra para renderizar todos los tipos.
const RENDER_FROM = ['graphOf', 'extrema1', 'extrema2', 'statsSummary', 'freqTable', 'binomial', 'normal', 'bayes',
  'angleConvert', 'trigRatios', 'notableTable', 'solveTriangle', 'linesRelative', 'transversal', 'truthTable', 'pascal', 'polyDivide'];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  // El prototipo carga MathLive y las fuentes de un CDN: se sirven desde vendor/ para que la prueba no dependa de la red.
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/mathlive@[^/]+\//, (r) => {
    const rel = new URL(r.request().url()).pathname.replace(/^\/npm\/mathlive@[^/]+\//, '');
    const f = path.join(ROOT, 'vendor/mathlive', rel);
    return fs.existsSync(f) ? r.fulfill({ path: f }) : r.fulfill({ status: 404, body: '' });
  });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ body: '', contentType: 'text/css' }));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_TUNNEL/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('dialog', (d) => { errors.push('dialogo nativo: ' + d.type() + ' «' + d.message() + '»'); d.dismiss(); });

  const url = 'file://' + target;
  await page.goto(url);
  await page.waitForFunction(() => !!customElements.get('math-field'), null, { timeout: 15000 });

  // 1) Motor
  const engine = await page.evaluate((cases) => {
    /* global ME, OPS, MatIA */
    const me = typeof ME !== 'undefined' ? ME : MatIA.require('engine/core');
    const ops = typeof OPS !== 'undefined' ? OPS : MatIA.require('engine/ops');
    const lib = { ME: me, OPS: Object.assign({}, ops, {
      $compileFnSample(src) { const c = ops.compileFn(src); return { name: c.name, v: c.v, latex: c.latex, ys: [-2, -1, 0, 0.5, 3].map((x) => c.f(x)) }; },
    }) };
    const ser = (v) => JSON.parse(JSON.stringify(v, (k, x) => (typeof x === 'bigint' ? x.toString() + 'n' : typeof x === 'function' ? '[fn]' : x)));
    const out = {};
    for (const [name, fn, ...args] of cases) {
      const [ns, f] = fn.split('.');
      const a = args.map((x) => (x && x.$defs ? me.definitions(x.$defs) : x));
      try { out[name] = { ok: ser(lib[ns][f](...a)) }; } catch (e) { out[name] = { err: (e && e.constructor && e.constructor.name) + ': ' + (e && e.message) }; }
    }
    return out;
  }, cases);

  // 2) Render: tablero base + una página por operación con bloques visuales
  const board = JSON.parse(JSON.stringify(baseBoard));
  for (const n of RENDER_FROM) if (engine[n] && engine[n].ok) board.pages.push({ blocks: engine[n].ok, strokes: [] });
  const vennSpec = { type: 'venn', n: 2, expr: 'A\\cap B', shade: [], showEls: false };
  board.pages.push({ blocks: [vennSpec], strokes: [] });
  // Los BigInt serializados («3n») no aparecen en bloques; si apareciesen, se dejan como texto.
  await page.evaluate((b) => { localStorage.setItem('matia-pizarra-v1', JSON.stringify(b)); }, board);
  await page.reload();
  await page.waitForFunction(() => !!customElements.get('math-field'), null, { timeout: 15000 });
  await page.waitForTimeout(800);

  const render = [];
  for (let i = 0; i < board.pages.length; i++) {
    await page.waitForTimeout(300);
    const snap = await page.evaluate(() => {
      const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
      return {
        pg: document.querySelector('#pgOut') && document.querySelector('#pgOut').textContent,
        blocks: Array.from(document.querySelectorAll('#blocks > *')).map((el) => ({
          cls: Array.from(el.classList).filter((c) => !/^(is-active|active|sel|focus|drag)/.test(c)).sort().join(' '),
          math: Array.from(el.querySelectorAll('math-field')).map((m) => m.value),
          text: norm(Array.from(el.querySelectorAll('svg text, td, th, .note, .txt, caption, figcaption')).map((n) => n.textContent).join(' | ')).slice(0, 600),
          svg: el.querySelectorAll('svg').length, canvas: el.querySelectorAll('canvas').length,
          shapes: el.querySelectorAll('svg path, svg line, svg circle, svg rect, svg polygon, svg polyline').length,
        })),
      };
    });
    render.push(snap);
    await page.screenshot({ path: path.join(OUT, 'pagina-' + String(i + 1).padStart(2, '0') + '.png'), fullPage: true });
    if (i < board.pages.length - 1) await page.click('#pgNext');
  }

  const result = { engine, render, errors };
  await browser.close();

  if (mode === 'record') {
    fs.writeFileSync(EXPECTED, JSON.stringify(result, null, 1));
    console.log('Referencia guardada:', Object.keys(engine).length, 'casos de motor,', render.length, 'páginas,', errors.length, 'errores de consola.');
    if (errors.length) console.log(errors.join('\n'));
    return;
  }
  const exp = JSON.parse(fs.readFileSync(EXPECTED, 'utf8'));
  const diffs = [];
  for (const k of Object.keys(exp.engine)) if (JSON.stringify(exp.engine[k]) !== JSON.stringify(engine[k])) diffs.push('motor: ' + k);
  exp.render.forEach((p, i) => {
    const q = render[i];
    if (!q) { diffs.push('render: falta la página ' + (i + 1)); return; }
    p.blocks.forEach((b, j) => { if (JSON.stringify(b) !== JSON.stringify(q.blocks[j])) diffs.push('render: página ' + (i + 1) + ' bloque ' + (j + 1) + '\n   esperado ' + JSON.stringify(b).slice(0, 300) + '\n   obtenido ' + JSON.stringify(q.blocks[j]).slice(0, 300)); });
    if (q.blocks.length !== p.blocks.length) diffs.push('render: página ' + (i + 1) + ' tiene ' + q.blocks.length + ' bloques (esperados ' + p.blocks.length + ')');
  });
  const newErr = errors.filter((e) => !exp.errors.includes(e));
  newErr.forEach((e) => diffs.push('error nuevo: ' + e));
  if (diffs.length) { console.log('DIFERENCIAS (' + diffs.length + '):\n' + diffs.join('\n')); process.exit(1); }
  console.log('OK: motor (' + Object.keys(engine).length + ' casos) y render (' + render.length + ' páginas) idénticos a la referencia.');
})().catch((e) => { console.error(e); process.exit(2); });
