/* Banco de ejemplos · graficas (los cálculos los genera el motor de la app: engine/ops). */
MatIA.ejemplo({
  id: "graficas-tejados",
  tema: "graficas",
  titulo: "¿Dónde se encuentran dos tejados?",
  resumen: "Un tejado inclinado y una cúpula son dos superficies en 3D: igualando sus alturas descubrimos por dónde pasa la unión y cuánta chapa hace falta.",
  board: {
    title: "¿Dónde se encuentran dos tejados?",
    pages: [
    { blocks: [
      {"type":"text","v":"Una casa tiene un tejado inclinado que sube hacia el este, y a su lado se levanta una torre con tejado en forma de cúpula. El tejadista tiene que sellar la unión entre las dos superficies con una tira de chapa (el remate), y necesita saber por dónde pasa esa línea y cuánta chapa comprar. Cada tejado es una superficie z = f(x, y), donde z es la altura en metros. Dónde se cortan dos superficies es una ecuación: igualar sus alturas."},
      {"type":"text","v":"1. Planteamiento: las dos superficies"},
      {"type":"deriv","rows":[{"l":"\\text{Cúpula}","r":"z=8-0{,}2\\left(x^{2}+y^{2}\\right)","note":"Altura 8 m en el centro, y baja de forma suave hacia los lados. Es un paraboloide","boxed":false},{"l":"\\text{Tejado inclinado}","r":"z=0{,}4x+4","note":"Un plano: sube 0,4 m por cada metro hacia el este (x) y no cambia hacia el norte (y). Pendiente de unos 22°","boxed":true}]},
      {"type":"graph3d","fns":["z=8-0.2x^2-0.2y^2","z=0.4x+4"],"fn":"z=8-0.2x^2-0.2y^2","xmin":-6,"xmax":5,"ymin":-5,"ymax":5,"az":-0.8,"el":0.45,"zoom":1,"align":"center"},
      {"type":"text","v":"Arrastra el dibujo para girarlo: verás cómo el plano atraviesa la cúpula. Fíjate en la curva donde el plano entra en la cúpula: es la línea que hay que sellar."},
      {"type":"text","v":"2. ¿Dónde se cortan? Igualamos las alturas"},
      {"type":"deriv","rows":[{"l":"8-0{,}2\\left(x^{2}+y^{2}\\right)","r":"0{,}4x+4","note":"En los puntos de corte las dos superficies tienen la misma altura z","boxed":false},{"l":"40-\\left(x^{2}+y^{2}\\right)","r":"2x+20","note":"Multiplicamos por 5 para quitar decimales","boxed":false},{"l":"x^{2}+2x+y^{2}","r":"20","note":"Pasamos todo al lado izquierdo","boxed":false},{"l":"\\left(x+1\\right)^{2}+y^{2}","r":"21","note":"Completamos el cuadrado: (x + 1)² = x² + 2x + 1, sumamos 1 a los dos lados","boxed":true}]},
      {"type":"text","v":"Es la ecuación de una circunferencia de centro (−1, 0) y radio √21 ≈ 4,58 m: vista desde arriba, la unión de los dos tejados es un círculo. Con la altura de cada punto z = 0,4x + 4 completamos la curva en 3D. Los extremos los encontramos cortando con y = 0 (Operaciones ▸ Resolver paso a paso):"},
      {"type":"math","v":"x^2+2x-20=0"},
      {"type":"deriv","rows":[{"l":"x^2+2x-20","r":"0","note":"Ecuación","boxed":false},{"l":"\\Delta","r":"b^{2}-4ac=2^{2}-4\\cdot 1\\cdot \\left(-20\\right)=84","note":"a = 1, b = 2, c = -20","boxed":false},{"l":"x","r":"\\frac{-b\\pm\\sqrt{\\Delta}}{2a}=\\frac{-2\\pm\\sqrt{84}}{2}","note":"Fórmula de la ecuación de segundo grado","boxed":false},{"l":"x_{1}","r":"-1+\\sqrt{21}","note":"Simplificamos la raíz","boxed":true},{"l":"x_{2}","r":"-1-\\sqrt{21}","note":"La otra raíz","boxed":true}]},
      {"type":"text","v":"3. La respuesta interpretada"},
      {"type":"deriv","rows":[{"l":"P_{\\text{alto}}","r":"x=-1+\\sqrt{21}\\approx 3{,}58;\\quad z=0{,}4\\cdot 3{,}58+4\\approx 5{,}43\\ \\text{m}","note":"Es el punto más alto del remate, en el lado este (y = 0)","boxed":false},{"l":"P_{\\text{bajo}}","r":"x=-1-\\sqrt{21}\\approx -5{,}58;\\quad z=0{,}4\\cdot(-5{,}58)+4\\approx 1{,}77\\ \\text{m}","note":"Es el punto más bajo, en el lado oeste (y = 0)","boxed":false},{"l":"L\\approx","r":"30\\ \\text{m}","note":"La circunferencia vista desde arriba mide 2π√21 ≈ 28,8 m; como la línea sube y baja por el plano es algo más larga, cerca de 30 m (el valor lo da el cálculo integral)","boxed":true}]},
      {"type":"text","v":"El tejadista debe comprar unos 30 m de chapa de remate, y la parte más baja de la unión (1,77 m) es donde más cuidado hay que poner con el agua, porque ahí desemboca todo lo que baja por los dos tejados."},
      {"type":"text","v":"¿Y en la vida real? Los ingenieros usan esta misma idea cuando dos superficies de un edificio, un puente o una carrocería se encuentran. Los programas de diseño en 3D calculan esas curvas de corte igualando las alturas, aunque las ecuaciones sean mucho más complicadas que estas."},
      {"type":"text","v":"Ahora tú: 1) Cambia la altura de la cúpula de 8 a 6 (z = 6 − 0,2(x² + y²)) y repite la igualación: ¿qué radio tiene ahora el círculo? (Se obtiene (x + 1)² + y² = 11.) 2) Cambia la pendiente del tejado de 0,4 a 0 (tejado plano z = 4): ¿dónde corta ahora a la cúpula? Escribe 8 − 0,2(x² + y²) = 4: sale una circunferencia centrada en el origen, de radio √20 ≈ 4,47."},
    ], strokes: [] },
    ],
  },
});
