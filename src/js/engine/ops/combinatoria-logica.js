/* Operaciones 6 y 7: combinatoria y tabla de verdad. (de pizarra.html, líneas 3058-3182). */
MatIA.define('engine/ops/combinatoria-logica', ['engine/core', 'engine/ops/common'], (ME, $common) => {
  'use strict';
  const { tokenize, MErr } = ME;
  const { isInt } = ME.fr;
  const { fact, derivBlock, lastSeg } = $common;
  /* ====================== 6. Combinatoria ====================== */
  function combinatorics(latex) {
    const L = latex.replace(/\s/g, '');
    const num = (s) => { const v = ME.evaluate(tokenize(s), {}); if (v.t !== 's' || !isInt(v.v) || v.v.n < 0n) throw new MErr('Necesito números naturales.'); return v.v.n; };
    const chain = (a, b) => { const xs = []; for (let i = a; i > b; i--) xs.push(i); return xs; };
    let m;
    const dots = (xs) => (xs.length > 8 ? xs.slice(0, 4).join('\\cdot ') + '\\cdots ' + xs.slice(-2).join('\\cdot ') : xs.join('\\cdot '));
    if ((m = /\\binom\{([^{}]+)\}\{([^{}]+)\}/.exec(L)) || (m = /C_\{([^{},]+),([^{},]+)\}/.exec(L)) || (m = /C_\{([^{}]+)\}\^\{([^{}]+)\}/.exec(L))) {
      const n = num(m[1]), k = num(m[2]);
      if (k > n) throw new MErr('En C(n,k) debe ser k ≤ n.');
      const kk = k < n - k ? k : n - k;
      const top = chain(n, n - kk), bottom = chain(kk, 0n);
      const val = fact(n) / (fact(k) * fact(n - k));
      return [derivBlock([
        { l: '\\binom{' + n + '}{' + k + '}', r: '\\frac{' + n + '!}{' + k + '!\\,' + (n - k) + '!}', note: 'Combinaciones: importa qué, no el orden' },
        { r: kk === 0n ? '1' : '\\frac{' + dots(top) + '}{' + dots(bottom) + '}', note: 'Simplificamos ' + (n - kk) + '!' },
        { r: String(val), boxed: true, note: 'Operamos' },
      ])];
    }
    if ((m = /VR_\{([^{},]+),([^{},]+)\}/.exec(L)) || (m = /VR_\{([^{}]+)\}\^\{([^{}]+)\}/.exec(L))) {
      const n = num(m[1]), k = num(m[2]);
      return [derivBlock([{ l: 'VR_{' + n + ',' + k + '}', r: n + '^{' + k + '}', note: 'Variaciones con repetición: nᵏ' }, { r: String(n ** k), boxed: true, note: 'Operamos' }])];
    }
    if ((m = /V_\{([^{},]+),([^{},]+)\}/.exec(L)) || (m = /V_\{([^{}]+)\}\^\{([^{}]+)\}/.exec(L))) {
      const n = num(m[1]), k = num(m[2]);
      if (k > n) throw new MErr('En V(n,k) debe ser k ≤ n.');
      return [derivBlock([
        { l: 'V_{' + n + ',' + k + '}', r: '\\frac{' + n + '!}{' + (n - k) + '!}', note: 'Variaciones: importa el orden' },
        { r: dots(chain(n, n - k)) || '1', note: k + ' factores desde ' + n },
        { r: String(fact(n) / fact(n - k)), boxed: true, note: 'Operamos' },
      ])];
    }
    if ((m = /P_\{?([0-9]+)\}?/.exec(L))) {
      const n = num(m[1]);
      return [derivBlock([{ l: 'P_{' + n + '}', r: n + '!', note: 'Permutaciones: ordenar ' + n + ' elementos' }, { r: dots(chain(n, 0n)) || '1', note: 'Pₙ = n!: producto de 1 a ' + n }, { r: String(fact(n)), boxed: true, note: 'Operamos' }])];
    }
    if ((m = /\{?([0-9]+)\}?!/.exec(L))) {
      const n = num(m[1]);
      if (n > 3000n) throw new MErr('Número demasiado grande.');
      return [derivBlock([{ l: n + '!', r: dots(chain(n, 0n)) || '1', note: 'Factorial: producto de 1 a ' + n }, { r: String(fact(n)), boxed: true, note: 'Operamos' }])];
    }
    throw new MErr('Escribe n!, \\binom{n}{k}, C_{n,k}, V_{n,k}, VR_{n,k} o P_{n}.');
  }
  function pascal(latex) {
    let n = 6;
    try { const v = ME.evaluate(lastSeg(latex), {}); if (v.t === 's' && isInt(v.v) && v.v.n >= 0n && v.v.n <= 20n) n = Number(v.v.n); } catch (e) { /* por defecto 6 */ }
    const rows = [];
    let row = [1n];
    for (let i = 0; i <= n; i++) {
      rows.push(row.slice());
      const nx = [1n]; for (let j = 1; j < row.length; j++) nx.push(row[j - 1] + row[j]); nx.push(1n);
      row = nx;
    }
    return rows.map((r) => ({ type: 'math', v: r.join('\\quad '), align: 'center' }));
  }

  /* ====================== 7. Lógica: tabla de verdad ====================== */
  function parseLogic(latex) {
    const src = latex.replace(/\\left|\\right/g, '');
    const toks = [];
    const map = [['\\Leftrightarrow', 'iff'], ['\\leftrightarrow', 'iff'], ['\\iff', 'iff'], ['\\Longleftrightarrow', 'iff'], ['\\Rightarrow', 'imp'], ['\\rightarrow', 'imp'], ['\\to', 'imp'], ['\\implies', 'imp'], ['\\Longrightarrow', 'imp'],
      ['\\land', 'and'], ['\\wedge', 'and'], ['\\lor', 'or'], ['\\vee', 'or'], ['\\veebar', 'xor'], ['\\oplus', 'xor'], ['\\neg', 'not'], ['\\lnot', 'not'], ['\\sim', 'not'], ['\\overline', 'over']];
    let i = 0;
    while (i < src.length) {
      const c = src[i];
      if (/\s/.test(c)) { i++; continue; }
      const mm = map.find(([k]) => src.startsWith(k, i) && !/[a-zA-Z]/.test(src[i + k.length] || ''));
      if (mm) { toks.push(mm[1]); i += mm[0].length; continue; }
      if (c === '\\') { const w = /^\\[a-zA-Z]+|^\\./.exec(src.slice(i))[0]; if (['\\,', '\\;', '\\ ', '\\!', '\\quad'].includes(w)) { i += w.length; continue; } throw new MErr('No reconozco «' + w + '» en la fórmula lógica.'); }
      if (c === '(' || c === ')' || c === '{' || c === '}') { toks.push(c === '{' ? '(' : c === '}' ? ')' : c); i++; continue; }
      if (c === '¬' || c === '~' || c === '!') { toks.push('not'); i++; continue; }
      if (/[a-zA-Z]/.test(c)) { toks.push('v:' + c); i++; continue; }
      if (c === '0' || c === '1') { toks.push('k:' + c); i++; continue; }
      throw new MErr('No reconozco «' + c + '» en la fórmula lógica.');
    }
    let pos = 0;
    const peek = () => toks[pos], next = () => toks[pos++];
    const bin = (lv, ops, nxt, right) => () => {
      let a = nxt();
      while (ops.includes(peek())) { const o = next(); const b = right ? bin(lv, ops, nxt, right)() : nxt(); a = { o, a, b }; if (right) return a; }
      return a;
    };
    function un() {
      const t = peek();
      if (t === 'not') { next(); return { o: 'not', a: un() }; }
      if (t === 'over') { next(); if (next() !== '(') throw new MErr('\\overline necesita llaves.'); const a = iff(); if (next() !== ')') throw new MErr('Falta cerrar.'); return { o: 'not', a }; }
      if (t === '(') { next(); const a = iff(); if (next() !== ')') throw new MErr('Falta cerrar un paréntesis.'); return a; }
      if (t && t.startsWith('v:')) { next(); return { o: 'var', n: t.slice(2) }; }
      if (t && t.startsWith('k:')) { next(); return { o: 'k', v: t === 'k:1' }; }
      throw new MErr('Fórmula lógica incompleta.');
    }
    const and = bin(0, ['and'], un), or = bin(0, ['or'], and), xor = bin(0, ['xor'], or), imp = bin(0, ['imp'], xor, true), iff = bin(0, ['iff'], imp);
    const tree = iff();
    if (pos < toks.length) throw new MErr('Sobra algo al final de la fórmula.');
    return tree;
  }
  const LSYM = { and: ' ∧ ', or: ' ∨ ', xor: ' ⊻ ', imp: ' → ', iff: ' ↔ ' };
  function ltext(t, top = true) {
    if (t.o === 'var') return t.n;
    if (t.o === 'k') return t.v ? '1' : '0';
    if (t.o === 'not') return '¬' + ltext(t.a, false);
    const s = ltext(t.a, false) + LSYM[t.o] + ltext(t.b, false);
    return top ? s : '(' + s + ')';
  }
  function truthTable(latex) {
    const seg = latex.replace(/=\s*$/, '');
    const tree = parseLogic(seg);
    const vars = []; const subs = [];
    (function walk(t) { if (t.o === 'var') { if (!vars.includes(t.n)) vars.push(t.n); return; } if (t.o === 'k') return; if (t.a) walk(t.a); if (t.b) walk(t.b); const s = ltext(t); if (!subs.some((x) => x.s === s)) subs.push({ s, t }); })(tree);
    if (vars.length > 5) throw new MErr('Como mucho 5 variables (32 filas).');
    vars.sort();
    const ev = (t, env) => { switch (t.o) { case 'var': return env[t.n]; case 'k': return t.v; case 'not': return !ev(t.a, env); case 'and': return ev(t.a, env) && ev(t.b, env); case 'or': return ev(t.a, env) || ev(t.b, env); case 'xor': return ev(t.a, env) !== ev(t.b, env); case 'imp': return !ev(t.a, env) || ev(t.b, env); case 'iff': return ev(t.a, env) === ev(t.b, env); default: return false; } };
    const rows = [];
    const n = vars.length;
    let allT = true, allF = true;
    for (let i = 0; i < 2 ** n; i++) {
      const env = {}; vars.forEach((v, k) => { env[v] = !((i >> (n - 1 - k)) & 1); });
      const vals = subs.map((s) => ev(s.t, env));
      const last = vals[vals.length - 1];
      allT = allT && last; allF = allF && !last;
      rows.push(vars.map((v) => (env[v] ? 'V' : 'F')).concat(vals.map((x) => (x ? 'V' : 'F'))));
    }
    const kind = allT ? 'Tautología: siempre verdadera' : allF ? 'Contradicción: siempre falsa' : 'Contingencia: a veces verdadera y a veces falsa';
    return [{ type: 'table', head: vars.concat(subs.map((s) => s.s)), rows, vbar: n, kind: 'truth', caption: kind, lastBold: true }];
  }

  return { combinatorics, pascal, truthTable };
});
