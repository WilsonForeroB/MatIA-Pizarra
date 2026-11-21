/* Lectura común de la línea para las operaciones de cálculo vectorial.
   Acepta, separados por comas al nivel superior:
     f(x,y,z) = expr  ·  z = expr  ·  expr                      → función escalar
     F(x,y) = (e1, e2)  ·  F = \left(e1,\ e2\right)              → función vectorial (campo)
     x = r\cos\theta, y = r\sin\theta                             → cambio de variables
   y además, opcionalmente, P = (1, 2) (punto) y u = (3, 4) o \vec{u} = … (dirección). */
MatIA.define('engine/ops/vec-input', ['engine/core', 'engine/ops/expr'], (ME, $expr) => {
  'use strict';
  const { MErr } = ME;
  const { parseExpr, varsOf, simpAll, N, L, evalNum } = $expr;

  const ORDER = ['x', 'y', 'z', 't', 'u', 'v', 'w', 'r', 's', '\\rho', '\\theta', '\\varphi', '\\phi'];
  const orderVars = (vs) => [...vs].sort((a, b) => {
    const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || (a < b ? -1 : a > b ? 1 : 0);
  });

  /* Limpia lo que MathLive añade y no aporta. */
  const clean = (s) => s.replace(/\\left|\\right/g, '').replace(/\\[,;:!]|\\quad|\\qquad|\\ |~/g, ' ').replace(/\\cdot/g, '\\cdot ').replace(/\\(vec|mathbf)\s+/g, '\\$1').trim();

  /* Divide por un separador al nivel superior (fuera de (), [], {}). */
  function splitTopStr(s, sep) {
    const out = [];
    let d = 0, cur = '';
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === '\\') { const m = /^\\[a-zA-Z]+|^\\./.exec(s.slice(i)); cur += m[0]; i += m[0].length - 1; continue; }
      if (c === '(' || c === '[' || c === '{') d++;
      else if (c === ')' || c === ']' || c === '}') d--;
      if (d === 0 && c === sep) { out.push(cur); cur = ''; continue; }
      cur += c;
    }
    out.push(cur);
    return out.map((x) => x.trim()).filter((x) => x.length);
  }
  const topEq = (s) => { const p = splitTopStr(s, '='); return p.length === 2 ? p : null; };
  /* "(a, b, c)" → ['a','b','c'] si toda la cadena es una tupla con al menos 2 elementos. */
  function tupleOf(s) {
    s = s.trim();
    if (!/^\(.*\)$/.test(s) && !/^\[.*\]$/.test(s)) return null;
    // los paréntesis exteriores deben cerrarse al final
    let d = 0;
    for (let i = 0; i < s.length; i++) { if ('([{'.includes(s[i])) d++; else if (')]}'.includes(s[i])) d--; if (d === 0 && i < s.length - 1) return null; }
    const parts = splitTopStr(s.slice(1, -1), ',');
    return parts.length >= 2 ? parts : null;
  }
  const nameRe = /^(\\vec\{?([a-zA-Z])\}?|\\mathbf\{([a-zA-Z])\}|([a-zA-Z]))(_\{?[a-zA-Z0-9]+\}?)?$/;
  const bareName = (s) => { const m = nameRe.exec(s.trim()); return m ? (m[2] || m[3] || m[4]) : null; };
  /* "f(x,y)" → { name:'f', vars:['x','y'] } */
  function declOf(s) {
    const m = /^(\\vec\{?([a-zA-Z])\}?|\\mathbf\{([a-zA-Z])\}|([a-zA-Z]))\s*\((.*)\)$/.exec(s.trim());
    if (!m) return null;
    const vars = splitTopStr(m[5], ',').map((v) => v.trim().replace(/\s+/g, ''));
    if (!vars.length || !vars.every((v) => /^([a-zA-Z]|\\[a-zA-Z]+)$/.test(v))) return null;
    return { name: m[2] || m[3] || m[4], vars: vars.map((v) => (v.startsWith('\\') ? v : v)) };
  }
  const parse = (s) => parseExpr(s, { var: 'x' });

  function pointOf(parts, what) {
    const asts = parts.map((p) => simpAll(parse(p)));
    const val = asts.map((a) => { const v = evalNum(a, {}); if (!Number.isFinite(v)) throw new MErr('Las coordenadas de ' + what + ' deben ser números.'); return v; });
    return { ast: asts, val, latex: asts.map(L) };
  }

  /* opts.want: 'scalar' | 'vector' | 'any' (por defecto 'any') */
  function parseVecInput(latex, opts = {}) {
    const src = clean(String(latex || '').replace(/=\s*$/, ''));
    if (!src) throw new MErr('La línea está vacía.');
    const segs = splitTopStr(src, ',');
    let point = null, dir = null, decl = null, head = null;
    const change = [];
    const rest = [];
    for (const seg of segs) {
      const eq = topEq(seg);
      if (eq) {
        const nm = bareName(eq[0]);
        const tup = tupleOf(eq[1]);
        if (nm && tup && /^[PQA]$/.test(nm) && !point && !/^\\vec|^\\mathbf/.test(eq[0].trim())) { point = pointOf(tup, 'P'); continue; }
        if (nm && tup && (/^[uvdw]$/.test(nm) || /^\\vec/.test(eq[0].trim())) && !dir && !/[A-Z]/.test(nm)) { dir = pointOf(tup, nm); dir.name = nm; continue; }
        const dc = declOf(eq[0]);
        if (!head && (dc || (nm && !change.length))) {
          // ¿cambio de variables?  x = r cos θ  (nombre de una letra minúscula sin argumentos y sin tupla)
          if (!dc && nm && /^[xyz]$/.test(nm) && !tup) { change.push({ out: nm, src: eq[1] }); continue; }
          head = { lhs: eq[0], rhs: eq[1], decl: dc, name: dc ? dc.name : nm };
          continue;
        }
        if (nm && /^[xyz]$/.test(nm) && !tup) { change.push({ out: nm, src: eq[1] }); continue; }
        throw new MErr('No entiendo «' + seg + '». Escribe la función y, si quieres, P = (…) y u = (…).');
      }
      rest.push(seg);
    }
    // «z = expr» sola es la función, no un cambio de variables
    if (!head && change.length === 1) { head = { lhs: change[0].out, rhs: change[0].src, decl: null, name: change[0].out }; change.length = 0; }
    // Componentes sueltas tras F(x,y) = (…  ya se cogen en la tupla; lo que quede sin "=" es la expresión
    if (!head && !change.length) {
      if (!rest.length) throw new MErr('Escribe la función, por ejemplo f(x,y) = x^2y.');
      if (rest.length === 1) head = { lhs: null, rhs: rest[0], decl: null, name: null };
      else head = { lhs: null, rhs: '(' + rest.join(',') + ')', decl: null, name: null };
    } else if (rest.length) throw new MErr('Sobra «' + rest[0] + '» en la línea.');

    if (change.length && !head) {
      if (change.length < 2) throw new MErr('Un cambio de variables necesita al menos dos ecuaciones: x = …, y = ….');
      const exprs = change.map((c) => parse(c.src));
      const vs = new Set(); exprs.forEach((e) => varsOf(e, vs));
      const vars = orderVars(vs);
      if (vars.length !== exprs.length) throw new MErr('El cambio tiene ' + exprs.length + ' ecuaciones pero depende de ' + vars.length + ' variables (' + vars.join(', ') + ').');
      return { kind: 'change', name: null, outs: change.map((c) => c.out), vars, exprs, point, dir };
    }
    if (change.length) throw new MErr('No mezcles la función con ecuaciones x = …; escribe una cosa u otra.');

    const tup = tupleOf(head.rhs);
    const exprs = (tup || [head.rhs]).map(parse);
    const vs = new Set(); exprs.forEach((e) => varsOf(e, vs));
    let vars;
    if (head.decl) {
      vars = head.decl.vars;
      const extra = [...vs].filter((v) => !vars.includes(v));
      if (extra.length) throw new MErr('La función depende de ' + extra.join(', ') + ', que no está entre sus variables (' + vars.join(', ') + ').');
    } else if (head.name === 'z' && !tup) {
      vars = orderVars(new Set([...vs, 'x', 'y'].filter((v) => v !== 'z')));
    } else vars = orderVars(vs);
    if (!vars.length) throw new MErr('La función no depende de ninguna variable.');
    const kind = tup ? 'vector' : 'scalar';
    if (opts.want === 'scalar' && kind !== 'scalar') throw new MErr('Esta operación necesita una función escalar, por ejemplo f(x,y) = x^2y.');
    if (opts.want === 'vector' && kind !== 'vector') throw new MErr('Esta operación necesita una función vectorial, por ejemplo F(x,y) = (x^2y,\\ x+y).');
    if (point && point.val.length !== vars.length) throw new MErr('El punto tiene ' + point.val.length + ' coordenadas y la función ' + vars.length + ' variables (' + vars.join(', ') + ').');
    const name = head.name || (kind === 'vector' ? 'F' : 'f');
    return { kind, name, vars, exprs, point, dir };
  }

  /* Sustituye las variables por los valores (AST) y simplifica: valor exacto cuando se puede. */
  function subst(a, env) {
    if (a.t === 'var' && a.n in env) return env[a.n];
    const o = Object.assign({}, a);
    if (a.a) o.a = subst(a.a, env);
    if (a.b) o.b = subst(a.b, env);
    return o;
  }
  function atPoint(a, vars, point) {
    const env = {};
    vars.forEach((v, i) => { env[v] = point.ast[i]; });
    return simpAll(subst(a, env));
  }
  const numEnv = (vars, point) => { const env = {}; vars.forEach((v, i) => { env[v] = point.val[i]; }); return env; };

  return { parseVecInput, splitTopStr, tupleOf, subst, atPoint, numEnv, orderVars, N };
});
