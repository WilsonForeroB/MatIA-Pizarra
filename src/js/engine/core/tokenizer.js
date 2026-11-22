/* LaTeX → tokens (tokenize, splitEq, readName, isPureName) y afterArrows. (de pizarra.html, líneas 1124-1243, 1680-1698). */
MatIA.define('engine/core/tokenizer', ['engine/core/fraction-matrix'], ($fractionMatrix) => {
  'use strict';
  const { MErr } = $fractionMatrix;
  /* ---------- LaTeX → tokens ---------- */
  const SKIP = new Set([',', ';', '!', ':', ' ', 'quad', 'qquad', 'displaystyle', 'textstyle', 'left', 'right', 'big', 'Big', 'bigl', 'bigr', 'Bigl', 'Bigr', 'limits', 'mathstrut']);
  const GREEK = new Set(['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'varepsilon', 'lambda', 'mu', 'nu', 'theta', 'sigma', 'tau', 'phi', 'varphi', 'psi', 'omega', 'rho', 'kappa', 'eta', 'xi', 'zeta', 'chi', 'Gamma', 'Delta', 'Lambda', 'Sigma', 'Phi', 'Psi', 'Omega', 'Theta']);
  const FUNCS = { det: 'det', tr: 'tr', traza: 'tr', rg: 'rg', rang: 'rg', rank: 'rg', rango: 'rg' };

  function unwrap(src) {
    // \textcolor{c}{X} → X ; \boxed{X} → X ; \mathbf{X} → X ; \color{c} → ''; \operatorname{tr} → \tr
    const group = (s, i) => { // s[i] === '{'
      let d = 0;
      for (let j = i; j < s.length; j++) {
        if (s[j] === '\\') { j++; continue; }
        if (s[j] === '{') d++;
        else if (s[j] === '}' && --d === 0) return j;
      }
      return s.length - 1;
    };
    let out = '', i = 0;
    while (i < src.length) {
      const m = /^\\([a-zA-Z]+)\s*/.exec(src.slice(i));
      if (!m) { out += src[i++]; continue; }
      const name = m[1], after = i + m[0].length;
      if ((name === 'textcolor' || name === 'colorbox') && src[after] === '{') {
        const e1 = group(src, after);
        i = e1 + 1;
        continue; // el segundo grupo se queda como {X}
      }
      if (name === 'color' && src[after] === '{') { i = group(src, after) + 1; continue; }
      if (name === 'placeholder') throw new MErr('Hay huecos sin rellenar.');
      if (['boxed', 'mathbf', 'mathrm', 'mathit', 'mathsf', 'boldsymbol', 'bm', 'operatorname', 'mathop', 'text', 'textrm', 'textbf'].includes(name) && src[after] === '{') {
        const e = group(src, after);
        const inner = src.slice(after + 1, e).trim();
        if (FUNCS[inner]) out += '\\' + inner + ' ';
        else if (/^text/.test(name)) out += '\\text{' + inner + '}';
        else out += '{' + inner + '}';
        i = e + 1;
        continue;
      }
      out += src.slice(i, after);
      i = after;
    }
    return out;
  }
  function tokenize(src) {
    src = unwrap(src).replace(/(\d)\{,\}(\d)/g, '$1.$2');
    const t = [];
    let i = 0;
    while (i < src.length) {
      const c = src[i];
      if (/\s/.test(c)) { i++; continue; }
      if (c === '\\') {
        if (src[i + 1] === '\\') { t.push({ k: 'row' }); i += 2; continue; }
        const m = /^\\([a-zA-Z]+|.)/.exec(src.slice(i));
        const name = m[1];
        i += m[0].length;
        if (SKIP.has(name)) continue;
        if (name === '{' || name === 'lbrace') { t.push({ k: 'op', v: '(' }); continue; }
        if (name === '}' || name === 'rbrace') { t.push({ k: 'op', v: ')' }); continue; }
        if (name === 'lbrack') { t.push({ k: 'op', v: '[' }); continue; }
        if (name === 'rbrack') { t.push({ k: 'op', v: ']' }); continue; }
        if (name === 'vert' || name === 'lvert' || name === 'rvert' || name === '|') { t.push({ k: 'op', v: '|' }); continue; }
        if (name === 'text') { // \text{...} se ignora para el cálculo
          if (src[i] === '{') { let d = 0; for (; i < src.length; i++) { if (src[i] === '{') d++; else if (src[i] === '}' && --d === 0) { i++; break; } } }
          continue;
        }
        t.push({ k: 'cmd', v: name });
        continue;
      }
      if (/[0-9.]/.test(c)) {
        const m = /^(\d+\.?\d*|\.\d+)/.exec(src.slice(i));
        if (!m) { t.push({ k: 'op', v: c }); i++; continue; }
        t.push({ k: 'num', v: m[0] });
        i += m[0].length;
        continue;
      }
      if (/[a-zA-Z]/.test(c)) { t.push({ k: 'id', v: c }); i++; continue; }
      if (c === '&') { t.push({ k: 'amp' }); i++; continue; }
      if (c === '{' || c === '}') { t.push({ k: c }); i++; continue; }
      t.push({ k: 'op', v: c });
      i++;
    }
    return t;
  }
  const isOp = (t, v) => t && t.k === 'op' && t.v === v;
  const isCmd = (t, v) => t && t.k === 'cmd' && (v === undefined || t.v === v);

  // Divide la lista de tokens por '=' de nivel superior.
  function splitEq(toks) {
    const segs = [[]];
    let d = 0;
    for (const t of toks) {
      if (t.k === '{' || isCmd(t, 'begin')) d++;
      if (t.k === '}' || isCmd(t, 'end')) d--;
      if (d === 0 && isOp(t, '=')) { segs.push([]); continue; }
      segs[segs.length - 1].push(t);
    }
    // \begin y \end abren y cierran además un grupo {nombre}: el balance se compensa en ambos sentidos
    return segs;
  }

  // Lee un nombre (A, A_1, A_{12}, \lambda) a partir de pos; devuelve {key, latex, end} o null
  function readName(toks, pos) {
    const t = toks[pos];
    let base;
    if (t && t.k === 'id') base = t.v;
    else if (t && t.k === 'cmd' && GREEK.has(t.v)) base = '\\' + t.v;
    else return null;
    let end = pos + 1, sub = '';
    if (isOp(toks[end], '_')) {
      const n = toks[end + 1];
      if (n && n.k === '{') {
        let d = 0, j = end + 1;
        for (; j < toks.length; j++) { if (toks[j].k === '{') d++; else if (toks[j].k === '}' && --d === 0) break; }
        sub = toks.slice(end + 2, j).map((x) => (x.k === 'cmd' ? '\\' + x.v : x.v)).join('');
        end = j + 1;
      } else if (n) { sub = n.k === 'cmd' ? '\\' + n.v : n.v; end += 2; }
    }
    const latex = sub ? base + '_{' + sub + '}' : base;
    return { key: latex, latex, end };
  }
  function isPureName(seg) { const n = readName(seg, 0); return !!n && n.end === seg.length; }

  // Se queda con lo que hay tras la última flecha (\xrightarrow{..}, \sim, \to, \Rightarrow) de nivel superior
  function afterArrows(toks) {
    const ARR = ['xrightarrow', 'sim', 'to', 'rightarrow', 'Rightarrow', 'longrightarrow', 'Longrightarrow', 'approx'];
    let d = 0, start = 0;
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];
      if (t.k === '{' || isCmd(t, 'begin')) d++;
      if (t.k === '}' || isCmd(t, 'end')) d--;
      if (d !== 0 || !(t.k === 'cmd' && ARR.includes(t.v))) continue;
      let j = i + 1;
      if (t.v === 'xrightarrow') {
        if (isOp(toks[j], '[')) { while (j < toks.length && !isOp(toks[j], ']')) j++; j++; }
        if (toks[j] && toks[j].k === '{') { let e = 0; for (; j < toks.length; j++) { if (toks[j].k === '{') e++; else if (toks[j].k === '}' && --e === 0) break; } j++; }
      }
      start = j;
      i = j - 1;
    }
    return toks.slice(start);
  }

  return { FUNCS, GREEK, isOp, isCmd, readName, splitEq, tokenize, isPureName, afterArrows };
});
