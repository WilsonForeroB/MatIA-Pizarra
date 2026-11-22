/* Banco de ejemplos · graficas (bloques generados con el motor de la app: engine/ops). */
MatIA.ejemplo({
  id: "graficas-varias-funciones",
  tema: "graficas",
  titulo: "Varias funciones en una gráfica",
  resumen: "Compara sin x, cos x y su suma en la misma gráfica, y una familia de parábolas que se desplazan y se estiran.",
  board: {
    title: "Varias funciones en una gráfica",
    pages: [
    { blocks: [
      {"type":"text","v":"Dibujar varias funciones juntas ayuda a compararlas. Aquí sumamos sin x y cos x: el resultado vuelve a ser una onda, un poco más alta (amplitud √2 ≈ 1,41) y desplazada. Prueba a cambiar h(x) por sin(x)·cos(x) o por sin(2x) y observa qué cambia."},
      {"type":"graph","fns":["f(x)=\\sin(x)","g(x)=\\cos(x)","h(x)=\\sin(x)+\\cos(x)"],"xmin":-6.3,"xmax":6.3,"ymin":-2,"ymax":2,"align":"center"},
      {"type":"math","v":"\\sin x+\\cos x=\\sqrt{2}\\,\\sin\\left(x+\\frac{\\pi}{4}\\right)","align":"center","note":"Por eso la suma es otra sinusoide"},
      {"type":"text","v":"Familia de parábolas y = a(x − h)² + k: a estira o da la vuelta a la parábola, h la mueve a izquierda o derecha y k arriba o abajo. Cambia los números y adivina antes cómo quedará."},
      {"type":"graph","fns":["f(x)=x^2","g(x)=(x-2)^2","h(x)=x^2-3","p(x)=-0.5x^2+4","q(x)=2(x+2)^2-1"],"xmin":-5,"xmax":5,"ymin":-5,"ymax":8,"align":"center"},
    ], strokes: [] },
    ],
  },
});
