#!/usr/bin/env node
/* Prueba de Historial → Exportar / Importar clases entre dos ordenadores (carpetas simuladas).
   Comprueba la selección, que se exportan solo las imágenes que usan las clases elegidas y que al importar
   se revisan los nombres: idénticas (aunque con otro nombre) se saltan, nombre repetido → «_importada», mismo título → aviso.
   Uso: node src/tests/history-transfer.js   (MIG_SHOTS=<carpeta> guarda capturas) */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { chromium } = require('playwright');
const { MOCK } = require('./lib/fs-mock');
const ROOT = path.resolve(__dirname, '..', '..');
const URL_ = 'file://' + path.join(ROOT, 'pizarra.html');
const SHOTS = process.env.MIG_SHOTS;

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const clase = (t, v, extra = {}) => JSON.stringify(Object.assign({ app: 'MatIA Pizarra', formato: 1, guardado: '2026-01-01T10:00:00Z', title: t, pages: [{ blocks: [{ type: 'math', v }], strokes: [] }] }, extra));
const conImagen = JSON.stringify({ app: 'MatIA Pizarra', formato: 1, title: 'Con foto', pages: [{ blocks: [{ type: 'image', src: 'imagenes/usada1.png', w: 50 }], strokes: [] }] });

(async () => {
  const browser = await chromium.launch();
  const results = [];
  const check = (name, ok, extra) => { results.push([name, ok]); console.log((ok ? 'OK   ' : 'FALLA') + ' ' + name + (extra ? ' → ' + extra : '')); };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'matia-hist-'));
  const open = async (p) => {
    await p.goto(URL_); await p.waitForFunction(() => !!customElements.get('math-field'));
    await p.click('#histBtn'); await p.waitForTimeout(200);
    await p.click('#histConnect'); await p.click('#askActs .mi-btn--primary'); await p.waitForTimeout(400);
  };
  let pkgSel, pkgAll;

  // ---- PC 1: exportar ----
  {
    const ctx = await browser.newContext({ acceptDownloads: true });
    await ctx.addInitScript(MOCK, { name: 'Ejercicios', files: [
      ['2026-03-01_10-00_sistemas.json', clase('Sistemas por Gauss', 'x+y=2')],
      ['2026-03-02_10-00_derivadas.json', clase('Derivadas', "f'(x)=2x")],
      ['2026-03-03_10-00_con-foto.json', conImagen],
      ['imagenes/usada1.png', { b64: PNG, type: 'image/png' }],
      ['imagenes/sin-usar.png', { b64: PNG, type: 'image/png' }],
    ] });
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await open(p);
    check('Historial muestra «Exportar todas» e «Importar clases…»', (await p.textContent('#histExport')) === 'Exportar todas' && await p.isVisible('#histImport'));
    check('Cada clase tiene su casilla', (await p.locator('#histList .hist-sel').count()) === 3);
    await p.locator('.hist-item', { hasText: 'sistemas' }).locator('.hist-sel').check();
    await p.locator('.hist-item', { hasText: 'con-foto' }).locator('.hist-sel').check();
    check('El botón cuenta las seleccionadas', (await p.textContent('#histExport')) === 'Exportar 2 clases' && (await p.textContent('#histSelN')) === '2 seleccionadas');
    let [dl] = await Promise.all([p.waitForEvent('download'), p.click('#histExport')]);
    pkgSel = path.join(tmp, 'sel-' + dl.suggestedFilename()); await dl.saveAs(pkgSel);
    const a = JSON.parse(fs.readFileSync(pkgSel, 'utf8'));
    check('Nombre matia-clases_AAAA-MM-DD_HH-MM.json', /^matia-clases_\d{4}-\d\d-\d\d_\d\d-\d\d\.json$/.test(dl.suggestedFilename()), dl.suggestedFilename());
    check('Solo las clases seleccionadas', a.clases.map((c) => c.nombre).sort().join() === '2026-03-01_10-00_sistemas.json,2026-03-03_10-00_con-foto.json');
    check('Solo las imágenes que usan (no la que sobra)', a.imagenes.length === 1 && a.imagenes[0].ruta === 'imagenes/usada1.png');
    check('Sin la pizarra abierta', a.pizarra === null);
    await p.check('#histSelAll'); await p.uncheck('#histSelAll');
    check('«Seleccionar todas» marca y desmarca', (await p.textContent('#histExport')) === 'Exportar todas');
    [dl] = await Promise.all([p.waitForEvent('download'), p.click('#histExport')]);
    pkgAll = path.join(tmp, 'all-' + dl.suggestedFilename()); await dl.saveAs(pkgAll);
    check('Sin selección exporta todas', JSON.parse(fs.readFileSync(pkgAll, 'utf8')).clases.length === 3);
    check('Sin errores de JavaScript (exportar)', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }

  // ---- PC 2: importar ----
  {
    const ctx = await browser.newContext();
    await ctx.addInitScript(MOCK, { name: 'Clases del portátil', files: [
      ['copia-de-sistemas.json', clase('Sistemas por Gauss', 'x+y=2', { guardado: '2026-05-05T09:00:00Z' })], // misma clase, otro nombre y otra hora
      ['2026-03-02_10-00_derivadas.json', clase('Otra cosa', 'y=3')],                                          // mismo nombre, distinta
      ['2026-01-01_09-00_con-foto-vieja.json', JSON.stringify({ title: 'Con foto', pages: [{ blocks: [{ type: 'math', v: '1' }], strokes: [] }] })], // mismo título
    ] });
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await open(p);
    const loose = path.join(tmp, 'ejercicio-suelto.json'); fs.writeFileSync(loose, clase('Ejercicio suelto', 'z=1'));
    const junk = path.join(tmp, 'notas.json'); fs.writeFileSync(junk, '{"hola":1}');
    await p.setInputFiles('#histImpIn', [pkgAll, loose, junk]); await p.waitForTimeout(600);
    check('Antes de importar se enseña la revisión (y se oculta la lista)', (await p.isVisible('#histImpPanel')) && !(await p.isVisible('#histList')));
    const rows = await p.$$eval('#histImpList .hist-imp-row', (rs) => rs.map((r) => ({ c: r.className, t: r.textContent })));
    const find = (s) => rows.find((r) => r.t.includes(s)) || { c: '', t: '' };
    check('Idéntica con otro nombre → «Ya está»', /is-igual/.test(find('Sistemas por Gauss').c) && /copia-de-sistemas\.json/.test(find('Sistemas por Gauss').t));
    check('Nombre ocupado por otra distinta → se renombra a _importada', /is-renombrar/.test(find('Derivadas').c) && /derivadas_importada\.json/.test(find('Derivadas').t));
    check('Mismo título con contenido distinto → aviso', /is-nueva/.test(find('Con foto').c) && /mismo título/.test(find('Con foto').t));
    check('Una clase suelta (.json) también se importa', /is-nueva/.test(find('Ejercicio suelto').c));
    const sum = await p.textContent('#histImpSum');
    check('El resumen cuenta y menciona el archivo descartado', /4 clases en el archivo/.test(sum) && /notas\.json/.test(sum), sum);
    check('El botón dice cuántas se copiarán', (await p.textContent('#histImpGo')) === 'Importar 3 clases');
    if (SHOTS) await p.locator('#hist').screenshot({ path: path.join(SHOTS, 'hist-importar.png') });
    await p.click('#histImpGo'); await p.waitForTimeout(700);
    const keys = await p.evaluate(() => [...window.__fs.files.keys()].sort());
    check('Copia las nuevas y la renombrada, y la imagen', ['2026-03-02_10-00_derivadas_importada.json', '2026-03-03_10-00_con-foto.json', 'ejercicio-suelto.json', 'imagenes/usada1.png'].every((k) => keys.includes(k)), keys.join(', '));
    check('No duplica la idéntica ni pisa la existente', !keys.includes('2026-03-01_10-00_sistemas.json')
      && JSON.parse(await p.evaluate(() => window.__fs.files.get('2026-03-02_10-00_derivadas.json'))).title === 'Otra cosa');
    check('La lista vuelve y resalta las importadas', (await p.isVisible('#histList')) && (await p.locator('#histList .hist-item.imp').count()) === 3);
    if (SHOTS) await p.locator('#hist').screenshot({ path: path.join(SHOTS, 'hist-lista.png') });
    await p.setInputFiles('#histImpIn', [pkgAll]); await p.waitForTimeout(500);
    check('Importar otra vez el mismo archivo: nada que importar', (await p.isDisabled('#histImpGo')) && (await p.textContent('#histImpGo')) === 'Nada que importar');
    await p.click('#histImpCancel');
    check('Cancelar vuelve a la lista', await p.isVisible('#histList'));
    check('Sin errores de JavaScript (importar)', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }

  await browser.close();
  const bad = results.filter((r) => !r[1]);
  console.log(bad.length ? '\n' + bad.length + ' FALLOS' : '\nOK: ' + results.length + ' comprobaciones');
  process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
