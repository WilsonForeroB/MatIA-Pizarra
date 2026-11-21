#!/usr/bin/env node
/* Presentación de extremo a extremo: diapositivas con título con formato, texto, fórmula en línea,
   imagen guardada en la carpeta de clases (simulada) y fórmulas; «PDF» → ventana MatIA → impresión.
   Genera un PDF real con Chromium (page.pdf) y capturas para la documentación.
   Uso: node tests/presentation.js   (deja docs/img/presentacion-*.png y docs/img/presentacion.pdf) */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');

// carpeta de clases en memoria, con subcarpetas y binarios (como tests/images.js)
const MOCK = () => {
  const files = new Map();
  const dirOf = (prefix, name) => ({
    kind: 'directory', name,
    async *values() { for (const k of files.keys()) if (k.startsWith(prefix) && !k.slice(prefix.length).includes('/')) yield fileH(k); },
    async getDirectoryHandle(n) { return dirOf(prefix + n + '/', n); },
    async getFileHandle(n, o) { if (!files.has(prefix + n) && !(o && o.create)) throw new DOMException('No existe', 'NotFoundError'); return fileH(prefix + n); },
    async removeEntry(n) { files.delete(prefix + n); },
    async queryPermission() { return 'granted'; }, async requestPermission() { return 'granted'; },
  });
  const fileH = (k) => ({ kind: 'file', name: k.split('/').pop(),
    async getFile() { const v = files.get(k) || new Blob([]); const b = v instanceof Blob ? v : new Blob([v]); return Object.assign(b, { name: k.split('/').pop(), lastModified: Date.now(), text: () => b.text() }); },
    async createWritable() { const parts = []; return { write: async (d) => { parts.push(d); }, close: async () => { files.set(k, new Blob(parts)); } }; } });
  const root = dirOf('', 'Clases de 2º');
  window.__fs = { files };
  window.showDirectoryPicker = async () => root;
  window.__printed = 0;
  window.print = () => { window.__printed++; };
};

