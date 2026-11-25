/* Operaciones 3: ecuaciones. (de pizarra.html, líneas 2636-2783, 2793-2841). */
MatIA.define('engine/ops/ecuaciones', ['engine/core', 'engine/ops/expr', 'engine/ops/common', 'engine/ops/poly'], (ME, $expr, $common, $poly) => {
  'use strict';
  const { MErr, fLatex, F, tokenize } = ME;
  const { add, ZERO, isZ, gcd, mul, neg, sub, div } = ME.fr;
  const { terms, parseExpr, varsOf, termText, hasParenOrFrac, termsLatex, evalExact, evalNum } = $expr;
  const { fText, sqrtSimp, fParen, topEqIndex, derivBlock, latexText } = $common;
  const { P, rationalRoots } = $poly;
  /* ====================== 3. Ecuaciones ====================== */
  function sideTerms(latex, v) { return terms(parseExpr(latex, { var: v }), v); }
  function eqVar(l, r) {
    const vs = new Set([...varsOf(parseExpr(l || '0')), ...varsOf(parseExpr(r || '0'))]);
    for (const c of ['x', 'y', 'z', 't']) if (vs.has(c)) return c;
    if (vs.size === 1) return [...vs][0];
    if (!vs.size) throw new MErr('No hay incógnita en la ecuación.');
    throw new MErr('Hay varias letras (' + [...vs].join(', ') + '): de momento resuelvo ecuaciones con una incógnita.');
  }
  const combine = (ts) => { const m = new Map(); for (const t of ts) m.set(t.d, add(m.get(t.d) || ZERO, t.c)); return [...m.entries()].sort((a, b) => b[0] - a[0]).map(([d, c]) => ({ c, d })); };
  const maxDeg = (ts) => ts.reduce((s, t) => (isZ(t.c) ? s : Math.max(s, t.d)), 0);
  function moveNote(t, v, toRight) {
    const s = termText(t, v);
    return (t.c.n >= 0n ? 'El +' + s : 'El −' + s) + ' pasa ' + (t.c.n >= 0n ? 'restando' : 'sumando') + (toRight ? ' a la derecha' : ' a la izquierda');
  }
  // Un paso de una ecuación lineal; devuelve {l, r, note} o null si ya está resuelta
  function linearStep(l, r, v) {
    const L0 = sideTerms(l, v), R0 = sideTerms(r, v);
    const raw = hasParenOrFrac(l) || hasParenOrFrac(r);
    // forma ya despejada: x = número
    if (L0.length === 1 && L0[0].d === 1 && L0[0].c.n === 1n && L0[0].c.d === 1n && R0.every((t) => t.d === 0)) {
      const b = R0.reduce((s0, t) => add(s0, t.c), ZERO);
      if (r.replace(/\s/g, '') === fLatex(b)) return null;
      return { l: v, r: fLatex(b), note: R0.length > 1 ? 'Operamos' : 'Simplificamos' };
    }
    // 1) paréntesis o fracciones con la incógnita: desarrollar
    const den = [...L0, ...R0].reduce((s, t) => s / gcd(s, t.c.d) * t.c.d, 1n);
    if (den > 1n) {
      const k = F(den);
      return { l: termsLatex(L0.map((t) => ({ c: mul(t.c, k), d: t.d })), v), r: termsLatex(R0.map((t) => ({ c: mul(t.c, k), d: t.d })), v), note: 'Multiplicamos los dos lados por ' + den + ' (m.c.m. de los denominadores)' };
    }
    if (raw && (termsLatex(L0, v) !== l.replace(/\s/g, '') || termsLatex(R0, v) !== r.replace(/\s/g, ''))) {
      return { l: termsLatex(L0, v), r: termsLatex(R0, v), note: 'Quitamos paréntesis' };
    }
    const Lv = L0.filter((t) => t.d > 0 && !isZ(t.c)), Lc = L0.filter((t) => t.d === 0 && !isZ(t.c));
    const Rv = R0.filter((t) => t.d > 0 && !isZ(t.c)), Rc = R0.filter((t) => t.d === 0 && !isZ(t.c));
    // 2) transponer: incógnitas a la izquierda y números a la derecha
    if (Lc.length || Rv.length) {
      if (!Lv.length && !Rv.length) return null;
      const nl = Lv.concat(Rv.map((t) => ({ c: neg(t.c), d: t.d })));
      const nr = Rc.concat(Lc.map((t) => ({ c: neg(t.c), d: t.d })));
      const notes = Lc.map((t) => moveNote(t, v, true)).concat(Rv.map((t) => moveNote(t, v, false)));
      return { l: termsLatex(nl.length ? nl : [{ c: ZERO, d: 0 }], v), r: termsLatex(nr.length ? nr : [{ c: ZERO, d: 0 }], v), note: notes.map((t, i) => (i ? t.replace(/^El /, 'el ') : t)).join('; ') };
    }
    // 3) agrupar
    if (Lv.length > 1 || Rc.length > 1) {
      return { l: termsLatex(combine(Lv).filter((t) => !isZ(t.c)).length ? combine(Lv) : [{ c: ZERO, d: 0 }], v), r: termsLatex(combine(Rc).length ? combine(Rc) : [{ c: ZERO, d: 0 }], v), note: 'Agrupamos términos semejantes' };
    }
    const a = Lv.length ? Lv[0].c : ZERO, b = Rc.length ? Rc[0].c : ZERO;
    if (isZ(a)) return null;
    // 4) despejar el coeficiente
    if (!(a.n === 1n && a.d === 1n)) {
      if (a.n === -1n && a.d === 1n) return { l: v, r: fLatex(neg(b)), note: 'Cambiamos de signo los dos lados' };
      return { l: v, r: '\\frac{' + fLatex(b) + '}{' + fLatex(a) + '}', note: 'El ' + fText(a) + ' que multiplica a ' + v + ' pasa dividiendo' };
    }
    // 5) simplificar la fracción si hace falta
    const rr = r.replace(/\s/g, '');
    if (rr !== fLatex(b)) return { l: v, r: fLatex(b), note: 'Simplificamos' };
    return null;
  }
  function eqSteps(l, r) {
    const v = eqVar(l, r);
    const all = sideTerms(l, v).concat(sideTerms(r, v));
    const dg = maxDeg(all);
    if (dg >= 2) return quadSteps(l, r, v);
    const rows = [];
    let cl = l, cr = r, guard = 0;
    for (;;) {
      if (guard++ > 12) break;
      const st = linearStep(cl, cr, v);
      if (!st) break;
      rows.push(st);
      cl = st.l; cr = st.r;
    }
    // casos especiales: 0 = b
    const Lf = combine(sideTerms(cl, v)), Rf = combine(sideTerms(cr, v));
    const a = (Lf.find((t) => t.d === 1) || { c: ZERO }).c;
    if (isZ(a)) {
      const b = sub((Rf.find((t) => t.d === 0) || { c: ZERO }).c, (Lf.find((t) => t.d === 0) || { c: ZERO }).c);
      rows.push({ l: '0', r: fLatex(b), note: isZ(b) ? 'Se cumple siempre: infinitas soluciones' : 'Imposible: la ecuación no tiene solución' });
    } else if (rows.length) rows[rows.length - 1].boxed = true;
    return rows;
  }
  function quadRootsLatex(p, v, idx = true) {
    const [c, b, a] = [p[0] || ZERO, p[1] || ZERO, p[2]];
    const D = sub(mul(b, b), mul(F(4), mul(a, c)));
    const two = mul(F(2), a);
    if (D.n < 0n) return [v + '\\notin\\mathbb{R}\\ (\\Delta<0)'];
    const { k, m } = sqrtSimp(D);
    if (m === 1n) {
      const x1 = div(add(neg(b), k), two), x2 = div(sub(neg(b), k), two);
      return isZ(D) ? [v + '=' + fLatex(x1) + '\\ (\\text{doble})'] : [v + (idx ? '_{1}' : '') + '=' + fLatex(x1), v + (idx ? '_{2}' : '') + '=' + fLatex(x2)];
    }
    // -b/2a ± (k/2a)√m
    const p0 = div(neg(b), two), q0 = div(k, two);
    const qL = (q0.n === 1n && q0.d === 1n ? '' : q0.d === 1n ? fLatex(q0) : '\\frac{' + q0.n + '}{' + q0.d + '}') + '\\sqrt{' + m + '}';
    const base = isZ(p0) ? '' : fLatex(p0);
    return [v + (idx ? '_{1}' : '') + '=' + base + (base ? '+' : '') + qL, v + (idx ? '_{2}' : '') + '=' + base + '-' + qL];
  }
  function quadSteps(l, r, v) {
    const rows = [];
    const all = combine(sideTerms(l, v).concat(sideTerms(r, v).map((t) => ({ c: neg(t.c), d: t.d }))));
    const dg = maxDeg(all);
    const poly = []; all.forEach((t) => { poly[t.d] = t.c; });
    for (let i = 0; i <= dg; i++) if (!poly[i]) poly[i] = ZERO;
    const std = P.latex(poly, v);
    const nz = (t) => t.replace(/\s/g, '').replace(/\^\{(\w)\}/g, '^$1');
    if (!(nz(r) === '0' && nz(l) === nz(std))) rows.push({ l: std, r: '0', note: 'Pasamos todo al primer miembro y agrupamos' });
    if (dg > 2) {
      const { roots, rest } = rationalRoots(poly);
      if (!roots.length) throw new MErr('No encuentro raíces racionales; esta ecuación de grado ' + dg + ' no la sé resolver paso a paso.');
      const uniq = [...new Map(roots.map((x) => [fText(x), x])).values()];
      rows.push({ l: polyFactorLatex(poly, roots, rest, v), r: '0', note: 'Factorizamos con Ruffini (raíces racionales: ' + uniq.map(fText).join(', ') + ')' });
      const sols = uniq.map((x) => v + '=' + fLatex(x));
      if (P.deg(rest) === 2) sols.push(...quadRootsLatex(rest, v, false).filter((s) => !/notin/.test(s)));
      rows.push({ l: '', r: '', note: '' });
      rows.pop();
      rows.push({ l: v, r: sols.map((s) => s.replace(v + '=', '')).join(',\\ '), note: 'Cada factor igualado a 0', boxed: true });
      return rows;
    }
    const a = poly[2], b = poly[1], c = poly[0];
    rows.push({ l: '', r: '', note: '' }); rows.pop();
    const D = sub(mul(b, b), mul(F(4), mul(a, c)));
    rows.push({ l: '\\Delta', r: 'b^{2}-4ac=' + fParen(b) + '^{2}-4\\cdot ' + fParen(a) + '\\cdot ' + fParen(c) + '=' + fLatex(D), note: 'a = ' + fText(a) + ', b = ' + fText(b) + ', c = ' + fText(c) });
    if (D.n < 0n) { rows.push({ l: '\\Delta', r: fLatex(D) + '<0', note: 'Discriminante negativo: no hay soluciones reales', boxed: true }); return rows; }
    rows.push({ l: v, r: '\\frac{-b\\pm\\sqrt{\\Delta}}{2a}=\\frac{' + fLatex(neg(b)) + '\\pm\\sqrt{' + fLatex(D) + '}}{' + (a.n === 1n && a.d === 1n ? '2' : '2\\cdot ' + fParen(a)) + '}', note: isZ(D) ? 'Δ = 0: una solución doble' : 'Fórmula de la ecuación de segundo grado' });
    const sols = quadRootsLatex(poly, v);
    sols.forEach((s, i) => { const [ll, rr] = s.split('='); rows.push({ l: ll, r: rr, boxed: true, note: sols.length === 1 ? 'Solución doble' : (i === 0 ? 'Con el signo +' : 'Con el signo −') + (sqrtSimp(D).m !== 1n ? ' (simplificamos la raíz)' : '') }); });
    return rows;
  }
  function polyFactorLatex(poly, roots, rest, v) {
    const lead = poly[poly.length - 1];
    const cnt = new Map(); roots.forEach((r) => { const k = fText(r); cnt.set(k, { r, m: (cnt.get(k) || { m: 0 }).m + 1 }); });
    let s = '';
    for (const { r, m } of cnt.values()) s += (isZ(r) ? v : '\\left(' + v + (r.n < 0n ? '+' + fLatex(neg(r)) : '-' + fLatex(r)) + '\\right)') + (m > 1 ? '^{' + m + '}' : '');
    let k = lead;
    if (P.deg(rest) >= 1) { k = div(lead, rest[rest.length - 1]); s += '\\left(' + P.latex(rest, v) + '\\right)'; }
    const kl = fLatex(k);
    return (kl === '1' ? '' : kl === '-1' ? '-' : kl) + s;
  }
  // Ecuación a partir de una línea "l = r"
  function splitEquation(latex) {
    const segs = ME.splitEq(tokenize(latex));
    if (segs.length !== 2) throw new MErr('Escribe una ecuación con un solo signo =, por ejemplo 2x+1=5.');
    // reconstruir el texto de cada lado a partir del LaTeX original
    const i = topEqIndex(latex);
    return [latex.slice(0, i), latex.slice(i + 1)];
  }

  function solveEquation(latex) {
    const [l, r] = splitEquation(latex);
    const rows = eqSteps(l, r);
    return [derivBlock([{ l, r, note: 'Ecuación' }].concat(rows))];
  }
  // Siguiente paso dentro de un desarrollo: rows existentes → nueva fila o null
  function nextStep(rows) {
    const first = rows[0];
    if (!first || !first.l.trim() || !first.r.trim()) throw new MErr('La primera fila del desarrollo debe ser una ecuación (lado izquierdo = lado derecho).');
    const all = eqSteps(first.l, first.r);
    const k = rows.length - 1;
    const norm = (s) => (s || '').replace(/\s/g, '');
    const matches = rows.slice(1).every((row, i) => all[i] && norm(all[i].l) === norm(row.l || first.l) && norm(all[i].r) === norm(row.r));
    if (matches) return all[k] || null;
    const last = rows[rows.length - 1];
    const v = eqVar(last.l || first.l, last.r);
    return linearStep(last.l || first.l, last.r, v);
  }
  function checkSolution(rows) {
    const first = rows[0];
    if (!first || !first.l || !first.r) throw new MErr('La primera fila debe ser la ecuación.');
    const v = eqVar(first.l, first.r);
    const sols = [];
    // solo la solución final: las últimas filas del tipo x = valor (x₁, x₂ en 2.º grado)
    const isSolRow = (row) => (row.l || '').replace(/\s/g, '').replace(/_\{?\d\}?$/, '') === v && !/Comprobamos/.test(row.note || '');
    const body = rows.slice(1).filter((row) => !/Comprobamos/.test(row.note || ''));
    let k = body.length - 1;
    while (k >= 0 && !isSolRow(body[k])) k--;
    const indexed = (row) => /_\{?\d\}?\s*$/.test((row.l || '').trim());
    const multi = k >= 0 && indexed(body[k]);
    for (let first2 = true; k >= 0 && isSolRow(body[k]) && (first2 || (multi && indexed(body[k]))); k--, first2 = false) {
      for (const part of body[k].r.split(/,\\ |,/)) {
        try { const ast = parseExpr(part); if (varsOf(ast).size === 0) sols.unshift({ latex: part, ast }); } catch (e) { /* no es un valor */ }
      }
    }
    if (!sols.length) throw new MErr('No encuentro la solución: necesito una fila del tipo ' + v + ' = número.');
    const uniq = sols.filter((s, i) => sols.findIndex((t) => t.latex === s.latex) === i);
    const Lst = parseExpr(first.l, { var: v }), Rst = parseExpr(first.r, { var: v });
    const out = [];
    for (const s of uniq) {
      const subst = (lat) => lat.replace(new RegExp('(?<![a-zA-Z\\\\])' + v.replace('\\', '\\\\') + '(?![a-zA-Z])', 'g'), '\\left(' + s.latex + '\\right)');
      let lv, rv, ok, txt;
      try { lv = evalExact(Lst, { [v]: evalExact(s.ast, {}) }); rv = evalExact(Rst, { [v]: evalExact(s.ast, {}) }); ok = lv.n === rv.n && lv.d === rv.d; txt = fText(lv) + (ok ? ' = ' : ' ≠ ') + fText(rv); }
      catch (e) { const x = evalNum(s.ast, {}); const a = evalNum(Lst, { [v]: x }), b = evalNum(Rst, { [v]: x }); ok = Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a)); txt = a.toFixed(4) + (ok ? ' ≈ ' : ' ≠ ') + b.toFixed(4); }
      out.push({ l: subst(first.l), r: subst(first.r), note: 'Comprobamos ' + v + ' = ' + latexText(s.latex) + ': ' + txt + (ok ? ' ✓ se cumple' : ' ✗ no se cumple') });
    }
    return out;
  }


  return { quadRootsLatex, polyFactorLatex, splitEquation, solveEquation, nextStep, checkSolution, eqSteps };
});
