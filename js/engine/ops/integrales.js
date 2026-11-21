/* Integrales: primitiva por tabla, regla de Barrow y Simpson. Trabaja sobre el árbol de expresiones de expr.js y comprueba cada primitiva derivándola. */
MatIA.define('engine/ops/integrales', ['engine/core', 'engine/ops/expr', 'engine/ops/common', 'engine/ops/poly', 'engine/ops/analisis'], (ME, $expr, $common, $poly, $analisis) => {
  'use strict';
  const { F, MErr, fLatex } = ME;
  const fr = ME.fr;
  const { N, varsOf, simpAll, isNum, parseExpr, toPoly, L, evalNum, evalExact } = $expr;
  const { derivBlock, topEqIndex, dec } = $common;
  const { D, normalizeFn } = $analisis;

  const NO_SE = 'No sé integrar esta función de forma exacta.';
  const ONE = fr.ONE;
  const num = (r) => N.num(r);
  const two = () => N.num(F(2));
  const same = (a, b) => L(a) === L(b);

  // k·X con k fracción, dejando la fracción arriba/abajo de forma legible
  function frac(r, X) {
    if (r.n === 1n && r.d === 1n) return X;
    if (r.n === -1n && r.d === 1n) return N.neg(X);
    const neg = r.n < 0n, n = neg ? -r.n : r.n;
    let out;
    if (r.d === 1n) out = N.mul(num(F(n)), X);
    else out = N.div(n === 1n ? X : N.mul(num(F(n)), X), num(F(r.d)));
    return neg ? N.neg(out) : out;
  }
  const fin = (r) => frac(r.k, r.X);

  function integrateRaw(ast, v, R) {
    const dep = (x) => varsOf(x).has(v);
    const isV = (x) => x.t === 'var' && x.n === v;
    const X = N.v(v);
    // ¿u es ax+b?  → { a, b } (árboles) o null
    function lin(u) {
      if (!dep(u)) return { a: num(fr.ZERO), b: u };
      if (isV(u)) return { a: num(ONE), b: num(fr.ZERO) };
      let r;
      switch (u.t) {
        case 'neg': r = lin(u.a); return r && { a: N.neg(r.a), b: N.neg(r.b) };
        case 'add': case 'sub': {
          const p = lin(u.a), q = lin(u.b);
          return p && q && { a: N[u.t](p.a, q.a), b: N[u.t](p.b, q.b) };
        }
        case 'mul':
          if (!dep(u.a)) { r = lin(u.b); return r && { a: N.mul(u.a, r.a), b: N.mul(u.a, r.b) }; }
          if (!dep(u.b)) { r = lin(u.a); return r && { a: N.mul(r.a, u.b), b: N.mul(r.b, u.b) }; }
          return null;
        case 'div':
          if (dep(u.b)) return null;
          r = lin(u.a); return r && { a: N.div(r.a, u.b), b: N.div(r.b, u.b) };
        default: return null;
      }
    }
    // divide el resultado entre a (derivada del argumento lineal)
    function byA(r, u, a) {
      a = simpAll(a);
      if (!isV(u)) R.add('argumento lineal (dividimos entre a)');
      if (isNum(a, 1)) return r;
      if (a.t === 'num') return { k: fr.div(r.k, a.v), X: r.X };
      return { k: r.k, X: N.div(r.X, a) };
    }
    const ln = (u) => N.fn('ln', N.fn('abs', u));
    function polyInt(a) {
      let p;
      try { p = toPoly(a, v); } catch (e) { return null; }
      let acc = null;
      for (let d = p.length - 1; d >= 0; d--) {
        if (fr.isZ(p[d])) continue;
        const t = frac(fr.div(p[d], F(d + 1)), d === 0 ? X : N.pow(X, num(F(d + 1))));
        acc = acc ? N.add(acc, t) : t;
      }
      R.add('potencia'); R.add('suma');
      return { k: ONE, X: acc || num(fr.ZERO) };
    }
    function power(a) { // a = pow(base, exponente)
      const { a: B, b: E } = a;
      if (!dep(E)) {
        if (E.t !== 'num') throw new MErr(NO_SE);
        const e = E.v;
        // 1/(1+u²) → arctan ; (1−u²)^(−1/2) → arcsin
        if (e.n === -1n && e.d === 1n) {
          let uu = null;
          if (B.t === 'add' && isNum(B.a, 1) && B.b.t === 'pow' && isNum(B.b.b, 2)) uu = B.b.a;
          else if (B.t === 'add' && isNum(B.b, 1) && B.a.t === 'pow' && isNum(B.a.b, 2)) uu = B.a.a;
          const l = uu && lin(uu);
          if (l) { R.add('arcotangente'); return byA({ k: ONE, X: N.fn('arctan', uu) }, uu, l.a); }
        }
        if (e.n === -1n && e.d === 2n && B.t === 'sub' && isNum(B.a, 1) && B.b.t === 'pow' && isNum(B.b.b, 2)) {
          const l = lin(B.b.a);
          if (l) { R.add('arcoseno'); return byA({ k: ONE, X: N.fn('arcsin', B.b.a) }, B.b.a, l.a); }
        }
        const l = lin(B);
        if (l && dep(B)) {
          if (e.n === -1n && e.d === 1n) { R.add('logaritmo'); return byA({ k: ONE, X: ln(B) }, B, l.a); }
          R.add('potencia');
          const e1 = fr.add(e, ONE);
          return byA({ k: fr.div(ONE, e1), X: N.pow(B, num(e1)) }, B, l.a);
        }
        if (B.t === 'fn') {
          const u = B.a, lu = lin(u);
          if (lu && dep(u) && e.d === 1n) {
            const k = e.n;
            const tw = (f, g, s) => { R.add('trigonométricas'); return byA({ k: F(s), X: N.fn(g, u) }, u, lu.a); };
            if (B.f === 'sec' && k === 2n) return tw('sec', 'tan', 1);
            if (B.f === 'csc' && k === 2n) return tw('csc', 'cot', -1);
            if (B.f === 'cos' && k === -2n) return tw('cos', 'tan', 1);
            if (B.f === 'sin' && k === -2n) return tw('sin', 'cot', -1);
            if (B.f === 'sin' && k === 2n) { R.add('trigonométricas'); R.add('ángulo doble'); return byA({ k: ONE, X: N.sub(N.div(u, two()), N.div(N.fn('sin', N.mul(two(), u)), num(F(4)))) }, u, lu.a); }
            if (B.f === 'cos' && k === 2n) { R.add('trigonométricas'); R.add('ángulo doble'); return byA({ k: ONE, X: N.add(N.div(u, two()), N.div(N.fn('sin', N.mul(two(), u)), num(F(4)))) }, u, lu.a); }
          }
        }
        if (e.d === 1n && e.n > 1n && e.n <= 40n) { const r = polyInt(a); if (r) return r; }
        throw new MErr(NO_SE);
      }
      if (!dep(B)) {
        const l = lin(E);
        if (!l) throw new MErr(NO_SE);
        R.add('exponencial');
        if (B.t === 'c' && B.n === 'e') return byA({ k: ONE, X: N.pow(B, E) }, E, l.a);
        if (B.t === 'c' && B.n === 'pi') return byA({ k: ONE, X: N.div(N.pow(B, E), N.fn('ln', B)) }, E, l.a);
        if (B.t === 'num' && fr.isZ(fr.sub(B.v, ONE)) === false && B.v.n > 0n) return byA({ k: ONE, X: N.div(N.pow(B, E), N.fn('ln', B)) }, E, l.a);
        throw new MErr(NO_SE);
      }
      throw new MErr(NO_SE);
    }
    function I(a) {
      if (!dep(a)) {
        R.add('constante');
        return a.t === 'num' ? { k: a.v, X } : { k: ONE, X: N.mul(a, X) };
      }
      switch (a.t) {
        case 'var': R.add('potencia'); return { k: F(1, 2), X: N.pow(X, two()) };
        case 'neg': { const r = I(a.a); return { k: fr.neg(r.k), X: r.X }; }
        case 'add': case 'sub': R.add('suma'); return { k: ONE, X: N[a.t](fin(I(a.a)), fin(I(a.b))) };
        case 'mul': {
          if (!dep(a.a)) {
            R.add('constante por función'); const r = I(a.b);
            return a.a.t === 'num' ? { k: fr.mul(r.k, a.a.v), X: r.X } : { k: r.k, X: N.mul(a.a, r.X) };
          }
          if (!dep(a.b)) {
            R.add('constante por función'); const r = I(a.a);
            return a.b.t === 'num' ? { k: fr.mul(r.k, a.b.v), X: r.X } : { k: r.k, X: N.mul(r.X, a.b) };
          }
          const r = polyInt(a);
          if (r) return r;
          throw new MErr(NO_SE);
        }
        case 'div': {
          if (!dep(a.b)) {
            R.add('constante por función'); const r = I(a.a);
            return a.b.t === 'num' ? { k: fr.div(r.k, a.b.v), X: r.X } : { k: r.k, X: N.div(r.X, a.b) };
          }
          if (!dep(a.a)) {
            R.add('constante por función'); const r = I(a.b.t === 'pow' && a.b.b.t === 'num' && !dep(a.b.b) ? N.pow(a.b.a, N.num(fr.neg(a.b.b.v))) : N.pow(a.b, N.num(F(-1))));
            return a.a.t === 'num' ? { k: fr.mul(r.k, a.a.v), X: r.X } : { k: r.k, X: N.mul(a.a, r.X) };
          }
          if (a.a.t === 'add' || a.a.t === 'sub') { R.add('suma'); return { k: ONE, X: N[a.a.t](fin(I(N.div(a.a.a, a.b))), fin(I(N.div(a.a.b, a.b)))) }; }
          const m = simpAll(N.mul(a.a, N.pow(a.b, N.num(F(-1)))));
          if (m.t === 'div' || same(m, a)) throw new MErr(NO_SE);
          return I(m);
        }
        case 'pow': return power(a);
        case 'fn': {
          const u = a.a, l = lin(u);
          if (!l) throw new MErr(NO_SE);
          const mk = (rule, k, Y) => { R.add(rule); return byA({ k: F(k), X: Y }, u, l.a); };
          switch (a.f) {
            case 'sin': return mk('trigonométricas', -1, N.fn('cos', u));
            case 'cos': return mk('trigonométricas', 1, N.fn('sin', u));
            case 'tan': return mk('trigonométricas', -1, ln(N.fn('cos', u)));
            case 'cot': return mk('trigonométricas', 1, ln(N.fn('sin', u)));
            case 'sinh': return mk('hiperbólicas', 1, N.fn('cosh', u));
            case 'cosh': return mk('hiperbólicas', 1, N.fn('sinh', u));
            case 'exp': return mk('exponencial', 1, N.pow(N.c('e'), u));
            case 'ln': return mk('integración por partes', 1, N.sub(N.mul(u, N.fn('ln', u)), u));
            default: throw new MErr(NO_SE);
          }
        }
        default: throw new MErr(NO_SE);
      }
    }
    return simpAll(fin(I(simpAll(ast))));
  }

  // primitiva por tabla + comprobación numérica por derivación
  function integrate(ast, v, rules, iv) {
    const R = new Set();
    const Fp = integrateRaw(ast, v, R);
    const env0 = {};
    for (const x of varsOf(ast)) if (x !== v) env0[x] = 1.9;
    let ok = 0;
    try {
      const dF = D(Fp, v, new Set());
      const pass = (pts) => {
        for (const x of pts) {
          const env = Object.assign({ [v]: x }, env0);
          const y = evalNum(ast, env), d = evalNum(dF, env);
          if (!Number.isFinite(y)) continue;
          if (!Number.isFinite(d) || Math.abs(y - d) > 1e-6 * Math.max(1, Math.abs(y))) throw new MErr(NO_SE);
          ok++;
        }
      };
      pass([0.05, 0.37, 0.55, 0.8, 1.3, 2.1, 3.4, -0.6, -1.7]);
      if (ok < 2) {
        const pts = [];
        if (iv && Number.isFinite(iv[0]) && Number.isFinite(iv[1]) && iv[0] !== iv[1]) for (let i = 1; i < 12; i++) pts.push(iv[0] + (iv[1] - iv[0]) * i / 12);
        for (let x = -50.13; x <= 50; x += 0.97) pts.push(x);
        for (let k = -3; k <= 6; k++) { pts.push(Math.pow(10, k) * 1.37); pts.push(-Math.pow(10, k) * 1.37); }
        pass(pts);
      }
    } catch (e) { throw new MErr(NO_SE); }
    if (ok < 2) throw new MErr(NO_SE);
    if (rules) R.forEach((r) => rules.add(r));
    return Fp;
  }

  /* ---------------- Lectura de la línea ---------------- */
  function readArg(s, i) {
    while (s[i] === ' ') i++;
    if (s[i] === '{') {
      let d = 0;
      for (let j = i; j < s.length; j++) { if (s[j] === '{') d++; else if (s[j] === '}' && --d === 0) return { t: s.slice(i + 1, j), end: j + 1 }; }
      throw new MErr('Falta cerrar una llave en los límites.');
    }
    const m = /^(-?\d+(?:[.,]\d+)?|\\[A-Za-z]+|[A-Za-z])/.exec(s.slice(i));
    if (!m) throw new MErr('No entiendo los límites de la integral.');
    return { t: m[1], end: i + m[0].length };
  }
  function readIntegral(latex) {
    let s = String(latex).trim(), prefix = '';
    const i = topEqIndex(s);
    if (i >= 0) {
      const lhs = s.slice(0, i), rhs = s.slice(i + 1);
      if (/\\int/.test(lhs)) s = lhs;
      else if (/\\int/.test(rhs)) { prefix = lhs.trim() + '='; s = rhs; }
      else throw new MErr('No veo ninguna integral (\\int) en la línea.');
    }
    { const j = topEqIndex(s); if (j >= 0) s = s.slice(0, j); }
    s = s.trim();
    if (!/^\\int(?![A-Za-z])/.test(s)) throw new MErr('La integral debe empezar por \\int.');
    let p = 4;
    let lo = null, hi = null;
    for (;;) {
      while (s[p] === ' ') p++;
      if (s.startsWith('\\limits', p)) { p += 7; continue; }
      if (s[p] === '_' && lo === null) { const r = readArg(s, p + 1); lo = r.t; p = r.end; continue; }
      if (s[p] === '^' && hi === null) { const r = readArg(s, p + 1); hi = r.t; p = r.end; continue; }
      break;
    }
    if ((lo === null) !== (hi === null)) throw new MErr('Faltan los dos límites de la integral.');
    let body = s.slice(p), v;
    const fr0 = /\\frac\{\s*(?:\\mathrm\{d\}|\\operatorname\{d\}|\\text\{d\}|d)\s*([a-zA-Z])\s*\}\{([^{}]*)\}/.exec(body);
    if (fr0) { v = fr0[1]; body = body.replace(fr0[0], '\\frac{1}{' + fr0[2] + '}'); }
    else {
      const m = /(?:\\[,;:!]|\s)*(?:\\mathrm\{d\}|\\operatorname\{d\}|\\text\{d\}|d)\s*([a-zA-Z])\s*$/.exec(body);
      if (!m) throw new MErr('Falta la diferencial (dx) al final de la integral.');
      v = m[1]; body = body.slice(0, m.index);
    }
    if (!body.trim()) body = '1';
    const ast = parseExpr(normalizeFn(body), { var: v });
    const bound = (t) => parseExpr(normalizeFn(t.replace(/(\d),(\d)/g, '$1.$2')), { var: v });
    return { prefix, v, ast, lo: lo === null ? null : bound(lo), hi: hi === null ? null : bound(hi) };
  }

  /* ---------------- Cálculo ---------------- */
  const pretty = (a) => L(a).replace(/\\ln\\left\(\\left\|((?:(?!\\right\|).)*)\\right\|\\right\)/g, '\\ln\\left|$1\\right|');
  const decL = (x) => dec(x, 4).replace('.', '{,}');
  function niceL(x) {
    if (!Number.isFinite(x)) return null;
    if (Math.abs(x) < 1e-12) return '0';
    for (let q = 1; q <= 24; q++) { const p = Math.round(x * q); if (Math.abs(p / q - x) < 1e-9) return fLatex(F(p, q)); }
    for (let q = 1; q <= 12; q++) {
      const p = Math.round(x / Math.PI * q);
      if (p !== 0 && Math.abs(p * Math.PI / q - x) < 1e-9) {
        const r = F(p, q), n = r.n < 0n ? -r.n : r.n, sg = r.n < 0n ? '-' : '';
        return r.d === 1n ? sg + (n === 1n ? '' : n) + '\\pi ' : sg + '\\frac{' + (n === 1n ? '' : n) + '\\pi}{' + r.d + '}';
      }
    }
    return null;
  }
  function simpson(ast, v, a, b) {
    const n = 1000, h = (b - a) / n, env0 = {};
    for (const x of varsOf(ast)) if (x !== v) throw new MErr('Falta el valor de ' + x + '.');
    const f = (x) => evalNum(ast, Object.assign({}, env0, { [v]: x }));
    let s = f(a) + f(b);
    for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
    const r = s * h / 3;
    if (!Number.isFinite(r)) throw new MErr('La función no está definida en todo el intervalo: no puedo calcular la integral.');
    return r;
  }
  const IMPROPER = 'La integral es impropia: la función no está acotada en [a, b].';
  function guardInterval(ast, v, a, b) {
    if (a === b) return;
    const f = (x) => evalNum(ast, { [v]: x });
    const N0 = 2000, step = (b - a) / N0, ys = [];
    for (let i = 0; i <= N0; i++) {
      const y = f(i === N0 ? b : a + step * i);
      if (!Number.isFinite(y)) throw new MErr(IMPROPER);
      ys.push(Math.abs(y));
    }
    const cand = [];
    for (let i = 0; i <= N0; i++) if ((i === 0 || ys[i] >= ys[i - 1]) && (i === N0 || ys[i] >= ys[i + 1])) cand.push(i);
    cand.sort((p, q) => ys[q] - ys[p]);
    const lo = Math.min(a, b), hi = Math.max(a, b);
    for (const i of cand.slice(0, 30)) {
      let c = a + step * i, h = Math.abs(step), m0 = 0, mk = 0;
      for (let k = 0; k <= 7; k++) {
        let m = -1, cm = c;
        for (let j = -20; j <= 20; j++) {
          const x = c + h * j / 20;
          if (x < lo || x > hi) continue;
          const y = f(x);
          if (!Number.isFinite(y)) throw new MErr(IMPROPER);
          if (Math.abs(y) > m) { m = Math.abs(y); cm = x; }
        }
        if (k === 0) m0 = m;
        mk = m; c = cm; h /= 10;
      }
      if (mk > 100 * Math.max(m0, 1e-300)) throw new MErr(IMPROPER);
    }
  }
  const lim = (ast) => {
    const x = evalNum(ast, {});
    if (!Number.isFinite(x)) throw new MErr('Los límites de integración deben ser números.');
    let ex = null; try { ex = evalExact(ast, {}); } catch (e) { /* no racional */ }
    return { x, ex };
  };

  function analyse(latex) {
    const it = readIntegral(latex);
    const { v, ast } = it;
    const head = '\\int' + (it.lo ? '_{' + L(it.lo).trim() + '}^{' + L(it.hi).trim() + '}' : '') + ' ' + pretty(ast) + '\\,d' + v;
    const rules = new Set();
    let Fp = null, err = null;
    let iv = null;
    if (it.lo) { try { iv = [lim(it.lo).x, lim(it.hi).x]; } catch (e) { /* lo avisará luego */ } }
    try { Fp = integrate(ast, v, rules, iv); } catch (e) { if (!(e instanceof MErr)) throw e; err = e; }
    const out = { it, v, ast, head, Fp, rules: [...rules], definite: !!it.lo };
    if (!it.lo) { if (!Fp) throw err; return out; }
    const A = lim(it.lo), B = lim(it.hi);
    guardInterval(ast, v, A.x, B.x);
    out.A = A; out.B = B;
    if (Fp) {
      try {
        if (A.ex && B.ex) { const q = fr.sub(evalExact(Fp, { [v]: B.ex }), evalExact(Fp, { [v]: A.ex })); out.value = fLatex(q); return out; }
      } catch (e) { /* no exacto */ }
      const val = evalNum(Fp, { [v]: B.x }) - evalNum(Fp, { [v]: A.x });
      if (Number.isFinite(val)) {
        const nl = niceL(val);
        out.value = nl !== null ? nl : '\\approx ' + decL(val);
        return out;
      }
    }
    out.Fp = null;
    out.simpson = true;
    out.value = '\\approx ' + decL(simpson(ast, v, A.x, B.x));
    return out;
  }

  const joinEq = (v) => (/^\\approx/.test(v) ? v : '=' + v);
  function integralLine(latex) {
    const r = analyse(latex);
    const left = r.it.prefix ? r.it.prefix + r.head : r.head;
    if (!r.definite) return { latex: left + '=' + pretty(r.Fp) + '+C' };
    return { latex: left + (/^\\approx/.test(r.value) ? r.value : joinEq(r.value)) };
  }
  function integralSteps(latex) {
    const r = analyse(latex);
    const rules = r.rules.filter((x) => x !== 'constante' || r.rules.length === 1).join(', ');
    const rows = [];
    if (!r.definite) {
      rows.push({ l: r.head, r: pretty(r.Fp) + '+C', note: 'Reglas: ' + rules, boxed: true });
    } else if (r.simpson) {
      rows.push({ l: r.head, r: r.value, note: 'No tiene primitiva elemental: la aproximamos con la regla de Simpson (n = 1000)', boxed: true });
    } else {
      const Ft = pretty(r.Fp), a = L(r.it.lo).trim(), b = L(r.it.hi).trim();
      rows.push({ l: r.head, r: pretty(r.Fp) + '+C', note: 'Reglas: ' + rules });
      rows.push({ l: '', r: '\\left[' + Ft + '\\right]_{' + a + '}^{' + b + '}', note: 'Regla de Barrow: F(b) − F(a)' });
      rows.push({ l: '', r: r.value.replace(/^\\approx /, '\\approx '), note: 'Resultado', boxed: true });
    }
    return [derivBlock(rows)];
  }

  return { integrate, integralLine, integralSteps };
});
