#!/usr/bin/env node
/* Prueba de interacción: ejecuta el mismo recorrido de usuario en dos páginas y compara el estado final.
   Uso: node src/tests/e2e.js [referencia=legacy/pizarra.html] [candidata=pizarra.html] */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..', '..');

async function scenario(file) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/mathlive@[^/]+\//, (r) => {
    const f = path.join(ROOT, 'src/vendor/mathlive', new URL(r.request().url()).pathname.replace(/^\/npm\/mathlive@[^/]+\//, ''));
    return fs.existsSync(f) ? r.fulfill({ path: f }) : r.fulfill({ status: 404, body: '' });
  });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ body: '', contentType: 'text/css' }));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_TUNNEL|Fetch API cannot load|Invalid URL/.test(m.text())) errors.push(m.text()); });
  page.on('dialog', (d) => { errors.push('ventana nativa: ' + d.type()); d.dismiss(); });
  await page.goto('file://' + path.resolve(ROOT, file));
  await page.waitForFunction(() => !!customElements.get('math-field'));
  await page.waitForTimeout(600);
  const steps = [];
  const state = async (label) => {
    await page.waitForTimeout(500); // el autoguardado espera 350 ms
    const s = await page.evaluate(() => {
      const raw = localStorage.getItem('matia-pizarra-v1');
      const b = raw ? JSON.parse(raw) : null;
      return {
        pg: document.querySelector('#pgOut').textContent,
        mode: document.body.dataset.mode,
        blocks: Array.from(document.querySelectorAll('#blocks > .blk')).map((e) => e.className.replace(/\bis-active\b/, '').trim() + ':' + (Array.from(e.querySelectorAll('math-field')).map((m) => m.value).join('|') || (() => { const c = e.cloneNode(true); c.querySelectorAll('button').forEach((x) => x.remove()); return c.textContent.trim().slice(0, 60); })())),
        saved: b && b.pages.map((p) => p.blocks.map((x) => x.type + ':' + (x.v || (x.rows ? x.rows.length : '') || '')).join(',') + '/strokes=' + p.strokes.length),
        theme: document.documentElement.getAttribute('data-theme'),
        openDialogs: Array.from(document.querySelectorAll('dialog[open]')).map((d) => d.id),
        toast: document.querySelector('#toast').textContent.trim().slice(0, 120),
      };
    });
    steps.push([label, s]);
  };
  const typeInActive = async (txt) => { await page.keyboard.type(txt, { delay: 40 }); await page.waitForTimeout(150); };
  await page.click('#blocks .blk math-field');
  await page.waitForTimeout(300); await typeInActive('2+3=');
  await page.click('#calcBtn').catch(async () => { await page.keyboard.press('Control+Enter'); });
  await page.waitForTimeout(500); await state('calcular');
  await page.click('#newLineBtn'); await page.waitForTimeout(400); await typeInActive('2x+1=5'); await page.waitForTimeout(400); await state('nueva línea');
  await page.click('#pgAdd'); await page.waitForTimeout(300); await state('añadir página');
  await page.click('#pgPrev'); await page.waitForTimeout(300); await state('página anterior');
  await page.click('[data-mode="draw"]');
  const box = await page.locator('#ink').boundingBox();
  await page.mouse.move(box.x + 200, box.y + 300); await page.mouse.down(); await page.mouse.move(box.x + 300, box.y + 350, { steps: 8 }); await page.mouse.up();
  await page.waitForTimeout(500); await state('dibujar');
  await page.click('[data-mode="write"]'); await page.waitForTimeout(200);
  await page.click('#histBtn'); await page.waitForTimeout(300); await state('abrir historial');
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  await page.click('#helpBtn'); await page.waitForTimeout(300); await state('abrir ayuda');
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  await page.click('#viewBtn'); await page.waitForTimeout(200);
  const dark = page.locator('[data-theme-set="dark"]'); if (await dark.count()) await dark.first().click();
  await page.waitForTimeout(400); await state('tema oscuro');
  await page.keyboard.press('Escape');
  await page.click('#fileBtn'); await page.waitForTimeout(200);
  const nb = page.locator('#newBoard'); if (await nb.count()) { await nb.click(); await page.waitForTimeout(300); }
  await state('nueva clase (pregunta)');
  const acts = page.locator('#askActs button'); if (await acts.count()) { await acts.nth(1).click(); await page.waitForTimeout(500); }
  await state('nueva clase (sin guardar)');
  await browser.close();
  return { steps, errors };
}

(async () => {
  const [ref, cand] = [process.argv[2] || 'src/legacy/pizarra.html', process.argv[3] || 'pizarra.html'];
  const a = await scenario(ref), b = await scenario(cand);
  let bad = 0;
  a.steps.forEach(([label, s], i) => {
    const t = b.steps[i] && b.steps[i][1];
    for (const k of Object.keys(s)) if (JSON.stringify(s[k]) !== JSON.stringify(t && t[k])) { bad++; console.log('DIFERENTE «' + label + '» ' + k + '\n  ref  ' + JSON.stringify(s[k]) + '\n  cand ' + JSON.stringify(t && t[k])); }
  });
  if (b.errors.length) { bad++; console.log('Errores en ' + cand + ':\n  ' + b.errors.join('\n  ')); }
  if (a.errors.length) console.log('(Errores en la referencia: ' + a.errors.join(' | ') + ')');
  if (process.env.VERBOSE) a.steps.forEach(([l, s]) => console.log(l, JSON.stringify(s).slice(0, 260)));
  console.log(bad ? 'FALLA: ' + bad + ' diferencias.' : 'OK: ' + a.steps.length + ' pasos idénticos y sin errores.');
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
