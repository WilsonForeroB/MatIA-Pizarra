/* Banco de ejemplos · algebra (los cálculos los genera el motor de la app: engine/ops). */
MatIA.ejemplo({
  id: "algebra-caja-carton",
  tema: "algebra",
  titulo: "¿De qué tamaño cortar las esquinas para una caja de 1 litro?",
  resumen: "Cortando cuadrados en las esquinas de una hoja de cartón, el volumen es un polinomio de grado 3: Ruffini da las medidas y el sentido físico descarta una solución.",
  board: {
    title: "¿De qué tamaño cortar las esquinas para una caja de 1 litro?",
    pages: [
    { blocks: [
      {"type":"text","v":"Tienes una hoja de cartón de 30 cm × 20 cm y quieres hacer una caja sin tapa que guarde exactamente 1 litro (1000 cm³). El método clásico: recortas un cuadrado de lado x en cada una de las cuatro esquinas, doblas los laterales hacia arriba y pegas. La pregunta: ¿cuánto tiene que medir x? Si recortas poco, la caja es muy plana; si recortas mucho, queda muy estrecha. Hay que plantear una ecuación y resolverla."},
      {"type":"text","v":"1. Planteamiento: de la caja a un polinomio"},
      {"type":"deriv","rows":[{"l":"\\text{Base}","r":"(30-2x)\\times(20-2x)","note":"Al quitar dos cuadrados de lado x a cada lado, el largo pasa de 30 a 30 − 2x y el ancho de 20 a 20 − 2x","boxed":false},{"l":"\\text{Altura}","r":"x","note":"Lo que doblamos hacia arriba es justo el lado del cuadrado cortado","boxed":false},{"l":"V(x)","r":"x\\left(30-2x\\right)\\left(20-2x\\right)","note":"Volumen = largo × ancho × alto","boxed":false},{"l":"","r":"4x^{3}-100x^{2}+600x","note":"Al multiplicar queda un polinomio de grado 3","boxed":false},{"l":"V(x)","r":"1000","note":"Queremos 1 litro = 1000 cm³","boxed":false},{"l":"4x^{3}-100x^{2}+600x-1000","r":"0","note":"Pasamos todo a un lado","boxed":false},{"l":"x^{3}-25x^{2}+150x-250","r":"0","note":"Dividimos entre 4: mismos resultados, números más pequeños","boxed":true}]},
      {"type":"text","v":"2. Resolvemos con Ruffini (Operaciones ▸ Raíces y factorización)"},
      {"type":"math","v":"x^3-25x^2+150x-250"},
      {"type":"text","v":"Probamos con los divisores del término independiente (250): 1, 2, 5, 10... Al probar x = 5 el resto es 0, así que 5 es una raíz:"},
      {"type":"table","caption":"Ruffini con las raíces enteras/racionales (divisores del término independiente)","rows":[["","1","-25","150","-250"],["5","","5","-100","250"],["","1","-20","50","0"]],"vbar":1,"hlines":[2],"kind":"ruffini"},
      {"type":"math","v":"x^{3}-25x^{2}+150x-250=\\left(x-5\\right)\\left(x^{2}-20x+50\\right)"},
      {"type":"math","v":"\\text{Raíces: }x=5,\\quad x=10+5\\sqrt{2},\\quad x=10-5\\sqrt{2}"},
      {"type":"text","v":"El cociente x² − 20x + 50 es de segundo grado: se resuelve con Operaciones ▸ Resolver paso a paso."},
      {"type":"deriv","rows":[{"l":"x^2-20x+50","r":"0","note":"Ecuación","boxed":false},{"l":"\\Delta","r":"b^{2}-4ac=\\left(-20\\right)^{2}-4\\cdot 1\\cdot 50=200","note":"a = 1, b = -20, c = 50","boxed":false},{"l":"x","r":"\\frac{-b\\pm\\sqrt{\\Delta}}{2a}=\\frac{20\\pm\\sqrt{200}}{2}","note":"Fórmula de la ecuación de segundo grado","boxed":false},{"l":"x_{1}","r":"10+5\\sqrt{2}","note":"Simplificamos la raíz","boxed":true},{"l":"x_{2}","r":"10-5\\sqrt{2}","note":"La otra raíz","boxed":true}]},
      {"type":"text","v":"3. La respuesta: ¿qué soluciones tienen sentido?"},
      {"type":"deriv","rows":[{"l":"x","r":"5","note":"Raíz entera (cortamos cuadrados de 5 cm)","boxed":false},{"l":"x","r":"10-5\\sqrt{2}\\approx 2{,}93","note":"Otra raíz válida (cuadrados de unos 3 cm)","boxed":false},{"l":"x","r":"10+5\\sqrt{2}\\approx 17{,}07","note":"No vale: la hoja solo mide 20 cm de ancho, y tendríamos que cortar 2x = 34 cm. El ancho 20 − 2x saldría negativo","boxed":true}]},
      {"type":"text","v":"Fíjate: x tiene que estar entre 0 y 10 cm (la mitad del lado más corto). Las raíces 5 y 10 − 5√2 ≈ 2,93 cumplen esa condición, así que hay dos cajas de 1 litro posibles."},
      {"type":"deriv","rows":[{"l":"\\text{Caja 1}\\ (x=5)","r":"20\\times 10\\times 5\\ \\text{cm}","note":"Largo 30 − 10 = 20, ancho 20 − 10 = 10 y alto 5. Volumen: 20 · 10 · 5 = 1000 cm³","boxed":false},{"l":"\\text{Caja 2}\\ (x\\approx 2{,}93)","r":"24{,}1\\times 14{,}1\\times 2{,}93\\ \\text{cm}","note":"Largo 30 − 5,86 = 24,14 y ancho 20 − 5,86 = 14,14. Volumen: 24,14 · 14,14 · 2,93 ≈ 1000 cm³","boxed":true}]},
      {"type":"graph","fns":["V(x)=x(30-2x)(20-2x)","g(x)=1000"],"xmin":0,"xmax":11,"ymin":0,"ymax":1300,"marks":[{"x":3.9237,"y":1056.305895340212,"kind":"max","label":"máx ≈ 1056 cm³"}]},
      {"type":"text","v":"La curva V(x) es el volumen de la caja según lo que recortemos; la recta horizontal es 1000 cm³. Se cortan en x ≈ 2,93 y x = 5. Entre medias, la caja guarda más de un litro; el máximo está en x ≈ 3,92 cm, con unos 1056 cm³ (se encuentra derivando V(x) e igualando a 0: Operaciones ▸ Máximos y mínimos de f(x))."},
      {"type":"text","v":"¿Y en la vida real? Las cajas que se compran se troquelan con solapas y pestañas, pero la pregunta de fondo es la misma que se hace un fabricante de envases: con una cantidad fija de material, ¿qué medidas dan el volumen que necesito, o el mayor posible? Con esta hoja, 1 litro es cerca del 95 % del máximo (unos 1056 cm³), así que pedir mucho más sería imposible."},
      {"type":"text","v":"Ahora tú: 1) Con la misma hoja, ¿qué x da una caja de 864 cm³? Escribe x³ − 25x² + 150x − 216 = 0 (es la ecuación dividida entre 4) y usa «Raíces y factorización»: x = 6 es raíz entera. ¿Hay otra solución con sentido? 2) Escribe V(x) = 4x³ − 100x² + 600x en una línea, elige Operaciones ▸ Máximos y mínimos de f(x) con x entre 0 y 10 y comprueba que la caja de mayor volumen tiene x ≈ 3,92 cm y unos 1056 cm³."},
    ], strokes: [] },
    ],
  },
});
