/* Bloque «Imagen»: figura con pie de foto; el archivo vive en 'imagenes/' de la carpeta de clases (storage/assets).
   IMPORTANTE: cargar ANTES de js/model/board.js (registra su saneador). Enlace tardío con R(). */
MatIA.define('blocks/image', ['blocks/registry'], (registry) => {
  'use strict';
  const R = (n) => MatIA.require(n);
  const S = { save: () => R('model/board').save() };
  const okSrc = (s) => typeof s === 'string' && /^imagenes\/[^\/\\]+(\/[^\/\\]+)*$/.test(s) && !s.includes('..') && !/[\u0000-\u001f]/.test(s);

  function buildImage(b, bd, ro) {
    const fig = document.createElement('figure');
    fig.className = 'img-blk';
    const apply = () => { fig.style.width = (b.w || 60) + '%'; };
    apply();
    const frame = document.createElement('div'); frame.className = 'img-frame';
    const img = document.createElement('img');
    img.alt = b.alt || ''; img.draggable = false; img.decoding = 'async';
    frame.appendChild(img);
    fig.appendChild(frame);
    const miss = document.createElement('div'); miss.className = 'img-miss'; miss.hidden = true; miss.setAttribute('role', 'status');
    const msg = document.createElement('span'); msg.textContent = 'Imagen no encontrada: conecta la carpeta de clases (Historial)';
    miss.appendChild(msg);
    if (!ro) {
      const open = document.createElement('button'); open.type = 'button'; open.className = 'mi-btn mi-btn--sm'; open.textContent = 'Abrir Historial';
      open.addEventListener('click', () => { const h = document.getElementById('histBtn'); if (h) h.click(); });
      const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'mi-btn mi-btn--ghost mi-btn--sm'; retry.textContent = 'Reintentar';
      retry.addEventListener('click', () => load());
      miss.append(open, retry);
    }
    fig.appendChild(miss);

    if (!ro) {
      const grip = document.createElement('div'); grip.className = 'img-grip'; grip.title = 'Arrastra para cambiar el ancho'; grip.setAttribute('aria-label', 'Cambiar el ancho de la imagen');
      grip.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        grip.setPointerCapture(e.pointerId);
        const full = bd.getBoundingClientRect().width || 1, x0 = e.clientX, w0 = b.w || 60;
        const move = (ev) => { b.w = Math.round(Math.min(100, Math.max(10, w0 + ((ev.clientX - x0) / full) * 100))); apply(); };
        const up = () => { grip.removeEventListener('pointermove', move); grip.removeEventListener('pointerup', up); grip.removeEventListener('pointercancel', up); S.save(); };
        grip.addEventListener('pointermove', move); grip.addEventListener('pointerup', up); grip.addEventListener('pointercancel', up);
      });
      const alt = document.createElement('button'); alt.type = 'button'; alt.className = 'img-alt mi-btn mi-btn--ghost mi-btn--sm'; alt.textContent = 'Alt';
      alt.title = 'Editar el texto alternativo'; alt.setAttribute('aria-label', 'Editar el texto alternativo');
      alt.addEventListener('click', async () => {
        const v = await R('ui/dialogs').prompt('Texto alternativo', 'Describe la imagen para quien no pueda verla.', { value: b.alt || '', placeholder: 'Describe la imagen…', ok: 'Guardar' });
        if (v === null || v === undefined) return;
        b.alt = String(v).slice(0, 200); img.alt = b.alt; S.save();
      });
      frame.append(grip, alt);
    }

    const cap = document.createElement('figcaption'); cap.className = 'img-cap';
    if (ro) { cap.textContent = b.caption || ''; if (!b.caption) cap.hidden = true; } else {
      cap.contentEditable = 'true'; cap.setAttribute('role', 'textbox'); cap.setAttribute('aria-label', 'Pie de foto'); cap.dataset.ph = 'Pie de foto…';
      cap.textContent = b.caption || '';
      cap.addEventListener('input', () => { b.caption = cap.innerText.replace(/\n/g, ' ').slice(0, 200); S.save(); });
      cap.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); cap.blur(); } });
    }
    fig.appendChild(cap);
    bd.appendChild(fig);

    function done() { delete bd.dataset.loading; bd.dispatchEvent(new CustomEvent('img-ready', { bubbles: true })); }
    let gen = 0; // cada carga lleva su número: una carga anterior que acaba tarde no pisa a la nueva
    function load() {
      const my = ++gen;
      bd.dataset.loading = '1'; miss.hidden = true; frame.hidden = false;
      const p = (async () => {
        try {
          if (!b.src) throw new Error('sin ruta');
          const u = await R('storage/assets').url(b.src);
          if (my !== gen) return;
          img.src = u;
          await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('no se puede mostrar')); });
          if (my !== gen) return;
          frame.hidden = false;
        } catch (e) { if (my !== gen) return; frame.hidden = true; miss.hidden = false; }
        done();
      })();
      bd._imgReady = p; // la impresión espera a esta promesa (o al evento 'img-ready')
      return p;
    }
    load();
    if (!ro) {
      // al conectar la carpeta de clases, una imagen que no se pudo leer lo vuelve a intentar sola
      const off = R('core/event-bus').on('folder:connected', () => {
        if (!bd.isConnected) { off(); return; }
        if (!miss.hidden || bd.dataset.loading) load();
      });
    }
    return bd._imgReady;
  }

  registry.register({ type: 'image', build: buildImage, exportable: false });
  R('model/schema').register('image', (x, base) => {
    const w = Math.round(+x.w);
    return Object.assign(base, {
      type: 'image', src: okSrc(x.src) ? x.src : '',
      w: Number.isFinite(w) ? Math.min(100, Math.max(10, w)) : 60,
      caption: typeof x.caption === 'string' ? x.caption.slice(0, 200) : '',
      alt: typeof x.alt === 'string' ? x.alt.slice(0, 200) : '',
    });
  });
  return { buildImage, okSrc };
});
