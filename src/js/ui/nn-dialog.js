/* Asistente de red neuronal (pizarra.html 6912-6943). */
MatIA.define('ui/nn-dialog', ['core/dom', 'assets/pio'], (dom, pio) => {
  'use strict';
  const { $ } = dom;

  /* ---------------- Asistente de red neuronal ---------------- */
  const nnDlg = $('#nnDlg');
  $('#nnPio').appendChild(pio.badge('idea', '', 'Pío con una idea'));
  let nnResolve = null;
  function nnParse() {
    const sizes = $('#nnLayers').value.split(/[,;\s]+/).filter(Boolean).map((t) => parseInt(t, 10));
    const prev = $('#nnPrev');
    if (sizes.length < 2 || sizes.length > 7 || sizes.some((n) => !Number.isInteger(n) || n < 1 || n > 10)) {
      prev.classList.add('err');
      prev.textContent = 'Escribe entre 2 y 7 capas con 1 a 10 neuronas cada una, por ejemplo 3, 4, 4, 2.';
      return null;
    }
    prev.classList.remove('err');
    const bias = $('#nnBias').checked;
    let conns = 0; for (let l = 0; l < sizes.length - 1; l++) conns += (sizes[l] + (bias ? 1 : 0)) * sizes[l + 1];
    prev.textContent = sizes.map((n, l) => (l === 0 ? 'Entrada ' : l === sizes.length - 1 ? 'Salida ' : 'Oculta ') + n).join(' · ') + '  →  ' + conns + ' conexiones';
    return { sizes, bias, showW: $('#nnW').checked };
  }
  ['input', 'change'].forEach((ev) => { $('#nnLayers').addEventListener(ev, nnParse); $('#nnBias').addEventListener(ev, nnParse); });
  function openNN() {
    if (nnResolve) nnResolve(null);
    nnParse();
    nnDlg.showModal();
    $('#nnLayers').focus();
    return new Promise((res) => { nnResolve = res; });
  }
  const nnDone = (v) => { const r = nnResolve; nnResolve = null; if (nnDlg.open) nnDlg.close(); if (r) r(v); };
  $('#nnOk').addEventListener('click', () => { const v = nnParse(); if (v) nnDone(v); });
  $('#nnCancel').addEventListener('click', () => nnDone(null));
  $('#nnLayers').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('#nnOk').click(); } });
  nnDlg.addEventListener('close', () => nnDone(null));
  return { openNN, nnParse };
});
