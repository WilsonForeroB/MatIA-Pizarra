/* Cálculo vectorial (funciones escalares de varias variables): derivadas parciales, gradiente y derivada
   direccional, matriz hessiana. Cada operación recibe el LaTeX de la línea y devuelve bloques de pasos. */
MatIA.define('engine/ops/vectorial', ['engine/core', 'engine/ops/expr', 'engine/ops/common', 'engine/ops/analisis', 'engine/ops/vec-input'], (ME, $expr, $common, $analisis, $vin) => {
  'use strict';
  const { F, MErr, fLatex } = ME;
  const { add, sub, mul, div, neg, isZ, ZERO, ONE } = ME.fr;
  const { N, simpAll, evalNum, varsOf } = $expr;
  // LaTeX del árbol con dos retoques: 7\cdot \sqrt{2} → 7\sqrt{2};  (|x|)^3 → |x|^3
  const L = (a) => $expr.L(a).replace(/(\d)\\cdot \\sqrt/g, '$1\\sqrt').replace(/\\left\(\\left\|([^|]*)\\right\|\\right\)/g, '\\left|$1\\right|');
  const { derivBlock, sqrtSimp } = $common;
  const { D } = $analisis;
  const { parseVecInput, atPoint, numEnv } = $vin;

  /* ====================== Números: exacto si se puede, si no aproximado ====================== */
  function numL0(v) {
    if (!Number.isFinite(v)) return '\\text{—}';
    for (let q = 1; q <= 12; q++) { const p0 = Math.round(v * q); if (Math.abs(p0 / q - v) < 1e-9) return fLatex(F(p0, q)); }
    for (let q = 1; q <= 12; q++) {
      const p0 = Math.round(v / Math.PI * q);
      if (p0 !== 0 && Math.abs(p0 * Math.PI / q - v) < 1e-9) {
        const r = F(p0, q), n = r.n < 0n ? -r.n : r.n, sg = r.n < 0n ? '-' : '';
        return r.d === 1n ? sg + (n === 1n ? '' : n) + '\\pi ' : sg + '\\frac{' + (n === 1n ? '' : n) + '\\pi}{' + r.d + '}';
      }
    }
    return (Math.round(v * 1e4) / 1e4).toString().replace('.', '{,}');
  }
  const numL = (v) => numL0(Object.is(v, -0) ? 0 : v);
  const niceQ = (v) => { for (let q = 1; q <= 12; q++) { const p0 = Math.round(v * q); if (Math.abs(p0 / q - v) < 1e-9) return F(p0, q); } return null; };
  const isNice = (v) => { if (niceQ(v)) return true; for (let q = 1; q <= 12; q++) { const p0 = Math.round(v / Math.PI * q); if (p0 !== 0 && Math.abs(p0 * Math.PI / q - v) < 1e-9) return true; } return false; };
  const qNum = (q) => Number(q.n) / Number(q.d);
  const qPow = (q, k) => { let r = ONE; for (let i = 0; i < k; i++) r = mul(r, q); return r; };
  function iroot(n, k) { // raíz k-ésima entera exacta de n ≥ 0 (BigInt) o null
    if (n < 0n) return null;
    let r = BigInt(Math.round(Math.pow(Number(n), 1 / k)));
    for (const c of [r - 1n, r, r + 1n]) if (c >= 0n && c ** BigInt(k) === n) return c;
    return null;
  }

  /* ====================== Forma canónica (suma de monomios) ======================
     Reúne términos semejantes y ordena variables: 2xy + 3xy → 5xy, yx → xy, y/y^4 → 1/y^3.
     Lo que no es polinómico (sen, e^u, raíces de sumas, denominadores con sumas) se trata como un «átomo». */
  const ORDER = ['x', 'y', 'z', 't', 'u', 'v', 'w', 'r', 's', '\\rho', '\\theta', '\\varphi', '\\phi'];
  const vRank = (v) => { const i = ORDER.indexOf(v); return i < 0 ? 50 : i; };
  const MAXT = 300;
  function single(c, f = new Map()) {
    // factores numéricos: (√3)^2 = 3 pasa al coeficiente; 2^{3/2} = 2·√2
    for (const [k, x] of f) {
      if (isZ(x.e)) f.delete(k);
      else if (x.base.t === 'num' && x.e.d === 1n && x.e.n > -20n && x.e.n < 20n) { c = mul(c, x.e.n > 0n ? qPow(x.base.v, Number(x.e.n)) : div(ONE, qPow(x.base.v, Number(-x.e.n)))); f.delete(k); }
      else if (x.base.t === 'num' && x.e.n > x.e.d) { const w = x.e.n / x.e.d; c = mul(c, qPow(x.base.v, Number(w))); f.set(k, { base: x.base, e: F(x.e.n - w * x.e.d, x.e.d) }); }
    }
    // raíces cuadradas de números: √2·√3 = √6, √8 = 2√2
    const sq = [...f.entries()].filter(([, x]) => x.base.t === 'num' && x.e.n === 1n && x.e.d === 2n && x.base.v.n > 0n);
    if (sq.length) {
      let prod = ONE;
      sq.forEach(([k, x]) => { prod = mul(prod, x.base.v); f.delete(k); });
      const { k, m } = sqrtSimp(prod);
      c = mul(c, k);
      if (m !== 1n) { const b = N.num(F(m)); f.set('a:' + L(b), { base: b, e: F(1, 2) }); }
    }
    return new Map([[mkey(f), { c, f }]]);
  }
  function mkey(f) { return [...f.keys()].sort().map((k) => k + '^' + fLatex(f.get(k).e)).join('·'); }
  function spAdd(A, B, sgn = 1) {
    const R = new Map();
    for (const [k, t] of A) R.set(k, { c: t.c, f: t.f });
    for (const [k, t] of B) {
      const c = sgn < 0 ? neg(t.c) : t.c;
      if (R.has(k)) R.set(k, { c: add(R.get(k).c, c), f: t.f }); else R.set(k, { c, f: t.f });
    }
    for (const [k, t] of R) if (isZ(t.c)) R.delete(k);
    return R;
  }
  function spMul(A, B) {
    if (A.size * B.size > MAXT) throw new MErr('grande');
    let R = new Map();
    for (const a of A.values()) for (const b of B.values()) {
      const f = new Map();
      for (const [k, x] of a.f) f.set(k, { base: x.base, e: x.e });
      for (const [k, x] of b.f) { if (f.has(k)) f.set(k, { base: x.base, e: add(f.get(k).e, x.e) }); else f.set(k, { base: x.base, e: x.e }); }
      R = spAdd(R, single(mul(a.c, b.c), f));
    }
    return R;
  }
  const constOf = (A) => { if (A.size === 0) return ZERO; if (A.size === 1) { const t = [...A.values()][0]; if (t.f.size === 0) return t.c; } return null; };
  const atom = (base, e = ONE) => single(ONE, new Map([['a:' + L(base), { base, e }]]));
  /* (B)^e con B una suma: si B tiene potencias negativas de una variable (y²/x² + 1), se multiplica por ellas
     para quitarlas (x²·(y²/x² + 1) = x² + y²) cuando e es entero. */
  function atomSP(B, e) {
    if (e.d === 1n) {
      const mins = new Map();
      for (const t of B.values()) for (const [k, x] of t.f) if (x.base.t === 'var') mins.set(k, x.e.n < 0n && (!mins.has(k) || x.e.n * mins.get(k).e.d < mins.get(k).e.n * x.e.d) ? x : mins.get(k) || { base: x.base, e: ZERO });
      // las variables que no aparecen en algún término tienen exponente mínimo 0
      const mono = new Map();
      for (const [k, x] of mins) if (x.e.n < 0n && [...B.values()].every((t) => t.f.has(k))) mono.set(k, { base: x.base, e: neg(x.e) });
      for (const [k, x] of mins) if (x.e.n < 0n && !mono.has(k)) mono.set(k, { base: x.base, e: neg(x.e) });
      if (mono.size) {
        const m = single(ONE, mono);
        const B2 = spMul(B, m);
        return spMul(atom(fromSP(B2), e), monoPow(m, neg(e)));
      }
    }
    return atom(fromSP(B), e);
  }
  // 1/den conservando los factores (no desarrolla (x+y)^2 en un denominador)
  function invSP(den) {
    if (den.t === 'mul') return spMul(invSP(den.a), invSP(den.b));
    if (den.t === 'neg') return spAdd(new Map(), invSP(den.a), -1);
    if (den.t === 'pow') {
      const ex = simpAll(den.b);
      if (ex.t === 'num') {
        const B = toSP(den.a);
        const mp = monoPow(B, neg(ex.v));
        if (mp) return mp;
        return atomSP(B, neg(ex.v));
      }
    }
    const B = toSP(den);
    const c = constOf(B);
    if (c && isZ(c)) throw new MErr('División por cero.');
    return monoPow(B, F(-1)) || atomSP(B, F(-1));
  }
  // potencia racional q de un único monomio, o null si no se puede
  function monoPow(A, q) {
    if (A.size !== 1) return null;
    const t = [...A.values()][0];
    let c;
    if (q.d === 1n) {
      const k = Number(q.n < 0n ? -q.n : q.n);
      if (k > 40) return null;
      c = qPow(t.c, k);
      if (q.n < 0n) { if (isZ(c)) return null; c = div(ONE, c); }
    } else {
      if (t.c.n < 0n && q.d % 2n === 0n) return null;
      const k = Number(q.d);
      const sg = t.c.n < 0n ? -1n : 1n;
      const rn = iroot(sg * t.c.n, k), rd = iroot(t.c.d, k);
      if (rn === null || rd === null) return null;
      const base = F(sg * rn, rd);
      const p = Number(q.n < 0n ? -q.n : q.n);
      c = qPow(base, p);
      if (q.n < 0n) { if (isZ(c)) return null; c = div(ONE, c); }
    }
    const f = new Map();
    for (const [k, x] of t.f) f.set(k, { base: x.base, e: mul(x.e, q) });
    return single(c, f);
  }
  function toSP(a) {
    switch (a.t) {
      case 'num': return isZ(a.v) ? new Map() : single(a.v);
      case 'var': return single(ONE, new Map([['v:' + a.n, { base: a, e: ONE }]]));
      case 'c': return atom(a);
      case 'add': return spAdd(toSP(a.a), toSP(a.b));
      case 'sub': return spAdd(toSP(a.a), toSP(a.b), -1);
      case 'neg': return spAdd(new Map(), toSP(a.a), -1);
      case 'mul': return spMul(toSP(a.a), toSP(a.b));
      case 'div': return spMul(toSP(a.a), invSP(a.b));
      case 'pow': {
        const ex = simpAll(a.b);
        const B = toSP(a.a);
        if (ex.t === 'num') {
          const q = ex.v;
          if (isZ(q)) return single(ONE);
          const c = constOf(B);
          if (c && isZ(c)) return q.n > 0n ? new Map() : (() => { throw new MErr('División por cero.'); })();
          const mp = monoPow(B, q);
          if (mp) return mp;
          if (q.d === 1n && q.n > 0n && (q.n <= 2n || (q.n <= 6n && B.size <= 1))) { let R = single(ONE); for (let i = 0n; i < q.n; i++) R = spMul(R, B); return R; }
          // denominadores con sumas, raíces de sumas…: átomo (base)^{q}
          return atomSP(B, q);
        }
        return atom(N.pow(fromSP(B), fromSP(toSP(ex))));
      }
      case 'fn': {
        const arg = fromSP(toSP(a.a));
        const s = simpAll(N.fn(a.f, arg));
        if (s.t !== 'fn') return toSP(s);
        if (!varsOf(arg).size) {
          const v = evalNum(s, {});
          const q = Number.isFinite(v) ? niceQ(v) : null;
          if (q) return isZ(q) ? new Map() : single(q);
        }
        return atom(s);
      }
      default: return atom(a);
    }
  }
  const varFree = (x) => x.base.t !== 'var' && !varsOf(x.base).size;
  function termRank(t) {
    const fs = [...t.f.values()];
    const vs = fs.filter((x) => x.base.t === 'var');
    const atoms = fs.filter((x) => x.base.t !== 'var' && !varFree(x)).length;
    const deg = vs.reduce((s, x) => s + qNum(x.e), 0);
    const vec = ORDER.map((v) => { const x = vs.find((y) => y.base.n === v); return x ? qNum(x.e) : 0; });
    return { atoms, deg, vec, cst: fs.every(varFree), key: mkey(t.f) };
  }
  function cmpTerms(a, b) {
    const A = termRank(a), B = termRank(b);
    if (A.cst !== B.cst) return A.cst ? 1 : -1;
    if (!!A.atoms !== !!B.atoms) return A.atoms ? 1 : -1;
    if (A.deg !== B.deg) return B.deg - A.deg;
    for (let i = 0; i < A.vec.length; i++) if (A.vec[i] !== B.vec[i]) return B.vec[i] - A.vec[i];
    return A.key < B.key ? -1 : A.key > B.key ? 1 : 0;
  }
  function factorRank(x) {
    const b = x.base;
    if (varFree(x)) return -1; // constantes (√2, e², π) delante, como coeficiente
    if (b.t === 'var') return vRank(b.n);
    if (b.t === 'num') return 60;
    if (b.t === 'c') return 70;
    if (b.t === 'pow' && b.a.t === 'c') return 71;
    if (b.t === 'fn') return 90;
    return 80;
  }
  function termAst(t) { // monomio con coeficiente positivo
    const c = t.c.n < 0n ? neg(t.c) : t.c;
    const fs = [...t.f.values()].sort((x, y) => factorRank(x) - factorRank(y));
    const parts = [];
    if (c.n !== 1n || !fs.length) parts.push(N.num(F(c.n)));
    for (const x of fs) parts.push(x.e.n === 1n && x.e.d === 1n ? x.base : N.pow(x.base, N.num(x.e)));
    if (c.d !== 1n) parts.push(fs.length ? N.pow(N.num(F(c.d)), N.num(F(-1))) : null);
    const ps = parts.filter(Boolean);
    if (!fs.length) return N.num(c);
    // solo denominadores y sin numerador: 1/(…)
    const hasNum = ps.some((p) => !(p.t === 'pow' && p.b.t === 'num' && p.b.v.n < 0n));
    if (!hasNum) ps.unshift(N.num(ONE));
    return ps.length === 1 ? ps[0] : ps.reduce((x, y) => N.mul(x, y));
  }
  function sumAst(ts) {
    let r = null;
    for (const t of ts) {
      const p = termAst(t), negT = t.c.n < 0n;
      r = r === null ? (negT ? N.neg(p) : p) : (negT ? N.sub(r, p) : N.add(r, p));
    }
    return r;
  }
  /* Común denominador: 2/(x+y)^2 − 4y/(x+y)^3 → (2x − 2y)/(x+y)^3 */
  function unifyDens(A) {
    const exps = new Map();
    // exponentes negativos de una misma suma que difieren en enteros: −1 y −3, o −1/2 y −3/2
    for (const t of A.values()) for (const [k, x] of t.f) if (k.startsWith('a:') && x.e.n < 0n && varsOf(x.base).size) {
      if (!exps.has(k)) exps.set(k, { base: x.base, es: [] });
      const g = exps.get(k);
      if (!g.es.some((e) => e.n === x.e.n && e.d === x.e.d)) g.es.push(x.e);
    }
    for (const [k, { base, es }] of exps) {
      if (es.length < 2) continue;
      const K = es.reduce((m, e) => (qNum(e) < qNum(m) ? e : m));
      const diffs = es.map((e) => sub(e, K));
      if (!diffs.every((d) => d.d === 1n && d.n <= 4n)) continue;
      let B;
      try { B = toSP(base); } catch (e) { continue; }
      let R = new Map();
      for (const t of A.values()) {
        const x = t.f.get(k);
        const dd = x ? sub(x.e, K) : null;
        if (!x || isZ(dd)) { R = spAdd(R, single(t.c, new Map(t.f))); continue; }
        const f = new Map(t.f); f.set(k, { base: x.base, e: K });
        let T = single(t.c, f);
        for (let i = 0n; i < dd.n; i++) T = spMul(T, B);
        R = spAdd(R, T);
      }
      A = R;
    }
    return A;
  }
  function fromSP(A) {
    try { A = unifyDens(A); } catch (e) { /* demasiado grande: se deja como está */ }
    const ts = [...A.values()].sort(cmpTerms);
    if (!ts.length) return N.num(ZERO);
    // mejor empezar por un término positivo: 2y − x en lugar de −x + 2y
    const ip = ts.findIndex((t) => t.c.n > 0n);
    if (ip > 0 && ts.length <= 4) ts.unshift(ts.splice(ip, 1)[0]);
    // términos con el mismo denominador (suma)^{-k} se escriben en una sola fracción
    const denKey = (t) => [...t.f.entries()].filter(([k, x]) => k.startsWith('a:') && x.e.n < 0n && x.base.t !== 'var' && varsOf(x.base).size).map(([k, x]) => k + '^' + fLatex(x.e)).sort().join('·');
    const groups = new Map();
    for (const t of ts) { const k = denKey(t); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(t); }
    let r = null;
    for (const t of ts) {
      const k = denKey(t), g = groups.get(k);
      if (!g) continue;
      groups.delete(k);
      let p, negT;
      if (k && g.length > 1) {
        const dens = [...g[0].f.entries()].filter(([kk, x]) => kk.startsWith('a:') && x.e.n < 0n && x.base.t !== 'var' && varsOf(x.base).size);
        const nums = g.map((t2) => { const f = new Map(t2.f); dens.forEach(([kk]) => f.delete(kk)); return { c: t2.c, f }; });
        const negAll = nums.every((t2) => t2.c.n < 0n);
        const top = sumAst(negAll ? nums.map((t2) => ({ c: neg(t2.c), f: t2.f })) : nums);
        const bot = dens.map(([, x]) => (x.e.n === -1n && x.e.d === 1n ? x.base : N.pow(x.base, N.num(neg(x.e))))).reduce((a, b) => N.mul(a, b));
        p = N.div(top, bot); negT = negAll;
      } else if (g.length === 1) { p = termAst(g[0]); negT = g[0].c.n < 0n; }
      else { p = sumAst(g); negT = false; if (r !== null) p = { t: 'raw', s: '\\left(' + L(p) + '\\right)' }; }
      r = r === null ? (negT ? N.neg(p) : p) : (negT ? N.sub(r, p) : N.add(r, p));
    }
    return r;
  }
  const canon = (a) => { const s = simpAll(a); try { return fromSP(toSP(s)); } catch (e) { return s; } };
  const CL = (a) => L(canon(a));
  const hasFn = (a) => a.t === 'fn' || (!!a.a && hasFn(a.a)) || (!!a.b && hasFn(a.b));

  /* ====================== Valores en un punto ====================== */
  /* V = { ast (exacto, o null si es aproximado), q (fracción o null), x (número), latex, approx } */
  function vOf(ast) {
    const c = canon(ast);
    const x = (() => { try { return evalNum(c, {}); } catch (e) { return NaN; } })();
    if (c.t === 'num') return { ast: c, q: c.v, x: qNum(c.v), latex: fLatex(c.v), approx: false };
    if (c.t === 'neg' && c.a.t === 'num') return vQ(neg(c.a.v));
    if (!Number.isFinite(x)) return { ast: null, q: null, x, latex: '\\text{—}', approx: true };
    const q = niceQ(x);
    if (q && hasFn(c)) return { ast: N.num(q), q, x, latex: fLatex(q), approx: false };
    if (hasFn(c)) {
      // valores notables de seno, coseno, tangente…: k·√m con m = 2, 3, 6
      for (const m of [2n, 3n, 6n]) {
        const k = niceQ(x / Math.sqrt(Number(m)));
        if (k && !isZ(k)) return { ast: N.mul(N.num(k), N.pow(N.num(F(m)), N.num(F(1, 2)))), q: null, x, latex: cSqrtL(k, m), approx: false };
      }
    }
    if (hasFn(c) || L(c).length > 40) return { ast: null, q: null, x, latex: numL(x), approx: !isNice(x), exactL: L(c).length <= 40 && !/\\pi/.test(L(c)) ? L(c) : null };
    return { ast: c, q: null, x, latex: L(c), approx: false };
  }
  const vQ = (q) => ({ ast: N.num(q), q, x: qNum(q), latex: fLatex(q), approx: false });
  const vNum = (x) => { const q = niceQ(x); return q ? vQ(q) : { ast: null, q: null, x, latex: numL(x), approx: !isNice(x) }; };
  const vOp = (op, a, b) => {
    if (a.q && b.q) return vQ(op === 'add' ? add(a.q, b.q) : op === 'sub' ? sub(a.q, b.q) : mul(a.q, b.q));
    if (a.ast && b.ast) return vOf(N[op](a.ast, b.ast));
    return vNum(op === 'add' ? a.x + b.x : op === 'sub' ? a.x - b.x : a.x * b.x);
  };
  const vShow = (V) => (V.approx ? '\\approx ' : '') + V.latex;
  // forma larga para una fila con un solo valor: \sin 1+\ln 2\approx 1{,}5346
  const vLong = (V) => (V.approx && V.exactL ? V.exactL + '\\approx ' + V.latex : vShow(V));
  const vZero = (V) => (V.q ? isZ(V.q) : Math.abs(V.x) < 1e-12);
  const vSign = (V) => (V.q ? (V.q.n > 0n ? 1 : V.q.n < 0n ? -1 : 0) : Math.abs(V.x) < 1e-9 ? 0 : Math.sign(V.x));
  const par = (s) => (/^-/.test(s.replace(/^\\approx /, '')) ? '\\left(' + s + '\\right)' : s);

  /* ====================== Lectura y textos ====================== */
  const GREEK_T = { '\\theta': 'θ', '\\rho': 'ρ', '\\varphi': 'φ', '\\phi': 'φ', '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\lambda': 'λ', '\\mu': 'μ', '\\sigma': 'σ', '\\tau': 'τ', '\\omega': 'ω' };
  const vT = (v) => GREEK_T[v] || v.replace(/\\/g, '').replace(/_\{?([^}]*)\}?/, '$1');
  const listT = (xs) => (xs.length <= 1 ? xs.join('') : xs.slice(0, -1).join(', ') + (/^[yi]/.test(xs[xs.length - 1]) ? ' e ' : ' y ') + xs[xs.length - 1]);
  // LaTeX sencillo → texto para las notas
  const txt = (s) => s.replace(/\\mathrm\{e\}/g, 'e').replace(/\\pi\s*/g, 'π').replace(/\\approx\s*/g, '≈ ')
    .replace(/\^\{2\}/g, '²').replace(/\^\{3\}/g, '³').replace(/\\cdot\s*/g, '·').replace(/\\left|\\right|\\[,;!]|\\ /g, '')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2').replace(/\\sqrt\{([^{}]+)\}/g, '√$1').replace(/\{,\}/g, ',').replace(/[\\{}]/g, '').replace(/(^|[(\s])-/g, '$1−');
  const sqL = (s) => (/^([0-9]+|[a-zA-Z])$/.test(s) ? s + '^{2}' : '\\left(' + s + '\\right)^{2}');
  const RULE_TXT = { 'constante por función': 'constante por función' };
  const rulesT = (R) => [...R].filter((r) => r !== 'constante' || R.size === 1).map((r) => RULE_TXT[r] || r).join(', ');
  const pd = (nm, v) => '\\frac{\\partial ' + nm + '}{\\partial ' + v + '}';
  const pd2 = (nm, v, w) => (v === w ? '\\frac{\\partial^2 ' + nm + '}{\\partial ' + v + '^2}' : '\\frac{\\partial^2 ' + nm + '}{\\partial ' + v + '\\,\\partial ' + w + '}');
  const sub_ = (nm, vs) => nm + '_' + vs.join('');
  const tupL = (xs) => '\\left(' + xs.join(',\\ ') + '\\right)';
  const addNote = (rows, t) => { const r = rows[rows.length - 1]; r.note = r.note ? r.note + '. ' + t : t; };
  const eqOr = (s) => (/^\\approx/.test(s) ? s : '=' + s);

  function readF(latex, minV, maxV, what) {
    const p = parseVecInput(latex, { want: 'scalar' });
    const n = p.vars.length;
    if (n < minV) {
      if (n === 1) throw new MErr('La función solo depende de ' + vT(p.vars[0]) + ': para una variable usa «Derivar paso a paso». ' + what + ' necesita una función de varias variables, por ejemplo f(x,y) = x^2y.');
      throw new MErr(what + ' necesita una función de al menos ' + minV + ' variables.');
    }
    if (n > maxV) throw new MErr(what + ' admite como mucho ' + maxV + ' variables y la función tiene ' + n + ' (' + p.vars.map(vT).join(', ') + ').');
    const f = p.exprs[0];
    const nm = p.name || 'f';
    const head = nm === 'z' ? 'z' : nm + '(' + p.vars.join(',') + ')';
    const pointT = p.point ? tupL(p.point.latex) : null;
    const atP = (nmx) => nmx + (p.point ? '\\left(' + p.point.latex.join(',') + '\\right)' : '');
    return { ...p, f, nm, head, pointT, atP, n };
  }
  /* Las reglas se anotan derivando una copia en la que lo que no depende de v es un número
     (D anota «potencia» y «cadena» también en términos constantes como y^3 al derivar respecto de x). */
  const freeze = (a, v) => (!varsOf(a).has(v) ? N.num(F(2)) : Object.assign({}, a, a.a ? { a: freeze(a.a, v) } : {}, a.b ? { b: freeze(a.b, v) } : {}));
  function firstPartials(F0) {
    return F0.vars.map((v) => { const R = new Set(); D(freeze(F0.f, v), v, R); const d = canon(D(F0.f, v, new Set())); return { v, d, R }; });
  }
  function valAt(F0, ast, what) {
    let V;
    try { V = vOf(atPoint(ast, F0.vars, F0.point)); } catch (e) { V = { x: NaN }; }
    let x = V.x;
    if (!Number.isFinite(x)) { try { x = evalNum(ast, numEnv(F0.vars, F0.point)); } catch (e) { x = NaN; } }
    if (!Number.isFinite(x)) throw new MErr(what + ' no está definida en P = ' + txt(F0.pointT) + '.');
    if (!V.ast && !V.q) return Object.assign(vNum(x), { exactL: V.exactL });
    return V;
  }
  const fnHeadL = (F0) => F0.head;

  /* ====================== 1. Derivadas parciales ====================== */
  function partials(latex) {
    const F0 = readF(latex, 2, 4, 'Derivadas parciales');
    const { f, nm, vars } = F0;
    const rows = [{ l: fnHeadL(F0), r: L(f), note: 'Función de ' + F0.n + ' variables (' + vars.map(vT).join(', ') + ')' }];
    const d1 = firstPartials(F0);
    d1.forEach(({ v, d, R }) => {
      const others = vars.filter((w) => w !== v).map(vT);
      rows.push({ l: pd(nm, v), r: L(d), note: 'Derivamos respecto de ' + vT(v) + ' tratando ' + listT(others) + ' como constante' + (others.length > 1 ? 's' : '') + ' (reglas: ' + rulesT(R) + ')', boxed: !F0.point });
    });
    // segundas derivadas
    const second = (i, j) => canon(D(d1[i].d, vars[j], new Set())); // ∂/∂v_j (∂f/∂v_i)
    vars.forEach((v, i) => {
      rows.push({ l: pd2(nm, v, v), r: L(second(i, i)), note: (i === 0 ? 'Segundas derivadas. ' : '') + 'Derivamos ∂' + nm + '/∂' + vT(v) + ' otra vez respecto de ' + vT(v) });
    });
    const rnd = randPts(vars);
    for (let i = 0; i < vars.length; i++) for (let j = i + 1; j < vars.length; j++) {
      const a = second(i, j), b = second(j, i); // a = ∂²f/∂vj∂vi, b = ∂²f/∂vi∂vj
      const vi = vT(vars[i]), vj = vT(vars[j]);
      rows.push({ l: pd2(nm, vars[j], vars[i]), r: L(a), note: 'Derivada cruzada: derivamos ∂' + nm + '/∂' + vi + ' respecto de ' + vj });
      const same = L(a) === L(b) || sameNum(a, b, vars, rnd);
      rows.push({
        l: pd2(nm, vars[i], vars[j]), r: L(b) === L(a) ? L(b) : L(b) + (same ? '=' + L(a) : ''),
        note: same ? 'Al revés (∂' + nm + '/∂' + vj + ' respecto de ' + vi + ') sale lo mismo: teorema de Schwarz, ' + sub_(nm, [vars[i], vars[j]].map(vT)) + ' = ' + sub_(nm, [vars[j], vars[i]].map(vT))
          : 'Al revés no sale lo mismo: la función no cumple las hipótesis del teorema de Schwarz (no es de clase C²)',
      });
    }
    if (F0.point) {
      const P = F0.point.latex.join(',');
      const v0 = valAt(F0, f, 'La función');
      rows.push({ l: nm + '\\left(' + P + '\\right)', r: vLong(v0), note: 'Valor de la función en P' });
      d1.forEach(({ v, d }) => {
        const V = valAt(F0, d, 'La derivada respecto de ' + vT(v));
        rows.push({ l: pd(nm, v) + '\\left(' + P + '\\right)', r: vLong(V), note: 'Sustituimos P en ∂' + nm + '/∂' + vT(v) + ': pendiente de ' + nm + ' en la dirección del eje ' + vT(v), boxed: true });
      });
    }
    return [derivBlock(rows)];
  }
  function randPts(vars) {
    const pts = [];
    let s = 7;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return 0.3 + 1.4 * s / 233280; };
    for (let k = 0; k < 4; k++) { const e = {}; vars.forEach((v) => { e[v] = rnd(); }); pts.push(e); }
    return pts;
  }
  function sameNum(a, b, vars, pts) {
    let ok = 0;
    for (const e of pts) {
      let x, y;
      try { x = evalNum(a, e); y = evalNum(b, e); } catch (er) { continue; }
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      if (Math.abs(x - y) > 1e-7 * Math.max(1, Math.abs(x))) return false;
      ok++;
    }
    return ok > 0;
  }

  /* ====================== 2. Gradiente y derivada direccional ====================== */
  // √(q) exacto (q fracción ≥ 0) como { k, m } y LaTeX de c·√m
  function cSqrtL(c, m) {
    if (m === 1n) return fLatex(c);
    const sg = c.n < 0n ? '-' : '', n = c.n < 0n ? -c.n : c.n;
    const top = (n === 1n ? '' : n.toString()) + '\\sqrt{' + m + '}';
    return sg + (c.d === 1n ? top : '\\frac{' + top + '}{' + c.d + '}');
  }
  function gradient(latex) {
    const F0 = readF(latex, 2, 3, 'El gradiente');
    const { f, nm, vars, n } = F0;
    const rows = [{ l: fnHeadL(F0), r: L(f), note: 'Función de ' + n + ' variables' }];
    const d1 = firstPartials(F0);
    d1.forEach(({ v, d, R }) => rows.push({ l: pd(nm, v), r: L(d), note: 'Derivamos respecto de ' + vT(v) + ' (' + listT(vars.filter((w) => w !== v).map(vT)) + ' constante' + (n > 2 ? 's' : '') + '; reglas: ' + rulesT(R) + ')' }));
    rows.push({ l: '\\nabla ' + nm, r: tupL(d1.map((x) => L(x.d))), note: 'El gradiente es el vector de las derivadas parciales', boxed: !F0.point && !F0.dir });
    // dirección
    let U = null;
    if (F0.dir) {
      if (F0.dir.val.length !== n) throw new MErr('La dirección u tiene ' + F0.dir.val.length + ' componentes y la función ' + n + ' variables (' + vars.map(vT).join(', ') + ').');
      const comps = F0.dir.ast.map((a) => vOf(a));
      const exact = comps.every((c) => c.q);
      const norm2 = F0.dir.val.reduce((s, x) => s + x * x, 0);
      if (norm2 < 1e-24) throw new MErr('La dirección u = (0, …, 0) no sirve: un vector nulo no marca ninguna dirección.');
      U = { comps, exact, norm: Math.sqrt(norm2), latex: F0.dir.latex };
      if (exact) {
        const q2 = comps.reduce((s, c) => add(s, mul(c.q, c.q)), ZERO);
        const { k, m } = sqrtSimp(q2);
        U.k = k; U.m = m; U.q2 = q2;
        U.normL = cSqrtL(k, m);
        U.hat = comps.map((c) => cSqrtL(div(c.q, mul(k, F(m))), m));
        U.unit = m === 1n && k.n === 1n && k.d === 1n;
      } else {
        U.normL = numL(U.norm);
        U.unit = Math.abs(U.norm - 1) < 1e-12;
        // componentes exactas pero irracionales (√2/2…): si u ya es unitario se usan tal cual
        U.hat = U.unit && comps.every((c) => c.ast) ? comps.map((c) => c.latex) : F0.dir.val.map((x) => numL(x / U.norm));
        U.hatApprox = !(U.unit && comps.every((c) => c.ast)) && F0.dir.val.some((x) => !isNice(x / U.norm));
      }
      const sq = '\\sqrt{' + F0.dir.latex.map(sqL).join('+') + '}';
      rows.push({ l: '\\left|\\vec u\\right|', r: sq + eqOr((U.exact || isNice(U.norm) ? '' : '\\approx ') + U.normL), note: U.unit ? 'u ya es unitario (módulo 1): lo usamos tal cual' : 'Módulo de u' });
      if (!U.unit) rows.push({ l: '\\hat u', r: '\\frac{\\vec u}{\\left|\\vec u\\right|}' + (U.hatApprox ? '\\approx ' : '=') + tupL(U.hat), note: 'Vector unitario en la dirección de u: dividimos u entre su módulo' });
    }
    const uh = U && U.unit ? '\\vec u' : '\\hat u';
    if (!F0.point) {
      if (U) {
        // D_u f simbólica: (u1 f_x + u2 f_y)/|u|
        const sum = canon(d1.reduce((s, x, i) => { const t = U.comps[i].ast ? N.mul(U.comps[i].ast, x.d) : N.mul(N.num(niceQ(F0.dir.val[i]) || F(Math.round(F0.dir.val[i] * 1e6), 1e6)), x.d); return s ? N.add(s, t) : t; }, null));
        let r;
        if (U.unit) r = L(sum);
        else if (U.exact && U.m === 1n && U.k.d !== 1n) r = CL(N.div(sum, N.num(U.k)));
        else r = '\\frac{' + L(sum) + '}{' + U.normL + '}';
        rows.push({ l: 'D_{' + uh + '}' + nm, r: '\\nabla ' + nm + '\\cdot ' + uh + '=' + r, note: 'Derivada direccional en un punto cualquiera: producto escalar del gradiente por el vector unitario. Añade P = (…) para obtener un número', boxed: true });
      } else addNote(rows, 'Añade un punto, por ejemplo P = (' + vars.map(() => '1').join(', ') + '), para calcular el gradiente allí, su módulo y el plano tangente; y una dirección u = (…) para la derivada direccional');
      return [derivBlock(rows)];
    }
    // ---- en el punto P ----
    const P = F0.point.latex.join(',');
    const atL = (s) => s + '\\left(' + P + '\\right)';
    const f0 = valAt(F0, f, 'La función');
    const g = d1.map((x) => valAt(F0, x.d, 'La derivada respecto de ' + vT(x.v)));
    rows.push({ l: atL('\\nabla ' + nm), r: tupL(g.map(vShow)), note: 'Sustituimos P = ' + txt(F0.pointT) + ' en cada derivada parcial', boxed: true });
    const crit = g.every(vZero);
    if (crit) {
      rows.push({ l: atL('\\nabla ' + nm), r: '\\vec 0', note: 'El gradiente se anula: P es un punto crítico (posible máximo, mínimo o punto de silla; estúdialo con la «Matriz hessiana»). En P ninguna dirección hace crecer ' + nm + ' a primer orden' });
    } else {
      // módulo
      let modL;
      const allQ = g.every((x) => x.q);
      const sq = '\\sqrt{' + g.map((x) => sqL(x.latex)).join('+') + '}';
      const V2 = !allQ && g.every((x) => x.ast) ? vOf(g.reduce((s, x) => { const t = N.mul(x.ast, x.ast); return s ? N.add(s, t) : t; }, null)) : null;
      if (allQ || (V2 && V2.q)) {
        const q2 = allQ ? g.reduce((s, x) => add(s, mul(x.q, x.q)), ZERO) : V2.q;
        const { k, m } = sqrtSimp(q2);
        modL = cSqrtL(k, m) + (m === 1n ? '' : '\\approx ' + numL(Math.sqrt(qNum(q2))));
      } else {
        const mx = Math.sqrt(g.reduce((s, x) => s + x.x * x.x, 0));
        modL = (isNice(mx) ? '' : '\\approx ') + numL(mx);
      }
      rows.push({ l: '\\left|' + atL('\\nabla ' + nm) + '\\right|', r: sq + eqOr(modL), note: 'Es la máxima pendiente: ' + nm + ' crece más rápido en la dirección de ∇' + nm + '(P), y decrece más rápido en la opuesta' });
    }
    if (U) {
      let r, boxed = true;
      if (crit) r = '\\vec 0\\cdot ' + uh + '=0';
      else {
        const prod = g.map((x, i) => par(x.latex) + '\\cdot ' + par(U.hat[i])).join('+');
        let res;
        if (U.exact && g.every((x) => x.q)) {
          const s = g.reduce((acc, x, i) => add(acc, mul(x.q, U.comps[i].q)), ZERO);
          const c = div(s, mul(U.k, F(U.m)));
          res = cSqrtL(c, U.m) + (U.m === 1n ? '' : '\\approx ' + numL(qNum(c) * Math.sqrt(Number(U.m))));
        } else if (g.every((x) => x.ast) && (U.exact || (U.unit && U.comps.every((c) => c.ast)))) {
          const hatAst = (i) => (U.unit ? U.comps[i].ast : N.mul(N.num(div(U.comps[i].q, mul(U.k, F(U.m)))), N.pow(N.num(F(U.m)), N.num(F(1, 2)))));
          res = vShow(vOf(g.reduce((acc, x, i) => { const t = N.mul(x.ast, hatAst(i)); return acc ? N.add(acc, t) : t; }, null)));
          if (/\\sqrt/.test(res) && !/\\approx/.test(res)) res += '\\approx ' + numL(g.reduce((acc, x, i) => acc + x.x * F0.dir.val[i], 0) / U.norm);
        } else {
          const dv = g.reduce((acc, x, i) => acc + x.x * F0.dir.val[i], 0) / U.norm;
          res = (isNice(dv) ? '' : '\\approx ') + numL(dv);
        }
        r = prod + eqOr(res);
      }
      rows.push({ l: atL('D_{' + uh + '}' + nm), r: atL('\\nabla ' + nm) + '\\cdot ' + uh + '=' + r, note: crit ? 'En un punto crítico la derivada direccional es 0 en cualquier dirección' : 'Derivada direccional: ritmo de cambio de ' + nm + ' al moverse desde P en la dirección de u (producto escalar con el unitario)', boxed });
    }
    // plano tangente
    const pt = F0.point.ast;
    const shift = (v, i) => N.sub(N.v(v), pt[i]);
    const shiftL = (v, i) => { const a = F0.point.val[i]; return Math.abs(a) < 1e-15 ? v : '\\left(' + L(canon(shift(v, i))) + '\\right)'; };
    const linL = (vals, lead) => {
      let s = lead;
      vals.forEach((x, i) => {
        if (vZero(x)) return;
        let c = x.latex;
        const negC = /^-/.test(c);
        if (negC) c = c.slice(1);
        if (c === '1') c = '';
        if (/[+-]/.test(c.replace(/^-/, '')) && c) c = '\\left(' + c + '\\right)';
        s += (s ? (negC ? '-' : '+') : (negC ? '-' : '')) + c + shiftL(vars[i], i);
      });
      return s || '0';
    };
    const approx = [f0, ...g].some((x) => !x.ast);
    if (n === 2) {
      let r1 = linL(g, vShow(f0).replace('\\approx ', '') === '0' ? '' : vShow(f0).replace('\\approx ', ''));
      let r2;
      if (!approx) r2 = CL(g.reduce((s, x, i) => N.add(s, N.mul(x.ast, shift(vars[i], i))), f0.ast));
      else r2 = linNum([f0.x, ...g.map((x) => x.x)], vars, F0.point.val);
      rows.push({ l: 'z', r: (approx ? '\\approx ' : '') + r1 + (r2 !== r1 ? '\\;\\Rightarrow\\; z' + (approx ? '\\approx ' : '=') + r2 : ''), note: 'Plano tangente a la superficie z = ' + nm + '(' + vars.map(vT).join(', ') + ') en el punto (' + F0.point.latex.map(txt).join(', ') + ', ' + txt(vShow(f0)) + '): z = ' + nm + '(P) + ' + nm + '_' + vT(vars[0]) + '(P)(' + vT(vars[0]) + ' − a) + ' + nm + '_' + vT(vars[1]) + '(P)(' + vT(vars[1]) + ' − b)', boxed: true });
    } else if (!crit) {
      const r1 = linL(g, '') + '=0';
      let r2;
      // si los coeficientes son fracciones, se simplifican (2x + 4y + 4z − 18 = 0 → x + 2y + 2z − 9 = 0)
      let k = N.num(ONE);
      if (g.every((x) => x.q)) {
        const gcdB = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
        const lcmD = g.reduce((acc, x) => acc * x.q.d / gcdB(acc, x.q.d), 1n);
        const gN = g.reduce((acc, x) => gcdB(acc, x.q.n * lcmD / x.q.d), 0n);
        if (gN) k = N.num(F(lcmD, gN));
      }
      if (!approx) r2 = CL(g.reduce((s, x, i) => { const t = N.mul(N.mul(k, x.ast), shift(vars[i], i)); return s ? N.add(s, t) : t; }, null)) + '=0';
      else r2 = linNum([0, ...g.map((x) => x.x)], vars, F0.point.val) + '\\approx 0';
      rows.push({ l: '\\pi', r: r1 + (r2 !== r1 ? '\\;\\Rightarrow\\; ' + r2 : ''), note: 'Plano tangente a la superficie de nivel ' + nm + ' = ' + txt(vShow(f0)) + ' en P: ∇' + nm + '(P) es perpendicular a ella, así que es el vector normal del plano', boxed: true });
    } else addNote(rows, 'Como ∇' + nm + '(P) = 0, el gradiente no define plano tangente a la superficie de nivel en P');
    return [derivBlock(rows)];
  }
  // c0 + Σ c_i (v_i − a_i) desarrollado, con decimales
  function linNum(cs, vars, a) {
    let k = cs[0];
    const terms = [];
    vars.forEach((v, i) => { k -= cs[i + 1] * a[i]; if (Math.abs(cs[i + 1]) > 1e-12) terms.push([cs[i + 1], v]); });
    let s = '';
    terms.forEach(([c, v]) => {
      const t = numL(Math.abs(c));
      s += (c < 0 ? '-' : s ? '+' : '') + (t === '1' ? '' : t) + v;
    });
    if (Math.abs(k) > 1e-12 || !s) s += (k < 0 ? '-' : s ? '+' : '') + numL(Math.abs(k));
    return s;
  }

  /* ====================== 3. Matriz hessiana ====================== */
  const pmat = (M) => '\\begin{pmatrix}' + M.map((r) => r.join(' & ')).join('\\\\ ') + '\\end{pmatrix}';
  const vmat = (M) => '\\begin{vmatrix}' + M.map((r) => r.join(' & ')).join('\\\\ ') + '\\end{vmatrix}';
  function detV(M) {
    if (M.length === 1) return M[0][0];
    if (M.length === 2) return vOp('sub', vOp('mul', M[0][0], M[1][1]), vOp('mul', M[0][1], M[1][0]));
    let s = null;
    for (let j = 0; j < 3; j++) {
      const minor = [1, 2].map((i) => [0, 1, 2].filter((c) => c !== j).map((c) => M[i][c]));
      const t = vOp('mul', M[0][j], detV(minor));
      s = s === null ? t : j === 1 ? vOp('sub', s, t) : vOp('add', s, t);
    }
    return s;
  }
  function hessian(latex) {
    const F0 = readF(latex, 2, 3, 'La matriz hessiana');
    const { f, nm, vars, n } = F0;
    const rows = [{ l: fnHeadL(F0), r: L(f), note: 'Función de ' + n + ' variables' }];
    const d1 = firstPartials(F0);
    rows.push({ l: '\\nabla ' + nm, r: tupL(d1.map((x) => L(x.d))), note: 'Primeras derivadas parciales (' + d1.map((x) => '∂' + nm + '/∂' + vT(x.v)).join(', ') + ')' });
    const H = vars.map((_, i) => vars.map((__, j) => null));
    for (let i = 0; i < n; i++) for (let j = i; j < n; j++) {
      const h = canon(D(d1[i].d, vars[j], new Set()));
      H[i][j] = h; if (i !== j) H[j][i] = h;
      rows.push({ l: pd2(nm, vars[i], vars[j]), r: L(h), note: i === j ? 'Derivamos ∂' + nm + '/∂' + vT(vars[i]) + ' otra vez respecto de ' + vT(vars[i]) : 'Derivada cruzada (por Schwarz da igual el orden)' });
    }
    const HL = H.map((r) => r.map(L));
    rows.push({ l: 'H_{' + nm + '}\\left(' + vars.join(',') + '\\right)', r: pmat(HL), note: 'Matriz hessiana: en la fila i, columna j va la derivada respecto de la variable i y de la j. Es simétrica porque las derivadas cruzadas coinciden (teorema de Schwarz)', boxed: !F0.point });
    if (!F0.point) {
      if (n === 2) rows.push({ l: '\\left|H_{' + nm + '}\\right|', r: vmat(HL) + '=' + CL(N.sub(N.mul(H[0][0], H[1][1]), N.mul(H[0][1], H[1][0]))), note: 'Determinante hessiano: ' + sub_(nm, [vars[0], vars[0]].map(vT)) + ' · ' + sub_(nm, [vars[1], vars[1]].map(vT)) + ' − (' + sub_(nm, [vars[0], vars[1]].map(vT)) + ')²' });
      addNote(rows, 'Para clasificar un punto añade P = (…) en la línea' + (n === 2 ? ', o usa «Extremos de f(x, y)» para buscar y clasificar todos los puntos críticos' : ''));
      return [derivBlock(rows)];
    }
    const P = F0.point.latex.join(',');
    const f0 = valAt(F0, f, 'La función');
    const g = d1.map((x) => valAt(F0, x.d, 'La derivada respecto de ' + vT(x.v)));
    const crit = g.every(vZero);
    rows.push({ l: '\\nabla ' + nm + '\\left(' + P + '\\right)', r: tupL(g.map(vShow)), note: crit ? 'El gradiente se anula: P es un punto crítico' : 'El gradiente no se anula: P no es un punto crítico' });
    const HV = H.map((r) => r.map((h) => valAt(F0, h, 'La segunda derivada')));
    rows.push({ l: 'H_{' + nm + '}\\left(' + P + '\\right)', r: pmat(HV.map((r) => r.map(vShow))), note: 'Sustituimos P en la hessiana' });
    const dets = [];
    for (let k = 1; k <= n; k++) {
      const M = HV.slice(0, k).map((r) => r.slice(0, k));
      const d = detV(M);
      dets.push(d);
      const s = vSign(d);
      rows.push({ l: '\\Delta_{' + k + '}', r: (k === 1 ? '' : vmat(M.map((r) => r.map(vShow))) + '=') + vShow(d) + (s > 0 ? '>0' : s < 0 ? '<0' : ''), note: k === 1 ? 'Menores principales: esquinas superiores izquierdas de H(P), de tamaño 1, 2' + (n === 3 ? ', 3' : '') : 'Menor principal de tamaño ' + k + ' (determinante ' + k + '×' + k + ' de la esquina superior izquierda)' });
    }
    const sg = dets.map(vSign);
    let cls, why;
    if (sg.every((s) => s > 0)) { cls = 'pos'; why = 'Todos los menores principales son positivos (criterio de Sylvester)'; }
    else if (sg.every((s, i) => (i % 2 === 0 ? s < 0 : s > 0))) { cls = 'neg'; why = 'Los menores alternan de signo empezando en negativo: Δ1 < 0, Δ2 > 0' + (n === 3 ? ', Δ3 < 0' : '') + ' (criterio de Sylvester)'; }
    else if (sg[n - 1] !== 0) { cls = 'ind'; why = 'Δ' + n + ' = det H(P) ≠ 0 pero los signos no siguen ninguno de los dos patrones de Sylvester'; }
    else { cls = 'deg'; why = 'Δ' + n + ' = det H(P) = 0: la matriz es semidefinida o indefinida y el criterio de Sylvester no decide'; }
    const clsL = { pos: '\\text{definida positiva}', neg: '\\text{definida negativa}', ind: '\\text{indefinida}', deg: '\\text{semidefinida o dudosa}' }[cls];
    rows.push({ l: 'H_{' + nm + '}\\left(' + P + '\\right)', r: clsL, note: why, boxed: true });
    if (crit) {
      const res = { pos: ['\\text{mínimo relativo}', 'Punto crítico con hessiana definida positiva: ' + nm + ' tiene un mínimo relativo en P'], neg: ['\\text{máximo relativo}', 'Punto crítico con hessiana definida negativa: ' + nm + ' tiene un máximo relativo en P'], ind: ['\\text{punto de silla}', 'Punto crítico con hessiana indefinida: ' + nm + ' crece en unas direcciones y decrece en otras (punto de silla)'], deg: ['\\text{caso dudoso}', 'El criterio no decide: hay que estudiar ' + nm + ' cerca de P por otros medios'] }[cls];
      rows.push({ l: 'P', r: res[0], note: res[1] + '. ' + nm + '(P) = ' + txt(vShow(f0)), boxed: true });
    } else {
      const curv = { pos: 'cerca de P la función es convexa (se curva hacia arriba en todas las direcciones)', neg: 'cerca de P la función es cóncava (se curva hacia abajo en todas las direcciones)', ind: 'cerca de P la función se curva hacia arriba en unas direcciones y hacia abajo en otras', deg: 'con det H(P) = 0 no podemos asegurar la curvatura cerca de P' }[cls];
      rows.push({ l: 'P', r: '\\text{no es punto crítico}', note: 'Como ∇' + nm + '(P) ≠ 0, P no puede ser máximo ni mínimo: la hessiana solo describe la curvatura; ' + curv });
    }
    return [derivBlock(rows)];
  }

  return { partials, gradient, hessian, canon };
});
