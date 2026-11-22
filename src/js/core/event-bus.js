/* Bus de eventos: desacopla módulos que no deben conocerse (p. ej. el modelo avisa de que se ha guardado
   y el historial decide si hace guardado automático).
   Eventos en uso (documentados en docs/ARQUITECTURA.md):
     'board:persisted'  → el tablero se acaba de guardar en localStorage
     'board:replaced'   → se ha sustituido el tablero entero (abrir archivo, historial, nueva clase)
     'board:saved'      → la clase se ha guardado en un archivo o en la carpeta (ya no hay cambios pendientes) */
MatIA.define('core/event-bus', [], () => {
  'use strict';
  const subs = new Map();
  return {
    on(evt, fn) { if (!subs.has(evt)) subs.set(evt, new Set()); subs.get(evt).add(fn); return () => subs.get(evt).delete(fn); },
    off(evt, fn) { if (subs.has(evt)) subs.get(evt).delete(fn); },
    emit(evt, data) { (subs.get(evt) || []).forEach((fn) => { try { fn(data); } catch (e) { console.error('MatIA bus «' + evt + '»:', e); } }); },
  };
});
