/* MatIA · cargador de módulos.
   La pizarra se abre con doble clic (file://). En ese caso Chrome bloquea los módulos ES (import/export),
   así que cada fichero es un <script> clásico que se registra aquí:

     MatIA.define('ui/toast', ['core/dom'], (dom) => { ...; return { show }; });

   - define(nombre, dependencias, fábrica): registra el módulo; no lo ejecuta todavía.
   - require(nombre): devuelve la API del módulo; si aún no existe, ejecuta su fábrica (y antes la de sus dependencias).
   - start(): ejecuta todos los módulos registrados, en el orden en que index.html los carga.
   Las dependencias circulares no se permiten en la lista de dependencias. Si dos módulos se necesitan
   mutuamente, uno de ellos llama a MatIA.require('otro') dentro de una función (enlace tardío). */
(function (global) {
  'use strict';
  const defs = new Map();
  const instances = new Map();
  const building = [];

  function define(name, deps, factory) {
    if (typeof deps === 'function') { factory = deps; deps = []; }
    if (defs.has(name)) throw new Error('MatIA: el módulo «' + name + '» ya está definido.');
    defs.set(name, { deps: deps || [], factory });
  }

  function require(name) {
    if (instances.has(name)) return instances.get(name);
    const def = defs.get(name);
    if (!def) throw new Error('MatIA: no existe el módulo «' + name + '». ¿Falta su <script> en index.html o está después del que lo usa?');
    if (building.includes(name)) throw new Error('MatIA: dependencia circular: ' + building.concat(name).join(' → ') + '. Usa MatIA.require dentro de una función.');
    building.push(name);
    try {
      const api = def.factory(...def.deps.map(require));
      instances.set(name, api === undefined ? {} : api);
    } finally { building.pop(); }
    return instances.get(name);
  }

  function start() {
    for (const name of defs.keys()) require(name);
  }

  global.MatIA = Object.freeze({ define, require, start, has: (n) => defs.has(n), list: () => Array.from(defs.keys()) });
})(window);
