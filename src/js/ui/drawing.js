/* Dibujo a mano alzada: lienzo, trazos, borrador, deshacer (pizarra.html 7849-8025). */
MatIA.define('ui/drawing', ['core/dom', 'model/board', 'ui/state', 'ui/toast'], (dom, S, ST, toast) => {
  'use strict';
  const { $, $$ } = dom;
  const { body } = dom;
  const sheet = $('#sheet'), blocksEl = $('#blocks'), wrap = $('#wrap'), cv = $('#ink');
  const R = (n) => MatIA.require(n);
  /* ---------------- Dibujo ---------------- */
  const ctx = cv.getContext('2d');
  let dpr = 1, undoStack = [], cur = null;
  let pageEnd = null;
  function sizeCanvas() {
    R('ui/view').fitZoom();
    const p = S.page();
    const pp = R('ui/view').PAPERS[S.board.paper];
    const contentH = blocksEl.offsetTop + blocksEl.offsetHeight + (pp ? 40 : 120);
    const need = pp ? Math.max(pp[1], contentH, p.minH || 0) : Math.max(wrap.clientHeight / ST.zoomF - 32, contentH, p.minH || 0);
    // marca del final de la página cuando el contenido no cabe
    if (pp && need > pp[1] + 1) {
      if (!pageEnd) { pageEnd = document.createElement('div'); pageEnd.className = 'page-end'; pageEnd.innerHTML = '<span>Fin de la página: lo de debajo no cabe al imprimir o presentar</span>'; }
      pageEnd.style.top = (pp[1] - 1) + 'px';
      if (!pageEnd.isConnected) sheet.appendChild(pageEnd);
    } else if (pageEnd && pageEnd.isConnected) pageEnd.remove();
    sheet.style.minHeight = need + 'px';
    const w = sheet.clientWidth, h = sheet.clientHeight;
    dpr = window.devicePixelRatio || 1;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      cv.style.width = w + 'px'; cv.style.height = h + 'px';
    }
    redraw();
  }
  new ResizeObserver(() => sizeCanvas()).observe(wrap);
  new ResizeObserver(() => sizeCanvas()).observe(blocksEl);

  function drawStroke(c, s, colorOf = R('ui/view').cssVar) {
    const col = colorOf(s.color) || colorOf('ink');
    const pts = s.pts;
    if (!pts.length) return;
    c.save();
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.strokeStyle = col;
    c.fillStyle = col;
    if (s.tool === 'hl') {
      c.globalAlpha = 0.32;
      c.lineWidth = s.w * 5;
      c.lineCap = 'butt';
      c.beginPath();
      c.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
      c.stroke();
    } else if (s.tool === 'arrow') {
      const [a, b] = [pts[0], pts[pts.length - 1]];
      c.lineWidth = s.w;
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
      const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 10 + s.w * 3;
      c.beginPath();
      c.moveTo(b[0], b[1]);
      c.lineTo(b[0] - L * Math.cos(ang - 0.45), b[1] - L * Math.sin(ang - 0.45));
      c.lineTo(b[0] - L * Math.cos(ang + 0.45), b[1] - L * Math.sin(ang + 0.45));
      c.closePath(); c.fill();
    } else {
      if (pts.length === 1) { c.beginPath(); c.arc(pts[0][0], pts[0][1], s.w * pts[0][2] / 2, 0, Math.PI * 2); c.fill(); }
      for (let i = 1; i < pts.length; i++) {
        const p0 = pts[i - 1], p1 = pts[i];
        c.lineWidth = s.w * (p0[2] + p1[2]) / 2;
        c.beginPath();
        if (i > 1) {
          const pm = pts[i - 2];
          c.moveTo((pm[0] + p0[0]) / 2, (pm[1] + p0[1]) / 2);
          c.quadraticCurveTo(p0[0], p0[1], (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2);
        } else { c.moveTo(p0[0], p0[1]); c.lineTo((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2); }
        c.stroke();
      }
      const l = pts[pts.length - 1], pl = pts[pts.length - 2];
      if (pl) { c.lineWidth = s.w * l[2]; c.beginPath(); c.moveTo((pl[0] + l[0]) / 2, (pl[1] + l[1]) / 2); c.lineTo(l[0], l[1]); c.stroke(); }
    }
    c.restore();
  }
  let rafPending = false;
  function redraw() {
    rafPending = false;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (const s of S.page().strokes) drawStroke(ctx, s);
    if (cur && cur.tool !== 'eraser') drawStroke(ctx, cur);
  }
  const scheduleRedraw = () => { if (!rafPending) { rafPending = true; requestAnimationFrame(redraw); } };
  function sheetPoint(e) {
    const r = sheet.getBoundingClientRect();
    const pr = e.pointerType === 'pen' ? 0.35 + (e.pressure || 0.5) * 1.3 : 1;
    return [Math.round((e.clientX - r.left) / ST.zoomF * 10) / 10, Math.round((e.clientY - r.top) / ST.zoomF * 10) / 10, Math.round(pr * 100) / 100];
  }
  function distSeg(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const l2 = dx * dx + dy * dy;
    let t = l2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    const x = a[0] + t * dx - p[0], y = a[1] + t * dy - p[1];
    return Math.sqrt(x * x + y * y);
  }
  function eraseAt(p) {
    const st = S.page().strokes;
    const removed = [];
    for (let i = st.length - 1; i >= 0; i--) {
      const s = st[i];
      const tol = 10 + (s.tool === 'hl' ? s.w * 2.5 : s.w);
      const pts = s.tool === 'arrow' ? [s.pts[0], s.pts[s.pts.length - 1]] : s.pts;
      let hit = pts.length === 1 ? Math.hypot(pts[0][0] - p[0], pts[0][1] - p[1]) < tol : false;
      for (let k = 1; k < pts.length && !hit; k++) if (distSeg(p, pts[k - 1], pts[k]) < tol) hit = true;
      if (hit) { removed.push({ s, i }); st.splice(i, 1); }
    }
    if (removed.length) { cur.erased.push(...removed); scheduleRedraw(); }
  }
  sheet.addEventListener('pointerdown', (e) => {
    const drawing = body.dataset.mode === 'draw' || e.pointerType === 'pen';
    if (!drawing || e.button > 0) return;
    if (e.target.closest('.blk-handle')) return;
    // en modo Escribir, el lápiz sirve para elegir la línea de una operación y para pulsar botones
    if (body.dataset.mode === 'write' && (ST.picking || e.target.closest('button'))) return;
    e.preventDefault();
    e.stopPropagation();
    if (document.activeElement && document.activeElement.blur && body.dataset.mode === 'draw') document.activeElement.blur();
    try { sheet.setPointerCapture(e.pointerId); } catch (x) { /* */ }
    const tool = e.pointerType === 'pen' && e.button === 5 ? 'eraser' : S.board.tool;
    const p = sheetPoint(e);
    cur = { tool, color: S.board.color, w: S.board.width, pts: [p], erased: [], pid: e.pointerId };
    if (tool === 'eraser') eraseAt(p);
    R('blocks/editor').hidePio();
    scheduleRedraw();
  }, true);
  sheet.addEventListener('pointermove', (e) => {
    if (!cur || e.pointerId !== cur.pid) return;
    e.preventDefault();
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of evs.length ? evs : [e]) {
      const p = sheetPoint(ev);
      if (cur.tool === 'eraser') { eraseAt(p); continue; }
      if (cur.tool === 'arrow') { cur.pts[1] = p; continue; }
      const l = cur.pts[cur.pts.length - 1];
      if (Math.hypot(p[0] - l[0], p[1] - l[1]) >= 1.5) cur.pts.push(p);
    }
    const y = cur.pts[cur.pts.length - 1][1];
    const pg = S.page();
    if (y > sheet.clientHeight - 160) { pg.minH = sheet.clientHeight + 400; sizeCanvas(); }
    scheduleRedraw();
  }, true);
  function endStroke(e) {
    if (!cur || (e && e.pointerId !== cur.pid)) return;
    const s = cur;
    cur = null;
    if (s.tool === 'eraser') {
      if (s.erased.length) undoStack.push({ type: 'erase', items: s.erased });
    } else if (!(s.tool === 'arrow' && s.pts.length < 2)) {
      delete s.erased; delete s.pid;
      S.page().strokes.push(s);
      undoStack.push({ type: 'add', s });
    }
    S.save();
    scheduleRedraw();
  }
  sheet.addEventListener('pointerup', endStroke, true);
  sheet.addEventListener('pointercancel', endStroke, true);
  function undo() {
    const a = undoStack.pop();
    if (!a) { toast('No hay trazos que deshacer en esta página.'); return; }
    const st = S.page().strokes;
    if (a.type === 'add') { const i = st.lastIndexOf(a.s); if (i >= 0) st.splice(i, 1); }
    else a.items.slice().reverse().forEach(({ s, i }) => st.splice(Math.min(i, st.length), 0, s));
    S.save();
    scheduleRedraw();
  }
  $('#undoBtn').addEventListener('click', undo);
  $('#clearInkBtn').addEventListener('click', () => {
    const st = S.page().strokes;
    if (!st.length) return;
    undoStack.push({ type: 'erase', items: st.map((s, i) => ({ s, i })).reverse() });
    S.page().strokes = [];
    S.save();
    scheduleRedraw();
  });
  $('#penWidth').addEventListener('input', (e) => { S.board.width = +e.target.value; R('ui/view').applySettings(); S.save(); });
  const resetUndo = () => { undoStack = []; };
  return { ctx, sizeCanvas, drawStroke, redraw, scheduleRedraw, sheetPoint, distSeg, eraseAt, endStroke, undo, resetUndo };
});
