#!/usr/bin/env node
/* Prueba de «lo que no cabe en la hoja» (js/blocks/fit.js).
   Uso: node tests/fit.js [index.html]
   Si index.html aún no carga js/blocks/fit.js, se crea una copia temporal con <base> y los scripts/estilos añadidos. */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const SCRATCH = '/tmp/claude-0/-home-user-MatIA-Pizarra/01dbf8ae-b7ca-56a2-a637-356d3606271a/scratchpad';

function pageFile(name) {
  const src = path.resolve(ROOT, name || 'index.html');
  let html = fs.readFileSync(src, 'utf8');
  if (html.includes('js/blocks/fit.js')) return src;
  html = html.replace('<head>', '<head>\n<base href="file://' + ROOT + '/">')
    .replace('<link rel="stylesheet" href="css/print.css">', '<link rel="stylesheet" href="css/fit.css">\n<link rel="stylesheet" href="css/print.css">')
    .replace('<script src="js/blocks/editor.js"></script>', '<script src="js/blocks/fit.js"></script>\n<script src="js/blocks/editor.js"></script>');
  fs.mkdirSync(SCRATCH, { recursive: true });
  const out = path.join(SCRATCH, 'index-fit.html');
  fs.writeFileSync(out, html);
  return out;
}

(async () => {
  const file = pageFile(process.argv[2]);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 1000 } });
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/mathlive@[^/]+\//, (r) => {
    const f = path.join(ROOT, 'vendor/mathlive', new URL(r.request().url()).pathname.replace(/^\/npm\/mathlive@[^/]+\//, ''));
    return fs.existsSync(f) ? r.fulfill({ path: f }) : r.fulfill({ status: 404, body: '' });
  });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ body: '', contentType: 'text/css' }));
  const sum = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('+');
  const longText = '\\text{' + 'Este es un texto muy largo que no cabe en la hoja y debe pasar a una línea de texto normal. '.repeat(4).trim() + '}';
  const medium = 'x=' + sum(16, (i) => 'a_{' + i + '}');
  const huge = 'y=' + sum(70, (i) => 'a_{' + i + '}x^{' + i + '}');
  const blk = (id, v) => ({ id, type: 'math', v, align: 'left' });
  const board = { v: 1, cur: 0, paper: 'slide', pages: [{ strokes: [], minH: 0, blocks: [
    blk('t1', longText), blk('m1', medium), blk('h1', huge), blk('z1', 'z'),
  ] }] };
  await ctx.addInitScript((j) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('matia-pizarra-v1', j); sessionStorage.setItem('seeded', '1'); } }, JSON.stringify(board));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_TUNNEL|Fetch API cannot load|Invalid URL|math fonts could not be loaded/.test(m.text())) errors.push(m.text()); });
  await page.goto('file://' + file);
  await page.waitForFunction(() => !!customElements.get('math-field'));
  await page.waitForTimeout(1500);
  let fail = 0;
  const ok = (c, m) => { if (!c) { fail++; console.log('FALLO:', m); } };
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('matia-pizarra-v1')).pages[0].blocks.map((b) => ({ id: b.id, type: b.type, v: b.v, rows: b.rows && b.rows.length })));

  // (a) texto puro -> bloque text; Deshacer
  if (process.env.DBG) console.log(errors, await page.evaluate(() => document.querySelector('#blocks').innerHTML.slice(0, 500)));
  await page.click('#blocks > .blk:nth-child(1) math-field');
  await page.click('#blocks > .blk:nth-child(4) math-field');
  await page.waitForTimeout(500);
  let bl = await stored();
  ok(bl[0].type === 'text' && bl[0].v.startsWith('Este es un texto') && !/\\text/.test(bl[0].v), '(a) la línea de texto pasa a type text: ' + JSON.stringify(bl[0]).slice(0, 120));
  ok(await page.evaluate(() => !!document.querySelector('#blocks > .blk:nth-child(1) .blk-text')), '(a) hay .blk-text');
  await page.click('#toast button');
  await page.waitForTimeout(300);
  bl = await stored();
  ok(bl[0].type === 'math' && bl[0].v === longText, '(a) Deshacer devuelve la fórmula');

  // (b) fórmula moderada se reduce y cabe
  const b = await page.evaluate(() => {
    const el = document.querySelector('#blocks > .blk:nth-child(2)'), mf = el.querySelector('math-field'), bd = el.querySelector('.blk-body');
    const c = mf.shadowRoot.querySelector('.ML__content'); return { fit: mf.style.getPropertyValue('--fit'), sw: bd.scrollWidth, cw: bd.clientWidth, over: el.classList.contains('is-overflow'), csw: c.scrollWidth, ccw: c.clientWidth };
  });
  ok(b.fit && parseFloat(b.fit) < 1 && parseFloat(b.fit) >= 0.6, '(b) --fit reducido (' + b.fit + ')');
  ok(b.sw <= b.cw && !b.over, '(b) cabe: ' + JSON.stringify(b));

  // (c) enorme: is-overflow y Partir -> deriv
  const h = await page.evaluate(() => { const el = document.querySelector('#blocks > .blk:nth-child(3)'); return { over: el.classList.contains('is-overflow'), warn: !!el.querySelector('.fit-warn button') }; });
  ok(h.over && h.warn, '(c) is-overflow y aviso: ' + JSON.stringify(h));
  await page.click('#blocks > .blk:nth-child(3) .fit-warn button');
  await page.waitForTimeout(400);
  bl = await stored();
  const h1 = bl[2];
  ok(h1 && h1.type === 'deriv' && h1.rows >= 1, '(c) Partir crea deriv: ' + JSON.stringify(h1));

  ok(!errors.length, '(d) sin errores de página: ' + errors.join(' | '));
  await browser.close();
  console.log(fail ? fail + ' fallo(s)' : 'fit: OK');
  process.exit(fail ? 1 : 0);
})();
