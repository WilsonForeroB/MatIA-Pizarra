#!/usr/bin/env node
/* Prueba de los flujos de carpeta con una carpeta simulada (Playwright no puede manejar las ventanas nativas).
   Comprueba: ventana con estilo antes del selector nativo, cualquier nombre de carpeta (sin forzar «historial»),
   guardar, listar, abrir, borrar con confirmación propia, y la alternativa de solo lectura (Firefox/Safari).
   Uso: node src/tests/storage.js */
const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..', '..');
const URL_ = 'file://' + path.join(ROOT, 'pizarra.html');

const MOCK = () => {
  const files = new Map([['2026-01-01_10-00_clase-previa.json', JSON.stringify({ app: 'MatIA Pizarra', formato: 1, title: 'Clase previa', pages: [{ blocks: [{ type: 'math', v: 'a^2+b^2=c^2' }], strokes: [] }] })]]);
  window.__fs = { files, pickerCalls: 0, askOpenAtPicker: [] };
  const fileHandle = (name) => ({ kind: 'file', name,
    async getFile() { const t = files.get(name) || ''; return { lastModified: Date.now(), size: t.length, text: async () => t }; },
    async createWritable() { let buf = ''; return { write: async (t) => { buf += t; }, close: async () => { files.set(name, buf); } }; } });
  const dir = { kind: 'directory', name: 'Mis clases de 2º',
    async *values() { for (const n of files.keys()) yield fileHandle(n); },
    async getFileHandle(n) { return fileHandle(n); },
    async removeEntry(n) { files.delete(n); },
    async queryPermission() { return 'granted'; }, async requestPermission() { return 'granted'; } };
  window.showDirectoryPicker = async () => { window.__fs.pickerCalls++; window.__fs.askOpenAtPicker.push(document.getElementById('ask').open); return dir; };
};

