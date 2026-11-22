/* Estado del tablero (fuente única de verdad) y autoguardado en localStorage.
   Uso desde otros módulos:  const S = MatIA.require('model/board');  S.board.pages[S.board.cur] …
   No guardes S.board en una variable: al abrir otra clase se sustituye con S.replace(nuevo). */
MatIA.define('model/board', ['model/schema', 'core/event-bus'], (schema, bus) => {
  'use strict';
  const KEY = 'matia-pizarra-v1';

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? schema.sanitize(JSON.parse(raw)) : null;
    } catch (e) { return null; }
  }

  let board = load() || schema.defaults();
  let saveT = null;

  function flush() {
    if (saveT === null) return;
    clearTimeout(saveT); saveT = null;
    try { localStorage.setItem(KEY, JSON.stringify(board)); } catch (e) { /* sin almacenamiento */ }
    bus.emit('board:persisted', board);
  }
  // al cerrar o recargar la pestaña no se pierde el último cambio (el guardado normal espera 350 ms)
  window.addEventListener('pagehide', flush);

  const api = {
    KEY,
    get board() { return board; },
    page: () => board.pages[board.cur],
    /** Sustituye el tablero entero (ya saneado) y avisa a quien escuche 'board:replaced'. */
    replace(next) { board = next; bus.emit('board:replaced', board); return board; },
    /** Guarda en localStorage con un pequeño retardo y emite 'board:persisted'. */
    save() {
      clearTimeout(saveT);
      saveT = setTimeout(() => {
        saveT = null;
        try { localStorage.setItem(KEY, JSON.stringify(board)); } catch (e) { /* sin almacenamiento: la pizarra funciona igual */ }
        bus.emit('board:persisted', board);
      }, 350);
    },
    flush,
    /** JSON del tablero tal como se escribe en un archivo de historial. */
    toJSON() { return JSON.stringify(Object.assign({ app: 'MatIA Pizarra', formato: 1, guardado: new Date().toISOString() }, board), null, 1); },
  };
  return api;
});
