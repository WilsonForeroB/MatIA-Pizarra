/* Operaciones 1: matrices (inversa, determinantes, Cramer, discusión paramétrica, autovalores). (de pizarra.html, líneas 2255-2548). */
MatIA.define('engine/ops/matrices', ['engine/core', 'engine/ops/common', 'engine/ops/poly', 'engine/ops/expr', 'engine/ops/ecuaciones'], (ME, $common, $poly, $expr, $ecuaciones) => {
  'use strict';
  const { fLatex, F, MErr, tokenize } = ME;
  const { ONE, ZERO, mul, sub, add, isZ, div, abs, neg, isInt, gcd } = ME.fr;
  const { squareOf, matrixOf, math, pm, vm, derivBlock, prodTxt, fParen, fText, lastSeg, splitTop, isCmd, isOp, coefI } = $common;
  const { termL, P, rationalRoots } = $poly;
  const { parseExpr, varsOf } = $expr;
  const { quadRootsLatex } = $ecuaciones;
  /* ====================== 1. Matrices ====================== */
  function inverseSteps(latex, env) {
    const m = squareOf(matrixOf(latex, env), 'La inversa');
    const n = m.r;
    const I = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? ONE : ZERO)));
    const aug = m.a.map((r, i) => r.concat(I[i]));
    const g = ME.gauss(aug, { jordan: true, aug: n });
    const out = [math('(A\\,|\\,I)=' + ME.matLatex(aug, n))];
    for (const s of g.steps) out.push(math(arrow(s.ops) + ME.matLatex(s.a, n)));
    if (g.rank < n) { out.push(math('\\operatorname{rg}(A)=' + g.rank + '<' + n + '\\Rightarrow\\text{ A no tiene inversa}')); return out; }
    out.push(math('A^{-1}=' + pm(g.a.map((r) => r.slice(n)))));
    return out;
  }
  const arrow = (ops) => (ops.length <= 1 ? '\\xrightarrow{' + ops.join('') + '}' : '\\xrightarrow[' + ops.slice(Math.ceil(ops.length / 2)).join(',\\ ') + ']{' + ops.slice(0, Math.ceil(ops.length / 2)).join(',\\ ') + '}');

  function detValue(a) { return ME.det(ME.M(a)).v; }
  function detSarrus(latex, env) {
    const m = squareOf(matrixOf(latex, env), 'El determinante');
    const a = m.a;
    if (m.r === 1) return [math(vm(a) + '=' + fLatex(a[0][0]))];
    if (m.r === 2) {
      const p1 = mul(a[0][0], a[1][1]), p2 = mul(a[0][1], a[1][0]);
      return [derivBlock([
        { l: vm(a), r: prodTxt([a[0][0], a[1][1]]) + '-' + prodTxt([a[0][1], a[1][0]]), note: 'Diagonal principal menos diagonal secundaria' },
        { r: fParen(p1) + '-' + fParen(p2) },
        { r: fLatex(sub(p1, p2)), boxed: true },
      ])];
    }
    if (m.r !== 3) return detCofactor(latex, env);
    const pos = [[0, 0, 1, 1, 2, 2], [0, 1, 1, 2, 2, 0], [0, 2, 1, 0, 2, 1]];
    const negs = [[0, 2, 1, 1, 2, 0], [0, 0, 1, 2, 2, 1], [0, 1, 1, 0, 2, 2]];
    const pr = (q) => [a[q[0]][q[1]], a[q[2]][q[3]], a[q[4]][q[5]]];
    const val = (q) => pr(q).reduce((s, x) => mul(s, x), ONE);
    const P1 = pos.map(val), N1 = negs.map(val);
    const sp = P1.reduce(add, ZERO), sn = N1.reduce(add, ZERO);
    return [derivBlock([
      { l: vm(a), r: pos.map((q) => prodTxt(pr(q))).join('+') + '-\\left(' + negs.map((q) => prodTxt(pr(q))).join('+') + '\\right)', note: 'Regla de Sarrus: diagonales hacia la derecha menos diagonales hacia la izquierda' },
      { r: '\\left(' + P1.map(fParen).join('+') + '\\right)-\\left(' + N1.map(fParen).join('+') + '\\right)', note: 'Multiplicamos' },
      { r: fParen(sp) + '-' + fParen(sn), note: 'Sumamos cada paréntesis' },
      { r: fLatex(sub(sp, sn)), boxed: true },
    ])];
  }
  function minor(a, i, j) { return a.filter((_, r) => r !== i).map((row) => row.filter((_, c) => c !== j)); }
  function detCofactor(latex, env) {
    const m = squareOf(matrixOf(latex, env), 'El determinante');
    const a = m.a, n = m.r;
    if (n <= 2) return detSarrus(latex, env);
    // fila o columna con más ceros
    let best = { row: true, k: 0, z: -1 };
    for (let i = 0; i < n; i++) { const z = a[i].filter(isZ).length; if (z > best.z) best = { row: true, k: i, z }; }
    for (let j = 0; j < n; j++) { const z = a.filter((r) => isZ(r[j])).length; if (z > best.z) best = { row: false, k: j, z }; }
    const items = [];
    for (let t = 0; t < n; t++) {
      const i = best.row ? best.k : t, j = best.row ? t : best.k;
      const v = a[i][j];
      if (isZ(v)) continue;
      const sg = (i + j) % 2 === 0 ? ONE : F(-1);
      items.push({ c: mul(sg, v), M: minor(a, i, j), i, j });
    }
    const where = (best.row ? 'la fila ' : 'la columna ') + (best.k + 1);
    if (!items.length) return [derivBlock([{ l: vm(a), r: '0', note: 'Desarrollando por ' + where + ': todos sus elementos son 0', boxed: true }])];
    const r1 = items.map((it, k) => termL(it.c, '\\cdot ' + vm(it.M), k === 0).replace(/^(-?)\\cdot /, '$1')).join('');
    const vals = items.map((it) => detValue(it.M));
    const r2 = items.map((it, k) => termL(it.c, '\\cdot ' + fParen(vals[k]), k === 0).replace(/^(-?)\\cdot /, '$1')).join('');
    const total = items.reduce((s, it, k) => add(s, mul(it.c, vals[k])), ZERO);
    return [derivBlock([
      { l: vm(a), r: r1, note: 'Desarrollamos por ' + where + ' (la que tiene más ceros); signo (−1)^(i+j)' },
      { r: r2, note: 'Calculamos cada menor' },
      { r: fLatex(total), boxed: true },
    ])];
  }
  function detGauss(latex, env) {
    const m = squareOf(matrixOf(latex, env), 'El determinante');
    const a = m.a.map((r) => r.slice()), n = m.r;
    const rows = [{ l: vm(a), r: '', note: 'Triangulamos con F_i − k·F_j (no cambia el determinante); cada intercambio cambia el signo' }];
    let sign = 1;
    const Fn = (i) => 'F_{' + (i + 1) + '}';
    for (let c = 0; c < n; c++) {
      let p = c;
      while (p < n && isZ(a[p][c])) p++;
      if (p === n) { rows.push({ r: '0', note: 'Columna ' + (c + 1) + ' sin pivote: el determinante es 0', boxed: true }); rows[0].r = rows[1] ? '' : ''; return [derivBlock(fixFirst(rows))]; }
      if (p !== c) { [a[p], a[c]] = [a[c], a[p]]; sign = -sign; rows.push({ r: '-' + vm(a), note: Fn(c).replace(/[{}_]/g, '') + '↔' + Fn(p).replace(/[{}_]/g, '') + ': cambia el signo' }); }
      const ops = [];
      for (let i = c + 1; i < n; i++) {
        if (isZ(a[i][c])) continue;
        const k = div(a[i][c], a[c][c]);
        a[i] = a[i].map((x, j) => sub(x, mul(k, a[c][j])));
        ops.push('F' + (i + 1) + (k.n < 0n ? ' + ' : ' − ') + (k.n === k.d || -k.n === k.d ? '' : fText(F(abs(k.n), k.d))) + 'F' + (c + 1));
      }
      if (ops.length) rows.push({ r: (sign < 0 ? '-' : '') + vm(a), note: ops.join(', ') });
    }
    const diag = a.map((r, i) => r[i]);
    const prod = diag.reduce(mul, ONE);
    rows.push({ r: (sign < 0 ? '-' : '') + diag.map(fParen).join('\\cdot '), note: 'Matriz triangular: producto de la diagonal' });
    rows.push({ r: fLatex(sign < 0 ? neg(prod) : prod), boxed: true });
    return [derivBlock(fixFirst(rows))];
  }
  // En los desarrollos la primera fila lleva lado izquierdo y derecho
  function fixFirst(rows) {
    if (rows.length > 1 && !rows[0].r) { rows[1].l = rows[0].l; rows[1].note = rows[0].note + (rows[1].note ? '. ' + rows[1].note : ''); rows.shift(); }
    return rows;
  }
  function cramer(latex) {
    const s = ME.parseSystem(latex);
    const n = s.vars.length;
    if (s.a.length !== n) throw new MErr('Cramer necesita tantas ecuaciones como incógnitas (' + s.a.length + ' y ' + n + ').');
    const A = s.a.map((r) => r.slice(0, n)), b = s.a.map((r) => r[n]);
    const D = detValue(A);
    const rows = [{ l: '\\Delta', r: vm(A) + '=' + fLatex(D), note: 'Determinante de la matriz de coeficientes' }];
    if (isZ(D)) { rows.push({ l: '\\Delta', r: '0', note: 'Δ = 0: no se puede aplicar Cramer; usa Gauss para discutirlo', boxed: true }); return [derivBlock(rows)]; }
    const sols = [];
    s.vars.forEach((v, j) => {
      const Aj = A.map((r, i) => r.map((x, k) => (k === j ? b[i] : x)));
      const Dj = detValue(Aj);
      rows.push({ l: '\\Delta_{' + v + '}', r: vm(Aj) + '=' + fLatex(Dj), note: 'Cambiamos la columna de ' + v.replace(/[\\{}_]/g, '') + ' por los términos independientes' });
      sols.push({ v, Dj, val: div(Dj, D) });
    });
    for (const x of sols) rows.push({ l: x.v, r: '\\frac{\\Delta_{' + x.v + '}}{\\Delta}=\\frac{' + fLatex(x.Dj) + '}{' + fLatex(D) + '}=' + fLatex(x.val), boxed: true });
    return [derivBlock(rows)];
  }
  function productDeveloped(latex, env) {
    const seg = lastSeg(latex);
    const ops = splitTop(seg, (t) => isCmd(t, 'cdot') || isCmd(t, 'times') || isOp(t, '*'));
    if (ops.length !== 2) throw new MErr('Escribe el producto de dos matrices, por ejemplo A\\cdot B.');
    const X = ME.evaluate(ops[0], env), Y = ME.evaluate(ops[1], env);
    if (X.t !== 'm' || Y.t !== 'm') throw new MErr('Los dos factores deben ser matrices.');
    if (X.c !== Y.r) throw new MErr('No se pueden multiplicar ' + X.r + '×' + X.c + ' · ' + Y.r + '×' + Y.c + '.');
    const cells = [], vals = [];
    for (let i = 0; i < X.r; i++) {
      cells.push([]); vals.push([]);
      for (let j = 0; j < Y.c; j++) {
        let s = ZERO; const parts = [];
        for (let k = 0; k < X.c; k++) { parts.push(fParen(X.a[i][k]) + '\\cdot ' + fParen(Y.a[k][j])); s = add(s, mul(X.a[i][k], Y.a[k][j])); }
        cells[i].push(parts.join('+'));
        vals[i].push(s);
      }
    }
    const lhs = latex.replace(/=\s*$/, '');
    return [derivBlock([
      { l: lhs, r: '\\begin{pmatrix}' + cells.map((r) => r.join(' & ')).join('\\\\ ') + '\\end{pmatrix}', note: 'Cada elemento c_ij = fila i de la primera · columna j de la segunda' },
      { r: pm(vals), boxed: true },
    ])];
  }

  /* --- Matrices con un parámetro (polinomios) --- */
  function detPoly(M) {
    const n = M.length;
    if (n === 1) return M[0][0];
    if (n === 2) return P.sub(P.mul(M[0][0], M[1][1]), P.mul(M[0][1], M[1][0]));
    let r = [ZERO];
    for (let j = 0; j < n; j++) {
      if (P.isZero(M[0][j])) continue;
      const sub_ = M.slice(1).map((row) => row.filter((_, c) => c !== j));
      const t = P.mul(M[0][j], detPoly(sub_));
      r = j % 2 === 0 ? P.add(r, t) : P.sub(r, t);
    }
    return r;
  }
  const VARS = new Set(['x', 'y', 'z', 't', 'w', 'u', 'v']);
  function isUnknown(n) { return VARS.has(n) || /^x_\{\d+\}$/.test(n); }
  // términos {c: polinomio en el parámetro, v: incógnita | null}
  function pterms(a, prm) {
    const T = (c, v) => [{ c, v }];
    switch (a.t) {
      case 'num': return T([a.v], null);
      case 'var': return a.n === prm ? T(P.x(1), null) : T([ONE], a.n);
      case 'add': return pterms(a.a, prm).concat(pterms(a.b, prm));
      case 'sub': return pterms(a.a, prm).concat(pterms(a.b, prm).map((t) => ({ c: P.scale(t.c, F(-1)), v: t.v })));
      case 'neg': return pterms(a.a, prm).map((t) => ({ c: P.scale(t.c, F(-1)), v: t.v }));
      case 'mul': {
        const r = [];
        for (const x of pterms(a.a, prm)) for (const y of pterms(a.b, prm)) {
          if (x.v && y.v) throw new MErr('El sistema no es lineal.');
          r.push({ c: P.mul(x.c, y.c), v: x.v || y.v });
        }
        return r;
      }
      case 'div': { const d = pterms(a.b, prm); if (d.length !== 1 || d[0].v || P.deg(d[0].c) > 0) throw new MErr('Solo admito denominadores numéricos.'); return pterms(a.a, prm).map((t) => ({ c: P.scale(t.c, div(ONE, d[0].c[0])), v: t.v })); }
      case 'pow': {
        const e = a.b.t === 'num' && isInt(a.b.v) ? Number(a.b.v.n) : -1;
        if (e < 0) throw new MErr('Exponente no válido.');
        let r = [{ c: [ONE], v: null }];
        for (let i = 0; i < e; i++) { const nr = []; for (const x of r) for (const y of pterms(a.a, prm)) { if (x.v && y.v) throw new MErr('El sistema no es lineal.'); nr.push({ c: P.mul(x.c, y.c), v: x.v || y.v }); } r = nr; }
        return r;
      }
      default: throw new MErr('No sé tratar esa expresión en un sistema con parámetro.');
    }
  }
  function systemRows(latex) {
    const toks = tokenize(latex);
    const i = toks.findIndex((t) => isCmd(t, 'begin'));
    let body = toks;
    if (i >= 0) {
      let j = i + 1; while (j < toks.length && toks[j].k !== '}') j++;
      let d = 0, e = j + 1;
      for (; e < toks.length; e++) { if (isCmd(toks[e], 'begin')) d++; if (isCmd(toks[e], 'end')) { if (d === 0) break; d--; } }
      body = toks.slice(j + 1, e);
    }
    return splitTop(body.filter((t) => t.k !== 'amp'), (t) => t.k === 'row');
  }
  function paramDiscussion(latex) {
    const rows = systemRows(latex);
    const all = [];
    const eqs = rows.map((r) => {
      const s = ME.splitEq(r);
      if (s.length !== 2) throw new MErr('Cada ecuación debe tener un signo =.');
      return [parseExpr(s[0]), parseExpr(s[1])];
    });
    eqs.forEach(([l, r]) => { varsOf(l).forEach((v) => all.push(v)); varsOf(r).forEach((v) => all.push(v)); });
    const params = [...new Set(all.filter((v) => !isUnknown(v)))];
    if (params.length !== 1) throw new MErr(params.length ? 'Solo sé discutir sistemas con un parámetro (hay ' + params.join(', ') + ').' : 'No encuentro el parámetro: usa una letra como a, k o m.');
    const prm = params[0];
    const unk = [...new Set(all.filter(isUnknown))].sort((p, q) => 'xyzwtuv'.indexOf(p) - 'xyzwtuv'.indexOf(q) || p.localeCompare(q));
    const A = [], b = [];
    for (const [l, r] of eqs) {
      const ts = pterms(l, prm).concat(pterms(r, prm).map((t) => ({ c: P.scale(t.c, F(-1)), v: t.v })));
      A.push(unk.map((v) => ts.filter((t) => t.v === v).reduce((s, t) => P.add(s, t.c), [ZERO])));
      b.push(P.scale(ts.filter((t) => !t.v).reduce((s, t) => P.add(s, t.c), [ZERO]), F(-1)));
    }
    const n = unk.length, m = A.length;
    const cell = (p) => P.latex(p, prm);
    const augL = '\\left(\\begin{matrix}' + A.map((r) => r.map(cell).join(' & ')).join('\\\\ ') + '\\end{matrix}\\,\\middle|\\,\\begin{matrix}' + b.map(cell).join('\\\\ ') + '\\end{matrix}\\right)';
    const out = [math('(A\\,|\\,b)=' + augL)];
    if (m !== n) throw new MErr('Por ahora discuto sistemas cuadrados (tantas ecuaciones como incógnitas).');
    const D = detPoly(A);
    const { roots, rest } = rationalRoots(D);
    const uniq = []; roots.forEach((r) => { if (!uniq.some((u) => u.n === r.n && u.d === r.d)) uniq.push(r); });
    out.push(math('|A|=' + '\\begin{vmatrix}' + A.map((r) => r.map(cell).join(' & ')).join('\\\\ ') + '\\end{vmatrix}=' + P.latex(D, prm)));
    if (P.isZero(D)) out.push(math('|A|=0\\ \\text{para todo }' + prm + '\\Rightarrow\\operatorname{rg}(A)<' + n));
    else if (uniq.length) out.push(math('|A|=0\\Leftrightarrow ' + uniq.map((r) => prm + '=' + fLatex(r)).join(',\\ ') + (P.deg(rest) >= 1 ? '\\ \\text{(y raíces no racionales de }' + P.latex(rest, prm) + '=0)' : '')));
    else out.push(math('|A|\\neq 0\\ \\text{para todo }' + prm + (P.deg(rest) >= 1 ? '\\ \\text{racional}' : '')));
    const conds = uniq.map((r) => prm + '\\neq ' + fLatex(r)).join(',\\ ');
    if (!P.isZero(D)) out.push(math((conds ? conds : '\\forall ' + prm) + ':\\ \\operatorname{rg}(A)=\\operatorname{rg}(A|b)=' + n + '\\Rightarrow\\text{Compatible determinado}'));
    const cases = P.isZero(D) ? [] : uniq;
    for (const r of cases) {
      const Ar = A.map((row, i) => row.map((p) => P.eval(p, r)).concat([P.eval(b[i], r)]));
      const sol = ME.solve(Ar, unk);
      const kind = sol.kind === 'SI' ? 'Incompatible' : sol.kind === 'SCI' ? 'Compatible indeterminado' : 'Compatible determinado';
      out.push(math(prm + '=' + fLatex(r) + ':\\ ' + ME.matLatex(Ar, n) + '\\ \\operatorname{rg}(A)=' + sol.rA + ',\\ \\operatorname{rg}(A|b)=' + sol.rAb + '\\Rightarrow\\text{' + kind + '}'));
    }
    return out;
  }
  /* --- Autovalores y autovectores --- */
  function eigen(latex, env) {
    const m = squareOf(matrixOf(latex, env), 'Los autovalores');
    const n = m.r;
    const M = m.a.map((r, i) => r.map((x, j) => (i === j ? [x, F(-1)] : [x])));
    const cp = detPoly(M);
    const cell = (p) => P.latex(p, '\\lambda');
    const out = [math('|A-\\lambda I|=\\begin{vmatrix}' + M.map((r) => r.map(cell).join(' & ')).join('\\\\ ') + '\\end{vmatrix}=' + P.latex(cp, '\\lambda'))];
    const { roots, rest } = rationalRoots(cp);
    const mult = new Map();
    roots.forEach((r) => { const k = fText(r); mult.set(k, { r, m: (mult.get(k) || { m: 0 }).m + 1 }); });
    const factors = [...mult.values()].map(({ r, m: k }) => (isZ(r) ? '\\lambda' : '\\left(\\lambda' + (r.n < 0n ? '+' + fLatex(neg(r)) : '-' + fLatex(r)) + '\\right)') + (k > 1 ? '^{' + k + '}' : ''));
    const lead = cp[cp.length - 1];
    let restL = '';
    if (P.deg(rest) >= 1) restL = '\\left(' + P.latex(rest, '\\lambda') + '\\right)';
    const leadL = P.deg(rest) >= 1 ? '1' : fLatex(rest[0]); void lead;
    if (mult.size) out.push(math('|A-\\lambda I|=' + (leadL === '1' ? '' : leadL === '-1' ? '-' : leadL) + factors.join('') + restL + '=0'));
    const lam = [...mult.values()];
    let irr = [];
    if (P.deg(rest) === 2) irr = quadRootsLatex(rest, '\\lambda');
    out.push(math('\\text{Autovalores: }' + lam.map(({ r, m: k }) => '\\lambda=' + fLatex(r) + (k > 1 ? '\\ (\\text{doble})'.replace('doble', k === 2 ? 'doble' : 'multiplicidad ' + k) : '')).concat(irr).join(',\\quad ') || '\\text{no hay autovalores racionales}'));
    if (P.deg(rest) > 2) out.push(math('\\text{Quedan raíces no racionales de }' + P.latex(rest, '\\lambda') + '=0'));
    let dimSum = 0;
    const vecs = [];
    for (const { r, m: k } of lam) {
      const B = m.a.map((row, i) => row.map((x, j) => (i === j ? sub(x, r) : x)));
      const { a: R, piv } = ME.rref(B);
      const free = [...Array(n).keys()].filter((j) => !piv.includes(j));
      const basis = free.map((f) => {
        const v = Array(n).fill(ZERO); v[f] = ONE;
        piv.forEach((pc, ri) => { v[pc] = neg(R[ri][f]); });
        let L = 1n; v.forEach((c) => { L = L / gcd(L, c.d) * c.d; });
        return v.map((c) => mul(c, F(L)));
      });
      dimSum += basis.length;
      vecs.push(...basis);
      out.push(math('\\lambda=' + fLatex(r) + ':\\ (A' + (isZ(r) ? '' : (r.n < 0n ? '+' + coefI(neg(r)) : '-' + coefI(r)) + 'I') + ')\\,v=0\\Rightarrow V_{' + fLatex(r) + '}=\\left\\langle ' + basis.map((v) => '(' + v.map(fLatex).join(',') + ')').join(',\\ ') + '\\right\\rangle ,\\ \\dim=' + basis.length + (basis.length < k ? '<' + k : '')));
    }
    if (!irr.length && P.deg(rest) < 1) {
      if (dimSum === n) {
        const Pm = Array.from({ length: n }, (_, i) => vecs.map((v) => v[i]));
        const Dg = lam.flatMap(({ r }) => Array(vecsFor(r)).fill(r));
        function vecsFor(r) { return out.length ? 0 : 0; }
        const diag = [];
        for (const { r } of lam) { const B = m.a.map((row, i) => row.map((x, j) => (i === j ? sub(x, r) : x))); const k = n - ME.rref(B).piv.length; for (let t = 0; t < k; t++) diag.push(r); }
        void Dg;
        out.push(math('\\text{Diagonalizable: }P=' + pm(Pm) + ',\\ D=' + pm(diag.map((d, i) => diag.map((_, j) => (i === j ? d : ZERO)))) + ',\\ A=PDP^{-1}'));
      } else out.push(math('\\text{No es diagonalizable: la suma de dimensiones es }' + dimSum + '<' + n));
    }
    return out;
  }


  return { inverseSteps, detSarrus, detCofactor, detGauss, cramer, productDeveloped, paramDiscussion, eigen };
});
