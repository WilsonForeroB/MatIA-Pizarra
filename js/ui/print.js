/* Impresión de todas las páginas (pizarra.html 7772-7848); usa el registro de bloques. */
MatIA.define('ui/print', ['core/dom', 'model/board', 'ui/state'], (dom, S, st) => {
  'use strict';
  const { $, $$ } = dom;
  const sheet = $('#sheet');
  const R = (n) => MatIA.require(n);
  // espera a que se pinte lo que tarda: imágenes (img.decode / evento img-ready) y fórmulas de MathLive
  async function ready(pr) {
    const imgs = Array.from(pr.querySelectorAll('img'));
    const loading = Array.from(pr.querySelectorAll('[data-loading]'));
    const timeout = new Promise((res) => setTimeout(res, 6000));
    await Promise.race([Promise.all([
      ...imgs.map((im) => (im.decode ? im.decode().catch(() => {}) : Promise.resolve())),
      ...loading.map((el) => new Promise((res) => { if (!el.dataset.loading) res(); else el.addEventListener('img-ready', res, { once: true }); })),
    ]), timeout]);
    await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
  }
  // páginas cuyo contenido no cabe en el tamaño de papel elegido (se recortarían)
  function overflowing(pr) {
    return Array.from(pr.querySelectorAll('.print-page.paper')).map((pg, i) => (pg.scrollHeight > pg.clientHeight + 2 ? i + 1 : 0)).filter(Boolean);
  }
  async function printAll() {
    const pr = $('#print-root');
    pr.innerHTML = '';
    const PPr = R('ui/view').PAPERS[S.board.paper];
    const width = PPr ? PPr[0] : sheet.clientWidth;
    pr.style.width = width + 'px';
    const pages = S.board.pages;
    const imgs = [];
    pages.forEach((p, idx) => {
      const pg = document.createElement('div');
      pg.className = 'print-page' + (PPr ? ' paper' : '');
      if (PPr) { pg.style.height = PPr[1] + 'px'; pg.style.overflow = 'hidden'; pg.style.boxSizing = 'border-box'; }
      pg.style.width = width + 'px';
      pg.style.setProperty('--scale', String(Math.min(S.board.scale, 140) / 100));
      for (const b of p.blocks) {
        const el = document.createElement('div');
        el.className = 'blk' + (b.boxed ? ' is-boxed' : '');
        el.dataset.align = b.align;
        const bd = document.createElement('div');
        bd.className = 'blk-body';
        const def = R('blocks/registry').get(b.type);
        if (def) {
          def.build(b, bd, true);
        } else if (b.type === 'math' && st.mlReady) {
          const mf = document.createElement('math-field');
          mf.setAttribute('read-only', '');
          R('blocks/editor').configureField(mf);
          bd.appendChild(mf);
          mf.value = b.v;
          if (b.note) bd.appendChild(R('blocks/editor').makeNote(b, true));
        } else {
          const t = document.createElement('div');
          t.className = 'blk-text';
          t.textContent = b.v;
          bd.appendChild(t);
        }
        el.appendChild(bd);
        pg.appendChild(el);
      }
      if (p.strokes.length) {
        const h = Math.max(p.minH || 0, ...p.strokes.flatMap((s) => s.pts.map((q) => q[1] + 20)));
        const c = document.createElement('canvas');
        c.width = width * 2; c.height = h * 2;
        const x = c.getContext('2d');
        x.scale(2, 2);
        const light = (n) => ({ ink: '#14201a', 'data-1': '#009b71', 'data-2': '#0072b2', 'data-3': '#b87f00', 'data-4': '#bc6f9a', 'data-5': '#d55e00' })[n] || '#14201a';
        p.strokes.forEach((s) => R('ui/drawing').drawStroke(x, s, light));
        const im = new Image();
        im.className = 'print-ink';
        im.src = c.toDataURL('image/png');
        im.style.width = width + 'px';
        im.style.height = h + 'px';
        pg.style.minHeight = h + 'px';
        pg.appendChild(im);
        imgs.push(im);
      }
      pr.appendChild(pg);
      void idx;
    });
    // se maqueta fuera de la pantalla para poder medir y esperar a imágenes y fórmulas
    pr.classList.add('measuring');
    await ready(pr);
    // el ajuste de fórmulas largas se mide cuando MathLive ya ha pintado
    if (MatIA.has('blocks/fit')) {
      pr.querySelectorAll('.blk').forEach((el) => { const mf = el.querySelector('math-field:not([data-aux])'); if (mf) { try { R('blocks/fit').apply(el, mf); } catch (e) { /* sin ajuste */ } } });
      await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
    }
    const over = overflowing(pr);
    pr.classList.remove('measuring');
    if (over.length) R('ui/toast')('Ojo: ' + (over.length === 1 ? 'la página ' + over[0] + ' no cabe' : 'las páginas ' + over.join(', ') + ' no caben') + ' en el tamaño de hoja elegido y se recortará' + (over.length === 1 ? '' : 'n') + '. Reparte el contenido o cambia el tamaño en Vista ▾.', 'aviso');
    window.print();
  }
  /** «Guardar como PDF»: la ventana de impresión del navegador no se puede decorar, así que antes se explica con una de MatIA. */
  async function savePdf() {
    const paper = { free: 'tamaño libre', a4p: 'A4 vertical', a4l: 'A4 horizontal', a3l: 'A3 horizontal', slide: 'diapositiva 16:9' }[S.board.paper] || 'tamaño libre';
    const ok = await R('ui/dialogs').ask({
      title: 'Guardar como PDF',
      text: 'Se abrirá la ventana de impresión del navegador. En «Destino» elige «Guardar como PDF» y pulsa «Guardar». Cada página sale en una hoja (' + paper + '; puedes cambiarlo en Vista ▾), sin números de línea ni botones.',
      label: 'PDF', pio: 'escribiendo',
      buttons: [{ label: 'Cancelar', value: false, kind: 'ghost' }, { label: 'Continuar', value: true, kind: 'primary', focus: true }],
    });
    if (ok) await printAll();
  }
  window.addEventListener('afterprint', () => { $('#print-root').innerHTML = ''; });
  return { printAll, savePdf };
});
