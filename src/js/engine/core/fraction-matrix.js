/* Fracciones exactas con BigInt (MErr, F, aritmética) y matrices (det, rref, inv, pow…). (de pizarra.html, líneas 965-1122). */
MatIA.define('engine/core/fraction-matrix', [], () => {
  'use strict';
  class MErr extends Error {}
  const abs = (a) => (a < 0n ? -a : a);
  const gcd = (a, b) => { a = abs(a); b = abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
  function F(n, d = 1n) {
    if (typeof n !== 'bigint') n = BigInt(n);
    if (typeof d !== 'bigint') d = BigInt(d);
    if (d === 0n) throw new MErr('División por cero.');
    if (d < 0n) { n = -n; d = -d; }
    const g = gcd(n, d) || 1n;
    return { n: n / g, d: d / g };
  }
  const ZERO = F(0), ONE = F(1);
  const add = (a, b) => F(a.n * b.d + b.n * a.d, a.d * b.d);
  const sub = (a, b) => F(a.n * b.d - b.n * a.d, a.d * b.d);
  const mul = (a, b) => F(a.n * b.n, a.d * b.d);
  const div = (a, b) => { if (b.n === 0n) throw new MErr('División por cero.'); return F(a.n * b.d, a.d * b.n); };
  const neg = (a) => F(-a.n, a.d);
  const isZ = (a) => a.n === 0n;
  const isInt = (a) => a.d === 1n;
  const isUnit = (a) => a.d === 1n && abs(a.n) === 1n;
  function fromDec(s) {
    if (s.includes('.')) {
      const [i, f = ''] = s.split('.');
      const p = 10n ** BigInt(f.length);
      return F(BigInt(i || '0') * p + BigInt(f || '0'), p);
    }
    return F(BigInt(s));
  }
  function fLatex(a) {
    if (a.d === 1n) return a.n.toString();
    return (a.n < 0n ? '-' : '') + '\\frac{' + abs(a.n) + '}{' + a.d + '}';
  }

  const S = (v) => ({ t: 's', v });
  const M = (a, aug = null) => ({ t: 'm', a, r: a.length, c: a[0].length, aug });
  const dim = (m) => m.r + '×' + m.c;
  const copy = (a) => a.map((r) => r.slice());
  const ident = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? ONE : ZERO)));

  function opAdd(x, y, sign) {
    const f = sign > 0 ? add : sub;
    if (x.t === 's' && y.t === 's') return S(f(x.v, y.v));
    if (x.t === 'm' && y.t === 'm') {
      if (x.r !== y.r || x.c !== y.c)
        throw new MErr('No se pueden ' + (sign > 0 ? 'sumar' : 'restar') + ' matrices de distinto tamaño: ' + dim(x) + ' y ' + dim(y) + '.');
      return M(x.a.map((row, i) => row.map((v, j) => f(v, y.a[i][j]))));
    }
    throw new MErr('No se puede ' + (sign > 0 ? 'sumar' : 'restar') + ' un número y una matriz.');
  }
  function opMul(x, y) {
    if (x.t === 's' && y.t === 's') return S(mul(x.v, y.v));
    if (x.t === 's') return M(y.a.map((r) => r.map((v) => mul(x.v, v))));
    if (y.t === 's') return M(x.a.map((r) => r.map((v) => mul(v, y.v))));
    if (x.c !== y.r)
      throw new MErr('No se pueden multiplicar ' + dim(x) + ' · ' + dim(y) + ': las columnas de la primera (' + x.c + ') deben coincidir con las filas de la segunda (' + y.r + ').');
    const out = [];
    for (let i = 0; i < x.r; i++) {
      out.push([]);
      for (let j = 0; j < y.c; j++) {
        let s = ZERO;
        for (let k = 0; k < x.c; k++) s = add(s, mul(x.a[i][k], y.a[k][j]));
        out[i].push(s);
      }
    }
    return M(out);
  }
  function opDiv(x, y) {
    if (y.t !== 's') throw new MErr('No se puede dividir entre una matriz; usa la inversa (A^{-1}).');
    if (isZ(y.v)) throw new MErr('División por cero.');
    return opMul(x, S(div(ONE, y.v)));
  }
  function needSquare(m, what) {
    if (m.t !== 'm') throw new MErr('El ' + what + ' solo tiene sentido para matrices.');
    if (m.r !== m.c) throw new MErr('El ' + what + ' solo existe para matrices cuadradas y esta es ' + dim(m) + '.');
  }
  function det(m) {
    needSquare(m, 'determinante');
    const a = copy(m.a), n = m.r;
    let d = ONE;
    for (let c = 0; c < n; c++) {
      let p = c;
      while (p < n && isZ(a[p][c])) p++;
      if (p === n) return S(ZERO);
      if (p !== c) { [a[p], a[c]] = [a[c], a[p]]; d = neg(d); }
      d = mul(d, a[c][c]);
      for (let i = c + 1; i < n; i++) {
        if (isZ(a[i][c])) continue;
        const k = div(a[i][c], a[c][c]);
        for (let j = c; j < n; j++) a[i][j] = sub(a[i][j], mul(k, a[c][j]));
      }
    }
    return S(d);
  }
  function rref(a0, ncols) {
    const a = copy(a0), rows = a.length, cols = a[0].length;
    ncols = ncols == null ? cols : ncols;
    const piv = [];
    let r = 0;
    for (let c = 0; c < ncols && r < rows; c++) {
      let p = r;
      while (p < rows && isZ(a[p][c])) p++;
      if (p === rows) continue;
      [a[p], a[r]] = [a[r], a[p]];
      const pv = a[r][c];
      a[r] = a[r].map((v) => div(v, pv));
      for (let i = 0; i < rows; i++) {
        if (i === r || isZ(a[i][c])) continue;
        const k = a[i][c];
        a[i] = a[i].map((v, j) => sub(v, mul(k, a[r][j])));
      }
      piv.push(c);
      r++;
    }
    return { a, piv };
  }
  function rank(m) { return S(F(rref(m.a).piv.length)); }
  function inv(m) {
    needSquare(m, 'inversa');
    const n = m.r;
    const aug = m.a.map((row, i) => row.concat(ident(n)[i]));
    const { a, piv } = rref(aug, n);
    if (piv.length < n) throw new MErr('La matriz no tiene inversa: su determinante es 0.');
    return M(a.map((row) => row.slice(n)));
  }
  function transpose(m) {
    if (m.t !== 'm') return m;
    return M(m.a[0].map((_, j) => m.a.map((row) => row[j])));
  }
  function trace(m) {
    needSquare(m, 'traza');
    let s = ZERO;
    for (let i = 0; i < m.r; i++) s = add(s, m.a[i][i]);
    return S(s);
  }
  function pow(x, e) {
    if (e.t !== 's' || !isInt(e.v)) throw new MErr('Solo calculo potencias con exponente entero.');
    let k = e.v.n;
    if (x.t === 's') {
      if (k < 0n) { if (isZ(x.v)) throw new MErr('División por cero.'); x = S(div(ONE, x.v)); k = -k; }
      if (k > 4096n) throw new MErr('Exponente demasiado grande.');
      let r = ONE;
      for (let i = 0n; i < k; i++) r = mul(r, x.v);
      return S(r);
    }
    needSquare(x, 'cálculo de potencias');
    if (k < 0n) { x = inv(x); k = -k; }
    if (k > 512n) throw new MErr('Exponente demasiado grande.');
    let r = M(ident(x.r)), b = x;
    while (k > 0n) { if (k & 1n) r = opMul(r, b); b = opMul(b, b); k >>= 1n; }
    return r;
  }
  function sqrtExact(x) {
    if (x.t !== 's') throw new MErr('No sé calcular la raíz de una matriz.');
    const root = (n) => { if (n < 0n) return null; if (n < 2n) return n; let r = BigInt(Math.floor(Math.sqrt(Number(n)))); while (r * r > n) r--; while ((r + 1n) * (r + 1n) <= n) r++; return r * r === n ? r : null; };
    const a = root(x.v.n), b = root(x.v.d);
    if (a === null || b === null) throw new MErr('Solo calculo raíces exactas (cuadrados perfectos).');
    return S(F(a, b));
  }

  return { MErr, opAdd, opMul, S, F, opDiv, transpose, isInt, inv, pow, fromDec, M, det, neg, sqrtExact, trace, rank, fLatex, dim, isZ, abs, copy, isUnit, div, ONE, mul, sub, gcd, rref, ZERO, add };
});
