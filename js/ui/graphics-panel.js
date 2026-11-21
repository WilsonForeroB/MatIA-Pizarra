/* Panel «Gráficos» de la barra (pizarra.html 6944-6982). */
MatIA.define('ui/graphics-panel', ['core/dom', 'model/schema', 'ui/toast'], (dom, schema, toast) => {
  'use strict';
  const R = (n) => MatIA.require(n);
  const { $ } = dom;
  const syncActive = (...a) => R('ui/calc').syncActive(...a);
  const derivRowIndex = (...a) => R('ui/calc').derivRowIndex(...a);
  const closePop = (...a) => R('ui/popovers').closePop(...a);
  const insertSpecs = (...a) => R('ui/ops-menu').insertSpecs(...a);
  const openNN = (...a) => R('ui/nn-dialog').openNN(...a);
  const nnBuild = (...a) => R('blocks/net').nnBuild(...a);
  const vennExprFrom = (...a) => R('blocks/venn').vennExprFrom(...a);
  const compile3d = (...a) => R('blocks/graph3d').compile3d(...a);

  /* ---------------- Panel «Gráficos» ---------------- */
  $('#grafPop').addEventListener('mousedown', (e) => { if (e.target.closest('[data-graf]')) e.preventDefault(); });
  $('#grafPop').addEventListener('click', async (e) => {
    const bt = e.target.closest('[data-graf]');
    if (!bt) return;
    closePop();
    const b = syncActive();
    const src = b && b.type === 'math' ? b.v.trim() : b && b.type === 'deriv' ? (() => { const r = b.rows[derivRowIndex(b)]; return r.l && r.r ? r.l + '=' + r.r : r.r; })() : '';
    const after = b ? b.id : null;
    const k = bt.dataset.graf;
    if (k === '2d') {
      let fns = ['f(x)=x^2'];
      if (src) { try { R('engine/ops').compileFn(src); fns = [src]; } catch (err) { /* la línea no es una función */ } }
      insertSpecs(after, [{ type: 'graph', fns, xmin: -5, xmax: 5 }], b);
      if (fns[0] === 'f(x)=x^2' && src !== 'f(x)=x^2') toast('Escribe o añade tus funciones en la lista de la gráfica.');
    } else if (k === '3d') {
      let fn = 'z=\\sin(x)\\cos(y)';
      if (src) { try { compile3d(src); if (/y/.test(src)) fn = src; } catch (err) { /* no es f(x, y) */ } }
      insertSpecs(after, [{ type: 'graph3d', fn, xmin: -3, xmax: 3, ymin: -3, ymax: 3, az: -0.8, el: 0.55, zoom: 1 }], b);
      if (fn !== src) toast('Escribe tu superficie en el campo «z = f(x, y)» de la gráfica.');
    } else if (k === 'solid') {
      let fn = 'f(x)=\\sqrt{x}';
      if (src) { try { R('engine/ops').compileFn(src); fn = src; } catch (err) { /* la línea no es una función de x */ } }
      insertSpecs(after, [{ type: 'solid', fn, a: 0, b: 4, axis: 'x', k: 0, az: -0.8, el: 0.5, zoom: 1 }], b);
      if (fn !== src) toast('Escribe tu función y elige el eje de giro en los controles del sólido.');
    } else if (k === 'net') {
      const W = 720;
      const nodes = [['A', 160, 120], ['B', 360, 80], ['C', 560, 140], ['D', 260, 300], ['E', 470, 310]].map(([label, x, y]) => ({ id: schema.uid(), x, y, label, kind: '' }));
      const E = [[0, 1], [1, 2], [0, 3], [3, 4], [1, 4]].map(([a, c]) => ({ a: nodes[a].id, b: nodes[c].id, w: null }));
      void W;
      insertSpecs(after, [{ type: 'net', nodes, edges: E, caps: [], directed: false, h: 420 }], b);
      toast('Grafo de ejemplo: añade nodos con un clic y aristas con la herramienta «Arista». Doble clic para renombrar.');
    } else if (k === 'venn') {
      let expr = 'A\\cap B', n = 2;
      if (src) { try { const ex = vennExprFrom(src); const r0 = R('engine/ops').vennEval(ex, R('blocks/venn').VENN_NAMES); expr = ex; n = r0.n; } catch (err) { /* la línea no es una expresión de conjuntos */ } }
      insertSpecs(after, [{ type: 'venn', n, expr, shade: [], showEls: true }], b);
      if (expr === 'A\\cap B' && !/\\cap|∩/.test(src)) toast('Escribe la expresión en el campo del diagrama o haz clic en las zonas para sombrearlas.');
    } else if (k === 'nn') {
      const r = await openNN();
      if (!r) return;
      insertSpecs(after, [Object.assign({ type: 'net' }, nnBuild(r.sizes, r.bias, r.showW))], b);
    }
  });
  return {  };
});
