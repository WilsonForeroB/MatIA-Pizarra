/* Registro de tipos de bloque visuales (abierto/cerrado: un tipo nuevo se añade con un fichero que se registra,
   sin tocar el editor ni la impresión).
     registry.register({ type: 'graph', build(b, bd, ro) { … }, exportable: true })
   build(b, bd, ro): dibuja el bloque b dentro del contenedor bd; ro = true en impresión/solo lectura.
   Los tipos math y text los dibuja el editor (blocks/editor) porque dependen de MathLive. */
MatIA.define('blocks/registry', [], () => {
  'use strict';
  const types = new Map();
  return {
    register(def) {
      if (!def || !def.type || typeof def.build !== 'function') throw new Error('MatIA: tipo de bloque inválido.');
      types.set(def.type, def);
    },
    get: (type) => types.get(type) || null,
    has: (type) => types.has(type),
    types: () => Array.from(types.keys()),
  };
});
