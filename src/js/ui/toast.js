/* Avisos breves en la esquina (#toast). kind: 'nota' | 'aviso'. action: { label, fn } opcional. */
MatIA.define('ui/toast', ['core/dom', 'assets/pio'], (dom, pio) => {
  'use strict';
  let t0 = null;
  function toast(text, kind = 'nota', action = null) {
    const t = dom.$('#toast');
    const label = kind === 'aviso' ? 'Aviso' : 'Nota';
    t.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'mi-callout mi-callout--' + kind;
    box.innerHTML = '<div><span class="mi-label">' + label + '</span><p></p></div>';
    box.querySelector('p').textContent = text;
    box.prepend(pio.badge(kind === 'aviso' ? 'lectura' : 'idea', 'pio-sm', ''));
    if (action) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mi-btn mi-btn--sm';
      btn.textContent = action.label;
      btn.addEventListener('mousedown', (e) => e.preventDefault());
      btn.addEventListener('click', () => { t.innerHTML = ''; action.fn(); });
      box.appendChild(btn);
    }
    t.appendChild(box);
    clearTimeout(t0);
    t0 = setTimeout(() => { t.innerHTML = ''; }, action ? 7000 : kind === 'aviso' ? 6500 : 4000);
  }
  return toast;
});
