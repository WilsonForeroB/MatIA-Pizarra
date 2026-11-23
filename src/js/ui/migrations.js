/* Ventana «Migraciones» (menú ⋯): exportar e importar todo el historial para cambiar de servidor.
   La lógica del paquete está en storage/migration; aquí solo la ventana, la carpeta y los avisos. */
MatIA.define('ui/migrations', ['core/dom', 'model/board', 'storage/migration', 'storage/folder-access', 'ui/toast', 'assets/pio'],
  (dom, S, mig, access, toast, pio) => {
    'use strict';
    const { $ } = dom;
    const R = (n) => MatIA.require(n);
    const hist = () => R('storage/history');

    const dlg = document.createElement('dialog');
    dlg.id = 'migr';
    dlg.setAttribute('aria-labelledby', 'migrTitle');
    dlg.innerHTML = '<div class="dlg-head"><h2 id="migrTitle" class="pio-title">Migraciones</h2>'
      + '<button type="button" class="mi-btn mi-btn--sm" id="migrClose">Cerrar</button></div>'
      + '<div class="mg-body">'
      + '<p class="mg-lead">¿Vas a usar la pizarra en <b>otro servidor</b>, otro ordenador u otro navegador? Lo que guarda el navegador no viaja solo. '
      + 'Exporta aquí un <b>paquete de migración</b> (un único archivo <code>.json</code>) y, en la pizarra nueva, ábrelo desde <b>⋯ → Migraciones → Importar</b>. '
      + 'El paquete no se envía a ningún sitio: se descarga en tu ordenador.</p>'
      + '<div class="mg-grid">'
      // Exportar
      + '<section class="mg-card" aria-labelledby="mgExpH">'
      + '<h3 id="mgExpH"><span class="mg-step">1</span>Exportar desde esta pizarra</h3>'
      + '<div class="mg-folder"><span id="mgExpFolder"></span><button type="button" class="mi-btn mi-btn--sm" id="mgExpConnect" hidden>Conectar carpeta</button></div>'
      + '<fieldset class="mg-opts"><legend class="sr-only">Qué incluir</legend>'
      + '<label class="mi-check"><input type="checkbox" id="mgExpClases" checked> <span>Clases del historial <small id="mgExpClasesN"></small></span></label>'
      + '<label class="mi-check"><input type="checkbox" id="mgExpImgs" checked> <span>Imágenes de las clases <small id="mgExpImgsN"></small></span></label>'
      + '<label class="mi-check"><input type="checkbox" id="mgExpBoard" checked> <span>Pizarra abierta y preferencias <small>(tema, color, letra y tamaño de página)</small></span></label>'
      + '</fieldset>'
      + '<button type="button" class="mi-btn mi-btn--primary" id="mgExport">Descargar paquete de migración</button>'
      + '</section>'
      // Importar
      + '<section class="mg-card" aria-labelledby="mgImpH">'
      + '<h3 id="mgImpH"><span class="mg-step">2</span>Importar en esta pizarra</h3>'
      + '<p class="mg-hint" id="mgImpHint">Elige el paquete <code>matia-migracion_….json</code> que descargaste en la pizarra anterior.</p>'
      + '<button type="button" class="mi-btn" id="mgPick">Elegir paquete…</button>'
      + '<input type="file" id="mgFile" accept=".json,application/json" hidden>'
      + '<div class="mg-pkg" id="mgPkg" hidden>'
      + '<p class="mg-meta" id="mgMeta"></p>'
      + '<div class="mg-folder"><span id="mgImpFolder"></span><button type="button" class="mi-btn mi-btn--sm" id="mgImpConnect" hidden>Conectar carpeta</button></div>'
      + '<fieldset class="mg-opts"><legend class="sr-only">Qué importar</legend>'
      + '<label class="mi-check"><input type="checkbox" id="mgImpClases" checked> <span>Copiar las clases a la carpeta <small id="mgImpClasesN"></small></span></label>'
      + '<label class="mi-check"><input type="checkbox" id="mgImpImgs" checked> <span>Copiar las imágenes <small id="mgImpImgsN"></small></span></label>'
      + '<label class="mi-check"><input type="checkbox" id="mgImpBoard"> <span>Recuperar la pizarra abierta y sus preferencias <small>(sustituye la actual)</small></span></label>'
      + '</fieldset>'
      + '<p class="mg-note" id="mgImpNote" hidden></p>'
      + '<button type="button" class="mi-btn mi-btn--primary" id="mgImport">Importar</button>'
      + '</div>'
      + '</section>'
      + '</div>'
      + '<p class="mg-prog" id="mgProg" role="status" aria-live="polite"></p>'
      + '<ul class="mg-report" id="mgReport" hidden></ul>'
      + '</div>';
    document.body.appendChild(dlg);
    dlg.querySelector('#migrTitle').prepend(pio.badge('escribiendo', '', 'Pío preparando la mudanza'));
    const q = (s) => dlg.querySelector(s);
    const prog = (t) => { q('#mgProg').textContent = t || ''; };
    const plural = (n, a, b) => n + ' ' + (n === 1 ? a : b);
    let pkg = null, busy = false;

    /* ---------- Carpeta ---------- */
    const folder = () => hist().folder;
    async function connect(needWrite) {
      if (access.supported) {
        const r = await access.restore();
        const f = r && r.pending ? await access.reconnect() : await access.pick({ reason: needWrite ? 'Para copiar las clases del paquete necesito la carpeta donde guardas las clases en esta pizarra.' : 'Para exportar las clases necesito la carpeta donde las guardas.' });
        if (f) await hist().useFolder(f);
      } else if (!needWrite) {
        const f = await access.pickReadOnly();
        if (f) await hist().useFolder(f);
      }
      await refresh();
    }
    q('#mgExpConnect').addEventListener('click', () => connect(false));
    q('#mgImpConnect').addEventListener('click', () => connect(true));

    const folderLine = (f) => (f ? 'Carpeta: «' + f.name + '»' + (f.writable ? '' : ' (solo lectura)') : 'Carpeta de clases: sin conectar');

    async function refresh() {
      const f = folder();
      // exportar
      q('#mgExpFolder').textContent = folderLine(f);
      q('#mgExpConnect').hidden = !!f;
      q('#mgExpConnect').textContent = access.supported ? 'Conectar carpeta' : 'Elegir carpeta (solo lectura)';
      for (const id of ['#mgExpClases', '#mgExpImgs']) { if (q(id).disabled !== !f) q(id).checked = !!f; q(id).disabled = !f; }
      q('#mgExpClasesN').textContent = f ? '(contando…)' : '(conecta la carpeta)';
      q('#mgExpImgsN').textContent = f ? '(contando…)' : '(conecta la carpeta)';
      if (f) {
        try {
          const n = (await f.list()).filter((it) => !/^matia-migracion_/i.test(it.name)).length;
          q('#mgExpClasesN').textContent = '(' + plural(n, 'clase', 'clases') + ')';
        } catch (e) { q('#mgExpClasesN').textContent = '(no se puede leer la carpeta)'; }
        try { q('#mgExpImgsN').textContent = '(' + plural((await f.listDir('imagenes')).length, 'imagen', 'imágenes') + ')'; } catch (e) { q('#mgExpImgsN').textContent = ''; }
      }
      // importar
      if (pkg) {
        const w = !!(f && f.writable);
        q('#mgImpFolder').textContent = folderLine(f);
        q('#mgImpConnect').hidden = w || !access.supported;
        q('#mgImpConnect').textContent = f ? 'Cambiar carpeta' : 'Conectar carpeta';
        q('#mgImpClases').disabled = !w || !pkg.clases.length;
        q('#mgImpImgs').disabled = !w || !pkg.imagenes.length;
        q('#mgImpBoard').disabled = !pkg.pizarra;
        if (q('#mgImpClases').disabled) q('#mgImpClases').checked = false;
        if (q('#mgImpImgs').disabled) q('#mgImpImgs').checked = false;
        if (q('#mgImpBoard').disabled) q('#mgImpBoard').checked = false;
        const note = q('#mgImpNote');
        note.hidden = w;
        note.textContent = !access.supported
          ? 'Este navegador no deja escribir en carpetas: solo se puede recuperar la pizarra abierta. Para copiar las clases y las imágenes, importa el paquete con Chrome o Edge.'
          : 'Conecta la carpeta donde quieres guardar las clases en esta pizarra (puede ser una carpeta nueva y vacía).';
      }
    }

    /* ---------- Exportar ---------- */
    q('#mgExport').addEventListener('click', async () => {
      if (busy) return;
      const f = folder();
      const opts = { folder: f, clases: !!f && q('#mgExpClases').checked, imagenes: !!f && q('#mgExpImgs').checked, pizarra: q('#mgExpBoard').checked };
      if (!opts.clases && !opts.imagenes && !opts.pizarra) { toast('Marca al menos una cosa para exportar.', 'aviso'); return; }
      if (!f && !(await R('ui/dialogs').confirm('Sin carpeta de clases', 'No hay ninguna carpeta conectada, así que el paquete solo llevará la pizarra abierta y sus preferencias. ¿Exportar igualmente?', { ok: 'Exportar solo la pizarra', pio: 'lectura' }))) return;
      busy = true; q('#mgExport').disabled = true;
      try {
        const p = await mig.pack(Object.assign(opts, { onProgress: prog }));
        const blob = new Blob([JSON.stringify(p)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = mig.fileName();
        document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
        const kb = Math.max(1, Math.round(blob.size / 1024));
        report(['Paquete «' + a.download + '» descargado (' + (kb > 2048 ? (kb / 1024).toFixed(1) + ' MB' : kb + ' KB') + ').',
          plural(p.clases.length, 'clase', 'clases') + ', ' + plural(p.imagenes.length, 'imagen', 'imágenes') + (p.pizarra ? ' y la pizarra abierta.' : '.'),
          'Llévalo a la pizarra nueva y ábrelo en ⋯ → Migraciones → Importar.']);
        toast('Paquete de migración descargado.');
      } catch (e) { toast('No se ha podido crear el paquete: ' + (e.message || e), 'aviso'); prog(''); }
      busy = false; q('#mgExport').disabled = false;
    });

    /* ---------- Importar ---------- */
    q('#mgPick').addEventListener('click', () => q('#mgFile').click());
    q('#mgFile').addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!file) return;
      try { pkg = mig.parse(await file.text()); } catch (err) {
        pkg = null; q('#mgPkg').hidden = true;
        R('ui/dialogs').alert('No se puede importar «' + file.name + '»', err.message, { warn: true });
        return;
      }
      const d = pkg.creado ? new Date(pkg.creado) : null;
      q('#mgMeta').textContent = '«' + file.name + '»' + (d && !isNaN(d) ? ' · creado el ' + d.toLocaleDateString('es-ES') + ' a las ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '')
        + (pkg.origen ? ' · desde ' + pkg.origen : '') + (pkg.carpeta ? ' · carpeta «' + pkg.carpeta + '»' : '');
      q('#mgImpClasesN').textContent = '(' + plural(pkg.clases.length, 'clase', 'clases') + ')';
      q('#mgImpImgsN').textContent = '(' + plural(pkg.imagenes.length, 'imagen', 'imágenes') + ')';
      q('#mgImpClases').checked = true; q('#mgImpImgs').checked = true;
      // si la pizarra actual está vacía, recuperar la del paquete es lo natural
      q('#mgImpBoard').checked = !!pkg.pizarra && R('storage/dirty').boardEmpty();
      q('#mgPkg').hidden = false;
      q('#mgReport').hidden = true;
      await refresh();
    });

    q('#mgImport').addEventListener('click', async () => {
      if (busy || !pkg) return;
      const f = folder();
      const files = { clases: q('#mgImpClases').checked, imagenes: q('#mgImpImgs').checked };
      const board = q('#mgImpBoard').checked;
      if (!files.clases && !files.imagenes && !board) { toast('Marca al menos una cosa para importar.', 'aviso'); return; }
      if (board && !(await R('storage/dirty').guardUnsaved('recuperar la pizarra del paquete'))) return;
      busy = true; q('#mgImport').disabled = true;
      const lines = [];
      try {
        if ((files.clases || files.imagenes) && f && f.writable) {
          const rep = await mig.importFiles(pkg, f, Object.assign(files, { onProgress: prog }));
          const c = rep.clases, im = rep.imagenes;
          if (files.clases) {
            lines.push('Clases copiadas a «' + f.name + '»: ' + c.nuevas.length + (c.iguales.length ? ' · ya estaban: ' + c.iguales.length : '')
              + (c.renombradas.length ? ' · con otro nombre (ya había una distinta con el mismo): ' + c.renombradas.join(', ') : ''));
            if (c.invalidas.length) lines.push('No se han podido copiar: ' + c.invalidas.join(', '));
          }
          if (files.imagenes) lines.push('Imágenes copiadas: ' + im.nuevas + (im.existentes ? ' · ya estaban: ' + im.existentes : '') + (im.invalidas ? ' · con error: ' + im.invalidas : ''));
          await hist().useFolder(f); // vuelve a listar y a cargar las imágenes que faltaban
        }
        if (board) {
          const data = mig.boardOf(pkg);
          if (data) {
            S.replace(data);
            hist().clearSession();
            R('storage/dirty').markSaved();
            R('ui/view').applySettings();
            R('blocks/editor').renderPage();
            S.save();
            lines.push('Pizarra abierta recuperada' + (data.title ? ': «' + data.title + '»' : '') + ' (' + plural(data.pages.length, 'página', 'páginas') + ').');
          } else lines.push('La pizarra del paquete no es válida y no se ha recuperado.');
        }
        report(lines);
        await refresh();
        toast('Importación terminada.');
      } catch (e) { toast('No se ha podido importar: ' + (e.message || e), 'aviso'); prog(''); }
      busy = false; q('#mgImport').disabled = false;
    });

    function report(lines) {
      const ul = q('#mgReport');
      ul.textContent = '';
      for (const t of lines) { const li = document.createElement('li'); li.textContent = t; ul.appendChild(li); }
      ul.hidden = !lines.length;
      if (lines.length) ul.scrollIntoView({ block: 'nearest' });
    }

    /* ---------- Ventana ---------- */
    async function show() {
      R('ui/popovers').closePop();
      report([]); prog('');
      if (!folder()) { const r = await access.restore(); if (r && r.folder && !folder()) await hist().useFolder(r.folder); }
      dlg.showModal();
      refresh();
    }
    q('#migrClose').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    const btn = $('#migrBtn');
    if (btn) btn.addEventListener('click', show);
    return { show };
  });
