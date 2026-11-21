#!/usr/bin/env node
/* Banco de ejemplos: cada ejemplo de ejemplos/ se abre sin errores y todos sus bloques se dibujan;
   y la ventana «Ejemplos» (temas, buscador, abrir una copia, añadir páginas).
   Uso: node tests/ejemplos.js [--capturas] [id …]
   --capturas genera las miniaturas ejemplos/img/<id>.jpg que muestra la ventana. */
const path = require('path');
const { chromium } = require('playwright');
const URL_ = 'file://' + path.resolve(__dirname, '..', 'index.html');
const TEMAS = ['algebra', 'calculo', 'graficas', 'estadistica', 'geometria', 'discreta', 'presentaciones'];
const fs = require('fs');
const CAPT = process.argv.includes('--capturas');
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const IMG = path.resolve(__dirname, '..', 'ejemplos', 'img');

/* La ventana «Ejemplos» */
async function ui(br, ok, list) {
  const pg = await br.newPage({ viewport: { width: 1300, height: 900 } });
  const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
  pg.on('dialog', (d) => { errs.push('ventana nativa: ' + d.type()); d.dismiss(); });
  await pg.goto(URL_); await pg.waitForFunction(() => !!customElements.get('math-field')); await pg.waitForTimeout(500);
  ok('Ventana: Pío ofrece «Ver ejemplos» en la pizarra vacía', await pg.evaluate(() => !!document.querySelector('.empty-pio .empty-pio-ex')));
  await pg.click('#exBtn'); await pg.waitForTimeout(250);
  ok('Ventana: el botón «Ejemplos» la abre sin pedir carpeta', await pg.evaluate(() => document.getElementById('examples').open && !document.getElementById('ask').open));
  const temas = [...new Set(list.map((e) => e.tema))];
  const tabs = await pg.$$eval('#examples .ex-tab', (t) => t.map((x) => x.dataset.tema));
  ok('Ventana: una pestaña por tema con ejemplos', temas.every((t) => tabs.includes(t)) && tabs[0] === 'todos', tabs.join(','));
  ok('Ventana: «Todos» muestra todas las tarjetas', (await pg.$$eval('#examples .ex-card', (c) => c.length)) === list.length);
  const t0 = list[0].tema;
  await pg.click('#examples .ex-tab[data-tema="' + t0 + '"]');
  ok('Ventana: filtrar por tema', (await pg.$$eval('#examples .ex-card', (c) => c.length)) === list.filter((e) => e.tema === t0).length);
  await pg.click('#examples .ex-tab[data-tema="todos"]');
  await pg.fill('#examples .ex-search', 'zzzz-nada');
  ok('Ventana: el buscador sin resultados lo dice', /No hay ejemplos/.test(await pg.textContent('#examples .ex-grid')));
  const word = list[0].titulo.split(' ')[0];
  await pg.fill('#examples .ex-search', word.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase());
  ok('Ventana: el buscador ignora mayúsculas y tildes', (await pg.$$eval('#examples .ex-card', (c) => c.map((x) => x.dataset.id))).includes(list[0].id));
  await pg.fill('#examples .ex-search', '');
  // abrir con cambios sin guardar: primero pregunta con la ventana de MatIA
  await pg.click('#exClose');
  await pg.waitForTimeout(300); await pg.locator('#blocks math-field').first().click(); await pg.waitForTimeout(300); await pg.keyboard.type('x+1'); await pg.waitForTimeout(400);
  await pg.click('#exBtn'); await pg.waitForTimeout(200);
  await pg.click('#examples .ex-card[data-id="' + list[0].id + '"] .mi-btn--primary'); await pg.waitForTimeout(300);
  ok('Abrir: con cambios sin guardar pregunta antes', await pg.evaluate(() => document.getElementById('ask').open));
  await pg.click('#askActs .mi-btn--danger'); await pg.waitForTimeout(600);
  const st = await pg.evaluate((id) => { const S = MatIA.require('model/board'); const def = MatIA.ejemplos().find((x) => x.id === id); return { title: S.board.title, pages: S.board.pages.length, want: def.board.pages.length, dirty: MatIA.require('storage/dirty').isDirty(), open: document.getElementById('examples').open }; }, list[0].id);
  ok('Abrir: carga el ejemplo y cierra la ventana', st.pages === st.want && !st.open && st.title, JSON.stringify(st));
  ok('Abrir: recién abierto no cuenta como cambio sin guardar', !st.dirty);
  // editar no cambia el original
  await pg.evaluate(() => { const b = MatIA.require('model/board').board.pages[0].blocks[0]; b.v = 'CAMBIADO'; });
  ok('Abrir: es una copia (el original no cambia)', await pg.evaluate((id) => !JSON.stringify(MatIA.ejemplos().find((x) => x.id === id).board).includes('CAMBIADO'), list[0].id));
  // añadir páginas dos veces: sin ids repetidos
  const before = await pg.evaluate(() => MatIA.require('model/board').board.pages.length);
  for (let k = 0; k < 2; k++) { await pg.click('#exBtn'); await pg.waitForTimeout(150); await pg.click('#examples .ex-card[data-id="' + list[0].id + '"] .mi-btn:not(.mi-btn--primary)'); await pg.waitForTimeout(400); }
  const ad = await pg.evaluate(() => { const S = MatIA.require('model/board'); const ids = S.board.pages.flatMap((p) => p.blocks.map((b) => b.id)); return { pages: S.board.pages.length, uniq: new Set(ids).size === ids.length, cur: S.board.cur }; });
  ok('Añadir páginas: se suman a la clase, sin ids repetidos', ad.pages === before + 2 * (await pg.evaluate((id) => MatIA.ejemplos().find((x) => x.id === id).board.pages.length, list[0].id)) && ad.uniq, JSON.stringify(ad));
  ok('Ventana: sin errores', !errs.length, errs.join(' | '));
  await pg.close();
}

