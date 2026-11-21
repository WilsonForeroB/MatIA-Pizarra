/* Arranque (pizarra.html 8073-8100): decora las insignias de Pío, aplica los ajustes y espera a que MathLive esté definido.
   Debe ser el ÚLTIMO módulo de pizarra.html. */
MatIA.define('app/start', ['model/board', 'ui/state', 'ui/toast', 'assets/pio'], (S, st, toast, pio) => {
  'use strict';
  const R = (n) => MatIA.require(n);
  pio.decorate();
  R('ui/view').applySettings();
  function start() {
    st.mlReady = true;
    const MFE = window.MathfieldElement;
    try {
      MFE.fontsDirectory = new URL('vendor/mathlive/fonts/', location.href).href;
      MFE.soundsDirectory = null;
      MFE.plonkSound = null;
      MFE.keypressSound = null;
    } catch (e) { /* */ }
    R('blocks/editor').renderPage();
    requestAnimationFrame(() => { const f = S.page().blocks[0]; if (f) R('blocks/editor').focusBlock(f.id); });
  }
  let started = false;
  const go = () => { if (!started) { started = true; start(); } };
  if (window.customElements) {
    customElements.whenDefined('math-field').then(go);
  }
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (!started && !customElements.get('math-field')) {
        R('blocks/editor').renderPage();
        toast('No se ha podido cargar el editor de fórmulas (¿sin conexión?). Puedes dibujar y escribir texto; recarga la página cuando tengas red.', 'aviso');
      }
    }, 4000);
  });
  return { start, go };
});
