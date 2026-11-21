/* Árbol de expresiones: parseExpr, simplify, LaTeX, evalNum/evalExact, toPoly/terms. (de pizarra.html, líneas 1829-2230). */
MatIA.define('engine/ops/expr', ['engine/core', 'engine/ops/common', 'engine/ops/poly'], (ME, $common, $poly) => {
  'use strict';
  const { tokenize, MErr, F, fLatex } = ME;
  const { fromDec, ONE, neg, add, sub, ZERO, mul, isZ, div, isInt, abs } = ME.fr;
  const { isOp, isCmd, fNum, fact, fText } = $common;
  const { P, termL } = $poly;
  /* ====================== Árbol de expresiones ====================== */
  const FN = { sin: 'sin', cos: 'cos', tan: 'tan', tg: 'tan', cot: 'cot', sec: 'sec', csc: 'csc', arcsin: 'arcsin', arccos: 'arccos', arctan: 'arctan', ln: 'ln', log: 'log', exp: 'exp', sinh: 'sinh', cosh: 'cosh', tanh: 'tanh', sen: 'sin' };
  const GREEK = new Set(['alpha', 'beta', 'gamma', 'delta', 'lambda', 'mu', 'theta', 'sigma', 'tau', 'phi', 'varphi', 'omega', 'rho', 'varepsilon', 'epsilon']);
  const N = {
    num: (v) => ({ t: 'num', v }), v: (n) => ({ t: 'var', n }), c: (n) => ({ t: 'c', n }),
    add: (a, b) => ({ t: 'add', a, b }), sub: (a, b) => ({ t: 'sub', a, b }), mul: (a, b) => ({ t: 'mul', a, b }),
    div: (a, b) => ({ t: 'div', a, b }), pow: (a, b) => ({ t: 'pow', a, b }), neg: (a) => ({ t: 'neg', a }), fn: (f, a) => ({ t: 'fn', f, a }),
  };
  const isNum = (n, v) => n.t === 'num' && (v === undefined || (n.v.d === 1n && n.v.n === BigInt(v)));

  function parseExpr(src, opts = {}) {
    const toks = Array.isArray(src) ? src : tokenize(src);
    let pos = 0, absD = 0;
    const peek = () => toks[pos], next = () => toks[pos++];
    const startsPrimary = (t) => t && (t.k === 'num' || t.k === 'id' || t.k === '{' || isOp(t, '(') || isOp(t, '[') || (isOp(t, '|') && absD === 0) ||
      (t.k === 'cmd' && (['frac', 'dfrac', 'tfrac', 'sqrt', 'pi', 'infty'].includes(t.v) || FN[t.v] || GREEK.has(t.v))));
    function expr() {
      let a = unary();
      for (;;) {
        if (isOp(peek(), '+')) { next(); a = N.add(a, term()); }
        else if (isOp(peek(), '-')) { next(); a = N.sub(a, term()); }
        else return a;
      }
    }
    function unary() {
      if (isOp(peek(), '-')) { next(); return N.neg(term()); }
      if (isOp(peek(), '+')) { next(); return term(); }
      return term();
    }
    function term() {
      let a = power();
      for (;;) {
        const t = peek();
        if (isCmd(t, 'cdot') || isCmd(t, 'times') || isOp(t, '*')) { next(); a = N.mul(a, power()); }
        else if (isCmd(t, 'div') || isOp(t, '/') || isOp(t, ':')) { next(); a = N.div(a, power()); }
        else if (startsPrimary(t)) a = N.mul(a, power());
        else return a;
      }
    }
    function group() {
      if (!peek() || peek().k !== '{') return power();
      next();
      const a = expr();
      if (!peek() || peek().k !== '}') throw new MErr('Expresión mal escrita.');
      next();
      return a;
    }
    function supArg() {
      if (peek() && peek().k === '{') return group();
      const t = next();
      if (!t) throw new MErr('Falta el exponente.');
      if (t.k === 'num') return N.num(fromDec(t.v));
      if (t.k === 'id') return N.v(t.v);
      throw new MErr('Exponente mal escrito.');
    }
    function power() {
      let a = postfix();
      if (isOp(peek(), '^')) {
        next();
        // x^{-1}, x^2
        if (isOp(peek(), '-')) { next(); a = N.pow(a, N.neg(supArg())); }
        else a = N.pow(a, supArg());
      }
      return a;
    }
    function postfix() {
      let a = primary();
      while (isOp(peek(), '!')) { next(); a = N.fn('fact', a); }
      return a;
    }
    function primary() {
      const t = peek();
      if (!t) throw new MErr('Falta un operando.');
      if (t.k === 'num') { next(); return N.num(fromDec(t.v)); }
      if (t.k === '{') { next(); const a = expr(); if (!peek() || peek().k !== '}') throw new MErr('Falta cerrar una llave.'); next(); return a; }
      if (isOp(t, '(') || isOp(t, '[')) {
        next(); const a = expr(); const c = next();
        if (!c || !(isOp(c, ')') || isOp(c, ']'))) throw new MErr('Falta cerrar un paréntesis.');
        return a;
      }
      if (isOp(t, '|') && absD === 0) { next(); absD++; const a = expr(); absD--; if (!isOp(next(), '|')) throw new MErr('Falta cerrar | |.'); return N.fn('abs', a); }
      if (t.k === 'cmd') {
        if (t.v === 'frac' || t.v === 'dfrac' || t.v === 'tfrac') { next(); const a = group(); const b = group(); return N.div(a, b); }
        if (t.v === 'sqrt') {
          next();
          if (isOp(peek(), '[')) { next(); const ix = expr(); if (!isOp(next(), ']')) throw new MErr('Raíz mal escrita.'); const a = group(); return N.pow(a, N.div(N.num(ONE), ix)); }
          return N.pow(group(), N.num(F(1, 2)));
        }
        if (t.v === 'pi') { next(); return N.c('pi'); }
        if (t.v === 'infty') throw new MErr('No puedo operar con ∞.');
        if (FN[t.v]) {
          next();
          let pw = null;
          if (isOp(peek(), '^')) { next(); pw = isOp(peek(), '-') ? (next(), N.neg(supArg())) : supArg(); }
          let arg;
          if (isOp(peek(), '(')) { next(); arg = expr(); if (!isOp(next(), ')')) throw new MErr('Falta cerrar un paréntesis.'); }
          else arg = power();
          if (FN[t.v] === 'log' && opts.logBase10 === false) { /* ln */ }
          let a = N.fn(FN[t.v], arg);
          if (pw) a = N.pow(a, pw);
          return a;
        }
        if (GREEK.has(t.v)) { next(); return N.v('\\' + t.v); }
      }
      if (t.k === 'id') {
        next();
        let name = t.v;
        if (isOp(peek(), '_')) {
          next();
          const s = peek();
          if (s && s.k === '{') { next(); let sub = ''; while (peek() && peek().k !== '}') { const x = next(); sub += x.v || ''; } next(); name += '_{' + sub + '}'; }
          else if (s) { next(); name += '_{' + (s.v || '') + '}'; }
        }
        if (name === 'e' && opts.var !== 'e') return N.c('e');
        return N.v(name);
      }
      throw new MErr('No sé interpretar «' + (t.k === 'cmd' ? '\\' + t.v : t.v || t.k) + '».');
    }
    const a = expr();
    if (pos < toks.length) { const t = toks[pos]; throw new MErr('No sé interpretar «' + (t.k === 'cmd' ? '\\' + t.v : t.v || t.k) + '».'); }
    return a;
  }
  function varsOf(a, s = new Set()) {
    if (a.t === 'var') s.add(a.n);
    for (const k of ['a', 'b']) if (a[k]) varsOf(a[k], s);
    return s;
  }
  function pickVar(a) {
    const vs = [...varsOf(a)];
    for (const v of ['x', 't', 'y', 'z', 'n']) if (vs.includes(v)) return v;
    return vs[0] || 'x';
  }

  /* --- Simplificación --- */
  function simp(a) {
    if (!a || !a.t) return a;
    const s = Object.assign({}, a);
    if (s.a) s.a = simp(s.a);
    if (s.b) s.b = simp(s.b);
    const A = s.a, B = s.b;
    switch (s.t) {
      case 'neg':
        if (A.t === 'num') return N.num(neg(A.v));
        if (A.t === 'neg') return A.a;
        return s;
      case 'add':
        if (isNum(A, 0)) return B;
        if (isNum(B, 0)) return A;
        if (A.t === 'num' && B.t === 'num') return N.num(add(A.v, B.v));
        if (B.t === 'neg') return simp(N.sub(A, B.a));
        if (B.t === 'num' && B.v.n < 0n) return N.sub(A, N.num(neg(B.v)));
        if (B.t === 'mul' && B.a.t === 'num' && B.a.v.n < 0n) return N.sub(A, simp(N.mul(N.num(neg(B.a.v)), B.b)));
        return s;
      case 'sub':
        if (isNum(B, 0)) return A;
        if (isNum(A, 0)) return simp(N.neg(B));
        if (A.t === 'num' && B.t === 'num') return N.num(sub(A.v, B.v));
        if (B.t === 'neg') return simp(N.add(A, B.a));
        if (B.t === 'num' && B.v.n < 0n) return N.add(A, N.num(neg(B.v)));
        if (B.t === 'mul' && B.a.t === 'num' && B.a.v.n < 0n) return N.add(A, simp(N.mul(N.num(neg(B.a.v)), B.b)));
        if (same(A, B)) return N.num(ZERO);
        return s;
      case 'mul': {
        const fs = [];
        const flat = (x) => { if (x.t === 'mul') { flat(x.a); flat(x.b); } else fs.push(x); };
        flat(s);
        let k = ONE; const ot = [];
        for (const f of fs) {
          if (f.t === 'num') k = mul(k, f.v);
          else if (f.t === 'neg') { k = neg(k); ot.push(f.a); }
          else if (f.t === 'div' && f.a.t === 'num') { k = mul(k, f.a.v); ot.push(N.pow(f.b, N.num(F(-1)))); }
          else ot.push(f);
        }
        if (isZ(k)) return N.num(ZERO);
        // agrupar potencias de la misma base
        const grp = [];
        for (const f of ot) {
          const base = f.t === 'pow' && f.b.t === 'num' ? f.a : f, e = f.t === 'pow' && f.b.t === 'num' ? f.b.v : ONE;
          const g = grp.find((x) => same(x.base, base));
          if (g) g.e = add(g.e, e); else grp.push({ base, e });
        }
        const rank = (x) => (x.t === 'var' ? 0 : x.t === 'pow' && x.a.t === 'var' ? 0 : x.t === 'c' ? 1 : x.t === 'pow' && x.a.t === 'c' ? 2 : x.t === 'fn' ? 3 : 4);
        const parts = grp.filter((g) => !isZ(g.e)).map((g) => (g.e.n === 1n && g.e.d === 1n ? g.base : N.pow(g.base, N.num(g.e)))).sort((x, y) => rank(x) - rank(y));
        let r = parts.length ? parts.reduce((x, y) => ({ t: 'mul', a: x, b: y })) : null;
        if (!r) return N.num(k);
        if (k.n === 1n && k.d === 1n) return r;
        if (k.n === -1n && k.d === 1n) return N.neg(r);
        if (k.n < 0n) return N.neg({ t: 'mul', a: N.num(neg(k)), b: r });
        return { t: 'mul', a: N.num(k), b: r };
      }
      case 'mul_old':
        if (isNum(A, 0) || isNum(B, 0)) return N.num(ZERO);
        if (isNum(A, 1)) return B;
        if (isNum(B, 1)) return A;
        if (isNum(A, -1)) return simp(N.neg(B));
        if (isNum(B, -1)) return simp(N.neg(A));
        if (A.t === 'num' && B.t === 'num') return N.num(mul(A.v, B.v));
        if (B.t === 'num') return simp(N.mul(B, A));
        if (A.t === 'num' && B.t === 'mul' && B.a.t === 'num') return simp(N.mul(N.num(mul(A.v, B.a.v)), B.b));
        if (A.t === 'num' && B.t === 'neg') return simp(N.mul(N.num(neg(A.v)), B.a));
        if (A.t === 'neg') return simp(N.neg(N.mul(A.a, B)));
        if (B.t === 'neg') return simp(N.neg(N.mul(A, B.a)));
        if (A.t === 'num' && B.t === 'div' && B.a.t === 'num') return simp(N.div(N.num(mul(A.v, B.a.v)), B.b));
        if (same(A, B)) return simp(N.pow(A, N.num(F(2))));
        if (A.t === 'pow' && same(A.a, B) && A.b.t === 'num') return simp(N.pow(B, N.num(add(A.b.v, ONE))));
        if (B.t === 'pow' && same(B.a, A) && B.b.t === 'num') return simp(N.pow(A, N.num(add(B.b.v, ONE))));
        if (A.t === 'pow' && B.t === 'pow' && same(A.a, B.a) && A.b.t === 'num' && B.b.t === 'num') return simp(N.pow(A.a, N.num(add(A.b.v, B.b.v))));
        // número · (algo · x) → (número·algo)…
        if (A.t !== 'num' && B.t === 'mul' && B.a.t === 'num') return simp(N.mul(B.a, N.mul(A, B.b)));
        return s;
      case 'div':
        if (isNum(A, 0)) return N.num(ZERO);
        if (isNum(B, 1)) return A;
        if (A.t === 'num' && B.t === 'num' && !isZ(B.v)) return N.num(div(A.v, B.v));
        if (same(A, B)) return N.num(ONE);
        if (A.t === 'neg') return simp(N.neg(N.div(A.a, B)));
        if (B.t === 'num' && !isZ(B.v) && A.t === 'mul' && A.a.t === 'num') return simp(N.mul(N.num(div(A.a.v, B.v)), A.b));
        return s;
      case 'pow':
        if (isNum(B, 0)) return N.num(ONE);
        if (isNum(B, 1)) return A;
        if (A.t === 'num' && B.t === 'num' && isInt(B.v) && abs(B.v.n) < 64n) {
          let r = ONE; const k = B.v.n;
          for (let i = 0n; i < abs(k); i++) r = mul(r, A.v);
          return N.num(k < 0n ? div(ONE, r) : r);
        }
        if (A.t === 'pow' && A.b.t === 'num' && B.t === 'num') return simp(N.pow(A.a, N.num(mul(A.b.v, B.v))));
        return s;
      case 'fn':
        if (s.f === 'ln' && A.t === 'c' && A.n === 'e') return N.num(ONE);
        if (s.f === 'ln' && isNum(A, 1)) return N.num(ZERO);
        if ((s.f === 'sin' || s.f === 'tan') && isNum(A, 0)) return N.num(ZERO);
        if (s.f === 'cos' && isNum(A, 0)) return N.num(ONE);
        return s;
      default: return s;
    }
  }
  function same(a, b) { return JSON.stringify(a, (k, v) => (typeof v === 'bigint' ? v.toString() : v)) === JSON.stringify(b, (k, v) => (typeof v === 'bigint' ? v.toString() : v)); }
  const simpAll = (a) => { let p = a, q = simp(a), i = 0; while (!same(p, q) && i++ < 12) { p = q; q = simp(q); } return q; };

  /* --- Impresión en LaTeX --- */
  const PREC = { add: 1, sub: 1, neg: 2, mul: 3, div: 4, pow: 5, fn: 6, num: 7, var: 7, c: 7 };
  function prec(a) { if (a.t === 'num' && (a.v.n < 0n || a.v.d !== 1n)) return a.v.n < 0n ? 2 : 4; return PREC[a.t]; }
  function L(a) {
    switch (a.t) {
      case 'num': return fLatex(a.v);
      case 'var': return a.n;
      case 'c': return a.n === 'pi' ? '\\pi ' : '\\mathrm{e}';
      case 'add': return L(a.a) + (a.b.t === 'neg' ? '' : '+') + L(a.b);
      case 'sub': return L(a.a) + '-' + (prec(a.b) <= 1 || a.b.t === 'neg' || (a.b.t === 'num' && a.b.v.n < 0n) ? '\\left(' + L(a.b) + '\\right)' : L(a.b));
      case 'neg': return '-' + (prec(a.a) <= 2 ? '\\left(' + L(a.a) + '\\right)' : L(a.a));
      case 'mul': {
        const fs = []; const flat = (x) => { if (x.t === 'mul') { flat(x.a); flat(x.b); } else fs.push(x); }; flat(a);
        const den = [], numf = [];
        for (const f of fs) {
          if (f.t === 'pow' && f.b.t === 'num' && f.b.v.n < 0n) den.push(f.b.v.n === -1n && f.b.v.d === 1n ? f.a : N.pow(f.a, N.num(neg(f.b.v))));
          else if (f.t === 'div' && isNum(f.a, 1)) den.push(f.b);
          else numf.push(f);
        }
        if (den.length) {
          let sg = '';
          if (numf.length && numf[0].t === 'num' && numf[0].v.n < 0n) { sg = '-'; numf[0] = N.num(neg(numf[0].v)); if (isNum(numf[0], 1)) numf.shift(); }
          const top = numf.length ? numf.reduce((x, y) => ({ t: 'mul', a: x, b: y })) : N.num(ONE);
          const bot = den.reduce((x, y) => ({ t: 'mul', a: x, b: y }));
          return sg + '\\frac{' + L(top) + '}{' + L(bot) + '}';
        }
        return Lmul(a);
      }
      case 'mul2': {
        const l = prec(a.a) < 3 ? '\\left(' + L(a.a) + '\\right)' : L(a.a);
        let r = prec(a.b) < 3 || (a.b.t === 'num' && a.b.v.n < 0n) ? '\\left(' + L(a.b) + '\\right)' : L(a.b);
        const implicit = (a.a.t === 'num' && a.b.t !== 'num' && !(a.b.t === 'div') && !(a.b.t === 'pow' && a.b.a.t === 'num')) ||
          (a.a.t !== 'num' && (a.b.t === 'var' || a.b.t === 'fn' || a.b.t === 'c' || (a.b.t === 'pow' && a.b.a.t !== 'num'))) && a.a.t !== 'fn';
        return l + (implicit ? (/^[a-zA-Z0-9]$/.test(l.slice(-1)) && /^[a-zA-Z0-9]/.test(r) ? ' ' : '') : '\\cdot ') + r;
      }
      case 'div': return '\\frac{' + L(a.a) + '}{' + L(a.b) + '}';
      case 'pow': {
        if (a.b.t === 'num' && a.b.v.n < 0n) return '\\frac{1}{' + L(N.pow(a.a, N.num(neg(a.b.v)))) + '}';
        if (a.b.t === 'num' && a.b.v.n === 1n && a.b.v.d === 2n) return '\\sqrt{' + L(a.a) + '}';
        if (a.b.t === 'num' && a.b.v.n === 1n && a.b.v.d > 2n) return '\\sqrt[' + a.b.v.d + ']{' + L(a.a) + '}';
        if (a.b.t === 'div' && isNum(a.b.a, 1)) return '\\sqrt[' + L(a.b.b) + ']{' + L(a.a) + '}';
        if (a.a.t === 'fn' && a.a.f !== 'abs' && a.a.f !== 'fact') return '\\' + fnName(a.a.f) + '^{' + L(a.b) + '}' + fnArg(a.a.a);
        const base = prec(a.a) < 7 || (a.a.t === 'num' && a.a.v.n < 0n) ? '\\left(' + L(a.a) + '\\right)' : L(a.a);
        return base + '^{' + L(a.b) + '}';
      }
      case 'fn':
        if (a.f === 'abs') return '\\left|' + L(a.a) + '\\right|';
        if (a.f === 'fact') return (prec(a.a) < 7 ? '\\left(' + L(a.a) + '\\right)' : L(a.a)) + '!';
        return '\\' + fnName(a.f) + fnArg(a.a);
      case 'raw': return a.s;
      default: return '?';
    }
  }
  function Lmul(a) {
    const fs = []; const flat = (x) => { if (x.t === 'mul') { flat(x.a); flat(x.b); } else fs.push(x); }; flat(a);
    let s = '', prev = null;
    for (const f of fs) {
      let t = prec(f) < 3 || (prev && f.t === 'num' && f.v.n < 0n) ? '\\left(' + L(f) + '\\right)' : L(f);
      if (prev) {
        const implicit = (prev.t === 'num' && f.t !== 'num' && !(f.t === 'pow' && f.a.t === 'num')) ||
          (prev.t !== 'num' && prev.t !== 'fn' && (f.t === 'var' || f.t === 'fn' || f.t === 'c' || (f.t === 'pow' && f.a.t !== 'num')));
        s += implicit ? (/[a-zA-Z0-9]$/.test(s) && /^[a-zA-Z0-9]/.test(t) ? '' : '') : '\\cdot ';
      }
      s += t;
      prev = f;
    }
    return s;
  }
  const fnName = (f) => (f === 'sinh' || f === 'cosh' || f === 'tanh' ? f : { sin: 'sin', cos: 'cos', tan: 'tan', cot: 'cot', sec: 'sec', csc: 'csc', arcsin: 'arcsin', arccos: 'arccos', arctan: 'arctan', ln: 'ln', log: 'log', exp: 'exp' }[f]);
  const fnArg = (x) => (x.t === 'var' || (x.t === 'num' && x.v.n >= 0n && x.v.d === 1n) ? ' ' + L(x) : '\\left(' + L(x) + '\\right)');

  /* --- Evaluación numérica y exacta --- */
  function evalNum(a, env) {
    switch (a.t) {
      case 'num': return fNum(a.v);
      case 'var': if (a.n in env) return env[a.n]; throw new MErr('Falta el valor de ' + a.n + '.');
      case 'c': return a.n === 'pi' ? Math.PI : Math.E;
      case 'add': return evalNum(a.a, env) + evalNum(a.b, env);
      case 'sub': return evalNum(a.a, env) - evalNum(a.b, env);
      case 'mul': return evalNum(a.a, env) * evalNum(a.b, env);
      case 'div': return evalNum(a.a, env) / evalNum(a.b, env);
      case 'neg': return -evalNum(a.a, env);
      case 'pow': {
        const b = evalNum(a.a, env), e = evalNum(a.b, env);
        if (b < 0 && a.b.t === 'num' && a.b.v.d !== 1n && a.b.v.d % 2n === 1n) return -Math.pow(-b, e);
        return Math.pow(b, e);
      }
      case 'fn': {
        const x = evalNum(a.a, env);
        const f = { sin: Math.sin, cos: Math.cos, tan: Math.tan, cot: (v) => 1 / Math.tan(v), sec: (v) => 1 / Math.cos(v), csc: (v) => 1 / Math.sin(v), arcsin: Math.asin, arccos: Math.acos, arctan: Math.atan, ln: Math.log, log: Math.log10, exp: Math.exp, sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, abs: Math.abs, fact: (v) => { let r = 1; for (let i = 2; i <= v; i++) r *= i; return r; } }[a.f];
        return f(x);
      }
      default: return NaN;
    }
  }
  function evalExact(a, env) {
    switch (a.t) {
      case 'num': return a.v;
      case 'var': if (a.n in env) return env[a.n]; throw new MErr('Falta el valor de ' + a.n + '.');
      case 'add': return add(evalExact(a.a, env), evalExact(a.b, env));
      case 'sub': return sub(evalExact(a.a, env), evalExact(a.b, env));
      case 'mul': return mul(evalExact(a.a, env), evalExact(a.b, env));
      case 'div': return div(evalExact(a.a, env), evalExact(a.b, env));
      case 'neg': return neg(evalExact(a.a, env));
      case 'pow': {
        const b = evalExact(a.a, env), e = evalExact(a.b, env);
        if (!isInt(e) || abs(e.n) > 200n) throw new MErr('no exacto');
        let r = ONE;
        for (let i = 0n; i < abs(e.n); i++) r = mul(r, b);
        return e.n < 0n ? div(ONE, r) : r;
      }
      case 'fn':
        if (a.f === 'abs') { const v = evalExact(a.a, env); return v.n < 0n ? neg(v) : v; }
        if (a.f === 'fact') { const v = evalExact(a.a, env); if (!isInt(v) || v.n < 0n) throw new MErr('no exacto'); return F(fact(v.n)); }
        throw new MErr('no exacto');
      default: throw new MErr('no exacto');
    }
  }

  /* --- Del árbol a polinomio (y a lista de términos sin agrupar) --- */
  function toPoly(a, v) {
    switch (a.t) {
      case 'num': return [a.v];
      case 'var': if (a.n === v) return P.x(1); throw new MErr('Hay otra letra (' + a.n + ') además de ' + v + '.');
      case 'add': return P.add(toPoly(a.a, v), toPoly(a.b, v));
      case 'sub': return P.sub(toPoly(a.a, v), toPoly(a.b, v));
      case 'neg': return P.scale(toPoly(a.a, v), F(-1));
      case 'mul': return P.mul(toPoly(a.a, v), toPoly(a.b, v));
      case 'div': { const d = toPoly(a.b, v); if (P.deg(d) > 0) throw new MErr('Hay ' + v + ' en un denominador.'); if (isZ(d[0])) throw new MErr('División por cero.'); return P.scale(toPoly(a.a, v), div(ONE, d[0])); }
      case 'pow': {
        const e = a.b.t === 'num' ? a.b.v : (() => { try { return evalExact(a.b, {}); } catch (x) { return null; } })();
        if (!e || !isInt(e) || e.n < 0n || e.n > 40n) throw new MErr('Solo trabajo con potencias enteras positivas de ' + v + '.');
        return P.pow(toPoly(a.a, v), Number(e.n));
      }
      default: throw new MErr('La expresión no es un polinomio en ' + v + '.');
    }
  }
  // Lista de términos {c, d} desarrollando productos pero sin agrupar
  function terms(a, v) {
    const T = (c, d) => [{ c, d }];
    switch (a.t) {
      case 'num': return T(a.v, 0);
      case 'var': if (a.n === v) return T(ONE, 1); throw new MErr('Hay otra letra (' + a.n + ') además de ' + v + '.');
      case 'add': return terms(a.a, v).concat(terms(a.b, v));
      case 'sub': return terms(a.a, v).concat(terms(a.b, v).map((t) => ({ c: neg(t.c), d: t.d })));
      case 'neg': return terms(a.a, v).map((t) => ({ c: neg(t.c), d: t.d }));
      case 'mul': {
        const A = terms(a.a, v), B = terms(a.b, v), r = [];
        for (const x of A) for (const y of B) r.push({ c: mul(x.c, y.c), d: x.d + y.d });
        return r;
      }
      case 'div': { const d = toPoly(a.b, v); if (P.deg(d) > 0) throw new MErr('Hay ' + v + ' en un denominador: todavía no sé resolver ecuaciones racionales.'); return terms(a.a, v).map((t) => ({ c: div(t.c, d[0]), d: t.d })); }
      case 'pow': {
        const p = toPoly(a, v);
        return p.map((c, d) => ({ c, d })).filter((t) => !isZ(t.c)).reverse();
      }
      default: throw new MErr('La ecuación no es polinómica en ' + v + '.');
    }
  }
  const termsLatex = (ts, v) => { let s = ''; for (const t of ts) s += termL(t.c, t.d === 0 ? '' : t.d === 1 ? v : v + '^{' + t.d + '}', s === ''); return s || '0'; };
  const termText = (t, v) => { const a = F(abs(t.c.n), t.c.d); const one = a.n === 1n && a.d === 1n && t.d > 0; return (one ? '' : fText(a)) + (t.d === 0 ? '' : t.d === 1 ? v.replace('\\', '') : v.replace('\\', '') + '²'.repeat(t.d === 2 ? 1 : 0) + (t.d > 2 ? '^' + t.d : '')); };
  const hasParenOrFrac = (latex) => /\\left\(|\(|\\frac/.test(latex);

  return { parseExpr, varsOf, terms, termText, hasParenOrFrac, termsLatex, evalExact, evalNum, toPoly, N, simp, isNum, pickVar, L, simpAll };
});
