#!/usr/bin/env node
/* Cálculo vectorial: derivadas parciales, gradiente, hessiana, jacobiana, divergencia/rotacional/laplaciano.
   Parte 1: motor (sin navegador) con resultados verificados a mano. Parte 2: menú Operaciones en el navegador.
   Uso: node tests/vectorial.js [--capturas] */
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const FILES = ['js/core/namespace.js', 'js/engine/core/fraction-matrix.js', 'js/engine/core/tokenizer.js', 'js/engine/core/parser.js', 'js/engine/core/latex-definitions.js', 'js/engine/core/gauss-systems.js', 'js/engine/core.js',
  'js/engine/ops/common.js', 'js/engine/ops/poly.js', 'js/engine/ops/expr.js', 'js/engine/ops/ecuaciones.js', 'js/engine/ops/matrices.js', 'js/engine/ops/vectores.js', 'js/engine/ops/aritmetica.js', 'js/engine/ops/polinomios.js',
  'js/engine/ops/combinatoria-logica.js', 'js/engine/ops/conjuntos-venn.js', 'js/engine/ops/analisis.js', 'js/engine/ops/estadistica-probabilidad.js', 'js/engine/ops/geometria.js', 'js/engine/ops/integrales.js',
  'js/engine/ops/vec-input.js', 'js/engine/ops/vectorial.js', 'js/engine/ops/campos.js', 'js/engine/ops.js'];
const ctx = { console, BigInt, Math, JSON, Number, String, Array, Object, Set, Map, Error, TypeError, RangeError, isFinite, parseFloat, parseInt, Symbol, RegExp, Infinity, NaN };
ctx.window = ctx; ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
const OPS = ctx.MatIA.require('engine/ops');
const V = ctx.MatIA.require('engine/ops/vec-input');

const results = [];
const ok = (name, cond, extra) => { results.push(!!cond); if (!cond || process.env.VERBOSE) console.log((cond ? 'OK    ' : 'FALLA ') + name + (extra ? ' → ' + extra : '')); };
const flat = (specs) => specs.map((b) => (b.rows || []).map((r) => r.l + ' = ' + r.r + ' {' + r.note + '}' + (r.boxed ? ' [■]' : '')).join('\n')).join('\n');
const sq = (s) => s.replace(/\\left|\\right|\s+/g, '');
function run(op, src) { try { return flat(OPS[op](src)); } catch (e) { return 'ERROR ' + e.message; } }
function has(name, op, src, subs) {
  const out = run(op, src), o = sq(out);
  const miss = subs.filter((s) => !o.includes(sq(s)));
  ok(name, !miss.length && !out.startsWith('ERROR'), miss.length ? 'falta ' + miss.join(' | ') + '\n' + out : out.slice(0, 120));
}
function err(name, op, src, re) { const out = run(op, src); ok(name, out.startsWith('ERROR') && re.test(out), out.slice(0, 160)); }

// ---- Lectura de la línea ----
{
  const r = V.parseVecInput('f\\left(x,y\\right)=x^2y,\\ P=\\left(1,2\\right),\\ \\vec u=(3,4)');
  ok('entrada: f(x,y), P y \\vec u con espacios de MathLive', r.kind === 'scalar' && r.vars.join() === 'x,y' && r.point.val.join() === '1,2' && r.dir.val.join() === '3,4' && r.dir.name === 'u');
  ok('entrada: z = f(x, y) es escalar', V.parseVecInput('z=x^2-y^2').kind === 'scalar');
  ok('entrada: campo F = (…)', V.parseVecInput('F=(xy, yz, zx)').exprs.length === 3);
  ok('entrada: cambio de variables', V.parseVecInput('x=r\\cos\\theta, y=r\\sin\\theta').kind === 'change');
}

// ---- Derivadas parciales ----
has('parciales x²y+y³', 'partials', 'f(x,y)=x^2y+y^3', ['=2xy', '=x^{2}+3y^{2}', '=2y', '=6y', '=2x']);
has('parciales en P=(1,2)', 'partials', 'f(x,y)=x^2y+y^3, P=(1,2)', ['=10', '=4', '=13']);
has('parciales 3 variables', 'partials', 'f(x,y,z)=x^2yz', ['\\partial z']);
err('parciales con 1 variable', 'partials', 'f(x)=x^2', /Derivar paso a paso/);

