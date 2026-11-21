/* Banco de ejemplos · graficas (bloques generados con el motor de la app: engine/ops). */
MatIA.ejemplo({
  id: "graficas-superficies-cortan",
  tema: "graficas",
  titulo: "Dos superficies que se cortan",
  resumen: "Dibuja dos paraboloides en 3D y calcula la curva en la que se cortan: una circunferencia.",
  board: {
    title: "Dos superficies que se cortan",
    pages: [
    { blocks: [
      {"type":"text","v":"En 3D, z = f(x, y) es una superficie. Aquí hay dos paraboloides, uno abierto hacia arriba y otro hacia abajo. Arrastra la gráfica para girarla y mira dónde se cortan. Prueba a cambiar el 4 por otro número: ¿la circunferencia crece o se encoge?"},
      {"type":"graph3d","fns":["z=x^2+y^2","z=4-x^2-y^2"],"fn":"z=x^2+y^2","xmin":-2,"xmax":2,"ymin":-2,"ymax":2,"az":-0.8,"el":0.45,"zoom":1,"marks":[{"x":0,"y":0,"z":0,"kind":"min","label":"mín (0, 0, 0)"},{"x":0,"y":0,"z":4,"kind":"max","label":"máx (0, 0, 4)"}],"align":"center"},
      { type: 'deriv', rows: [
        {"l":"x^2+y^2","r":"4-x^2-y^2","note":"Igualamos las dos alturas z","boxed":false},
        {"l":"2\\left(x^2+y^2\\right)","r":"4","note":"Pasamos todo a la izquierda","boxed":false},
        {"l":"x^2+y^2","r":"2","note":"Circunferencia de radio √2 ≈ 1,41","boxed":false},
        {"l":"z","r":"2","note":"Sustituyendo: la circunferencia está a altura z = 2","boxed":true},
      ] },
    ], strokes: [] },
    ],
  },
});
