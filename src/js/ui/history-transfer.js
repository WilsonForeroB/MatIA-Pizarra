/* Historial → Exportar / Importar clases (por ejemplo, ejercicios resueltos para llevarlos a otro PC).
   - Exportar: las clases marcadas (o todas) y las imágenes que usan, en un único archivo
     'matia-clases_AAAA-MM-DD_HH-MM.json' (mismo formato que el paquete de Migraciones, sin la pizarra abierta).
   - Importar: ese archivo, un paquete de Migraciones o clases .json sueltas. Antes de escribir nada se enseña
     qué pasará con cada clase, revisando los nombres para no duplicar:
       · Nueva            → se copia con su nombre
       · Ya está          → mismo contenido que una clase de la carpeta (aunque tenga otro nombre): se salta
       · Nombre repetido  → hay otra DISTINTA con ese nombre: se guarda como «…_importada.json» (no se pisa nada)
       · Mismo título     → aviso: ya hay una clase distinta con el mismo título
   La lógica está en storage/migration; aquí la interfaz dentro de la ventana Historial. */
MatIA.define('ui/history-transfer', ['core/dom', 'storage/migration', 'storage/folder-access', 'core/event-bus', 'ui/toast', 'ui/dialogs'],
  (dom, mig, access, bus, toast, dialogs) => {
    'use strict';
    const { $ } = dom;
    const R = (n) => MatIA.require(n);
    const hist = () => R('storage/history');
    const plural = (n, a, b) => n + ' ' + (n === 1 ? a : b);
    let shown = [];      // nombres de la lista visible
    let plan = null;
    let busy = false;

    /* ---------- Selección y botón Exportar ---------- */
    function updTools() {
      const sel = hist().selected, n = sel.size;
      $('#histSelN').textContent = n ? plural(n, 'seleccionada', 'seleccionadas') : '';
      $('#histExport').textContent = n ? 'Exportar ' + plural(n, 'clase', 'clases') : 'Exportar todas';
      $('#histExport').disabled = !shown.length;
      $('#histSelAll').disabled = !shown.length;
      $('#histSelAll').checked = !!shown.length && n === shown.length;
      $('#histSelAll').indeterminate = n > 0 && n < shown.length;
    }
    bus.on('hist:listed', ({ items }) => { shown = items.map((it) => it.name); updTools(); });
    bus.on('hist:selection', updTools);
    $('#histSelAll').addEventListener('change', (e) => {
      const sel = hist().selected;
      if (e.target.checked) shown.forEach((n) => sel.add(n)); else sel.clear();
      document.querySelectorAll('#histList .hist-sel').forEach((c) => { c.checked = e.target.checked; });
      updTools();
    });

    $('#histExport').addEventListener('click', async () => {
      const f = hist().folder;
      if (busy || !f) return;
      const names = hist().selected.size ? [...hist().selected] : null;
      busy = true;
      try {
        const p = await mig.pack({ folder: f, clases: true, imagenes: true, pizarra: false, nombres: names || shown });
        const blob = new Blob([JSON.stringify(p)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = mig.fileName(new Date(), 'matia-clases');
        document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
        toast('Descargado «' + a.download + '» con ' + plural(p.clases.length, 'clase', 'clases')
          + (p.imagenes.length ? ' y ' + plural(p.imagenes.length, 'imagen', 'imágenes') : '')
          + '. En el otro ordenador: Historial → Importar clases…');
      } catch (e) { toast('No se ha podido exportar: ' + (e.message || e), 'aviso'); }
      busy = false;
    });

    /* ---------- Importar ---------- */
    async function writableFolder() {
      const f = hist().folder;
      if (f && f.writable) return f;
      if (!access.supported) {
        await dialogs.alert('Importar necesita Chrome o Edge', 'Este navegador no deja que la pizarra escriba en una carpeta, así que no puede copiar las clases. Abre la pizarra con Chrome o Edge para importarlas. (Cada clase suelta sí se puede abrir con «⋯ → Abrir archivo…».)', { warn: true });
        return null;
      }
      const r = await access.restore();
      const nf = r && r.pending ? await access.reconnect() : await access.pick({ reason: 'Para importar las clases necesito la carpeta donde las guardas en este ordenador.' });
      if (nf) await hist().useFolder(nf);
      return nf || null;
    }

    $('#histImport').addEventListener('click', () => { if (!busy) $('#histImpIn').click(); });
    $('#histImpIn').addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      e.target.value = '';
      if (!files.length || busy) return;
      const pkg = await mig.fromFiles(files);
      if (!pkg.clases.length) {
        dialogs.alert('No hay clases que importar', pkg.rechazados.length ? pkg.rechazados.join(' · ') : 'Los archivos elegidos no contienen clases de la pizarra.', { warn: true });
        return;
      }
      const f = await writableFolder();
      if (!f) return;
      busy = true;
      try { plan = await mig.planImport(pkg, f, { suffix: 'importada' }); plan.rechazados = pkg.rechazados; showPlan(); }
      catch (err) { toast('No se puede leer la carpeta: ' + (err.message || err), 'aviso'); }
      busy = false;
    });

    const LABEL = { nueva: 'Nueva', igual: 'Ya está', renombrar: 'Nombre repetido', invalida: 'No válida' };
    function showPlan() {
      const list = $('#histImpList');
      list.textContent = '';
      const cnt = { nueva: 0, igual: 0, renombrar: 0, invalida: 0 };
      for (const c of plan.clases) {
        cnt[c.action]++;
        const row = document.createElement('div');
        row.className = 'hist-imp-row is-' + c.action;
        row.setAttribute('role', 'listitem');
        const tag = document.createElement('span'); tag.className = 'hist-imp-tag'; tag.textContent = LABEL[c.action];
        const info = document.createElement('div');
        const b = document.createElement('b'); b.textContent = c.titulo || c.nombre.replace(/\.json$/i, '');
        const sm = document.createElement('small');
        sm.textContent = c.action === 'nueva' ? 'Se guardará como «' + c.target + '»'
          : c.action === 'igual' ? 'Ya está en la carpeta como «' + c.como + '»: no se copia'
            : c.action === 'renombrar' ? 'Ya hay otra clase distinta llamada «' + c.nombre + '»: se guardará como «' + c.target + '»'
              : '«' + c.nombre + '» no es una clase válida';
        info.append(b, sm);
        if (c.mismoTitulo) {
          const w = document.createElement('small'); w.className = 'hist-imp-warn';
          w.textContent = 'Ojo: ya tienes otra clase con el mismo título («' + c.mismoTitulo + '»), con contenido distinto.';
          info.appendChild(w);
        }
        row.append(tag, info);
        list.appendChild(row);
      }
      const imgN = plan.imagenes.filter((x) => x.action === 'nueva').length;
      const toCopy = cnt.nueva + cnt.renombrar;
      $('#histImpSum').textContent = plural(plan.clases.length, 'clase', 'clases') + ' en el archivo: '
        + [cnt.nueva && plural(cnt.nueva, 'nueva', 'nuevas'), cnt.igual && cnt.igual + (cnt.igual === 1 ? ' ya está (se salta)' : ' ya están (se saltan)'),
          cnt.renombrar && cnt.renombrar + ' con nombre repetido (' + (cnt.renombrar === 1 ? 'se renombra' : 'se renombran') + ')', cnt.invalida && plural(cnt.invalida, 'no válida', 'no válidas')]
          .filter(Boolean).join(' · ')
        + (imgN ? ' · ' + plural(imgN, 'imagen nueva', 'imágenes nuevas') : '')
        + (plan.rechazados && plan.rechazados.length ? ' · Archivos descartados: ' + plan.rechazados.join(', ') : '')
        + '. Se guardan en «' + hist().folder.name + '».';
      $('#histImpGo').textContent = toCopy ? 'Importar ' + plural(toCopy, 'clase', 'clases') : (imgN ? 'Copiar las imágenes' : 'Nada que importar');
      $('#histImpGo').disabled = !toCopy && !imgN;
      $('#histList').hidden = true; $('#histTools').hidden = true;
      $('#histImpPanel').hidden = false;
      $('#histImpGo').focus();
    }
    function closePlan() {
      plan = null;
      $('#histImpPanel').hidden = true;
      $('#histList').hidden = false; $('#histTools').hidden = false;
      updTools();
    }
    $('#histImpCancel').addEventListener('click', closePlan);
    $('#histImpGo').addEventListener('click', async () => {
      if (!plan || busy) return;
      const f = hist().folder;
      busy = true;
      try {
        const rep = await mig.applyPlan(plan, f, { clases: true, imagenes: true });
        const copied = [...rep.clases.nuevas, ...rep.clases.renombradas];
        hist().markImported(copied);
        toast('Importadas ' + plural(copied.length, 'clase', 'clases')
          + (rep.clases.iguales.length ? ' · ' + rep.clases.iguales.length + ' ya estaban' : '')
          + (rep.clases.renombradas.length ? ' · ' + rep.clases.renombradas.length + ' con otro nombre' : '')
          + (rep.imagenes.nuevas ? ' · ' + plural(rep.imagenes.nuevas, 'imagen', 'imágenes') : '') + '.');
        closePlan();
        await hist().useFolder(f); // vuelve a listar (resaltando las importadas) y recarga imágenes
      } catch (e) { toast('No se ha podido importar: ' + (e.message || e), 'aviso'); }
      busy = false;
    });
    $('#hist').addEventListener('close', () => { if (plan) closePlan(); });

    return { updTools };
  });
