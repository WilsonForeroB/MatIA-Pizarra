/* Operaciones 8: conjuntos y Venn. (de pizarra.html, líneas 3183-3285). */
MatIA.define('engine/ops/conjuntos-venn', ['engine/core', 'engine/ops/common'], (ME, $common) => {
  'use strict';
  const { MErr } = ME;
  const { math } = $common;

  /* ====================== 8. Conjuntos ====================== */
  function setTokens(latex) {
    let s = latex.replace(/\\left|\\right/g, '').replace(/\\lbrace|\\\{/g, '{').replace(/\\rbrace|\\\}/g, '}').replace(/\\emptyset|\\varnothing/g, '{}');
    const toks = [];
    let i = 0;
    const ops = [['\\cup', 'cup'], ['\\cap', 'cap'], ['\\setminus', 'minus'], ['\\backslash', 'minus'], ['\\times', 'times'], ['\\triangle', 'sym'], ['\\Delta', 'sym'], ['\\mathcal{P}', 'P'], ['\\mathcal P', 'P'], ['\\wp', 'P']];
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c) || s.startsWith('\\,', i) || s.startsWith('\\ ', i)) { i += c === '\\' ? 2 : 1; continue; }
      const o = ops.find(([k]) => s.startsWith(k, i));
      if (o) { toks.push({ k: o[1] }); i += o[0].length; continue; }
      if (s.startsWith('^{c}', i) || s.startsWith('^c', i) || s.startsWith("'", i)) { toks.push({ k: 'comp' }); i += s.startsWith('^{c}', i) ? 4 : s.startsWith('^c', i) ? 2 : 1; continue; }
      if (c === '{' || c === '}' || c === '(' || c === ')' || c === ',' || c === '|' || c === '=') { toks.push({ k: c }); i++; continue; }
      const m = /^-?\d+(\.\d+)?/.exec(s.slice(i)) || /^[a-zA-Z](_\{[^}]*\}|_[0-9a-z])?/.exec(s.slice(i));
      if (m) { toks.push({ k: /^[A-Z]/.test(m[0]) ? 'name' : 'el', v: m[0] }); i += m[0].length; continue; }
      throw new MErr('No reconozco «' + c + '» en la expresión de conjuntos.');
    }
    return toks;
  }
  const setKey = (x) => (Array.isArray(x) ? '(' + x.map(setKey).join(',') + ')' : x && x.set ? '{' + x.set.map(setKey).join(',') + '}' : String(x));
  const mkSet = (els) => { const m = new Map(); els.forEach((e) => m.set(setKey(e), e)); const arr = [...m.values()]; arr.sort((a, b) => { const na = Number(a), nb = Number(b); return !isNaN(na) && !isNaN(nb) ? na - nb : setKey(a).localeCompare(setKey(b)); }); return { set: arr }; };
  const setLatex = (s) => (s && s.set ? (s.set.length ? '\\left\\lbrace ' + s.set.map(setLatex).join(',\\ ') + '\\right\\rbrace ' : '\\emptyset ') : Array.isArray(s) ? '\\left(' + s.map(setLatex).join(',') + '\\right)' : String(s));
  function setEval(toks, env) {
    let pos = 0;
    const peek = () => toks[pos], next = () => toks[pos++];
    function expr() { let a = term(); while (peek() && ['cup', 'minus', 'sym'].includes(peek().k)) { const o = next().k; const b = term(); a = o === 'cup' ? mkSet(a.set.concat(b.set)) : o === 'minus' ? mkSet(a.set.filter((x) => !b.set.some((y) => setKey(y) === setKey(x)))) : mkSet(a.set.filter((x) => !b.set.some((y) => setKey(y) === setKey(x))).concat(b.set.filter((x) => !a.set.some((y) => setKey(y) === setKey(x))))); } return a; }
    function term() { let a = post(); while (peek() && ['cap', 'times'].includes(peek().k)) { const o = next().k; const b = post(); a = o === 'cap' ? mkSet(a.set.filter((x) => b.set.some((y) => setKey(y) === setKey(x)))) : mkSet(a.set.flatMap((x) => b.set.map((y) => [x, y]))); } return a; }
    function post() { let a = prim(); while (peek() && peek().k === 'comp') { next(); if (!env.U) throw new MErr('Para el complementario define el universal en otra línea: U = {…}.'); a = mkSet(env.U.set.filter((x) => !a.set.some((y) => setKey(y) === setKey(x)))); } return a; }
    function prim() {
      const t = next();
      if (!t) throw new MErr('Expresión de conjuntos incompleta.');
      if (t.k === '{') { const els = []; while (peek() && peek().k !== '}') { if (peek().k === ',') { next(); continue; } const e = peek(); if (e.k === '{') els.push(prim()); else { next(); els.push(e.v); } } next(); return mkSet(els); }
      if (t.k === '(') { const a = expr(); if (!peek() || peek().k !== ')') throw new MErr('Falta cerrar un paréntesis.'); next(); return a; }
      if (t.k === 'name') { if (!env[t.v]) throw new MErr('No conozco el conjunto ' + t.v + '. Defínelo en otra línea: ' + t.v + ' = {…}.'); return env[t.v]; }
      if (t.k === 'P') { const a = prim(); if (a.set.length > 6) throw new MErr('𝒫(A) solo hasta 6 elementos (64 subconjuntos).'); const out = []; for (let i = 0; i < 2 ** a.set.length; i++) out.push({ set: a.set.filter((_, k) => (i >> k) & 1) }); out.sort((x, y) => x.set.length - y.set.length); return { set: out }; }
      if (t.k === '|') { const a = expr(); next(); return { card: a.set.length }; }
      throw new MErr('No esperaba «' + (t.v || t.k) + '».');
    }
    const r = expr();
    return r;
  }
  function setDefs(lines) {
    const env = {};
    for (const L of lines) {
      try { const tk = setTokens(L); if (tk.length > 2 && tk[0].k === 'name' && tk[1].k === '=') env[tk[0].v] = setEval(tk.slice(2), env); } catch (e) { /* no es un conjunto */ }
    }
    return env;
  }
  /* --- Diagramas de Venn: zonas como máscaras de bits (A = 1, B = 2, C = 4) --- */
  function normSetText(t) {
    return String(t)
      .replace(/∩/g, '\\cap ').replace(/∪/g, '\\cup ').replace(/∖/g, '\\setminus ').replace(/[Δ△]/g, '\\triangle ')
      .replace(/ᶜ/g, '^c').replace(/∅/g, '\\emptyset ').replace(/\^\{\\complement\}|\\complement/g, '^c')
      .replace(/\\(?=[A-Z](?![a-zA-Z]))/g, '\\setminus ')
      .replace(/([A-Z)'c}\s])\s*-\s*(?=[A-Z(\\])/g, '$1\\setminus ');
  }
  function vennEval(expr, names, nHint) {
    const toks = setTokens(normSetText(expr));
    const used = [...new Set(toks.filter((t) => t.k === 'name' && t.v !== 'U').map((t) => t.v))];
    for (const u of used) if (!names.includes(u)) throw new MErr('En el diagrama solo hay los conjuntos ' + names.join(', ') + ' (y U): «' + u + '» no está.');
    if (toks.some((t) => t.k === 'el' || t.k === 'times' || t.k === 'P' || t.k === '|')) throw new MErr('En el diagrama de Venn usa solo nombres de conjuntos y ∪ ∩ ∖ Δ ᶜ.');
    const n = nHint || (used.includes(names[2]) ? 3 : 2);
    const all = Array.from({ length: 1 << n }, (_, i) => i);
    let pos = 0;
    const peek = () => toks[pos], next = () => toks[pos++];
    const S = (arr) => new Set(arr);
    function expr_() { let a = term(); while (peek() && ['cup', 'minus', 'sym'].includes(peek().k)) { const o = next().k, b = term(); a = o === 'cup' ? S([...a, ...b]) : o === 'minus' ? S([...a].filter((x) => !b.has(x))) : S([...a].filter((x) => !b.has(x)).concat([...b].filter((x) => !a.has(x)))); } return a; }
    function term() { let a = post(); while (peek() && peek().k === 'cap') { next(); const b = post(); a = S([...a].filter((x) => b.has(x))); } return a; }
    function post() { let a = prim(); while (peek() && peek().k === 'comp') { next(); a = S(all.filter((x) => !a.has(x))); } return a; }
    function prim() {
      const t = next();
      if (!t) throw new MErr('Expresión incompleta.');
      if (t.k === '(') { const a = expr_(); if (!peek() || peek().k !== ')') throw new MErr('Falta cerrar un paréntesis.'); next(); return a; }
      if (t.k === '{') { if (peek() && peek().k === '}') { next(); return S([]); } throw new MErr('En el diagrama de Venn usa nombres de conjuntos, no elementos.'); }
      if (t.k === 'name') { if (t.v === 'U') return S(all); const k = names.indexOf(t.v); if (k >= n) throw new MErr('Este diagrama tiene ' + n + ' conjuntos.'); return S(all.filter((m) => m & (1 << k))); }
      throw new MErr('No esperaba «' + (t.v || t.k) + '» en la expresión.');
    }
    const r = expr_();
    if (pos < toks.length) throw new MErr('Sobra algo al final de la expresión.');
    return { n, masks: [...r].sort((a, b) => a - b) };
  }
  // Elementos de los conjuntos definidos en la página, con su zona
  function vennElements(lines, names, n) {
    const env = setDefs(lines);
    const sets = names.slice(0, n).map((k) => env[k]);
    if (!sets.some(Boolean)) return null;
    const key = (x) => setKey(x);
    const uni = env.U ? env.U.set.slice() : [];
    for (const st of sets) if (st) for (const e of st.set) if (!uni.some((u) => key(u) === key(e))) uni.push(e);
    const els = uni.map((e) => ({ v: e, txt: setKey(e), mask: sets.reduce((m, st, k) => (st && st.set.some((y) => key(y) === key(e)) ? m | (1 << k) : m), 0) }));
    return { els, hasU: !!env.U, missing: names.slice(0, n).filter((k, i) => !sets[i]) };
  }
  function setOperate(latex, lines) {
    const env = setDefs(lines);
    const seg = latex.replace(/=\s*$/, '');
    let toks = setTokens(seg);
    const eq = toks.findIndex((t) => t.k === '=');
    if (eq >= 0) toks = toks.slice(eq + 1);
    const r = setEval(toks, env);
    if (r.card !== undefined) return [math(seg + '=' + r.card)];
    return [math(seg + '=' + setLatex(r))];
  }

  return { vennEval, vennElements, normSetText, setOperate };
});
