/* Operaciones 9-11: derivadas, gráficas y extremos. (de pizarra.html, líneas 3287-3666). */
MatIA.define('engine/ops/analisis', ['engine/core', 'engine/ops/expr', 'engine/ops/common', 'engine/ops/poly', 'engine/ops/ecuaciones'], (ME, $expr, $common, $poly, $ecuaciones) => {
  'use strict';
  const { F, MErr, fLatex } = ME;
  const { ZERO, ONE, abs } = ME.fr;
  const { N, varsOf, simp, isNum, parseExpr, pickVar, toPoly, L, simpAll, evalNum, evalExact } = $expr;
  const { topEqIndex, derivBlock, fText, latexText, fNum } = $common;
  const { P, rationalRoots } = $poly;
  const { quadRootsLatex } = $ecuaciones;
  /* ====================== 9. Derivadas ====================== */
  function D(a, v, R) {
    const c0 = N.num(ZERO);
    const dep = (x) => varsOf(x).has(v);
    switch (a.t) {
      case 'num': case 'c': R.add('constante'); return c0;
      case 'var': if (a.n === v) { R.add('potencia'); return N.num(ONE); } R.add('constante'); return c0;
      case 'add': R.add('suma'); return N.add(D(a.a, v, R), D(a.b, v, R));
      case 'sub': R.add('suma'); return N.sub(D(a.a, v, R), D(a.b, v, R));
      case 'neg': return N.neg(D(a.a, v, R));
      case 'mul':
        if (!dep(a.a)) { R.add('constante por función'); return N.mul(a.a, D(a.b, v, R)); }
        if (!dep(a.b)) { R.add('constante por función'); return N.mul(D(a.a, v, R), a.b); }
        R.add('producto'); return N.add(N.mul(D(a.a, v, R), a.b), N.mul(a.a, D(a.b, v, R)));
      case 'div':
        if (!dep(a.b)) { R.add('constante por función'); return N.div(D(a.a, v, R), a.b); }
        R.add('cociente'); return N.div(N.sub(N.mul(D(a.a, v, R), a.b), N.mul(a.a, D(a.b, v, R))), N.pow(a.b, N.num(F(2))));
      case 'pow': {
        if (!dep(a.b)) {
          R.add('potencia'); const inner = D(a.a, v, R);
          if (!(a.a.t === 'var' && a.a.n === v)) R.add('cadena');
          return N.mul(N.mul(a.b, N.pow(a.a, simp(N.sub(a.b, N.num(ONE))))), inner);
        }
        if (!dep(a.a)) {
          R.add('exponencial'); const inner = D(a.b, v, R);
          if (!(a.b.t === 'var')) R.add('cadena');
          const lnb = a.a.t === 'c' && a.a.n === 'e' ? N.num(ONE) : N.fn('ln', a.a);
          return N.mul(N.mul(a, lnb), inner);
        }
        R.add('derivación logarítmica');
        return N.mul(a, D(N.mul(a.b, N.fn('ln', a.a)), v, R));
      }
      case 'fn': {
        const u = a.a, du = D(u, v, R);
        if (!(u.t === 'var' && u.n === v)) R.add('cadena');
        const two = N.num(F(2));
        let d;
        switch (a.f) {
          case 'sin': R.add('trigonométricas'); d = N.fn('cos', u); break;
          case 'cos': R.add('trigonométricas'); d = N.neg(N.fn('sin', u)); break;
          case 'tan': R.add('trigonométricas'); d = N.div(N.num(ONE), N.pow(N.fn('cos', u), two)); break;
          case 'cot': R.add('trigonométricas'); d = N.neg(N.div(N.num(ONE), N.pow(N.fn('sin', u), two))); break;
          case 'sec': R.add('trigonométricas'); d = N.mul(N.fn('sec', u), N.fn('tan', u)); break;
          case 'csc': R.add('trigonométricas'); d = N.neg(N.mul(N.fn('csc', u), N.fn('cot', u))); break;
          case 'arcsin': R.add('trigonométricas inversas'); d = N.div(N.num(ONE), N.pow(N.sub(N.num(ONE), N.pow(u, two)), N.num(F(1, 2)))); break;
          case 'arccos': R.add('trigonométricas inversas'); d = N.neg(N.div(N.num(ONE), N.pow(N.sub(N.num(ONE), N.pow(u, two)), N.num(F(1, 2))))); break;
          case 'arctan': R.add('trigonométricas inversas'); d = N.div(N.num(ONE), N.add(N.num(ONE), N.pow(u, two))); break;
          case 'ln': R.add('logaritmo'); d = N.div(N.num(ONE), u); break;
          case 'log': R.add('logaritmo'); d = N.div(N.num(ONE), N.mul(u, N.fn('ln', N.num(F(10))))); break;
          case 'exp': R.add('exponencial'); d = N.fn('exp', u); break;
          case 'sinh': d = N.fn('cosh', u); break;
          case 'cosh': d = N.fn('sinh', u); break;
          case 'tanh': d = N.div(N.num(ONE), N.pow(N.fn('cosh', u), two)); break;
          case 'abs': R.add('valor absoluto'); d = N.div(u, N.fn('abs', u)); break;
          default: throw new MErr('No sé derivar esa función.');
        }
        return isNum(du, 1) ? d : N.mul(d, du);
      }
      default: throw new MErr('No sé derivar esta expresión.');
    }
  }
  /* Texto plano y variantes → LaTeX que entiende parseExpr: sen x, sin(x), sqrt(x), pi, exp(u), x^(1/2), x^-2… No toca el LaTeX ya válido. */
  const FN_WORDS = { sin: 'sin', sen: 'sin', cos: 'cos', tan: 'tan', tg: 'tan', cot: 'cot', ctg: 'cot', cotg: 'cot', sec: 'sec', csc: 'csc', cosec: 'csc', arcsin: 'arcsin', arcsen: 'arcsin', arccos: 'arccos', arctan: 'arctan', arctg: 'arctan', sinh: 'sinh', senh: 'sinh', cosh: 'cosh', tanh: 'tanh', tgh: 'tanh', ln: 'ln', log: 'log', exp: 'exp', sqrt: 'sqrt', raiz: 'sqrt', abs: 'abs', pi: 'pi' };
  const FN_ALIAS = new Set(['sen', 'tg', 'ctg', 'cotg', 'cosec', 'arcsen', 'arctg', 'senh', 'tgh', 'raiz']);
  function closeParen(s, j) {
    let d = 0;
    for (let k = j; k < s.length; k++) { if (s[k] === '(') d++; else if (s[k] === ')' && --d === 0) return k; }
    return -1;
  }
  function normalizeFn(src) {
    let s = String(src).replace(/\\(?:operatorname|mathrm|mathit|textrm|text)\s*\{\s*([A-Za-z]+)\s*\}/g, (m, w) => (FN_WORDS[w.toLowerCase()] && w.toLowerCase() !== 'pi' ? '\\' + FN_WORDS[w.toLowerCase()] + ' ' : m));
    s = s.replace(/π/g, '\\pi ').replace(/[·×]/g, '\\cdot ');
    let out = '', i = 0;
    const skipSp = (j) => { while (s[j] === ' ') j++; return j; };
    const word = (canon, bs, len) => {
      i += len;
      const sp = /[A-Za-z0-9\\]/.test(s[i] || '') ? ' ' : '';
      const j = skipSp(i);
      if (canon === 'sqrt') {
        if (s[j] === '(') { const c = closeParen(s, j); if (c > 0) { out += '\\sqrt{' + normalizeFn(s.slice(j + 1, c)) + '}'; i = c + 1; return; } }
        else if (s[j] !== '{' && s[j] !== '[') {
          const m = /^(\d+(?:\.\d+)?|\\[A-Za-z]+|pi\b|[A-Za-z])/.exec(s.slice(j));
          if (m) { out += '\\sqrt{' + normalizeFn(m[1]) + '}'; i = j + m[1].length; return; }
        }
        out += '\\sqrt'; return;
      }
      if (canon === 'exp' && s[j] === '(') { const c = closeParen(s, j); if (c > 0) { out += 'e^{' + normalizeFn(s.slice(j + 1, c)) + '}'; i = c + 1; return; } }
      if (canon === 'abs' && s[j] === '(') { const c = closeParen(s, j); if (c > 0) { out += '\\left|' + normalizeFn(s.slice(j + 1, c)) + '\\right|'; i = c + 1; return; } }
      if (canon === 'abs') { out += 'abs'; return; }
      out += '\\' + canon + (bs ? '' : sp);
    };
    while (i < s.length) {
      const c = s[i];
      if (c === '\\') {
        const m = /^\\([A-Za-z]+)/.exec(s.slice(i));
        if (!m) { out += s.slice(i, i + 2); i += 2; continue; }
        const w = m[1];
        if (FN_ALIAS.has(w) || w === 'sqrt' || w === 'exp') word(FN_WORDS[w], true, m[0].length);
        else { out += m[0]; i += m[0].length; }
      } else if (/[A-Za-z]/.test(c)) {
        const m = /^[A-Za-z]+/.exec(s.slice(i)), w = m[0], canon = FN_WORDS[w.toLowerCase()];
        if (canon && w.length >= 2) word(canon, false, w.length);
        else { out += w; i += w.length; }
      } else if (c === '^') {
        const t = s[i + 1];
        let m;
        if (t === '(') { const e = closeParen(s, i + 1); if (e > 0) { out += '^{(' + normalizeFn(s.slice(i + 2, e)) + ')}'; i = e + 1; continue; } }
        else if (t === '-' && s[i + 2] === '(') { const e = closeParen(s, i + 2); if (e > 0) { out += '^{-(' + normalizeFn(s.slice(i + 3, e)) + ')}'; i = e + 1; continue; } }
        else if (t === '-' && (m = /^-(\d+(?:\.\d+)?|[A-Za-z])/.exec(s.slice(i + 1)))) { out += '^{-' + m[1] + '}'; i += 1 + m[0].length; continue; }
        out += c; i++;
      } else { out += c; i++; }
    }
    return out;
  }
  function funcLine(latex) {
    latex = normalizeFn(latex);
    // "f(x)=expr", "y=expr" o solo "expr"
    const i = topEqIndex(latex);
    let name = null, varName = null, expr = latex;
    if (i >= 0) {
      const lhs = latex.slice(0, i).replace(/\s/g, '');
      const m = /^([a-zA-Z])(?:\\left)?\(([a-zA-Z])(?:\\right)?\)$/.exec(lhs);
      if (m) { name = m[1]; varName = m[2]; expr = latex.slice(i + 1); }
      else if (/^[a-zA-Z]$/.test(lhs)) { name = lhs; expr = latex.slice(i + 1); }
    }
    const ast = parseExpr(expr, { var: varName || 'x' });
    const v = varName || pickVar(ast);
    return { name, v, ast, expr };
  }
  function polish(a, v) {
    try { const p = toPoly(a, v); return { t: 'raw', s: P.latex(p, v) }; } catch (e) { /* no es polinomio */ }
    if (a.t === 'div') { try { const p = toPoly(a.a, v); return { t: 'raw', s: '\\frac{' + P.latex(p, v) + '}{' + L(a.b) + '}' }; } catch (e) { /* */ } }
    return a;
  }
  const RULE_TXT = { constante: 'constante', potencia: 'potencia', suma: 'suma', 'constante por función': 'constante por función', producto: 'producto', cociente: 'cociente', cadena: 'cadena', exponencial: 'exponencial', logaritmo: 'logaritmo', 'trigonométricas': 'trigonométricas', 'trigonométricas inversas': 'trigonométricas inversas', 'derivación logarítmica': 'derivación logarítmica', 'valor absoluto': 'valor absoluto' };
  function derivative(latex) {
    const { name, v, ast } = funcLine(latex.replace(/=\s*$/, ''));
    const R = new Set();
    const raw = D(ast, v, R);
    const half = simp(raw);
    const full = polish(simpAll(raw), v);
    const lhs = name && name.length === 1 && name !== 'y' ? name + "'(" + v + ')' : name === 'y' ? "y'" : '\\frac{d}{d' + v + '}\\left(' + L(ast) + '\\right)';
    const rules = [...R].filter((r) => r !== 'constante' || R.size === 1).map((r) => RULE_TXT[r] || r);
    const rows = [{ l: lhs, r: L(half), note: 'Reglas: ' + rules.join(', ') }];
    if (L(full) !== L(half)) rows.push({ r: L(full), note: 'Simplificamos' });
    rows[rows.length - 1].boxed = true;
    if (name && name !== 'y') rows.unshift({ l: name + '(' + v + ')', r: L(ast), note: 'Función' });
    return [derivBlock(rows)];
  }

  /* ====================== 10. Gráficas y tablas de valores ====================== */
  function compileFn(latex) {
    const { name, v, ast } = funcLine(latex);
    const others = [...varsOf(ast)].filter((x) => x !== v);
    if (others.length) throw new MErr('La función tiene otras letras (' + others.join(', ') + ').');
    return { name: name || 'f', v, ast, latex: L(ast), f: (x) => { try { return evalNum(ast, { [v]: x }); } catch (e) { return NaN; } } };
  }
  function graphOf(latex) {
    const parts = latex.split(/;|\\;/).map((s) => s.trim()).filter(Boolean);
    const fns = parts.map((p) => { compileFn(p); return p; });
    return [{ type: 'graph', fns, xmin: -5, xmax: 5 }];
  }
  function valueTable(latex) {
    const F0 = compileFn(latex.replace(/=\s*$/, ''));
    const xs = [-3, -2, -1, 0, 1, 2, 3];
    const vals = xs.map((x) => {
      try { const e = evalExact(F0.ast, { [F0.v]: F(x) }); return fText(e); }
      catch (err) { const y = F0.f(x); return Number.isFinite(y) ? (Math.round(y * 1000) / 1000).toString().replace('.', ',') : '—'; }
    });
    const nm = F0.name === 'y' ? 'y' : F0.name + '(' + F0.v + ')';
    return [{ type: 'table', rows: [[F0.v.replace('\\', '')].concat(xs.map(String)), [nm].concat(vals)], vbar: 1, kind: 'values', caption: 'Tabla de valores de ' + nm + ' = ' + F0.latex.replace(/\\left|\\right|\\cdot/g, '').replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)').replace(/[{}\\]/g, '') }];
  }

  /* ====================== 11. Máximos, mínimos y puntos de silla ====================== */
  // número → LaTeX: exacto si es (casi) una fracción sencilla, si no con 4 decimales
  function numL(v) {
    if (!Number.isFinite(v)) return '\\text{—}';
    for (let q = 1; q <= 12; q++) { const p0 = Math.round(v * q); if (Math.abs(p0 / q - v) < 1e-9) return fLatex(F(p0, q)); }
    // múltiplos sencillos de π
    for (let q = 1; q <= 12; q++) {
      const p0 = Math.round(v / Math.PI * q);
      if (p0 !== 0 && Math.abs(p0 * Math.PI / q - v) < 1e-9) {
        const r = F(p0, q), n = abs(r.n), sg = r.n < 0n ? '-' : '';
        return r.d === 1n ? sg + (n === 1n ? '' : n) + '\\pi ' : sg + '\\frac{' + (n === 1n ? '' : n) + '\\pi}{' + r.d + '}';
      }
    }
    return (Math.round(v * 1e4) / 1e4).toString();
  }
  const isNice = (v) => { for (let q = 1; q <= 12; q++) { if (Math.abs(Math.round(v * q) / q - v) < 1e-9) return true; const p0 = Math.round(v / Math.PI * q); if (p0 !== 0 && Math.abs(p0 * Math.PI / q - v) < 1e-9) return true; } return false; };
  const numT = (v) => latexText(numL(v)).replace(/pi\s*/g, 'π').replace('.', ',').replace(/^-/, '−');
  function rootsNumeric(fn, a, b) {
    const n = 4000, out = [];
    let px = a, py = fn(a);
    for (let i = 1; i <= n; i++) {
      const x = a + (b - a) * i / n, y = fn(x);
      if (Number.isFinite(py) && Number.isFinite(y)) {
        if (py === 0) out.push(px);
        else if (py * y < 0 && Math.abs(py) < 1e6 && Math.abs(y) < 1e6) {
          let lo = px, hi = x, flo = py;
          for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2, fm = fn(m); if (!Number.isFinite(fm)) break; if (flo * fm <= 0) hi = m; else { lo = m; flo = fm; } }
          out.push((lo + hi) / 2);
        }
      }
      px = x; py = y;
    }
    const u = [];
    for (const r of out) if (!u.some((t) => Math.abs(t - r) < 1e-7)) u.push(r);
    return u;
  }
  // ceros de una expresión en una variable: exactos si es polinomio, numéricos si no
  function zerosOf(ast, v, a, b) {
    if (ast.t === 'div') {
      const den = (x) => { try { return evalNum(ast.b, { [v]: x }); } catch (e) { return NaN; } };
      const r = zerosOf(ast.a, v, a, b);
      r.pts = r.pts.filter((c) => Math.abs(den(c.x)) > 1e-12);
      return r;
    }
    if (ast.t === 'neg') return zerosOf(ast.a, v, a, b);
    try {
      const pp = toPoly(ast, v);
      if (P.deg(pp) < 1) return { pts: [], exact: true, zeroPoly: P.isZero(pp) };
      const { roots, rest } = rationalRoots(pp);
      const pts = [];
      const seen = new Set();
      for (const r of roots) { const k = fText(r); if (seen.has(k)) continue; seen.add(k); pts.push({ x: fNum(r), latex: fLatex(r), exact: r }); }
      if (P.deg(rest) === 2) {
        const [c, bb, aa] = rest.map(fNum);
        const D0 = bb * bb - 4 * aa * c;
        if (D0 >= 0) {
          const ls = quadRootsLatex(rest, v, false).map((t) => t.split('=').slice(1).join('='));
          const xs = [(-bb + Math.sqrt(D0)) / (2 * aa), (-bb - Math.sqrt(D0)) / (2 * aa)];
          xs.forEach((x, i) => { if (!pts.some((q) => Math.abs(q.x - x) < 1e-9)) pts.push({ x, latex: ls[i] || numL(x) }); });
        }
      } else if (P.deg(rest) > 2) {
        const g = (x) => rest.reduceRight((s0, c0) => s0 * x + fNum(c0), 0);
        rootsNumeric(g, a, b).forEach((x) => pts.push({ x, latex: numL(x), approx: !isNice(x) }));
      }
      return { pts: pts.sort((p1, p2) => p1.x - p2.x), exact: true };
    } catch (e) {
      const fn = (x) => { try { return evalNum(ast, { [v]: x }); } catch (err) { return NaN; } };
      return { pts: rootsNumeric(fn, a, b).map((x) => ({ x, latex: numL(x), approx: !isNice(x) })), exact: false };
    }
  }
  function parseInterval(latex) {
    const m = /,?\s*(?:\\[,;: ]|\\quad|\s)*\s*([a-z])\s*\\in\s*(?:\\left)?\[\s*(.+?)\s*,\s*(.+?)\s*(?:\\right)?\]\s*$/.exec(latex);
    if (!m) return { main: latex, iv: null };
    const val = (t) => { const v = evalNum(parseExpr(t), {}); if (!Number.isFinite(v)) throw new MErr('Intervalo no válido.'); return v; };
    const a = val(m[2]), b = val(m[3]);
    if (!(b > a)) throw new MErr('En el intervalo [a, b] debe ser a < b.');
    return { main: latex.slice(0, m.index), iv: [a, b], ivL: '\\left[' + m[2] + ',\\ ' + m[3] + '\\right]' };
  }
  function extrema1(latex) {
    const { main, iv, ivL } = parseInterval(latex.replace(/=\s*$/, '').trim());
    const { name, v, ast } = funcLine(main);
    const others = [...varsOf(ast)].filter((x) => x !== v);
    if (others.length) throw new MErr('La función tiene otras letras (' + others.join(', ') + '). Para f(x, y) usa «Extremos de f(x, y)».');
    const nm = name && name !== 'y' ? name : 'f';
    const f = (x) => { try { return evalNum(ast, { [v]: x }); } catch (e) { return NaN; } };
    const d1 = simpAll(D(ast, v, new Set())), d2 = simpAll(D(d1, v, new Set()));
    const f1 = (x) => { try { return evalNum(d1, { [v]: x }); } catch (e) { return NaN; } };
    const f2 = (x) => { try { return evalNum(d2, { [v]: x }); } catch (e) { return NaN; } };
    const A = iv ? iv[0] : -50, B = iv ? iv[1] : 50;
    const inside = (x) => x >= A - 1e-12 && x <= B + 1e-12 && (!iv || (x > A + 1e-12 && x < B - 1e-12));
    const crit = zerosOf(d1, v, A, B);
    if (crit.zeroPoly) throw new MErr('La función es constante: todos sus puntos son a la vez máximos y mínimos.');
    const cps = crit.pts.filter((c) => inside(c.x) && Number.isFinite(f(c.x)));
    const yAt = (c) => { if (c.exact) { try { return { y: fNum(evalExact(ast, { [v]: c.exact })), latex: fLatex(evalExact(ast, { [v]: c.exact })) }; } catch (e) { /* no exacto */ } } const y = f(c.x); return { y, latex: (isNice(y) ? '' : '\\approx ') + numL(y) }; };
    const fp = (lab) => nm + "'" + '\\left(' + lab + '\\right)', fpp = (lab) => nm + "''" + '\\left(' + lab + '\\right)';
    const rows = [
      { l: nm + '(' + v + ')', r: L(ast), note: 'Función' + (iv ? ' en el intervalo ' + latexText(ivL) : '') },
      { l: nm + "'(" + v + ')', r: L(polish(d1, v)), note: 'Derivamos' },
    ];
    if (!cps.length) rows.push({ l: L(polish(d1, v)), r: '0', note: 'No tiene solución' + (iv ? ' dentro del intervalo' : '') + ': no hay puntos críticos' });
    else {
      rows.push({ l: L(polish(d1, v)), r: '0', note: 'Puntos críticos: anulamos la derivada' + (cps.some((c) => c.approx) ? ' (soluciones aproximadas)' : '') });
      rows.push({ l: v, r: cps.map((c) => (c.approx ? '\\approx ' : '') + c.latex).join(',\\quad '), note: cps.length === 1 ? 'Un punto crítico' : cps.length + ' puntos críticos' });
      rows.push({ l: nm + "''(" + v + ')', r: L(polish(d2, v)), note: 'Segunda derivada para clasificarlos' });
    }
    const marks = [];
    const ext = [];
    for (const c of cps) {
      const s2 = f2(c.x);
      const { y, latex: yL } = yAt(c);
      const pL = '\\left(' + c.latex + ',\\ ' + yL.replace('\\approx ', '') + '\\right)';
      let kind, note;
      if (Number.isFinite(s2) && Math.abs(s2) > 1e-9) {
        kind = s2 > 0 ? 'min' : 'max';
        rows.push({ l: fpp(c.latex), r: numL(s2) + (s2 > 0 ? '>0' : '<0'), note: (kind === 'min' ? 'Mínimo relativo' : 'Máximo relativo') + ' en (' + (c.approx ? '≈' : '') + numT(c.x) + ', ' + (isNice(y) ? '' : '≈') + numT(y) + ')' });
      } else {
        const h = 1e-4 * Math.max(1, Math.abs(c.x)), a1 = f1(c.x - h), b1 = f1(c.x + h);
        kind = a1 > 0 && b1 < 0 ? 'max' : a1 < 0 && b1 > 0 ? 'min' : 'flat';
        rows.push({ l: fpp(c.latex), r: '0', note: 'f″ = 0: miramos el signo de f′ a los lados (' + (a1 > 0 ? '+' : '−') + ' | ' + (b1 > 0 ? '+' : '−') + '): ' + (kind === 'max' ? 'máximo relativo' : kind === 'min' ? 'mínimo relativo' : 'no es extremo (punto de inflexión con tangente horizontal)') });
      }
      ext.push({ x: c.x, y, kind, xL: c.latex, yL, pL });
      marks.push({ x: c.x, y, kind: kind === 'flat' ? 'infl' : kind, label: (kind === 'max' ? 'máx' : kind === 'min' ? 'mín' : 'infl') + ' (' + numT(c.x) + ', ' + numT(y) + ')' });
    }
    // puntos de inflexión (cambio de concavidad)
    const infl = zerosOf(d2, v, A, B).pts.filter((c) => inside(c.x) && Number.isFinite(f(c.x)) && !cps.some((q) => Math.abs(q.x - c.x) < 1e-7));
    const realInfl = infl.filter((c) => { const h = 1e-4 * Math.max(1, Math.abs(c.x)); return f2(c.x - h) * f2(c.x + h) < 0; });
    if (realInfl.length) {
      rows.push({ l: nm + "''(" + v + ')', r: '0\\Rightarrow ' + realInfl.map((c) => v + (c.approx ? '\\approx ' : '=') + c.latex).join(',\\ '), note: 'Puntos de inflexión: f″ cambia de signo (cambia la concavidad)' });
      for (const c of realInfl) { const { y } = yAt(c); marks.push({ x: c.x, y, kind: 'infl', label: 'infl (' + numT(c.x) + ', ' + numT(y) + ')' }); }
    }
    // extremos absolutos
    if (iv) {
      const cand = [{ x: A, y: f(A), xL: numL(A) }, { x: B, y: f(B), xL: numL(B) }].concat(ext.map((e) => ({ x: e.x, y: e.y, xL: e.xL })));
      const ok = cand.filter((c) => Number.isFinite(c.y));
      if (ok.length) {
        const mx = ok.reduce((p0, q) => (q.y > p0.y ? q : p0)), mn = ok.reduce((p0, q) => (q.y < p0.y ? q : p0));
        rows.push({ l: nm + '(' + numL(A) + '),\\ ' + nm + '(' + numL(B) + ')', r: numL(f(A)) + ',\\ ' + numL(f(B)), note: 'Valores en los extremos del intervalo' });
        const tie = (t) => ok.filter((c) => Math.abs(c.y - t.y) < 1e-9 * Math.max(1, Math.abs(t.y)));
        const mxs = tie(mx), mns = tie(mn);
        rows.push({ l: '\\text{Máx. absoluto}', r: nm + '=' + numL(mx.y) + '\\ \\text{en}\\ ' + mxs.map((c) => v + '=' + c.xL).join(',\\ '), note: 'El mayor valor entre puntos críticos y extremos del intervalo' + (mxs.length > 1 ? ' (se alcanza en varios puntos)' : ''), boxed: true });
        rows.push({ l: '\\text{Mín. absoluto}', r: nm + '=' + numL(mn.y) + '\\ \\text{en}\\ ' + mns.map((c) => v + '=' + c.xL).join(',\\ '), note: 'El menor valor' + (mns.length > 1 ? ' (se alcanza en varios puntos)' : ''), boxed: true });
        mxs.forEach((c) => marks.push({ x: c.x, y: c.y, kind: 'absmax', label: 'máx abs' }));
        mns.forEach((c) => marks.push({ x: c.x, y: c.y, kind: 'absmin', label: 'mín abs' }));
      }
    } else {
      const lim = (sg) => { const a1 = f(sg * 1e3), a2 = f(sg * 1e4), a3 = f(sg * 1e5); if (![a1, a2, a3].every(Number.isFinite)) return Math.abs(a3) === Infinity ? a3 : NaN; if (Math.abs(a3) > 1e6 && Math.abs(a3) > Math.abs(a2)) return a3 > 0 ? Infinity : -Infinity; if (Math.abs(a3 - a2) < 1e-3 * Math.max(1, Math.abs(a3))) return a3; return NaN; };
      const lp = lim(1), lm = lim(-1);
      const limT = (L0) => (L0 === Infinity ? '+\\infty' : L0 === -Infinity ? '-\\infty' : Number.isNaN(L0) ? '\\nexists' : numL(L0));
      rows.push({ l: '\\lim_{' + v + '\\to\\pm\\infty}' + nm + '(' + v + ')', r: limT(lm) + ',\\ ' + limT(lp), note: 'Comportamiento en ±∞ para decidir los extremos absolutos' });
      const maxs = ext.filter((e) => e.kind === 'max'), mins = ext.filter((e) => e.kind === 'min');
      const absL = [];
      const decide = (list, better, infBad, word) => {
        const res = decide0(list, better, infBad, word);
        absL.push(res.ok ? '\\text{' + (word === 'máximo' ? 'máx' : 'mín') + ' abs.}\\ ' + res.ok : '\\nexists\\ \\text{' + (word === 'máximo' ? 'máx' : 'mín') + ' abs.}');
        return res.t;
      };
      const decide0 = (list, better, infBad, word) => {
        if (lp === infBad || lm === infBad) return { t: 'No tiene ' + word + ' absoluto: la función tiende a ' + (infBad > 0 ? '+∞' : '−∞') };
        if (Number.isNaN(lp) || Number.isNaN(lm)) return { t: 'No se puede decidir el ' + word + ' absoluto (la función no tiene límite en el infinito)' };
        if (!list.length) return { t: 'No tiene ' + word + ' absoluto (no hay ' + word + 's relativos)' };
        const best = list.reduce((p0, q) => (better(q.y, p0.y) ? q : p0));
        const limBest = [lp, lm].every((L0) => !better(L0, best.y) && L0 !== best.y) ? true : [lp, lm].every((L0) => !better(L0, best.y));
        if (!limBest) return { t: 'No tiene ' + word + ' absoluto: la función se acerca a un valor mejor en el infinito' };
        marks.push({ x: best.x, y: best.y, kind: word === 'máximo' ? 'absmax' : 'absmin', label: word === 'máximo' ? 'máx abs' : 'mín abs' });
        return { t: word.charAt(0).toUpperCase() + word.slice(1) + ' absoluto en (' + numT(best.x) + ', ' + (isNice(best.y) ? '' : '≈') + numT(best.y) + ')', ok: '\\left(' + numL(best.x) + ',\\ ' + numL(best.y) + '\\right)' };
      };
      const nAbs = decide(maxs, (a1, b1) => a1 > b1, Infinity, 'máximo') + '. ' + decide(mins, (a1, b1) => a1 < b1, -Infinity, 'mínimo') + '.';
      rows.push({ l: '\\text{Absolutos}', r: absL.join(',\\quad '), note: nAbs, boxed: absL.some((t) => !/nexists/.test(t)) });
    }
    // tabla de crecimiento
    const cuts = cps.map((c) => c.x);
    const lo = iv ? A : -Infinity, hi = iv ? B : Infinity;
    const bounds = [lo].concat(cuts, [hi]);
    const head = [v.replace('\\', '')], r1 = [nm + "′(" + v + ')'], r2 = [nm + '(' + v + ')'];
    const fmtB = (x) => (x === -Infinity ? '−∞' : x === Infinity ? '+∞' : numT(x));
    for (let i = 0; i < bounds.length - 1; i++) {
      const a1 = bounds[i], b1 = bounds[i + 1];
      const mid = a1 === -Infinity ? (b1 === Infinity ? 0 : b1 - 1) : b1 === Infinity ? a1 + 1 : (a1 + b1) / 2;
      const s1 = f1(mid);
      head.push((a1 === lo && iv ? '[' : '(') + fmtB(a1) + ', ' + fmtB(b1) + (b1 === hi && iv ? ']' : ')'));
      r1.push(!Number.isFinite(s1) ? '∄' : s1 > 0 ? '+' : s1 < 0 ? '−' : '0');
      r2.push(!Number.isFinite(s1) ? '—' : s1 > 0 ? '↗ crece' : s1 < 0 ? '↘ decrece' : '→');
      if (i < cuts.length) { const e = ext[i]; head.push(fmtB(cuts[i])); r1.push('0'); r2.push(e.kind === 'max' ? 'máx' : e.kind === 'min' ? 'mín' : '—'); }
    }
    const table = { type: 'table', head, rows: [r1, r2], vbar: 1, kind: 'mono', caption: 'Crecimiento y decrecimiento de ' + nm + '(' + v + ')' };
    // gráfica con los puntos marcados
    const xsP = marks.map((m) => m.x);
    let gx0 = -5, gx1 = 5;
    if (iv) { const pad = (B - A) * 0.08; gx0 = A - pad; gx1 = B + pad; }
    else if (xsP.length) { const a1 = Math.min(...xsP), b1 = Math.max(...xsP), span = Math.max(4, (b1 - a1) * 1.6); gx0 = (a1 + b1) / 2 - span / 2; gx1 = (a1 + b1) / 2 + span / 2; }
    const graph = { type: 'graph', fns: [main.trim().replace(/\\left|\\right/g, '')], xmin: +gx0.toFixed(3), xmax: +gx1.toFixed(3), marks: marks.filter((m) => Number.isFinite(m.y)) };
    return [derivBlock(rows), table, graph];
  }

  function extrema2(latex) {
    let src = latex.replace(/=\s*$/, '').trim();
    const m = /^\s*(z|f\s*(\\left)?\(\s*x\s*,\s*y\s*(\\right)?\))\s*=/.exec(src);
    const rhs = m ? src.slice(m[0].length) : src;
    const ast = parseExpr(rhs, { var: 'x' });
    const vs = [...varsOf(ast)];
    const bad = vs.filter((t) => t !== 'x' && t !== 'y');
    if (bad.length) throw new MErr('Solo puede depender de x e y (sobra ' + bad.join(', ') + ').');
    if (!vs.includes('y')) throw new MErr('La función no depende de y: usa «Máximos y mínimos de f(x)».');
    const R0 = new Set();
    const fx = simpAll(D(ast, 'x', R0)), fy = simpAll(D(ast, 'y', R0));
    const fxx = simpAll(D(fx, 'x', R0)), fxy = simpAll(D(fx, 'y', R0)), fyy = simpAll(D(fy, 'y', R0));
    const ev = (a, x, y) => { try { return evalNum(a, { x, y }); } catch (e) { return NaN; } };
    // Newton desde una rejilla de puntos iniciales
    const sols = [];
    for (let i = -6; i <= 6; i += 1.5) for (let j = -6; j <= 6; j += 1.5) {
      let x = i + 0.013, y = j - 0.017;
      for (let k = 0; k < 60; k++) {
        const gx = ev(fx, x, y), gy = ev(fy, x, y);
        if (!Number.isFinite(gx) || !Number.isFinite(gy)) break;
        if (Math.hypot(gx, gy) < 1e-12) break;
        const a = ev(fxx, x, y), bq = ev(fxy, x, y), d = ev(fyy, x, y);
        const det = a * d - bq * bq;
        if (!Number.isFinite(det) || Math.abs(det) < 1e-14) { x -= 0.1 * gx; y -= 0.1 * gy; continue; }
        x -= (d * gx - bq * gy) / det; y -= (-bq * gx + a * gy) / det;
        if (Math.abs(x) > 1e4 || Math.abs(y) > 1e4) break;
      }
      const gx = ev(fx, x, y), gy = ev(fy, x, y);
      if (Number.isFinite(gx) && Math.hypot(gx, gy) < 1e-8 && Math.abs(x) < 1e3 && Math.abs(y) < 1e3) {
        // redondeo a valores sencillos si siguen siendo críticos
        const snap = (t) => { for (let q = 1; q <= 12; q++) { const p0 = Math.round(t * q) / q; if (Math.abs(p0 - t) < 1e-6) return p0; } return t; };
        const sx = snap(x), sy = snap(y);
        if (Math.hypot(ev(fx, sx, sy), ev(fy, sx, sy)) < 1e-9) { x = sx; y = sy; }
        if (!sols.some((q) => Math.hypot(q.x - x, q.y - y) < 1e-5)) sols.push({ x, y });
      }
    }
    sols.sort((p1, p2) => p1.x - p2.x || p1.y - p2.y);
    const approx = sols.some((q) => !isNice(q.x) || !isNice(q.y));
    const rows = [
      { l: 'f(x,y)', r: L(ast), note: 'Función de dos variables' },
      { l: 'f_{x}', r: L(fx), note: 'Derivada parcial respecto de x' },
      { l: 'f_{y}', r: L(fy), note: 'Derivada parcial respecto de y' },
      { l: '\\nabla f', r: '0\\Rightarrow\\begin{cases}' + L(fx) + '=0\\\\ ' + L(fy) + '=0\\end{cases}', note: 'Puntos críticos: anulamos el gradiente' },
    ];
    if (!sols.length) rows.push({ l: '\\text{Puntos críticos}', r: '\\emptyset', note: 'No hay puntos críticos en la zona estudiada (|x|, |y| ≤ 6 como punto de partida)' });
    else rows.push({ l: '\\text{Puntos críticos}', r: sols.map((q, i) => 'P_{' + (i + 1) + '}=' + (approx && (!isNice(q.x) || !isNice(q.y)) ? '\\approx ' : '') + '\\left(' + numL(q.x) + ',\\ ' + numL(q.y) + '\\right)').join(',\\quad '), note: approx ? 'Soluciones aproximadas (método de Newton)' : 'Soluciones del sistema' });
    rows.push({ l: 'H(x,y)', r: '\\begin{pmatrix}' + L(fxx) + ' & ' + L(fxy) + '\\\\ ' + L(fxy) + ' & ' + L(fyy) + '\\end{pmatrix}', note: 'Matriz hessiana: f_xx, f_xy / f_yx, f_yy' });
    const marks = [];
    sols.forEach((q, i) => {
      const a = ev(fxx, q.x, q.y), bq = ev(fxy, q.x, q.y), d = ev(fyy, q.x, q.y), det = a * d - bq * bq, z = ev(ast, q.x, q.y);
      let kind, txt;
      if (Math.abs(det) < 1e-9) { kind = 'deg'; txt = '|H| = 0: el criterio no decide (caso dudoso)'; }
      else if (det < 0) { kind = 'saddle'; txt = '|H| < 0: punto de silla'; }
      else if (a > 0) { kind = 'min'; txt = '|H| > 0 y f_xx > 0: mínimo relativo'; }
      else { kind = 'max'; txt = '|H| > 0 y f_xx < 0: máximo relativo'; }
      rows.push({ l: '|H(P_{' + (i + 1) + '})|', r: '\\begin{vmatrix}' + numL(a) + ' & ' + numL(bq) + '\\\\ ' + numL(bq) + ' & ' + numL(d) + '\\end{vmatrix}=' + numL(det), note: txt + '. f(P' + (i + 1) + ') = ' + numT(z), boxed: kind !== 'deg' });
      marks.push({ x: q.x, y: q.y, z, kind, label: 'P' + (i + 1) + ' ' + (kind === 'min' ? 'mín' : kind === 'max' ? 'máx' : kind === 'saddle' ? 'silla' : '¿?') });
    });
    rows.push({ l: '\\text{Absolutos}', r: '\\text{en un recinto cerrado}', note: 'Los extremos absolutos de f(x, y) se estudian en un recinto cerrado y acotado: además de los puntos críticos interiores hay que mirar la frontera.' });
    const xs = sols.map((q) => q.x), ys = sols.map((q) => q.y);
    const span = (arr) => (arr.length ? [Math.min(...arr), Math.max(...arr)] : [0, 0]);
    const [ax0, ax1] = span(xs), [ay0, ay1] = span(ys);
    const hx = Math.max(2.5, (ax1 - ax0) * 0.8), hy = Math.max(2.5, (ay1 - ay0) * 0.8);
    const cxm = (ax0 + ax1) / 2, cym = (ay0 + ay1) / 2;
    const g3 = { type: 'graph3d', fn: 'z=' + rhs.trim().replace(/\\left|\\right/g, ''), xmin: +(cxm - hx).toFixed(3), xmax: +(cxm + hx).toFixed(3), ymin: +(cym - hy).toFixed(3), ymax: +(cym + hy).toFixed(3), az: -0.8, el: 0.55, zoom: 1, marks };
    return [derivBlock(rows), g3];
  }

  return { extrema1, extrema2, D, compileFn, derivative, graphOf, valueTable, normalizeFn };
});
