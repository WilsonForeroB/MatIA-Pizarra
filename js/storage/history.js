/* Historial en carpeta (pizarramatia/historial): IndexedDB, lectura/escritura, guardado automático (pizarra.html 7423-7630). */
MatIA.define('storage/history', ['core/dom', 'model/board', 'model/schema', 'ui/state', 'ui/toast', 'assets/pio', 'core/event-bus'], (dom, S, schema, st, toast, pio, bus) => {
  'use strict';
  const { $, $$ } = dom;
  const { sanitize } = schema;
  const R = (n) => MatIA.require(n);
  /* ---------------- Historial (carpeta pizarramatia/historial) ----------------
     Chrome y Edge: acceso de lectura y escritura a la carpeta con el permiso de quien usa la pizarra.
     Otros navegadores: lectura de la carpeta y guardado como descarga. */
  const hist = $('#hist');
  const FS_OK = typeof window.showDirectoryPicker === 'function';
  let histDir = null, histRO = null, sessionFile = null, autoT = null, lastAutoJSON = '';
  const IDB = {
    db() { return new Promise((res, rej) => { try { const r = indexedDB.open('matia-pizarra', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } }); },
    async get(k) { try { const d = await IDB.db(); return await new Promise((res) => { const q = d.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(null); }); } catch (e) { return null; } },
    async set(k, v) { try { const d = await IDB.db(); await new Promise((res) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = res; t.onerror = res; }); } catch (e) { /* sin IndexedDB */ } },
  };
  const pad2 = (n) => String(n).padStart(2, '0');
  const slug = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
  function stampName() {
    const d = new Date();
    const base = d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + '_' + pad2(d.getHours()) + '-' + pad2(d.getMinutes());
    const t = slug(S.board.title || '');
    return base + (t ? '_' + t : '') + '.json';
  }
  function boardJSON() {
    return JSON.stringify(Object.assign({ app: 'MatIA Pizarra', formato: 1, guardado: new Date().toISOString() }, S.board), null, 1);
  }
  function setStatus() {
    const st = $('#histStatus');
    st.classList.toggle('on', !!(histDir || histRO));
    st.textContent = histDir ? 'Carpeta: ' + histDir.name + ' (lectura y escritura)' : histRO ? 'Carpeta: ' + histRO.name + ' (solo lectura)' : 'Carpeta: sin conectar';
    $('#histConnect').hidden = !FS_OK;
    $('#histConnect').textContent = histDir ? 'Cambiar carpeta' : 'Conectar carpeta';
    $('#histPickRO').hidden = FS_OK;
    $('#histSave').textContent = histDir || FS_OK ? 'Guardar en el historial' : 'Descargar para el historial';
    $('#histAuto').disabled = !histDir;
    if (!FS_OK) $('#histHelp').innerHTML = 'Este navegador no permite que la página escriba en una carpeta. Puedes <b>elegir la carpeta historial</b> para ver y abrir lo guardado, y <b>descargar</b> cada clase: después mueve el archivo descargado a <code>pizarramatia/historial</code>. Con Chrome o Edge se guarda directamente.';
  }
  async function useDir(dir) {
    // si eligen la carpeta pizarramatia, se usa (o crea) su subcarpeta historial
    if (dir.name !== 'historial') {
      try { dir = await dir.getDirectoryHandle('historial', { create: true }); } catch (e) { /* se usa la elegida */ }
    }
    histDir = dir; histRO = null;
    await IDB.set('histDir', dir);
    setStatus();
    await listHist();
  }
  $('#histConnect').addEventListener('click', async () => {
    try { const d = await window.showDirectoryPicker({ id: 'matia-historial', mode: 'readwrite' }); await useDir(d); }
    catch (e) { if (e && e.name !== 'AbortError') toast('No se ha podido abrir la carpeta: ' + (e.message || e), 'aviso'); }
  });
  $('#histReconnect').addEventListener('click', async () => {
    const d = await IDB.get('histDir');
    if (!d) return;
    try { if ((await d.requestPermission({ mode: 'readwrite' })) === 'granted') { $('#histReconnect').hidden = true; await useDir(d); } } catch (e) { toast('No se ha podido reconectar la carpeta.', 'aviso'); }
  });
  $('#histPickRO').addEventListener('click', () => $('#histDirIn').click());
  $('#histDirIn').addEventListener('change', (e) => {
    const files = [...(e.target.files || [])].filter((f) => /\.json$/i.test(f.name));
    const first = e.target.files && e.target.files[0];
    histRO = { name: first ? (first.webkitRelativePath || '').split('/')[0] || 'historial' : 'historial', files };
    histDir = null;
    setStatus();
    listHist();
    e.target.value = '';
  });
  async function readEntries() {
    const out = [];
    if (histDir) {
      for await (const h of histDir.values()) {
        if (h.kind !== 'file' || !/\.json$/i.test(h.name)) continue;
        try { const f = await h.getFile(); out.push({ name: h.name, date: f.lastModified, size: f.size, get: () => f.text(), handle: h }); } catch (e) { /* ilegible */ }
      }
    } else if (histRO) {
      for (const f of histRO.files) out.push({ name: f.name, date: f.lastModified, size: f.size, get: () => f.text() });
    }
    return out.sort((a, b) => b.name.localeCompare(a.name));
  }
  const fmtDate = (t) => { const d = new Date(t); return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()); };
  async function listHist() {
    const list = $('#histList');
    list.textContent = '';
    const emptyMsg = (t) => { const d = document.createElement('div'); d.className = 'hist-empty'; d.appendChild(pio.badge('lectura', 'pio-lg', 'Pío leyendo')); const sp = document.createElement('span'); sp.textContent = t; d.appendChild(sp); list.appendChild(d); };
    if (!histDir && !histRO) { emptyMsg('Conecta la carpeta para ver las clases guardadas.'); return; }
    let items;
    try { items = await readEntries(); } catch (e) { list.innerHTML = '<div class="hist-empty">No se puede leer la carpeta. Pulsa «Reconectar» o vuelve a elegirla.</div>'; return; }
    if (!items.length) { emptyMsg('Todavía no hay clases guardadas en esta carpeta. Pulsa «Guardar en el historial».'); return; }
    for (const it of items) {
      const row = document.createElement('div');
      row.className = 'hist-item' + (it.name === sessionFile ? ' cur' : '');
      row.setAttribute('role', 'listitem');
      const info = document.createElement('div');
      const nice = it.name.replace(/\.json$/i, '').replace(/^(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})_?/, '').replace(/-/g, ' ');
      info.innerHTML = '<b></b><small></small>';
      info.querySelector('b').textContent = nice ? nice.charAt(0).toUpperCase() + nice.slice(1) : 'Clase sin título';
      info.querySelector('small').textContent = it.name + ' · ' + fmtDate(it.date) + ' · ' + Math.max(1, Math.round(it.size / 1024)) + ' KB' + (it.name === sessionFile ? ' · clase actual' : '');
      const acts = document.createElement('div');
      acts.className = 'acts';
      const mk = (label, fn, primary) => { const bt = document.createElement('button'); bt.type = 'button'; bt.className = 'mi-btn mi-btn--sm' + (primary ? ' mi-btn--primary' : ''); bt.textContent = label; bt.addEventListener('click', fn); acts.appendChild(bt); };
      mk('Abrir', () => openHist(it, false), true);
      mk('Añadir páginas', () => openHist(it, true));
      if (it.handle && histDir) mk('Borrar', async () => {
        const ok = await R('ui/dialogs').ask({ title: '¿Borrar esta clase del historial?', text: '«' + it.name + '» se eliminará de la carpeta y no se puede deshacer.', pio: 'lectura', warn: true, label: 'Aviso',
          buttons: [{ label: 'Cancelar', value: false, kind: 'ghost', focus: true }, { label: 'Borrar', value: true, kind: 'danger' }] });
        if (!ok) return;
        try { await histDir.removeEntry(it.name); if (sessionFile === it.name) sessionFile = null; listHist(); } catch (e) { toast('No se ha podido borrar el archivo.', 'aviso'); }
      });
      row.append(info, acts);
      list.appendChild(row);
    }
  }
  async function openHist(it, append) {
    let data;
    try { data = sanitize(JSON.parse(await it.get())); } catch (e) { data = null; }
    if (!data) { toast('«' + it.name + '» no es una pizarra válida.', 'aviso'); return; }
    if (append) {
      const from = S.board.pages.length;
      S.board.pages.push(...data.pages);
      S.board.cur = from;
      toast('Añadidas ' + data.pages.length + (data.pages.length === 1 ? ' página' : ' páginas') + ' de «' + it.name + '».');
    } else {
      if (!(await R('storage/dirty').guardUnsaved('abrir «' + it.name.replace(/\.json$/i, '') + '»'))) return;
      const keep = { theme: S.board.theme, accent: S.board.accent, scale: S.board.scale };
      S.replace(Object.assign(data, keep));
      sessionFile = histDir ? it.name : null;
      lastAutoJSON = JSON.stringify(S.board);
      R('storage/dirty').markSaved();
      toast('Abierta «' + it.name + '».');
    }
    $('#histName').value = S.board.title || '';
    R('ui/view').applySettings();
    R('blocks/editor').renderPage();
    S.save();
    hist.close();
  }
  async function writeHist(name) {
    const fh = await histDir.getFileHandle(name, { create: true });
    const w = await fh.createWritable();
    await w.write(boardJSON());
    await w.close();
  }
  $('#histSave').addEventListener('click', async () => {
    S.board.title = $('#histName').value.trim();
    S.save();
    await saveToHistory();
  });
  async function saveToHistory() {
    if (!histDir && FS_OK) {
      // primero se conecta la carpeta y luego se guarda
      try { await useDir(await window.showDirectoryPicker({ id: 'matia-historial', mode: 'readwrite' })); }
      catch (e) { if (e && e.name !== 'AbortError') toast('No se ha podido abrir la carpeta: ' + (e.message || e), 'aviso'); return false; }
    }
    if (!histDir) {
      const blob = new Blob([boardJSON()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = stampName();
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      toast('Descargado «' + a.download + '». Muévelo a la carpeta pizarramatia/historial.');
      R('storage/dirty').markSaved();
      return true;
    }
    try {
      // dentro de la misma clase se reescribe el mismo archivo
      if (!sessionFile) sessionFile = stampName();
      await writeHist(sessionFile);
      lastAutoJSON = JSON.stringify(S.board);
      R('storage/dirty').markSaved();
      toast('Guardado en el historial: ' + sessionFile);
      listHist();
      return true;
    } catch (e) { toast('No se ha podido guardar en la carpeta: ' + (e.message || e), 'aviso'); return false; }
  }
  $('#histName').addEventListener('change', () => { S.board.title = $('#histName').value.trim(); S.save(); });
  $('#histAuto').addEventListener('change', (e) => { S.board.histAuto = e.target.checked; S.save(); if (e.target.checked) autoSave(); });
  async function autoSave() {
    if (!histDir || !$('#histAuto').checked) return;
    const now = JSON.stringify(S.board);
    if (now === lastAutoJSON) return;
    try {
      if (!sessionFile) sessionFile = stampName();
      await writeHist(sessionFile);
      lastAutoJSON = now;
      R('storage/dirty').markSaved();
    } catch (e) { /* se reintenta en el siguiente cambio */ }
  }
  bus.on('board:persisted', () => { clearTimeout(autoT); autoT = setTimeout(autoSave, 4000); });
  $('#histBtn').addEventListener('click', async () => {
    $('#histName').value = S.board.title || '';
    $('#histAuto').checked = !!S.board.histAuto;
    setStatus();
    hist.showModal();
    if (!histDir && FS_OK) {
      const d = await IDB.get('histDir');
      if (d && d.queryPermission) {
        try {
          const p = await d.queryPermission({ mode: 'readwrite' });
          if (p === 'granted') await useDir(d);
          else { $('#histReconnect').hidden = false; $('#histStatus').textContent = 'Carpeta: ' + d.name + ' (pulsa Reconectar para dar permiso)'; }
        } catch (e) { /* handle caducado */ }
      }
    }
    listHist();
  });
  $('#histClose').addEventListener('click', () => hist.close());
  // al arrancar, si la carpeta ya tiene permiso, el guardado automático sigue funcionando
  (async () => {
    if (!FS_OK || !S.board.histAuto) return;
    const d = await IDB.get('histDir');
    try { if (d && (await d.queryPermission({ mode: 'readwrite' })) === 'granted') { histDir = d.name === 'historial' ? d : d; $('#histAuto').checked = true; } } catch (e) { /* */ }
  })();
  const clearSession = () => { sessionFile = null; };
  return { hist, FS_OK, IDB, pad2, slug, stampName, boardJSON, setStatus, useDir, readEntries, fmtDate, listHist, openHist, writeHist, saveToHistory, autoSave, clearSession, get histDir() { return histDir; } };
});
