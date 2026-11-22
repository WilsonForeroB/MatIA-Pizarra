/* Banco de ejemplos · graficas (bloques generados con el motor de la app: engine/ops). */
MatIA.ejemplo({
  id: "graficas-punto-silla",
  tema: "graficas",
  titulo: "Punto de silla",
  resumen: "La superficie z = x² − y² tiene en el origen un punto de silla: mínimo en una dirección y máximo en la otra.",
  board: {
    title: "Punto de silla",
    pages: [
    { blocks: [
      {"type":"text","v":"Un punto de silla no es ni máximo ni mínimo: la superficie sube en una dirección y baja en otra, como una silla de montar. Gira la superficie para verlo y prueba con z = x² + y² (mínimo) o z = x³ − 3x + y² (un mínimo y un punto de silla)."},
      {"type":"math","v":"z=x^2-y^2"},
      { type: 'deriv', rows: [
        {"l":"f(x,y)","r":"x^{2}-y^{2}","note":"Función de dos variables","boxed":false},
        {"l":"f_{x}","r":"2x","note":"Derivada parcial respecto de x","boxed":false},
        {"l":"f_{y}","r":"-2y","note":"Derivada parcial respecto de y","boxed":false},
        {"l":"\\nabla f","r":"0\\Rightarrow\\begin{cases}2x=0\\\\ -2y=0\\end{cases}","note":"Puntos críticos: anulamos el gradiente","boxed":false},
        {"l":"\\text{Puntos críticos}","r":"P_{1}=\\left(0,\\ 0\\right)","note":"Soluciones del sistema","boxed":false},
        {"l":"H(x,y)","r":"\\begin{pmatrix}2 & 0\\\\ 0 & -2\\end{pmatrix}","note":"Matriz hessiana: f_xx, f_xy / f_yx, f_yy","boxed":false},
        {"l":"|H(P_{1})|","r":"\\begin{vmatrix}2 & 0\\\\ 0 & -2\\end{vmatrix}=-4","note":"|H| < 0: punto de silla. f(P1) = 0","boxed":true},
      ] },
      {"fns":["z=x^2-y^2"],"type":"graph3d","fn":"z=x^2-y^2","xmin":-2.5,"xmax":2.5,"ymin":-2.5,"ymax":2.5,"az":-0.8,"el":0.55,"zoom":1,"marks":[{"x":0,"y":0,"z":0,"kind":"saddle","label":"P1 silla"}],"align":"center"},
      {"type":"text","v":"Cortes de la superficie por los planos y = 0 y x = 0: en una dirección vemos un mínimo y en la otra un máximo."},
      {"type":"graph","fns":["f(x)=x^2","g(x)=-x^2"],"xmin":-2.5,"xmax":2.5,"ymin":-5,"ymax":5,"marks":[{"x":0,"y":0,"kind":"saddle","label":"silla (0, 0)"}],"align":"center"},
    ], strokes: [] },
    ],
  },
});
