/* Banco de ejemplos: ventana «Ejemplos» junto a «Historial».
   Los ejemplos viven en la carpeta ejemplos/ (al lado de pizarra.html) y se cargan como <script> normales
   con MatIA.ejemplo({…}), así que no hace falta pedir permiso de carpeta y funcionan en cualquier navegador.
   Abrir un ejemplo carga una COPIA: el original no se toca nunca. */
MatIA.define('ui/examples', ['core/dom', 'model/board', 'model/schema', 'ui/toast', 'assets/pio'], (dom, S, schema, toast, pio) => {
  'use strict';
  const { $ } = dom;
  const R = (n) => MatIA.require(n);

  /** Temas en el orden en que se muestran. */
  const TEMAS = [
    { id: 'algebra', name: 'Álgebra', icon: '[ ]', tip: 'Matrices, sistemas y polinomios' },
    { id: 'calculo', name: 'Cálculo', icon: '∫', tip: 'Derivadas, extremos, integrales y volúmenes' },
    { id: 'graficas', name: 'Gráficas', icon: 'ƒ', tip: 'Funciones en 2D y superficies en 3D' },
    { id: 'estadistica', name: 'Estadística y probabilidad', icon: 'σ', tip: 'Datos, distribución normal, árboles y Bayes' },
    { id: 'geometria', name: 'Geometría', icon: '△', tip: 'Triángulos, circunferencias y rectas' },
    { id: 'discreta', name: 'Discreta y lógica', icon: '⋈', tip: 'Grafos, conjuntos y tablas de verdad' },
    { id: 'presentaciones', name: 'Presentaciones', icon: '▭', tip: 'Diapositivas listas para guardar como PDF' },
  ];
  const temaOf = (id) => TEMAS.find((t) => t.id === id) || { id, name: id, icon: '•', tip: '' };
  const all = () => MatIA.ejemplos().slice().sort((a, b) => {
    const ia = TEMAS.findIndex((t) => t.id === a.tema), ib = TEMAS.findIndex((t) => t.id === b.tema);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || String(a.titulo).localeCompare(String(b.titulo), 'es');
  });
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  /* ---------- Ventana ---------- */
  const dlg = document.createElement('dialog');
  dlg.id = 'examples';
  dlg.setAttribute('aria-labelledby', 'exTitle');
  dlg.innerHTML = '<div class="dlg-head"><h2 id="exTitle" class="pio-title">Ejemplos para inspirarte</h2>'
    + '<button type="button" class="mi-btn mi-btn--sm" id="exClose">Cerrar</button></div>'
    + '<div class="ex-body">'
    + '<p class="ex-lead">Abre un ejemplo para ver lo que puede hacer la pizarra y <b>cámbialo a tu gusto</b>: se abre una copia, el original no se estropea. '
    + 'Con «Añadir páginas» lo sumas a tu clase actual.</p>'
    + '<div class="ex-tools"><div class="ex-tabs" role="tablist" aria-label="Temas"></div>'
    + '<input type="search" class="ex-search" placeholder="Buscar: derivada, Gauss, normal…" aria-label="Buscar ejemplos"></div>'
    + '<div class="ex-grid" role="list"></div>'
    + '</div>';
  document.body.appendChild(dlg);
  dlg.querySelector('#exTitle').prepend(pio.badge('idea', '', 'Pío con una idea'));
  const tabs = dlg.querySelector('.ex-tabs'), grid = dlg.querySelector('.ex-grid'), search = dlg.querySelector('.ex-search');
  let tema = 'todos';

  function renderTabs() {
    tabs.textContent = '';
    const list = all();
    const mk = (id, label, n) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'ex-tab'; b.setAttribute('role', 'tab'); b.dataset.tema = id;
      b.setAttribute('aria-selected', String(id === tema));
      b.innerHTML = '<span></span><small></small>';
      b.firstChild.textContent = label; b.lastChild.textContent = n;
      b.addEventListener('click', () => { tema = id; renderTabs(); renderGrid(); });
      tabs.appendChild(b);
    };
    mk('todos', 'Todos', list.length);
    for (const t of TEMAS) { const n = list.filter((e) => e.tema === t.id).length; if (n) mk(t.id, t.name, n); }
  }

  function card(e) {
    const t = temaOf(e.tema);
    const c = document.createElement('article');
    c.className = 'ex-card';
    c.setAttribute('role', 'listitem');
    c.dataset.id = e.id;
    const fig = document.createElement('div');
    fig.className = 'ex-thumb';
    fig.dataset.tema = t.id;
    const ic = document.createElement('span'); ic.className = 'ex-icon'; ic.setAttribute('aria-hidden', 'true'); ic.textContent = t.icon;
    fig.appendChild(ic);
    // miniatura generada por «node src/tests/ejemplos.js --capturas»; si no existe se queda el icono del tema
    const img = new Image();
    img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
    img.addEventListener('load', () => fig.classList.add('has-img'));
    img.addEventListener('error', () => img.remove());
    img.src = 'ejemplos/img/' + e.id + '.jpg';
    fig.appendChild(img);
    const body = document.createElement('div');
    body.className = 'ex-info';
    const tag = document.createElement('span'); tag.className = 'ex-tag'; tag.textContent = t.name;
    const h = document.createElement('h3'); h.textContent = e.titulo || e.id;
    const p = document.createElement('p'); p.textContent = e.resumen || '';
    const n = (e.board.pages || []).length;
    const meta = document.createElement('small'); meta.textContent = n + (n === 1 ? ' página' : ' páginas') + (e.board.paper === 'slide' ? ' · diapositivas' : '');
    body.append(tag, h, p, meta);
    const acts = document.createElement('div');
    acts.className = 'ex-acts';
    const btn = (label, primary, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'mi-btn mi-btn--sm' + (primary ? ' mi-btn--primary' : ''); b.textContent = label; b.addEventListener('click', fn); acts.appendChild(b); return b; };
    btn('Abrir', true, () => open(e, false)).setAttribute('aria-label', 'Abrir el ejemplo «' + (e.titulo || e.id) + '»');
    btn('Añadir páginas', false, () => open(e, true)).setAttribute('aria-label', 'Añadir a mi clase las páginas de «' + (e.titulo || e.id) + '»');
    c.append(fig, body, acts);
    return c;
  }

  function renderGrid() {
    grid.textContent = '';
    const q = norm(search.value.trim());
    const list = all().filter((e) => (tema === 'todos' || e.tema === tema)
      && (!q || norm([e.titulo, e.resumen, temaOf(e.tema).name, e.board.title].join(' ')).includes(q)));
    if (!list.length) {
      const d = document.createElement('div'); d.className = 'hist-empty ex-empty';
      d.appendChild(pio.badge('lectura', 'pio-lg', 'Pío leyendo'));
      const sp = document.createElement('span');
      sp.textContent = MatIA.ejemplos().length ? 'No hay ejemplos que coincidan con «' + search.value.trim() + '».' : 'No se han encontrado ejemplos. Comprueba que la carpeta «ejemplos» está junto a pizarra.html.';
      d.appendChild(sp); grid.appendChild(d);
      return;
    }
    // con «Todos», un encabezado por tema
    let last = null;
    for (const e of list) {
      if (tema === 'todos' && e.tema !== last) {
        last = e.tema;
        const t = temaOf(e.tema);
        const h = document.createElement('h3'); h.className = 'ex-group'; h.textContent = t.name;
        if (t.tip) { const s = document.createElement('small'); s.textContent = t.tip; h.appendChild(s); }
        grid.appendChild(h);
      }
      grid.appendChild(card(e));
    }
  }
  search.addEventListener('input', renderGrid);
  search.addEventListener('keydown', (e) => { if (e.key === 'Escape' && search.value) { e.preventDefault(); search.value = ''; renderGrid(); } });

  /* ---------- Abrir / añadir ---------- */
  function copyOf(e) {
    const data = schema.sanitize(JSON.parse(JSON.stringify(e.board)));
    if (!data) return null;
    // ids nuevos: añadir el mismo ejemplo dos veces no repite ids
    data.pages.forEach((p) => p.blocks.forEach((b) => { b.id = schema.uid(); }));
    return data;
  }
  async function open(e, append) {
    const data = copyOf(e);
    if (!data) { toast('Este ejemplo no se puede abrir (su formato no es válido).', 'aviso'); return; }
    if (append) {
      const from = S.board.pages.length;
      // si la pizarra está vacía, el ejemplo sustituye a la página en blanco
      const blank = R('storage/dirty').boardEmpty && R('storage/dirty').boardEmpty();
      if (blank) S.board.pages.length = 0;
      S.board.pages.push(...data.pages);
      S.board.cur = blank ? 0 : from;
      toast('Añadidas ' + data.pages.length + (data.pages.length === 1 ? ' página' : ' páginas') + ' de «' + e.titulo + '».');
    } else {
      if (!(await R('storage/dirty').guardUnsaved('abrir el ejemplo «' + e.titulo + '»'))) return;
      const keep = { theme: S.board.theme, accent: S.board.accent, scale: S.board.scale };
      S.replace(Object.assign(data, keep, { title: data.title || e.titulo }));
      R('storage/history').clearSession();   // guardar después crea un archivo nuevo, no pisa otra clase
      R('storage/dirty').markSaved();
      toast('Abierto el ejemplo «' + e.titulo + '». Cámbialo a tu gusto; guárdalo con «Guardar» si quieres conservarlo.');
    }
    R('ui/view').applySettings();
    R('blocks/editor').renderPage();
    S.save();
    dlg.close();
  }

  function show(t) {
    if (t) tema = t;
    renderTabs(); renderGrid();
    dlg.showModal();
    search.focus();
  }
  dlg.querySelector('#exClose').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  const btn = $('#exBtn');
  if (btn) btn.addEventListener('click', () => show());
  return { show, TEMAS, open: (id, append) => { const e = MatIA.ejemplos().find((x) => x.id === id); return e ? open(e, append) : null; } };
});
