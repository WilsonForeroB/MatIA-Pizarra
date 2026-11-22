/* Diálogo del árbol de Bayes (pizarra.html 6538-6585). */
MatIA.define('ui/bayes-dialog', ['core/dom', 'ui/toast', 'assets/pio'], (dom, toast, pio) => {
  'use strict';
  const R = (n) => MatIA.require(n);
  const { $, $$ } = dom;
  const activeBlock = (...a) => R('blocks/editor').activeBlock(...a);
  const insertSpecs = (...a) => R('ui/ops-menu').insertSpecs(...a);

  const bayesDlg = $('#bayesDlg');
  $('#bayesPio').appendChild(pio.badge('idea', '', 'Pío con una idea'));
  let bayesResolve = null;
  function bayesRow(i, name, p, l) {
    const g = $('#bayesRows');
    const lab = document.createElement('span'); lab.textContent = 'Causa ' + (i + 1);
    const mk = (v, ph, aria) => { const x = document.createElement('input'); x.type = 'text'; x.value = v; x.placeholder = ph; x.setAttribute('aria-label', aria); x.autocomplete = 'off'; x.addEventListener('input', bayesPrev); return x; };
    g.append(lab, mk(name, 'Nombre', 'Nombre de la causa ' + (i + 1)), mk(p, 'P(causa)', 'Probabilidad de la causa ' + (i + 1)), mk(l, 'P(B | causa)', 'Probabilidad del suceso dada la causa ' + (i + 1)));
  }
  function bayesHeader() {
    const g = $('#bayesRows'); g.textContent = '';
    ['', 'Nombre', 'P(causa)', 'P(' + ($('#bayesEv').value || 'B') + ' | causa)'].forEach((t) => { const h = document.createElement('span'); h.textContent = t; h.style.fontWeight = '600'; g.appendChild(h); });
  }
  function bayesData() {
    const ins = $$('#bayesRows input');
    const causes = [];
    for (let i = 0; i < ins.length; i += 3) causes.push({ name: ins[i].value.trim() || 'A' + (i / 3 + 1), p: ins[i + 1].value, l: ins[i + 2].value });
    return { causes, ev: $('#bayesEv').value.trim() || 'B' };
  }
  function bayesPrev() {
    const pr = $('#bayesPrev');
    try { const d = bayesData(); R('engine/ops').bayes(d.causes, d.ev); pr.classList.remove('err'); pr.textContent = d.causes.length + ' causas · todo correcto'; return d; }
    catch (e) { pr.classList.add('err'); pr.textContent = e.message || 'Revisa los datos'; return null; }
  }
  function openBayes() {
    if (!$('#bayesRows').children.length) { bayesHeader(); bayesRow(0, 'A1', '0.3', '0.02'); bayesRow(1, 'A2', '0.5', '0.03'); bayesRow(2, 'A3', '0.2', '0.05'); }
    bayesPrev();
    bayesDlg.showModal();
    $('#bayesEv').focus();
    return new Promise((res) => { bayesResolve = res; });
  }
  const bayesDone = (v) => { const r = bayesResolve; bayesResolve = null; if (bayesDlg.open) bayesDlg.close(); if (r) r(v); };
  $('#bayesAdd').addEventListener('click', () => { const n = $$('#bayesRows input').length / 3; if (n < 6) bayesRow(n, 'A' + (n + 1), '', ''); bayesPrev(); });
  $('#bayesDel').addEventListener('click', () => { const g = $('#bayesRows'); if ($$('#bayesRows input').length / 3 > 2) for (let k = 0; k < 4; k++) g.lastElementChild.remove(); bayesPrev(); });
  $('#bayesEv').addEventListener('input', () => { const h = $$('#bayesRows > span'); if (h[3]) h[3].textContent = 'P(' + ($('#bayesEv').value || 'B') + ' | causa)'; bayesPrev(); });
  $('#bayesOk').addEventListener('click', () => { const d = bayesPrev(); if (d) bayesDone(d); });
  $('#bayesCancel').addEventListener('click', () => bayesDone(null));
  bayesDlg.addEventListener('close', () => bayesDone(null));
  async function runBayes() {
    const d = await openBayes();
    if (!d) return;
    try {
      const specs = R('engine/ops').bayes(d.causes, d.ev);
      const b = activeBlock();
      insertSpecs(b ? b.id : null, specs, b);
    } catch (e) { toast(e.message || 'Revisa los datos del árbol.', 'aviso'); }
  }
  return { openBayes, runBayes, bayesPrev };
});
