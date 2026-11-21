#!/usr/bin/env node
/* Regresiones de la 3.ª revisión: texto enriquecido, imágenes y PDF.
   Uso: node tests/review3.js */
const path = require('path');
const { chromium } = require('playwright');
const URL_ = 'file://' + path.resolve(__dirname, '..', 'index.html');

// carpeta de clases en memoria con subcarpetas (como tests/presentation.js)
const MOCK = () => {
  const files = new Map();
  const fileH = (k) => ({ kind: 'file', name: k.split('/').pop(),
    async getFile() { const v = files.get(k) || new Blob([]); return Object.assign(v, { name: k.split('/').pop(), lastModified: Date.now() }); },
    async createWritable() { const parts = []; return { write: async (d) => { parts.push(d); }, close: async () => { files.set(k, new Blob(parts)); } }; } });
  const dirOf = (prefix, name) => ({ kind: 'directory', name,
    async *values() { for (const k of files.keys()) if (k.startsWith(prefix) && !k.slice(prefix.length).includes('/')) yield fileH(k); },
    async getDirectoryHandle(n) { return dirOf(prefix + n + '/', n); },
    async getFileHandle(n, o) { if (!files.has(prefix + n) && !(o && o.create)) throw new DOMException('No existe', 'NotFoundError'); return fileH(prefix + n); },
    async removeEntry(n) { files.delete(prefix + n); },
    async queryPermission() { return 'granted'; }, async requestPermission() { return 'granted'; } });
  window.__fs = { files };
  window.showDirectoryPicker = async () => dirOf('', 'Clases');
  window.print = () => { window.__printed = (window.__printed || 0) + 1; };
};

