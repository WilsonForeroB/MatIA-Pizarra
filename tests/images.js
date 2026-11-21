#!/usr/bin/env node
/* Prueba del bloque «Imagen» y del almacén de imágenes (storage/assets) con una carpeta simulada con subcarpetas.
   Uso: node tests/images.js [index.html]
   Si index.html aún no carga image.js/assets.js se crea una copia temporal con <base> y los scripts/estilos añadidos. */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const SCRATCH = '/tmp/claude-0/-home-user-MatIA-Pizarra/01dbf8ae-b7ca-56a2-a637-356d3606271a/scratchpad';

function pageFile(name) {
  const src = path.resolve(ROOT, name || 'index.html');
  let html = fs.readFileSync(src, 'utf8');
  if (html.includes('js/blocks/image.js') && html.includes('js/storage/assets.js')) return src;
  html = html.replace('<head>', '<head>\n<base href="file://' + ROOT + '/">');
  if (!html.includes('css/image.css')) html = html.replace('<link rel="stylesheet" href="css/print.css">', '<link rel="stylesheet" href="css/image.css">\n<link rel="stylesheet" href="css/print.css">');
  if (!html.includes('js/blocks/image.js')) html = html.replace('<script src="js/model/board.js"></script>', '<script src="js/blocks/image.js"></script>\n<script src="js/model/board.js"></script>');
  if (!html.includes('js/storage/assets.js')) html = html.replace('<script src="js/storage/history.js"></script>', '<script src="js/storage/history.js"></script>\n<script src="js/storage/assets.js"></script>');
  fs.mkdirSync(SCRATCH, { recursive: true });
  const out = path.join(SCRATCH, 'index-images.html');
  fs.writeFileSync(out, html);
  return out;
}

const MOCK = () => {
  const mk = (name) => ({ kind: 'directory', name, kids: new Map() });
  const root = mk('Clases');
  const restore = (list) => { for (const [p, d] of list) { // restaura ficheros tras recargar
    const parts = p.split('/'); let n = root;
    for (const x of parts.slice(0, -1)) { if (!n.kids.has(x)) n.kids.set(x, mk(x)); n = n.kids.get(x); }
    const bin = Uint8Array.from(atob(d.b64), (c) => c.charCodeAt(0));
    n.kids.set(parts[parts.length - 1], { kind: 'file', name: parts[parts.length - 1], blob: new Blob([bin], { type: d.type }) });
  } };
  const snap = sessionStorage.getItem('fsSnap');
  if (snap) restore(JSON.parse(snap));
  const NF = () => Object.assign(new Error('no encontrado'), { name: 'NotFoundError' });
  const wrap = (n) => n.kind === 'file' ? {
    kind: 'file', name: n.name,
    async getFile() { const f = n.blob; return Object.assign(f.slice(0, f.size, f.type), { lastModified: Date.now(), name: n.name }); },
    async createWritable() { let buf = []; return { write: async (x) => { buf.push(x); }, close: async () => { n.blob = new Blob(buf, { type: (buf[0] && buf[0].type) || '' }); } }; },
  } : {
    kind: 'directory', name: n.name,
    async *values() { for (const k of n.kids.values()) yield wrap(k); },
    async getDirectoryHandle(x, o) { let k = n.kids.get(x); if (!k) { if (!(o && o.create)) throw NF(); k = mk(x); n.kids.set(x, k); } return wrap(k); },
    async getFileHandle(x, o) { let k = n.kids.get(x); if (!k) { if (!(o && o.create)) throw NF(); k = { kind: 'file', name: x, blob: new Blob([]) }; n.kids.set(x, k); } return wrap(k); },
    async removeEntry(x) { n.kids.delete(x); },
    async queryPermission() { return 'granted'; }, async requestPermission() { return 'granted'; },
  };
  const walk = (n, pre, out) => { for (const [k, v] of n.kids) v.kind === 'file' ? out.push([pre + k, v]) : walk(v, pre + k + '/', out); return out; };
  window.__fs = {
    pickerCalls: 0, askOpenAtPicker: [],
    paths: () => walk(root, '', []).map(([p]) => p),
    load: (list) => restore(list), // la prueba la vuelve a cargar si sessionStorage no sobrevivió a la recarga
    async snapshot() {
      const out = [];
      for (const [p, v] of walk(root, '', [])) {
        const u8 = new Uint8Array(await v.blob.arrayBuffer()); let s = ''; u8.forEach((c) => { s += String.fromCharCode(c); });
        out.push([p, { b64: btoa(s), type: v.blob.type }]);
      }
      sessionStorage.setItem('fsSnap', JSON.stringify(out));
      return out;
    },
    size: async (p) => { const f = walk(root, '', []).find(([q]) => q === p); const bmp = await createImageBitmap(f[1].blob); return [bmp.width, bmp.height]; },
  };
  window.showDirectoryPicker = async () => { window.__fs.pickerCalls++; window.__fs.askOpenAtPicker.push(document.getElementById('ask').open); return wrap(root); };
};

