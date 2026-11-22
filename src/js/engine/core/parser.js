/* Parser y evaluador de expresiones con matrices (evaluate). (de pizarra.html, líneas 1245-1435). */
MatIA.define('engine/core/parser', ['engine/core/fraction-matrix', 'engine/core/tokenizer'], ($fractionMatrix, $tokenizer) => {
  'use strict';
  const { MErr, opAdd, opMul, S, F, opDiv, transpose, isInt, inv, pow, fromDec, M, det, neg, sqrtExact, trace, rank } = $fractionMatrix;
  const { FUNCS, GREEK, isOp, isCmd, readName } = $tokenizer;
  /* ---------- Parser y evaluador ---------- */
  function evaluate(toks, env) {
    let pos = 0, absDepth = 0;
    const peek = () => toks[pos];
    const next = () => toks[pos++];
    const expect = (k, v) => {
      const t = next();
      if (!t || t.k !== k || (v !== undefined && t.v !== v)) throw new MErr('La expresión está incompleta o mal escrita.');
      return t;
    };
    const startsPrimary = (t) => {
      if (!t) return false;
      if (t.k === 'num' || t.k === 'id' || t.k === '{') return true;
      if (t.k === 'op') return t.v === '(' || t.v === '[' || (t.v === '|' && absDepth === 0);
      if (t.k === 'cmd') return ['frac', 'dfrac', 'tfrac', 'begin', 'sqrt'].includes(t.v) || !!FUNCS[t.v] || GREEK.has(t.v);
      return false;
    };
    function expr() {
      let v = unary();
      for (;;) {
        const t = peek();
        if (isOp(t, '+')) { next(); v = opAdd(v, term(), 1); }
        else if (isOp(t, '-')) { next(); v = opAdd(v, term(), -1); }
        else return v;
      }
    }
    function unary() {
      if (isOp(peek(), '-')) { next(); return opMul(S(F(-1)), term()); }
      if (isOp(peek(), '+')) { next(); return term(); }
      return term();
    }
    function term() {
      let v = postfix();
      for (;;) {
        const t = peek();
        if (isCmd(t, 'cdot') || isCmd(t, 'times') || isOp(t, '*')) { next(); v = opMul(v, postfix()); }
        else if (isCmd(t, 'div') || isOp(t, '/') || isOp(t, ':')) { next(); v = opDiv(v, postfix()); }
        else if (startsPrimary(t)) v = opMul(v, postfix());
        else return v;
      }
    }
    function postfix() {
      let v = primary();
      for (;;) {
        if (isOp(peek(), '^')) {
          next();
          let et;
          if (peek() && peek().k === '{') {
            next();
            const start = pos;
            let d = 1;
            while (pos < toks.length && d > 0) { if (toks[pos].k === '{') d++; else if (toks[pos].k === '}') d--; pos++; }
            et = toks.slice(start, pos - 1);
          } else et = [next()];
          if (et.length === 1 && ((et[0].k === 'id' && (et[0].v === 'T' || et[0].v === 't')) || (et[0].k === 'cmd' && (et[0].v === 'top' || et[0].v === 'intercal' || et[0].v === 'mathsf')))) { v = transpose(v); continue; }
          if (et.length === 2 && et[0].k === 'cmd' && et[0].v === 'mathsf') { v = transpose(v); continue; }
          if (et.length === 1 && isOp(et[0], "'")) { v = transpose(v); continue; }
          const e = evaluate(et, env);
          if (v.t === 'm' && e.t === 's' && isInt(e.v) && e.v.n === -1n) { v = inv(v); continue; }
          v = pow(v, e);
        } else if (isOp(peek(), "'")) { next(); v = transpose(v); }
        else return v;
      }
    }
    function group() {
      expect('{');
      const v = expr();
      expect('}');
      return v;
    }
    function primary() {
      const t = peek();
      if (!t) throw new MErr('Falta un operando.');
      if (t.k === 'num') { next(); return S(fromDec(t.v)); }
      if (t.k === '{') return group();
      if (isOp(t, '(') || isOp(t, '[')) {
        next();
        let v = expr();
        if (isCmd(peek(), 'middle')) {
          // (A | b) escrito como \left( A \middle| b \right): matriz ampliada
          next();
          const braced = peek() && peek().k === '{';
          if (braced) next();
          if (!isOp(next(), '|')) throw new MErr('Falta la barra de la matriz ampliada.');
          if (braced) expect('}');
          const w = expr();
          if (v.t !== 'm' || w.t !== 'm' || v.r !== w.r) throw new MErr('Las dos partes de la matriz ampliada deben tener las mismas filas.');
          v = M(v.a.map((r, i) => r.concat(w.a[i])), v.c);
        }
        const c = next();
        if (!c || !(isOp(c, ')') || isOp(c, ']'))) throw new MErr('Falta cerrar un paréntesis.');
        return v;
      }
      if (isOp(t, '|') && absDepth === 0) {
        next(); absDepth++;
        const v = expr();
        absDepth--;
        if (!isOp(next(), '|')) throw new MErr('Falta cerrar la barra |.');
        if (v.t === 'm') return det(v);
        return S(v.v.n < 0n ? neg(v.v) : v.v);
      }
      if (t.k === 'cmd') {
        if (t.v === 'frac' || t.v === 'dfrac' || t.v === 'tfrac') { next(); const a = group(); const b = group(); return opDiv(a, b); }
        if (t.v === 'sqrt') { next(); if (isOp(peek(), '[')) throw new MErr('Solo calculo raíces cuadradas.'); return sqrtExact(group()); }
        if (t.v === 'begin') return env_();
        if (FUNCS[t.v]) {
          next();
          const arg = postfix();
          const f = FUNCS[t.v];
          if (f === 'det') return det(arg);
          if (f === 'tr') return trace(arg);
          if (arg.t !== 'm') throw new MErr('El rango solo tiene sentido para matrices.');
          return rank(arg);
        }
      }
      const nm = readName(toks, pos);
      if (nm) {
        pos = nm.end;
        if (!(nm.key in env)) throw new MErr('No conozco «' + nm.key + '». Defínela antes en otra línea, por ejemplo ' + nm.key + ' = (matriz).');
        return env[nm.key];
      }
      throw new MErr('No sé interpretar «' + (t.k === 'cmd' ? '\\' + t.v : t.v || t.k) + '».');
    }
    function readEnvName() {
      expect('{');
      let s = '';
      while (peek() && peek().k !== '}') { const x = next(); s += x.v || ''; }
      expect('}');
      return s;
    }
    function env_() {
      next(); // \begin
      const name = readEnvName();
      let aug = null;
      if (name === 'array') {
        expect('{');
        let cols = 0;
        while (peek() && peek().k !== '}') {
          const x = next();
          if (x.k === 'id' && /[lcr]/.test(x.v)) cols++;
          if (isOp(x, '|') && cols > 0) aug = cols;
        }
        expect('}');
      } else if (isOp(peek(), '[')) {
        // \begin{pmatrix}[cc|c]: formato de columnas con barra (matriz ampliada)
        next();
        let cols = 0;
        while (peek() && !isOp(peek(), ']')) {
          const x = next();
          if (x.k === 'id') cols += x.v.replace(/[^lcr]/g, '').length || 0;
          if (isOp(x, '|') && cols > 0) aug = cols;
        }
        next();
      }
      const MATS = ['pmatrix', 'bmatrix', 'Bmatrix', 'matrix', 'smallmatrix', 'vmatrix', 'Vmatrix', 'array', 'pmatrix*', 'bmatrix*'];
      if (!MATS.includes(name)) {
        if (name === 'cases') throw new MErr('Para resolver un sistema usa Operaciones ▾ → Gauss (o Cramer).');
        throw new MErr('No sé calcular con el entorno «' + name + '».');
      }
      const rows = [[]];
      const atEnd = () => isCmd(peek(), 'end');
      while (!atEnd()) {
        if (!peek()) throw new MErr('La matriz está incompleta.');
        if (peek().k === 'amp') { next(); continue; }
        if (peek().k === 'row') { next(); rows.push([]); continue; }
        const save = absDepth;
        absDepth = 0;
        const v = expr();
        absDepth = save;
        if (v.t !== 's') throw new MErr('Dentro de una matriz solo puede haber números.');
        rows[rows.length - 1].push(v.v);
        const p = peek();
        if (p && p.k !== 'amp' && p.k !== 'row' && !isCmd(p, 'end')) throw new MErr('No entiendo una de las celdas de la matriz.');
      }
      next(); // \end
      readEnvName();
      while (rows.length && rows[rows.length - 1].length === 0) rows.pop();
      if (!rows.length) throw new MErr('La matriz está vacía.');
      const c = rows[0].length;
      if (rows.some((r) => r.length !== c)) throw new MErr('Hay filas con distinto número de elementos (o huecos vacíos).');
      const m = M(rows, aug !== null && aug < c ? aug : null);
      if (name === 'vmatrix') return det(m);
      return m;
    }
    const v = expr();
    if (pos < toks.length) {
      const t = toks[pos];
      throw new MErr('No sé interpretar «' + (t.k === 'cmd' ? '\\' + t.v : t.v || t.k) + '».');
    }
    return v;
  }

  return { evaluate };
});
