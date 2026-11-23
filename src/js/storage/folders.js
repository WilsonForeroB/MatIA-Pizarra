/* Carpetas de clases: una interfaz común y dos implementaciones intercambiables (Liskov).

   interface Folder {
     name: string;                 // nombre de la carpeta elegida (cualquiera)
     writable: boolean;            // true si la pizarra puede escribir y borrar en ella
     list(): Promise<Array<{ name, date, size, read(): Promise<string> }>>   // solo archivos .json
     write(name, text): Promise<void>     // solo si writable
     remove(name): Promise<void>          // solo si writable
     readFile(ruta): Promise<Blob>        // ruta relativa con subcarpetas, p. ej. 'imagenes/ab12.png'
     writeFile(ruta, blob): Promise<void> // crea las subcarpetas; solo si writable
     listDir(sub): Promise<Array<{ ruta, name, date, size, blob(): Promise<Blob> }>>  // archivos de una subcarpeta (vacío si no existe)
   }

   - fromHandle(handle): Chrome y Edge (File System Access API), lectura y escritura.
   - fromFiles(name, files): Firefox y Safari (<input webkitdirectory>), solo lectura. */
MatIA.define('storage/folders', [], () => {
  'use strict';
  const isJSON = (n) => /\.json$/i.test(n);

  const parts = (ruta) => {
    const p = String(ruta || '').split('/').filter(Boolean);
    if (!p.length || p.some((x) => x === '..' || x === '.')) throw new Error('Ruta no válida: ' + ruta);
    return p;
  };

  function fromHandle(handle) {
    return {
      name: handle.name,
      writable: true,
      handle,
      async list() {
        const out = [];
        for await (const h of handle.values()) {
          if (h.kind !== 'file' || !isJSON(h.name)) continue;
          try { const f = await h.getFile(); out.push({ name: h.name, date: f.lastModified, size: f.size, read: () => f.text() }); } catch (e) { /* archivo ilegible: se omite */ }
        }
        return out;
      },
      async write(name, text) {
        const fh = await handle.getFileHandle(name, { create: true });
        const w = await fh.createWritable();
        await w.write(text);
        await w.close();
      },
      remove: (name) => handle.removeEntry(name),
      async readFile(ruta) {
        const p = parts(ruta); let d = handle;
        for (const x of p.slice(0, -1)) d = await d.getDirectoryHandle(x);
        return (await d.getFileHandle(p[p.length - 1])).getFile();
      },
      async writeFile(ruta, blob) {
        const p = parts(ruta); let d = handle;
        for (const x of p.slice(0, -1)) d = await d.getDirectoryHandle(x, { create: true });
        const fh = await d.getFileHandle(p[p.length - 1], { create: true });
        const w = await fh.createWritable();
        await w.write(blob);
        await w.close();
      },
      async listDir(sub) {
        const p = parts(sub); let d = handle;
        try { for (const x of p) d = await d.getDirectoryHandle(x); } catch (e) { return []; }
        const out = [], base = p.join('/') + '/';
        for await (const h of d.values()) {
          if (h.kind !== 'file') continue;
          try { const f = await h.getFile(); out.push({ ruta: base + h.name, name: h.name, date: f.lastModified, size: f.size, blob: async () => f }); } catch (e) { /* ilegible: se omite */ }
        }
        return out;
      },
    };
  }

  function fromFiles(name, files) {
    const all = Array.from(files || []);
    const json = all.filter((f) => isJSON(f.name) && (f.webkitRelativePath || '').split('/').length <= 2);
    const rel = (f) => (f.webkitRelativePath || f.name).split('/').slice(1).join('/') || f.name;
    const ro = () => Promise.reject(new Error('Esta carpeta es de solo lectura en este navegador.'));
    return {
      name,
      writable: false,
      async list() { return json.map((f) => ({ name: f.name, date: f.lastModified, size: f.size, read: () => f.text() })); },
      write: ro,
      remove: ro,
      async readFile(ruta) {
        const r = parts(ruta).join('/');
        const f = all.find((x) => rel(x) === r);
        if (!f) throw new Error('No se encuentra ' + r);
        return f;
      },
      writeFile: ro,
      async listDir(sub) {
        const base = parts(sub).join('/') + '/';
        return all.filter((f) => { const r = rel(f); return r.startsWith(base) && !r.slice(base.length).includes('/'); })
          .map((f) => ({ ruta: rel(f), name: f.name, date: f.lastModified, size: f.size, blob: async () => f }));
      },
    };
  }

  return { fromHandle, fromFiles };
});
