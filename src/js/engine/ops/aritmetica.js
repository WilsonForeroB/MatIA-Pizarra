/* Operaciones 4: aritmética (factorización, mcd/mcm, fracciones). (de pizarra.html, líneas 2845-2960). */
MatIA.define('engine/ops/aritmetica', ['engine/core', 'engine/ops/common', 'engine/ops/expr'], (ME, $common, $expr) => {
  'use strict';
  const { MErr, tokenize, fLatex, F } = ME;
  const { abs, isInt, gcd, neg, div } = ME.fr;
  const { lastSeg, math, isCmd, derivBlock } = $common;
  const { parseExpr } = $expr;
  /* ====================== 4. Aritmética ====================== */
  function factorInt(n) {
    n = abs(n);
    const f = [];
    for (let p = 2n; p * p <= n; p += p === 2n ? 1n : 2n) { let e = 0; while (n % p === 0n) { n /= p; e++; } if (e) f.push([p, e]); }
    if (n > 1n) f.push([n, 1]);
    return f;
  }
  const facLatex = (f) => f.map(([p, e]) => p + (e > 1 ? '^{' + e + '}' : '')).join('\\cdot ') || '1';
  function primeFactor(latex) {
    const v = ME.evaluate(lastSeg(latex), {});
    if (v.t !== 's' || !isInt(v.v) || v.v.n < 2n) throw new MErr('Escribe un número entero mayor que 1.');
    let n = abs(v.v.n);
    if (n > 10n ** 15n) throw new MErr('El número es demasiado grande para factorizarlo aquí.');
    const rows = [];
    let m = n;
    for (let p = 2n; p * p <= m; p += p === 2n ? 1n : 2n) while (m % p === 0n) { rows.push([m, p]); m /= p; }
    if (m > 1n) rows.push([m, m]);
    rows.push([1n, null]);
    return [math('\\begin{array}{r|l}' + rows.map(([a, p]) => a + '&' + (p ? p : '')).join('\\\\') + '\\end{array}'), math(n + '=' + facLatex(factorInt(n)))];
  }
  function intsOf(latex) {
    const toks = tokenize(latex).filter((t) => !(t.k === 'id') && !(isCmd(t)));
    const nums = toks.filter((t) => t.k === 'num').map((t) => BigInt(t.v.split('.')[0]));
    if (nums.length < 2) throw new MErr('Escribe al menos dos números enteros, por ejemplo 12, 18.');
    return nums.map((x) => abs(x)).filter((x) => x > 0n);
  }
  function gcdLcm(latex) {
    const ns = intsOf(latex);
    const fs = ns.map(factorInt);
    const primes = [...new Set(fs.flatMap((f) => f.map(([p]) => p)))].sort((a, b) => (a < b ? -1 : 1));
    const minE = primes.map((p) => [p, Math.min(...fs.map((f) => (f.find(([q]) => q === p) || [p, 0])[1]))]).filter(([, e]) => e > 0);
    const maxE = primes.map((p) => [p, Math.max(...fs.map((f) => (f.find(([q]) => q === p) || [p, 0])[1]))]);
    const g = ns.reduce((a, b) => gcd(a, b));
    const l = ns.reduce((a, b) => a / gcd(a, b) * b);
    const rows = ns.map((n, i) => ({ l: String(n), r: facLatex(fs[i]), note: i === 0 ? 'Descomponemos en factores primos' : 'Igual con ' + n }));
    rows.push({ l: '\\operatorname{m.c.d.}(' + ns.join(',') + ')', r: (minE.length ? facLatex(minE) + '=' : '') + g, note: 'Factores comunes con el menor exponente', boxed: true });
    rows.push({ l: '\\operatorname{m.c.m.}(' + ns.join(',') + ')', r: facLatex(maxE) + '=' + l, note: 'Factores comunes y no comunes con el mayor exponente', boxed: true });
    const out = [derivBlock(rows)];
    if (ns.length === 2) {
      let [a, b] = ns[0] >= ns[1] ? [ns[0], ns[1]] : [ns[1], ns[0]];
      const er = [];
      while (b > 0n) { er.push({ l: String(a), r: (a / b) + '\\cdot ' + b + '+' + (a % b), note: er.length ? 'Dividimos el divisor anterior entre el resto' : 'Algoritmo de Euclides: dividimos y seguimos con el resto' }); [a, b] = [b, a % b]; }
      er.push({ l: '\\operatorname{m.c.d.}', r: String(a), note: 'El último resto distinto de 0', boxed: true });
      out.push(derivBlock(er));
    }
    return out;
  }
  function fracOf(ast) {
    if (ast.t === 'num') return ast.v;
    if (ast.t === 'neg') return neg(fracOf(ast.a));
    if (ast.t === 'div' && ast.a.t === 'num' && ast.b.t === 'num') return div(ast.a.v, ast.b.v);
    if (ast.t === 'div') return div(fracOf(ast.a), fracOf(ast.b));
    throw new MErr('Solo trabajo con fracciones de números enteros.');
  }
  function rawFrac(ast) { // numerador y denominador tal y como están escritos
    if (ast.t === 'div' && ast.a.t === 'num' && ast.b.t === 'num' && isInt(ast.a.v) && isInt(ast.b.v)) return { n: ast.a.v.n, d: ast.b.v.n };
    if (ast.t === 'neg') { const r = rawFrac(ast.a); return { n: -r.n, d: r.d }; }
    if (ast.t === 'num' && isInt(ast.v)) return { n: ast.v.n, d: 1n };
    throw new MErr('Solo trabajo con fracciones de números enteros.');
  }
  function simplifyFraction(latex) {
    const seg = lastSeg(latex);
    const ast = parseExpr(seg);
    const { n, d } = rawFrac(ast);
    if (d === 0n) throw new MErr('El denominador es 0.');
    const g = gcd(n, d);
    const lhs = '\\frac{' + n + '}{' + d + '}';
    if (g === 1n) return [derivBlock([{ l: lhs, r: lhs, note: 'm.c.d.(' + abs(n) + ', ' + d + ') = 1: ya es irreducible', boxed: true }])];
    const fn = factorInt(n), fd = factorInt(d);
    return [derivBlock([
      { l: lhs, r: '\\frac{' + (n < 0n ? '-' : '') + facLatex(fn) + '}{' + facLatex(fd) + '}', note: 'Descomponemos numerador y denominador' },
      { r: '\\frac{' + n + ':' + g + '}{' + d + ':' + g + '}', note: 'Dividimos entre el m.c.d. = ' + g },
      { r: fLatex(F(n, d)), boxed: true, note: 'Fracción irreducible' },
    ])];
  }
  function fractionOps(latex) {
    const seg = lastSeg(latex);
    const ast = parseExpr(seg);
    // suma/resta de fracciones
    const flat = []; const walk = (a, sg) => { if (a.t === 'add') { walk(a.a, sg); walk(a.b, sg); } else if (a.t === 'sub') { walk(a.a, sg); walk(a.b, -sg); } else flat.push({ a, sg }); };
    walk(ast, 1);
    const lhs = latex.replace(/=\s*$/, '');
    if (flat.length > 1) {
      const fs = flat.map(({ a, sg }) => { const r = rawFrac(a); return { n: sg < 0 ? -r.n : r.n, d: r.d }; });
      const l = fs.reduce((s, f) => s / gcd(s, f.d) * f.d, 1n);
      const exp = fs.map((f) => ({ n: f.n * (l / f.d), d: l }));
      const sum = exp.reduce((s, f) => s + f.n, 0n);
      const rows = [
        { l: lhs, r: exp.map((f, i) => (f.n < 0n ? '-' : i ? '+' : '') + '\\frac{' + abs(f.n) + '}{' + l + '}').join(''), note: 'm.c.m. de los denominadores = ' + l + '; ' + fs.map((f) => 'multiplicamos ' + abs(f.n) + '/' + f.d + ' arriba y abajo por ' + (l / f.d)).filter((s, i) => fs[i].d !== l).join('; ') },
        { r: '\\frac{' + exp.map((f, i) => (f.n < 0n ? '-' : i ? '+' : '') + abs(f.n)).join('') + '}{' + l + '}', note: 'Mismo denominador: sumamos los numeradores' },
        { r: '\\frac{' + sum + '}{' + l + '}', note: 'Operamos el numerador' },
      ];
      const res = F(sum, l);
      if (fLatex(res) !== '\\frac{' + sum + '}{' + l + '}') rows.push({ r: fLatex(res), note: 'Simplificamos (m.c.d. = ' + gcd(sum, l) + ')' });
      rows[rows.length - 1].boxed = true;
      return [derivBlock(rows)];
    }
    // producto / cociente
    const fl = []; const walk2 = (a, inv) => { if (a.t === 'mul') { walk2(a.a, inv); walk2(a.b, inv); } else if (a.t === 'div' && !(a.a.t === 'num' && a.b.t === 'num')) { walk2(a.a, inv); walk2(a.b, !inv); } else fl.push({ a, inv }); };
    walk2(ast, false);
    if (fl.length < 2) return simplifyFraction(latex);
    const parts = fl.map(({ a, inv }) => { const r = rawFrac(a); return inv ? { n: r.d, d: r.n, inv } : { n: r.n, d: r.d, inv }; });
    const rows = [];
    if (parts.some((p) => p.inv)) rows.push({ l: lhs, r: parts.map((p) => '\\frac{' + p.n + '}{' + p.d + '}').join('\\cdot '), note: 'Dividir es multiplicar por la inversa' });
    const nn = parts.map((p) => p.n), dd = parts.map((p) => p.d);
    rows.push({ l: rows.length ? '' : lhs, r: '\\frac{' + nn.map((x) => (x < 0n ? '\\left(' + x + '\\right)' : x)).join('\\cdot ') + '}{' + dd.map((x) => (x < 0n ? '\\left(' + x + '\\right)' : x)).join('\\cdot ') + '}', note: 'Numerador por numerador y denominador por denominador' });
    const N1 = nn.reduce((a, b) => a * b, 1n), D1 = dd.reduce((a, b) => a * b, 1n);
    rows.push({ r: '\\frac{' + N1 + '}{' + D1 + '}', note: 'Multiplicamos' });
    const res = F(N1, D1);
    if (fLatex(res) !== '\\frac{' + N1 + '}{' + D1 + '}') rows.push({ r: fLatex(res), note: 'Simplificamos (m.c.d. = ' + gcd(N1, D1) + ')' });
    rows[rows.length - 1].boxed = true;
    if (!rows[0].l) rows[0].l = lhs;
    return [derivBlock(rows)];
  }


  return { simplifyFraction, fractionOps, gcdLcm, primeFactor };
});
