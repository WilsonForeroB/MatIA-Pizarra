/* Impresión de todas las páginas (pizarra.html 7772-7848); usa el registro de bloques. */
MatIA.define('ui/print', ['core/dom', 'model/board', 'ui/state'], (dom, S, st) => {
  'use strict';
  const { $, $$ } = dom;
  const sheet = $('#sheet');
  const R = (n) => MatIA.require(n);
  function printAll() {
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
    setTimeout(() => window.print(), 600);
  }
  window.addEventListener('afterprint', () => { $('#print-root').innerHTML = ''; });
  return { printAll };
});