// ---- Gradiente y derivada direccional ----
has('gradiente, módulo, D_u y plano tangente', 'gradient', 'f(x,y)=x^2+3xy-y^2, P=(1,2), u=(3,4)', ['\\left(8,\\ -1\\right)', '\\sqrt{65}', '\\frac{3}{5}', '=4', 'z=8x-y-3']);
has('plano tangente a superficie de nivel', 'gradient', 'f(x,y,z)=x^2+y^2+z^2, P=(1,2,2)', ['x+2y+2z-9=0']);
err('dirección de tamaño distinto', 'gradient', 'f(x,y)=xy, P=(1,1), u=(1,2,3)', /.+/);

// ---- Hessiana ----
has('hessiana x³+y³−3xy en (1,1): mínimo', 'hessian', 'f(x,y)=x^3+y^3-3xy, P=(1,1)', ['=27', 'mínimo']);
has('hessiana en (0,0): silla', 'hessian', 'f(x,y)=x^3+y^3-3xy, P=(0,0)', ['=-9', 'silla']);
has('hessiana 3 variables definida positiva', 'hessian', 'f(x,y,z)=x^2+y^2+z^2-xy, P=(0,0,0)', ['definida positiva']);
has('hessiana caso dudoso', 'hessian', 'f(x,y)=x^4+y^4, P=(0,0)', ['dudoso']);

// ---- Jacobiana ----
has('jacobiana polares: |J| = r', 'jacobian', 'x=r\\cos\\theta, y=r\\sin\\theta', ['\\frac{\\partial(x,y)}{\\partial(r,\\theta)}', '=r', 'r dr dθ']);
has('jacobiana cilíndricas: r', 'jacobian', 'x=r\\cos\\theta, y=r\\sin\\theta, z=z', ['=r']);
has('jacobiana esféricas: ρ² sen φ', 'jacobian', 'x=\\rho\\sin\\varphi\\cos\\theta, y=\\rho\\sin\\varphi\\sin\\theta, z=\\rho\\cos\\varphi', ['\\rho^{2}\\sin']);
has('jacobiana de un campo', 'jacobian', 'F(x,y)=\\left(x^2y,\\ x+\\sin y\\right)', ['2xy', 'x^{2}', '\\cos y']);
err('jacobiana de una escalar', 'jacobian', 'f(x,y)=xy', /Gradiente/);

// ---- Divergencia, rotacional y laplaciano ----
has('div y rot de (xy, yz, zx)', 'divRot', 'F=(xy, yz, zx)', ['\\left(-y,\\ -z,\\ -x\\right)']);
has('campo conservativo 2D con potencial', 'divRot', 'F=(2xy, x^2)', ['conservativo', 'x^{2}y+C']);
has('campo conservativo 3D', 'divRot', 'F=(yz, xz, xy)', ['xyz+C']);
has('laplaciano armónica', 'divRot', 'f(x,y)=x^2-y^2', ['armónica']);
has('laplaciano = 6', 'divRot', 'f(x,y,z)=x^2+y^2+z^2', ['=6']);

