/* Almacén clave-valor en IndexedDB. Sirve para recordar la carpeta elegida entre sesiones
   (los «handles» de carpeta no caben en localStorage). Si IndexedDB no está disponible, devuelve null sin fallar. */
MatIA.define('storage/kv-store', [], () => {
  'use strict';
  const DB = 'matia-pizarra', STORE = 'kv';
  function db() {
    return new Promise((res, rej) => {
      try {
        const r = indexedDB.open(DB, 1);
        r.onupgradeneeded = () => r.result.createObjectStore(STORE);
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      } catch (e) { rej(e); }
    });
  }
  return {
    async get(k) {
      try { const d = await db(); return await new Promise((res) => { const q = d.transaction(STORE).objectStore(STORE).get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(null); }); } catch (e) { return null; }
    },
    async set(k, v) {
      try { const d = await db(); await new Promise((res) => { const t = d.transaction(STORE, 'readwrite'); t.objectStore(STORE).put(v, k); t.oncomplete = res; t.onerror = res; }); } catch (e) { /* sin IndexedDB: no se recuerda la carpeta */ }
    },
  };
});
