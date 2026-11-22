#!/usr/bin/env node
/* Prueba del bloque «texto enriquecido» (js/blocks/text.js, js/ui/text-format.js, css/text.css).
   Uso: node src/tests/text.js [pizarra.html]
   Si pizarra.html aún no carga js/blocks/text.js, se crea una copia temporal con <base> y los scripts/estilos añadidos. */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..', '..');
const SCRATCH = '/tmp/claude-0/-home-user-MatIA-Pizarra/01dbf8ae-b7ca-56a2-a637-356d3606271a/scratchpad';

function pageFile(name) {
  const src = path.resolve(ROOT, name || 'pizarra.html');
  let html = fs.readFileSync(src, 'utf8');
  if (html.includes('src/js/blocks/text.js')) return src; // ya integrado
  html = html.replace('<head>', '<head>\n<base href="file://' + ROOT + '/">')
    .replace('<link rel="stylesheet" href="src/css/print.css">', '<link rel="stylesheet" href="src/css/text.css">\n<link rel="stylesheet" href="src/css/print.css">')
    .replace('<script src="src/js/model/board.js"></script>', '<script src="src/js/blocks/text.js"></script>\n<script src="src/js/model/board.js"></script>')
    .replace('<script src="src/js/app/start.js"></script>', '<script src="src/js/ui/text-format.js"></script>\n<script src="src/js/app/start.js"></script>');
  fs.mkdirSync(SCRATCH, { recursive: true });
  const out = path.join(SCRATCH, 'index-text.html');
  fs.writeFileSync(out, html);
  return out;
}

