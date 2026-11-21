/* Exportar gráficos como imagen: PNG, SVG, copiar (pizarra.html 6067-6229). */
MatIA.define('ui/export-image', ['core/dom', 'model/board', 'ui/state', 'ui/toast', 'blocks/svg-utils'], (dom, S, st, toast, svgu) => {
  'use strict';
  const R = (n) => MatIA.require(n);
  const { $, body, root } = dom;
  const { SVGNS } = svgu;
  const refreshColors = (...a) => R('ui/mode-pages').refreshColors(...a);
  const isDark = (...a) => R('ui/view').isDark(...a);
  const showPop = (...a) => R('ui/popovers').showPop(...a);
  const closePop = (...a) => R('ui/popovers').closePop(...a);

  /* ---------------- Exportar gráficos como imagen ---------------- */
  // Se deriva del registro de bloques: son exportables los tipos registrados con exportable: true
  const EXPORTABLE = { has: (t) => { const d = R('blocks/registry').get(t); return !!(d && d.exportable); } };
  const EXP_NAME = { graph: 'grafica', graph3d: 'superficie-3d', net: 'grafo', venn: 'diagrama-venn', chart: 'grafico', ptree: 'arbol-probabilidad', geo: 'geometria' };
  let expTarget = null;
  function openExport(b, el, anchor) {
    expTarget = { b, el };
    $('#expPop [data-exp="svg"]').hidden = b.type === 'graph3d';
    if (st.openPop && st.openPop.p.id === 'expPop') { closePop(); return; }
    showPop('expPop', anchor);
    const pop = $('#expPop'), r = anchor.getBoundingClientRect();
    pop.style.left = Math.max(8, Math.min(r.right - pop.offsetWidth, innerWidth - pop.offsetWidth - 8)) + 'px';
  }
  // Textos que acompañan al gráfico: título arriba, leyenda y resultado debajo
  function exportTexts(el) {
    const q = (sel) => { const n = el.querySelector(sel); return n ? n.textContent.trim() : ''; };
    const title = q('.c-title');
    const legend = [];
    el.querySelectorAll('.g-legend span, .mk-legend span').forEach((sp) => {
      const cs = getComputedStyle(sp);
      const i = sp.querySelector('i');
      if (i) { legend.push({ sym: i.textContent, symColor: getComputedStyle(i).color, text: sp.textContent.slice(i.textContent.length).trim(), color: '' }); return; }
      const color = cs.getPropertyValue('--sw').trim();
      legend.push({ text: sp.textContent.trim(), color: color ? resolveColor(color) : '' });
    });
    const below = [q('.v-res'), q('.g3d .g-cap'), el.querySelector('.ptree') ? q('.ptree .mk-legend') : ''].filter(Boolean);
    return { title, legend: el.querySelector('.ptree') ? [] : legend, below };
  }
  function resolveColor(c) {
    if (!/var\(/.test(c)) return c;
    const t = document.createElement('span');
    t.style.color = c;
    body.appendChild(t);
    const v = getComputedStyle(t).color;
    t.remove();
    return v;
  }
  const SVG_PROPS = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'stroke-opacity', 'opacity', 'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'dominant-baseline', 'paint-order', 'visibility', 'display'];
  // Copia el SVG con los estilos ya resueltos (colores del tema incluidos) y añade título, leyenda y resultado
  function svgForExport(svg, texts, bg) {
    const clone = svg.cloneNode(true);
    const src = [svg, ...svg.querySelectorAll('*')], dst = [clone, ...clone.querySelectorAll('*')];
    src.forEach((n, i) => {
      if (!(n instanceof SVGElement)) return;
      const cs = getComputedStyle(n);
      dst[i].setAttribute('style', SVG_PROPS.map((k) => k + ':' + cs.getPropertyValue(k)).join(';'));
      dst[i].removeAttribute('class');
    });
    const vb = svg.viewBox.baseVal;
    const W = vb.width || svg.clientWidth, H0 = vb.height || svg.clientHeight;
    const font = getComputedStyle(body).getPropertyValue('--font-sans') || 'sans-serif';
    const ink = getComputedStyle(body).getPropertyValue('--ink').trim(), muted = getComputedStyle(body).getPropertyValue('--ink-muted').trim();
    const top = texts.title ? 36 : 0;
    // leyenda en filas
    const rows = [];
    let line = [], wsum = 0;
    for (const it of texts.legend) { const w = 26 + (it.text.length + (it.sym ? 2 : 0)) * 7.2; if (wsum + w > W - 20 && line.length) { rows.push(line); line = []; wsum = 0; } line.push({ ...it, w }); wsum += w; }
    if (line.length) rows.push(line);
    const belowLines = [];
    for (const t of texts.below) { let rest = t; while (rest.length) { const cut = rest.length > 95 ? rest.lastIndexOf(' ', 95) : rest.length; const k = cut > 20 ? cut : Math.min(95, rest.length); belowLines.push(rest.slice(0, k)); rest = rest.slice(k).trim(); } }
    const bottom = (rows.length ? rows.length * 22 + 8 : 0) + (belowLines.length ? belowLines.length * 22 + 8 : 0);
    const H = H0 + top + bottom;
    clone.setAttribute('xmlns', SVGNS);
    clone.setAttribute('viewBox', '0 ' + (-top) + ' ' + W + ' ' + H);
    clone.setAttribute('width', W);
    clone.setAttribute('height', H);
    clone.removeAttribute('role');
    const mk = (tag, attrs, text) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; return e; };
    clone.insertBefore(mk('rect', { x: 0, y: -top, width: W, height: H, fill: bg }), clone.firstChild);
    if (texts.title) clone.appendChild(mk('text', { x: 14, y: -12, style: 'font-family:' + font + ';font-size:16px;font-weight:600;fill:' + ink }, texts.title));
    let y = H0 + 22;
    for (const r of rows) {
      let x = 14;
      for (const it of r) {
        if (it.color) clone.appendChild(mk('rect', { x, y: y - 9, width: 16, height: 4, rx: 2, fill: it.color }));
        if (it.sym) clone.appendChild(mk('text', { x, y: y - 3, style: 'font-family:' + font + ';font-size:14px;font-weight:700;fill:' + it.symColor }, it.sym));
        clone.appendChild(mk('text', { x: x + (it.color ? 22 : it.sym ? 18 : 0), y: y - 3, style: 'font-family:' + font + ';font-size:13px;fill:' + muted }, it.text));
        x += it.w;
      }
      y += 22;
    }
    if (rows.length) y += 4;
    for (const t of belowLines) { clone.appendChild(mk('text', { x: 14, y: y - 3, style: 'font-family:' + font + ';font-size:15px;fill:' + ink }, t)); y += 22; }
    return { str: '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(clone), W, H };
  }
  function svgToPngBlob(str, W, H, scale) {
    return new Promise((res, rej) => {
      const img = new Image();
      const url = URL.createObjectURL(new Blob([str], { type: 'image/svg+xml;charset=utf-8' }));
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = Math.round(W * scale); c.height = Math.round(H * scale);
        const x = c.getContext('2d');
        x.scale(scale, scale);
        x.drawImage(img, 0, 0, W, H);
        URL.revokeObjectURL(url);
        c.toBlob((bl) => (bl ? res(bl) : rej(new Error('sin imagen'))), 'image/png');
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('No se ha podido convertir el gráfico.')); };
      img.src = url;
    });
  }
  function canvasToPngBlob(canvas, caption, bg) {
    return new Promise((res, rej) => {
      const W = canvas.width, H = canvas.height, pad = caption ? 48 : 0;
      const c = document.createElement('canvas');
      c.width = W; c.height = H + pad;
      const x = c.getContext('2d');
      x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height);
      x.drawImage(canvas, 0, 0);
      if (caption) { x.fillStyle = getComputedStyle(body).getPropertyValue('--ink').trim(); x.font = '400 ' + Math.round(15 * (window.devicePixelRatio || 1)) + 'px ' + (getComputedStyle(body).getPropertyValue('--font-serif') || 'serif'); x.fillText(caption, 16, H + pad * 0.62); }
      c.toBlob((bl) => (bl ? res(bl) : rej(new Error('sin imagen'))), 'image/png');
    });
  }
  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  async function doExport(kind) {
    if (!expTarget) return;
    const { b, el } = expTarget;
    closePop();
    const light = $('#expLight').checked;
    const prevTheme = root.getAttribute('data-theme');
    // con «fondo claro» se pinta temporalmente con el tema claro para que el gráfico sirva en documentos impresos
    const swap = light && isDark();
    if (swap) { root.setAttribute('data-theme', 'light'); refreshColors(); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); }
    try {
      const d = new Date();
      const base = (EXP_NAME[b.type] || 'grafico') + '-' + d.toISOString().slice(0, 10) + '_' + String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0') + String(d.getSeconds()).padStart(2, '0');
      const bg = light ? '#ffffff' : getComputedStyle(body).getPropertyValue('--surface-sunken').trim();
      let blob, ext = kind === 'svg' ? 'svg' : 'png';
      if (b.type === 'graph3d') {
        const cv3 = el.querySelector('.g3d canvas');
        const cap = el.querySelector('.g3d .g-cap');
        const sc = Math.max(1, 2 / (window.devicePixelRatio || 1));
        if (cv3._draw) cv3._draw(sc);
        try { blob = await canvasToPngBlob(cv3, cap ? cap.textContent : '', bg); } finally { if (cv3._draw) cv3._draw(); }
      } else {
        const svg = el.querySelector('.graph svg, .net svg, .venn svg, .chart svg, .ptree svg, .geo svg');
        if (!svg) throw new Error('No encuentro el gráfico.');
        const { str, W, H } = svgForExport(svg, exportTexts(el), bg);
        blob = kind === 'svg' ? new Blob([str], { type: 'image/svg+xml;charset=utf-8' }) : await svgToPngBlob(str, W, H, 2);
      }
      if (kind === 'copy') {
        if (!navigator.clipboard || !window.ClipboardItem) throw new Error('Este navegador no permite copiar imágenes: usa «Descargar PNG».');
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        toast('Imagen copiada: pégala con Ctrl+V en tu documento o presentación.');
      } else {
        download(blob, base + '.' + ext);
        toast('Descargado «' + base + '.' + ext + '».');
      }
    } catch (e) {
      toast(e.message || 'No se ha podido exportar el gráfico.', 'aviso');
    } finally {
      if (swap) { if (prevTheme) root.setAttribute('data-theme', prevTheme); else root.removeAttribute('data-theme'); refreshColors(); }
    }
  }
  $('#expPop').addEventListener('click', (e) => { const bt = e.target.closest('[data-exp]'); if (bt) doExport(bt.dataset.exp); });
  return { EXPORTABLE, EXP_NAME, openExport, exportTexts, resolveColor, svgForExport, svgToPngBlob, canvasToPngBlob, download, doExport };
});
