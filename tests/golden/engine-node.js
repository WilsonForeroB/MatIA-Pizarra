#!/usr/bin/env node
/* Compara el motor modular con la referencia sin abrir el navegador (el motor no usa el DOM).
   Uso: node tests/golden/engine-node.js js/engine/a.js js/engine/b.js …   (en el orden de pizarra.html)
   Carga js/core/namespace.js + los ficheros dados y ejecuta tests/golden/cases.js contra expected.json. */
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '../..');
const ctx = { console, BigInt, Math, JSON, Number, String, Array, Object, Set, Map, Error, TypeError, RangeError, isFinite, parseFloat, parseInt, Symbol, RegExp, Infinity, NaN };
ctx.window = ctx; ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['js/core/namespace.js', ...process.argv.slice(2)]) vm.runInContext(fs.readFileSync(path.resolve(ROOT, f), 'utf8'), ctx, { filename: f });
const cases = require('./cases.js');
const exp = JSON.parse(fs.readFileSync(path.join(__dirname, 'expected.json'), 'utf8')).engine;
const me = ctx.MatIA.require('engine/core');
const ops = ctx.MatIA.require('engine/ops');
const lib = { ME: me, OPS: Object.assign({}, ops, { $compileFnSample(src) { const c = ops.compileFn(src); return { name: c.name, v: c.v, latex: c.latex, ys: [-2, -1, 0, 0.5, 3].map((x) => c.f(x)) }; } }) };
const ser = (v) => JSON.parse(JSON.stringify(v, (k, x) => (typeof x === 'bigint' ? x.toString() + 'n' : typeof x === 'function' ? '[fn]' : x)));
let bad = 0;
for (const [name, fn, ...args] of cases) {
  const [ns, f] = fn.split('.');
  const a = args.map((x) => (x && x.$defs ? me.definitions(x.$defs) : x));
  let got;
  try { got = { ok: ser(lib[ns][f](...a)) }; } catch (e) { got = { err: (e && e.constructor && e.constructor.name) + ': ' + (e && e.message) }; }
  if (JSON.stringify(got) !== JSON.stringify(exp[name])) { bad++; console.log('DIFERENTE ' + name + '\n  esperado ' + JSON.stringify(exp[name]).slice(0, 300) + '\n  obtenido ' + JSON.stringify(got).slice(0, 300)); }
}
console.log(bad ? bad + ' casos distintos de ' + cases.length : 'OK: ' + cases.length + ' casos idénticos a la referencia.');
process.exit(bad ? 1 : 0);
