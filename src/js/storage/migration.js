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
     pack({ …, nombres })                                     → solo esas clases y las imágenes que usan (Historial → Exportar)
     fromFiles(files)                                        → paquete a partir de paquetes y/o clases .json sueltas
     planImport(pkg, folder, { suffix })                     → qué pasará con cada clase (nueva | igual | renombrar | invalida), sin escribir
     applyPlan(plan, folder, { clases, imagenes })           → escribe lo planeado y devuelve el informe
     importFiles(pkg, folder, { clases, imagenes, onProgress }) → planImport + applyPlan; informe { clases:{nuevas,iguales,renombradas,invalidas}, imagenes:{nuevas,existentes,invalidas} }
     boardOf(pkg)                                            → tablero saneado | null
     fileName(fecha, prefijo)                                → 'matia-migracion_AAAA-MM-DD_HH-MM.json' (o 'matia-clases_…') */
MatIA.define('storage/migration', ['model/board', 'model/schema'], (S, schema) => {
  'use strict';
  const TIPO = 'matia-migracion', FORMATO = 1;
  const IMG_DIR = 'imagenes';
  const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml' };
  const pad2 = (n) => String(n).padStart(2, '0');

  function fileName(d = new Date(), prefijo = 'matia-migracion') {
    return prefijo + '_' + d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + '_' + pad2(d.getHours()) + '-' + pad2(d.getMinutes()) + '.json';
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
  async function pack({ folder = null, clases = true, imagenes = true, pizarra = true, nombres = null, onProgress = () => {} } = {}) {
    const out = {
      app: 'MatIA Pizarra', tipo: TIPO, formato: FORMATO, creado: new Date().toISOString(),
      origen: location.protocol === 'file:' ? 'archivo local' : location.origin + location.pathname,
      carpeta: folder ? folder.name : null,
      pizarra: null, clases: [], imagenes: [],
    };
    if (pizarra) { S.flush(); out.pizarra = JSON.parse(JSON.stringify(S.board)); }
    if (folder && clases) {
      const only = nombres ? new Set(nombres) : null;
      const items = (await folder.list()).filter((it) => !only || only.has(it.name)).sort((a, b) => a.name.localeCompare(b.name));
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
      // con una selección de clases, solo las imágenes que usan
      const used = nombres ? new Set(out.clases.flatMap((c) => usedImages(c.texto))) : null;
      const files = (await folder.listDir(IMG_DIR)).filter((f) => !used || used.has(f.ruta));
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

  // identidad de una clase: su contenido, sin la marca de hora de guardado (la misma clase guardada otra vez es la misma)
  function contentKey(texto) {
    try { const o = JSON.parse(texto); delete o.guardado; delete o.app; delete o.formato; return JSON.stringify(o); } catch (e) { return texto; }
  }
  const titleOf = (texto) => { try { return String(JSON.parse(texto).title || '').trim(); } catch (e) { return ''; } };

  /** Decide qué pasará con cada clase e imagen SIN escribir nada (para enseñarlo antes de importar).
      action de una clase: 'nueva' | 'igual' (ya está, aunque tenga otro nombre) | 'renombrar' (nombre ocupado por otra distinta) | 'invalida'. */
  async function planImport(pkg, folder, { suffix = 'migrada', onProgress = () => {} } = {}) {
    const plan = { clases: [], imagenes: [] };
    const existing = new Map((await folder.list()).map((it) => [it.name, it]));
    const keys = new Map(), titles = new Map();
    let i = 0;
    for (const it of existing.values()) {
      onProgress('Revisando la carpeta: ' + (++i) + ' de ' + existing.size);
      try { const t = await it.read(); keys.set(contentKey(t), it.name); const ti = titleOf(t); if (ti) titles.set(ti.toLowerCase(), it.name); } catch (e) { /* ilegible */ }
    }
    const taken = new Set(existing.keys());
    for (const c of pkg.clases) {
      const name = safeName(c.nombre);
      let ok = false;
      try { ok = !!schema.sanitize(JSON.parse(c.texto)); } catch (e) { ok = false; }
      const row = { nombre: c.nombre, titulo: titleOf(c.texto), texto: c.texto, target: null, action: 'invalida', como: null, mismoTitulo: null };
      if (name && ok) {
        const k = contentKey(c.texto);
        if (keys.has(k)) { row.action = 'igual'; row.como = keys.get(k); }
        else {
          let target = name;
          if (taken.has(name)) {
            const base = name.replace(/\.json$/i, '');
            let n = 1;
            do { target = base + '_' + suffix + (n > 1 ? '-' + n : '') + '.json'; n++; } while (taken.has(target));
          }
          row.target = target; row.action = target === name ? 'nueva' : 'renombrar';
          if (row.titulo && titles.has(row.titulo.toLowerCase())) row.mismoTitulo = titles.get(row.titulo.toLowerCase());
          taken.add(target); keys.set(k, target);
          if (row.titulo) titles.set(row.titulo.toLowerCase(), target);
        }
      }
      plan.clases.push(row);
    }
    for (const m of pkg.imagenes) {
      const ruta = safeImg(m.ruta);
      let action = 'invalida';
      if (ruta) {
        // el nombre es la huella del contenido: si ya existe, es la misma imagen
        action = 'nueva';
        try { await folder.readFile(ruta); action = 'igual'; } catch (e) { /* no existe */ }
        if (action === 'nueva' && plan.imagenes.some((x) => x.ruta === ruta)) action = 'igual';
      }
      plan.imagenes.push({ ruta, m, action });
    }
    onProgress('');
    return plan;
  }

  /** Escribe lo que dice el plan. */
  async function applyPlan(plan, folder, { clases = true, imagenes = true, onProgress = () => {} } = {}) {
    const rep = { clases: { nuevas: [], iguales: [], renombradas: [], invalidas: [] }, imagenes: { nuevas: 0, existentes: 0, invalidas: 0 } };
    if (!folder || !folder.writable) throw new Error('La carpeta de clases no deja escribir.');
    if (imagenes) {
      let i = 0;
      for (const x of plan.imagenes) {
        onProgress('Copiando imágenes: ' + (++i) + ' de ' + plan.imagenes.length);
        if (x.action === 'invalida') { rep.imagenes.invalidas++; continue; }
        if (x.action === 'igual') { rep.imagenes.existentes++; continue; }
        try { await folder.writeFile(x.ruta, fromB64(x.m.datos, mimeOf(x.ruta, x.m.tipo))); rep.imagenes.nuevas++; } catch (e) { rep.imagenes.invalidas++; }
      }
    }
    if (clases) {
      let i = 0;
      for (const c of plan.clases) {
        onProgress('Copiando clases: ' + (++i) + ' de ' + plan.clases.length);
        if (c.action === 'invalida') { rep.clases.invalidas.push(c.nombre); continue; }
        if (c.action === 'igual') { rep.clases.iguales.push(c.como); continue; }
        try { await folder.write(c.target, c.texto); (c.action === 'nueva' ? rep.clases.nuevas : rep.clases.renombradas).push(c.target); }
        catch (e) { rep.clases.invalidas.push(c.nombre); }
      }
    }
    onProgress('');
    return rep;
  }

  async function importFiles(pkg, folder, opts = {}) {
    if (!folder || !folder.writable) throw new Error('La carpeta de clases no deja escribir.');
    return applyPlan(await planImport(pkg, folder, opts), folder, opts);
  }

  /** Paquete a partir de archivos sueltos: clases .json (las de «Guardar archivo» o las de la carpeta) y/o paquetes. */
  async function fromFiles(files) {
    const pkg = { creado: null, origen: '', carpeta: null, pizarra: null, clases: [], imagenes: [], rechazados: [] };
    for (const f of Array.from(files || [])) {
      let o = null, texto = '';
      try { texto = await f.text(); o = JSON.parse(texto); } catch (e) { o = null; }
      if (isPackage(o)) {
        try { const p = parse(texto); pkg.clases.push(...p.clases); pkg.imagenes.push(...p.imagenes); if (!pkg.creado) { pkg.creado = p.creado; pkg.origen = p.origen; pkg.carpeta = p.carpeta; } }
        catch (e) { pkg.rechazados.push(f.name + ': ' + e.message); }
      } else if (o && Array.isArray(o.pages)) pkg.clases.push({ nombre: /\.json$/i.test(f.name) ? f.name : f.name + '.json', fecha: f.lastModified || null, texto });
      else pkg.rechazados.push(f.name + ': no es una clase de la pizarra');
    }
    return pkg;
  }

  const usedImages = (texto) => Array.from(new Set(String(texto).match(/imagenes\/[A-Za-z0-9._-]+/g) || []));

  return { TIPO, FORMATO, pack, parse, importFiles, planImport, applyPlan, fromFiles, boardOf, fileName, isPackage, usedImages };
});