(async () => {
  const br = await chromium.launch();
  const results = [];
  const ok = (n, c, x) => { results.push(!!c); console.log((c ? 'OK    ' : 'FALLA ') + n + (x ? ' → ' + x : '')); };
  const open = async (board) => {
    const ctx = await br.newContext({ viewport: { width: 1300, height: 900 } });
    await ctx.addInitScript(MOCK);
    const pg = await ctx.newPage();
    const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
    await pg.goto(URL_); await pg.waitForFunction(() => !!customElements.get('math-field'));
    if (board) { await pg.evaluate((b) => localStorage.setItem('matia-pizarra-v1', JSON.stringify(b)), board); await pg.reload(); await pg.waitForFunction(() => !!customElements.get('math-field')); }
    await pg.waitForTimeout(700);
    return { ctx, pg, errs };
  };
  const blocks = (pg) => pg.evaluate(() => MatIA.require('model/board').board.pages[MatIA.require('model/board').board.cur].blocks);

  // 1) línea con solo una fórmula en línea: b.v no está vacío
  {
    const { ctx, pg } = await open({ pages: [{ blocks: [{ type: 'math', v: 'a' }, { type: 'text', v: '', html: '<span class="math-inline" data-latex="\\frac{1}{2}"></span>' }], strokes: [] }] });
    // cursor al final del texto (detrás de la fórmula)
    await pg.evaluate(() => { const t = document.querySelector('.blk-text'); t.focus(); const r = document.createRange(); r.selectNodeContents(t); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); });
    await pg.keyboard.type('x'); await pg.keyboard.press('Backspace'); await pg.waitForTimeout(500);
    const b = (await blocks(pg))[1];
    ok('Texto: la fórmula en línea cuenta en el texto plano', /\$\\frac\{1\}\{2\}\$/.test(b.v), b.v);
    await pg.keyboard.press('Backspace'); await pg.keyboard.press('Backspace'); await pg.waitForTimeout(300);
    ok('Texto: Retroceso no borra la línea que solo tiene una fórmula', (await blocks(pg)).length === 2);
    await ctx.close();
  }
  // 2) borrar la única línea de texto con formato no deja el html antiguo
  {
    const { ctx, pg } = await open({ pages: [{ blocks: [{ type: 'text', v: 'viejo', html: '<b>viejo</b>' }], strokes: [] }] });
    await pg.locator('.blk-text').click(); await pg.keyboard.press('Alt+Backspace'); await pg.waitForTimeout(400);
    const b = (await blocks(pg))[0];
    ok('Borrar la única línea: sin html antiguo', b.type === 'math' && !b.html, JSON.stringify(b));
    await ctx.close();
  }
  // 6) la barra de formato se oculta al cambiar de página con el teclado
  {
    const { ctx, pg } = await open({ pages: [{ blocks: [{ type: 'text', v: 'uno' }], strokes: [] }, { blocks: [{ type: 'math', v: 'x' }], strokes: [] }] });
    await pg.locator('.blk-text').click(); await pg.waitForTimeout(200);
    ok('Barra: visible al editar texto', await pg.evaluate(() => !document.querySelector('.tf-bar').hidden));
    await pg.keyboard.press('Alt+PageDown'); await pg.waitForTimeout(400);
    ok('Barra: se oculta al cambiar de página con Alt+AvPág', await pg.evaluate(() => document.querySelector('.tf-bar').hidden));
    await ctx.close();
  }
  // 7) flechas dentro de una lista se mueven por la lista
  {
    const { ctx, pg } = await open({ pages: [{ blocks: [{ type: 'math', v: 'a' }, { type: 'text', v: 'uno\ndos', html: '<ul><li>uno</li><li>dos</li></ul>' }], strokes: [] }] });
    await pg.locator('.blk-text li').nth(1).click(); await pg.keyboard.press('Home'); await pg.keyboard.press('ArrowUp'); await pg.waitForTimeout(250);
    const inText = await pg.evaluate(() => !!document.activeElement.closest('.blk-text'));
    ok('Flechas: ↑ desde el 2.º elemento de la lista se queda en la lista', inText);
    await ctx.close();
  }
  // 8) pegar HTML con estilos: sin estilos en línea y conservando fórmulas en línea
  {
    const { ctx, pg } = await open({ pages: [{ blocks: [{ type: 'text', v: 'a' }], strokes: [] }] });
    await pg.locator('.blk-text').click(); await pg.keyboard.press('End');
    await pg.evaluate(() => {
      const dt = new DataTransfer();
      dt.setData('text/html', '<span style="font-size:30px;background:red">grande</span> y <span class="math-inline" data-latex="x^2"></span>');
      dt.setData('text/plain', 'grande y x^2');
      document.activeElement.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    });
    await pg.waitForTimeout(500);
    const r = await pg.evaluate(() => ({ styles: document.querySelectorAll('.blk-text [style]').length, mf: document.querySelectorAll('.blk-text .math-inline math-field').length, b: MatIA.require('model/board').board.pages[0].blocks[0] }));
    ok('Pegar HTML: sin estilos en línea', r.styles === 0, String(r.styles));
    ok('Pegar HTML: conserva la fórmula en línea', r.mf === 1 && /x\^2/.test(r.b.html || ''), r.b.html);
    await ctx.close();
  }
  // 3, 9, 10) pegar imagen en una línea de fórmula; posición tras la línea activa; SVG → PNG
  {
    const { ctx, pg, errs } = await open({ pages: [{ blocks: [{ type: 'math', v: 'a' }, { type: 'math', v: 'b' }, { type: 'image', src: 'imagenes/no-existe.png', w: 40 }], strokes: [] }] });
    await pg.locator('#blocks > .blk').nth(1).locator('math-field').click(); await pg.waitForTimeout(250);
    await pg.evaluate(async () => {
      const c = document.createElement('canvas'); c.width = 50; c.height = 40; c.getContext('2d').fillRect(0, 0, 50, 40);
      const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
      const dt = new DataTransfer(); dt.items.add(new File([blob], 'p.png', { type: 'image/png' }));
      document.activeElement.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    });
    await pg.waitForTimeout(300);
    if (await pg.evaluate(() => document.getElementById('ask').open)) await pg.click('#askActs .mi-btn--primary');
    await pg.waitForTimeout(900);
    const types = (await blocks(pg)).map((b) => b.type + (b.v ? ':' + b.v : ''));
    ok('Imagen: pegar con el foco en una fórmula la inserta', types.filter((t) => t === 'image').length === 2, types.join(', '));
    ok('Imagen: se coloca tras la línea activa aunque haya que pedir la carpeta', types[2] === 'image', types.join(', '));
    const svgPath = await pg.evaluate(async () => {
      const svg = new File(['<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30"><rect width="40" height="30" fill="red"/><script>alert(1)</script></svg>'], 'x.svg', { type: 'image/svg+xml' });
      return MatIA.require('storage/assets').store(svg);
    });
    ok('Imagen: un SVG se guarda convertido a PNG', /\.png$/.test(svgPath || ''), svgPath);
    ok('Imágenes: sin errores', !errs.length, errs.join(' | '));
    await ctx.close();
  }
  // 4, 5) PDF: las fórmulas largas se reducen también al imprimir
  {
    const long = 'y=' + Array.from({ length: 30 }, (_, i) => 'a_{' + i + '}').join('+');
    const { ctx, pg } = await open({ paper: 'slide', pages: [{ blocks: [{ type: 'math', v: long }], strokes: [] }] });
    await pg.evaluate(() => MatIA.require('ui/print').printAll());
    await pg.waitForFunction(() => window.__printed === 1, null, { timeout: 10000 }).catch(() => {});
    const fit = await pg.evaluate(() => { const mf = document.querySelector('#print-root math-field'); return mf && mf.style.getPropertyValue('--fit'); });
    ok('PDF: la fórmula larga se reduce al imprimir', fit && parseFloat(fit) < 1, String(fit));
    await ctx.close();
  }

  await br.close();
  const bad = results.filter((r) => !r).length;
  console.log(bad ? 'FALLA: ' + bad + ' de ' + results.length + ' comprobaciones.' : 'OK: ' + results.length + ' comprobaciones.');
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
