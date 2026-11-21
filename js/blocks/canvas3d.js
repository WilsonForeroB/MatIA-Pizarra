/* Utilidades 3D para canvas (proyección, pintor con sombreado, giro con el puntero).
   Extraídas de la lógica de blocks/graph3d; las usa blocks/solid. */
MatIA.define('blocks/canvas3d', [], () => {
  'use strict';
  const hexRGB = (c) => {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec((c || '').trim());
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [120, 120, 120];
  };
  const mixRGB = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

  /** Proyección ortográfica con azimut/elevación. P(X, Y, Z) → [sx, sy, profundidad]; Z apunta hacia arriba. */
  function projector({ az, el, zoom, W, H, k }) {
    const ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(el), se = Math.sin(el);
    const sc = Math.min(W, H) * (k || 0.25) * (zoom || 1), cx = W / 2, cy = H / 2 + 6;
    const P = (X, Y, Z) => { const x1 = X * ca - Y * sa, y1 = X * sa + Y * ca; return [cx + x1 * sc, cy - (y1 * se + Z * ce) * sc, y1 * ce - Z * se]; };
    P.scale = sc;
    return P;
  }

  /** Pinta polígonos {q:[[sx,sy,d],…], color:[r,g,b], shade?} de atrás hacia delante.
      El sombreado sale de la normal en pantalla (área proyectada / opts.ref). */
  function paintQuads(ctx, quads, opts) {
    const o = opts || {};
    const ink = o.ink || [20, 30, 25], ref = o.ref || 1, edge = o.edge == null ? 0.18 : o.edge;
    const list = quads.map((p) => {
      const q = p.q;
      const d = p.d != null ? p.d : q.reduce((s, v) => s + v[2], 0) / q.length;
      let shade = p.shade;
      if (shade == null) {
        let area = 0;
        for (let i = 0; i < q.length; i++) { const a = q[i], b = q[(i + 1) % q.length]; area += a[0] * b[1] - b[0] * a[1]; }
        shade = Math.min(1, Math.abs(area) / 2 / ref * 0.9);
      }
      return { q, d, shade, color: p.color };
    });
    list.sort((p, q) => q.d - p.d);
    ctx.lineWidth = 0.6;
    ctx.lineJoin = 'round';
    for (const { q, shade, color } of list) {
      const k = 0.62 + 0.38 * shade;
      ctx.fillStyle = 'rgb(' + color.map((v) => Math.round(v * k)).join(',') + ')';
      ctx.strokeStyle = 'rgba(' + ink.join(',') + ',' + edge + ')';
      ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]);
      for (let n = 1; n < q.length; n++) ctx.lineTo(q[n][0], q[n][1]);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }

  /** Girar arrastrando (sin rueda). b.az / b.el se actualizan; onEnd() al soltar. */
  function attachRotate(canvas, b, redraw, onEnd) {
    let drag = null;
    canvas.addEventListener('pointerdown', (e) => {
      if (document.body.dataset.mode === 'draw' || e.pointerType === 'pen') return;
      e.stopPropagation();
      drag = { x: e.clientX, y: e.clientY, az: b.az, el: b.el };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!drag) return;
      b.az = drag.az + (e.clientX - drag.x) * 0.01;
      b.el = Math.max(-1.45, Math.min(1.45, drag.el + (e.clientY - drag.y) * 0.01));
      requestAnimationFrame(() => redraw());
    });
    const end = () => { if (drag) { drag = null; if (onEnd) onEnd(); } };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
  }

  return { hexRGB, mixRGB, projector, paintQuads, attachRotate };
});
