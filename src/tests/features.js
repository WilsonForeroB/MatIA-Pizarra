#!/usr/bin/env node
/* Prueba de las correcciones y funcionalidades de la segunda ronda:
   gráfica 2D (lista de funciones, texto plano sin/ln, x^(1/2), sin zoom con la rueda, panel de zoom),
   explicación en la línea, Desarrollo desde cualquier línea, color de selección,
   integrales en Calcular y en Operaciones, y sólido de revolución desde el menú Gráficos.
   Uso: node src/tests/features.js */
const path = require('path');
const { chromium } = require('playwright');
const URL_ = 'file://' + path.resolve(__dirname, '..', '..', 'pizarra.html');

(async () => {
  const br = await chromium.launch();
  const results = [];
  const ok = (name, cond, extra) => { results.push(!!cond); console.log((cond ? 'OK    ' : 'FALLA ') + name + (extra ? ' → ' + extra : '')); };
  const fresh = async () => {
    const ctx = await br.newContext({ viewport: { width: 1200, height: 1000 } });
    const pg = await ctx.newPage();
    const errs = [];
    pg.on('pageerror', (e) => errs.push(e.message));
    pg.on('dialog', (d) => { errs.push('ventana nativa: ' + d.type()); d.dismiss(); });
    await pg.goto(URL_);
    await pg.waitForFunction(() => !!customElements.get('math-field'));
    await pg.waitForTimeout(500);
    return { ctx, pg, errs };
  };
  const setLine = (pg, latex) => pg.evaluate((v) => { const mf = document.querySelector('#blocks .blk math-field:not([data-aux])'); mf.focus(); mf.setValue(v); mf.dispatchEvent(new Event('input', { bubbles: true })); }, latex);
  const saved = (pg) => pg.evaluate(() => JSON.parse(localStorage.getItem('matia-pizarra-v1')).pages[0].blocks);

  // ---- Gráfica 2D ----
  {
    const { ctx, pg, errs } = await fresh();
    await pg.click('[data-pop="grafPop"]'); await pg.click('[data-graf="2d"]');
    await pg.waitForSelector('.graph .g-fn');
    await pg.click('.g-fn-add');
    const mf = pg.locator('.g-fn-field').nth(1); await mf.focus();
    await pg.keyboard.type('sin(x)', { delay: 30 }); await pg.waitForTimeout(250);
    ok('Gráfica: escribir sin(x) en la lista da \\sin', /\\sin/.test(await mf.evaluate((e) => e.value)));
    ok('Gráfica: dos funciones en el mismo plano', await pg.$$eval('.g-curve', (c) => c.length === 2 && c.every((p) => (p.getAttribute('d') || '').length > 20)));
    await pg.click('.g-fn-add'); await pg.locator('.g-fn-field').nth(2).evaluate((e) => { e.setValue('\\ln x'); e.dispatchEvent(new Event('input')); });
    await pg.click('.g-fn-add'); await pg.locator('.g-fn-field').nth(3).evaluate((e) => { e.setValue('x^{\\frac{1}{2}}'); e.dispatchEvent(new Event('input')); });
    await pg.waitForTimeout(250);
    ok('Gráfica: ln x y x^(1/2) se dibujan sin aviso', (await pg.$$eval('.g-curve', (c) => c.length)) === 4 && !(await pg.textContent('.graph .g-err')).trim(), await pg.textContent('.graph .g-err'));
    const rng = () => pg.evaluate(() => [...document.querySelectorAll('.g-range input')].map((i) => i.value));
    const r0 = await rng();
    await pg.locator('.graph svg').first().hover(); await pg.mouse.wheel(0, 400); await pg.waitForTimeout(200);
    ok('Gráfica: la rueda no hace zoom', JSON.stringify(r0) === JSON.stringify(await rng()));
    const btn = (t) => pg.click('.g-zoom [aria-label="' + t + '"]');
    await btn('Acercar'); const r1 = await rng();
    ok('Gráfica: «Acercar» cambia el rango', r1[0] !== r0[0]);
    await btn('Desplazar a la izquierda'); const r2 = await rng();
    ok('Gráfica: «←» desplaza', r2[0] !== r1[0]);
    await btn('Ajustar al rango automático'); const r3 = await rng();
    ok('Gráfica: «Ajustar» vuelve al rango automático', r3[0] === '-5' && r3[1] === '5' && r3[2] === '', r3.join(','));
    ok('Gráfica: sin errores', !errs.length, errs.join(' | '));
    await ctx.close();
  }

  // ---- Explicación, Desarrollo y selección ----
  {
    const { ctx, pg, errs } = await fresh();
    await setLine(pg, 'x^2+1');
    await pg.click('#blocks .blk .blk-note-btn'); await pg.keyboard.type('Planteamiento'); await pg.keyboard.press('Enter'); await pg.waitForTimeout(500);
    const b0 = (await saved(pg))[0];
    ok('Explicación: en la misma línea, sin crear otra', (await pg.locator('#blocks > .blk').count()) === 1 && b0.note === 'Planteamiento');
    const css = await pg.evaluate(() => ({ sel: getComputedStyle(document.querySelector('#blocks math-field')).getPropertyValue('--selection-background-color').trim(), soft: getComputedStyle(document.body).getPropertyValue('--accent-soft').trim() }));
    ok('Selección: color distinto del verde de la línea activa', css.sel && css.sel !== css.soft, css.sel + ' vs ' + css.soft);
    await pg.click('#blocks .blk math-field'); await pg.click('#derivBtn'); await pg.waitForTimeout(400);
    const b1 = (await saved(pg))[0];
    ok('Desarrollo: convierte una línea sin «=» y conserva la explicación', b1.type === 'deriv' && b1.rows[0].l === 'x^2+1' && b1.rows[0].note === 'Planteamiento');
    ok('Explicación/Desarrollo: sin errores', !errs.length, errs.join(' | '));
    await ctx.close();
  }

  // ---- Integrales ----
  {
    const { ctx, pg, errs } = await fresh();
    await setLine(pg, '\\int_{0}^{1}x^2\\,dx=');
    await pg.click('#calcBtn'); await pg.waitForTimeout(500);
    const v = (await saved(pg))[0].v;
    ok('Calcular: ∫₀¹ x² dx = 1/3', /=\\frac\{1\}\{3\}$/.test(v), v);
    await setLine(pg, '\\int\\sin(2x)\\,dx');
    await pg.click('#calcBtn'); await pg.waitForTimeout(500);
    const v2 = (await saved(pg))[0].v;
    ok('Calcular: ∫ sin(2x) dx da primitiva + C', /\\cos/.test(v2) && /\+C$/.test(v2), v2);
    await setLine(pg, '\\int_{0}^{\\pi}\\sin x\\,dx');
    await pg.evaluate(() => MatIA.require('ui/ops-menu').runOp('integral'));
    await pg.waitForTimeout(600);
    const bl = await saved(pg);
    ok('Operaciones: «Integral paso a paso» crea un desarrollo', bl.some((x) => x.type === 'deriv' && x.rows.some((r) => /2/.test(r.r) && r.boxed)), JSON.stringify(bl.map((x) => x.type)));
    ok('Integrales: sin errores', !errs.length, errs.join(' | '));
    await ctx.close();
  }

  // ---- Sólido de revolución desde el menú ----
  {
    const { ctx, pg, errs } = await fresh();
    await setLine(pg, 'f(x)=x');
    await pg.click('[data-pop="grafPop"]'); await pg.click('[data-graf="solid"]');
    await pg.waitForSelector('.sol canvas'); await pg.waitForTimeout(500);
    const bl = await saved(pg);
    const s = bl.find((x) => x.type === 'solid');
    ok('Sólido: se inserta desde Gráficos ▾ con la función de la línea', s && s.fn === 'f(x)=x', s && s.fn);
    ok('Sólido: muestra el volumen', /V\s*=|volumen/i.test(await pg.textContent('.sol')));
    ok('Sólido: sin errores', !errs.length, errs.join(' | '));
    await ctx.close();
  }

  // ---- Correcciones de la revisión (sólidos, exportar, tema, símbolos en campos auxiliares, I=∫) ----
  {
    const { ctx, pg, errs } = await fresh();
    await pg.evaluate(() => { localStorage.setItem('matia-pizarra-v1', JSON.stringify({ pages: [{ blocks: [
      { type: 'solid', fn: 'f(x)=1', a: -1, b: 1, axis: 'y' },
      { type: 'solid', fn: 'f(x)=x', a: 0, b: 1, axis: 'y=k', k: 1.5 },
      { type: 'graph', fns: ['f(x)=x'], xmin: -5, xmax: 5 },
      { type: 'math', v: 'I=\\int_{0}^{1}x\\,dx=' } ], strokes: [] }] })); });
    await pg.reload(); await pg.waitForFunction(() => !!customElements.get('math-field')); await pg.waitForTimeout(1200);
    const vols = await pg.$$eval('.sol-num', (e) => e.map((x) => x.textContent));
    ok('Sólido: eje dentro de [a, b] no cuenta dos veces (cilindro r=1, h=1 → π)', /3,1416/.test(vols[0]), vols[0]);
    ok('Sólido: eje y = k usa «discos»', /discos/.test(vols[1]) && !/arandelas/.test(vols[1]), vols[1]);
    const lx = await pg.$$eval('.sol-int', (e) => e.map((x) => x.value || x.textContent));
    ok('Sólido: coma decimal escapada en la integral', /1\{,\}5/.test(lx[1]), lx[1]);
    ok('Sólido: se repinta al cambiar el tema', await pg.evaluate(() => MatIA.require('blocks/graph3d').redrawers.size >= 2));
    const [dl] = await Promise.all([
      pg.waitForEvent('download', { timeout: 8000 }).catch(() => null),
      (async () => { await pg.locator('#blocks > .blk').nth(0).locator('.blk-exp').click(); await pg.click('#expPop [data-exp="png"]'); })(),
    ]);
    ok('Sólido: exportar PNG descarga la imagen', dl && /solido-revolucion.*\.png$/.test(dl.suggestedFilename()), dl ? dl.suggestedFilename() : await pg.textContent('#toast'));
    await pg.locator('.graph .g-fn-field').first().focus();
    await pg.evaluate(() => MatIA.require('ui/templates').insertLatex('\\pi'));
    await pg.waitForTimeout(600); // el autoguardado espera 350 ms
    const bl = await saved(pg);
    ok('Símbolos: se insertan en el campo de la gráfica, sin crear línea', bl.length === 4 && /\\pi/.test(bl[2].fns[0]), JSON.stringify(bl[2].fns));
    await pg.locator('#blocks > .blk').nth(3).locator('math-field').click(); await pg.waitForTimeout(250); // MathLive toma el foco con un pequeño retardo
    await pg.click('#calcBtn'); await pg.waitForTimeout(500);
    const v = (await saved(pg))[3].v;
    ok('Calcular: integral con nombre delante (I=∫…)', /=\\frac\{1\}\{2\}$/.test(v), v);
    ok('Correcciones: sin errores', !errs.length, errs.join(' | '));
    await ctx.close();
  }

  await br.close();
  const bad = results.filter((r) => !r).length;
  console.log(bad ? 'FALLA: ' + bad + ' de ' + results.length + ' comprobaciones.' : 'OK: ' + results.length + ' comprobaciones.');
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
