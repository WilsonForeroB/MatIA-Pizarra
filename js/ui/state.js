/* Estado compartido de la interfaz (no se guarda en el archivo de la clase).
   Lo leen y escriben varios módulos: úsalo como st.activeId, st.activeCell…, nunca copies el valor en una variable propia. */
MatIA.define('ui/state', [], () => ({
  activeId: null,     // id del bloque activo
  activeCell: null,   // celda activa de un desarrollo: { id, row, col } o null
  mlReady: false,     // MathLive ya está cargado
  openPop: null,      // ventana emergente de la barra abierta
  picking: null,      // flujo «elige la línea» del menú Operaciones en curso
  zoomF: 1,           // zoom aplicado a la hoja
}));
