/* Carpeta de clases simulada en memoria (con subcarpetas) para las pruebas de Playwright.
   Uso: await ctx.addInitScript(MOCK, { name, files: [[ruta, texto | {b64, type}]], board }) */
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

module.exports = { MOCK };
