#!/usr/bin/env node
/* Prueba de las figuras del modo Dibujar (js/ui/drawing.js): forma, tipo de línea, relleno, Mayús, goma,
   deshacer y que se conservan al recargar. Uso: node src/tests/shapes.js   (SHAPES_SHOT=<archivo.png> guarda una captura) */
const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..', '..');
const URL_ = 'file://' + path.join(ROOT, 'pizarra.html');

(async () => {
  const browser = await chromium.launch();
  const results = [];
  const check = (name, ok, extra) => { results.push([name, ok]); console.log((ok ? 'OK   ' : 'FALLA') + ' ' + name + (extra ? ' → ' + extra : '')); };
  const p = await browser.newPage({ viewport: { width: 1100, height: 760 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(URL_); await p.waitForFunction(() => !!customElements.get('math-field')); await p.waitForTimeout(300);
  await p.click('.mode-seg button:nth-child(2)');
  check('Las opciones de figura no se ven con el lápiz', !(await p.isVisible('#shapeOpts')));
  await p.click('[data-tool="shape"]');
  check('Con «Figuras» aparecen forma, línea y relleno', (await p.isVisible('[data-shape="ellipse"]')) && (await p.isVisible('[data-dash="dot"]')) && (await p.isVisible('[data-fill="soft"]')));
  const sh = await p.locator('#sheet').boundingBox();
  const drag = async (x0, y0, x1, y1, shift) => {
    await p.mouse.move(sh.x + x0, sh.y + y0); await p.mouse.down();
    if (shift) await p.keyboard.down('Shift');
    await p.mouse.move(sh.x + (x0 + x1) / 2, sh.y + (y0 + y1) / 2); await p.mouse.move(sh.x + x1, sh.y + y1);
    await p.mouse.up(); if (shift) await p.keyboard.up('Shift');
  };
  const strokes = () => p.evaluate(() => MatIA.require('model/board').page().strokes.map((s) => ({ tool: s.tool, shape: s.shape, dash: s.dash, fill: s.fill, pts: s.pts })));

  await p.click('[data-shape="rect"]'); await p.click('[data-dash="dash"]'); await p.click('[data-fill="soft"]');
  await drag(100, 120, 300, 220);
  let st = await strokes();
  check('Rectángulo discontinuo con relleno suave', st.length === 1 && st[0].tool === 'shape' && st[0].shape === 'rect' && st[0].dash === 'dash' && st[0].fill === 'soft', JSON.stringify(st[0]));
  await p.click('[data-shape="ellipse"]'); await p.click('[data-dash="solid"]'); await p.click('[data-fill="none"]');
  await drag(400, 120, 520, 180, true);
  st = await strokes();
  const e = st[1], w = Math.abs(e.pts[1][0] - e.pts[0][0]), h = Math.abs(e.pts[1][1] - e.pts[0][1]);
  check('Mayús hace un círculo (ancho = alto)', e.shape === 'ellipse' && Math.abs(w - h) < 0.5, w + '×' + h);
  await p.click('[data-shape="line"]'); await drag(100, 300, 300, 320, true);
  st = await strokes();
  check('Mayús deja el segmento horizontal (45°)', Math.abs(st[2].pts[1][1] - st[2].pts[0][1]) < 0.5);
  await drag(600, 300, 601, 301);
  check('Un clic sin arrastrar no crea figura', (await strokes()).length === 3);
  await p.click('[data-tool="arrow"]');
  check('Con «Flecha» solo se ve el tipo de línea', (await p.isVisible('[data-dash="dot"]')) && !(await p.isVisible('[data-shape="rect"]')));
  await p.click('[data-dash="dot"]'); await drag(100, 400, 300, 400);
  st = await strokes();
  check('Flecha punteada', st[3].tool === 'arrow' && st[3].dash === 'dot');

  // goma: dentro del rectángulo relleno (lo borra); dentro del círculo sin relleno no (solo su contorno)
  await p.click('[data-tool="eraser"]');
  await drag(460, 150, 461, 151);
  check('La goma no borra un círculo sin relleno tocando su interior', (await strokes()).length === 4);
  await drag(200, 170, 201, 171);
  st = await strokes();
  check('La goma borra una figura rellena tocando su interior', st.length === 3 && !st.some((s) => s.shape === 'rect'));
  await p.click('#undoBtn');
  check('Deshacer recupera la figura borrada', (await strokes()).some((s) => s.shape === 'rect'));

  if (process.env.SHAPES_SHOT) await p.screenshot({ path: process.env.SHAPES_SHOT });
  await p.waitForTimeout(400);
  await p.reload(); await p.waitForFunction(() => !!customElements.get('math-field')); await p.waitForTimeout(300);
  st = await strokes();
  const b = await p.evaluate(() => { const x = MatIA.require('model/board').board; return [x.tool, x.shape, x.dash, x.fill].join(','); });
  check('Al recargar se conservan las figuras y sus opciones', st.length === 4 && st.some((s) => s.shape === 'rect' && s.dash === 'dash' && s.fill === 'soft'), JSON.stringify(st.map((s) => s.shape || s.tool)));
  check('…y la herramienta elegida', b === 'eraser,line,dot,none', b);
  const bad = await p.evaluate(() => MatIA.require('model/schema').sanitize({ pages: [{ blocks: [], strokes: [{ tool: 'shape', shape: 'estrella', pts: [[0, 0], [1, 1]] }, { tool: 'shape', shape: 'rect', pts: [[0, 0], [9, 9]] }] }] }).pages[0].strokes.length);
  check('Una figura desconocida en un archivo se descarta', bad === 1);
  check('Sin errores de JavaScript', errs.length === 0, errs.join(' | '));

  await browser.close();
  const fails = results.filter((r) => !r[1]);
  console.log(fails.length ? '\n' + fails.length + ' FALLOS' : '\nOK: ' + results.length + ' comprobaciones');
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
