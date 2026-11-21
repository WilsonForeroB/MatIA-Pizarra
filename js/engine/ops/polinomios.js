/* Operaciones 5: polinomios (operar, dividir, Ruffini, raíces). (de pizarra.html, líneas 2961-3057). */
MatIA.define('engine/ops/polinomios', ['engine/core', 'engine/ops/expr', 'engine/ops/common', 'engine/ops/poly', 'engine/ops/ecuaciones'], (ME, $expr, $common, $poly, $ecuaciones) => {
  'use strict';
  const { tokenize, MErr, fLatex } = ME;
  const { neg, div, ZERO, mul, add, isZ } = ME.fr;
  const { toPoly, parseExpr, varsOf } = $expr;
  const { topEqIndex, derivBlock, splitTop, isOp, isCmd, fText, math } = $common;
  const { P, rationalRoots } = $poly;
  const { polyFactorLatex, quadRootsLatex } = $ecuaciones;
  /* ====================== 5. Polinomios ====================== */
  function polyOf(latex, v) { return toPoly(parseExpr(latex, { var: v }), v); }
  function polyVar(latex) { const vs = varsOf(parseExpr(latex)); for (const c of ['x', 't', 'y', 'z']) if (vs.has(c)) return c; return [...vs][0] || 'x'; }
  function polyOperate(latex) {
    const seg = latex.replace(/=\s*$/, '');
    const i = topEqIndex(seg);
    const expr = i >= 0 ? seg.slice(i + 1) : seg;
    const v = polyVar(expr);
    const p = polyOf(expr, v);
    return [derivBlock([{ l: expr, r: P.latex(p, v), note: 'Desarrollamos y agrupamos términos semejantes', boxed: true }])];
  }
  function polyDivide(latex) {
    const seg = latex.replace(/=\s*$/, '');
    const toks = tokenize(seg);
    let parts = splitTop(toks, (t) => isOp(t, ':') || isCmd(t, 'div'));
    let A, B;
    const v = polyVar(seg);
    if (parts.length === 2) { A = toPoly(parseExpr(parts[0], { var: v }), v); B = toPoly(parseExpr(parts[1], { var: v }), v); }
    else {
      const ast = parseExpr(seg, { var: v });
      if (ast.t !== 'div') throw new MErr('Escribe la división como P(x) : Q(x) o como fracción.');
      A = toPoly(ast.a, v); B = toPoly(ast.b, v);
    }
    if (P.deg(B) < 1) throw new MErr('El divisor debe tener grado 1 o más.');
    const { q, r } = P.divmod(A, B);
    const out = [];
    if (P.deg(B) === 1 && B[1].n === 1n && B[1].d === 1n) {
      const a = neg(B[0]);
      out.push(ruffiniTable(A, a, v));
    } else {
      // división larga, paso a paso
      const rows = [];
      let rem = A.slice();
      const db = P.deg(B);
      while (P.deg(rem) >= db) {
        const dr = P.deg(rem);
        const k = div(rem[dr], B[db]);
        const mono = Array(dr - db + 1).fill(ZERO); mono[dr - db] = k;
        const prod = P.mul(mono, B);
        const nr = P.sub(rem, prod);
        rows.push({ l: '\\frac{' + P.latex([...Array(dr).fill(ZERO), rem[dr]], v) + '}{' + P.latex([...Array(db).fill(ZERO), B[db]], v) + '}', r: P.latex(mono, v), note: 'Multiplicamos ' + P.latex(mono, v).replace(/\\frac\{(\d+)\}\{(\d+)\}/g, '$1/$2').replace(/[{}]/g, '') + ' por el divisor y lo restamos: queda ' + P.latex(nr, v).replace(/\\frac\{(\d+)\}\{(\d+)\}/g, '$1/$2').replace(/[{}]/g, '') });
        rem = nr;
      }
      out.push(derivBlock(rows));
    }
    out.push(derivBlock([
      { l: 'C(' + v + ')', r: P.latex(q, v), note: 'Cociente', boxed: true },
      { l: 'R(' + v + ')', r: P.latex(r, v), note: 'Resto', boxed: true },
      { l: P.latex(A, v), r: '\\left(' + P.latex(B, v) + '\\right)\\left(' + P.latex(q, v) + '\\right)' + (P.isZero(r) ? '' : '+' + P.latex(r, v, true)), note: 'Comprobación: D = d·C + R' },
    ]));
    return out;
  }
  function ruffiniRows(p, a) {
    const c = P.norm(p).slice().reverse(); // de mayor a menor grado
    const mid = [''], bot = [];
    let acc = c[0]; bot.push(acc);
    for (let i = 1; i < c.length; i++) { const t = mul(acc, a); mid.push(fText(t)); acc = add(c[i], t); bot.push(acc); }
    return { top: c.map(fText), mid, bot: bot.map(fText), rest: acc, quot: P.norm(bot.slice(0, -1).reverse()) };
  }
  function ruffiniTable(p, a, v) {
    const R = ruffiniRows(p, a);
    return { type: 'table', caption: 'Ruffini: (' + P.latex(p, v).replace(/\\frac\{(-?\d+)\}\{(\d+)\}/g, '$1/$2').replace(/[{}^]/g, (m) => (m === '^' ? '^' : '')) + ') : (' + v + (a.n < 0n ? ' + ' + fText(neg(a)) : ' − ' + fText(a)) + ')',
      rows: [[''].concat(R.top), [fText(a)].concat(R.mid), [''].concat(R.bot)], vbar: 1, hline: 2, mark: [2, R.bot.length], kind: 'ruffini' };
  }
  function polyRoots(latex) {
    const seg = latex.replace(/=\s*0?\s*$/, '');
    const i = topEqIndex(seg);
    const expr = i >= 0 && /^[A-Z]\(/.test(seg) ? seg.slice(i + 1) : seg;
    const v = polyVar(expr);
    const p = polyOf(expr, v);
    if (P.deg(p) < 1) throw new MErr('Necesito un polinomio de grado 1 o más.');
    const { roots, rest } = rationalRoots(p);
    const out = [];
    // tabla de Ruffini encadenada
    let cur = p;
    const rows = [];
    const nz = roots.filter((r) => !isZ(r));
    const zeros = roots.length - nz.length;
    if (zeros) { cur = P.norm(cur.slice(zeros)); }
    for (const r of nz) {
      const R = ruffiniRows(cur, r);
      if (!rows.length) rows.push([''].concat(R.top));
      rows.push([fText(r)].concat(R.mid));
      rows.push([''].concat(R.bot));
      cur = R.quot;
    }
    if (zeros && rows.length) out.push(math(P.latex(p, v) + '=' + (zeros > 1 ? v + '^{' + zeros + '}' : v) + '\\left(' + P.latex(P.norm(p.slice(zeros)), v) + '\\right)'));
    if (rows.length) out.push({ type: 'table', caption: 'Ruffini con las raíces enteras/racionales (divisores del término independiente)', rows, vbar: 1, hlines: rows.map((_, k) => k).filter((k) => k > 0 && k % 2 === 0), kind: 'ruffini' });
    const facts = polyFactorLatex(p, roots, rest, v);
    out.push(math(P.latex(p, v) + '=' + facts));
    const sols = [...new Map(roots.map((x) => [fText(x), x])).values()].map((x) => v + '=' + fLatex(x));
    if (P.deg(rest) === 2) sols.push(...quadRootsLatex(rest, v, false));
    else if (P.deg(rest) > 2) sols.push('\\text{el factor de grado }' + P.deg(rest) + '\\text{ no tiene raíces racionales}');
    out.push(math('\\text{Raíces: }' + (sols.join(',\\quad ') || '\\text{no tiene raíces racionales}')));
    return out;
  }


  return { polyOperate, polyDivide, polyRoots };
});