(async () => {
  const file = pageFile(process.argv[2]);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 1200 } });
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/mathlive@[^/]+\//, (r) => {
    const f = path.join(ROOT, 'vendor/mathlive', new URL(r.request().url()).pathname.replace(/^\/npm\/mathlive@[^/]+\//, ''));
    return fs.existsSync(f) ? r.fulfill({ path: f }) : r.fulfill({ status: 404, body: '' });
  });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ body: '', contentType: 'text/css' }));
  await ctx.addInitScript(MOCK);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_TUNNEL|Fetch API cannot load|Invalid URL|math fonts could not be loaded/.test(m.text())) errors.push(m.text()); });
  let fail = 0;
  const ok = (c, m) => { console.log((c ? 'OK    ' : 'FALLO ') + m); if (!c) fail++; };
  const boot = async () => { await page.goto('file://' + file); await page.waitForFunction(() => !!customElements.get('math-field')); await page.waitForTimeout(500); };
  await boot();
  const mkPng = (w, h, color) => page.evaluate(async ([w, h, color]) => {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d'); g.fillStyle = color; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.fillRect(w / 4, h / 4, w / 2, h / 2);
    const b = await new Promise((r) => cv.toBlob(r, 'image/png'));
    window.__png = window.__png || {}; window.__png[color] = new File([b], 'foto.png', { type: 'image/png' });
  }, [w, h, color]);

  await mkPng(400, 300, '#2255cc');
  // 1) sin carpeta: primero la ventana de MatIA
  const ins = page.evaluate(() => { window.__ins = MatIA.require('storage/assets').insertFromFile(window.__png['#2255cc']); });
  await page.waitForTimeout(500);
  ok(await page.evaluate(() => document.getElementById('ask').open && window.__fs.pickerCalls === 0), 'sin carpeta: primero la ventana de MatIA, sin selector nativo');
  await page.click('#askActs .mi-btn--primary');
  await page.evaluate(() => window.__ins); await ins;
  await page.waitForTimeout(500);
  const paths = await page.evaluate(() => window.__fs.paths());
  ok(paths.length === 1 && /^imagenes\/[0-9a-f]{16}\.png$/.test(paths[0]), 'se escribe imagenes/<hash>.png: ' + paths.join(','));
  const blk = await page.evaluate(() => MatIA.require('model/board').page().blocks.filter((b) => b.type === 'image'));
  ok(blk.length === 1 && blk[0].src === paths[0] && blk[0].w === 60, 'el bloque guarda la ruta y w=60');
  await page.waitForFunction(() => { const i = document.querySelector('.img-blk img'); return i && i.complete && i.naturalWidth === 400; }, null, { timeout: 5000 }).then(() => ok(true, 'la <img> carga (400 px)'), () => ok(false, 'la <img> no carga'));
  // 2) misma imagen otra vez
  await page.evaluate(() => MatIA.require('storage/assets').insertFromFile(window.__png['#2255cc']));
  await page.waitForTimeout(600);
  ok((await page.evaluate(() => window.__fs.paths())).length === 1, 'la misma imagen no duplica el archivo');
  ok((await page.locator('.img-blk').count()) === 2, 'pero sí crea otro bloque');
  // 3) controles: pie de foto y ancho
  await page.locator('.img-blk .img-cap').first().click();
  await page.keyboard.type('Figura 1');
  await page.evaluate(() => { const g = document.querySelector('.img-grip'); g.style.opacity = 1; });
  const gb = await page.locator('.img-grip').first().boundingBox();
  await page.mouse.move(gb.x + 9, gb.y + 9); await page.mouse.down(); await page.mouse.move(gb.x + 9 + 200, gb.y + 9, { steps: 4 }); await page.mouse.up();
  const b0 = await page.evaluate(() => MatIA.require('model/board').page().blocks.find((b) => b.type === 'image'));
  ok(b0.caption === 'Figura 1', 'pie de foto editable guarda b.caption');
  ok(b0.w > 60 && b0.w <= 100, 'arrastrar el asa cambia el ancho: ' + b0.w);
  // 4) recargar: sin carpeta -> marcador; con carpeta -> imagen
  const fsSnap = await page.evaluate(() => window.__fs.snapshot());
  await page.waitForTimeout(700); // autoguardado del tablero
  await boot();
  await page.waitForSelector('.img-miss:not([hidden])', { timeout: 5000 }).catch(() => {});
  ok((await page.locator('.img-blk .img-miss:visible').count()) === 2, 'sin carpeta muestra «Imagen no encontrada…»');
  ok((await page.locator('.img-miss button', { hasText: 'Historial' }).first().isVisible()), 'el marcador tiene botón para abrir el Historial');
  await page.locator('.img-miss button', { hasText: 'Historial' }).first().click();
  ok(await page.waitForFunction(() => document.getElementById('hist').open, null, { timeout: 3000 }).then(() => true, () => false), 'el botón del marcador abre el Historial');
  await page.evaluate(() => document.getElementById('hist').close());
  if (!(await page.evaluate(() => window.__fs.paths().length))) await page.evaluate((l) => window.__fs.load(l), fsSnap);
  await page.evaluate(async () => { const h = await window.showDirectoryPicker(); await MatIA.require('storage/history').useFolder(MatIA.require('storage/folders').fromHandle(h)); });
  await page.evaluate(() => { const d = document.getElementById('hist'); if (d.open) d.close(); });
  // al conectar la carpeta, las imágenes de la página se recargan solas (sin pulsar «Reintentar»)
  await page.waitForFunction(() => { const i = document.querySelector('.img-blk img'); return i && i.complete && i.naturalWidth === 400; }, null, { timeout: 5000 }).then(() => ok(true, 'con la carpeta restaurada la imagen se muestra sola'), async () => { if (process.env.DBG) console.log(JSON.stringify(await page.evaluate(() => ({ paths: window.__fs.paths(), srcs: MatIA.require('model/board').page().blocks.filter((x) => x.type === 'image').map((x) => x.src), folder: !!MatIA.require('storage/history').folder, imgs: [...document.querySelectorAll('.img-blk')].map((f) => ({ src: (f.querySelector('img') || {}).src, nw: (f.querySelector('img') || {}).naturalWidth, miss: f.querySelector('.img-miss').hidden, loading: f.closest('.blk-body') && f.closest('.blk-body').dataset.loading })) })))); ok(false, 'imagen no se muestra tras restaurar'); });
  // 5) 3000 px -> 1600
  await mkPng(3000, 2000, '#cc3322');
  const r = await page.evaluate(async () => MatIA.require('storage/assets').store(window.__png['#cc3322']));
  const sz = await page.evaluate((p) => window.__fs.size(p), r);
  ok(sz[0] === 1600 && sz[1] === Math.round(2000 * 1600 / 3000), 'imagen de 3000 px reducida a ' + sz.join('x'));
  // 6) saneador
  const san = await page.evaluate(() => {
    const S = MatIA.require('model/schema');
    const f = (x) => S.sanitize({ pages: [{ blocks: [Object.assign({ type: 'image' }, x)] }] }).pages[0].blocks[0];
    return [f({ src: '../x.png' }), f({ src: 'javascript:alert(1)' }), f({ src: 'imagenes/../x.png' }), f({ src: 'imagenes/a.png', w: 500, caption: 'x'.repeat(300), alt: 'y'.repeat(300) }), f({ src: 'imagenes/a.png', w: 1 })];
  });
  ok(san[0].src === '' && san[1].src === '' && san[2].src === '', 'saneador descarta ../x.png, javascript: y imagenes/../');
  ok(san[3].src === 'imagenes/a.png' && san[3].w === 100 && san[3].caption.length === 200 && san[3].alt.length === 200, 'saneador acota w, caption y alt');
  ok(san[4].w === 10, 'w mínimo 10');
  ok(!errors.length, 'sin errores de página: ' + errors.join(' | '));
  await browser.close();
  console.log(fail ? 'images: ' + fail + ' fallo(s)' : 'images: OK');
  process.exit(fail ? 1 : 0);
})();
