#!/usr/bin/env node
/* Prueba de «⋯ → Migraciones»: exportar el historial en un paquete en una pizarra («servidor viejo»)
   e importarlo en otra con otra carpeta («servidor nuevo»). Usa carpetas simuladas en memoria.
   Uso: node src/tests/migration.js */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..', '..');
const URL_ = 'file://' + path.join(ROOT, 'pizarra.html');

// carpeta simulada con subcarpetas; los archivos son File reales
const MOCK = (init) => {
  const files = new Map();
  for (const [k, v] of init.files) files.set(k, v.b64 ? new Blob([Uint8Array.from(atob(v.b64), (c) => c.charCodeAt(0))], { type: v.type }) : v);
  window.__fs = { files };
  const fileHandle = (p, name) => ({ kind: 'file', name,
    async getFile() { if (!files.has(p)) throw new DOMException('no existe', 'NotFoundError'); return new File([files.get(p)], name, { type: (files.get(p) && files.get(p).type) || '', lastModified: 1767261600000 }); },
    async createWritable() { const parts = []; return { write: async (t) => { parts.push(t); }, close: async () => { files.set(p, parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : new Blob(parts)); } }; } });
  const dirHandle = (pre, name) => ({ kind: 'directory', name,
    async *values() {
      const seen = new Set();
      for (const k of files.keys()) {
        if (!k.startsWith(pre)) continue;
        const rest = k.slice(pre.length), i = rest.indexOf('/');
        if (i < 0) yield fileHandle(k, rest);
        else if (!seen.has(rest.slice(0, i))) { seen.add(rest.slice(0, i)); yield dirHandle(pre + rest.slice(0, i) + '/', rest.slice(0, i)); }
      }
    },
    async getDirectoryHandle(n, o) { const p = pre + n + '/'; if (!(o && o.create) && ![...files.keys()].some((k) => k.startsWith(p))) throw new DOMException('no existe', 'NotFoundError'); return dirHandle(p, n); },
    async getFileHandle(n, o) { const p = pre + n; if (!(o && o.create) && !files.has(p)) throw new DOMException('no existe', 'NotFoundError'); return fileHandle(p, n); },
    async removeEntry(n) { files.delete(pre + n); },
    async queryPermission() { return 'granted'; }, async requestPermission() { return 'granted'; } });
  const root = dirHandle('', init.name);
  window.showDirectoryPicker = async () => root;
  if (init.board) localStorage.setItem('matia-pizarra-v1', JSON.stringify(init.board));
};

const SHOTS = process.env.MIG_SHOTS; // carpeta opcional para guardar capturas de la ventana
const shot = async (p, n) => { if (SHOTS) await p.locator('#migr').screenshot({ path: path.join(SHOTS, n + '.png') }); };
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const clase = (t, v) => JSON.stringify({ app: 'MatIA Pizarra', formato: 1, title: t, pages: [{ blocks: [{ type: 'math', v }], strokes: [] }] });