(async () => {
  const browser = await chromium.launch();
  const results = [];
  const check = (name, ok, extra) => { results.push([name, ok]); console.log((ok ? 'OK   ' : 'FALLA') + ' ' + name + (extra ? ' → ' + extra : '')); };

  // ---- Chrome/Edge: lectura y escritura ----
  {
    const ctx = await browser.newContext(); await ctx.addInitScript(MOCK);
    const p = await ctx.newPage();
    const native = []; p.on('dialog', (d) => { native.push(d.type()); d.dismiss(); });
    const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(URL_); await p.waitForFunction(() => !!customElements.get('math-field'));
    await p.click('#histBtn'); await p.waitForTimeout(300);
    await p.click('#histConnect'); await p.waitForTimeout(200);
    const askTitle = await p.textContent('#askTitle');
    const pickerBefore = await p.evaluate(() => window.__fs.pickerCalls);
    check('Conectar muestra primero la ventana de MatIA (sin abrir aún el selector)', (await p.evaluate(() => document.getElementById('ask').open)) && pickerBefore === 0, askTitle);
    await p.click('#askActs .mi-btn--primary'); await p.waitForTimeout(400);
    check('El selector nativo se abre después, con la ventana de MatIA ya cerrada', (await p.evaluate(() => window.__fs.pickerCalls === 1 && window.__fs.askOpenAtPicker[0] === false)));
    const status = await p.textContent('#histStatus');
    check('Acepta cualquier carpeta (no fuerza «historial»)', status.includes('Mis clases de 2º'), status);
    check('Lista las clases de la carpeta', (await p.locator('#histList .hist-item').count()) === 1);
    await p.fill('#histName', 'Ecuaciones'); await p.click('#histSave'); await p.waitForTimeout(400);
    const names = await p.evaluate(() => [...window.__fs.files.keys()]);
    check('Guardar escribe un .json con fecha y título', names.some((n) => /_ecuaciones\.json$/.test(n)), names.join(', '));
    const saved = await p.evaluate(() => JSON.parse([...window.__fs.files.entries()].find(([n]) => /ecuaciones/.test(n))[1]));
    check('El JSON lleva cabecera app/formato y el título', saved.app === 'MatIA Pizarra' && saved.formato === 1 && saved.title === 'Ecuaciones');
    await p.locator('#histList .hist-item', { hasText: 'clase-previa' }).locator('button', { hasText: 'Borrar' }).click(); await p.waitForTimeout(200);
    check('Borrar pide confirmación con la ventana de MatIA', await p.evaluate(() => document.getElementById('ask').open), await p.textContent('#askTitle'));
    await p.click('#askActs .mi-btn--danger'); await p.waitForTimeout(300);
    check('Tras confirmar, el archivo se borra', !(await p.evaluate(() => window.__fs.files.has('2026-01-01_10-00_clase-previa.json'))));
    await p.locator('#histList .hist-item').first().locator('button', { hasText: 'Abrir' }).click(); await p.waitForTimeout(500);
    check('Abrir carga la clase guardada', (await p.evaluate(() => MatIA.require('model/board').board.title)) === 'Ecuaciones');
    check('Ninguna ventana nativa alert/confirm/prompt', native.length === 0, native.join(','));
    check('Sin errores de JavaScript', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }
  // ---- Ctrl+S sin carpeta conectada: también pasa por la ventana de MatIA ----
  {
    const ctx = await browser.newContext(); await ctx.addInitScript(MOCK);
    const p = await ctx.newPage();
    await p.goto(URL_); await p.waitForFunction(() => !!customElements.get('math-field')); await p.waitForTimeout(300);
    await p.click('#saveBtn'); await p.waitForTimeout(300);
    check('Guardar sin carpeta explica antes de abrir el selector', (await p.evaluate(() => document.getElementById('ask').open && window.__fs.pickerCalls === 0)), await p.textContent('#askTitle'));
    await ctx.close();
  }
  // ---- Regresión: «Guardar y continuar» sin carpeta abre la segunda ventana y no se cierra sola ----
  {
    const ctx = await browser.newContext(); await ctx.addInitScript(MOCK);
    const p = await ctx.newPage();
    await p.goto(URL_); await p.waitForFunction(() => !!customElements.get('math-field')); await p.waitForTimeout(300);
    await p.click('#blocks .blk math-field'); await p.keyboard.type('x+1', { delay: 40 }); await p.waitForTimeout(600);
    await p.click('#fileBtn'); await p.click('#newBoard'); await p.waitForTimeout(300);
    await p.locator('#askActs button', { hasText: 'Guardar y continuar' }).click(); await p.waitForTimeout(300);
    check('«Guardar y continuar» muestra la ventana de carpeta y sigue abierta', await p.evaluate(() => document.getElementById('ask').open), await p.textContent('#askTitle'));
    await p.click('#askActs .mi-btn--primary'); await p.waitForTimeout(600);
    const r = await p.evaluate(() => ({ calls: window.__fs.pickerCalls, files: window.__fs.files.size, blank: MatIA.require('model/board').board.pages[0].blocks[0].v === '' }));
    check('…guarda en la carpeta y después crea la pizarra nueva', r.calls === 1 && r.files === 2 && r.blank, JSON.stringify(r));
    await ctx.close();
  }
  // ---- Regresión: Ctrl+S con el historial abierto guarda la clase (no abre «Guardar página como») ----
  {
    const ctx = await browser.newContext(); await ctx.addInitScript(MOCK);
    const p = await ctx.newPage();
    await p.goto(URL_); await p.waitForFunction(() => !!customElements.get('math-field')); await p.waitForTimeout(300);
    await p.click('#histBtn'); await p.waitForTimeout(300);
    const prevented = await p.evaluate(() => { const ev = new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true, cancelable: true }); document.getElementById('histName').dispatchEvent(ev); return ev.defaultPrevented; });
    check('Ctrl+S con el historial abierto lo atiende la pizarra', prevented);
    await ctx.close();
  }
  // ---- Firefox/Safari: sin showDirectoryPicker ----
  {
    const ctx = await browser.newContext(); await ctx.addInitScript(() => { delete window.showDirectoryPicker; });
    const p = await ctx.newPage();
    await p.goto(URL_); await p.waitForFunction(() => !!customElements.get('math-field'));
    await p.click('#histBtn'); await p.waitForTimeout(300);
    check('Sin API de carpetas se ofrece «Elegir carpeta (solo lectura)»', await p.isVisible('#histPickRO'));
    await p.click('#histPickRO'); await p.waitForTimeout(200);
    check('…y antes se explica con la ventana de MatIA', await p.evaluate(() => document.getElementById('ask').open));
    const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('#askActs .mi-btn--primary')]);
    const fs = require('fs'); const tmp = path.join(require('os').tmpdir(), 'matia-ro'); fs.mkdirSync(tmp, { recursive: true });
    fs.writeFileSync(path.join(tmp, '2026-02-02_09-00_repaso.json'), JSON.stringify({ title: 'Repaso', pages: [{ blocks: [{ type: 'text', v: 'Hola' }], strokes: [] }] }));
    await fc.setFiles(tmp); await p.waitForTimeout(400);
    check('Lee las clases de la carpeta en solo lectura', (await p.locator('#histList .hist-item').count()) === 1, await p.textContent('#histStatus'));
    check('El botón de guardar pasa a «Descargar la clase»', (await p.textContent('#histSave')) === 'Descargar la clase');
    await ctx.close();
  }
  await browser.close();
  const bad = results.filter((r) => !r[1]).length;
  console.log(bad ? 'FALLA: ' + bad + ' comprobaciones.' : 'OK: ' + results.length + ' comprobaciones.');
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
