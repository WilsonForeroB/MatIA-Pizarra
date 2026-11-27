/* Sección «Línea» de la barra lateral (desplegable): alinear, recuadrar, añadir fila/columna (si hay
   matriz o sistema), duplicar y borrar la línea activa. Antes flotaba sobre la hoja y tapaba otras líneas. */
MatIA.define('ui/line-bar', ['core/dom', 'ui/rail-section'], (dom, section) => {
  'use strict';
  const { $ } = dom;
  const { body } = dom;
  const bar = $('#lineBar'), blocksEl = $('#blocks');
  const MAT = /\\begin\{(?:[pbvBV]?matrix|cases|array|aligned|smallmatrix)/;
  section.make(bar, 'linea', 'Línea', false);
  let raf = 0;

  function place() {
    raf = 0;
    const el = blocksEl.querySelector('.blk.is-active');
    if (!el || body.dataset.mode !== 'write' || body.classList.contains('presenting')) { bar.hidden = true; return; }
    const mf = el.querySelector('math-field:not([data-aux])');
    const hasMat = !!(mf && MAT.test(mf.value || ''));
    bar.querySelectorAll('.lb-mat').forEach((b) => { b.hidden = !hasMat; });
    bar.hidden = false;
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(place); };

  new MutationObserver(schedule).observe(blocksEl, { attributes: true, attributeFilter: ['class'], subtree: true, childList: true });
  new MutationObserver(schedule).observe(body, { attributes: true, attributeFilter: ['data-mode', 'class'] });
  blocksEl.addEventListener('input', schedule, true);
  return { place: schedule };
});