(async () => {
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: CAPT ? { width: 1000, height: 700 } : { width: 1300, height: 950 }, deviceScaleFactor: CAPT ? 0.6 : 1 });
  let errs = [];
  pg.on('pageerror', (e) => errs.push(e.message));
  pg.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
  await pg.goto(URL_); await pg.waitForFunction(() => !!customElements.get('math-field')); await pg.waitForTimeout(500);
  const list = await pg.evaluate(() => MatIA.ejemplos().map((e) => ({ id: e.id, tema: e.tema, titulo: e.titulo, resumen: e.resumen })));
  const results = [];
  const ok = (n, c, x) => { results.push(!!c); console.log((c ? 'OK    ' : 'FALLA ') + n + (x ? ' → ' + x : '')); };
  ok('Hay ejemplos registrados', list.length > 0, String(list.length));
  for (const e of list) {
    if (only.length && !only.includes(e.id)) continue;
    errs = [];
    const meta = TEMAS.includes(e.tema) && e.titulo && e.resumen;
    const r = await pg.evaluate(async (id) => {
      const def = MatIA.ejemplos().find((x) => x.id === id);
      const schema = MatIA.require('model/board') && MatIA.require('model/schema');
      const S = MatIA.require('model/board');
      const data = schema.sanitize(JSON.parse(JSON.stringify(def.board)));
      if (!data) return { bad: 'el board no pasa sanitize' };
      const src = def.board.pages.map((p) => (p.blocks || []).length);
      const got = data.pages.map((p) => p.blocks.length);
      S.replace(Object.assign(data, { theme: S.board.theme, accent: S.board.accent, scale: S.board.scale }));
      MatIA.require('ui/view').applySettings();
      const issues = [];
      for (let i = 0; i < S.board.pages.length; i++) {
        S.board.cur = i;
        MatIA.require('blocks/editor').renderPage();
        await new Promise((r) => setTimeout(r, 450));
        document.querySelectorAll('#blocks .g-err').forEach((x) => { if (x.textContent.trim()) issues.push('p' + (i + 1) + ': ' + x.textContent.trim()); });
        document.querySelectorAll('#blocks .fit-warn').forEach(() => issues.push('p' + (i + 1) + ': fórmula que no cabe en la hoja'));
        document.querySelectorAll('#blocks .blk').forEach((el, k) => { if (!el.querySelector('.blk-body') || !el.querySelector('.blk-body').children.length) issues.push('p' + (i + 1) + ' bloque ' + (k + 1) + ' vacío'); });
        document.querySelectorAll('#blocks .g3d canvas, #blocks .sol canvas').forEach((c) => { if (c.width > 8000) issues.push('lienzo 3D gigante'); });
      }
      return { src, got, issues };
    }, e.id);
    const lost = r.bad || JSON.stringify(r.src) !== JSON.stringify(r.got) ? (r.bad || 'bloques perdidos al sanear ' + JSON.stringify(r.src) + ' → ' + JSON.stringify(r.got)) : '';
    if (CAPT) {
      fs.mkdirSync(IMG, { recursive: true });
      await pg.evaluate(() => { const S = MatIA.require('model/board'); S.board.cur = 0; MatIA.require('blocks/editor').renderPage(); });
      await pg.waitForTimeout(700);
      await pg.evaluate(() => { if (document.activeElement) document.activeElement.blur(); document.querySelectorAll('.v3-hint').forEach((h) => h.remove()); });
      await pg.waitForTimeout(150);
      const r0 = await pg.locator('#sheet').boundingBox();
      await pg.screenshot({ path: path.join(IMG, e.id + '.jpg'), type: 'jpeg', quality: 72, clip: { x: r0.x, y: r0.y, width: r0.width, height: Math.min(r0.height, Math.round(r0.width * 9 / 16)) } });
    }
    ok(e.id + ' (' + e.tema + ')', meta && !lost && !(r.issues || []).length && !errs.length, [meta ? '' : 'falta tema/título/resumen', lost, ...(r.issues || []), ...errs].filter(Boolean).join(' | '));
  }
  if (!only.length) await ui(br, ok, list);
  await br.close();
  const bad = results.filter((x) => !x).length;
  console.log(bad ? 'FALLA: ' + bad + ' de ' + results.length + ' comprobaciones.' : 'OK: ' + results.length + ' comprobaciones.');
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
