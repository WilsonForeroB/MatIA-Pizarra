/* Carpetas de clases: una interfaz común y dos implementaciones intercambiables (Liskov).

   interface Folder {
     name: string;                 // nombre de la carpeta elegida (cualquiera)
     writable: boolean;            // true si la pizarra puede escribir y borrar en ella
     list(): Promise<Array<{ name, date, size, read(): Promise<string> }>>   // solo archivos .json
     write(name, text): Promise<void>     // solo si writable
     remove(name): Promise<void>          // solo si writable
   }

   - fromHandle(handle): Chrome y Edge (File System Access API), lectura y escritura.
   - fromFiles(name, files): Firefox y Safari (<input webkitdirectory>), solo lectura. */
MatIA.define('storage/folders', [], () => {
  'use strict';
  const isJSON = (n) => /\.json$/i.test(n);

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
    };
  }

  function fromFiles(name, files) {
    const json = Array.from(files || []).filter((f) => isJSON(f.name));
    const ro = () => Promise.reject(new Error('Esta carpeta es de solo lectura en este navegador.'));
    return {
      name,
      writable: false,
      async list() { return json.map((f) => ({ name: f.name, date: f.lastModified, size: f.size, read: () => f.text() })); },
      write: ro,
      remove: ro,
    };
  }

  return { fromHandle, fromFiles };
});
