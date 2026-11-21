#!/usr/bin/env node
/* Pruebas de funciones nuevas del motor (normalizeFn, integrales) sin navegador. Uso: node tests/engine-features.js */
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const FILES = ['js/core/namespace.js', 'js/engine/core/fraction-matrix.js', 'js/engine/core/tokenizer.js', 'js/engine/core/parser.js', 'js/engine/core/latex-definitions.js', 'js/engine/core/gauss-systems.js', 'js/engine/core.js',
  'js/engine/ops/common.js', 'js/engine/ops/poly.js', 'js/engine/ops/expr.js', 'js/engine/ops/ecuaciones.js', 'js/engine/ops/matrices.js', 'js/engine/ops/vectores.js', 'js/engine/ops/aritmetica.js', 'js/engine/ops/polinomios.js',
  'js/engine/ops/combinatoria-logica.js', 'js/engine/ops/conjuntos-venn.js', 'js/engine/ops/analisis.js', 'js/engine/ops/estadistica-probabilidad.js', 'js/engine/ops/geometria.js', 'js/engine/ops/integrales.js', 'js/engine/ops.js'];
const ctx = { console, BigInt, Math, JSON, Number, String, Array, Object, Set, Map, Error, TypeError, RangeError, isFinite, parseFloat, parseInt, Symbol, RegExp, Infinity, NaN };
ctx.window = ctx; ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
const OPS = ctx.MatIA.require('engine/ops');
let bad = 0, n = 0;
const check = (name, ok, extra) => { n++; if (!ok) { bad++; console.log('FALLA ' + name + (extra !== undefined ? '  → ' + extra : '')); } };
const close = (a, b) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b));

// compileFn: texto plano y variantes
const fns = [
  ['f(x)=sin(x)', Math.sin], ['sen x', Math.sin], ['f(x)=\\operatorname{sen}x', Math.sin], ['ln(x)', Math.log], ['cos(x)', Math.cos],
  ['f(x)=x^(1/2)', Math.sqrt], ['x^-2', (x) => x ** -2], ['sqrt(x)', Math.sqrt],
  ['\\sin x', Math.sin], ['\\frac{1}{x}', (x) => 1 / x], ['tg(x)', Math.tan], ['exp(x)', Math.exp], ['2pi x', (x) => 2 * Math.PI * x], ['e^(-x)', (x) => Math.exp(-x)], ['\\sqrt{x}', Math.sqrt],
];
for (const [src, g] of fns) {
  try {
    const c = OPS.compileFn(src);
    for (const x of [1, 2]) check('compileFn ' + src + ' en x=' + x, close(c.f(x), g(x)), c.f(x));
  } catch (e) { check('compileFn ' + src, false, e.message); }
}
check('normalizeFn no altera LaTeX', ['\\sin x', '\\frac{1}{2}', '\\left(x+1\\right)', 'ax+b'].every((s) => OPS.normalizeFn(s) === s));

// integrales
const line = (s) => { try { return OPS.integralLine(s).latex; } catch (e) { return 'ERROR ' + e.message; } };
const has = (name, s, sub) => { const r = line(s); check(name, r.includes(sub), r); };
has('∫x² indefinida', '\\int x^2dx', '\\frac{x^{3}}{3}+C');
has('∫₀¹x²', '\\int_0^1 x^2\\,dx=', '=\\frac{1}{3}');
has('∫sin(2x)', '\\int\\sin(2x)\\,dx', '\\cos');
has('∫e^{3x}', '\\int e^{3x}dx', '\\frac{\\mathrm{e}^{3x}}{3}+C');
has('∫1/x', '\\int\\frac{1}{x}dx', '\\ln');
has('∫₀^π sin x', '\\int_{0}^{\\pi}\\sin x\\,dx', '=2');
has('∫₀¹ e^{-x²}', '\\int_0^1 e^{-x^2}dx', '\\approx 0{,}7468');
has('∫ texto plano', '\\int_0^1 sqrt(x) dx=', '=\\frac{2}{3}');
has('∫ \\mathrm{d}', '\\int_{0}^{2} 3x^2\\mathrm{d}x', '=8');
has('∫ conserva prefijo', 'I=\\int x\\,dx=', 'I=\\int');
has('∫ 1/(1+x²)', '\\int\\frac{1}{1+x^2}dx', '\\arctan');
check('∫ impropia da error', /ERROR/.test(line('\\int_{-1}^{1}\\frac{1}{x}dx')), line('\\int_{-1}^{1}\\frac{1}{x}dx'));
check('∫ sin x cos x sin primitiva y sin límites da error', /ERROR/.test(line('\\int \\tan(x^2)dx')));
const st = OPS.integralSteps('\\int_0^1 x^2\\,dx');
check('integralSteps devuelve bloque deriv', Array.isArray(st) && st[0].type === 'deriv' && st[0].rows.length >= 2 && st[0].rows.some((r) => r.boxed), JSON.stringify(st));
const st2 = OPS.integralSteps('\\int x^2dx');
check('integralSteps indefinida', st2[0].type === 'deriv' && /\+C/.test(st2[0].rows[0].r), JSON.stringify(st2));
console.log(bad ? bad + ' fallos de ' + n : 'OK: ' + n + ' comprobaciones.');
process.exit(bad ? 1 : 0);
