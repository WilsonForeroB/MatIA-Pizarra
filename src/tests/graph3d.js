#!/usr/bin/env node
/* Gráficas 3D y ayuda de las gráficas: girar no deja el dibujo en blanco, varias superficies,
   botones y teclado para mover la vista, centrar el bloque y ayuda visible en 2D y 3D.
   Uso: node src/tests/graph3d.js */
const path = require('path');
const { chromium } = require('playwright');
const URL_ = 'file://' + path.resolve(__dirname, '..', '..', 'pizarra.html');

(async () => {
  const br = await chromium.launch();
  const results = [];
  const ok = (n, c, x) => { results.push(!!c); console.log((c ? 'OK    ' : 'FALLA ') + n + (x !== undefined ? ' → ' + x : '')); };
  const open = async (board) => {
    const pg = await br.newPage({ viewport: { width: 1300, height: 950 } });
    const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
    await pg.goto(URL_); await pg.waitForFunction(() => !!customElements.get('math-field'));
    await pg.evaluate((b) => localStorage.setItem('matia-pizarra-v1', JSON.stringify(b)), board);
    await pg.reload(); await pg.waitForFunction(() => !!customElements.get('math-field')); await pg.waitForTimeout(900);
    return { pg, errs };
  };
  const blk = (pg, i) => pg.evaluate((i) => MatIA.require('model/board').board.pages[0].blocks[i], i);
  const canvasInfo = (pg) => pg.evaluate(() => {
    const c = document.querySelector('.g3d canvas');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++;
    return { ratio: c.width / c.clientWidth, painted: n };
  });

  // archivo antiguo (solo «fn»), sin alinear
  const { pg, errs } = await open({ pages: [{ blocks: [{ type: 'math', v: 'a' }, { type: 'graph3d', fn: 'z=x^2-y^2', xmin: -3, xmax: 3, ymin: -3, ymax: 3, az: -0.8, el: 0.55, zoom: 1 }], strokes: [] }] });
  let ci = await canvasInfo(pg);
  ok('3D: se dibuja al abrir', ci.painted > 5000 && ci.ratio < 4, JSON.stringify(ci));
  ok('3D: un archivo antiguo con «fn» se abre como lista de superficies', JSON.stringify((await blk(pg, 1)).fns) === '["z=x^2-y^2"]');
  ok('3D: ayuda visible con «+ Añadir superficie»', await pg.evaluate(() => { const h = document.querySelector('.g3d .g-help'); return !!h && h.offsetParent !== null && /varias|superficies juntas/.test(h.textContent) && !!document.querySelector('.g3d .g-fn-add'); }));
  ok('3D: aviso «Arrastra para girar» sobre el dibujo', await pg.evaluate(() => !!document.querySelector('.g3d .v3-hint')));

  // girar arrastrando: el lienzo no se dispara de tamaño ni queda en blanco
  const bb = await pg.locator('.g3d canvas').boundingBox();
  const az0 = (await blk(pg, 1)).az;
  await pg.mouse.move(bb.x + 200, bb.y + 200); await pg.mouse.down();
  await pg.mouse.move(bb.x + 320, bb.y + 250, { steps: 10 }); await pg.mouse.up(); await pg.waitForTimeout(300);
  ci = await canvasInfo(pg);
  ok('3D: tras girar sigue dibujado (no queda en blanco)', ci.painted > 5000 && ci.ratio < 4, JSON.stringify(ci));
  ok('3D: el giro cambia y se guarda', Math.abs((await blk(pg, 1)).az - az0) > 0.5);
  ok('3D: el aviso de arrastrar desaparece tras girar', await pg.evaluate(() => !document.querySelector('.g3d .v3-hint')));
  ok('3D: al tocar el dibujo, su línea queda activa', await pg.evaluate(() => !!document.querySelector('.blk.is-active .g3d')));

  // centrar el bloque
  await pg.click('#alignSeg [data-align=center]'); await pg.waitForTimeout(250);
  const m = await pg.evaluate(() => { const g = document.querySelector('.g3d').getBoundingClientRect(), s = document.querySelector('.g3d').closest('.blk-body').getBoundingClientRect(); return [g.left - s.left, s.right - g.right]; });
  ok('3D: «Centro» centra el dibujo', (await blk(pg, 1)).align === 'center' && m[0] > 20 && Math.abs(m[0] - m[1]) < 3, m.map(Math.round).join(' / '));

  // botones de vista y teclado
  await pg.click('.g3d .v3-zin'); await pg.click('.g3d .v3-right'); await pg.click('.g3d .v3-up');
  let b = await blk(pg, 1);
  ok('3D: botones acercar, girar e inclinar', b.zoom > 1.1 && b.el > 0.6);
  await pg.click('.g3d .v3-home'); b = await blk(pg, 1);
  ok('3D: «⌂» vuelve a la vista inicial', b.az === -0.8 && b.el === 0.55 && b.zoom === 1);
  await pg.locator('.g3d canvas').focus(); await pg.keyboard.press('ArrowLeft'); await pg.keyboard.press('+');
  b = await blk(pg, 1);
  ok('3D: teclado (flechas y +) sobre el dibujo', b.az < -0.8 && b.zoom > 1);
  ok('3D: las flechas no cambian de línea', await pg.evaluate(() => document.activeElement.tagName === 'CANVAS'));

  // varias superficies
  await pg.click('.g3d .g-fn-add'); await pg.waitForTimeout(150);
  await pg.keyboard.type('z=x+y'); await pg.waitForTimeout(400);
  b = await blk(pg, 1);
  ok('3D: «+ Añadir superficie» pone el cursor en la nueva y se guarda', b.fns.length === 2 && /x\+y/.test(b.fns[1]), JSON.stringify(b.fns));
  ok('3D: leyenda con las dos superficies', await pg.evaluate(() => document.querySelectorAll('.g3d .g-legend span').length === 2));
  ci = await canvasInfo(pg);
  ok('3D: dibuja las dos superficies', ci.painted > 5000, JSON.stringify(ci));
  await pg.click('.g3d .g-fn-rm >> nth=1'); await pg.waitForTimeout(200);
  b = await blk(pg, 1);
  ok('3D: quitar una superficie', b.fns.length === 1 && b.fn === 'z=x^2-y^2', JSON.stringify(b.fns));

  // texto plano como en 2D
  await pg.evaluate(() => { const x = MatIA.require('model/board').board.pages[0].blocks[1]; x.fns = ['z=sin(x)*cos(y)']; x.fn = x.fns[0]; MatIA.require('blocks/editor').renderPage(); });
  await pg.waitForTimeout(500);
  ok('3D: acepta sin(x)*cos(y) escrito como texto', (await pg.textContent('.g3d .g-err')) === '' && (await canvasInfo(pg)).painted > 5000);
  ok('3D: sin errores de página', !errs.length, errs.join(' | '));
  await pg.close();

  // 2D: ayuda y añadir función; insertar desde «Gráficos» sale centrado
  {
    const { pg, errs } = await open({ pages: [{ blocks: [{ type: 'math', v: 'f(x)=x^2' }], strokes: [] }] });
    await pg.locator('#blocks math-field').first().click();
    await pg.click('[data-pop="grafPop"]'); await pg.click('[data-graf="2d"]'); await pg.waitForTimeout(400);
    ok('2D: ayuda visible que dice que caben varias funciones', await pg.evaluate(() => { const h = document.querySelector('.graph .g-help'); return !!h && /varias funciones/.test(h.textContent); }));
    ok('2D: la gráfica nueva sale centrada', (await blk(pg, 1)).align === 'center');
    await pg.click('.graph .g-fn-add'); await pg.waitForTimeout(150); await pg.keyboard.type('sin(x)'); await pg.waitForTimeout(300);
    ok('2D: «+ Añadir función» pone el cursor en la nueva', /sin/.test((await blk(pg, 1)).fns[1] || ''), JSON.stringify((await blk(pg, 1)).fns));
    await pg.locator('#blocks > .blk').nth(0).locator('math-field').first().click();
    await pg.click('[data-pop="grafPop"]'); await pg.click('[data-graf="3d"]'); await pg.waitForTimeout(500);
    const g = await pg.evaluate(() => MatIA.require('model/board').board.pages[0].blocks.find((x) => x.type === 'graph3d'));
    ok('3D: el dibujo nuevo sale centrado y con lista de superficies', g && g.align === 'center' && Array.isArray(g.fns) && g.fns.length === 1);
    await pg.click('[data-pop="grafPop"]'); await pg.click('[data-graf="solid"]'); await pg.waitForTimeout(500);
    ok('Sólido: tiene el mismo panel para mover la vista', await pg.evaluate(() => !!document.querySelector('.sol .v3-pad .v3-home')));
    ok('2D: sin errores de página', !errs.length, errs.join(' | '));
    await pg.close();
  }

  // impresión: sin panel ni ayuda
  {
    const { pg } = await open({ pages: [{ blocks: [{ type: 'graph3d', fns: ['z=x^2', 'z=-x^2'], xmin: -3, xmax: 3, ymin: -3, ymax: 3, az: -0.8, el: 0.55, zoom: 1 }], strokes: [] }] });
    await pg.evaluate(() => { window.print = () => { window.__printed = 1; }; MatIA.require('ui/print').printAll(); });
    await pg.waitForFunction(() => window.__printed === 1, null, { timeout: 10000 }).catch(() => {});
    const r = await pg.evaluate(() => ({ pad: document.querySelectorAll('#print-root .v3-pad, #print-root .g-help, #print-root .v3-hint').length, legend: document.querySelectorAll('#print-root .g3d .g-legend span').length }));
    ok('Imprimir: sin botones ni ayuda, con leyenda de las superficies', r.pad === 0 && r.legend === 2, JSON.stringify(r));
    await pg.close();
  }

  await br.close();
  const bad = results.filter((r) => !r).length;
  console.log(bad ? 'FALLA: ' + bad + ' de ' + results.length + ' comprobaciones.' : 'OK: ' + results.length + ' comprobaciones.');
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
