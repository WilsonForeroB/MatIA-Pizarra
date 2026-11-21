/* Operaciones 14: trigonometría y geometría. (de pizarra.html, líneas 3959-4525). */
MatIA.define('engine/ops/geometria', ['engine/core', 'engine/ops/common', 'engine/ops/poly'], (ME, $common, $poly) => {
  'use strict';
  const { MErr, F, fLatex } = ME;
  const { ZERO, isZ, mul, fromDec, ONE, add, sub, div, abs, gcd, neg } = ME.fr;
  const { dec, decT, fParen, fText, derivBlock, latexText, sqrtSimp, fNum, sqrtLatex } = $common;
  const { termL } = $poly;
  /* ====================== 14. Trigonometría y geometría ====================== */
  // LaTeX → texto sencillo: 150°, 35°20′15″, (5π)/(6), sqrt(3), α…
  function geoText(latex) {
    let t = String(latex || '');
    t = t.replace(/\\(?:text|mathrm|operatorname|mathit|textrm)\{([^{}]*)\}/g, '$1');
    t = t.replace(/\^\{\\circ\}|\^\\circ|\\degree|\\circ/g, '°');
    t = t.replace(/\^\{\\prime\\prime\}|\^\{\\doubleprime\}|\\doubleprime|''/g, '″').replace(/\^\{\\prime\}|\^\\prime|\\prime|'/g, '′');
    t = t.replace(/\\left|\\right|\\[,;:! ]|\\quad|\\qquad|~/g, ' ');
    const G = { alpha: 'α', beta: 'β', gamma: 'γ', theta: 'θ', varphi: 'φ', phi: 'φ', pi: 'π', varepsilon: 'ε', omega: 'ω', delta: 'δ' };
    t = t.replace(/\\(alpha|beta|gamma|theta|varphi|phi|pi|varepsilon|omega|delta)(?![a-zA-Z])/g, (_, g) => G[g]);
    t = t.replace(/\\(?:cdot|times)/g, '*').replace(/\\div/g, '/').replace(/\\colon|\\equiv/g, ':');
    t = t.replace(/\\(arcsin|arccos|arctan|sinh|cosh|tanh|sin|cos|tan|cot|sec|csc)(?![a-zA-Z])/g, ' $1 ');
    // fracciones y raíces, de dentro hacia fuera
    for (let i = 0; i < 12; i++) {
      const u = t.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)');
      if (u === t) break;
      t = u;
    }
    t = t.replace(/\\frac(\d)(\d)/g, '(($1)/($2))');
    t = t.replace(/\{/g, '(').replace(/\}/g, ')').replace(/\\[a-zA-Z]+/g, '').replace(/\\/g, '');
    t = t.replace(/−/g, '-').replace(/\s+/g, ' ').trim();
    return t;
  }
  // Separa por comas o punto y coma de primer nivel (si hay «;», la coma puede ser decimal)
  function geoSplit(t) {
    const semi = /;/.test(t.replace(/\([^()]*\)/g, ''));
    const out = [];
    let depth = 0, cur = '';
    for (const ch of t) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (depth === 0 && (ch === ';' || (!semi && ch === ','))) { out.push(cur); cur = ''; continue; }
      cur += ch;
    }
    out.push(cur);
    return out.map((s) => (semi ? s.replace(/(\d),(\d)/g, '$1.$2') : s).trim()).filter(Boolean);
  }
  // Pequeño analizador de expresiones: números, π, sqrt, x, y, + − · / ^ y paréntesis
  function geoParse(s) {
    let i = 0;
    const src = s.replace(/\s+/g, '');
    const peek = () => src[i];
    const fail = () => { throw new MErr('No entiendo «' + s + '».'); };
    function expr() {
      let a = term();
      while (peek() === '+' || peek() === '-') { const o = src[i++]; a = { t: o, a, b: term() }; }
      return a;
    }
    function term() {
      let a = unary();
      for (;;) {
        const c = peek();
        if (c === '*' || c === '/') { i++; a = { t: c, a, b: unary() }; }
        else if (c && /[0-9.(πxys]/.test(c) && !(c === 's' && src.slice(i, i + 4) !== 'sqrt')) a = { t: '*', a, b: power() };
        else return a;
      }
    }
    function unary() { if (peek() === '-') { i++; return { t: 'neg', a: unary() }; } if (peek() === '+') { i++; return unary(); } return power(); }
    function power() {
      const a = prim();
      if (peek() === '^') { i++; return { t: '^', a, b: peek() === '-' ? (i++, { t: 'neg', a: prim() }) : prim() }; }
      return a;
    }
    function prim() {
      const c = peek();
      if (c === '(') { i++; const a = expr(); if (src[i++] !== ')') fail(); return a; }
      if (c === 'π') { i++; return { t: 'pi' }; }
      if (c === 'x' || c === 'y') { i++; return { t: 'var', v: c }; }
      if (src.slice(i, i + 4) === 'sqrt') { i += 4; const a = prim(); return { t: 'sqrt', a }; }
      const m = /^\d+(?:\.\d+)?|^\.\d+/.exec(src.slice(i));
      if (m) { i += m[0].length; return { t: 'num', v: m[0] }; }
      return fail();
    }
    const r = expr();
    if (i < src.length) fail();
    return r;
  }
  function geoNum(n) {
    switch (n.t) {
      case 'num': return parseFloat(n.v);
      case 'pi': return Math.PI;
      case 'var': throw new MErr('Aquí no esperaba la letra ' + n.v + '.');
      case 'neg': return -geoNum(n.a);
      case 'sqrt': return Math.sqrt(geoNum(n.a));
      case '+': return geoNum(n.a) + geoNum(n.b);
      case '-': return geoNum(n.a) - geoNum(n.b);
      case '*': return geoNum(n.a) * geoNum(n.b);
      case '/': return geoNum(n.a) / geoNum(n.b);
      case '^': return Math.pow(geoNum(n.a), geoNum(n.b));
    }
    throw new MErr('Expresión no válida.');
  }
  const hasPi = (n) => !!n && (n.t === 'pi' || hasPi(n.a) || hasPi(n.b));
  // Forma lineal exacta {x, y, c} (fracciones)
  function geoLin(n) {
    const K = (c) => ({ x: ZERO, y: ZERO, c });
    const isK = (l) => isZ(l.x) && isZ(l.y);
    const sc = (l, k) => ({ x: mul(l.x, k), y: mul(l.y, k), c: mul(l.c, k) });
    switch (n.t) {
      case 'num': return K(fromDec(n.v));
      case 'var': return n.v === 'x' ? { x: ONE, y: ZERO, c: ZERO } : { x: ZERO, y: ONE, c: ZERO };
      case 'neg': return sc(geoLin(n.a), F(-1));
      case '+': case '-': { const a = geoLin(n.a), b = geoLin(n.b), f = n.t === '+' ? add : sub; return { x: f(a.x, b.x), y: f(a.y, b.y), c: f(a.c, b.c) }; }
      case '*': { const a = geoLin(n.a), b = geoLin(n.b); if (isK(a)) return sc(b, a.c); if (isK(b)) return sc(a, b.c); throw new MErr('La ecuación no es lineal (no es una recta).'); }
      case '/': { const a = geoLin(n.a), b = geoLin(n.b); if (!isK(b) || isZ(b.c)) throw new MErr('Solo puedo dividir entre números distintos de cero.'); return sc(a, div(ONE, b.c)); }
      case '^': { const a = geoLin(n.a), b = geoLin(n.b); if (isK(a) && isK(b) && b.c.d === 1n && b.c.n >= 0n && b.c.n < 20n) { let r = ONE; for (let k = 0n; k < b.c.n; k++) r = mul(r, a.c); return K(r); } throw new MErr('La ecuación no es lineal (no es una recta).'); }
    }
    throw new MErr('Para rectas usa coeficientes racionales (sin π ni raíces).');
  }
  // Racional cercano con denominador pequeño
  function ratNear(v, maxD = 1000) {
    if (!Number.isFinite(v)) return null;
    for (let q = 1; q <= maxD; q++) { const p0 = Math.round(v * q); if (Math.abs(p0 / q - v) < 1e-9 * Math.max(1, Math.abs(v))) return F(p0, q); }
    return null;
  }
  // q·π en LaTeX
  function piLatex(q) {
    if (isZ(q)) return '0';
    const n = abs(q.n), sg = q.n < 0n ? '-' : '';
    if (q.d === 1n) return sg + (n === 1n ? '' : n) + '\\pi ';
    return sg + '\\frac{' + (n === 1n ? '' : n) + '\\pi}{' + q.d + '}';
  }
  const piText = (q) => { if (isZ(q)) return '0'; const n = abs(q.n), sg = q.n < 0n ? '−' : ''; return sg + (n === 1n ? '' : n) + 'π' + (q.d === 1n ? '' : '/' + q.d); };
  const degL = (v) => { const r = ratNear(v, 60); return (r ? (r.d === 1n ? fLatex(r) : dec(v, 4)) : dec(v, 4)) + '^{\\circ}'; };
  const degT = (v) => decT(v, 4) + '°';
  function dmsOf(v) {
    const sg = v < 0 ? -1 : 1; let x = Math.abs(v);
    let d = Math.floor(x + 1e-12), mFull = (x - d) * 60, m = Math.floor(mFull + 1e-9), s = (mFull - m) * 60;
    s = Math.round(s * 100) / 100;
    if (s >= 60) { s -= 60; m++; }
    if (m >= 60) { m -= 60; d++; }
    return { sg, d, m, s };
  }
  const dmsL = (v) => { const { sg, d, m, s } = dmsOf(v); return (sg < 0 ? '-' : '') + d + '^{\\circ}\\,' + m + '^{\\prime}\\,' + dec(s, 2) + '^{\\prime\\prime}'; };
  const dmsT = (v) => { const { sg, d, m, s } = dmsOf(v); return (sg < 0 ? '−' : '') + d + '° ' + m + '′ ' + decT(s, 2) + '″'; };
  // Lee un ángulo: 150°, 35°20′15″, 5π/6, 2.5 rad, 30 (grados por defecto)
  function parseAngle(text, defUnit = 'deg') {
    let t = String(text).replace(/\s+/g, '').replace(/^.*=/, '');
    let unit = null;
    if (/rad$/.test(t)) { unit = 'rad'; t = t.replace(/rad$/, ''); }
    const dms = /^([-+]?)(\d+(?:\.\d+)?)°(?:(\d+(?:\.\d+)?)′)?(?:(\d+(?:\.\d+)?)″)?$/.exec(t) || /^([-+]?)(\d+(?:\.\d+)?)°?(\d+(?:\.\d+)?)′(?:(\d+(?:\.\d+)?)″)?$/.exec(t);
    if (dms && !unit) {
      const sg = dms[1] === '-' ? -1 : 1, d = parseFloat(dms[2]), m = dms[3] ? parseFloat(dms[3]) : 0, s = dms[4] ? parseFloat(dms[4]) : 0;
      return { deg: sg * (d + m / 60 + s / 3600), unit: 'deg', dms: !!(dms[3] || dms[4]), parts: { sg, d, m, s }, src: t };
    }
    if (/°/.test(t)) { const ast = geoParse(t.replace(/°/g, '')); return { deg: geoNum(ast), unit: 'deg', src: t }; }
    if (!t) throw new MErr('Escribe un ángulo, por ejemplo 150° o \\frac{5\\pi}{6}.');
    const ast = geoParse(t);
    const v = geoNum(ast);
    if (!Number.isFinite(v)) throw new MErr('El ángulo no es un número.');
    if (unit === 'rad' || hasPi(ast) || defUnit === 'rad') return { deg: v * 180 / Math.PI, unit: 'rad', rad: v, piQ: hasPi(ast) ? ratNear(v / Math.PI, 720) : null, src: t };
    return { deg: v, unit: 'deg', src: t, bare: true };
  }
  const degExact = (deg) => ratNear(deg, 3600);
  const radLatexOf = (deg) => { const q = degExact(deg); if (q) { const r = div(q, F(180)); if (r.d <= 720n) return piLatex(r); } return dec(deg * Math.PI / 180, 4); };
  const radTextOf = (deg) => { const q = degExact(deg); if (q) { const r = div(q, F(180)); if (r.d <= 720n) return piText(r); } return decT(deg * Math.PI / 180, 4); };
  const mod360 = (v) => { const r = ((v % 360) + 360) % 360; return Math.abs(r - 360) < 1e-9 ? 0 : r; };

  function angleConvert(latex) {
    const items = geoSplit(geoText(latex)).map((x) => x.replace(/^[^=]*=/, ''));
    if (!items.length) throw new MErr('Escribe un ángulo: 150°, 35°20′15″, \\frac{5\\pi}{6} o 2.5 rad.');
    const angs = items.map((x) => parseAngle(x));
    if (angs.length > 1) {
      const rows = angs.map((a) => [a.unit === 'rad' ? (a.piQ ? piText(a.piQ) : decT(a.rad, 4)) + ' rad' : a.dms ? dmsT(a.deg) : degT(a.deg), degT(a.deg), radTextOf(a.deg) + ' rad', '≈ ' + decT(a.deg * Math.PI / 180, 4) + ' rad', dmsT(a.deg), degT(mod360(a.deg))]);
      return [{ type: 'table', head: ['Ángulo', 'Grados', 'Radianes', 'Decimal', 'G° M′ S″', 'En [0°, 360°)'], rows, caption: 'Conversión: radianes = grados · π/180 y grados = radianes · 180/π. 1° = 60′ y 1′ = 60″.' }];
    }
    const a = angs[0], rows = [];
    const deg = a.deg;
    if (a.unit === 'rad') {
      const rl = a.piQ ? piLatex(a.piQ) : dec(a.rad, 4);
      rows.push({ l: rl + '\\ \\text{rad}', r: rl + '\\cdot\\frac{180^{\\circ}}{\\pi}', note: 'De radianes a grados: multiplicamos por 180°/π' });
      rows.push({ r: degL(deg), boxed: true, note: a.piQ ? 'π rad = 180°, así que π se cancela' : '' });
      if (!ratNear(deg, 60)) rows.push({ r: dmsL(deg), note: 'En grados, minutos y segundos: la parte decimal · 60 da los minutos y la de estos · 60 los segundos' });
    } else {
      if (a.dms) {
        const p = a.parts;
        rows.push({ l: (p.sg < 0 ? '-' : '') + p.d + '^{\\circ}\\,' + p.m + '^{\\prime}\\,' + p.s + '^{\\prime\\prime}', r: (p.sg < 0 ? '-\\left(' : '') + p.d + '+\\frac{' + p.m + '}{60}+\\frac{' + p.s + '}{3600}' + (p.sg < 0 ? '\\right)' : ''), note: '1° = 60′ y 1′ = 60″: pasamos minutos y segundos a fracción de grado' });
        rows.push({ r: degL(deg), note: 'En grados decimales' });
      } else if (!ratNear(deg, 60)) {
        rows.push({ l: degL(deg), r: dmsL(deg), note: 'Grados, minutos y segundos: la parte decimal · 60 da los minutos y la de estos · 60 los segundos' });
      }
      const dl = degL(deg);
      const q = degExact(deg);
      rows.push({ l: dl, r: (q && q.d === 1n ? fParen(q) : dec(deg, 4)) + '\\cdot\\frac{\\pi}{180}', note: (a.bare ? 'Sin unidad lo tomo en grados (escribe rad para radianes). ' : '') + 'De grados a radianes: multiplicamos por π/180' });
      const rl = radLatexOf(deg);
      if (/pi/.test(rl)) rows.push({ r: rl + '\\ \\text{rad}\\approx ' + dec(deg * Math.PI / 180, 4) + '\\ \\text{rad}', boxed: true, note: q && q.d === 1n ? 'Simplificamos la fracción ' + fText(q) + '/180' : '' });
      else rows.push({ r: rl + '\\ \\text{rad}', boxed: true });
    }
    if (deg >= 360 || deg < 0) {
      const k = Math.floor(deg / 360 + 1e-12), r = mod360(deg);
      rows.push({ l: degL(deg), r: (k === 0 ? '' : (k === 1 ? '' : k === -1 ? '-' : k + '\\cdot ') + '360^{\\circ}' + (r >= 0 ? '+' : '')) + degL(r), note: 'Ángulo coterminal en [0°, 360°): ' + (k > 0 ? 'quitamos ' + k + (k === 1 ? ' vuelta' : ' vueltas') : 'sumamos ' + (-k) + (k === -1 ? ' vuelta' : ' vueltas')) + '. Tiene las mismas razones trigonométricas' });
    }
    const r0 = mod360(deg);
    rows.push({ l: '\\text{Posición}', r: '\\text{' + quadName(r0) + '}', note: quadNote(r0) });
    return [derivBlock(rows), { type: 'geo', kind: 'unit', deg: r0, label: latexText(degL(deg)).replace(/\^circ/g, '°').replace(/circ/g, '°') }];
  }
  function quadOf(d) { if (Math.abs(d % 90) < 1e-9 || Math.abs((d % 90) - 90) < 1e-9) return 0; return Math.floor(d / 90) + 1; }
  const ROM = ['', 'I', 'II', 'III', 'IV'];
  function quadName(d) { const q = quadOf(d); return !q ? 'sobre un eje' : 'cuadrante ' + ROM[q]; }
  function quadNote(d) {
    const q = quadOf(d);
    if (!q) return 'Ángulo cuadrantal (' + Math.round(d) + '°): el lado final está sobre un eje';
    return ['', 'Entre 0° y 90°: seno +, coseno +, tangente +', 'Entre 90° y 180°: seno +, coseno −, tangente −', 'Entre 180° y 270°: seno −, coseno −, tangente +', 'Entre 270° y 360°: seno −, coseno +, tangente −'][q];
  }
  // Valores exactos de los ángulos de referencia (0° a 90° de 15 en 15)
  const EX_SIN = { 0: ['0', '0'], 15: ['\\frac{\\sqrt{6}-\\sqrt{2}}{4}', '(√6 − √2)/4'], 30: ['\\frac{1}{2}', '1/2'], 45: ['\\frac{\\sqrt{2}}{2}', '√2/2'], 60: ['\\frac{\\sqrt{3}}{2}', '√3/2'], 75: ['\\frac{\\sqrt{6}+\\sqrt{2}}{4}', '(√6 + √2)/4'], 90: ['1', '1'] };
  const EX_TAN = { 0: ['0', '0'], 15: ['2-\\sqrt{3}', '2 − √3'], 30: ['\\frac{\\sqrt{3}}{3}', '√3/3'], 45: ['1', '1'], 60: ['\\sqrt{3}', '√3'], 75: ['2+\\sqrt{3}', '2 + √3'], 90: null };
  const EX_CSC = { 0: null, 15: ['\\sqrt{6}+\\sqrt{2}', '√6 + √2'], 30: ['2', '2'], 45: ['\\sqrt{2}', '√2'], 60: ['\\frac{2\\sqrt{3}}{3}', '2√3/3'], 75: ['\\sqrt{6}-\\sqrt{2}', '√6 − √2'], 90: ['1', '1'] };
  const TRIG = [
    { k: 'sin', L: '\\operatorname{sen}', T: 'sen', f: Math.sin, ex: (a) => EX_SIN[a] },
    { k: 'cos', L: '\\cos', T: 'cos', f: Math.cos, ex: (a) => EX_SIN[90 - a] },
    { k: 'tan', L: '\\operatorname{tg}', T: 'tg', f: Math.tan, ex: (a) => EX_TAN[a] },
    { k: 'csc', L: '\\operatorname{cosec}', T: 'cosec', f: (x) => 1 / Math.sin(x), ex: (a) => EX_CSC[a] },
    { k: 'sec', L: '\\sec', T: 'sec', f: (x) => 1 / Math.cos(x), ex: (a) => EX_CSC[90 - a] },
    { k: 'cot', L: '\\operatorname{cotg}', T: 'cotg', f: (x) => 1 / Math.tan(x), ex: (a) => EX_TAN[90 - a] },
  ];
  const sgnOf = (k, d) => { // signo de la razón k en el ángulo d ∈ [0, 360)
    const s = Math.sin(d * Math.PI / 180), c = Math.cos(d * Math.PI / 180), z = (v) => (Math.abs(v) < 1e-12 ? 0 : Math.sign(v));
    return { sin: z(s), csc: z(s), cos: z(c), sec: z(c), tan: z(s) * z(c), cot: z(s) * z(c) }[k];
  };
  function refAngle(d) { if (d <= 90) return d; if (d <= 180) return 180 - d; if (d <= 270) return d - 180; return 360 - d; }
  // valor de una razón: {L, T, num, undef}
  function trigValue(t, d) {
    const r = refAngle(d), ri = Math.round(r), exact = Math.abs(r - ri) < 1e-9 && ri % 15 === 0;
    const x = d * Math.PI / 180;
    const base = t.k === 'sin' || t.k === 'csc' ? Math.sin(x) : t.k === 'cos' || t.k === 'sec' ? Math.cos(x) : null;
    const undef = (() => { const s = Math.sin(x), c = Math.cos(x); if (t.k === 'tan' || t.k === 'sec') return Math.abs(c) < 1e-12; if (t.k === 'cot' || t.k === 'csc') return Math.abs(s) < 1e-12; return false; })();
    if (undef) return { L: '\\nexists', T: '∄', undef: true, num: NaN };
    void base;
    const num = t.f(x);
    if (exact) {
      const e = t.ex(ri); const sg = sgnOf(t.k, d);
      if (e) return { L: (sg < 0 ? '-' : '') + e[0], T: (sg < 0 ? '−' : '') + (/ [−+] /.test(e[1]) && sg < 0 ? '(' + e[1] + ')' : e[1]), num, exact: true, ref: ri };
    }
    return { L: dec(num, 4), T: decT(num, 4), num, exact: false };
  }
  function trigRatios(latex) {
    let t = geoText(latex);
    const fm = /(?:^|[^a-z])(arcsin|arccos|arctan|sen|sin|cosec|csc|cos|cotg|cot|tg|tan|sec)(?![a-z])/.exec(t);
    const asked = fm ? { sen: 'sin', sin: 'sin', cos: 'cos', tg: 'tan', tan: 'tan', cosec: 'csc', csc: 'csc', sec: 'sec', cotg: 'cot', cot: 'cot' }[fm[1]] || null : null;
    if (fm && /^arc/.test(fm[1])) throw new MErr('Esta operación calcula las razones de un ángulo: escribe, por ejemplo, \\sin 150° o 5π/6.');
    t = t.replace(/^[^=]*=(?=.*\d)/, '').replace(/(arcsin|arccos|arctan|sen|sin|cosec|csc|cos|cotg|cot|tg|tan|sec)/g, '').replace(/^\((.*)\)$/, '$1').trim();
    const a = parseAngle(t);
    const d0 = a.deg, d = mod360(d0), rows = [];
    const dl = a.unit === 'rad' && a.piQ ? piLatex(a.piQ) : degL(d0);
    rows.push({ l: '\\theta', r: a.unit === 'rad' ? dl + '=' + degL(d0) : dl + '=' + radLatexOf(d0) + '\\ \\text{rad}', note: a.unit === 'rad' ? 'Lo pasamos a grados (· 180°/π) para situarlo' : 'En grados y radianes' });
    if (d0 >= 360 || d0 < 0) {
      const k = Math.floor(d0 / 360 + 1e-12);
      rows.push({ l: '\\theta', r: (k === 1 ? '' : k === -1 ? '-' : k + '\\cdot ') + '360^{\\circ}+' + degL(d), note: 'Mismas razones que ' + degT(d) + ': ' + (k > 0 ? 'quitamos' : 'sumamos') + ' vueltas completas' });
    }
    rows.push({ l: '\\text{Posición}', r: '\\text{' + quadName(d) + '}', note: quadNote(d) });
    const ref = refAngle(d);
    const q = quadOf(d);
    const refL = degL(ref);
    const how = q === 1 ? '' : q === 2 ? '180^{\\circ}-' + degL(d) : q === 3 ? degL(d) + '-180^{\\circ}' : q === 4 ? '360^{\\circ}-' + degL(d) : '';
    if (q > 1) rows.push({ l: '\\alpha', r: how + '=' + refL, note: 'Ángulo de referencia en el primer cuadrante: ' + ['', '', 'suplementario (180° − θ)', 'θ − 180°', '360° − θ'][q] });
    const show = asked ? TRIG.filter((x) => x.k === asked) : TRIG.slice(0, 3);
    for (const tr of show) {
      const v = trigValue(tr, d);
      const sg = sgnOf(tr.k, d);
      let mid = '';
      if (q > 1 && !v.undef) mid = (sg < 0 ? '-' : '') + tr.L + ' ' + refL + '=';
      rows.push({ l: tr.L + ' ' + dl, r: mid + v.L + (v.exact && !/^-?\d+$/.test(v.L) ? '\\approx ' + dec(v.num, 4) : ''), boxed: !!asked || show.length === 3, note: v.undef ? (tr.k === 'tan' || tr.k === 'sec' ? 'No existe: el coseno vale 0' : 'No existe: el seno vale 0') : (q > 1 ? 'Mismo valor que en ' + degT(ref) + ' con el signo del ' + (q ? 'cuadrante ' + ROM[q] : '') + (sg < 0 ? ' (−)' : ' (+)') : v.exact ? 'Ángulo notable: valor exacto' : 'Valor aproximado con calculadora') });
    }
    const trows = TRIG.map((tr) => { const v = trigValue(tr, d); return [tr.T + ' θ', { sin: 'cateto opuesto / hipotenusa = y/r', cos: 'cateto contiguo / hipotenusa = x/r', tan: 'sen θ / cos θ = y/x', csc: '1 / sen θ', sec: '1 / cos θ', cot: '1 / tg θ = cos θ / sen θ' }[tr.k], v.T, v.undef ? '∄' : decT(v.num, 4)]; });
    const s = Math.sin(d * Math.PI / 180), c = Math.cos(d * Math.PI / 180);
    return [
      derivBlock(rows),
      { type: 'table', head: ['Razón', 'Definición', 'Valor', 'Decimal'], rows: trows, kind: 'trig', caption: 'Razones de θ = ' + degT(d0) + '. Comprobación: sen²θ + cos²θ = ' + decT(s * s + c * c, 6) + '.' },
      { type: 'geo', kind: 'unit', deg: d, label: a.unit === 'rad' && a.piQ ? piText(a.piQ) : degT(d0) },
    ];
  }
  function notableTable() {
    const angs = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360];
    const rows = angs.map((g) => {
      const d = g % 360;
      return [g + '°', radTextOf(g), trigValue(TRIG[0], d).T, trigValue(TRIG[1], d).T, trigValue(TRIG[2], d).T];
    });
    return [
      { type: 'table', head: ['Grados', 'Radianes', 'sen', 'cos', 'tg'], rows, kind: 'trig', hlines: [4, 8, 12], caption: 'Ángulos notables. Truco para 0°, 30°, 45°, 60°, 90°: el seno vale √0/2, √1/2, √2/2, √3/2, √4/2 y el coseno lo mismo al revés. En los otros cuadrantes se repiten los valores con el signo del cuadrante (todas +, seno +, tangente +, coseno +).' },
      { type: 'geo', kind: 'unitAll' },
    ];
  }

  /* --- Resolución de triángulos --- */
  const SIDE = { a: 'a', b: 'b', c: 'c' }, ANG = { A: 'A', B: 'B', C: 'C', 'α': 'A', 'β': 'B', 'γ': 'C' };
  function solveTriangle(latex) {
    const items = geoSplit(geoText(latex));
    const sides = {}, angs = {};
    for (const it of items) {
      const m = /^([abcABCαβγ])(?:_?\(?[^=]*\)?)?=(.+)$/.exec(it.replace(/\s+/g, '').replace(/^\\?hat\(([ABC])\)/, '$1'));
      if (!m) throw new MErr('Escribe los datos así: a=5, b=7, C=60° (lados a, b, c; ángulos A, B, C opuestos).');
      if (SIDE[m[1]]) { const v = geoNum(geoParse(m[2])); if (!(v > 0)) throw new MErr('Los lados deben ser positivos.'); sides[m[1]] = v; }
      else { const v = parseAngle(m[2]).deg; if (!(v > 0 && v < 180)) throw new MErr('Cada ángulo de un triángulo está entre 0° y 180°.'); angs[ANG[m[1]]] = v; }
    }
    const ns = Object.keys(sides).length, na = Object.keys(angs).length;
    if (ns + na < 3) throw new MErr('Hacen falta tres datos (con al menos un lado): por ejemplo a=5, b=7, C=60°.');
    if (ns === 0) throw new MErr('Con solo ángulos hay infinitos triángulos semejantes: añade un lado.');
    if (na >= 2 && Object.values(angs).reduce((s, x) => s + x, 0) >= 180 - 1e-9) throw new MErr('Los ángulos suman 180° o más: no hay triángulo.');
    const R = Math.PI / 180, sinD = (x) => Math.sin(x * R), cosD = (x) => Math.cos(x * R);
    const L = { a: 'a', b: 'b', c: 'c' }, AL = (k) => '\\hat{' + k + '}';
    const lo = (k) => k.toLowerCase(), up = (k) => k.toUpperCase();
    const approxL = (v) => (Math.abs(v - Math.round(v)) < 1e-9 ? '=' + Math.round(v) : '\\approx ' + dec(v, 4));
    const sv = (v) => dec(v, 4), av = (v) => dec(v, 2) + '^{\\circ}';
    const rows = [];
    rows.push({ l: '\\text{Datos}', r: [...['a', 'b', 'c'].filter((k) => sides[k] != null).map((k) => k + '=' + sv(sides[k])), ...['A', 'B', 'C'].filter((k) => angs[k] != null).map((k) => AL(k) + '=' + av(angs[k]))].join(',\\ '), note: 'Cada lado es opuesto al ángulo de su misma letra' });
    const sols = [];
    const lawCosAngle = (S, s) => { // ángulo opuesto a s conociendo los tres lados
      const o = ['a', 'b', 'c'].filter((k) => k !== lo(S));
      const p = s[o[0]], q = s[o[1]], r = s[lo(S)];
      const cv = (p * p + q * q - r * r) / (2 * p * q);
      const ang = Math.acos(Math.max(-1, Math.min(1, cv))) / R;
      const cvq = ratNear(cv, 2000);
      rows.push({ l: '\\cos ' + AL(S), r: '\\frac{' + o[0] + '^{2}+' + o[1] + '^{2}-' + lo(S) + '^{2}}{2' + o[0] + o[1] + '}=\\frac{' + sv(p) + '^{2}+' + sv(q) + '^{2}-' + sv(r) + '^{2}}{2\\cdot ' + sv(p) + '\\cdot ' + sv(q) + '}=' + (cvq && cvq.d <= 2000n && cvq.d !== 1n ? fLatex(cvq) + '\\approx ' : '') + sv(cv), note: 'Teorema del coseno despejando el ángulo' });
      rows.push({ l: AL(S), r: '\\arccos\\left(' + sv(cv) + '\\right)\\approx ' + av(ang), note: '' });
      return ang;
    };
    if (ns === 3) {
      const { a, b, c } = sides;
      if (a + b <= c || a + c <= b || b + c <= a) throw new MErr('Estos lados no cumplen la desigualdad triangular (cada lado menor que la suma de los otros dos): no hay triángulo.');
      rows.push({ l: '\\text{Caso}', r: '\\text{tres lados (LLL)}', note: 'Usamos el teorema del coseno: a² = b² + c² − 2bc·cos A' });
      const A = lawCosAngle('A', sides), B = lawCosAngle('B', sides);
      rows.push({ l: AL('C'), r: '180^{\\circ}-' + av(A) + '-' + av(B) + '\\approx ' + av(180 - A - B), note: 'Los ángulos de un triángulo suman 180°' });
      sols.push({ a, b, c, A, B, C: 180 - A - B });
    } else if (ns === 2) {
      const ks = Object.keys(sides), miss = ['a', 'b', 'c'].find((k) => sides[k] == null);
      const incl = angs[up(miss)];
      if (incl != null) {
        const [p, q] = ks, P0 = sides[p], Q0 = sides[q];
        rows.push({ l: '\\text{Caso}', r: '\\text{dos lados y el ángulo comprendido (LAL)}', note: 'Teorema del coseno para el lado que falta' });
        const r2 = P0 * P0 + Q0 * Q0 - 2 * P0 * Q0 * cosD(incl);
        const rr = Math.sqrt(r2);
        rows.push({ l: miss + '^{2}', r: p + '^{2}+' + q + '^{2}-2' + p + q + '\\cos ' + AL(up(miss)) + '=' + sv(P0) + '^{2}+' + sv(Q0) + '^{2}-2\\cdot ' + sv(P0) + '\\cdot ' + sv(Q0) + '\\cdot\\cos ' + av(incl) + approxL(r2) });
        rows.push({ l: miss, r: '\\sqrt{' + sv(r2) + '}' + approxL(rr) });
        const s = Object.assign({}, sides, { [miss]: rr });
        const X = lawCosAngle(up(p), s);
        const Y = 180 - incl - X;
        rows.push({ l: AL(up(q)), r: '180^{\\circ}-' + av(incl) + '-' + av(X) + '\\approx ' + av(Y), note: 'Los ángulos suman 180°' });
        sols.push(Object.assign(s, { [up(miss)]: incl, [up(p)]: X, [up(q)]: Y }));
      } else {
        // LLA: ángulo opuesto a uno de los lados conocidos
        const K = Object.keys(angs)[0], kS = lo(K), oS = ks.find((k) => k !== kS);
        if (sides[kS] == null) throw new MErr('Revisa los datos.');
        const a0 = sides[kS], b0 = sides[oS], A0 = angs[K];
        rows.push({ l: '\\text{Caso}', r: '\\text{dos lados y un ángulo no comprendido (LLA)}', note: 'Teorema del seno. ¡Ojo! Puede haber 0, 1 o 2 triángulos (caso ambiguo)' });
        const sB = b0 * sinD(A0) / a0;
        rows.push({ l: '\\frac{' + kS + '}{\\operatorname{sen}' + AL(K) + '}', r: '\\frac{' + oS + '}{\\operatorname{sen}' + AL(up(oS)) + '}\\ \\Rightarrow\\ \\operatorname{sen}' + AL(up(oS)) + '=\\frac{' + sv(b0) + '\\cdot\\operatorname{sen}' + av(A0) + '}{' + sv(a0) + '}\\approx ' + sv(sB), note: 'Teorema del seno: los lados son proporcionales a los senos de sus ángulos opuestos' });
        if (sB > 1 + 1e-12) { rows.push({ l: '\\text{Solución}', r: '\\text{no hay triángulo}', boxed: true, note: 'El seno no puede ser mayor que 1' }); return [derivBlock(rows)]; }
        const B1 = Math.asin(Math.min(1, sB)) / R, cands = [B1];
        if (Math.abs(B1 - 90) > 1e-7) cands.push(180 - B1);
        const ok = cands.filter((B) => A0 + B < 180 - 1e-9);
        rows.push({ l: AL(up(oS)), r: '\\arcsin\\left(' + sv(sB) + '\\right)\\approx ' + av(B1) + (cands.length > 1 ? '\\ \\text{ o }\\ 180^{\\circ}-' + av(B1) + '=' + av(180 - B1) : ''), note: cands.length > 1 ? (ok.length === 2 ? 'Las dos sirven (suman menos de 180° con ' + AL(K).replace(/\\hat\{(.)\}/, '$1') + '): hay DOS triángulos' : 'Solo sirve la primera: con la segunda los ángulos pasarían de 180°') : 'Ángulo recto: un único triángulo' });
        const third = ['A', 'B', 'C'].find((k) => k !== K && k !== up(oS)), tS = lo(third);
        ok.forEach((B, i) => {
          const C = 180 - A0 - B, c0 = a0 * sinD(C) / sinD(A0);
          const tag = ok.length > 1 ? '_{' + (i + 1) + '}' : '';
          rows.push({ l: AL(third) + tag, r: '180^{\\circ}-' + av(A0) + '-' + av(B) + '\\approx ' + av(C), note: ok.length > 1 ? 'Triángulo ' + (i + 1) : 'Los ángulos suman 180°' });
          rows.push({ l: tS + tag, r: '\\frac{' + kS + '\\cdot\\operatorname{sen}' + AL(third) + '}{\\operatorname{sen}' + AL(K) + '}=\\frac{' + sv(a0) + '\\cdot\\operatorname{sen}' + av(C) + '}{\\operatorname{sen}' + av(A0) + '}\\approx ' + sv(c0), note: 'Teorema del seno' });
          sols.push({ [kS]: a0, [oS]: b0, [tS]: c0, [K]: A0, [up(oS)]: B, [third]: C });
        });
        if (!ok.length) { rows.push({ l: '\\text{Solución}', r: '\\text{no hay triángulo}', boxed: true }); return [derivBlock(rows)]; }
      }
    } else {
      // un lado y dos ángulos (ALA / AAL)
      const k = Object.keys(sides)[0];
      const missA = ['A', 'B', 'C'].find((x) => angs[x] == null);
      const known = ['A', 'B', 'C'].filter((x) => x !== missA);
      angs[missA] = 180 - angs[known[0]] - angs[known[1]];
      rows.push({ l: '\\text{Caso}', r: '\\text{un lado y dos ángulos}', note: 'Primero el tercer ángulo y después el teorema del seno' });
      rows.push({ l: AL(missA), r: '180^{\\circ}-' + av(angs[known[0]]) + '-' + av(angs[known[1]]) + '=' + av(angs[missA]), note: 'Los ángulos suman 180°' });
      const ratio = sides[k] / sinD(angs[up(k)]);
      rows.push({ l: '\\frac{' + k + '}{\\operatorname{sen}' + AL(up(k)) + '}', r: '\\frac{' + sv(sides[k]) + '}{\\operatorname{sen}' + av(angs[up(k)]) + '}\\approx ' + sv(ratio), note: 'Teorema del seno: esta razón es la misma para los tres lados (= 2R, diámetro de la circunferencia circunscrita)' });
      const s = Object.assign({}, sides);
      for (const o of ['a', 'b', 'c'].filter((x) => x !== k)) {
        s[o] = ratio * sinD(angs[up(o)]);
        rows.push({ l: o, r: '\\frac{' + k + '\\cdot\\operatorname{sen}' + AL(up(o)) + '}{\\operatorname{sen}' + AL(up(k)) + '}\\approx ' + sv(ratio) + '\\cdot\\operatorname{sen}' + av(angs[up(o)]) + '\\approx ' + sv(s[o]) });
      }
      sols.push(Object.assign(s, angs));
    }
    const out = [];
    sols.forEach((t, i) => {
      const tag = sols.length > 1 ? '_{' + (i + 1) + '}' : '';
      const area = 0.5 * t.b * t.c * sinD(t.A), per = t.a + t.b + t.c;
      rows.push({ l: '\\text{Solución}' + tag, r: 'a\\approx ' + sv(t.a) + ',\\ b\\approx ' + sv(t.b) + ',\\ c\\approx ' + sv(t.c) + ',\\ \\hat{A}\\approx ' + av(t.A) + ',\\ \\hat{B}\\approx ' + av(t.B) + ',\\ \\hat{C}\\approx ' + av(t.C), boxed: true, note: triKind(t) });
      rows.push({ l: 'S' + tag, r: '\\frac{1}{2}\\,bc\\,\\operatorname{sen}\\hat{A}=\\frac{1}{2}\\cdot ' + sv(t.b) + '\\cdot ' + sv(t.c) + '\\cdot\\operatorname{sen}' + av(t.A) + '\\approx ' + sv(area), note: 'Área (también con Herón: √(s(s−a)(s−b)(s−c)))' });
      rows.push({ l: 'P' + tag, r: 'a+b+c\\approx ' + sv(per), note: 'Perímetro' });
      out.push({ type: 'geo', kind: 'tri', a: t.a, b: t.b, c: t.c, A: t.A, B: t.B, C: t.C, label: sols.length > 1 ? 'Triángulo ' + (i + 1) : '' });
    });
    return [derivBlock(rows), ...out];
  }
  function triKind(t) {
    const ang = [t.A, t.B, t.C], sd = [t.a, t.b, t.c];
    const eq = (x, y) => Math.abs(x - y) < 1e-6 * Math.max(1, x);
    const bySides = eq(sd[0], sd[1]) && eq(sd[1], sd[2]) ? 'equilátero' : eq(sd[0], sd[1]) || eq(sd[1], sd[2]) || eq(sd[0], sd[2]) ? 'isósceles' : 'escaleno';
    const mx = Math.max(...ang);
    const byAng = Math.abs(mx - 90) < 1e-6 ? 'rectángulo (se cumple Pitágoras)' : mx > 90 ? 'obtusángulo' : 'acutángulo';
    return 'Triángulo ' + bySides + ' y ' + byAng;
  }

  /* --- Rectas en el plano: posición relativa, paralelas, perpendiculares y distancias --- */
  function lineOf(text) {
    const eq = text.replace(/^[a-zA-Z](?:_\(?\d+\)?)?:/, '');
    const parts = eq.split('=');
    if (parts.length !== 2) return null;
    const l = geoLin(geoParse(parts[0])), r = geoLin(geoParse(parts[1]));
    let a = sub(l.x, r.x), b = sub(l.y, r.y), c = sub(l.c, r.c);
    if (isZ(a) && isZ(b)) throw new MErr('«' + text + '» no es una recta: no tiene x ni y.');
    // coeficientes enteros sin factor común y a > 0 (o b > 0 si a = 0)
    let L0 = 1n; for (const q of [a, b, c]) L0 = L0 * q.d / gcd(L0, q.d);
    const ints = [a, b, c].map((q) => q.n * (L0 / q.d));
    let g = 0n; for (const v of ints) g = gcd(g, v < 0n ? -v : v);
    if (g === 0n) g = 1n;
    let [A0, B0, C0] = ints.map((v) => v / g);
    if (A0 < 0n || (A0 === 0n && B0 < 0n)) { A0 = -A0; B0 = -B0; C0 = -C0; }
    return { a: F(A0), b: F(B0), c: F(C0), src: text };
  }
  function pointOf(text) {
    const m = /^(?:([A-Za-z](?:_\(?\d+\)?)?)=?)?\((.+),(.+)\)$/.exec(text);
    if (!m) return null;
    return { name: m[1] ? m[1].replace(/[()]/g, '') : '', x: geoLin(geoParse(m[2])).c, y: geoLin(geoParse(m[3])).c };
  }
  function genL(l) { // a x + b y + c = 0
    let s = '';
    s += termL(l.a, 'x', true);
    s += termL(l.b, 'y', s === '');
    s += termL(l.c, '', s === '');
    return s + '=0';
  }
  const genT = (l) => latexText(genL(l)).replace(/-/g, ' − ').replace(/\+/g, ' + ').replace(/=/g, ' = ').replace(/\s+/g, ' ').trim();
  function explicitL(l) {
    if (isZ(l.b)) return 'x=' + fLatex(div(neg(l.c), l.a));
    const m = div(neg(l.a), l.b), n = div(neg(l.c), l.b);
    let s = termL(m, 'x', true);
    s += termL(n, '', s === '');
    return 'y=' + (s || '0');
  }
  const ptL = (p) => '\\left(' + fLatex(p.x) + ',\\ ' + fLatex(p.y) + '\\right)';
  // |num| / √N en LaTeX exacto
  function overSqrt(num, N) {
    const { k, m } = sqrtSimp(N);
    const nn = abs(num.n), A = F(nn, num.d);
    if (m === 1n) return fLatex(div(A, k));
    const coef = div(A, mul(k, F(m))); // A/(k√m) = A√m/(k m)
    const cn = coef.n, cd = coef.d;
    if (cn === 0n) return '0';
    return (cd === 1n ? (cn === 1n ? '' : cn) + '\\sqrt{' + m + '}' : '\\frac{' + (cn === 1n ? '' : cn) + '\\sqrt{' + m + '}}{' + cd + '}');
  }
  const sqF = (q) => mul(q, q);
  function linesRelative(latex) {
    const items = geoSplit(geoText(latex));
    const lines = [], pts = [];
    items.forEach((it, i) => {
      const s = it.replace(/\s+/g, '');
      const p = pointOf(s);
      if (p) { if (!p.name) p.name = 'P' + (pts.length ? pts.length + 1 : ''); pts.push(p); return; }
      const nm = (/^([a-zA-Z](?:_\(?\d+\)?)?):/.exec(s) || [])[1];
      const l = lineOf(s);
      if (!l) throw new MErr('No reconozco «' + it + '». Escribe rectas (2x+3y-6=0, y=2x+1, x=3) y puntos P=(1,2), separados por comas.');
      l.name = nm ? nm.replace(/[()]/g, '') : ['r', 's', 't'][lines.length] || 'r' + (i + 1);
      lines.push(l);
    });
    if (!lines.length && pts.length < 2) throw new MErr('Escribe dos rectas (2x+3y=6, y=2x+1), una recta y un punto P=(1,2), o dos puntos A=(1,2), B=(4,6).');
    const rows = [];
    const geo = { type: 'geo', kind: 'lines', lines: [], points: [] };
    const addLine = (l, nm, dash) => geo.lines.push({ a: fNum(l.a), b: fNum(l.b), c: fNum(l.c), name: nm, dash: !!dash });
    // dos puntos: recta que los une
    if (!lines.length) {
      const [P, Q] = pts;
      const dx = sub(Q.x, P.x), dy = sub(Q.y, P.y);
      if (isZ(dx) && isZ(dy)) throw new MErr('Los dos puntos son el mismo.');
      rows.push({ l: '\\overrightarrow{' + P.name + Q.name + '}', r: '\\left(' + fLatex(Q.x) + '-' + fParen(P.x) + ',\\ ' + fLatex(Q.y) + '-' + fParen(P.y) + '\\right)=\\left(' + fLatex(dx) + ',\\ ' + fLatex(dy) + '\\right)', note: 'Vector director: Q − P' });
      if (!isZ(dx)) { const mq = div(dy, dx), fr0 = '\\frac{' + fLatex(dy) + '}{' + fLatex(dx) + '}'; rows.push({ l: 'm', r: fr0 + (fLatex(mq) === fr0 ? '' : '=' + fLatex(mq)), note: 'Pendiente: Δy/Δx' }); }
      const l = { a: dy, b: neg(dx), c: sub(mul(dx, P.y), mul(dy, P.x)) };
      const ln = lineOf(latexText(genL(l)).replace(/\s/g, ''));
      rows.push({ l: '\\frac{x-' + fParen(P.x) + '}{' + fLatex(dx) + '}', r: '\\frac{y-' + fParen(P.y) + '}{' + fLatex(dy) + '}', note: isZ(dx) || isZ(dy) ? 'Ecuación continua (con un 0 abajo: la recta es ' + (isZ(dx) ? 'vertical' : 'horizontal') + ')' : 'Ecuación continua' });
      rows.push({ l: '\\text{General}', r: genL(ln), boxed: true, note: 'Ecuación general ax + by + c = 0' });
      rows.push({ l: '\\text{Explícita}', r: explicitL(ln), note: isZ(ln.b) ? 'Recta vertical' : 'y = mx + n' });
      const d2 = add(sqF(dx), sqF(dy));
      rows.push({ l: 'd(' + P.name + ',' + Q.name + ')', r: '\\sqrt{' + fParen(dx) + '^{2}+' + fParen(dy) + '^{2}}=\\sqrt{' + fLatex(d2) + '}' + (sqrtLatex(d2) !== '\\sqrt{' + fLatex(d2) + '}' ? '=' + sqrtLatex(d2) : '') + (sqrtSimp(d2).m === 1n ? '' : '\\approx ' + dec(Math.sqrt(fNum(d2)), 4)), note: 'Distancia entre dos puntos (Pitágoras)' });
      rows.push({ l: 'M', r: '\\left(\\frac{' + fLatex(P.x) + '+' + fParen(Q.x) + '}{2},\\ \\frac{' + fLatex(P.y) + '+' + fParen(Q.y) + '}{2}\\right)=' + ptL({ x: div(add(P.x, Q.x), F(2)), y: div(add(P.y, Q.y), F(2)) }), note: 'Punto medio del segmento' });
      addLine(ln, 'r');
      pts.slice(0, 2).forEach((p) => geo.points.push({ x: fNum(p.x), y: fNum(p.y), name: p.name }));
      geo.points.push({ x: fNum(div(add(P.x, Q.x), F(2))), y: fNum(div(add(P.y, Q.y), F(2))), name: 'M', kind: 'mid' });
      return [derivBlock(rows), geo];
    }
    for (const l of lines) {
      const mL = isZ(l.b) ? '\\text{vertical (sin pendiente)}' : fLatex(div(neg(l.a), l.b));
      rows.push({ l: l.name, r: genL(l), note: 'Explícita: ' + latexText(explicitL(l)).replace(/=/, ' = ') + (isZ(l.b) ? ' (vertical)' : ', pendiente m = ' + latexText(mL)) + '; vector normal (' + fText(l.a) + ', ' + fText(l.b) + ')' });
      addLine(l, l.name);
    }
    if (lines.length >= 2) {
      const [r, s] = lines;
      const det = sub(mul(r.a, s.b), mul(s.a, r.b));
      const rat = (x, y) => (isZ(y) ? (isZ(x) ? '\\frac{0}{0}' : '\\frac{' + fLatex(x) + '}{0}') : '\\frac{' + fLatex(x) + '}{' + fLatex(y) + '}');
      rows.push({ l: '\\frac{a_1}{a_2},\\ \\frac{b_1}{b_2},\\ \\frac{c_1}{c_2}', r: rat(r.a, s.a) + ',\\ ' + rat(r.b, s.b) + ',\\ ' + rat(r.c, s.c), note: 'Comparamos los coeficientes: si a y b no son proporcionales se cortan; si lo son, paralelas o coincidentes según c' });
      if (!isZ(det)) {
        const x = div(sub(mul(neg(r.c), s.b), mul(r.b, neg(s.c))), det), y = div(sub(mul(r.a, neg(s.c)), mul(neg(r.c), s.a)), det);
        const dotN = add(mul(r.a, s.a), mul(r.b, s.b));
        const perp = isZ(dotN);
        rows.push({ l: '\\text{Posición}', r: perp ? '\\text{secantes y perpendiculares}\\ (' + r.name + '\\perp ' + s.name + ')' : '\\text{secantes}', boxed: true, note: perp ? 'Los vectores normales son ortogonales: a₁a₂ + b₁b₂ = 0' : 'a₁b₂ − a₂b₁ = ' + fText(det) + ' ≠ 0: se cortan en un punto' });
        rows.push({ l: '\\begin{cases}' + genL(r) + '\\\\' + genL(s) + '\\end{cases}', r: 'x=' + fLatex(x) + ',\\ y=' + fLatex(y), note: 'Punto de corte resolviendo el sistema (Cramer: det = ' + fText(det) + ')' });
        const n2 = mul(add(sqF(r.a), sqF(r.b)), add(sqF(s.a), sqF(s.b)));
        const cv = Math.abs(fNum(dotN)) / Math.sqrt(fNum(n2));
        const ang = Math.acos(Math.min(1, cv)) * 180 / Math.PI;
        rows.push({ l: '\\cos\\varphi', r: '\\frac{\\left|a_1a_2+b_1b_2\\right|}{\\sqrt{a_1^{2}+b_1^{2}}\\,\\sqrt{a_2^{2}+b_2^{2}}}=\\frac{' + fLatex(F(abs(dotN.n), dotN.d)) + '}{\\sqrt{' + fLatex(add(sqF(r.a), sqF(r.b))) + '}\\,\\sqrt{' + fLatex(add(sqF(s.a), sqF(s.b))) + '}}', note: 'Ángulo entre las rectas (el agudo) con sus vectores normales' });
        rows.push({ l: '\\varphi', r: (perp ? '90^{\\circ}' : '\\arccos\\left(' + dec(cv, 4) + '\\right)\\approx ' + dec(ang, 2) + '^{\\circ}'), boxed: true });
        geo.points.push({ x: fNum(x), y: fNum(y), name: 'P', kind: 'cut' });
      } else {
        const coinc = isZ(sub(mul(r.a, s.c), mul(s.a, r.c))) && isZ(sub(mul(r.b, s.c), mul(s.b, r.c)));
        if (coinc) rows.push({ l: '\\text{Posición}', r: '\\text{coincidentes}\\ (' + r.name + '\\equiv ' + s.name + ')', boxed: true, note: 'Los tres coeficientes son proporcionales: es la misma recta' });
        else {
          rows.push({ l: '\\text{Posición}', r: '\\text{paralelas}\\ (' + r.name + '\\parallel ' + s.name + ')', boxed: true, note: 'a y b proporcionales pero c no: misma pendiente y no se cortan' });
          const k = isZ(s.a) ? div(r.b, s.b) : div(r.a, s.a);
          const c2 = mul(s.c, k);
          const N = add(sqF(r.a), sqF(r.b));
          const dc = sub(r.c, c2);
          rows.push({ l: 'd(' + r.name + ',' + s.name + ')', r: '\\frac{\\left|c_1-c_2\\right|}{\\sqrt{a^{2}+b^{2}}}=\\frac{\\left|' + fLatex(r.c) + '-' + fParen(c2) + '\\right|}{\\sqrt{' + fLatex(N) + '}}=' + overSqrt(dc, N) + (sqrtSimp(N).m === 1n ? '' : '\\approx ' + dec(Math.abs(fNum(dc)) / Math.sqrt(fNum(N)), 4)), boxed: true, note: (k.n === 1n && k.d === 1n ? '' : 'Escribimos ' + s.name + ' con los mismos a y b (· ' + fText(k) + '). ') + 'Distancia entre rectas paralelas' });
        }
      }
    }
    // recta y punto
    if (pts.length) {
      const r = lines[0];
      const N = add(sqF(r.a), sqF(r.b));
      for (const P of pts) {
        geo.points.push({ x: fNum(P.x), y: fNum(P.y), name: P.name });
        const val = add(add(mul(r.a, P.x), mul(r.b, P.y)), r.c);
        rows.push({ l: 'd(' + P.name + ',' + r.name + ')', r: '\\frac{\\left|ax_0+by_0+c\\right|}{\\sqrt{a^{2}+b^{2}}}=\\frac{\\left|' + fLatex(r.a) + '\\cdot ' + fParen(P.x) + (r.b.n < 0n ? '' : '+') + fLatex(r.b) + '\\cdot ' + fParen(P.y) + (r.c.n < 0n ? '' : '+') + fLatex(r.c) + '\\right|}{\\sqrt{' + fLatex(N) + '}}=' + overSqrt(val, N) + (isZ(val) || sqrtSimp(N).m === 1n ? '' : '\\approx ' + dec(Math.abs(fNum(val)) / Math.sqrt(fNum(N)), 4)), boxed: true, note: isZ(val) ? P.name + ' está sobre la recta ' + r.name : 'Distancia de un punto a una recta' });
        const par = { a: r.a, b: r.b, c: neg(add(mul(r.a, P.x), mul(r.b, P.y))) };
        const per = { a: r.b, b: neg(r.a), c: neg(sub(mul(r.b, P.x), mul(r.a, P.y))) };
        const pl = lineOf(latexText(genL(par)).replace(/\s/g, '')), ql = lineOf(latexText(genL(per)).replace(/\s/g, ''));
        rows.push({ l: r.name + '\'\\parallel ' + r.name, r: genL(pl), note: 'Paralela por ' + P.name + ': mismos a y b; c sale de sustituir ' + P.name });
        rows.push({ l: r.name + '\'\'\\perp ' + r.name, r: genL(ql), note: 'Perpendicular por ' + P.name + ': intercambiamos a y b y cambiamos un signo (bx − ay + c = 0)' });
        // pie de la perpendicular
        const t0 = div(neg(val), N);
        const H = { x: add(P.x, mul(r.a, t0)), y: add(P.y, mul(r.b, t0)) };
        if (!isZ(val)) { rows.push({ l: 'H', r: ptL(H), note: 'Pie de la perpendicular (proyección de ' + P.name + ' sobre ' + r.name + ')' }); geo.points.push({ x: fNum(H.x), y: fNum(H.y), name: 'H', kind: 'mid' }); }
        addLine(pl, r.name + '′', true);
        addLine(ql, r.name + '″', true);
        if (pts.length > 1) break;
      }
    }
    return [derivBlock(rows), geo];
  }

  /* --- Rectas paralelas cortadas por una secante --- */
  function transversal(latex) {
    const t = geoText(latex).replace(/^[^=]*=/, '');
    const a = parseAngle(t);
    let al = a.deg;
    if (!(al > 0 && al < 180)) throw new MErr('Escribe un ángulo entre 0° y 180°, por ejemplo 65°.');
    const be = 180 - al;
    const A = degL(al), B = degL(be);
    const rows = [
      { l: '\\hat{1}', r: A, note: 'Ángulo dado (arriba a la derecha, en la intersección con la primera paralela)' },
      { l: '\\hat{3}', r: '\\hat{1}=' + A, note: 'Opuestos por el vértice: son iguales' },
      { l: '\\hat{2}=\\hat{4}', r: '180^{\\circ}-' + A + '=' + B, note: 'Adyacentes (suplementarios): suman 180°' },
      { l: '\\hat{5}', r: '\\hat{1}=' + A, note: 'Correspondientes: misma posición en cada paralela, son iguales' },
      { l: '\\hat{7}', r: '\\hat{3}=' + A, note: 'Alternos externos con 1̂ (y correspondientes con 3̂): iguales' },
      { l: '\\hat{6}=\\hat{8}', r: B, note: 'Correspondientes de 2̂ y 4̂' },
      { l: '\\hat{4}', r: '\\hat{6}=' + B, note: 'Alternos internos: iguales. 3̂ y 5̂ también son alternos internos' },
      { l: '\\hat{3}+\\hat{6}', r: '180^{\\circ}', note: 'Conjugados internos (mismo lado de la secante, entre las paralelas): suplementarios', boxed: true },
    ];
    const v = (k) => ([1, 3, 5, 7].includes(k) ? degT(al) : degT(be));
    const rel = { 1: 'dado', 2: 'adyacente a 1̂ (suplementario)', 3: 'opuesto por el vértice a 1̂', 4: 'adyacente a 1̂ (suplementario)', 5: 'correspondiente de 1̂', 6: 'alterno interno de 4̂ · correspondiente de 2̂', 7: 'alterno externo de 1̂', 8: 'correspondiente de 4̂' };
    return [derivBlock(rows), { type: 'table', head: ['Ángulo', 'Medida', 'Relación'], rows: [1, 2, 3, 4, 5, 6, 7, 8].map((k) => [k + '̂', v(k), rel[k]]), caption: 'Dos paralelas cortadas por una secante: solo hay dos medidas, α = ' + degT(al) + ' y 180° − α = ' + degT(be) + '.' }, { type: 'geo', kind: 'transv', deg: al }];
  }

  return { angleConvert, trigRatios, notableTable, solveTriangle, linesRelative, transversal, geoText, parseAngle };
});
