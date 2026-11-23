/* Paquete de migración: lleva todo lo de una pizarra a otro servidor (u otro ordenador / navegador).
   Lo guardado en el navegador (localStorage, carpeta recordada) depende de la dirección de la página: al cambiar
   de servidor se pierde. Este paquete es UN archivo .json con:
     { app, tipo:'matia-migracion', formato:1, creado, origen, carpeta,
       pizarra:  tablero abierto con sus preferencias (tema, color, tamaño de letra y de página…) | null,
       clases:   [{ nombre, fecha, texto }]          ← cada .json del historial, tal cual
       imagenes: [{ ruta, tipo, fecha, datos }] }    ← archivos de imagenes/ en base64
   Nada se envía a ningún sitio: el paquete se descarga y se elige a mano en la otra pizarra.
   API:
     pack({ folder, clases, imagenes, pizarra, onProgress })  → paquete (objeto)
     parse(texto)                                            → paquete validado | lanza Error con mensaje para la persona
     importFiles(pkg, folder, { clases, imagenes, onProgress }) → informe { clases:{nuevas,iguales,renombradas,invalidas}, imagenes:{nuevas,existentes,invalidas} }
     boardOf(pkg)                                            → tablero saneado | null
     fileName()                                              → 'matia-migracion_AAAA-MM-DD_HH-MM.json' */