(async () => {
  const browser = await chromium.launch();
  const results = [];
  const check = (name, ok, extra) => { results.push([name, ok]); console.log((ok ? 'OK   ' : 'FALLA') + ' ' + name + (extra ? ' → ' + extra : '')); };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'matia-mig-'));
  let pkgPath;

  // ---- Servidor viejo: exportar ----
  {
    const ctx = await browser.newContext({ acceptDownloads: true });
    await ctx.addInitScript(MOCK, { name: 'Clases 2025', files: [
      ['2026-01-10_09-00_pitagoras.json', clase('Pitágoras', 'a^2+b^2=c^2')],
      ['2026-02-01_10-00_derivadas.json', clase('Derivadas', "f'(x)=2x")],
      ['matia-migracion_2025-12-01_10-00.json', JSON.stringify({ tipo: 'matia-migracion', formato: 1, clases: [] })],
      ['imagenes/abc123.png', { b64: PNG, type: 'image/png' }],
    ], board: { title: 'Clase abierta vieja', theme: 'dark', pages: [{ blocks: [{ type: 'math', v: 'x+1' }], strokes: [] }] } });
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(URL_); await p.waitForFunction(() => !!customElements.get('math-field'));
    await p.click('#fileBtn');
    check('El menú ⋯ tiene «Migraciones…»', await p.isVisible('#migrBtn'));
    await p.click('#migrBtn'); await p.waitForTimeout(500);
    check('Se abre la ventana Migraciones y se cierra el menú', (await p.evaluate(() => document.getElementById('migr').open)) && !(await p.isVisible('#filePop')));
    check('Sin carpeta: ofrece conectarla y no deja marcar las clases', (await p.isVisible('#mgExpConnect')) && (await p.isDisabled('#mgExpClases')));
    await p.click('#mgExpConnect'); await p.waitForTimeout(200);
    await p.click('#askActs .mi-btn--primary'); await p.waitForTimeout(400);
    await p.waitForFunction(() => !/contando|conecta/.test(document.getElementById('mgExpClasesN').textContent));
    const nC = await p.textContent('#mgExpClasesN'), nI = await p.textContent('#mgExpImgsN');
    check('Cuenta las clases (sin contar paquetes anteriores) y las imágenes', nC === '(2 clases)' && nI === '(1 imagen)', nC + ' ' + nI);
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#mgExport')]);
    pkgPath = path.join(tmp, dl.suggestedFilename());
    await dl.saveAs(pkgPath);
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    check('Nombre del paquete matia-migracion_AAAA-MM-DD_HH-MM.json', /^matia-migracion_\d{4}-\d\d-\d\d_\d\d-\d\d\.json$/.test(dl.suggestedFilename()), dl.suggestedFilename());
    check('El paquete lleva las 2 clases tal cual', pkg.tipo === 'matia-migracion' && pkg.clases.length === 2 && pkg.clases.some((c) => c.texto === clase('Pitágoras', 'a^2+b^2=c^2')));
    check('El paquete lleva la imagen en base64', pkg.imagenes.length === 1 && pkg.imagenes[0].ruta === 'imagenes/abc123.png' && pkg.imagenes[0].datos === PNG);
    check('El paquete lleva la pizarra abierta y sus preferencias', pkg.pizarra && pkg.pizarra.title === 'Clase abierta vieja' && pkg.pizarra.theme === 'dark');
    await shot(p, 'migr-exportar');
    check('Muestra un resumen de lo exportado', /2 clases, 1 imagen y la pizarra abierta/.test(await p.textContent('#mgReport')));
    await p.click('#histBtn').catch(() => {});
    check('Sin errores de JavaScript (exportar)', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }

  // ---- Servidor nuevo: importar ----
  {
    const ctx = await browser.newContext();
    await ctx.addInitScript(MOCK, { name: 'Clases servidor nuevo', files: [
      ['2026-01-10_09-00_pitagoras.json', clase('Pitágoras', 'a^2+b^2=c^2')],      // idéntica → se salta
      ['2026-02-01_10-00_derivadas.json', clase('Derivadas (otra)', 'g(x)=x')],   // mismo nombre, distinta → se renombra
    ] });
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(URL_); await p.waitForFunction(() => !!customElements.get('math-field'));
    await p.click('#fileBtn'); await p.click('#migrBtn'); await p.waitForTimeout(300);

    // un archivo que no es un paquete
    const loose = path.join(tmp, 'suelta.json'); fs.writeFileSync(loose, clase('x', 'y'));
    await p.setInputFiles('#mgFile', loose); await p.waitForTimeout(300);
    check('Una clase suelta se rechaza con la ventana de MatIA', (await p.evaluate(() => document.getElementById('ask').open)) && /clase suelta/.test(await p.textContent('#askText')));
    await p.click('#askActs .mi-btn--primary');

    await p.setInputFiles('#mgFile', pkgPath); await p.waitForTimeout(300);
    check('Muestra el resumen del paquete', /desde archivo local · carpeta «Clases 2025»/.test(await p.textContent('#mgMeta')), await p.textContent('#mgMeta'));
    check('Sin carpeta: no deja copiar y ofrece conectarla', (await p.isDisabled('#mgImpClases')) && (await p.isVisible('#mgImpConnect')));
    check('Con la pizarra vacía, propone recuperar la pizarra del paquete', await p.isChecked('#mgImpBoard'));
    await shot(p, 'migr-paquete');
    await p.click('#mgImpConnect'); await p.waitForTimeout(200);
    await p.click('#askActs .mi-btn--primary'); await p.waitForTimeout(400);
    check('Tras conectar, se pueden copiar clases e imágenes', !(await p.isDisabled('#mgImpClases')) && !(await p.isDisabled('#mgImpImgs')));
    await p.check('#mgImpClases'); await p.check('#mgImpImgs');
    await p.click('#mgImport'); await p.waitForTimeout(800);
    const st = await p.evaluate(async () => {
      const f = window.__fs.files, txt = async (k) => (typeof f.get(k) === 'string' ? f.get(k) : f.get(k) && f.get(k).text());
      const img = f.get('imagenes/abc123.png');
      return { keys: [...f.keys()].sort(), renamed: await txt('2026-02-01_10-00_derivadas_migrada.json'), kept: await txt('2026-02-01_10-00_derivadas.json'),
        imgB64: img ? btoa(String.fromCharCode(...new Uint8Array(await img.arrayBuffer()))) : null,
        title: MatIA.require('model/board').board.title, theme: MatIA.require('model/board').board.theme, report: document.getElementById('mgReport').textContent };
    });
    await shot(p, 'migr-importar');
    check('La clase idéntica no se duplica', st.keys.filter((k) => /pitagoras/.test(k)).length === 1, st.keys.join(', '));
    check('La clase con el mismo nombre pero distinta se guarda como «_migrada» sin pisar la existente',
      /Derivadas"/.test(st.renamed || '') && /Derivadas \(otra\)/.test(st.kept || ''));
    check('La imagen se copia a imagenes/ con los mismos bytes', st.imgB64 === PNG);
    check('Se recupera la pizarra abierta con sus preferencias', st.title === 'Clase abierta vieja' && st.theme === 'dark', st.title + ' / ' + st.theme);
    check('El informe explica lo copiado', /ya estaban: 1/.test(st.report) && /_migrada/.test(st.report) && /Imágenes copiadas: 1/.test(st.report), st.report);
    // el paquete no aparece como clase en el Historial
    await p.evaluate(() => { window.__fs.files.set('matia-migracion_2026-01-01_00-00.json', '{"tipo":"matia-migracion"}'); document.getElementById('migr').close(); });
    await p.click('#histBtn'); await p.waitForTimeout(400);
    check('El Historial no muestra los paquetes de migración como clases', !/matia-migracion/.test(await p.textContent('#histList')));
    // importar otra vez no duplica nada
    await p.click('#histClose'); await p.click('#fileBtn'); await p.click('#migrBtn'); await p.waitForTimeout(300);
    await p.setInputFiles('#mgFile', pkgPath); await p.waitForTimeout(300);
    await p.uncheck('#mgImpBoard'); await p.click('#mgImport'); await p.waitForTimeout(600);
    const keys2 = await p.evaluate(() => [...window.__fs.files.keys()].length);
    check('Importar dos veces el mismo paquete no crea copias', keys2 === st.keys.length + 1, String(keys2));
    check('Sin errores de JavaScript (importar)', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }

  await browser.close();
  const bad = results.filter((r) => !r[1]);
  console.log(bad.length ? '\n' + bad.length + ' FALLOS' : '\nOK: ' + results.length + ' comprobaciones');
  process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
