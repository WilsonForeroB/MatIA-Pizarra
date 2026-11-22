#!/usr/bin/env node
/* Pruebas de funciones nuevas del motor (normalizeFn, integrales) sin navegador. Uso: node src/tests/engine-features.js */
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..', '..');
const FILES = ['src/js/core/namespace.js', 'src/js/engine/core/fraction-matrix.js', 'src/js/engine/core/tokenizer.js', 'src/js/engine/core/parser.js', 'src/js/engine/core/latex-definitions.js', 'src/js/engine/core/gauss-systems.js', 'src/js/engine/core.js',
  'src/js/engine/ops/common.js', 'src/js/engine/ops/poly.js', 'src/js/engine/ops/expr.js', 'src/js/engine/ops/ecuaciones.js', 'src/js/engine/ops/matrices.js', 'src/js/engine/ops/vectores.js', 'src/js/engine/ops/aritmetica.js', 'src/js/engine/ops/polinomios.js',
  'src/js/engine/ops/combinatoria-logica.js', 'src/js/engine/ops/conjuntos-venn.js', 'src/js/engine/ops/analisis.js', 'src/js/engine/ops/estadistica-probabilidad.js', 'src/js/engine/ops/geometria.js', 'src/js/engine/ops/integrales.js', 'src/js/engine/ops/vec-input.js', 'src/js/engine/ops/vectorial.js', 'src/js/engine/ops/campos.js', 'src/js/engine/ops.js'];
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

// regresiones de revisión
for (const s of ['\\int_{-1}^{2}\\frac{1}{x}dx', '\\int_0^{2}\\tan x dx', '\\int_0^3\\frac{1}{x-1}dx', '\\int_0^3\\frac{1}{(x-1)^2}dx'])
  check('impropia ' + s, /ERROR.*impropia/.test(line(s)), line(s));
check('∫₀²⁵ e^x no es impropia', /^[^E]/.test(line('\\int_0^{25}e^xdx')), line('\\int_0^{25}e^xdx'));
check('∫₀² x^50', /^[^E]/.test(line('\\int_0^{2}x^{50}dx')), line('\\int_0^{2}x^{50}dx'));
check('∫₀¹ 10^10 x', /^[^E]/.test(line('\\int_0^1 10^{10}x\\,dx')), line('\\int_0^1 10^{10}x\\,dx'));
for (const s of ['\\int\\sqrt{x-4}dx', '\\int\\ln(x-5)dx', '\\int(x-10)^{1/2}dx']) check('primitiva fuera de puntos fijos ' + s, !/ERROR/.test(line(s)), line(s));
has('∫₄⁵ √(x-4)', '\\int_4^5\\sqrt{x-4}dx', '=\\frac{2}{3}');
for (const s of ['\\int\\frac{3}{x}dx', '\\int\\frac{1}{x^2}dx', '\\int\\frac{5}{2x+1}dx', '\\int\\frac{a}{x}dx', '\\int\\frac{2}{1+x^2}dx']) check('cociente con numerador constante ' + s, /\+C/.test(line(s)), line(s));
has('∫₁² 3/x²', '\\int_1^2\\frac{3}{x^2}dx', '=\\frac{3}{2}');
check('normalizeFn operatorname abs', OPS.normalizeFn('\\operatorname{abs}(x)') === '\\left|x\\right|', OPS.normalizeFn('\\operatorname{abs}(x)'));
check('normalizeFn e^-x^2', OPS.normalizeFn('e^-x^2') === 'e^{-x^{2}}', OPS.normalizeFn('e^-x^2'));
// \sin 2x, \sin xy… : el monomio pegado es el argumento (como en los libros)
{
  const pl = (s) => { try { return OPS.L(OPS.parseExpr(s, { var: 'x' })); } catch (e) { return 'ERROR ' + e.message; } };
  const same = [['\\sin 2x', '\\sin\\left(2x\\right)'], ['\\sin xy', '\\sin\\left(xy\\right)'], ['\\cos 2\\theta', '\\cos\\left(2\\theta\\right)'], ['\\sin 2x^2', '\\sin\\left(2x^{2}\\right)'],
    ['\\sin\\pi x', '\\sin\\left(\\pi x\\right)'], ['\\ln 2x', '\\ln\\left(2x\\right)'], ['\\sin x\\cos y', '\\sin x\\cdot \\cos y'], ['\\sin^2x', '\\sin^{2} x'], ['2\\sin x+1', '2\\sin x+1'], ['\\sin 2', '\\sin 2']];
  for (const [s0, want] of same) check('argumento de ' + s0, pl(s0) === want, pl(s0));
  const c = OPS.compileFn('f(x)=\\sin 2x');
  check('gráfica de \\sin 2x = sen(2x)', close(c.f(0.3), Math.sin(0.6)), c.f(0.3));
  const d = OPS.derivative('f(x)=\\sin 2x');
  check('derivada de \\sin 2x usa la cadena', JSON.stringify(d).includes('2\\\\cos'), JSON.stringify(d).slice(0, 300));
}
console.log(bad ? bad + ' fallos de ' + n : 'OK: ' + n + ' comprobaciones.');
process.exit(bad ? 1 : 0);
