/* Historial de clases en una carpeta elegida por quien usa la pizarra (cualquier carpeta).
   Este módulo solo conoce la interfaz Folder (storage/folders); cómo se consigue la carpeta y sus permisos
   es cosa de storage/folder-access (inversión de dependencias).
   - Chrome y Edge: abrir, guardar, añadir páginas y borrar directamente en la carpeta; guardado automático.
   - Firefox y Safari: leer la carpeta y guardar descargando el .json. */
MatIA.define('storage/history', ['core/dom', 'model/board', 'model/schema', 'ui/toast', 'assets/pio', 'core/event-bus', 'storage/folder-access', 'ui/dialogs'],
  (dom, S, schema, toast, pio, bus, access, dialogs) => {
    'use strict';
    const { $ } = dom;
    const R = (n) => MatIA.require(n);
    const hist = $('#hist');

    let folder = null;        // Folder conectada (o null)
    let pending = null;       // nombre de la carpeta recordada que espera permiso
    let sessionFile = null;   // archivo de la clase actual dentro de la carpeta
    let autoT = null, lastAutoJSON = '';

    /* ---------- Nombres de archivo ---------- */
    const pad2 = (n) => String(n).padStart(2, '0');
    const slug = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
    function stampName() {
      const d = new Date();
      const base = d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + '_' + pad2(d.getHours()) + '-' + pad2(d.getMinutes());
      const t = slug(S.board.title || '');
      return base + (t ? '_' + t : '') + '.json';
    }
    const fmtDate = (t) => { const d = new Date(t); return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()); };

    /* ---------- Estado del panel ---------- */
    const writable = () => !!(folder && folder.writable);
    function setStatus() {
      const st = $('#histStatus');
      st.classList.toggle('on', !!folder);
      st.textContent = folder ? 'Carpeta: ' + folder.name + (folder.writable ? ' (lectura y escritura)' : ' (solo lectura)')
        : pending ? 'Carpeta: ' + pending + ' (pulsa Reconectar para dar permiso)' : 'Carpeta: sin conectar';
      $('#histConnect').hidden = !access.supported;
      $('#histConnect').textContent = folder ? 'Cambiar carpeta' : 'Conectar carpeta';
      $('#histReconnect').hidden = !(access.supported && pending && !folder);
      $('#histPickRO').hidden = access.supported;
      $('#histSave').textContent = writable() || access.supported ? 'Guardar en la carpeta' : 'Descargar la clase';
      $('#histAuto').disabled = !writable();
      $('#histHelp').innerHTML = access.supported
        ? 'Elige <b>cualquier carpeta</b> de tu ordenador para guardar las clases (por ejemplo, la carpeta <code>historial</code> del repositorio). La pizarra la recordará la próxima vez.'
        : 'Este navegador no deja que la página escriba en una carpeta. Puedes <b>elegir una carpeta</b> para ver y abrir las clases guardadas y <b>descargar</b> cada clase para moverla después a esa carpeta. Con Chrome o Edge se guarda directamente.';
    }
    async function use(f) {
      if (!f) return false;
      folder = f; pending = null;
      setStatus();
      await listHist();
      return true;
    }

    $('#histConnect').addEventListener('click', async () => { await use(await access.pick()); });
    $('#histReconnect').addEventListener('click', async () => { await use(await access.reconnect()); });
    $('#histPickRO').addEventListener('click', async () => { await use(await access.pickReadOnly()); });

    /* ---------- Lista ---------- */
    async function listHist() {
      const list = $('#histList');
      list.textContent = '';
      const emptyMsg = (t) => { const d = document.createElement('div'); d.className = 'hist-empty'; d.appendChild(pio.badge('lectura', 'pio-lg', 'Pío leyendo')); const sp = document.createElement('span'); sp.textContent = t; d.appendChild(sp); list.appendChild(d); };
      if (!folder) { emptyMsg(pending ? 'Pulsa «Reconectar» para volver a abrir la carpeta «' + pending + '».' : 'Conecta una carpeta para ver las clases guardadas.'); return; }
      let items;
      try { items = (await folder.list()).sort((a, b) => b.name.localeCompare(a.name)); }
      catch (e) { emptyMsg('No se puede leer la carpeta. Pulsa «Cambiar carpeta» o vuelve a elegirla.'); return; }
      if (!items.length) { emptyMsg('Todavía no hay clases guardadas en esta carpeta. Pulsa «' + $('#histSave').textContent + '».'); return; }
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
        if (folder.writable) mk('Borrar', async () => {
          const ok = await dialogs.confirm('¿Borrar esta clase?', '«' + it.name + '» se eliminará de la carpeta «' + folder.name + '» y no se puede deshacer.', { ok: 'Borrar', danger: true, label: 'Aviso', pio: 'lectura' });
          if (!ok) return;
          try { await folder.remove(it.name); if (sessionFile === it.name) sessionFile = null; listHist(); } catch (e) { toast('No se ha podido borrar el archivo.', 'aviso'); }
        });
        row.append(info, acts);
        list.appendChild(row);
      }
    }

    /* ---------- Abrir ---------- */
    async function openHist(it, append) {
      let data;
      try { data = schema.sanitize(JSON.parse(await it.read())); } catch (e) { data = null; }
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
        sessionFile = writable() ? it.name : null;
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

    /* ---------- Guardar ---------- */
    function download() {
      const blob = new Blob([S.toJSON()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = stampName();
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      toast('Descargado «' + a.download + '». Muévelo a la carpeta de tus clases' + (folder ? ' («' + folder.name + '»)' : '') + '.');
      R('storage/dirty').markSaved();
      return true;
    }
    async function saveToHistory() {
      if (!writable() && access.supported) {
        // sin carpeta: si hay una recordada se pide permiso; si no, se elige una
        const f = pending ? await access.reconnect() : await access.pick({ reason: 'Para guardar la clase necesito una carpeta.' });
        if (!(await use(f))) return false;
      }
      if (!writable()) return download();
      try {
        // dentro de la misma clase se reescribe el mismo archivo
        if (!sessionFile) sessionFile = stampName();
        await folder.write(sessionFile, S.toJSON());
        lastAutoJSON = JSON.stringify(S.board);
        R('storage/dirty').markSaved();
        toast('Guardado en «' + folder.name + '»: ' + sessionFile);
        listHist();
        return true;
      } catch (e) { toast('No se ha podido guardar en la carpeta: ' + (e.message || e), 'aviso'); return false; }
    }
    $('#histSave').addEventListener('click', async () => {
      S.board.title = $('#histName').value.trim();
      S.save();
      await saveToHistory();
    });
    $('#histName').addEventListener('change', () => { S.board.title = $('#histName').value.trim(); S.save(); });

    /* ---------- Guardado automático ---------- */
    $('#histAuto').addEventListener('change', (e) => { S.board.histAuto = e.target.checked; S.save(); if (e.target.checked) autoSave(); });
    async function autoSave() {
      if (!writable() || !S.board.histAuto) return;
      const now = JSON.stringify(S.board);
      if (now === lastAutoJSON) return;
      try {
        if (!sessionFile) sessionFile = stampName();
        await folder.write(sessionFile, S.toJSON());
        lastAutoJSON = now;
        R('storage/dirty').markSaved();
      } catch (e) { /* se reintenta en el siguiente cambio */ }
    }
    bus.on('board:persisted', () => { clearTimeout(autoT); autoT = setTimeout(autoSave, 4000); });

    /* ---------- Panel ---------- */
    $('#histBtn').addEventListener('click', async () => {
      $('#histName').value = S.board.title || '';
      $('#histAuto').checked = !!S.board.histAuto;
      if (!folder) { const r = await access.restore(); if (r) { folder = r.folder; pending = r.pending; } }
      setStatus();
      hist.showModal();
      listHist();
    });
    $('#histClose').addEventListener('click', () => hist.close());

    // al arrancar, si la carpeta recordada ya tiene permiso, el guardado automático sigue funcionando (sin ventanas)
    (async () => {
      const r = await access.restore();
      if (r) { folder = r.folder; pending = r.pending; }
    })();

    const clearSession = () => { sessionFile = null; lastAutoJSON = ''; };
    return {
      saveToHistory, listHist, clearSession, stampName, slug,
      get histDir() { return writable() ? folder : null; },
      get folder() { return folder; },
    };
  });
