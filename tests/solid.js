#!/usr/bin/env node
/* Prueba del bloque «sólido de revolución».
   Uso: node tests/solid.js [pizarra.html]
   Si pizarra.html aún no carga js/blocks/solid.js, se crea una copia temporal con <base> y los scripts/estilos añadidos. */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const SCRATCH = '/tmp/claude-0/-home-user-MatIA-Pizarra/01dbf8ae-b7ca-56a2-a637-356d3606271a/scratchpad';

function pageFile(name) {
  const src = path.resolve(ROOT, name || 'pizarra.html');
  let html = fs.readFileSync(src, 'utf8');
  if (html.includes('js/blocks/solid.js')) return src; // ya integrado
  html = html.replace('<head>', '<head>\n<base href="file://' + ROOT + '/">')
    .replace('<link rel="stylesheet" href="css/print.css">', '<link rel="stylesheet" href="css/solid.css">\n<link rel="stylesheet" href="css/print.css">')
    .replace('<script src="js/model/schema.js"></script>', '<script src="js/model/schema.js"></script>\n<script src="js/blocks/canvas3d.js"></script>\n<script src="js/blocks/solid.js"></script>');
  fs.mkdirSync(SCRATCH, { recursive: true });
  const out = path.join(SCRATCH, 'index-solid.html');
  fs.writeFileSync(out, html);
  return out;
}

(async () => {
  const file = pageFile(process.argv[2]);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 1400 }, deviceScaleFactor: 2 });
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/mathlive@[^/]+\//, (r) => {
    const f = path.join(ROOT, 'vendor/mathlive', new URL(r.request().url()).pathname.replace(/^\/npm\/mathlive@[^/]+\//, ''));
    return fs.existsSync(f) ? r.fulfill({ path: f }) : r.fulfill({ status: 404, body: '' });
  });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ body: '', contentType: 'text/css' }));
  const blk = (o) => Object.assign({ type: 'solid', fn: 'f(x)=x', a: 0, b: 1, axis: 'x', k: 0, az: -0.8, el: 0.5, zoom: 1 }, o);
  const board = { v: 1, cur: 0, pages: [{ strokes: [], minH: 0, blocks: [
    blk({}), blk({ axis: 'y' }), blk({ axis: 'y=k', k: 1 }), blk({ axis: 'x=k', k: -1 }),
    blk({ fn: 'f(x)=\\sqrt{x}', a: 0, b: 4, axis: 'x' }),
  ] }] };
  await ctx.addInitScript((j) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('matia-pizarra-v1', j); sessionStorage.setItem('seeded', '1'); } }, JSON.stringify(board));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_TUNNEL|Fetch API cannot load|Invalid URL|math fonts could not be loaded/.test(m.text())) errors.push(m.text()); });
  await page.goto('file://' + file);
  await page.waitForFunction(() => !!customElements.get('math-field'));
  await page.waitForTimeout(1200);
  if (process.env.DBG) console.log(errors, await page.evaluate(() => [document.querySelectorAll('#blocks > .blk').length, document.querySelector('#blocks').innerHTML.slice(0,600)]));
  const info = await page.evaluate(() => Array.from(document.querySelectorAll('.sol')).map((s) => {
    const cv = s.querySelector('canvas'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++;
    const vn = s.querySelector('.sol-vn');
    return { painted: n, v: vn ? parseFloat(vn.dataset.v) : NaN, txt: vn && vn.textContent, svg: !!s.querySelector('svg.sol-prof'), err: s.querySelector('.g-err').textContent };
  }));
  const PI = Math.PI;
  const expect = [PI / 3, 2 * PI / 3, PI / 3, 5 * PI / 3, 8 * PI];
  let fail = 0;
  const ok = (c, m) => { if (!c) { fail++; console.log('FALLO:', m); } };
  ok(info.length === 5, 'hay 5 bloques solid (hay ' + info.length + ')');
  info.forEach((x, i) => {
    ok(x.painted > 2000, 'bloque ' + i + ' canvas dibujado (' + x.painted + ' px)');
    ok(x.svg, 'bloque ' + i + ' perfil SVG');
    ok(Math.abs(x.v - expect[i]) < 1e-3, 'bloque ' + i + ' volumen ' + x.v + ' ≈ ' + expect[i]);
    ok(!x.err, 'bloque ' + i + ' sin error: ' + x.err);
  });
  ok(info[0] && info[0].txt === '1,0472', 'V eje X = 1,0472 (' + (info[0] && info[0].txt) + ')');
  ok(info[1] && info[1].txt === '2,0944', 'V eje Y = 2,0944 (' + (info[1] && info[1].txt) + ')');
  // edición: cambiar b desde los controles
  await page.evaluate(() => { const s = document.querySelectorAll('.sol')[0]; const i = s.querySelector('input[aria-label="b"]'); i.value = '2'; i.dispatchEvent(new Event('input')); });
  const v2 = await page.evaluate(() => parseFloat(document.querySelectorAll('.sol')[0].querySelector('.sol-vn').dataset.v));
  ok(Math.abs(v2 - 8 * PI / 3) < 1e-3, 'volumen tras editar b=2: ' + v2);
  // cambio de tema: repinta sin errores
  await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); MatIA.require('blocks/graph3d').redrawers.forEach((f) => f()); });
  await page.waitForTimeout(300);
  await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'light'); MatIA.require('blocks/graph3d').redrawers.forEach((f) => f()); });
  await page.waitForTimeout(300);
  // captura
  const shot = path.join(ROOT, 'docs/img/solido-revolucion.png');
  fs.mkdirSync(path.dirname(shot), { recursive: true });
  const blocks = await page.$$('#blocks > .blk');
  await blocks[4].scrollIntoViewIfNeeded();
  await blocks[4].screenshot({ path: shot });
  ok(!errors.length, 'sin errores de página: ' + errors.join(' | '));
  await browser.close();
  console.log(fail ? 'solid: ' + fail + ' fallo(s)' : 'solid: OK');
  process.exit(fail ? 1 : 0);
})();
