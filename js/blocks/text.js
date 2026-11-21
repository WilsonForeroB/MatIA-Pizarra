/* Bloque «Texto»: línea de texto enriquecido (contenteditable) con saneador de lista blanca.
   - b.v: texto plano (compatibilidad, búsqueda); b.html: formato saneado (solo b i u s br p div ul ol li span, clases tf-* y math-inline).
   IMPORTANTE: este script debe cargarse ANTES de js/model/board.js (registra su saneador en model/schema). Por eso no depende
   de model/board: lo usa con enlace tardío. */
MatIA.define('blocks/text', ['blocks/registry'], (registry) => {
  'use strict';
  const R = (n) => MatIA.require(n);
  const S = { save: () => R('model/board').save() };

  /* ---------------- Saneador de lista blanca ---------------- */
  const TAGS = { b: 'b', strong: 'b', i: 'i', em: 'i', u: 'u', s: 's', strike: 's', del: 's', br: 'br', p: 'p', div: 'div', ul: 'ul', ol: 'ol', li: 'li', span: 'span' };
  const DROP = new Set(['script', 'style', 'template', 'iframe', 'object', 'embed', 'noscript', 'svg', 'math', 'math-field', 'textarea', 'select', 'title', 'head', 'link', 'meta']);
  const CLASS_RE = /^tf-(c[0-6]|hl[0-3]|sz-(n|lg|sub|title)|f-(def|sans|serif|mono|hand)|al-(left|center|right|justify)|indent-[1-6])$/;
  const BLOCKS = new Set(['p', 'div', 'li']);
  const ALIGN = { left: 'tf-al-left', start: 'tf-al-left', center: 'tf-al-center', right: 'tf-al-right', end: 'tf-al-right', justify: 'tf-al-justify' };

  function cleanInto(src, out, doc) {
    for (const n of Array.from(src.childNodes)) {
      if (n.nodeType === 3) { const t = n.nodeValue.replace(/​/g, ''); if (t) out.appendChild(doc.createTextNode(t)); continue; }
      if (n.nodeType !== 1) continue;
      const tag = n.localName;
      if (DROP.has(tag)) continue;
      if (tag === 'blockquote') { // sangría de execCommand → div con clase propia
        const d = doc.createElement('div');
        d.className = 'tf-indent-1';
        cleanInto(n, d, doc);
        out.appendChild(d);
        continue;
      }
      const t = TAGS[tag];
      if (!t) { cleanInto(n, out, doc); continue; } // etiqueta desconocida: se conserva el texto
      if (t === 'br') { out.appendChild(doc.createElement('br')); continue; }
      const el = doc.createElement(t);
      if (t === 'span' && n.classList.contains('math-inline')) {
        el.className = 'math-inline';
        el.setAttribute('data-latex', String(n.getAttribute('data-latex') || '').slice(0, 2000));
        out.appendChild(el); // el contenido (math-field) se descarta: se vuelve a crear al dibujar
        continue;
      }
      const cls = Array.from(n.classList).filter((c) => CLASS_RE.test(c));
      if (BLOCKS.has(t) && n.style && ALIGN[n.style.textAlign] && !cls.some((c) => c.startsWith('tf-al-'))) cls.push(ALIGN[n.style.textAlign]);
      if (cls.length) el.className = cls.join(' ');
      cleanInto(n, el, doc);
      if (t === 'span' && !cls.length) { while (el.firstChild) out.appendChild(el.firstChild); continue; } // span sin clase: no aporta
      out.appendChild(el);
    }
  }
  /** Devuelve html seguro (solo lista blanca) a partir de cualquier html. Nunca se asigna html sin sanear a la página. */
  function sanitize(html) {
    if (typeof html !== 'string' || !html) return '';
    const src = new DOMParser().parseFromString('<!doctype html><body>' + html, 'text/html').body; // documento inerte: no ejecuta nada
    const doc = document.implementation.createHTMLDocument('');
    const out = doc.createElement('div');
    cleanInto(src, out, doc);
    return out.innerHTML.slice(0, 200000);
  }
  const plainOf = (html) => { const d = document.implementation.createHTMLDocument(''); d.body.innerHTML = sanitize(html); return d.body.textContent || ''; };

  /* ---------------- Fórmulas en línea ---------------- */
  function hydrateMath(t, ro) {
    const st = R('ui/state');
    const ml = st.mlReady && customElements.get('math-field');
    t.querySelectorAll('span.math-inline').forEach((sp) => {
      const latex = sp.getAttribute('data-latex') || '';
      sp.textContent = '';
      sp.contentEditable = 'false';
      if (!ml) { sp.textContent = latex; return; }
      makeMath(sp, latex, ro);
    });
    if (!ro) { const last = t.lastChild; if (last && last.nodeType === 1 && last.classList.contains('math-inline')) t.appendChild(document.createTextNode('​')); }
  }
  function makeMath(sp, latex, ro) {
    const mf = document.createElement('math-field');
    mf.setAttribute('data-aux', '1');
    mf.setAttribute('aria-label', 'Fórmula en línea');
    if (ro) mf.setAttribute('read-only', '');
    sp.appendChild(mf);
    try { R('blocks/editor').configureField(mf); } catch (e) { /* editor aún no listo */ }
    mf.value = latex;
    if (!ro) {
      mf.addEventListener('input', () => { sp.setAttribute('data-latex', mf.getValue('latex')); });
      mf.addEventListener('move-out', (e) => {
        const d = e.detail && e.detail.direction;
        const host = sp.closest('.blk-text');
        if (!host) return;
        e.preventDefault();
        host.focus();
        const r = document.createRange();
        if (d === 'backward' || d === 'upward') r.setStartBefore(sp); else r.setStartAfter(sp);
        r.collapse(true);
        const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      });
    }
    return mf;
  }

  /* ---------------- Bloque ---------------- */
  function build(b, bd, ro) {
    const t = document.createElement('div');
    t.className = 'blk-text';
    if (!ro) {
      t.contentEditable = 'true';
      t.setAttribute('role', 'textbox');
      t.setAttribute('aria-multiline', 'true');
      t.setAttribute('aria-label', 'Línea de texto');
      t.dataset.ph = 'Escribe un texto…';
    }
    if (typeof b.html === 'string' && b.html) t.innerHTML = sanitize(b.html); else t.textContent = b.v || '';
    hydrateMath(t, ro);
    if (!ro) {
      const sync = () => {
        if (!t.textContent.replace(/​/g, '') && !t.querySelector('.math-inline,li')) { if (t.firstChild) t.innerHTML = ''; }
        const h = sanitize(t.innerHTML);
        if (h && /<|&/.test(h)) b.html = h; else delete b.html; // texto sin formato: solo v
        b.v = t.innerText.replace(/​/g, '').replace(/\n$/, '');
        const ed = R('blocks/editor');
        if (ed.hidePio) ed.hidePio();
        S.save();
      };
      t.addEventListener('input', sync);
      t.addEventListener('paste', (e) => { // se pega solo texto o html saneado, nunca html ajeno
        const cd = e.clipboardData;
        if (!cd) return;
        e.preventDefault();
        const html = cd.getData('text/html');
        if (html) {
          const h = sanitize(html).replace(/<span class="math-inline"[^>]*><\/span>/g, '');
          document.execCommand('insertHTML', false, h);
        } else document.execCommand('insertText', false, cd.getData('text/plain'));
      });
    }
    bd.appendChild(t);
  }

  registry.register({ type: 'text', build });
  R('model/schema').register('text', (x, base) => {
    const o = Object.assign(base, { type: 'text', v: typeof x.v === 'string' ? x.v : '', result: !!x.result });
    const h = sanitize(x.html);
    if (h) o.html = h;
    return o;
  });
  return { sanitize, plainOf, hydrateMath, makeMath, CLASS_RE };
});