MatIA.define('storage/migration', ['model/board', 'model/schema'], (S, schema) => {
  'use strict';
  const TIPO = 'matia-migracion', FORMATO = 1;
  const IMG_DIR = 'imagenes';
  const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml' };
  const pad2 = (n) => String(n).padStart(2, '0');

  function fileName(d = new Date()) {
    return 'matia-migracion_' + d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + '_' + pad2(d.getHours()) + '-' + pad2(d.getMinutes()) + '.json';
  }
  const mimeOf = (name, type) => type || MIME[(/\.([a-z0-9]+)$/i.exec(name || '') || [])[1]?.toLowerCase()] || 'application/octet-stream';

  const toB64 = (blob) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).slice(String(r.result).indexOf(',') + 1));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });
  function fromB64(b64, type) {
    const bin = atob(b64);
    const u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return new Blob([u], { type });
  }
  const isPackage = (o) => !!o && typeof o === 'object' && o.tipo === TIPO;

  /* ---------- Exportar ---------- */
  async function pack({ folder = null, clases = true, imagenes = true, pizarra = true, onProgress = () => {} } = {}) {
    const out = {
      app: 'MatIA Pizarra', tipo: TIPO, formato: FORMATO, creado: new Date().toISOString(),
      origen: location.protocol === 'file:' ? 'archivo local' : location.origin + location.pathname,
      carpeta: folder ? folder.name : null,
      pizarra: null, clases: [], imagenes: [],
    };
    if (pizarra) { S.flush(); out.pizarra = JSON.parse(JSON.stringify(S.board)); }
    if (folder && clases) {
      const items = (await folder.list()).sort((a, b) => a.name.localeCompare(b.name));
      let i = 0;
      for (const it of items) {
        onProgress('Leyendo clases: ' + (++i) + ' de ' + items.length);
        let texto;
        try { texto = await it.read(); } catch (e) { continue; }
        try { if (isPackage(JSON.parse(texto))) continue; } catch (e) { continue; } // otro paquete o un .json que no es una clase
        out.clases.push({ nombre: it.name, fecha: it.date || null, texto });
      }
    }
    if (folder && imagenes && folder.listDir) {
      const files = await folder.listDir(IMG_DIR);
      let i = 0;
      for (const f of files) {
        onProgress('Leyendo imágenes: ' + (++i) + ' de ' + files.length);
        try {
          const b = await f.blob();
          out.imagenes.push({ ruta: f.ruta, tipo: mimeOf(f.name, b.type), fecha: f.date || null, datos: await toB64(b) });
        } catch (e) { /* ilegible: se omite */ }
      }
    }
    onProgress('');
    return out;
  }

  /* ---------- Importar ---------- */
  function parse(texto) {
    let o;
    try { o = JSON.parse(texto); } catch (e) { throw new Error('El archivo no es un paquete de migración (no es JSON válido).'); }
    if (!isPackage(o)) {
      if (o && Array.isArray(o.pages)) throw new Error('Este archivo es una clase suelta, no un paquete de migración. Ábrela con «⋯ → Abrir archivo…».');
      throw new Error('El archivo no es un paquete de migración de MatIA.');
    }
    if (o.formato > FORMATO) throw new Error('El paquete se hizo con una versión más nueva de la pizarra. Actualiza esta pizarra e inténtalo otra vez.');
    return {
      creado: o.creado || null, origen: o.origen || '', carpeta: o.carpeta || null,
      pizarra: o.pizarra && typeof o.pizarra === 'object' ? o.pizarra : null,
      clases: Array.isArray(o.clases) ? o.clases.filter((c) => c && typeof c.nombre === 'string' && typeof c.texto === 'string') : [],
      imagenes: Array.isArray(o.imagenes) ? o.imagenes.filter((m) => m && typeof m.ruta === 'string' && typeof m.datos === 'string') : [],
    };
  }

  const boardOf = (pkg) => (pkg && pkg.pizarra ? schema.sanitize(JSON.parse(JSON.stringify(pkg.pizarra))) : null);
  // solo un nombre de archivo .json, sin carpetas
  const safeName = (n) => { const b = String(n).split(/[\\/]/).pop().replace(/[\u0000-\u001f<>:"|?*]/g, '').trim(); return /\.json$/i.test(b) && b.length > 5 ? b : null; };
  const safeImg = (r) => (/^imagenes\/[A-Za-z0-9._-]+$/.test(r) && !r.includes('..') ? r : null);

  async function importFiles(pkg, folder, { clases = true, imagenes = true, onProgress = () => {} } = {}) {
    const rep = { clases: { nuevas: [], iguales: [], renombradas: [], invalidas: [] }, imagenes: { nuevas: 0, existentes: 0, invalidas: 0 } };
    if (!folder || !folder.writable) throw new Error('La carpeta de clases no deja escribir.');
    if (imagenes) {
      let i = 0;
      for (const m of pkg.imagenes) {
        onProgress('Copiando imágenes: ' + (++i) + ' de ' + pkg.imagenes.length);
        const ruta = safeImg(m.ruta);
        if (!ruta) { rep.imagenes.invalidas++; continue; }
        // el nombre es la huella del contenido: si ya existe, es la misma imagen
        let exists = false;
        try { await folder.readFile(ruta); exists = true; } catch (e) { /* no existe */ }
        if (exists) { rep.imagenes.existentes++; continue; }
        try { await folder.writeFile(ruta, fromB64(m.datos, mimeOf(ruta, m.tipo))); rep.imagenes.nuevas++; } catch (e) { rep.imagenes.invalidas++; }
      }
    }
    if (clases) {
      const existing = new Map((await folder.list()).map((it) => [it.name, it]));
      // contenido de las clases que ya hay: una clase idéntica (con su nombre o ya migrada antes) no se vuelve a copiar
      let texts = null;
      const sameExists = async (texto) => {
        if (!texts) { texts = new Set(); for (const it of existing.values()) { try { texts.add(await it.read()); } catch (e) { /* ilegible */ } } }
        return texts.has(texto);
      };
      let i = 0;
      for (const c of pkg.clases) {
        onProgress('Copiando clases: ' + (++i) + ' de ' + pkg.clases.length);
        const name = safeName(c.nombre);
        let ok = false;
        try { ok = !!schema.sanitize(JSON.parse(c.texto)); } catch (e) { ok = false; }
        if (!name || !ok) { rep.clases.invalidas.push(c.nombre); continue; }
        let target = name;
        if (existing.has(name)) {
          if (await sameExists(c.texto)) { rep.clases.iguales.push(name); continue; }
          const base = name.replace(/\.json$/i, '');
          let n = 1;
          do { target = base + '_migrada' + (n > 1 ? '-' + n : '') + '.json'; n++; } while (existing.has(target));
        }
        try {
          await folder.write(target, c.texto);
          existing.set(target, { name: target, read: async () => c.texto });
          if (texts) texts.add(c.texto);
          (target === name ? rep.clases.nuevas : rep.clases.renombradas).push(target);
        } catch (e) { rep.clases.invalidas.push(c.nombre); }
      }
    }
    onProgress('');
    return rep;
  }

  return { TIPO, FORMATO, pack, parse, importFiles, boardOf, fileName, isPackage };
});
