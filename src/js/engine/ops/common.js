/* Helpers compartidos de las operaciones (fText, math, derivBlock, fact, matrixOf, sqrtSimp, latexText, dec…). (de pizarra.html, líneas 1743-1751, 2232-2253, 2549-2549, 2566-2575, 2784-2792, 2842-2844, 3669-3671). */
MatIA.define('engine/ops/common', ['engine/core'], (ME) => {
  'use strict';
  const { F, fLatex, tokenize, MErr } = ME;
  const fr = (n, d = 1) => F(n, d);
  const fText = (a) => (a.d === 1n ? a.n.toString() : a.n.toString() + '/' + a.d.toString());
  const fNum = (a) => Number(a.n) / Number(a.d);
  const isCmd = (t, v) => t && t.k === 'cmd' && (v === undefined || t.v === v);
  const isOp = (t, v) => t && t.k === 'op' && t.v === v;
  const fParen = (a) => (a.n < 0n ? '\\left(' + fLatex(a) + '\\right)' : fLatex(a));
  const math = (v) => ({ type: 'math', v });
  const derivBlock = (rows) => ({ type: 'deriv', rows: rows.map((r) => ({ l: r.l || '', r: r.r || '', note: r.note || '', boxed: !!r.boxed })) });
  const fact = (n) => { let r = 1n; for (let i = 2n; i <= n; i++) r *= i; return r; };

  /* ====================== Utilidades de entrada ====================== */
  function splitTop(toks, isSep) {
    const out = [[]];
    let d = 0;
    for (const t of toks) {
      if (t.k === '{' || isCmd(t, 'begin') || isOp(t, '(') || isOp(t, '[')) d++;
      if (t.k === '}' || isCmd(t, 'end') || isOp(t, ')') || isOp(t, ']')) d--;
      if (d === 0 && isSep(t)) { out.push([]); continue; }
      out[out.length - 1].push(t);
    }
    return out.filter((x) => x.length);
  }
  const lastSeg = (latex) => { const s = ME.splitEq(ME.afterArrows(tokenize(latex))).filter((x) => x.length); if (!s.length) throw new MErr('La línea está vacía.'); return s[s.length - 1]; };
  function matrixOf(latex, env) {
    const v = ME.evaluate(lastSeg(latex), env);
    if (v.t !== 'm') throw new MErr('Necesito una matriz (o su nombre) en la línea.');
    return v;
  }
  const squareOf = (m, what) => { if (m.r !== m.c) throw new MErr(what + ' solo existe para matrices cuadradas y esta es ' + m.r + '×' + m.c + '.'); return m; };
  const vm = (a) => '\\begin{vmatrix}' + a.map((r) => r.map(fLatex).join(' & ')).join('\\\\ ') + '\\end{vmatrix}';
  const pm = (a) => '\\begin{pmatrix}' + a.map((r) => r.map(fLatex).join(' & ')).join('\\\\ ') + '\\end{pmatrix}';
  const prodTxt = (xs) => xs.map(fParen).join('\\cdot ');

  const coefI = (r) => (r.n === 1n && r.d === 1n ? '' : fLatex(r));

  function sqrtSimp(q) {
    // √q = k·√m con q fracción ≥ 0
    if (q.n < 0n) throw new MErr('Raíz de un número negativo.');
    let num = q.n * q.d, den = q.d; // √(n/d) = √(n·d)/d
    let k = 1n, mm = num;
    for (let p = 2n; p * p <= mm; p++) while (mm % (p * p) === 0n) { mm /= p * p; k *= p; }
    const out = F(k, den);
    return { k: out, m: mm };
  }
  const sqrtLatex = (q) => { const { k, m } = sqrtSimp(q); if (m === 1n) return fLatex(k); return (k.n === 1n && k.d === 1n ? '' : k.d === 1n ? fLatex(k) : '\\frac{' + (k.n === 1n ? '' : k.n) + '\\sqrt{' + m + '}}{' + k.d + '}') + (k.d === 1n ? '\\sqrt{' + m + '}' : ''); };

  function topEqIndex(L) {
    let d = 0, env = 0;
    for (let i = 0; i < L.length; i++) {
      const c = L[i];
      if (c === '\\') { if (L.startsWith('\\begin', i)) env++; else if (L.startsWith('\\end', i)) env--; i++; continue; }
      if (c === '{') d++; else if (c === '}') d--; else if (c === '=' && d === 0 && env === 0) return i;
    }
    return -1;
  }

  function latexText(t) {
    return t.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2').replace(/\\sqrt\{([^{}]+)\}/g, '√$1').replace(/\\left|\\right|\\cdot/g, '').replace(/[\\{}]/g, '');
  }

  const dec = (v, k = 4) => { const r = Math.round(v * 10 ** k) / 10 ** k; return (Object.is(r, -0) ? 0 : r).toString(); };
  const decT = (v, k = 4) => dec(v, k).replace('.', ',').replace(/^-/, '−');
  const fracOrDec = (q, useDec) => (useDec ? dec(fNum(q)) : fLatex(q));

  return { fr, fNum, isOp, isCmd, fact, fText, squareOf, matrixOf, math, pm, vm, derivBlock, prodTxt, fParen, lastSeg, splitTop, coefI, sqrtLatex, sqrtSimp, topEqIndex, latexText, fracOrDec, dec, decT };
});