(async () => {
  const br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 1400, height: 950 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(MOCK);
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', (e) => errs.push(e.message));
  pg.on('dialog', (d) => { errs.push('ventana nativa: ' + d.type()); d.dismiss(); });
  const results = [];
  const ok = (n, c, x) => { results.push(!!c); console.log((c ? 'OK    ' : 'FALLA ') + n + (x ? ' → ' + x : '')); };

  await pg.goto('file://' + path.join(ROOT, 'pizarra.html'));
  await pg.waitForFunction(() => !!customElements.get('math-field'));
  await pg.evaluate(() => localStorage.setItem('matia-pizarra-v1', JSON.stringify({ paper: 'slide', title: 'Derivadas', pages: [
    { blocks: [
      { type: 'text', v: 'La derivada', html: '<p class="tf-al-center"><span class="tf-sz-title tf-f-hand tf-c2">La derivada</span></p>' },
      { type: 'text', v: 'Mide la pendiente de la recta tangente. Por ejemplo, si f(x)=x² entonces f′(x)=2x.', html: '<ul><li><b>Mide</b> la pendiente de la recta <span class="tf-hl1">tangente</span>.</li><li>Por ejemplo, si <span class="math-inline" data-latex="f(x)=x^2"></span> entonces <span class="math-inline" data-latex="f\'(x)=2x"></span>.</li></ul>' },
    ], strokes: [] },
    { blocks: [
      { type: 'math', v: "f'(x)=\\lim_{h\\to 0}\\frac{f(x+h)-f(x)}{h}", align: 'center' },
      { type: 'graph', fns: ['f(x)=x^2', 'g(x)=2x-1'], xmin: -3, xmax: 3 },
    ], strokes: [] },
  ] })));
  await pg.reload(); await pg.waitForFunction(() => !!customElements.get('math-field')); await pg.waitForTimeout(800);

  // imagen: botón «Imagen» → ventana MatIA (no hay carpeta) → se guarda en imagenes/
  const png = await pg.evaluate(async () => { const c = document.createElement('canvas'); c.width = 640; c.height = 360; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 640, 360); g.addColorStop(0, '#0072b2'); g.addColorStop(1, '#009b71'); x.fillStyle = g; x.fillRect(0, 0, 640, 360); x.fillStyle = '#fff'; x.font = 'bold 48px sans-serif'; x.fillText('Imagen de ejemplo', 110, 195); const b = await new Promise((r) => c.toBlob(r, 'image/png')); return Array.from(new Uint8Array(await b.arrayBuffer())); });
  const tmpPng = path.join(require('os').tmpdir(), 'matia-ejemplo.png'); fs.writeFileSync(tmpPng, Buffer.from(png));
  await pg.locator('#blocks > .blk').nth(1).locator('.blk-text').click();
  const [fc] = await Promise.all([pg.waitForEvent('filechooser'), pg.click('#imgBtn')]);
  await fc.setFiles(tmpPng);
  await pg.waitForTimeout(300);
  ok('Imagen: sin carpeta, primero la ventana de MatIA', await pg.evaluate(() => document.getElementById('ask').open), await pg.textContent('#askTitle'));
  await pg.click('#askActs .mi-btn--primary');
  await pg.waitForFunction(() => { const i = document.querySelector('.img-blk img'); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 8000 }).catch(() => {});
  const stored = await pg.evaluate(() => [...window.__fs.files.keys()]);
  ok('Imagen: se guarda en la carpeta, en imagenes/', stored.some((k) => /^imagenes\/[0-9a-f]{16}\.png$/.test(k)), stored.join(', '));
  ok('Imagen: el bloque guarda la ruta y se ve', await pg.evaluate(() => { const b = MatIA.require('model/board').board.pages[0].blocks.find((x) => x.type === 'image'); const i = document.querySelector('.img-blk img'); return !!b && /^imagenes\//.test(b.src) && i && i.naturalWidth > 0; }));

  // texto enriquecido y fórmula en línea visibles
  ok('Texto: título con fuente manuscrita', await pg.evaluate(() => getComputedStyle(document.querySelector('.tf-f-hand')).fontFamily.includes('Caveat')));
  ok('Texto: fórmulas en línea dentro de la lista', await pg.evaluate(() => document.querySelectorAll('.blk-text .math-inline math-field').length === 2));
  await pg.evaluate(() => document.activeElement && document.activeElement.blur());
  await pg.waitForTimeout(300);
  await pg.locator('#sheet').screenshot({ path: path.join(ROOT, 'docs/img/presentacion-diapositiva.png') });
  await pg.locator('#blocks > .blk').nth(0).locator('.blk-text').click();
  await pg.waitForTimeout(400);
  await pg.screenshot({ path: path.join(ROOT, 'docs/img/presentacion-barra-texto.png'), clip: { x: 0, y: 0, width: 1400, height: 520 } });

  // PDF: botón → ventana MatIA → impresión con una hoja por diapositiva
  await pg.click('#pdfBtn'); await pg.waitForTimeout(200);
  ok('PDF: primero la ventana de MatIA', (await pg.textContent('#askTitle')) === 'Guardar como PDF' && (await pg.evaluate(() => window.__printed)) === 0);
  await pg.click('#askActs .mi-btn--primary');
  await pg.waitForFunction(() => window.__printed === 1, null, { timeout: 10000 }).catch(() => {});
  const pr = await pg.evaluate(() => ({ pages: document.querySelectorAll('#print-root .print-page').length, imgs: Array.from(document.querySelectorAll('#print-root img:not(.print-ink)')).map((i) => i.complete && i.naturalWidth > 0) }));
  ok('PDF: una hoja por diapositiva', pr.pages === 2, JSON.stringify(pr));
  ok('PDF: la imagen está cargada antes de imprimir', pr.imgs.length >= 1 && pr.imgs.every(Boolean), JSON.stringify(pr.imgs));
  await pg.emulateMedia({ media: 'print' });
  const pdf = await pg.pdf({ path: path.join(ROOT, 'docs/img/presentacion.pdf'), preferCSSPageSize: true, printBackground: true });
  ok('PDF: se genera el archivo', pdf.length > 10000, Math.round(pdf.length / 1024) + ' KB');
  ok('Sin errores de página', !errs.length, errs.join(' | '));
  await br.close();
  const bad = results.filter((r) => !r).length;
  console.log(bad ? 'FALLA: ' + bad + ' de ' + results.length + ' comprobaciones.' : 'OK: ' + results.length + ' comprobaciones.');
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
