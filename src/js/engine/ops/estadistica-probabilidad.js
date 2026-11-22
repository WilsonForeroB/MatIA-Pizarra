/* Operaciones 12: estadística, probabilidad y distribuciones. (de pizarra.html, líneas 3668-3668, 3672-3957). */
MatIA.define('engine/ops/estadistica-probabilidad', ['engine/core', 'engine/ops/expr', 'engine/ops/common'], (ME, $expr, $common) => {
  'use strict';
  const { MErr, F, fLatex } = ME;
  const { div, add, ZERO, isInt, sub, mul, isZ, ONE } = ME.fr;
  const { evalExact, parseExpr, evalNum } = $expr;
  const { fNum, fracOrDec, dec, fText, sqrtSimp, sqrtLatex, derivBlock, decT, fact, matrixOf, latexText } = $common;
  /* ====================== 12. Estadística y probabilidad ====================== */

  // Lista de datos: «2, 3, 5» o «x = 2; 3,5; 4» (con «;» se admite la coma decimal)
  function dataList(latex) {
    let t = String(latex).replace(/\\left|\\right|\\text\{([^}]*)\}/g, '$1').replace(/\\[,;: ]|\\quad/g, ' ');
    const i = t.lastIndexOf('=');
    if (i >= 0) t = t.slice(i + 1);
    t = t.replace(/\\\{|\\\}|\\lbrace|\\rbrace|[{}()[\]]/g, (m) => (m === '{' || m === '}' ? m : ' '));
    const semi = t.includes(';');
    if (semi) t = t.replace(/(\d)\{,\}(\d)/g, '$1.$2').replace(/(\d),(\d)/g, '$1.$2');
    t = t.replace(/(\d)\{,\}(\d)/g, '$1.$2');
    const parts = t.split(semi ? ';' : ',').map((x) => x.trim()).filter(Boolean);
    if (parts.length < 2) throw new MErr('Escribe al menos dos datos separados por comas, por ejemplo 2, 3, 5, 5, 7 (con ; si usas coma decimal).');
    let useDec = false;
    const vals = parts.map((x) => {
      if (/\d\.\d/.test(x)) useDec = true;
      try { return evalExact(parseExpr(x), {}); } catch (e) { throw new MErr('No entiendo el dato «' + x + '».'); }
    });
    return { vals, useDec };
  }
  function medianOf(sorted) {
    const n = sorted.length;
    return n % 2 ? sorted[(n - 1) / 2] : div(add(sorted[n / 2 - 1], sorted[n / 2]), F(2));
  }
  function statsSummary(latex) {
    const { vals, useDec } = dataList(latex);
    const n = vals.length;
    const xs = vals.slice().sort((a, b) => (fNum(a) - fNum(b)));
    const sum = xs.reduce(add, ZERO);
    const mean = div(sum, F(n));
    const L0 = (q) => fracOrDec(q, useDec);
    const lst = (arr) => arr.map(L0).join(',\\ ');
    const rows = [
      { l: '\\text{Datos ordenados}', r: lst(xs), note: 'n = ' + n + ' datos' },
      { l: '\\bar{x}', r: '\\frac{\\sum x_{i}}{n}=\\frac{' + L0(sum) + '}{' + n + '}' + (L0(mean) === '\\frac{' + L0(sum) + '}{' + n + '}' ? '' : '=' + L0(mean)) + (useDec || isInt(mean) ? '' : '\\approx ' + dec(fNum(mean))), note: 'Media: suma de los datos entre el número de datos', boxed: true },
    ];
    const med = medianOf(xs);
    rows.push({ l: 'Me', r: L0(med), note: n % 2 ? 'Mediana: el dato central (posición ' + (n + 1) / 2 + ')' : 'Mediana: media de los dos centrales (posiciones ' + n / 2 + ' y ' + (n / 2 + 1) + ')', boxed: true });
    const cnt = new Map();
    xs.forEach((x) => { const k = fText(x); cnt.set(k, { x, c: (cnt.get(k) || { c: 0 }).c + 1 }); });
    const maxc = Math.max(...[...cnt.values()].map((o) => o.c));
    const modes = [...cnt.values()].filter((o) => o.c === maxc).map((o) => o.x);
    rows.push({ l: 'Mo', r: maxc === 1 ? '\\text{no hay moda}' : lst(modes), note: maxc === 1 ? 'Todos los datos aparecen una vez' : 'El valor más repetido (' + maxc + ' veces)' + (modes.length > 1 ? ': distribución ' + (modes.length === 2 ? 'bimodal' : 'multimodal') : ''), boxed: maxc > 1 });
    const range = sub(xs[n - 1], xs[0]);
    rows.push({ l: '\\text{Rango}', r: L0(xs[n - 1]) + '-' + (xs[0].n < 0n ? '\\left(' + L0(xs[0]) + '\\right)' : L0(xs[0])) + '=' + L0(range), note: 'Máximo menos mínimo' });
    const devs = xs.map((x) => sub(x, mean));
    const ss = devs.reduce((a, d) => add(a, mul(d, d)), ZERO);
    const varP = div(ss, F(n)), varS = n > 1 ? div(ss, F(n - 1)) : null;
    const dShow = n <= 8 ? devs.map((d) => '\\left(' + L0(d) + '\\right)^{2}').join('+') : '\\sum\\left(x_{i}-\\bar{x}\\right)^{2}';
    rows.push({ l: '\\sigma^{2}', r: '\\frac{' + dShow + '}{' + n + '}=\\frac{' + L0(ss) + '}{' + n + '}=' + L0(varP) + (useDec || isInt(varP) ? '' : '\\approx ' + dec(fNum(varP))), note: 'Varianza poblacional: media de los cuadrados de las desviaciones' });
    const sd = (q) => { const sq = sqrtSimp(q); return (sq.m === 1n && !useDec ? fLatex(sq.k) : (useDec ? '' : sqrtLatex(q) + '\\approx ') + dec(Math.sqrt(fNum(q)))); };
    rows.push({ l: '\\sigma', r: '\\sqrt{' + L0(varP) + '}=' + sd(varP), note: 'Desviación típica poblacional', boxed: true });
    if (varS) {
      rows.push({ l: 's^{2}', r: '\\frac{' + L0(ss) + '}{' + (n - 1) + '}=' + L0(varS) + (useDec || isInt(varS) ? '' : '\\approx ' + dec(fNum(varS))), note: 'Varianza muestral (cuasivarianza): se divide entre n − 1' });
      rows.push({ l: 's', r: '\\sqrt{' + L0(varS) + '}=' + sd(varS), note: 'Desviación típica muestral' });
    }
    const half = Math.floor(n / 2);
    const lower = xs.slice(0, half), upper = xs.slice(n % 2 ? half + 1 : half);
    if (lower.length && upper.length) {
      const q1 = medianOf(lower), q3 = medianOf(upper);
      rows.push({ l: 'Q_{1},\\ Q_{2},\\ Q_{3}', r: L0(q1) + ',\\ ' + L0(med) + ',\\ ' + L0(q3), note: 'Cuartiles: Q₁ y Q₃ son las medianas de la mitad inferior y de la superior' });
      rows.push({ l: '\\text{RIC}', r: 'Q_{3}-Q_{1}=' + L0(sub(q3, q1)), note: 'Rango intercuartílico' });
      var box = { q1: fNum(q1), q3: fNum(q3) };
    }
    if (!isZ(mean)) rows.push({ l: 'CV', r: '\\frac{\\sigma}{\\bar{x}}\\approx ' + dec(Math.sqrt(fNum(varP)) / Math.abs(fNum(mean))) + '\\ (' + dec(100 * Math.sqrt(fNum(varP)) / Math.abs(fNum(mean)), 2) + '\\%)', note: 'Coeficiente de variación: dispersión relativa a la media' });
    const out = [derivBlock(rows)];
    if (box) out.push({ type: 'chart', kind: 'box', title: 'Diagrama de caja', data: xs.map(fNum), min: fNum(xs[0]), max: fNum(xs[n - 1]), q1: box.q1, med: fNum(med), q3: box.q3, mean: fNum(mean) });
    return out;
  }
  function freqTable(latex) {
    const { vals, useDec } = dataList(latex);
    const n = vals.length;
    const cnt = new Map();
    vals.forEach((x) => { const k = fText(x); cnt.set(k, { x, c: (cnt.get(k) || { c: 0 }).c + 1 }); });
    const cls = [...cnt.values()].sort((a, b) => fNum(a.x) - fNum(b.x));
    let N = 0, sumx = ZERO;
    const rows = cls.map((o) => {
      N += o.c;
      sumx = add(sumx, mul(o.x, F(o.c)));
      const fi = F(o.c, n), Fi = F(N, n);
      const t = (q) => (useDec ? decT(fNum(q)) : fText(q));
      return [t(o.x), String(o.c), fText(fi) + (fi.d === 1n ? '' : ' ≈ ' + decT(fNum(fi), 3)), String(N), fText(Fi), decT(100 * o.c / n, 1) + ' %', t(mul(o.x, F(o.c)))];
    });
    rows.push(['Total', String(n), '1', '', '', '100 %', useDec ? decT(fNum(sumx)) : fText(sumx)]);
    return [
      { type: 'table', head: ['xᵢ', 'nᵢ', 'fᵢ', 'Nᵢ', 'Fᵢ', '%', 'xᵢ·nᵢ'], rows, vbar: 1, hline: rows.length - 1, kind: 'freq', caption: 'Tabla de frecuencias (n = ' + n + '): absoluta nᵢ, relativa fᵢ = nᵢ/n, acumuladas Nᵢ y Fᵢ. Media = Σxᵢnᵢ / n = ' + (useDec ? decT(fNum(sumx) / n) : fText(div(sumx, F(n)))) },
      { type: 'chart', kind: 'bars', title: 'Diagrama de barras', labels: cls.map((o) => (useDec ? decT(fNum(o.x)) : fText(o.x))), values: cls.map((o) => o.c), ylabel: 'nᵢ' },
    ];
  }
  // Espacio muestral: «moneda, dado», «moneda, moneda, moneda», «\{R,V,A\}, dado»
  function sampleSpace(latex) {
    let t = String(latex).replace(/\\text\{([^}]*)\}|\\mathrm\{([^}]*)\}/g, (m, a, b) => a || b).replace(/\\left|\\right|\\[,; ]|\\quad/g, ' ').replace(/\\lbrace|\\\{/g, '{').replace(/\\rbrace|\\\}/g, '}');
    const i = t.lastIndexOf('=');
    if (i >= 0) t = t.slice(i + 1);
    // trozos separados por comas fuera de llaves o por \times
    const parts = [];
    let d = 0, cur = '';
    for (const ch of t.replace(/\\times|×/g, ',')) { if (ch === '{') d++; if (ch === '}') d--; if (ch === ',' && d === 0) { parts.push(cur); cur = ''; } else cur += ch; }
    parts.push(cur);
    const exps = [];
    for (let raw of parts.map((x) => x.trim()).filter(Boolean)) {
      let times = 1;
      const m = /\^\{?(\d+)\}?\s*$/.exec(raw); if (m) { times = +m[1]; raw = raw.slice(0, m.index); }
      const m2 = /^(\d+)\s*([a-z])/i.exec(raw.replace(/\s/g, '')); if (m2) { times = +m2[1]; raw = raw.replace(/^\s*\d+\s*/, ''); }
      const w = raw.replace(/[^a-záéíóúñ{},0-9]/gi, '').toLowerCase();
      let o;
      if (/^moneda/.test(w)) o = { name: 'moneda', out: ['C', 'X'] };
      else if (/^dado/.test(w)) o = { name: 'dado', out: ['1', '2', '3', '4', '5', '6'] };
      else if (/^\{.*\}$/.test(w)) o = { name: 'conjunto', out: w.slice(1, -1).split(',').map((x) => x.trim().toUpperCase()).filter(Boolean) };
      else throw new MErr('No reconozco «' + raw.trim() + '»: escribe moneda, dado o un conjunto como {R, V, A}, separados por comas.');
      if (!o.out.length) throw new MErr('El conjunto está vacío.');
      for (let k = 0; k < times; k++) exps.push(o);
    }
    if (!exps.length) throw new MErr('Escribe el experimento: por ejemplo moneda, dado o «moneda, moneda».');
    const total = exps.reduce((a, e) => a * e.out.length, 1);
    const desc = exps.map((e) => e.name).join(' × ');
    const out = [];
    let outcomes = [[]];
    if (total <= 216) for (const e of exps) outcomes = outcomes.flatMap((o) => e.out.map((x) => o.concat([x])));
    const fmt = (o) => (o.length === 1 ? o[0] : '(' + o.join(',') + ')');
    const rowsD = [
      { l: '\\Omega', r: total <= 64 ? '\\left\\lbrace ' + outcomes.map(fmt).join(',\\ ') + '\\right\\rbrace ' : '\\text{' + total + ' resultados}', note: 'Espacio muestral de ' + desc + (exps.some((e) => e.name === 'moneda') ? ' (C = cara, X = cruz)' : '') },
      { l: '|\\Omega|', r: exps.map((e) => e.out.length).join('\\cdot ') + '=' + total, note: 'Principio de multiplicación: resultados de cada experimento multiplicados', boxed: true },
      { l: 'P(\\text{cada resultado})', r: '\\frac{1}{' + total + '}', note: 'Regla de Laplace: casos favorables / casos posibles (resultados equiprobables)' },
    ];
    out.push(derivBlock(rowsD));
    if (exps.length === 2 && exps.every((e) => e.name === 'dado')) {
      const rows = [1, 2, 3, 4, 5, 6].map((a) => [String(a)].concat([1, 2, 3, 4, 5, 6].map((b) => String(a + b))));
      out.push({ type: 'table', head: ['+', '1', '2', '3', '4', '5', '6'], rows, vbar: 1, kind: 'values', caption: 'Suma de dos dados: P(suma = 7) = 6/36 = 1/6, la más probable' });
      const sums = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((sv) => 6 - Math.abs(7 - sv));
      out.push({ type: 'chart', kind: 'bars', title: 'Distribución de la suma de dos dados', labels: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(String), values: sums.map((c) => c / 36), valueLabels: sums.map((c) => fText(F(c, 36))), ylabel: 'P' });
    } else if (exps.length >= 2 && exps.every((e) => e.name === 'moneda') && exps.length <= 8) {
      const nC = exps.length;
      const vals = Array.from({ length: nC + 1 }, (_, k) => Number(fact(BigInt(nC)) / (fact(BigInt(k)) * fact(BigInt(nC - k)))));
      out.push({ type: 'chart', kind: 'bars', title: 'Número de caras al lanzar ' + nC + ' monedas', labels: vals.map((_, k) => String(k)), values: vals.map((c) => c / total), valueLabels: vals.map((c) => fText(F(c, total))), ylabel: 'P' });
    }
    return out;
  }
  // Tabla de contingencia: matriz de frecuencias → marginales, conjuntas y condicionadas
  function contingency(latex, env) {
    const m = matrixOf(latex, env);
    const R = m.r, C = m.c;
    const a = m.a;
    if (a.some((r) => r.some((v) => v.n < 0n))) throw new MErr('Las frecuencias no pueden ser negativas.');
    const rowT = a.map((r) => r.reduce(add, ZERO)), colT = a[0].map((_, j) => a.reduce((s0, r) => add(s0, r[j]), ZERO));
    const N = rowT.reduce(add, ZERO);
    if (isZ(N)) throw new MErr('La tabla está vacía.');
    const An = (i) => 'A' + '₁₂₃₄₅₆₇₈₉'[i], Bn = (j) => 'B' + '₁₂₃₄₅₆₇₈₉'[j];
    const t = (q) => fText(q);
    const out = [{ type: 'table', head: [''].concat(a[0].map((_, j) => Bn(j)), ['Total']), rows: a.map((r, i) => [An(i)].concat(r.map(t), [t(rowT[i])])).concat([['Total'].concat(colT.map(t), [t(N)])]), vbar: 1, hline: R, kind: 'cont', caption: 'Tabla de contingencia (N = ' + t(N) + ')' }];
    const P = (q) => div(q, N);
    const rows = [];
    rows.push({ l: 'P(A_{1})', r: '\\frac{' + fLatex(rowT[0]) + '}{' + fLatex(N) + '}=' + fLatex(P(rowT[0])), note: 'Probabilidad marginal: total de la fila entre el total' });
    rows.push({ l: 'P(B_{1})', r: '\\frac{' + fLatex(colT[0]) + '}{' + fLatex(N) + '}=' + fLatex(P(colT[0])), note: 'Total de la columna entre el total' });
    rows.push({ l: 'P(A_{1}\\cap B_{1})', r: '\\frac{' + fLatex(a[0][0]) + '}{' + fLatex(N) + '}=' + fLatex(P(a[0][0])), note: 'Probabilidad conjunta: la casilla entre el total' });
    if (!isZ(colT[0])) rows.push({ l: 'P(A_{1}\\mid B_{1})', r: '\\frac{P(A_{1}\\cap B_{1})}{P(B_{1})}=\\frac{' + fLatex(a[0][0]) + '}{' + fLatex(colT[0]) + '}=' + fLatex(div(a[0][0], colT[0])), note: 'Condicionada: dentro de la columna B₁, qué parte es A₁', boxed: true });
    if (!isZ(rowT[0])) rows.push({ l: 'P(B_{1}\\mid A_{1})', r: '\\frac{P(A_{1}\\cap B_{1})}{P(A_{1})}=\\frac{' + fLatex(a[0][0]) + '}{' + fLatex(rowT[0]) + '}=' + fLatex(div(a[0][0], rowT[0])), note: 'Dentro de la fila A₁, qué parte es B₁', boxed: true });
    const indep = a.every((r, i) => r.every((v, j) => { const pij = P(v), pp = mul(P(rowT[i]), P(colT[j])); return pij.n === pp.n && pij.d === pp.d; }));
    const pp11 = mul(P(rowT[0]), P(colT[0]));
    rows.push({ l: 'P(A_{1})\\cdot P(B_{1})', r: fLatex(P(rowT[0])) + '\\cdot ' + fLatex(P(colT[0])) + '=' + fLatex(pp11) + (fText(pp11) === fText(P(a[0][0])) ? '=' : '\\neq ') + 'P(A_{1}\\cap B_{1})', note: indep ? 'Los sucesos de filas y columnas son independientes: P(A∩B) = P(A)·P(B) en todas las casillas' : 'No son independientes: P(A∩B) ≠ P(A)·P(B)' });
    out.push(derivBlock(rows));
    out.push({ type: 'table', head: ['P(Aᵢ | Bⱼ)'].concat(a[0].map((_, j) => Bn(j))), rows: a.map((r, i) => [An(i)].concat(r.map((v, j) => (isZ(colT[j]) ? '—' : t(div(v, colT[j])))))), vbar: 1, kind: 'cont', caption: 'Condicionadas por columna: cada columna suma 1' });
    out.push({ type: 'table', head: ['P(Bⱼ | Aᵢ)'].concat(a[0].map((_, j) => Bn(j))), rows: a.map((r, i) => [An(i)].concat(r.map((v) => (isZ(rowT[i]) ? '—' : t(div(v, rowT[i])))))), vbar: 1, kind: 'cont', caption: 'Condicionadas por fila: cada fila suma 1' });
    return out;
  }
  // Árbol de probabilidad y teorema de Bayes (datos del asistente)
  function bayes(causes, evName) {
    // causes: [{name, p: 'texto', l: 'texto'}]
    let useDec = false;
    const val = (txt, what) => {
      const s0 = String(txt).trim().replace(',', '.');
      if (!s0) throw new MErr('Falta ' + what + '.');
      if (/\d\.\d/.test(s0)) useDec = true;
      let q;
      try { q = evalExact(parseExpr(s0.replace(/%$/, '')), {}); } catch (e) { throw new MErr('No entiendo «' + txt + '» en ' + what + '.'); }
      if (/%$/.test(s0)) q = div(q, F(100));
      if (q.n < 0n || fNum(q) > 1) throw new MErr(what + ' debe estar entre 0 y 1.');
      return q;
    };
    const cs = causes.map((c, i) => ({ name: (c.name || 'A' + (i + 1)).trim(), p: val(c.p, 'P(' + (c.name || 'A' + (i + 1)) + ')'), l: val(c.l, 'P(' + evName + ' | ' + (c.name || 'A' + (i + 1)) + ')') }));
    const tot = cs.reduce((s0, c) => add(s0, c.p), ZERO);
    if (Math.abs(fNum(tot) - 1) > 1e-9) throw new MErr('Las probabilidades de las causas deben sumar 1 (ahora suman ' + decT(fNum(tot)) + ').');
    const L0 = (q) => (useDec ? dec(fNum(q)) : fLatex(q));
    const nmL = (t) => t.replace(/([A-Za-z])(\d+)/g, '$1_{$2}');
    const E = nmL(evName);
    const prods = cs.map((c) => mul(c.p, c.l));
    const PB = prods.reduce(add, ZERO);
    const rows = [
      { l: 'P(' + E + ')', r: cs.map((c) => 'P(' + nmL(c.name) + ')\\,P(' + E + '\\mid ' + nmL(c.name) + ')').join('+'), note: 'Teorema de la probabilidad total: sumamos las ramas que llegan a ' + evName },
      { r: cs.map((c) => L0(c.p) + '\\cdot ' + L0(c.l)).join('+') },
      { r: prods.map(L0).join('+') + '=' + L0(PB) + (useDec || isInt(PB) ? '' : '\\approx ' + dec(fNum(PB))), boxed: true },
    ];
    if (!isZ(PB)) cs.forEach((c, i) => {
      const post = div(prods[i], PB);
      rows.push({ l: 'P(' + nmL(c.name) + '\\mid ' + E + ')', r: '\\frac{P(' + nmL(c.name) + ')\\,P(' + E + '\\mid ' + nmL(c.name) + ')}{P(' + E + ')}=\\frac{' + L0(prods[i]) + '}{' + L0(PB) + '}=' + L0(post) + (useDec || isInt(post) ? '' : '\\approx ' + dec(fNum(post))), note: i === 0 ? 'Teorema de Bayes: probabilidad de cada causa sabiendo que ha ocurrido ' + evName : '', boxed: true });
    });
    const tree = { type: 'ptree', ev: evName, causes: cs.map((c, i) => ({ name: c.name, p: useDec ? decT(fNum(c.p)) : fText(c.p), l: useDec ? decT(fNum(c.l)) : fText(c.l), nl: useDec ? decT(1 - fNum(c.l)) : fText(sub(ONE, c.l)), prod: useDec ? decT(fNum(prods[i])) : fText(prods[i]), nprod: useDec ? decT(fNum(mul(c.p, sub(ONE, c.l)))) : fText(mul(c.p, sub(ONE, c.l))) })) };
    return [tree, derivBlock(rows)];
  }
  // Distribuciones: X ~ B(n, p) y X ~ N(μ, σ) con la probabilidad pedida
  function erf(x) {
    // serie de Taylor para |x| < 3 y fracción continua para colas: precisión ~1e-12
    const sgn = x < 0 ? -1 : 1; x = Math.abs(x);
    if (x < 3) { let sum = x, term = x; for (let n = 1; n < 120; n++) { term *= -x * x / n; const t2 = term / (2 * n + 1); sum += t2; if (Math.abs(t2) < 1e-16) break; } return sgn * 2 / Math.sqrt(Math.PI) * sum; }
    let f = 0; for (let n = 60; n >= 1; n--) f = n / 2 / (x + f);
    return sgn * (1 - Math.exp(-x * x) / Math.sqrt(Math.PI) / (x + f));
  }
  const Phi = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
  function probQuery(latex) {
    const t = String(latex).replace(/\\left|\\right/g, '').replace(/\\leq?|≤/g, '≤').replace(/\\geq?|≥/g, '≥').replace(/\\lt/g, '<').replace(/\\gt/g, '>').replace(/\\[,;: ]|\\quad|\s/g, '');
    const num = (x) => { const v = evalNum(parseExpr(x), {}); if (!Number.isFinite(v)) throw new MErr('Número no válido: ' + x); return v; };
    let m;
    if ((m = /P\(([^()≤≥<>=]+)(≤|<)X(≤|<)([^()]+)\)/.exec(t))) return { op: 'between', a: num(m[1]), b: num(m[4]), sa: m[2], sb: m[3] };
    if ((m = /P\(X(=|≤|<|≥|>)([^()]+)\)/.exec(t))) return { op: m[1], a: num(m[2]) };
    return null;
  }
  function distParams(latex, letter) {
    const t = String(latex).replace(/\\left|\\right|\s/g, '');
    const re = new RegExp(letter + '\\(([^,()]+(?:\\([^()]*\\))?[^,()]*),([^()]+(?:\\([^()]*\\))?[^()]*)\\)');
    const m = re.exec(t);
    if (!m) return null;
    return [m[1], m[2]];
  }
  function binomial(latex) {
    const pr = distParams(latex, 'B');
    if (!pr) throw new MErr('Escribe la binomial así: X\\sim B(10, 0.3),\\ P(X\\le 3).');
    const n = Math.round(evalNum(parseExpr(pr[0]), {}));
    let pQ = null, p;
    try { pQ = evalExact(parseExpr(pr[1].replace(',', '.')), {}); p = fNum(pQ); } catch (e) { p = evalNum(parseExpr(pr[1]), {}); }
    if (!(n >= 1 && n <= 200)) throw new MErr('n debe ser un entero entre 1 y 200.');
    if (!(p >= 0 && p <= 1)) throw new MErr('p debe estar entre 0 y 1.');
    const pL = pQ && !/\./.test(pr[1]) ? fLatex(pQ) : dec(p), qL = pQ && !/\./.test(pr[1]) ? fLatex(sub(ONE, pQ)) : dec(1 - p);
    const C = (k) => Number(fact(BigInt(n)) / (fact(BigInt(k)) * fact(BigInt(n - k))));
    const pmf = (k) => C(k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
    const q = probQuery(latex);
    const rows = [{ l: '\\text{Modelo}', r: 'X\\sim B(' + n + ',\\ ' + pL + ')', note: 'Binomial: número de éxitos en ' + n + ' pruebas independientes con probabilidad de éxito p = ' + latexText(pL) }];
    const pP = /frac/.test(pL) ? '\\left(' + pL + '\\right)' : pL;
    rows.push({ l: 'P(X=k)', r: '\\binom{' + n + '}{k}\\,' + pP + '^{k}\\,\\left(' + qL + '\\right)^{' + n + '-k}', note: 'Fórmula de la binomial' });
    const ks = [];
    let lab = '';
    if (q) {
      const kk = (v) => Math.round(v);
      if (q.op === '=') { ks.push(kk(q.a)); lab = 'P(X=' + kk(q.a) + ')'; }
      if (q.op === '≤' || q.op === '<') { const top = q.op === '≤' ? Math.floor(q.a) : Math.ceil(q.a) - 1; for (let k = 0; k <= Math.min(n, top); k++) ks.push(k); lab = 'P(X' + (q.op === '≤' ? '\\le ' : '<') + dec(q.a) + ')'; }
      if (q.op === '≥' || q.op === '>') { const lo = q.op === '≥' ? Math.ceil(q.a) : Math.floor(q.a) + 1; for (let k = Math.max(0, lo); k <= n; k++) ks.push(k); lab = 'P(X' + (q.op === '≥' ? '\\ge ' : '>') + dec(q.a) + ')'; }
      if (q.op === 'between') { const lo = q.sa === '≤' ? Math.ceil(q.a) : Math.floor(q.a) + 1, hi = q.sb === '≤' ? Math.floor(q.b) : Math.ceil(q.b) - 1; for (let k = Math.max(0, lo); k <= Math.min(n, hi); k++) ks.push(k); lab = 'P(' + dec(q.a) + (q.sa === '≤' ? '\\le ' : '<') + 'X' + (q.sb === '≤' ? '\\le ' : '<') + dec(q.b) + ')'; }
      const total = ks.reduce((s0, k) => s0 + pmf(k), 0);
      if (ks.length === 1) {
        const k = ks[0];
        rows.push({ l: lab, r: '\\binom{' + n + '}{' + k + '}\\,' + pP + '^{' + k + '}\\,\\left(' + qL + '\\right)^{' + (n - k) + '}=' + C(k) + '\\cdot ' + dec(Math.pow(p, k), 6) + '\\cdot ' + dec(Math.pow(1 - p, n - k), 6) + '\\approx ' + dec(total), note: 'Sustituimos k = ' + k, boxed: true });
      } else if (ks.length) {
        const comp = ks.length > n + 1 - ks.length && ks.length > 6;
        if (comp) {
          const rest = []; for (let k = 0; k <= n; k++) if (!ks.includes(k)) rest.push(k);
          rows.push({ l: lab, r: '1-\\left(' + rest.map((k) => 'P(X=' + k + ')').join('+') + '\\right)', note: 'Es más corto restar del 1 los casos que no entran' });
          rows.push({ r: '1-\\left(' + rest.map((k) => dec(pmf(k))).join('+') + '\\right)\\approx ' + dec(total), boxed: true });
        } else {
          rows.push({ l: lab, r: ks.map((k) => 'P(X=' + k + ')').join('+'), note: 'Sumamos los valores de k que cumplen la condición' });
          rows.push({ r: ks.map((k) => dec(pmf(k))).join('+') + '\\approx ' + dec(total), boxed: true });
        }
      } else rows.push({ l: lab, r: '0', note: 'Ningún valor de k cumple la condición', boxed: true });
    }
    rows.push({ l: 'E[X]', r: 'np=' + n + '\\cdot ' + pL + '=' + dec(n * p), note: 'Media (esperanza)' });
    rows.push({ l: '\\operatorname{Var}(X)', r: 'np(1-p)=' + dec(n * p * (1 - p)) + ',\\quad \\sigma=\\sqrt{np(1-p)}\\approx ' + dec(Math.sqrt(n * p * (1 - p))), note: 'Varianza y desviación típica' });
    const labels = [], values = [];
    for (let k = 0; k <= n; k++) { labels.push(String(k)); values.push(pmf(k)); }
    return [derivBlock(rows), { type: 'chart', kind: 'bars', title: 'Distribución B(' + n + ', ' + decT(p) + ')' + (q ? ': en color los valores de k que suman ' + latexText(lab.replace(/\\le\s?/g, '≤').replace(/\\ge\s?/g, '≥')) : ''), labels, values, hi: ks, ylabel: 'P(X = k)' }];
  }
  function normal(latex) {
    const pr = distParams(latex, 'N');
    if (!pr) throw new MErr('Escribe la normal así: X\\sim N(100, 15),\\ P(X\\le 120). El segundo número es la desviación típica σ.');
    const mu = evalNum(parseExpr(pr[0]), {}), sg = evalNum(parseExpr(pr[1]), {});
    if (!(sg > 0)) throw new MErr('σ debe ser positiva.');
    const q = probQuery(latex);
    const rows = [{ l: '\\text{Modelo}', r: 'X\\sim N(' + dec(mu) + ',\\ ' + dec(sg) + ')', note: 'Normal de media μ = ' + decT(mu) + ' y desviación típica σ = ' + decT(sg) }];
    rows.push({ l: 'Z', r: '\\frac{X-\\mu}{\\sigma}\\sim N(0,1)', note: 'Tipificamos para usar la normal estándar' });
    let a = null, b = null, val = null, lab = '';
    const zf = (x) => (x - mu) / sg;
    const zL = (x) => '\\frac{' + dec(x) + '-' + (mu < 0 ? '\\left(' + dec(mu) + '\\right)' : dec(mu)) + '}{' + dec(sg) + '}=' + dec(zf(x), 2);
    if (q) {
      if (q.op === '=') { rows.push({ l: 'P(X=' + dec(q.a) + ')', r: '0', note: 'En una variable continua la probabilidad de un valor concreto es 0', boxed: true }); a = b = q.a; }
      else if (q.op === '≤' || q.op === '<') { b = q.a; const z = zf(b); val = Phi(z); lab = 'P(X' + (q.op === '≤' ? '\\le ' : '<') + dec(b) + ')'; rows.push({ l: lab, r: 'P\\left(Z\\le ' + zL(b) + '\\right)', note: 'Tipificamos' }); rows.push({ r: '\\Phi(' + dec(z, 2) + ')\\approx ' + dec(val), note: z < 0 ? 'Con tablas: Φ(−z) = 1 − Φ(z)' : 'Valor de la tabla de la normal N(0, 1)', boxed: true }); }
      else if (q.op === '≥' || q.op === '>') { a = q.a; const z = zf(a); val = 1 - Phi(z); lab = 'P(X' + (q.op === '≥' ? '\\ge ' : '>') + dec(a) + ')'; rows.push({ l: lab, r: '1-P\\left(Z\\le ' + zL(a) + '\\right)', note: 'Complementario: 1 menos la cola izquierda' }); rows.push({ r: '1-\\Phi(' + dec(z, 2) + ')=1-' + dec(Phi(z)) + '\\approx ' + dec(val), boxed: true }); }
      else if (q.op === 'between') { a = q.a; b = q.b; const za = zf(a), zb = zf(b); val = Phi(zb) - Phi(za); lab = 'P(' + dec(a) + '\\le X\\le ' + dec(b) + ')'; rows.push({ l: lab, r: 'P\\left(' + dec(za, 2) + '\\le Z\\le ' + dec(zb, 2) + '\\right)', note: 'Tipificamos los dos extremos: z = (x − μ)/σ' }); rows.push({ r: '\\Phi(' + dec(zb, 2) + ')-\\Phi(' + dec(za, 2) + ')=' + dec(Phi(zb)) + '-' + dec(Phi(za)) + '\\approx ' + dec(val), boxed: true }); }
    }
    if (val != null) rows.push({ l: '\\text{En porcentaje}', r: dec(100 * val, 2) + '\\%', note: 'Aproximadamente' });
    return [derivBlock(rows), { type: 'chart', kind: 'normal', title: 'N(' + decT(mu) + ', ' + decT(sg) + ')' + (val != null ? ': área sombreada ≈ ' + decT(val) : ''), mu, sigma: sg, a, b }];
  }

  return { statsSummary, freqTable, sampleSpace, contingency, bayes, binomial, normal, Phi };
});