(async () => {
  const file = pageFile(process.argv[2]);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/mathlive@[^/]+\//, (r) => {
    const f = path.join(ROOT, 'src/vendor/mathlive', new URL(r.request().url()).pathname.replace(/^\/npm\/mathlive@[^/]+\//, ''));
    return fs.existsSync(f) ? r.fulfill({ path: f }) : r.fulfill({ status: 404, body: '' });
  });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ body: '', contentType: 'text/css' }));
  const board = { v: 1, cur: 0, pages: [{ strokes: [], minH: 0, blocks: [{ type: 'text', v: 'hola' }, { type: 'text', v: 'segunda' }] }] };
  await ctx.addInitScript((j) => { if (!localStorage.getItem('matia-pizarra-v1')) localStorage.setItem('matia-pizarra-v1', j); }, JSON.stringify(board));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_TUNNEL|Fetch API cannot load|Invalid URL|math fonts could not be loaded/.test(m.text())) errors.push(m.text()); });
  let fail = 0;
  const ok = (c, m) => { if (!c) { fail++; console.log('FALLO:', m); } };
  const load = async () => { await page.goto('file://' + file); await page.waitForFunction(() => !!customElements.get('math-field') && MatIA.require('ui/state').mlReady); await page.waitForTimeout(500); };
  await load();

  // --- saneador ---
  const dirty = '<p onclick="x()">a<script>alert(1)</script><b>b</b><img src=x onerror="alert(2)"><a href="http://e.com" style="color:red">enlace</a><span style="color:red" class="tf-c1 evil">c</span><strong>d</strong><em>e</em><strike>f</strike><blockquote style="margin:0 0 0 40px">g</blockquote><math-field>zz</math-field><span class="math-inline" data-latex="x^2" onclick="y()">junk</span></p>';
  const clean = await page.evaluate((d) => MatIA.require('blocks/text').sanitize(d), dirty);
  ok(!/script|onerror|onclick|style|href|<a|<img|alert|zz|junk|evil/.test(clean), 'saneador elimina lo peligroso: ' + clean);
  ok(/enlace/.test(clean), 'el saneador conserva el texto del enlace');
  ok(/<span class="tf-c1">c<\/span>/.test(clean) && /<b>d<\/b>/.test(clean) && /<i>e<\/i>/.test(clean) && /<s>f<\/s>/.test(clean), 'normaliza etiquetas y clases: ' + clean);
  ok(/<div class="tf-indent-1">g<\/div>/.test(clean) && /<span class="math-inline" data-latex="x\^2"><\/span>/.test(clean), 'sangría y fórmula en línea: ' + clean);

  // --- edición con la barra ---
  const t0 = page.locator('#blocks .blk-text').first();
  await t0.click();
  ok(await page.locator('.tf-bar').isVisible(), 'la barra aparece al enfocar el texto');
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Control+B');
  await page.locator('.tf-bar button[title="Color del texto"]').click();
  await page.locator('.tf-bar button[title="Azul"]').click();
  await page.locator('.tf-bar select[aria-label="Tipo de letra"]').selectOption('hand');
  await page.locator('.tf-bar button[title="Subrayado (Ctrl+U)"]').click();
  await page.locator('.tf-bar button[title="Lista con viñetas"]').click();
  await page.locator('.tf-bar button[title="Centrar"]').click();
  await page.keyboard.press('Control+End');
  await page.waitForTimeout(300);
  await page.locator('.tf-bar button[title="Insertar fórmula en el texto"]').click();
  await page.waitForTimeout(400);
  await page.keyboard.type('x^2');
  await page.waitForTimeout(500);
  const saved = await page.evaluate(() => { const b = JSON.parse(localStorage.getItem('matia-pizarra-v1')); return b.pages[0].blocks[0]; });
  const h = saved.html || '';
  ok(/<b>/.test(h) || /<b>/.test(h.replace(/<\/?(?!b>)[^>]*>/g, '')), 'html contiene negrita: ' + h);
  ok(/tf-c2/.test(h), 'html contiene color: ' + h);
  ok(/tf-f-hand/.test(h), 'html contiene fuente manuscrita: ' + h);
  ok(/<ul>/.test(h) && /<li/.test(h), 'html contiene lista: ' + h);
  ok(/tf-al-center/.test(h), 'html contiene alineación: ' + h);
  ok(/<span class="math-inline" data-latex="x\^?[^"]*"><\/span>/.test(h) && !/data-latex=""/.test(h), 'html contiene fórmula en línea con latex: ' + h);
  ok(!/style=|<font|math-field/.test(h), 'html sin style/font/math-field: ' + h);
  if (process.env.DBG) console.log(JSON.stringify(saved));
  ok(saved.v.startsWith('hola'), 'v conserva el texto plano: ' + saved.v);

  // --- recarga ---
  await load();
  if (process.env.DBG) console.log(await page.evaluate(() => [document.querySelector('#blocks .blk-text').outerHTML, localStorage.getItem('matia-pizarra-v1').slice(0,400)]));
  const t = await page.evaluate(() => {
    const el = document.querySelector('#blocks .blk-text');
    const mi = el.querySelector('.math-inline');
    return { b: !!el.querySelector('b'), c: !!el.querySelector('.tf-c2'), f: getComputedStyle(el.querySelector('.tf-f-hand')).fontFamily, ul: !!el.querySelector('ul li'),
      al: getComputedStyle(el.querySelector('.tf-al-center') || el).textAlign, mf: !!(mi && mi.querySelector('math-field[data-aux]')), latex: mi && mi.getAttribute('data-latex'),
      col: getComputedStyle(el.querySelector('.tf-c2')).color, bw: getComputedStyle(el.querySelector('b')).fontWeight };
  });
  ok(t.b && t.c && t.ul, 'tras recargar se ven negrita, color y lista: ' + JSON.stringify(t));
  ok(/Caveat/.test(t.f), 'tras recargar la fuente es Caveat: ' + t.f);
  ok(t.al === 'center', 'tras recargar la alineación es centro: ' + t.al);
  ok(t.mf && /x/.test(t.latex || ''), 'tras recargar la fórmula en línea es un math-field: ' + JSON.stringify(t));
  ok(t.col !== 'rgb(20, 32, 26)', 'color distinto de la tinta: ' + t.col);

  // --- Enter en texto normal crea línea nueva ---
  const n0 = await page.locator('#blocks > .blk').count();
  await page.evaluate(() => document.querySelectorAll('#blocks .blk-text')[1].focus());
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  ok(await page.locator('#blocks > .blk').count() === n0 + 1, 'Enter en texto normal crea línea nueva');
  // Enter dentro de lista: elemento nuevo, sin línea nueva
  await page.evaluate(() => document.querySelectorAll('#blocks .blk-text')[0].focus());
  await page.keyboard.press('Control+End');
  const n1 = await page.locator('#blocks > .blk').count();
  const li0 = await page.locator('#blocks .blk-text').first().locator('li').count();
  const inList = await page.evaluate(() => { const s = getSelection(); const n = s.anchorNode; return !!(n && (n.nodeType === 1 ? n : n.parentNode).closest('li')); });
  ok(inList, 'el cursor está dentro de la lista');
  if (inList) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    ok(await page.locator('#blocks > .blk').count() === n1, 'Enter en lista no crea línea');
    ok(await page.locator('#blocks .blk-text').first().locator('li').count() === li0 + 1, 'Enter en lista crea elemento');
  }
  // atajo + clases sin style
  ok(!(await page.evaluate(() => /style=/.test(JSON.stringify(JSON.parse(localStorage.getItem('matia-pizarra-v1')).pages[0].blocks.map((b) => b.html))))), 'no se guarda style');
  // barra oculta al salir
  await page.evaluate(() => document.querySelectorAll('#blocks .blk-text')[1].focus());
  await page.mouse.click(5, 5);
  await page.waitForTimeout(200);
  ok(!(await page.locator('.tf-bar').isVisible()), 'la barra se oculta al salir del texto');
  ok(!errors.length, 'sin errores de página: ' + errors.join(' | '));
  await browser.close();
  console.log(fail ? 'text: ' + fail + ' fallo(s)' : 'text: OK');
  process.exit(fail ? 1 : 0);
})();
