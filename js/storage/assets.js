/* Imágenes de la clase: se guardan como archivos en 'imagenes/' de la carpeta de clases (nunca dentro del .json).
   API:
     store(fileOrBlob)                 → 'imagenes/<sha256 16 hex>.<ext>' | null   (png, jpg, webp, gif, svg; reduce a 1600 px)
     url(ruta)                         → Promise<objectURL>   (caché por ruta; rechaza si no se puede leer)
     insertFromFile(file)              → bloque image después de la línea activa
     insertFromClipboardOrDrop(dt)     → true si había una imagen (DataTransfer del portapapeles o de arrastrar y soltar)
     isImageFile(f), MAX */
MatIA.define('storage/assets', [], () => {
  'use strict';
  const R = (n) => MatIA.require(n);
  const MAX = 1600;
  const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg' };
  const BYNAME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml' };
  const mimeOf = (f) => {
    if (EXT[f.type]) return f.type;
    const m = /\.([a-z0-9]+)$/i.exec(f.name || '');
    return m ? BYNAME[m[1].toLowerCase()] || null : null;
  };
  const isImageFile = (f) => !!f && !!mimeOf(f);

  async function hash16(blob) {
    const buf = await blob.arrayBuffer();
    if (window.crypto && crypto.subtle) {
      const d = new Uint8Array(await crypto.subtle.digest('SHA-256', buf));
      return Array.from(d.slice(0, 8), (x) => x.toString(16).padStart(2, '0')).join('');
    }
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57; // alternativa sin contexto seguro (no criptográfica)
    for (const c of new Uint8Array(buf)) { h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
    return ((h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0'));
  }

  async function prepare(file) { // → { blob, ext }
    const mime = mimeOf(file);
    if (!mime) throw new Error('Formato de imagen no admitido.');
    let blob = file.type === mime ? file : new Blob([file], { type: mime });
    if (mime === 'image/svg+xml' || mime === 'image/gif') return { blob, ext: EXT[mime] };
    try {
      const bmp = await createImageBitmap(blob);
      const big = Math.max(bmp.width, bmp.height);
      if (big > MAX) {
        const k = MAX / big, w = Math.max(1, Math.round(bmp.width * k)), h = Math.max(1, Math.round(bmp.height * k));
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        cv.getContext('2d').drawImage(bmp, 0, 0, w, h);
        const out = await new Promise((res) => cv.toBlob(res, mime, 0.9));
        if (out && out.type === mime) blob = out;
      }
      if (bmp.close) bmp.close();
    } catch (e) { /* no se puede decodificar: se guarda tal cual */ }
    return { blob, ext: EXT[mime] };
  }

  const history = () => R('storage/history');
  const access = () => R('storage/folder-access');

  async function unsupported(blob, ext, name) {
    const go = await R('ui/dialogs').ask({
      title: 'Insertar imágenes necesita Chrome o Edge',
      text: 'Este navegador no deja guardar archivos en la carpeta de clases. Puedes descargar la imagen y copiarla a mano a la carpeta «imagenes» de tu carpeta de clases (créala si no existe) con el nombre «' + name + '».',
      label: 'Aviso', pio: 'lectura',
      buttons: [{ label: 'Cerrar', value: false, kind: 'ghost' }, { label: 'Descargar la imagen', value: true, kind: 'primary', focus: true }],
    });
    if (go) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }
  }

  async function writableFolder() {
    const h = history();
    if (h.folder && h.folder.writable) return h.folder;
    const acc = access();
    let r = await acc.restore();
    let f = r && r.folder;
    if (!f) f = r && r.pending ? await acc.reconnect() : await acc.pick({ reason: 'Para guardar imágenes necesito la carpeta de clases.' });
    if (!f) return null;
    await h.useFolder(f);
    return f.writable ? f : null;
  }

  async function store(file) {
    const { blob, ext } = await prepare(file);
    const name = (await hash16(blob)) + '.' + ext;
    if (!access().supported) { await unsupported(blob, ext, name); return null; }
    const f = await writableFolder();
    if (!f) return null;
    const ruta = 'imagenes/' + name;
    try { await f.readFile(ruta); } catch (e) { await f.writeFile(ruta, blob); } // mismo contenido = mismo archivo
    return ruta;
  }

  const cache = new Map();
  let cacheFolder = null;
  async function url(ruta) {
    let f = history().folder;
    if (!f) { const r = await access().restore(); f = r && r.folder; if (f) await history().useFolder(f); }
    if (!f) throw new Error('No hay carpeta conectada.');
    if (f !== cacheFolder) { cacheFolder = f; for (const p of cache.values()) p.then((u) => URL.revokeObjectURL(u), () => {}); cache.clear(); }
    if (!cache.has(ruta)) {
      const p = f.readFile(ruta).then((b) => URL.createObjectURL(b));
      cache.set(ruta, p);
      p.catch(() => { if (cache.get(ruta) === p) cache.delete(ruta); });
    }
    return cache.get(ruta);
  }

  async function insertFromFile(file) {
    if (!isImageFile(file)) { R('ui/toast')('Ese archivo no es una imagen (PNG, JPG, WebP, GIF o SVG).', 'aviso'); return null; }
    let ruta;
    try { ruta = await store(file); } catch (e) { R('ui/toast')('No se ha podido guardar la imagen: ' + ((e && e.message) || e), 'aviso'); return null; }
    if (!ruta) return null;
    const ed = R('blocks/editor'), S = R('model/board');
    const b = ed.activeBlock();
    const pb = S.page().blocks;
    R('ui/ops-menu').insertSpecs(b ? b.id : pb.length ? pb[pb.length - 1].id : null, [{ type: 'image', src: ruta, w: 60, caption: '', alt: '' }], b);
    return ruta;
  }

  function insertFromClipboardOrDrop(dt) {
    const fs = Array.from((dt && dt.files) || []).filter(isImageFile);
    if (!fs.length && dt && dt.items) for (const it of dt.items) { if (it.kind === 'file' && EXT[it.type]) { const f = it.getAsFile(); if (f) fs.push(f); } }
    if (!fs.length) return false;
    (async () => { for (const f of fs) await insertFromFile(f); })();
    return true;
  }

  return { store, url, insertFromFile, insertFromClipboardOrDrop, isImageFile, MAX };
});
