/* Arranque: ejecuta todos los módulos registrados, en el orden de index.html. */
(function () {
  'use strict';
  try { MatIA.start(); } catch (e) {
    console.error(e);
    const t = document.getElementById('toast');
    if (t) t.textContent = 'La pizarra no ha podido arrancar: ' + (e && e.message ? e.message : e);
  }
})();
