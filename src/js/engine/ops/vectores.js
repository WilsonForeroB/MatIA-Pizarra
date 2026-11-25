/* Operaciones 2: vectores. (de pizarra.html, líneas 2550-2565, 2576-2634). */
MatIA.define('engine/ops/vectores', ['engine/core', 'engine/ops/common', 'engine/ops/poly'], (ME, $common, $poly) => {
  'use strict';
  const { MErr, fLatex } = ME;
  const { add, mul, ZERO, isZ, sub, neg, div } = ME.fr;
  const { lastSeg, splitTop, isOp, isCmd, derivBlock, fParen, sqrtLatex, sqrtSimp, fNum, fText } = $common;
  const { termL } = $poly;
  /* ====================== 2. Vectores ====================== */
  function vecsOf(latex, env, need) {
    const seg = lastSeg(latex);
    let parts = splitTop(seg, (t) => isOp(t, ','));
    if (parts.length < need) parts = splitTop(seg, (t) => isCmd(t, 'cdot') || isCmd(t, 'times') || isOp(t, '*'));
    if (parts.length < need) throw new MErr(need === 1 ? 'Escribe un vector en la línea.' : 'Escribe dos vectores separados por coma o por ·, por ejemplo u, v.');
    return parts.slice(0, need).map((p) => {
      // (1,2,3) escrito como tupla
      const inner = p.length > 2 && isOp(p[0], '(') && isOp(p[p.length - 1], ')') ? splitTop(p.slice(1, -1), (t) => isOp(t, ',')) : null;
      if (inner && inner.length > 1) return inner.map((q) => { const v = ME.evaluate(q, env); if (v.t !== 's') throw new MErr('Las coordenadas deben ser números.'); return v.v; });
      const v = ME.evaluate(p, env);
      if (v.t !== 'm' || (v.r !== 1 && v.c !== 1)) throw new MErr('Necesito vectores (una fila o una columna).');
      return v.r === 1 ? v.a[0] : v.a.map((r) => r[0]);
    });
  }
  const tup = (v) => '\\left(' + v.map(fLatex).join(',\\ ') + '\\right)';

  function dot(u, v) { if (u.length !== v.length) throw new MErr('Los vectores tienen distinta dimensión.'); return u.reduce((s, x, i) => add(s, mul(x, v[i])), ZERO); }
  function vecDot(latex, env) {
    const [u, v] = vecsOf(latex, env, 2);
    const d = dot(u, v);
    return [derivBlock([
      { l: 'u\\cdot v', r: u.map((x, i) => fParen(x) + '\\cdot ' + fParen(v[i])).join('+'), note: 'Multiplicamos coordenada a coordenada y sumamos' },
      { r: u.map((x, i) => fParen(mul(x, v[i]))).join('+'), note: 'Productos de cada coordenada' },
      { r: fLatex(d), boxed: true, note: isZ(d) ? 'Producto escalar 0: los vectores son perpendiculares' : 'Sumamos: el producto escalar es un número' },
    ])];
  }
  function vecCross(latex, env) {
    const [u, v] = vecsOf(latex, env, 2);
    if (u.length !== 3 || v.length !== 3) throw new MErr('El producto vectorial es para vectores de ℝ³.');
    const c1 = sub(mul(u[1], v[2]), mul(u[2], v[1])), c2 = sub(mul(u[0], v[2]), mul(u[2], v[0])), c3 = sub(mul(u[0], v[1]), mul(u[1], v[0]));
    const m2 = (a, b, c, d) => '\\begin{vmatrix}' + fLatex(a) + ' & ' + fLatex(b) + '\\\\ ' + fLatex(c) + ' & ' + fLatex(d) + '\\end{vmatrix}';
    return [derivBlock([
      { l: 'u\\times v', r: '\\begin{vmatrix}\\vec{i} & \\vec{j} & \\vec{k}\\\\ ' + u.map(fLatex).join(' & ') + '\\\\ ' + v.map(fLatex).join(' & ') + '\\end{vmatrix}', note: 'Determinante simbólico con i, j, k en la primera fila' },
      { r: m2(u[1], u[2], v[1], v[2]) + '\\vec{i}-' + m2(u[0], u[2], v[0], v[2]) + '\\vec{j}+' + m2(u[0], u[1], v[0], v[1]) + '\\vec{k}', note: 'Desarrollamos por la primera fila' },
      { r: termL(c1, '\\vec{i}', true) + termL(neg(c2), '\\vec{j}', isZ(c1)) + termL(c3, '\\vec{k}', isZ(c1) && isZ(c2)) || '0', note: 'Calculamos los tres determinantes 2×2' },
      { r: tup([c1, neg(c2), c3]), boxed: true, note: 'En coordenadas: es perpendicular a u y a v' },
    ])];
  }
  function vecNorm(latex, env) {
    const [u] = vecsOf(latex, env, 1);
    const s = dot(u, u);
    return [derivBlock([
      { l: '\\left\\lVert u\\right\\rVert', r: '\\sqrt{' + u.map((x) => fParen(x) + '^{2}').join('+') + '}', note: 'Raíz de la suma de los cuadrados' },
      { r: '\\sqrt{' + fLatex(s) + '}', note: 'Sumamos los cuadrados' },
      { r: sqrtLatex(s), boxed: true, note: sqrtSimp(s).m === 1n ? 'Raíz exacta' : 'Sacamos factores de la raíz; ≈ ' + Math.sqrt(fNum(s)).toFixed(4).replace('.', ',') },
    ].filter((r, i) => !(i === 2 && sqrtLatex(s) === '\\sqrt{' + fLatex(s) + '}'))) ];
  }
  function vecAngle(latex, env) {
    const [u, v] = vecsOf(latex, env, 2);
    const d = dot(u, v), nu = dot(u, u), nv = dot(v, v);
    if (isZ(nu) || isZ(nv)) throw new MErr('Un vector nulo no forma ángulo.');
    const prod = mul(nu, nv);
    const cosv = fNum(d) / Math.sqrt(fNum(prod));
    const deg = Math.acos(Math.max(-1, Math.min(1, cosv))) * 180 / Math.PI;
    const { k, m } = sqrtSimp(prod);
    const den = m === 1n ? fLatex(k) : sqrtLatex(prod);
    const exact = m === 1n ? fLatex(div(d, k)) : '\\frac{' + fLatex(d) + '}{' + den + '}';
    return [derivBlock([
      { l: '\\cos\\alpha', r: '\\frac{u\\cdot v}{\\left\\lVert u\\right\\rVert\\,\\left\\lVert v\\right\\rVert}', note: 'Fórmula del ángulo entre dos vectores' },
      { r: '\\frac{' + fLatex(d) + '}{\\sqrt{' + fLatex(nu) + '}\\cdot\\sqrt{' + fLatex(nv) + '}}', note: 'u·v = ' + fText(d) + ', ‖u‖² = ' + fText(nu) + ', ‖v‖² = ' + fText(nv) },
      { r: exact + '\\approx ' + cosv.toFixed(4).replace('.', '{,}'), note: 'Simplificamos y damos el valor decimal' },
      { l: '\\alpha', r: '\\arccos\\left(' + exact + '\\right)\\approx ' + deg.toFixed(2).replace('.', '{,}') + '^{\\circ}', boxed: true, note: Math.abs(cosv) < 1e-12 ? 'Coseno 0: los vectores son perpendiculares' : 'El ángulo cuyo coseno es ese valor (arccos con la calculadora)' },
    ])];
  }
  function vecProj(latex, env) {
    const [u, v] = vecsOf(latex, env, 2);
    const d = dot(u, v), nv = dot(v, v);
    if (isZ(nv)) throw new MErr('No se puede proyectar sobre el vector nulo.');
    const k = div(d, nv);
    return [derivBlock([
      { l: '\\operatorname{proy}_{v}u', r: '\\frac{u\\cdot v}{\\left\\lVert v\\right\\rVert^{2}}\\,v', note: 'Proyección ortogonal de u sobre v' },
      { r: '\\frac{' + fLatex(d) + '}{' + fLatex(nv) + '}' + tup(v), note: 'u·v = ' + fText(d) + ' y ‖v‖² = ' + fText(nv) },
      { r: tup(v.map((x) => mul(k, x))), boxed: true, note: 'Multiplicamos cada coordenada de v por ' + fText(k) },
    ])];
  }

  return { vecDot, vecCross, vecNorm, vecAngle, vecProj };
});