// ---- Parte 2: en el navegador ----
(async () => {
  const { chromium } = require('playwright');
  const URL_ = 'file://' + path.resolve(ROOT, 'pizarra.html');
  const CAPS = process.argv.includes('--capturas');
  const br = await chromium.launch();
  const c = await br.newContext({ viewport: { width: 1200, height: 1000 } });
  const pg = await c.newPage();
  const errs = [];
  pg.on('pageerror', (e) => errs.push(e.message));
  pg.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await pg.goto(URL_);
  await pg.waitForFunction(() => !!customElements.get('math-field'));
  await pg.waitForTimeout(500);

  // el menú tiene el apartado nuevo
  const menu = await pg.evaluate(() => {
    const hs = [...document.querySelectorAll('#opsPop h4')].map((h) => h.textContent);
    const keys = [...document.querySelectorAll('#opsPop [data-op]')].map((b) => b.dataset.op);
    return { hs, keys };
  });
  ok('menú: apartado «Cálculo vectorial»', menu.hs.includes('Cálculo vectorial'));
  ok('menú: las 6 operaciones', ['partial', 'grad', 'hess', 'jacob', 'divrot', 'extr2'].every((k) => menu.keys.includes(k)));

  // escribir de verdad con el teclado y aplicar cada operación
  const cases = [
    ['partial', 'f(x,y)=x^2y+y^3, P=(1,2)'],
    ['grad', 'f(x,y)=x^2+3xy-y^2, P=(1,2), u=(3,4)'],
    ['hess', 'f(x,y)=x^3+y^3-3xy, P=(1,1)'],
    ['jacob', 'x=r\\cos\\theta, y=r\\sin\\theta'],
    ['divrot', 'F=(xy, yz, zx)'],
  ];
  for (const [key, latex] of cases) {
    await pg.evaluate(() => { const S = MatIA.require('model/board'); });
    await pg.evaluate((v) => {
      const mfs = document.querySelectorAll('#blocks .blk math-field:not([data-aux])');
      const mf = mfs[mfs.length - 1];
      mf.focus(); mf.setValue(v); mf.dispatchEvent(new Event('input', { bubbles: true }));
    }, latex);
    const before = await pg.evaluate(() => document.querySelectorAll('#blocks .blk').length);
    await pg.evaluate((k) => MatIA.require('ui/ops-menu').runOp(k), key);
    await pg.waitForTimeout(700);
    const st = await pg.evaluate(() => ({ n: document.querySelectorAll('#blocks .blk').length, toast: (document.querySelector('.toast') || {}).textContent || '' }));
    ok('navegador: ' + key + ' crea el desarrollo', st.n > before, st.toast);
    // nueva línea para la siguiente operación
    await pg.evaluate(() => { const E = MatIA.require('blocks/editor'); const S = MatIA.require('model/board'); const pb = S.page().blocks; const nb = MatIA.require('model/schema').newBlock('math', ''); E.addBlockAfter(pb[pb.length - 1].id, nb, true); });
    await pg.waitForTimeout(200);
  }
  // tecleo real en MathLive: lo que el estudiante escribe
  {
    await pg.evaluate(() => { const mfs = document.querySelectorAll('#blocks .blk math-field:not([data-aux])'); mfs[mfs.length - 1].focus(); });
    await pg.keyboard.type('f(x,y)=x^2', { delay: 20 });
    await pg.keyboard.press('ArrowRight');
    await pg.keyboard.type('y, P=(1,2)', { delay: 20 });
    await pg.waitForTimeout(200);
    const typed = await pg.evaluate(() => { const mfs = document.querySelectorAll('#blocks .blk math-field:not([data-aux])'); return mfs[mfs.length - 1].value; });
    const before = await pg.evaluate(() => document.querySelectorAll('#blocks .blk').length);
    await pg.evaluate(() => MatIA.require('ui/ops-menu').runOp('grad'));
    await pg.waitForTimeout(700);
    const n = await pg.evaluate(() => document.querySelectorAll('#blocks .blk').length);
    ok('navegador: tecleado a mano (' + typed + ') funciona', n > before);
  }
  const overflow = await pg.evaluate(() => [...document.querySelectorAll('#blocks .blk.is-overflow, #blocks .fit-warn')].length);
  ok('navegador: ningún paso se sale de la hoja', overflow === 0, overflow + ' avisos');
  ok('navegador: sin errores', !errs.length, errs.join(' | '));
  if (CAPS) {
    const out = path.join(ROOT, 'tests', 'capturas');
    fs.mkdirSync(out, { recursive: true });
    await pg.screenshot({ path: path.join(out, 'vectorial.png'), fullPage: true });
    console.log('Captura en tests/capturas/vectorial.png');
  }
  await br.close();
  const bad = results.filter((x) => !x).length;
  console.log(bad ? bad + ' FALLAS de ' + results.length : 'OK: ' + results.length + ' comprobaciones.');
  process.exit(bad ? 1 : 0);
})();
