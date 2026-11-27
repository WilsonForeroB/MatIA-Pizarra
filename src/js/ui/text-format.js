/* Formato del bloque «Texto», en la barra lateral (antes flotaba sobre la línea y tapaba la de arriba): negrita, cursiva, color, tamaño, tipo de letra, alineación, listas, fórmula en línea.
   Colores, tamaños y fuentes se guardan como clases tf-* (nada de style ni <font>), definidas en css/text.css. */
MatIA.define('ui/text-format', ['ui/state', 'blocks/text', 'ui/rail-section'], (st, T, section) => {
  'use strict';
  const R = (n) => MatIA.require(n);
  const sheet = document.getElementById('sheet');
  if (!sheet) return {};

  const COLORS = [['c0', 'Tinta', 'var(--ink)'], ['c1', 'Verde', 'var(--data-1)'], ['c2', 'Azul', 'var(--data-2)'], ['c3', 'Ocre', 'var(--data-3)'], ['c4', 'Rosa', 'var(--data-4)'], ['c5', 'Naranja', 'var(--data-5)'], ['c6', 'Celeste', 'var(--data-6)']];
  const HLS = [['hl0', 'Sin resaltado', 'transparent'], ['hl1', 'Amarillo suave', 'color-mix(in srgb, var(--data-3) 38%, transparent)'], ['hl2', 'Verde suave', 'color-mix(in srgb, var(--data-1) 32%, transparent)'], ['hl3', 'Azul suave', 'color-mix(in srgb, var(--selection) 85%, transparent)']];
  const SIZES = [['n', 'Normal'], ['lg', 'Grande'], ['sub', 'Subtítulo'], ['title', 'Título']];
  const FONTS = [['', 'Letra'], ['def', 'Predeterminada'], ['sans', 'Sans (IBM Plex Sans)'], ['serif', 'Serif (Source Serif 4)'], ['mono', 'Mono (JetBrains Mono)'], ['hand', 'Manuscrita (Caveat)']];
  const GROUP = { c: /^tf-c[0-6]$/, hl: /^tf-hl[0-3]$/, sz: /^tf-sz-/, f: /^tf-f-/ };

  // grupo «Formato» al principio de la barra lateral; solo se ve con una línea de texto activa
  const bar = document.createElement('div');
  bar.className = 'rgrp only-write tf-bar';
  bar.hidden = true;
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Formato de texto');
  const rail = document.getElementById('toolbar');
  const lineSec = document.getElementById('lineBar');
  if (rail) rail.insertBefore(bar, lineSec && lineSec.parentNode === rail ? lineSec.nextSibling : rail.firstChild); else sheet.appendChild(bar);

  let host = null;       // .blk-text activo
  let saved = null;      // último rango dentro del texto
  const inHost = (n) => host && n && host.contains(n.nodeType === 1 ? n : n.parentNode);

  function restore() {
    if (!host) return;
    host.focus();
    if (saved && host.contains(saved.commonAncestorContainer)) { const s = getSelection(); s.removeAllRanges(); s.addRange(saved); }
  }
  function changed() { host && host.dispatchEvent(new Event('input', { bubbles: true })); }
  const exec = (cmd) => { restore(); document.execCommand('styleWithCSS', false, false); document.execCommand(cmd); refresh(); };

  /* ---------- aplicador de clases por rango ---------- */
  function apply(group, cls) {
    restore();
    const s = getSelection();
    if (!s.rangeCount || s.isCollapsed) return;
    const range = s.getRangeAt(0);
    const w = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    const nodes = [];
    for (let n = w.nextNode(); n; n = w.nextNode()) if (range.intersectsNode(n) && !(n.parentElement && n.parentElement.closest('.math-inline'))) nodes.push(n);
    const sc = range.startContainer, so = range.startOffset, ec = range.endContainer, eo = range.endOffset;
    const wrapped = [];
    for (let n of nodes) {
      if (n === ec && eo < n.length) n.splitText(eo);
      if (n === sc && so > 0) n = n.splitText(so);
      if (!n.length || (n.parentNode.localName === 'ul' || n.parentNode.localName === 'ol')) continue;
      const p = n.parentNode;
      if (p.localName === 'span' && p.childNodes.length === 1 && Array.from(p.classList).some((c) => GROUP[group].test(c))) {
        Array.from(p.classList).filter((c) => GROUP[group].test(c)).forEach((c) => p.classList.remove(c));
        p.classList.add(cls);
        wrapped.push(p);
      } else {
        const sp = document.createElement('span');
        sp.className = cls;
        p.insertBefore(sp, n);
        sp.appendChild(n);
        wrapped.push(sp);
      }
    }
    if (!wrapped.length) return;
    const r = document.createRange();
    r.setStartBefore(wrapped[0]);
    r.setEndAfter(wrapped[wrapped.length - 1]);
    s.removeAllRanges(); s.addRange(r);
    saved = r.cloneRange();
    changed();
  }

  /* alineación: execCommand genera style=text-align en p/div/li; se pasa a clase tf-al-* y se quita el style */
  function align(kind) {
    restore();
    document.execCommand('styleWithCSS', false, true);
    document.execCommand({ left: 'justifyLeft', center: 'justifyCenter', right: 'justifyRight', justify: 'justifyFull' }[kind]);
    document.execCommand('styleWithCSS', false, false);
    host.querySelectorAll('[style]').forEach((el) => {
      const ta = el.style.textAlign;
      el.removeAttribute('style');
      if (!ta) return;
      Array.from(el.classList).filter((c) => c.startsWith('tf-al-')).forEach((c) => el.classList.remove(c));
      el.classList.add('tf-al-' + (ta === 'start' ? 'left' : ta === 'end' ? 'right' : ta));
    });
    changed();
  }

  function formula() {
    restore();
    const s = getSelection();
    if (!s.rangeCount) return;
    const r = s.getRangeAt(0);
    if (!inHost(r.commonAncestorContainer)) return;
    r.deleteContents();
    const sp = document.createElement('span');
    sp.className = 'math-inline';
    sp.setAttribute('data-latex', '');
    sp.contentEditable = 'false';
    r.insertNode(sp);
    if (!sp.nextSibling) sp.after(document.createTextNode('​'));
    let mf = null;
    if (st.mlReady && customElements.get('math-field')) mf = T.makeMath(sp, '', false);
    else sp.textContent = '∑';
    // el cursor del texto queda detrás de la fórmula (si no, la siguiente tecla sustituiría la fórmula)
    const after = document.createRange(); after.setStartAfter(sp); after.collapse(true);
    s.removeAllRanges(); s.addRange(after);
    changed();
    if (mf) focusMath(mf);
  }
  /* Recién creado, el campo de fórmula tarda un instante en montarse y aún no acepta el foco: lo que se
     escriba mientras tanto (p. ej. «$x» de seguido) se guarda y se pasa a la fórmula en cuanto está lista. */
  let pending = null;
  function focusMath(mf) {
    mf.focus();
    if (document.activeElement === mf) return;
    pending = { mf, keys: '' };
    const t0 = Date.now();
    const tick = () => {
      if (!pending || pending.mf !== mf) return;
      mf.focus();
      if (document.activeElement === mf || Date.now() - t0 > 1000) {
        const k = pending.keys; pending = null;
        if (k && document.activeElement === mf) mf.executeCommand(['typedText', k]);
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- construcción de la barra ---------- */
  const svg = (d) => '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">' + d + '</svg>';
  const ICON = {
    left: svg('<path d="M2 3h12M2 6.5h8M2 10h12M2 13.5h8"/>'), center: svg('<path d="M2 3h12M4 6.5h8M2 10h12M4 13.5h8"/>'),
    right: svg('<path d="M2 3h12M6 6.5h8M2 10h12M6 13.5h8"/>'), justify: svg('<path d="M2 3h12M2 6.5h12M2 10h12M2 13.5h12"/>'),
    indent: svg('<path d="M2 3h12M7 6.5h7M7 10h7M2 13.5h12M2 6l3 2-3 2z"/>'), outdent: svg('<path d="M2 3h12M7 6.5h7M7 10h7M2 13.5h12M5 6L2 8l3 2z"/>'),
  };
  const btns = {};
  function button(id, html, title, fn, cls) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mi-btn mi-btn--sm tf-btn' + (cls ? ' ' + cls : '');
    b.innerHTML = html;
    b.title = title;
    b.setAttribute('aria-label', title);
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.addEventListener('click', fn);
    bar.appendChild(b);
    btns[id] = b;
    return b;
  }
  function sep() { const d = document.createElement('span'); d.className = 'tf-sep'; d.setAttribute('role', 'separator'); bar.appendChild(d); }
  function select(title, opts, fn) {
    const sel = document.createElement('select');
    sel.className = 'tf-select';
    sel.title = title;
    sel.setAttribute('aria-label', title);
    opts.forEach(([v, l]) => { const o = document.createElement('option'); o.value = v; o.textContent = l; sel.appendChild(o); });
    sel.addEventListener('change', () => { const v = sel.value; if (!v) return; fn(v); sel.selectedIndex = 0; });
    bar.appendChild(sel);
    return sel;
  }
  function swatches(id, label, list, group, glyph) {
    const wrap = document.createElement('span');
    wrap.className = 'tf-pop-wrap';
    const pop = document.createElement('span');
    pop.className = 'tf-pop';
    pop.hidden = true;
    pop.setAttribute('role', 'group');
    pop.setAttribute('aria-label', label);
    list.forEach(([k, name, col]) => {
      const sw = document.createElement('button');
      sw.type = 'button';
      sw.className = 'tf-sw' + (group === 'hl' && k.endsWith('0') ? ' tf-sw--none' : ''); // «Tinta» (c0) es un color, no «sin color»
      sw.style.setProperty('--sw', col);
      sw.title = name;
      sw.setAttribute('aria-label', name);
      sw.addEventListener('mousedown', (e) => e.preventDefault());
      sw.addEventListener('click', () => { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); apply(group, 'tf-' + k); });
      pop.appendChild(sw);
    });
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mi-btn mi-btn--sm tf-btn';
    btn.innerHTML = glyph;
    btn.title = label;
    btn.setAttribute('aria-label', label);
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('mousedown', (e) => e.preventDefault());
    btn.addEventListener('click', () => {
      const open = pop.hidden;
      bar.querySelectorAll('.tf-pop').forEach((p) => { p.hidden = true; });
      bar.querySelectorAll('[aria-haspopup]').forEach((x) => x.setAttribute('aria-expanded', 'false'));
      pop.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      if (open) { const r = btn.getBoundingClientRect(); pop.style.left = (r.right + 8) + 'px'; pop.style.top = r.top + 'px'; } // a la derecha de la barra lateral
    });
    wrap.append(btn, pop);
    bar.appendChild(wrap);
    btns[id] = btn;
  }

  button('bold', '<b>B</b>', 'Negrita (Ctrl+B)', () => exec('bold'));
  button('italic', '<i>I</i>', 'Cursiva (Ctrl+I)', () => exec('italic'));
  button('underline', '<u>U</u>', 'Subrayado (Ctrl+U)', () => exec('underline'));
  button('strike', '<s>S</s>', 'Tachado', () => exec('strikeThrough'));
  sep();
  swatches('color', 'Color del texto', COLORS, 'c', '<span class="tf-glyph-color">A</span>');
  swatches('hl', 'Resaltado', HLS.slice(), 'hl', '<span class="tf-glyph-hl">ab</span>');
  sep();
  select('Tamaño del texto', [['', 'Tamaño']].concat(SIZES), (v) => apply('sz', 'tf-sz-' + v));
  select('Tipo de letra', FONTS, (v) => apply('f', 'tf-f-' + v));
  sep();
  [['left', 'Alinear a la izquierda'], ['center', 'Centrar'], ['right', 'Alinear a la derecha'], ['justify', 'Justificar']].forEach(([k, t]) => button('al-' + k, ICON[k], t, () => align(k)));
  sep();
  button('ul', '•&#8201;≡', 'Lista con viñetas', () => exec('insertUnorderedList'));
  button('ol', '1.&#8201;≡', 'Lista numerada', () => exec('insertOrderedList'));
  button('indent', ICON.indent, 'Más sangría', () => exec('indent'));
  button('outdent', ICON.outdent, 'Menos sangría', () => exec('outdent'));
  sep();
  button('formula', '∑ Fórmula', 'Insertar una fórmula en el texto (o escribe $). Para volver al texto: Intro, Esc o $', formula);

  // sección desplegable (cerrada de entrada: se abre si se necesita y se recuerda)
  section.make(bar, 'formato', 'Formato', false);

  /* ---------- visibilidad ---------- */
  function place() {
    if (!host || !host.isConnected) return hide();
    if (bar.hidden) {
      bar.hidden = false;
    }
  }
  function hide() {
    bar.hidden = true;
    host = null;
    bar.querySelectorAll('.tf-pop').forEach((p) => { p.hidden = true; });
    bar.querySelectorAll('[aria-haspopup]').forEach((x) => x.setAttribute('aria-expanded', 'false'));
  }
  function refresh() {
    if (bar.hidden) return;
    [['bold', 'bold'], ['italic', 'italic'], ['underline', 'underline'], ['strike', 'strikeThrough'], ['ul', 'insertUnorderedList'], ['ol', 'insertOrderedList']].forEach(([id, c]) => {
      let on = false;
      try { on = document.queryCommandState(c); } catch (e) { /* */ }
      btns[id].setAttribute('aria-pressed', String(on));
    });
  }

  const textHost = (n) => { const e = n && n.closest ? n.closest('.blk-text[contenteditable="true"]') : null; return e && sheet.contains(e) ? e : null; };
  document.addEventListener('focusin', (e) => {
    if (document.body.classList.contains('presenting')) return hide();
    if (bar.contains(e.target)) return;
    const h = textHost(e.target);
    if (h) { host = h; place(); refresh(); } else hide();
  });
  document.addEventListener('selectionchange', () => {
    const s = getSelection();
    if (!host || !s.rangeCount) return;
    const r = s.getRangeAt(0);
    if (host.contains(r.commonAncestorContainer) && !document.activeElement.matches('math-field')) { saved = r.cloneRange(); refresh(); }
  });
  // un clic en la barra lateral no la oculta (si no, los botones se moverían bajo el cursor):
  // se oculta cuando el foco pasa a otra línea (focusin) o con un clic fuera del texto en la hoja
  document.addEventListener('mousedown', (e) => {
    if (!host || bar.contains(e.target) || host.contains(e.target) || (rail && rail.contains(e.target))) return;
    if (e.target.closest && e.target.closest('.tf-pop, dialog, .pop, [role="menu"]')) return;
    hide();
  }, true);
  sheet.addEventListener('input', () => { if (host) place(); });
  // al cambiar de página (Alt+AvPág…) se redibuja #blocks sin focusin: si la línea ya no está, fuera la barra
  new MutationObserver(() => { if (host && !host.isConnected) hide(); }).observe(document.getElementById('blocks'), { childList: true });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && bar.querySelector('.tf-pop:not([hidden])')) { bar.querySelectorAll('.tf-pop').forEach((p) => { p.hidden = true; }); return; }
    const h = textHost(e.target);
    if (!h) return;
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && 'biu'.includes(e.key.toLowerCase()) && e.key.length === 1) {
      e.preventDefault(); e.stopPropagation();
      document.execCommand('styleWithCSS', false, false);
      document.execCommand({ b: 'bold', i: 'italic', u: 'underline' }[e.key.toLowerCase()]);
      return;
    }
    if (pending && pending.mf.isConnected && !/^(Shift|Control|Alt|Meta|AltGraph|CapsLock|Dead)$/.test(e.key)) { // la fórmula aún se está montando
      e.preventDefault(); e.stopPropagation();
      if (/^(Enter|Escape|Tab|\$)$/.test(e.key)) { // ya se sale de la fórmula: lo escrito va a ella y lo siguiente, al texto
        const { mf, keys } = pending; pending = null;
        mf.value = keys;
        const sp = mf.closest('.math-inline');
        if (sp) sp.setAttribute('data-latex', keys);
        changed();
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) pending.keys += e.key;
      return;
    }
    // «$» abre una fórmula dentro del texto (y otro «$», Intro, Esc o Espacio al final vuelven al texto)
    if (e.key === '$' && !e.ctrlKey && !e.metaKey && !e.altKey && e.target === h) {
      e.preventDefault(); e.stopPropagation();
      const s = getSelection();
      if (s.rangeCount) saved = s.getRangeAt(0).cloneRange();
      formula();
      return;
    }
    // dentro de una lista, Enter crea un elemento nuevo (el editor crearía otra línea)
    if (e.key === 'Enter' && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
      const s = getSelection();
      const n = s.anchorNode && (s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentNode);
      if (n && n.closest('li') && h.contains(n)) e.stopPropagation();
    }
  }, true);

  return { bar, apply, align };
});
