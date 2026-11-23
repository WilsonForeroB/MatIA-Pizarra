/* Banco de ejemplos · calculo (el cálculo del mínimo lo genera el motor de la app: engine/ops). */
MatIA.ejemplo({
  id: "calculo-lata-optima",
  tema: "calculo",
  titulo: "¿Por qué las latas tienen esa forma?",
  resumen: "Con derivadas buscamos la lata de 330 ml que gasta menos aluminio, la comparamos con la real y descubrimos por qué los fabricantes la hacen más estrecha.",
  board: {
    title: "¿Por qué las latas tienen esa forma?",
    pages: [
    { blocks: [
      {"type":"text","v":"Una lata de refresco guarda 330 ml y está hecha de aluminio. Cada año se fabrican en el mundo cientos de miles de millones de latas, así que ahorrar un poco de metal en cada una supone toneladas de aluminio y mucho dinero. La pregunta del fabricante es: ¿qué radio y qué altura gastan menos aluminio? La respuesta está en las derivadas."},
      {"type":"text","v":"1. Planteamiento: de la lata a una función"},
      {"type":"deriv","rows":[{"l":"V","r":"\\pi r^{2}h=330","note":"El volumen de un cilindro es el área de la base por la altura: 330 ml = 330 cm³","boxed":false},{"l":"h","r":"\\frac{330}{\\pi r^{2}}","note":"Despejamos la altura: así solo queda una incógnita, el radio r","boxed":false},{"l":"A","r":"2\\pi r^{2}+2\\pi r\\,h","note":"Aluminio = dos tapas (círculos de área πr²) + la pared (un rectángulo de 2πr por h)","boxed":false},{"l":"A(r)","r":"2\\pi r^{2}+2\\pi r\\cdot \\frac{330}{\\pi r^{2}}=2\\pi r^{2}+\\frac{660}{r}","note":"Sustituimos h: el aluminio depende solo del radio","boxed":true}]},
      {"type":"text","v":"2. Buscamos el mínimo (Operaciones ▸ Máximos y mínimos de f(x), con radios razonables entre 1 y 8 cm)"},
      {"type":"math","v":"A(r)=2\\pi r^2+\\frac{660}{r},\\ r\\in[1,8]"},
      {"type":"deriv","rows":[{"l":"A(r)","r":"2\\pi r^{2}+\\frac{660}{r}","note":"Función en el intervalo [1, 8]","boxed":false},{"l":"A'(r)","r":"4\\pi r-\\frac{660}{r^{2}}","note":"Derivamos","boxed":false},{"l":"4\\pi r-\\frac{660}{r^{2}}","r":"0","note":"Puntos críticos: anulamos la derivada (soluciones aproximadas)","boxed":false},{"l":"r","r":"3{,}7449\\ldots","note":"Un punto crítico","boxed":false},{"l":"A''(r)","r":"\\frac{1320}{r^{3}}+4\\pi ","note":"Segunda derivada para clasificarlos","boxed":false},{"l":"A''\\left(3{,}7449\\right)","r":"12\\pi >0","note":"Mínimo relativo en (≈3,7449, ≈264,3568)","boxed":false},{"l":"A(1),\\ A(8)","r":"666{,}2832;\\ 484{,}6239","note":"En los bordes (latas muy estrechas o muy anchas) se gasta mucho más","boxed":false},{"l":"\\text{Mín. absoluto}","r":"A=264{,}3568\\ \\text{en}\\ r=3{,}7449","note":"El menor valor de todos: es el radio que gasta menos aluminio","boxed":true}]},
      {"type":"table","head":["r","[1, 3,7449)","3,7449","(3,7449, 8]"],"rows":[["A′(r)","−","0","+"],["A(r)","↘ decrece","mín","↗ crece"]],"vbar":1,"kind":"mono","caption":"Crecimiento y decrecimiento de A(r)"},
      {"type":"graph","fns":["A(r)=2\\pi r^2+\\frac{660}{r}"],"xmin":0.5,"xmax":8.5,"marks":[{"x":3.7449385040392134,"y":264.35681091484054,"kind":"min","label":"mínimo: r ≈ 3,74 cm"}],"ymin":0,"ymax":700},
      {"type":"text","v":"3. La respuesta"},
      {"type":"deriv","rows":[{"l":"r","r":"\\sqrt[3]{\\frac{165}{\\pi}}\\approx 3{,}74\\ \\text{cm}","note":"De A′(r) = 0: 4πr = 660/r², es decir, πr³ = 165","boxed":false},{"l":"h","r":"\\frac{330}{\\pi r^{2}}=\\frac{330\\,r}{\\pi r^{3}}=\\frac{330\\,r}{165}=2r\\approx 7{,}49\\ \\text{cm}","note":"Multiplicamos arriba y abajo por r y usamos que πr³ = 165. ¡La lata óptima es tan alta como ancha!","boxed":true},{"l":"A_{\\min}","r":"2\\pi r^{2}+\\frac{660}{r}\\approx 264{,}4\\ \\text{cm}^{2}","note":"El aluminio mínimo para guardar 330 ml","boxed":false}]},
      {"type":"solid","fn":"f(x)=7.49","a":0,"b":3.745,"axis":"y","k":0,"az":-0.8,"el":0.45,"zoom":1,"align":"center"},
      {"type":"text","v":"Esta es la lata óptima: el sólido que sale al girar la altura h = 7,49 alrededor del eje Y, con radio 3,745 cm. Su volumen sale 330 cm³. Arrástrala para girarla."},
      {"type":"text","v":"4. ¿Y la lata de verdad?"},
      {"type":"deriv","rows":[{"l":"r_{\\text{real}}","r":"3{,}3\\ \\text{cm}\\ \\Rightarrow\\ h=\\frac{330}{\\pi\\cdot 3{,}3^{2}}\\approx 9{,}65\\ \\text{cm}","note":"Una lata de 330 ml mide unos 6,6 cm de diámetro. La altura que ves, unos 11,5 cm, incluye el cuello y los bordes","boxed":false},{"l":"A_{\\text{real}}","r":"2\\pi\\cdot 3{,}3^{2}+\\frac{660}{3{,}3}\\approx 268{,}4\\ \\text{cm}^{2}","note":"Solo un 1,5 % más que la lata óptima: el fabricante sacrifica muy poco","boxed":true}]},
      {"type":"text","v":"¿Por qué la hacen más estrecha? Las tapas son más gruesas que la pared (aguantan la presión del gas y la anilla), así que cada cm² de tapa sale más caro. Si la tapa costara el doble, la lata más barata mediría 4 radios de alto, muy cerca de la real (11,5 : 3,3 ≈ 3,5). Además, una lata estrecha se agarra mejor con una mano y cabe en las máquinas expendedoras."},
      {"type":"text","v":"Ahora tú: 1) Cambia 330 por 500 (lata grande) y repite el cálculo: ¿sigue saliendo h = 2r? 2) Si la tapa cuesta el doble, el coste es C(r) = 4πr² + 660/r. Escríbelo en una línea, elige Operaciones ▸ Máximos y mínimos de f(x) y comprueba que la altura sale 4 veces el radio."},
    ], strokes: [] },
    ],
  },
});
