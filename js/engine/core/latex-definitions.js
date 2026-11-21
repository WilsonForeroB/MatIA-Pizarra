/* Salida LaTeX (matLatex, toLatex, termLatex) y definiciones/compute. (de pizarra.html, líneas 1437-1496, 1498-1506). */
MatIA.define('engine/core/latex-definitions', ['engine/core/fraction-matrix', 'engine/core/tokenizer', 'engine/core/parser'], ($fractionMatrix, $tokenizer, $parser) => {
  'use strict';
  const { fLatex, MErr, dim, isZ, F, abs } = $fractionMatrix;
  const { splitEq, tokenize, isPureName, readName, isCmd } = $tokenizer;
  const { evaluate } = $parser;
  /* ---------- Salida LaTeX ---------- */
  function matLatex(a, aug, env = 'pmatrix') {
    const body = a.map((r) => r.map(fLatex).join(' & ')).join('\\\\ ');
    if (aug != null) {
      const c = a[0].length;
      const L = a.map((r) => r.slice(0, aug).map(fLatex).join(' & ')).join('\\\\ ');
      const R = a.map((r) => r.slice(aug).map(fLatex).join(' & ')).join('\\\\ ');
      return '\\left(\\begin{matrix}' + L + '\\end{matrix}\\,\\middle|\\,\\begin{matrix}' + R + '\\end{matrix}\\right)';
    }
    return '\\begin{' + env + '}' + body + '\\end{' + env + '}';
  }
  const toLatex = (v) => (v.t === 's' ? fLatex(v.v) : matLatex(v.a, null));

  /* ---------- Entorno de definiciones (A = ...) ---------- */
  function definitions(latexList) {
    const env = {};
    for (const L of latexList) {
      try {
        const segs = splitEq(tokenize(L));
        if (segs.length < 2 || !isPureName(segs[0]) || !segs[1].length) continue;
        const nm = readName(segs[0], 0);
        env[nm.key] = evaluate(segs[1], env);
      } catch (e) { /* línea que no es una definición válida */ }
    }
    return env;
  }

  // Calcula lo escrito en una línea. Devuelve {latex (línea completa nueva) | info}
  function compute(L, env) {
    const toks = tokenize(L);
    const segs = splitEq(toks);
    const trailing = segs.length > 1 && segs[segs.length - 1].length === 0;
    const idx = trailing ? segs.length - 2 : segs.length - 1;
    const target = segs[idx];
    if (!target.length) throw new MErr('Escribe primero una operación, por ejemplo A\\cdot B.');
    const v = evaluate(target, env);
    const res = toLatex(v);
    if (!trailing && segs.length >= 2 && segs[idx - 1].length) {
      try { if (toLatex(evaluate(segs[idx - 1], env)) === res) return { info: 'Esta línea ya está calculada.' }; } catch (e) { /* el lado anterior no es calculable */ }
    }
    if (segs.length === 2 && !trailing && isPureName(segs[0])) {
      const literal = target.length > 0 && (target[0].k === 'num' || isCmd(target[0], 'begin')) &&
        target.filter((t) => isCmd(t, 'begin')).length <= 1 &&
        !target.some((t, i) => i > 0 && t.k === 'op' && ['+', '-', '*', '/', '^'].includes(t.v) && depthAt(target, i) === 0);
      if (literal) {
        const nm = readName(segs[0], 0);
        return { info: nm.key + ' queda guardada' + (v.t === 'm' ? ' (matriz ' + dim(v) + ')' : '') + '. Ya puedes usarla en otras líneas.' };
      }
    }
    const base = L.replace(/\s+$/, '');
    return { latex: (trailing ? base : base + '=') + res, value: v };
  }
  function depthAt(toks, i) {
    let d = 0;
    for (let j = 0; j < i; j++) {
      if (toks[j].k === '{' || isCmd(toks[j], 'begin')) d++;
      if (toks[j].k === '}' || isCmd(toks[j], 'end')) d--;
    }
    return d;
  }

  /* ---------- Gauss paso a paso ---------- */
  function termLatex(coef, sym, first) {
    // coef·sym con signo: "+2F_1", "-F_1", "+\frac{1}{2}F_1"
    if (isZ(coef)) return '';
    const s = coef.n < 0n ? '-' : first ? '' : '+';
    const a = F(abs(coef.n), coef.d);
    const c = a.n === 1n && a.d === 1n && sym ? '' : fLatex(a);
    return s + c + sym;
  }

  return { termLatex, matLatex, definitions, compute, toLatex };
});
