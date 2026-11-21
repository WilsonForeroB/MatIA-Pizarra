/* Calcular (Ctrl+=) y Gauss (pizarra.html 5686-5738). */
MatIA.define('ui/calc', ['core/dom', 'model/board', 'model/schema', 'ui/state', 'ui/toast'], (dom, S, schema, st, toast) => {
  'use strict';
  const { $, $$ } = dom;
  const { newBlock, newRow } = schema;
  const R = (n) => MatIA.require(n);
  /* ---------------- Calcular y Gauss ---------------- */
  function otherDefs(exceptId, exceptRow = -1) {
    const lines = [];
    for (const b of S.page().blocks) {
      if (b.type === 'math' && b.id !== exceptId) lines.push(b.v);
      if (b.type === 'deriv') b.rows.forEach((r, i) => { if (!(b.id === exceptId && i === exceptRow) && r.l.trim() && r.r.trim()) lines.push(r.l + '=' + r.r); });
    }
    return R('engine/core').definitions(lines);
  }
  function syncActive() { return R('blocks/editor').syncBlock(R('blocks/editor').activeBlock()); }
  function derivRowIndex(b) { return st.activeCell && st.activeCell.id === b.id ? st.activeCell.row : b.rows.length - 1; }
  function runCalc() {
    const b = syncActive();
    if (b && b.type === 'deriv') {
      const i = derivRowIndex(b), row = b.rows[i];
      if (!row.r.trim()) { toast('Escribe en el lado derecho la operación que quieres calcular.'); return; }
      try {
        const r = R('engine/core').compute(row.r, otherDefs(b.id, i));
        if (r.info) { toast(r.info); return; }
        const res = R('engine/core').toLatex(r.value);
        R('blocks/deriv').addRow(b, i, newRow(row.l, res));
      } catch (e) {
        toast(e instanceof R('engine/core').MErr ? e.message : 'No he podido calcular esta fila.', 'aviso');
      }
      return;
    }
    if (!b || b.type !== 'math' || !b.v.trim()) { toast('Escribe una operación en una línea, por ejemplo A·B = o 3/4 + 1/6 =, y pulsa Calcular.'); return; }
    // integrales: ∫ f dx = F(x) + C, o ∫ₐᵇ f dx = valor (exacto o aproximado)
    if (/^\s*\\int(?![a-zA-Z])/.test(b.v)) {
      try {
        const r = R('engine/ops').integralLine(b.v);
        const mf = R('blocks/editor').fieldOf(R('blocks/editor').elById(b.id));
        mf.value = r.latex;
        b.v = r.latex;
        S.save();
        R('blocks/editor').focusBlock(b.id, 'end');
      } catch (e) {
        toast(e instanceof R('engine/core').MErr ? e.message + ' Prueba Operaciones ▾ → Integral paso a paso.' : 'No he podido calcular esta integral.', 'aviso');
      }
      return;
    }
    try {
      const r = R('engine/core').compute(b.v, otherDefs(b.id));
      if (r.info) { toast(r.info); return; }
      const mf = R('blocks/editor').fieldOf(R('blocks/editor').elById(b.id));
      mf.value = r.latex;
      b.v = r.latex;
      S.save();
      R('blocks/editor').focusBlock(b.id, 'end');
    } catch (e) {
      toast(e instanceof R('engine/core').MErr ? e.message : 'No he podido calcular esta línea.', 'aviso');
    }
  }
  function runGauss(jordan) {
    const b = syncActive();
    const src = b && b.type === 'deriv' ? b.rows[derivRowIndex(b)].r : b && b.type === 'math' ? b.v : '';
    if (!src.trim()) { toast('Elige una línea con una matriz o un sistema para aplicar Gauss.'); return; }
    try {
      const lines = R('engine/core').gaussLines(src, b.type === 'deriv' ? otherDefs(b.id, derivRowIndex(b)) : otherDefs(b.id), jordan);
      let last = b.id;
      lines.forEach((L, i) => { last = R('blocks/editor').addBlockAfter(last, newBlock('math', L, { align: b.align, result: true }), i === lines.length - 1).id; });
    } catch (e) {
      toast(e instanceof R('engine/core').MErr ? e.message : 'No he podido aplicar Gauss a esta línea.', 'aviso');
    }
  }
  $('#calcBtn').addEventListener('click', runCalc);
  return { otherDefs, syncActive, derivRowIndex, runCalc, runGauss };
});
