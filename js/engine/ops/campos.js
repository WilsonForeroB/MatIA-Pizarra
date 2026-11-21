/* Cálculo vectorial: matriz jacobiana, divergencia, rotacional y laplaciano. */
MatIA.define('engine/ops/campos', ['engine/core', 'engine/ops/expr', 'engine/ops/common', 'engine/ops/analisis', 'engine/ops/vec-input'], (ME, $expr, $common, $analisis, $vec) => {
  'use strict';
  /* El desarrollo ya dibuja el «=» entre l y r: no lo repetimos al principio de r. */
  const tidy = (rows) => rows.map((r) => Object.assign({}, r, { r: String(r.r || '').replace(/^\s*=\s*/, '') }));
  const { F, MErr, fLatex } = ME;
  const fr = ME.fr;
  const { N, varsOf, simpAll, evalNum, L } = $expr;
  const { derivBlock } = $common;
  const { D } = $analisis;
  const { parseVecInput, atPoint, numEnv } = $vec;

  /* ---------- utilidades ---------- */
  const vtex = (v) => (v.startsWith('\\') ? v + ' ' : v);
  const vtext = (v) => ({ '\\theta': 'θ', '\\varphi': 'φ', '\\phi': 'φ', '\\rho': 'ρ' }[v] || v);
  const hasFn = (a) => !!a && (a.t === 'fn' || hasFn(a.a) || hasFn(a.b));
  const countFn = (a) => (a ? (a.t === 'fn' ? 1 : 0) + countFn(a.a) + countFn(a.b) : 0);
  const isZeroAst = (a) => a.t === 'num' && a.v.n === 0n;
  const deriv = (a, v) => simpAll(D(a, v, new Set()));
  const dec = (s) => s.replace('.', '{,}');

  function numL(v) {
    if (!Number.isFinite(v)) return '\\text{no definido}';
    if (Math.abs(v) < 1e-12) return '0';
    for (let q = 1; q <= 12; q++) { const p0 = Math.round(v * q); if (Math.abs(p0 / q - v) < 1e-9) return fLatex(F(p0, q)); }
    for (let q = 1; q <= 12; q++) {
      const p0 = Math.round(v / Math.PI * q);
      if (p0 !== 0 && Math.abs(p0 * Math.PI / q - v) < 1e-9) {
        const r = F(p0, q), n = r.n < 0n ? -r.n : r.n, sg = r.n < 0n ? '-' : '';
        return r.d === 1n ? sg + (n === 1n ? '' : n) + '\\pi ' : sg + '\\frac{' + (n === 1n ? '' : n) + '\\pi}{' + r.d + '}';
      }
    }
    return dec((Math.round(v * 1e4) / 1e4).toString());
  }
  const isNice = (v) => { if (Math.abs(v) < 1e-12) return true; for (let q = 1; q <= 12; q++) { if (Math.abs(Math.round(v * q) / q - v) < 1e-9) return true; const p0 = Math.round(v / Math.PI * q); if (p0 !== 0 && Math.abs(p0 * Math.PI / q - v) < 1e-9) return true; } return false; };

  /* Valor de una expresión en el punto: exacto si se puede; si queda alguna función, numérico. */
  function evalAt(ast, vars, point) {
    const s = atPoint(ast, vars, point);
    if (!hasFn(s)) return { latex: L(s), ast: s, approx: false };
    let v = NaN;
    try { v = evalNum(ast, numEnv(vars, point)); } catch (e) { /* no definido */ }
    if (!Number.isFinite(v)) return { latex: '\\text{no definido}', ast: null, approx: false, bad: true };
    const nice = isNice(v);
    return { latex: (nice ? '' : '\\approx ') + numL(v), ast: null, approx: !nice, num: v };
  }
  const ev = (a, env) => { try { return evalNum(a, env); } catch (e) { return NaN; } };
  const testPoints = (vars, k) => Array.from({ length: k }, (_, i) => { const env = {}; vars.forEach((v, j) => { env[v] = 0.37 + 0.41 * ((i * 3 + j * 5) % 7) + 0.113 * i; }); return env; });
  const numZero = (a, vars) => testPoints(vars, 6).every((env) => { const v = ev(a, env); return Number.isFinite(v) && Math.abs(v) < 1e-9; });
  const sumL = (xs) => xs.map(L).map((t, i) => (i === 0 ? t : t.startsWith('-') ? t : '+' + t)).join('');
  const sumSimp = (xs) => {
    const ls = xs.map(L);
    if (xs.length > 1 && ls.every((x) => x === ls[0]) && !isZeroAst(xs[0])) return simpAll(N.mul(N.num(F(xs.length)), xs[0]));
    return simpAll(sumAst(xs));
  };
  const sumAst = (xs) => xs.reduce((s, x) => (s ? N.add(s, x) : x), null);
  const fracP = (num, v, order) => '\\frac{\\partial' + (order > 1 ? '^{' + order + '}' : '') + ' ' + num + '}{\\partial ' + vtex(v) + (order > 1 ? '^{' + order + '}' : '') + '}';
  const needVars = (p) => { if (p.vars.length > 4) throw new MErr('Hay demasiadas variables (' + p.vars.length + '); el máximo es 4.'); };

  /* ---------- simplificación de determinantes (identidad pitagórica y factores sencillos) ---------- */
  function simplifyDet(d, vars) {
    const pts = testPoints(vars, 4);
    const dv = pts.map((env) => ev(d, env));
    if (dv.some((x) => !Number.isFinite(x))) return null;
    if (dv.every((x) => Math.abs(x) < 1e-9)) return { c: 0, ast: N.num(F(0)) };
    const cands = [];
    const per = vars.map((v) => { const o = []; for (let e = 0; e <= 3; e++) for (const t of ['', 'sin', 'cos']) o.push({ v, e, t }); return o; });
    const rec = (i, cur) => {
      if (i === vars.length) { cands.push(cur.slice()); return; }
      for (const o of per[i]) { cur.push(o); rec(i + 1, cur); cur.pop(); }
    };
    rec(0, []);
    const cost = (c) => c.reduce((s, o) => s + (o.e ? 1 + (o.e > 1 ? 0.5 : 0) : 0) + (o.t ? 1 : 0), 0);
    cands.sort((a, b) => cost(a) - cost(b));
    const build = (c) => {
      const fs = [];
      for (const o of c) {
        if (o.e) fs.push(o.e === 1 ? N.v(o.v) : N.pow(N.v(o.v), N.num(F(o.e))));
        if (o.t) fs.push(N.fn(o.t, N.v(o.v)));
      }
      return fs.length ? fs.reduce((s, x) => N.mul(s, x)) : null;
    };
    for (const c of cands) {
      const cv = build(c);
      const vals = pts.map((env, i) => (cv ? ev(cv, env) : 1));
      const ratios = vals.map((x, i) => dv[i] / x);
      if (!ratios.every((r) => Number.isFinite(r) && Math.abs(r - ratios[0]) < 1e-8 * Math.max(1, Math.abs(ratios[0])))) continue;
      const k = ratios[0];
      let q = 0;
      for (let qq = 1; qq <= 12 && !q; qq++) if (Math.abs(Math.round(k * qq) / qq - k) < 1e-9) q = qq;
      if (!q || Math.abs(k) < 1e-9) continue;
      const kn = F(Math.round(k * q), q);
      const ast = simpAll(cv ? N.mul(N.num(kn), cv) : N.num(kn));
      return { c: k, ast };
    }
    return null;
  }

  /* determinante desarrollado (AST sin simplificar) de una matriz 2×2 o 3×3 de AST */
  function detExpanded(M) {
    const n = M.length;
    if (n === 1) return M[0][0];
    if (n === 2) return N.sub(N.mul(M[0][0], M[1][1]), N.mul(M[0][1], M[1][0]));
    if (n === 3) {
      const m2 = (a, b, c, d) => N.sub(N.mul(a, d), N.mul(b, c));
      const [[a, b, c], [d, e, f], [g, h, i]] = M;
      return N.add(N.sub(N.mul(a, m2(e, f, h, i)), N.mul(b, m2(d, f, g, i))), N.mul(c, m2(d, e, g, h)));
    }
    // 4×4: desarrollo por la primera fila
    let acc = null;
    for (let j = 0; j < n; j++) {
      const minor = M.slice(1).map((r) => r.filter((_, k) => k !== j));
      const t = N.mul(M[0][j], detExpanded(minor));
      acc = acc ? (j % 2 ? N.sub(acc, t) : N.add(acc, t)) : t;
    }
    return acc;
  }
  const pmat = (rows) => '\\begin{pmatrix}' + rows.map((r) => r.join(' & ')).join('\\\\ ') + '\\end{pmatrix}';
  const vmat = (rows) => '\\begin{vmatrix}' + rows.map((r) => r.join(' & ')).join('\\\\ ') + '\\end{vmatrix}';
  const paren = (s) => '\\left(' + s + '\\right)';

  function orderChange(vs) {
    const rank = (v) => ({ '\\rho': 0, '\\varphi': 1, '\\phi': 1, '\\theta': 2, r: 0, z: 3 }[v] ?? 5);
    return vs.slice().sort((a, b) => rank(a) - rank(b));
  }

  /* =================== 1. Matriz jacobiana =================== */
  function jacobian(latex) {
    const p = parseVecInput(latex);
    if (p.kind === 'scalar') throw new MErr('Esta función es escalar, así que no tiene matriz jacobiana (esa es para funciones vectoriales). Para una función escalar usa «Gradiente».');
    needVars(p);
    const m = p.exprs.length, n = p.vars.length;
    if (m > 4) throw new MErr('La función tiene demasiadas componentes (' + m + '); el máximo es 4.');
    const isChange = p.kind === 'change';
    const comp = (i) => (isChange ? p.outs[i] : p.name + '_{' + (i + 1) + '}');
    const compT = (i) => (isChange ? p.outs[i] : p.name + (['₁', '₂', '₃', '₄'][i]));
    // cambio de variables: orden habitual (r, θ, z) y (ρ, φ, θ)
    const vars = isChange ? orderChange(p.vars) : p.vars;
    if (p.point && p.point.val.length !== vars.length) throw new MErr('El punto tiene ' + p.point.val.length + ' coordenadas y el cambio ' + vars.length + ' variables (' + vars.map(vtext).join(', ') + ').');
    const rows = [];
    rows.push({
      l: isChange ? '\\left(' + p.outs.join(',') + '\\right)' : p.name + paren(vars.map(vtex).join(',')),
      r: isChange ? '\\left(' + p.exprs.map(L).join(',\\ ') + '\\right)' : '\\left(' + p.exprs.map(L).join(',\\ ') + '\\right)',
      note: isChange ? 'Cambio de variables: ' + m + ' ecuaciones y ' + n + ' variables nuevas (' + vars.map(vtext).join(', ') + ')' : 'Función vectorial con ' + m + ' componente' + (m > 1 ? 's' : '') + ' y ' + n + ' variable' + (n > 1 ? 's' : ''),
    });
    if (!isChange) p.exprs.forEach((e, i) => rows.push({ l: comp(i), r: L(e), note: 'Componente ' + (i + 1) + ' de ' + p.name }));
    const J = p.exprs.map((e) => vars.map((v) => deriv(e, v)));
    if (n <= 2) J.forEach((fila, i) => rows.push({
      l: fracP(comp(i), vars[0], 1),
      r: L(fila[0]) + (n > 1 ? ',\\quad ' : '') + fila.slice(1).map((d, j) => fracP(comp(i), vars[j + 1], 1) + '=' + L(d)).join(',\\quad '),
      note: 'Fila ' + (i + 1) + ': derivadas de ' + compT(i) + ' respecto de ' + vars.map(vtext).join(', '),
    }));
    // con 3 o más variables, una derivada por paso para que no se salga de la hoja
    else J.forEach((fila, i) => fila.forEach((d, j) => rows.push({
      l: fracP(comp(i), vars[j], 1), r: L(d),
      note: j === 0 ? 'Fila ' + (i + 1) + ' de la jacobiana: derivamos ' + compT(i) + ' respecto de ' + vtext(vars[j]) : 'Fila ' + (i + 1) + ': ahora respecto de ' + vtext(vars[j]),
    })));
    const label = isChange ? '\\frac{\\partial(' + p.outs.join(',') + ')}{\\partial(' + vars.map((v) => v).join(',') + ')}' : 'J_{' + p.name + '}';
    const Jl = J.map((fila) => fila.map(L));
    rows.push({ l: label, r: pmat(Jl), note: 'Matriz jacobiana: la fila i contiene las derivadas parciales de la componente i', boxed: !(m === n) });
    let Jdet = null, detAst = null, sg = 1;
    if (m === n) {
      const raw = detExpanded(J);
      const lbl = isChange ? '\\left|\\frac{\\partial(' + p.outs.join(',') + ')}{\\partial(' + vars.join(',') + ')}\\right|' : '|J_{' + p.name + '}|';
      const expandedL = n === 2 ? L(raw) : L(raw);
      const simp = simpAll(raw);
      const rawRow = (n === 2 ? 'a\\,d-b\\,c' : n === 3 ? 'a(ei-fh)-b(di-fg)+c(dh-eg)' : '') ;
      rows.push({
        l: lbl, r: vmat(Jl) + (n === 2 && expandedL.length < 160 ? '=' + expandedL : ''),
        note: n === 2 ? 'Determinante 2×2: ad − bc' : n === 3 ? 'Determinante 3×3: desarrollo por la primera fila (a·(ei−fh) − b·(di−fg) + c·(dh−eg))' : 'Determinante desarrollado por la primera fila',
      });
      void rawRow;
      if (n === 3 && expandedL.length < 160) rows.push({ l: '', r: expandedL, note: 'Desarrollamos' });
      let fin = simp, usedId = false;
      const s = simplifyDet(simp, vars);
      if (s) { if (L(s.ast) !== L(simp)) usedId = countFn(simp) > 0; fin = s.ast; sg = s.c < 0 ? -1 : 1; }
      if (L(simp) !== expandedL && (L(simp).length < 160 || fin === simp)) rows.push({ l: '', r: '=' + L(simp), note: 'Simplificamos' });
      if (fin !== simp && L(fin) !== L(simp)) rows.push({ l: '', r: '=' + L(fin), note: usedId ? 'Usando sen²θ + cos²θ = 1 (identidad pitagórica)' : 'Simplificamos' });
      detAst = fin;
      Jdet = fin;
      if (isChange) {
        let absAst = fin, note = 'Valor absoluto del jacobiano: es el factor que corrige el área o el volumen';
        if (sg < 0) { absAst = simpAll(N.neg(fin)); note = 'El determinante sale negativo con este orden de variables; para un cambio de variables se toma |J| en valor absoluto'; }
        const ls = L(absAst);
        const fnTxt = { 'r': 'Por eso dA = dx dy = r dr dθ al pasar a polares', '\\rho^{2}\\sin \\varphi': 'Por eso dV = dx dy dz = ρ² sen φ dρ dθ dφ al pasar a esféricas' };
        if (n === 2 && /^r$/.test(ls)) note = 'Por eso dA = dx dy = r dr dθ al pasar a polares';
        else if (n === 3 && /^r$/.test(ls)) note = 'Por eso dV = dx dy dz = r dr dθ dz al pasar a cilíndricas';
        else if (n === 3 && /^\\rho\^\{2\}\\sin \\varphi$/.test(ls.replace(/\s+/g, ' ').replace(/\\sin\\varphi/, '\\sin \\varphi'))) note = 'Por eso dV = dx dy dz = ρ² sen φ dρ dθ dφ al pasar a esféricas' + (sg < 0 ? ' (|J| en valor absoluto)' : '');
        void fnTxt;
        detAst = absAst;
        rows.push({ l: '|J|', r: ls, note, boxed: true });
      } else {
        rows[rows.length - 1].boxed = true;
        if (L(fin) === L(simp) && L(simp) === expandedL) rows[rows.length - 1].note += '. Es el jacobiano |J|';
      }
    } else {
      rows.push({ l: '\\det', r: '\\text{—}', note: 'La matriz es ' + m + '×' + n + ' (no cuadrada), así que no tiene determinante' });
    }
    // en un punto
    if (p.point) {
      const P = p.point;
      const Jp = J.map((fila) => fila.map((d) => evalAt(d, vars, P)));
      rows.push({ l: 'P', r: '\\left(' + P.latex.join(',\\ ') + '\\right)', note: 'Punto donde evaluamos' });
      rows.push({ l: label.replace(/J_\{(.*)\}/, 'J_{$1}') + '(P)', r: pmat(Jp.map((f) => f.map((e) => e.latex))), note: 'Sustituimos ' + vars.map((v, i) => vtext(v) + ' = ' + vtext(P.latex[i].replace(/\\pi\s*/g, 'π'))).join(', '), boxed: m !== n });
      if (m === n) {
        const approx = Jp.some((r) => r.some((e) => e.approx || e.bad));
        const raw = detExpanded(J);
        const dp = evalAt(simpAll(raw), vars, P);
        let valStr = dp.latex, num = dp.num;
        if (num === undefined) { num = ev(simpAll(raw), numEnv(vars, P)); }
        const absTxt = isChange && Number.isFinite(num) && num < 0 ? numL(Math.abs(num)) : null;
        void approx;
        rows.push({ l: '|J(P)|', r: (isChange && absTxt ? '\\left|' + valStr + '\\right|=' + absTxt : valStr), note: 'Determinante en P', boxed: true });
        if (!Number.isFinite(num)) rows.push({ l: '', r: '\\text{—}', note: 'El jacobiano no está definido en P' });
        else if (Math.abs(num) > 1e-9) rows.push({ l: '', r: '|J(P)|\\neq 0', note: 'F es localmente invertible cerca de P (teorema de la función inversa)' });
        else rows.push({ l: '', r: '|J(P)|=0', note: 'El determinante se anula en P: el teorema de la función inversa no garantiza que F sea invertible cerca de P' });
      }
    }
    void Jdet; void detAst;
    return [derivBlock(tidy(rows))];
  }

  /* =================== polinomios multivariable (para el potencial) =================== */
  const pAdd = (A, B, k = 1) => { const R = new Map(A); for (const [key, c] of B) { const s = fr.add(R.get(key) || fr.ZERO, k === 1 ? c : fr.neg(c)); if (fr.isZ(s)) R.delete(key); else R.set(key, s); } return R; };
  const pMul = (A, B) => { let R = new Map(); for (const [ka, ca] of A) for (const [kb, cb] of B) { const key = ka.split(',').map((x, i) => +x + +kb.split(',')[i]).join(','); R = pAdd(R, new Map([[key, fr.mul(ca, cb)]])); } return R; };
  function polyOf(a, vars) {
    const zero = vars.map(() => 0).join(',');
    const cst = (c) => new Map(fr.isZ(c) ? [] : [[zero, c]]);
    switch (a.t) {
      case 'num': return cst(a.v);
      case 'var': { const i = vars.indexOf(a.n); if (i < 0) return null; return new Map([[vars.map((_, j) => (j === i ? 1 : 0)).join(','), fr.ONE]]); }
      case 'neg': { const x = polyOf(a.a, vars); return x && pAdd(new Map(), x, -1); }
      case 'add': case 'sub': { const x = polyOf(a.a, vars), y = polyOf(a.b, vars); return x && y && pAdd(x, y, a.t === 'add' ? 1 : -1); }
      case 'mul': { const x = polyOf(a.a, vars), y = polyOf(a.b, vars); return x && y && pMul(x, y); }
      case 'div': { const x = polyOf(a.a, vars); if (!x || a.b.t !== 'num' || fr.isZ(a.b.v)) return null; const R = new Map(); for (const [k, c] of x) R.set(k, fr.div(c, a.b.v)); return R; }
      case 'pow': { if (a.b.t !== 'num' || a.b.v.d !== 1n || a.b.v.n < 0n || a.b.v.n > 12n) return null; const x = polyOf(a.a, vars); if (!x) return null; let R = cst(fr.ONE); for (let i = 0n; i < a.b.v.n; i++) R = pMul(R, x); return R; }
      default: return null;
    }
  }
  const pDiff = (A, i) => { let R = new Map(); for (const [k, c] of A) { const e = k.split(',').map(Number); if (!e[i]) continue; const c2 = fr.mul(c, F(e[i])); e[i]--; R = pAdd(R, new Map([[e.join(','), c2]])); } return R; };
  const pInt = (A, i) => { const R = new Map(); for (const [k, c] of A) { const e = k.split(',').map(Number); e[i]++; R.set(e.join(','), fr.div(c, F(e[i]))); } return R; };
  function polyAst(A, vars) {
    const terms = [...A].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([k, c]) => {
      const e = k.split(',').map(Number);
      let t = null;
      e.forEach((x, i) => { if (!x) return; const f = x === 1 ? N.v(vars[i]) : N.pow(N.v(vars[i]), N.num(F(x))); t = t ? N.mul(t, f) : f; });
      return t ? N.mul(N.num(c), t) : N.num(c);
    });
    return terms.length ? simpAll(sumAst(terms)) : N.num(F(0));
  }
  /* potencial φ con ∇φ = F para componentes polinómicas (null si no se puede) */
  function potential(comps, vars) {
    const P = comps.map((c) => polyOf(c, vars));
    if (P.some((x) => !x)) return null;
    let phi = new Map();
    for (let i = 0; i < vars.length; i++) {
      let rest = P[i];
      rest = pAdd(rest, pDiff(phi, i), -1);
      phi = pAdd(phi, pInt(rest, i));
    }
    for (let i = 0; i < vars.length; i++) if (pAdd(pDiff(phi, i), P[i], -1).size) return null;
    return polyAst(phi, vars);
  }

  /* =================== 2. Divergencia, rotacional y laplaciano =================== */
  function divRot(latex) {
    const p = parseVecInput(latex);
    if (p.kind === 'change') throw new MErr('Escribe un campo vectorial F(x,y,z) = (P, Q, R) o una función escalar f(x,y,z) = … (no un cambio de variables).');
    const XYZ = ['x', 'y', 'z'];
    const bad = p.vars.filter((v) => !XYZ.includes(v));
    if (bad.length) throw new MErr('La divergencia, el rotacional y el laplaciano usan las variables x, y, z; sobra «' + bad.join(', ') + '».');
    const rows = [];
    const P0 = p.point;

    if (p.kind === 'scalar') {
      const vars = p.vars;
      const f = p.exprs[0], nm = p.name;
      const sec = vars.map((v) => deriv(deriv(f, v), v));
      rows.push({ l: nm + paren(vars.join(',')), r: L(f), note: 'Función escalar' });
      vars.forEach((v, i) => rows.push({ l: fracP(nm, v, 2), r: '=' + L(sec[i]), note: 'Derivada segunda respecto de ' + v + ' (derivamos dos veces)' }));
      const rawSum = sumAst(sec), tot = sumSimp(sec);
      const zero = isZeroAst(tot) || numZero(tot, vars);
      rows.push({ l: '\\Delta ' + nm, r: vars.map((v) => fracP(nm, v, 2)).join('+') + '=' + sumL(sec) + (L(rawSum) === L(zero ? N.num(F(0)) : tot) ? '' : '=' + L(zero ? N.num(F(0)) : tot)), note: 'Laplaciano: suma de las segundas derivadas puras', boxed: true });
      if (zero) rows.push({ l: '', r: '\\Delta ' + nm + '=0', note: nm + ' es armónica (su laplaciano es cero)' });
      if (P0) {
        const e = evalAt(zero ? N.num(F(0)) : tot, vars, P0);
        rows.push({ l: '\\Delta ' + nm + '(P)', r: e.latex, note: 'Laplaciano en P = (' + P0.latex.join(', ').replace(/\\pi\s*/g, 'π') + ')', boxed: true });
      }
      return [derivBlock(tidy(rows))];
    }

    // campo vectorial
    const m = p.exprs.length;
    if (m !== 2 && m !== 3) throw new MErr('El campo debe tener 2 o 3 componentes, por ejemplo F(x,y) = (P, Q) o F(x,y,z) = (P, Q, R); este tiene ' + m + '.');
    const vars = XYZ.slice(0, m);
    const extra = p.vars.filter((v) => !vars.includes(v));
    if (extra.length) throw new MErr('Un campo con ' + m + ' componentes solo puede depender de ' + vars.join(', ') + '; sobra «' + extra.join(', ') + '».');
    const nm = p.name, nmB = nm;
    const names = ['P', 'Q', 'R'].slice(0, m);
    const C = p.exprs;
    const dm = names.map((_, i) => vars.map((v) => deriv(C[i], v)));   // dm[i][j] = ∂comp_i/∂var_j
    rows.push({ l: nmB + paren(vars.join(',')), r: '\\left(' + names.join(',\\ ') + '\\right)=\\left(' + C.map(L).join(',\\ ') + '\\right)', note: 'Componentes del campo: ' + names.join(', ') });
    rows.push({ l: fracP(names[0], vars[0], 1), r: L(dm[0][0]) + names.slice(1).map((n, i) => ',\\quad ' + fracP(n, vars[i + 1], 1) + '=' + L(dm[i + 1][i + 1])).join(''), note: 'Las que necesita la divergencia: ∂P/∂x, ∂Q/∂y' + (m === 3 ? ', ∂R/∂z' : '') });
    const dterms = names.map((n, i) => dm[i][i]);
    const rawD = sumAst(dterms), dv = sumSimp(dterms);
    const dzero = isZeroAst(dv) || numZero(dv, vars);
    rows.push({ l: '\\nabla\\cdot ' + nmB, r: names.map((n, i) => fracP(n, vars[i], 1)).join('+') + '=' + sumL(dterms) + (L(rawD) === L(dzero ? N.num(F(0)) : dv) ? '' : '=' + L(dzero ? N.num(F(0)) : dv)), note: 'Divergencia: suma de las derivadas ∂P/∂x + ∂Q/∂y' + (m === 3 ? ' + ∂R/∂z' : '') + (dzero ? '. Es cero: el campo es solenoidal (incompresible)' : ''), boxed: true });

    // rotacional
    let rotComps, rotZero;
    const sd = (a, b) => N.sub(a, b);
    if (m === 3) {
      rows.push({
        l: '\\nabla\\times ' + nmB,
        r: '\\begin{vmatrix}\\mathbf{i}&\\mathbf{j}&\\mathbf{k}\\\\ \\frac{\\partial}{\\partial x}&\\frac{\\partial}{\\partial y}&\\frac{\\partial}{\\partial z}\\\\ P&Q&R\\end{vmatrix}',
        note: 'Rotacional como determinante simbólico (primera fila: i, j, k)',
      });
      const defs = [
        { n: 'x', lbl: '\\frac{\\partial R}{\\partial y}-\\frac{\\partial Q}{\\partial z}', a: dm[2][1], b: dm[1][2], t: 'R_y − Q_z' },
        { n: 'y', lbl: '\\frac{\\partial P}{\\partial z}-\\frac{\\partial R}{\\partial x}', a: dm[0][2], b: dm[2][0], t: 'P_z − R_x' },
        { n: 'z', lbl: '\\frac{\\partial Q}{\\partial x}-\\frac{\\partial P}{\\partial y}', a: dm[1][0], b: dm[0][1], t: 'Q_x − P_y' },
      ];
      rotComps = defs.map((d) => {
        const raw = sd(d.a, d.b), s = simpAll(raw), z = isZeroAst(s) || numZero(s, vars);
        const fin = z ? N.num(F(0)) : s;
        rows.push({ l: '(\\nabla\\times ' + nmB + ')_{' + d.n + '}', r: d.lbl + '=' + L(raw) + (L(raw) === L(fin) ? '' : '=' + L(fin)), note: 'Componente ' + d.n + ': ' + d.t.replace('P_z', '∂P/∂z').replace('R_x', '∂R/∂x').replace('R_y', '∂R/∂y').replace('Q_z', '∂Q/∂z').replace('Q_x', '∂Q/∂x').replace('P_y', '∂P/∂y') });
        return fin;
      });
      rotZero = rotComps.every(isZeroAst);
      rows.push({ l: '\\nabla\\times ' + nmB, r: '\\left(' + rotComps.map(L).join(',\\ ') + '\\right)', note: 'Rotacional (vector)', boxed: true });
    } else {
      const raw = sd(dm[1][0], dm[0][1]), s = simpAll(raw), z = isZeroAst(s) || numZero(s, vars);
      const fin = z ? N.num(F(0)) : s;
      rows.push({ l: '\\nabla\\times ' + nmB, r: '\\frac{\\partial Q}{\\partial x}-\\frac{\\partial P}{\\partial y}=' + L(raw) + (L(raw) === L(fin) ? '' : '=' + L(fin)), note: 'Rotacional en el plano: solo tiene componente k, ∂Q/∂x − ∂P/∂y', boxed: true });
      rotComps = [fin];
      rotZero = isZeroAst(fin);
    }
    if (rotZero) {
      rows[rows.length - 1].note += '. Rotacional nulo: el campo es conservativo (irrotacional), existe un potencial φ con ∇φ = F (si el dominio no tiene agujeros)';
      const phi = potential(C, vars);
      if (phi) {
        const lead = '\\varphi=' + L(phi);
        rows.push({ l: '\\varphi', r: '=' + L(phi) + '+C', note: 'Potencial: integramos P respecto de x, Q respecto de y' + (m === 3 ? ', R respecto de z' : '') + ' sin repetir términos', boxed: true });
        void lead;
      }
    } else if (rotComps.some((c) => !isZeroAst(c))) {
      rows[rows.length - 1].note += '. No es nulo: el campo no es conservativo';
    }

    if (P0) {
      const dd = evalAt(dzero ? N.num(F(0)) : dv, vars, P0);
      rows.push({ l: '\\nabla\\cdot ' + nmB + '(P)', r: dd.latex, note: 'Divergencia en P = (' + P0.latex.join(', ').replace(/\\pi\s*/g, 'π') + ')', boxed: true });
      const rr = rotComps.map((c) => evalAt(c, vars, P0).latex);
      rows.push({ l: '\\nabla\\times ' + nmB + '(P)', r: m === 3 ? '\\left(' + rr.join(',\\ ') + '\\right)' : rr[0], note: 'Rotacional en P', boxed: true });
    }
    return [derivBlock(tidy(rows))];
  }

  return { jacobian, divRot };
});
