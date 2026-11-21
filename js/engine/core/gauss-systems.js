/* Gauss paso a paso, sistemas lineales y gaussLines. (de pizarra.html, líneas 1507-1559, 1560-1678, 1700-1732). */
MatIA.define('engine/core/gauss-systems', ['engine/core/fraction-matrix', 'engine/core/latex-definitions', 'engine/core/tokenizer', 'engine/core/parser'], ($fractionMatrix, $latexDefinitions, $tokenizer, $parser) => {
  'use strict';
  const { copy, isInt, isZ, isUnit, div, ONE, mul, sub, neg, gcd, F, rref, ZERO, MErr, fromDec, add, fLatex } = $fractionMatrix;
  const { termLatex, matLatex } = $latexDefinitions;
  const { isOp, isCmd, readName, tokenize, splitEq, afterArrows } = $tokenizer;
  const { evaluate } = $parser;
  function gauss(a0, opts = {}) {
    const jordan = !!opts.jordan;
    const a = copy(a0), rows = a.length, cols = a[0].length;
    const ncols = opts.aug != null ? opts.aug : cols;
    const steps = [];
    const allInt = () => a.every((r) => r.every(isInt));
    const Fn = (i) => 'F_{' + (i + 1) + '}';
    let r = 0;
    for (let c = 0; c < ncols && r < rows; c++) {
      const cand = [];
      for (let i = r; i < rows; i++) if (!isZ(a[i][c])) cand.push(i);
      if (!cand.length) continue;
      let p = r;
      if (isZ(a[r][c]) || !isUnit(a[r][c])) {
        const u = cand.find((i) => isUnit(a[i][c]));
        p = u !== undefined ? u : isZ(a[r][c]) ? cand[0] : r;
      }
      if (p !== r) {
        [a[p], a[r]] = [a[r], a[p]];
        steps.push({ ops: [Fn(r) + '\\leftrightarrow ' + Fn(p)], a: copy(a) });
      }
      if (jordan && !(isInt(a[r][c]) && a[r][c].n === 1n)) {
        const k = div(ONE, a[r][c]);
        a[r] = a[r].map((v) => mul(v, k));
        steps.push({ ops: [Fn(r) + '\\to ' + termLatex(k, Fn(r), true)], a: copy(a) });
      }
      const ops = [];
      for (let i = 0; i < rows; i++) {
        if (i === r || (!jordan && i < r) || isZ(a[i][c])) continue;
        const pv = a[r][c], v = a[i][c];
        const k = div(v, pv);
        if (jordan || isInt(k) || !allInt()) {
          a[i] = a[i].map((x, j) => sub(x, mul(k, a[r][j])));
          ops.push(Fn(i) + termLatex(neg(k), Fn(r), false));
        } else {
          const g = gcd(pv.n, v.n);
          let al = pv.n / g, be = v.n / g;
          if (al < 0n) { al = -al; be = -be; }
          a[i] = a[i].map((x, j) => sub(mul(F(al), x), mul(F(be), a[r][j])));
          ops.push(termLatex(F(al), Fn(i), true) + termLatex(F(-be), Fn(r), false));
        }
      }
      if (ops.length) steps.push({ ops, a: copy(a) });
      r++;
    }
    return { steps, a, rank: rref(a0, ncols).piv.length };
  }
  function arrowLatex(ops) {
    if (ops.length <= 1) return '\\xrightarrow{' + ops.join('') + '}';
    const h = Math.ceil(ops.length / 2);
    return '\\xrightarrow[' + ops.slice(h).join(',\\ ') + ']{' + ops.slice(0, h).join(',\\ ') + '}';
  }


  /* ---------- Sistemas lineales ---------- */
  function linear(seg) {
    // Devuelve {coef: Map(nombre → Frac), k: Frac}
    const coef = new Map();
    let k = ZERO, pos = 0;
    const peek = () => seg[pos];
    if (!seg.length) throw new MErr('Hay una ecuación con un lado vacío.');
    while (pos < seg.length) {
      let sign = ONE;
      while (isOp(peek(), '+') || isOp(peek(), '-')) { if (isOp(seg[pos], '-')) sign = neg(sign); pos++; }
      let c = null;
      const t = peek();
      if (t && t.k === 'num') { c = fromDec(t.v); pos++; }
      else if (isCmd(t, 'frac') || isCmd(t, 'dfrac')) {
        pos++;
        const grab = () => {
          if (!seg[pos] || seg[pos].k !== '{') throw new MErr('Fracción mal escrita.');
          let d = 0;
          const s = pos;
          for (; pos < seg.length; pos++) { if (seg[pos].k === '{') d++; else if (seg[pos].k === '}' && --d === 0) break; }
          pos++;
          return evaluate(seg.slice(s + 1, pos - 1), {});
        };
        const n = grab(), d = grab();
        c = div(n.v, d.v);
      }
      if (isCmd(peek(), 'cdot') || isCmd(peek(), 'times')) pos++;
      const nm = readName(seg, pos);
      if (nm) {
        pos = nm.end;
        const cc = mul(sign, c || ONE);
        coef.set(nm.key, add(coef.get(nm.key) || ZERO, cc));
      } else if (c) {
        k = add(k, mul(sign, c));
      } else {
        throw new MErr('Solo sé resolver sistemas lineales: revisa «' + (t ? (t.k === 'cmd' ? '\\' + t.v : t.v || t.k) : '') + '».');
      }
    }
    return { coef, k };
  }
  function orderVars(names) {
    const pref = 'xyzwtuv';
    const sub = (s) => { const m = /_\{(\d+)\}$/.exec(s); return m ? +m[1] : null; };
    return names.slice().sort((a, b) => {
      const sa = sub(a), sb = sub(b);
      if (sa !== null && sb !== null && a.split('_')[0] === b.split('_')[0]) return sa - sb;
      const ia = pref.indexOf(a), ib = pref.indexOf(b);
      if (ia >= 0 && ib >= 0) return ia - ib;
      return names.indexOf(a) - names.indexOf(b);
    });
  }
  function parseSystem(L) {
    const toks = tokenize(L);
    let i = toks.findIndex((t) => isCmd(t, 'begin'));
    let body;
    if (i >= 0) {
      // salta \begin{nombre}
      let j = i + 1;
      while (j < toks.length && toks[j].k !== '}') j++;
      const start = j + 1;
      let d = 0, end = start;
      for (; end < toks.length; end++) {
        if (isCmd(toks[end], 'begin')) d++;
        if (isCmd(toks[end], 'end')) { if (d === 0) break; d--; }
      }
      body = toks.slice(start, end);
    } else body = toks;
    const rows = [[]];
    let d = 0;
    for (const t of body) {
      if (t.k === '{' || isCmd(t, 'begin')) d++;
      if (t.k === '}' || isCmd(t, 'end')) d--;
      if (d === 0 && t.k === 'row') { rows.push([]); continue; }
      if (t.k === 'amp') continue;
      rows[rows.length - 1].push(t);
    }
    const eqs = rows.filter((r) => r.length).map((r) => {
      const s = splitEq(r);
      if (s.length !== 2) throw new MErr('Cada ecuación debe tener exactamente un signo =.');
      const L1 = linear(s[0]), R1 = linear(s[1]);
      const coef = new Map(L1.coef);
      for (const [n, v] of R1.coef) coef.set(n, sub(coef.get(n) || ZERO, v));
      return { coef, k: sub(R1.k, L1.k) };
    });
    if (!eqs.length) throw new MErr('No encuentro ecuaciones.');
    const seen = [];
    for (const e of eqs) for (const n of e.coef.keys()) if (!seen.includes(n)) seen.push(n);
    if (!seen.length) throw new MErr('No encuentro incógnitas en el sistema.');
    const vars = orderVars(seen);
    const a = eqs.map((e) => vars.map((v) => e.coef.get(v) || ZERO).concat([e.k]));
    return { vars, a };
  }
  function linLatex(k, terms) {
    let s = isZ(k) ? '' : fLatex(k);
    for (const [c, sym] of terms) s += termLatex(c, sym, s === '');
    return s || '0';
  }
  function solve(a, vars) {
    const n = vars.length;
    const { a: R, piv } = rref(a, n);
    const rA = piv.length;
    const inconsistent = R.some((row) => row.slice(0, n).every(isZ) && !isZ(row[n]));
    const rAb = inconsistent ? rA + 1 : rA;
    if (inconsistent) return { kind: 'SI', rA, rAb, latex: '\\operatorname{rg}(A)=' + rA + '\\neq\\operatorname{rg}(A|b)=' + rAb + '\\Rightarrow\\text{Sistema incompatible: no tiene solución}' };
    const free = vars.map((_, j) => j).filter((j) => !piv.includes(j));
    const P = ['\\lambda', '\\mu', '\\alpha', '\\beta', '\\gamma', '\\delta'];
    const params = {};
    free.forEach((j, i) => { params[j] = P[i] || 't_{' + (i + 1) + '}'; });
    const parts = [];
    vars.forEach((v, j) => {
      if (j in params) { parts.push(v + '=' + params[j]); return; }
      const r = piv.indexOf(j);
      parts.push(v + '=' + linLatex(R[r][n], free.map((f) => [neg(R[r][f]), params[f]])));
    });
    const head = '\\operatorname{rg}(A)=\\operatorname{rg}(A|b)=' + rA + (free.length ? '<' : '=') + n + '=\\text{ n.º de incógnitas}';
    const kind = free.length ? 'SCI' : 'SCD';
    const label = free.length ? '\\text{Compatible indeterminado}' : '\\text{Compatible determinado}';
    return { kind, rA, rAb, latex: head + '\\Rightarrow' + label, sol: parts.join(',\\quad ') + (free.length ? ',\\quad ' + free.map((f) => params[f]).join(',') + '\\in\\mathbb{R}' : '') };
  }

  // Punto de entrada del botón Gauss: devuelve la lista de líneas LaTeX a insertar
  function gaussLines(L, env, jordan) {
    const toks = tokenize(L);
    const hasCases = /\\begin\{(cases|dcases|rcases|aligned)\}/.test(L);
    let a, aug = null, vars = null;
    if (hasCases) {
      const s = parseSystem(L);
      a = s.a; vars = s.vars; aug = vars.length;
    } else {
      const segs = splitEq(afterArrows(toks)).filter((s) => s.length);
      if (!segs.length) throw new MErr('Escribe una matriz o un sistema en la línea.');
      const v = evaluate(segs[segs.length - 1], env);
      if (v.t !== 'm') throw new MErr('Gauss necesita una matriz o un sistema de ecuaciones.');
      a = v.a; aug = v.aug;
      if (aug != null) {
        const X = ['x', 'y', 'z', 't'];
        vars = aug <= 4 ? X.slice(0, aug) : Array.from({ length: aug }, (_, i) => 'x_{' + (i + 1) + '}');
      }
    }
    const lines = [];
    if (hasCases) lines.push(matLatex(a, aug));
    const g = gauss(a, { jordan, aug });
    for (const s of g.steps) lines.push(arrowLatex(s.ops) + matLatex(s.a, aug));
    if (!g.steps.length) lines.push('\\text{La matriz ya está ' + (jordan ? 'reducida' : 'escalonada') + '}');
    if (vars) {
      const r = solve(a, vars);
      lines.push(r.latex);
      if (r.sol) lines.push(r.sol);
    } else {
      lines.push('\\operatorname{rg}=' + g.rank);
    }
    return lines;
  }

  return { gauss, gaussLines, parseSystem, solve };
});
