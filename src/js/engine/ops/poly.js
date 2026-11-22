/* Polinomios en una variable con coeficientes fracción (P, termL, rationalRoots). (de pizarra.html, líneas 1753-1827). */
MatIA.define('engine/ops/poly', ['engine/core', 'engine/ops/common'], (ME, $common) => {
  'use strict';
  const { MErr, F, fLatex } = ME;
  const { isZ, ZERO, ONE, add, mul, div, abs, gcd, neg } = ME.fr;
  const { fr, fNum } = $common;
  /* ====================== Polinomios en una variable (coeficientes fracción) ====================== */
  const P = {
    norm(p) { const q = p.slice(); while (q.length > 1 && isZ(q[q.length - 1])) q.pop(); return q.length ? q : [ZERO]; },
    c(v) { return [v]; },
    x(k = 1) { const p = Array(k + 1).fill(ZERO); p[k] = ONE; return p; },
    deg(p) { p = P.norm(p); return p.length === 1 && isZ(p[0]) ? -Infinity : p.length - 1; },
    add(a, b) { const n = Math.max(a.length, b.length); const r = []; for (let i = 0; i < n; i++) r.push(add(a[i] || ZERO, b[i] || ZERO)); return P.norm(r); },
    sub(a, b) { return P.add(a, P.scale(b, fr(-1))); },
    scale(a, k) { return P.norm(a.map((v) => mul(v, k))); },
    mul(a, b) { const r = Array(a.length + b.length - 1).fill(ZERO); a.forEach((x, i) => b.forEach((y, j) => { r[i + j] = add(r[i + j], mul(x, y)); })); return P.norm(r); },
    pow(a, k) { let r = [ONE]; for (let i = 0; i < k; i++) r = P.mul(r, a); return r; },
    eval(p, x) { let r = ZERO; for (let i = p.length - 1; i >= 0; i--) r = add(mul(r, x), p[i]); return r; },
    isZero(p) { return P.deg(p) === -Infinity; },
    divmod(a, b) {
      a = P.norm(a); b = P.norm(b);
      if (P.isZero(b)) throw new MErr('División entre el polinomio cero.');
      let r = a.slice(); const q = Array(Math.max(1, a.length - b.length + 1)).fill(ZERO);
      const db = P.deg(b), lb = b[db];
      while (P.deg(r) >= db) {
        const dr = P.deg(r), k = div(r[dr], lb), s = dr - db;
        q[s] = k;
        r = P.sub(r, P.mul(P.x(s).map((v, i) => (i === s ? k : ZERO)), b));
      }
      return { q: P.norm(q), r: P.norm(r) };
    },
    latex(p, v = 'x', paren = false) {
      p = P.norm(p);
      let s = '';
      for (let i = p.length - 1; i >= 0; i--) {
        const c = p[i];
        if (isZ(c)) continue;
        const sym = i === 0 ? '' : i === 1 ? v : v + '^{' + i + '}';
        s += termL(c, sym, s === '');
      }
      if (!s) s = '0';
      return paren && /[+-]/.test(s.slice(1)) ? '\\left(' + s + '\\right)' : s;
    },
  };
  // coeficiente·símbolo con signo ("+2x", "-x", "+\frac{1}{2}x")
  function termL(c, sym, first) {
    if (isZ(c)) return '';
    const sg = c.n < 0n ? '-' : first ? '' : '+';
    const a = F(abs(c.n), c.d);
    const one = a.n === 1n && a.d === 1n;
    return sg + (one && sym ? '' : fLatex(a)) + sym;
  }
  // Raíces racionales (con multiplicidad) y el factor que queda
  function rationalRoots(p) {
    p = P.norm(p);
    const roots = [];
    // quitar denominadores
    let L = 1n; p.forEach((c) => { L = L / gcd(L, c.d) * c.d; });
    let q = p.map((c) => F(c.n * L / c.d));
    while (P.deg(q) >= 1 && isZ(q[0])) { roots.push(ZERO); q = q.slice(1); }
    const divisors = (n) => { n = abs(n); const r = []; for (let i = 1n; i * i <= n; i++) if (n % i === 0n) { r.push(i); if (i * i !== n) r.push(n / i); } return r.sort((a, b) => (a < b ? -1 : 1)); };
    let changed = true;
    while (changed && P.deg(q) >= 1) {
      changed = false;
      const a0 = q[0].n, an = q[q.length - 1].n;
      if (a0 === 0n) break;
      const cands = [];
      for (const pp of divisors(a0)) for (const qq of divisors(an)) { cands.push(F(pp, qq)); cands.push(F(-pp, qq)); }
      cands.sort((x, y) => fNum(abs(x.n) === 0n ? x : x) - fNum(y));
      for (const r of cands) {
        if (isZ(P.eval(q, r))) {
          roots.push(r);
          q = P.divmod(q, [neg(r), ONE]).q;
          changed = true;
          break;
        }
      }
    }
    return { roots, rest: q.map((c) => div(c, F(L))) };
  }
  const numParen = (s) => (/^-/.test(s) ? '\\left(' + s + '\\right)' : s);

  return { P, termL, rationalRoots };
});
