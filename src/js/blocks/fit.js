/* Lo que no cabe en la hoja: una línea de fórmula que es solo texto pasa a bloque de texto al perder el foco;
   una fórmula más ancha que la hoja reduce su letra (hasta el 60 %) y, si aun así no cabe, avisa y ofrece «Partir». */
MatIA.define('blocks/fit', ['core/dom', 'model/board', 'ui/toast'], (dom, S, toast) => {
  'use strict';
  const R = (n) => MatIA.require(n);
  const MIN = 0.6, STEP = 0.05;
  const TEXT_ONLY = /^\s*(?:\\text\{[^{}]*\}(?:\s|\\[ ,;:]|~)*)+$/;
  const entries = new Set();
  let ro = null, mo = null, queued = false;

  const content = (mf) => mf.shadowRoot && mf.shadowRoot.querySelector('.ML__content');
  const overflowing = (c) => c.scrollWidth > c.clientWidth + 1;

  // texto plano de una fórmula formada solo por \text{…}; null si lleva algo más
  function plainText(latex) {
    if (typeof latex !== 'string' || !TEXT_ONLY.test(latex)) return null;
    let out = '';
    const re = /\\text\{([^{}]*)\}|\\[ ,;:]|~/g;
    let m;
    while ((m = re.exec(latex))) out += m[1] !== undefined ? m[1] : ' ';
    return out;
  }

  function clearWarn(el) {
    el.classList.remove('is-overflow');
    const w = el.querySelector('.fit-warn');
    if (w) w.remove();
  }

  function partir(el) {
    const ed = R('blocks/editor');
    const b = ed.blockById(el.dataset.id);
    if (!b) return;
    ed.setActive(b.id);
    ed.focusBlock(b.id, 'end');
    if (b.type === 'math' && b.v && R('blocks/deriv').splitTopEq(b.v)) R('blocks/deriv').startDeriv();
    else toast('Esta fórmula no tiene «=»: usa «Desarrollo» o «+ Nueva línea» y pártela a mano.', 'nota');
  }

  function warn(el, mf) {
    el.classList.add('is-overflow');
    if (el.querySelector('.fit-warn')) return;
    const w = document.createElement('div');
    w.className = 'fit-warn';
    w.setAttribute('role', 'note');
    const t = document.createElement('span');
    t.textContent = 'No cabe en la hoja';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mi-btn mi-btn--sm';
    btn.textContent = 'Partir';
    btn.addEventListener('mousedown', (e) => e.preventDefault());
    btn.addEventListener('click', () => partir(el));
    w.append(t, btn);
    (mf.parentElement || el).appendChild(w);
  }

  function apply(el, mf) {
    if (!el || !mf || mf.hasAttribute('data-aux') || !mf.isConnected) return;
    const c = content(mf);
    if (!c) return;
    mf.style.setProperty('--fit', '1');
    let f = 1;
    if (overflowing(c)) {
      const ratio = c.clientWidth / c.scrollWidth;
      f = Math.max(MIN, Math.floor(ratio / STEP) * STEP);
      mf.style.setProperty('--fit', String(f));
      while (f > MIN + 1e-6 && overflowing(c)) {
        f = Math.max(MIN, f - STEP);
        mf.style.setProperty('--fit', String(f));
      }
    }
    if (f >= 1) mf.style.removeProperty('--fit');
    // solo se avisa si ni al tamaño mínimo cabe (el contenido interno de MathLive puede sobrar 1-2 px aunque la línea quepa)
    if (f <= MIN + 1e-6 && overflowing(c)) warn(el, mf); else clearWarn(el);
  }

  function all() {
    queued = false;
    for (const e of entries) {
      if (!e.mf.isConnected) { entries.delete(e); if (ro) ro.unobserve(e.bd); continue; }
      apply(e.el, e.mf);
    }
  }
  const later = () => { if (!queued) { queued = true; requestAnimationFrame(all); } };

  function toText(el, mf) {
    const ed = R('blocks/editor');
    const b = ed.blockById(el.dataset.id);
    if (!b || b.type !== 'math' || el.querySelector('math-field:not([data-aux])') !== mf) return;
    const v = mf.getValue ? mf.getValue('latex') : b.v;
    const txt = plainText(v);
    if (txt === null || !txt.trim()) return;
    const prev = { v, note: b.note, result: b.result };
    delete b.result;
    b.type = 'text';
    b.v = txt;
    delete b.html; // el texto nuevo manda; un html antiguo lo taparía
    delete b.note;
    el.replaceWith(ed.makeBlockEl(b));
    S.save();
    toast('He pasado la línea a texto para que no se salga de la hoja.', 'nota', {
      label: 'Deshacer',
      fn: () => {
        const cur = ed.blockById(b.id);
        if (!cur) return;
        cur.type = 'math'; delete cur.html;
        cur.v = prev.v;
        if (prev.note) cur.note = prev.note;
        if (prev.result) cur.result = prev.result;
        const old = ed.elById(cur.id);
        if (old) old.replaceWith(ed.makeBlockEl(cur));
        S.save();
      },
    });
  }

  function watch(el, mf) {
    if (!el || !mf || mf.hasAttribute('data-aux')) return;
    const bd = el.querySelector('.blk-body') || mf.parentElement;
    const entry = { el, mf, bd };
    entries.add(entry);
    if (!ro && typeof ResizeObserver === 'function') ro = new ResizeObserver(later);
    if (ro) ro.observe(bd);
    mf.addEventListener('input', later);
    mf.addEventListener('focusout', () => {
      setTimeout(() => { if (mf.isConnected && !mf.matches(':focus-within') && document.activeElement !== mf) toText(el, mf); }, 0);
    });
    // la letra global (--scale) y el papel cambian estilos del <html>/hoja
    if (!mo && typeof MutationObserver === 'function') {
      mo = new MutationObserver(later);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class', 'data-mode'] });
      const sheet = document.querySelector('#sheet') || document.querySelector('.sheet');
      if (sheet) mo.observe(sheet, { attributes: true, attributeFilter: ['class', 'style'] });
    }
    requestAnimationFrame(() => apply(el, mf));
    setTimeout(later, 400); // tras cargar las fuentes
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(later);
  }

  return { watch, apply, plainText };
});
