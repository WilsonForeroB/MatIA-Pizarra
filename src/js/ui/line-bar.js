/* Barrita flotante de la línea activa: alinear, recuadrar, añadir fila/columna (si hay matriz o sistema),
   duplicar y borrar. Aparece sobre el borde superior derecho de la línea activa y la sigue al desplazarse. */
MatIA.define('ui/line-bar', ['core/dom'], (dom) => {
  'use strict';
  const { $ } = dom;
  const { body } = dom;
  const bar = $('#lineBar'), wrap = $('#wrap'), blocksEl = $('#blocks');
  const MAT = /\\begin\{(?:[pbvBV]?matrix|cases|array|aligned|smallmatrix)/;
  let raf = 0;

  function place() {
    raf = 0;
    const el = blocksEl.querySelector('.blk.is-active');
    if (!el || body.dataset.mode !== 'write' || body.classList.contains('presenting')) { bar.hidden = true; return; }
    const mf = el.querySelector('math-field:not([data-aux])');
    const hasMat = !!(mf && MAT.test(mf.value || ''));
    bar.querySelectorAll('.lb-mat').forEach((b) => { b.hidden = !hasMat; });
    bar.hidden = false;
    const wr = wrap.getBoundingClientRect(), r = el.getBoundingClientRect();
    const h = bar.offsetHeight, w = bar.offsetWidth;
    // Las líneas de texto tienen su propia barra de formato arriba: esta va al borde inferior
    const below = !mf && !!el.querySelector('.blk-text');
    const y = (below ? r.bottom : r.top) - wr.top + wrap.scrollTop - h / 2;
    const x = Math.max(8, r.right - wr.left + wrap.scrollLeft - w - 16);
    bar.style.top = Math.max(wrap.scrollTop + 2, y) + 'px';
    bar.style.left = x + 'px';
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(place); };

  new MutationObserver(schedule).observe(blocksEl, { attributes: true, attributeFilter: ['class'], subtree: true, childList: true });
  new MutationObserver(schedule).observe(body, { attributes: true, attributeFilter: ['data-mode', 'class'] });
  blocksEl.addEventListener('input', schedule, true);
  window.addEventListener('resize', schedule);
  if (window.ResizeObserver) new ResizeObserver(schedule).observe(blocksEl);
  return { place: schedule };
});
