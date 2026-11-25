/* Banco de ejemplos · calculo (los cálculos los genera el motor de la app: engine/ops). */
MatIA.ejemplo({
  id: "calculo-precio-entrada",
  tema: "calculo",
  titulo: "¿A qué precio vender las entradas del concierto?",
  resumen: "Con la regla del producto buscamos el precio de entrada que más dinero recauda y vemos qué cambia con el aforo y la reventa.",
  board: {
    title: "¿A qué precio vender las entradas del concierto?",
    pages: [
    { blocks: [
      {"type":"text","v":"Una banda va a tocar en un pabellón de 5 000 personas. Si las entradas son baratas vendrán muchos, pero cada uno paga poco; si son caras, cada entrada deja más dinero, pero viene menos gente. Un estudio de mercado estima que, a 0 €, irían unas 8 000 personas y que cada 40 € de subida la demanda baja a menos de la mitad. ¿Qué precio hace que se recaude más dinero?"},
      {"type":"text","v":"1. Planteamiento: del precio al dinero recaudado"},
      {"type":"deriv","rows":[{"l":"q(p)","r":"8000\\,e^{-p/40}\\ \\text{personas}","note":"Demanda: con p = 0 vendrían 8 000; cada 40 € de subida la demanda se divide por e ≈ 2,72","boxed":false},{"l":"I(p)","r":"p\\cdot q(p)","note":"Ingresos = precio de cada entrada × número de entradas vendidas","boxed":false},{"l":"I(p)","r":"8000\\,p\\,e^{-p/40}\\ \\text{€}=8p\\,e^{-p/40}\\ \\text{miles de €}","note":"Contamos en miles de euros para manejar números más cómodos","boxed":true}]},
      {"type":"text","v":"2. Derivamos con la regla del producto (Operaciones ▸ Derivar paso a paso)"},
      {"type":"math","v":"I(p)=8p\\,e^{-p/40}"},
      {"type":"deriv","rows":[{"l":"u","r":"8p,\\quad v=e^{-p/40}","note":"I(p) es un producto: lo que paga cada uno (u) por algo que depende de cuánta gente viene (v)","boxed":false},{"l":"u'","r":"8,\\quad v'=-\\frac{1}{40}e^{-p/40}","note":"Derivada de la potencia y de la exponencial con la regla de la cadena","boxed":false},{"l":"(u\\cdot v)'","r":"u'v+uv'=8e^{-p/40}-\\frac{8p}{40}e^{-p/40}","note":"Regla del producto: (u·v)′ = u′·v + u·v′","boxed":false}]},
      {"type":"deriv","rows":[{"l":"I(p)","r":"8p\\mathrm{e}^{-\\frac{p}{40}}","note":"Función","boxed":false},{"l":"I'(p)","r":"8\\mathrm{e}^{-\\frac{p}{40}}-\\frac{1}{5}p\\mathrm{e}^{-\\frac{p}{40}}","note":"Reglas: producto, constante por función, potencia, exponencial, cadena","boxed":false},{"l":"","r":"8\\mathrm{e}^{-\\frac{p}{40}}-\\frac{p\\mathrm{e}^{-\\frac{p}{40}}}{5}","note":"Simplificamos","boxed":true}]},
      {"type":"deriv","rows":[{"l":"I'(p)","r":"8e^{-p/40}\\left(1-\\frac{p}{40}\\right)","note":"Sacamos factor común 8·e^(−p/40)","boxed":false},{"l":"1-\\frac{p}{40}","r":"0\\ \\Rightarrow\\ p=40\\ \\text{€}","note":"La exponencial nunca vale 0, así que solo se anula el paréntesis","boxed":true}]},
      {"type":"text","v":"3. ¿Es un máximo? (Operaciones ▸ Máximos y mínimos de f(x), con precios entre 0 y 150 €)"},
      {"type":"math","v":"I(p)=8p\\,e^{-p/40},\\ p\\in[0,150]"},
      {"type":"deriv","rows":[{"l":"I(p)","r":"8p\\mathrm{e}^{-\\frac{p}{40}}","note":"Función en el intervalo [0, 150]","boxed":false},{"l":"I'(p)","r":"8\\mathrm{e}^{-\\frac{p}{40}}-\\frac{p\\mathrm{e}^{-\\frac{p}{40}}}{5}","note":"Derivamos","boxed":false},{"l":"8\\mathrm{e}^{-\\frac{p}{40}}-\\frac{p\\mathrm{e}^{-\\frac{p}{40}}}{5}","r":"0","note":"Puntos críticos: anulamos la derivada","boxed":false},{"l":"p","r":"40","note":"Un punto crítico","boxed":false},{"l":"I''(p)","r":"\\frac{p\\mathrm{e}^{-\\frac{p}{40}}}{200}-\\frac{2\\mathrm{e}^{-\\frac{p}{40}}}{5}","note":"Segunda derivada para clasificarlos","boxed":false},{"l":"I''\\left(40\\right)","r":"-0{,}0736<0","note":"Máximo relativo en p = 40 €, con I ≈ 117,72 miles de €","boxed":false},{"l":"I(0),\\ I(150)","r":"0;\\ 28{,}2213","note":"Gratis no se ingresa nada; a 150 € casi nadie compra","boxed":false},{"l":"\\text{Máx. absoluto}","r":"I=117{,}7214\\ \\text{en}\\ p=40","note":"El precio que más dinero recauda","boxed":true}]},
      {"type":"table","head":["p","[0, 40)","40","(40, 150]"],"rows":[["I′(p)","+","0","−"],["I(p)","↗ crece","máx","↘ decrece"]],"vbar":1,"kind":"mono","caption":"Crecimiento y decrecimiento de I(p)"},
      {"type":"graph","fns":["I(p)=8p\\,e^{-p/40}"],"xmin":-5,"xmax":155,"marks":[{"x":40,"y":117.72142117486155,"kind":"max","label":"máximo: 40 € → 117,7 mil €"}],"ymin":0,"ymax":135},
      {"type":"text","v":"4. La respuesta"},
      {"type":"deriv","rows":[{"l":"p_{\\text{óptimo}}","r":"40\\ \\text{€}","note":"El precio que hace máximo el dinero recaudado","boxed":false},{"l":"q(40)","r":"8000\\,e^{-1}\\approx 2943\\ \\text{entradas}","note":"A ese precio irían unas 2 943 personas","boxed":false},{"l":"I(40)","r":"40\\cdot 2943\\approx 117\\,721\\ \\text{€}","note":"Unos 117 700 €. A 30 € o a 50 € se recaudaría menos (unos 113 000 € y 114 600 €)","boxed":true}]},
      {"type":"text","v":"5. ¿Y en la vida real?"},
      {"type":"text","v":"A 40 € el pabellón queda a menos del 60 %: el promotor quizá prefiera bajar el precio para llenarlo, porque también gana con las bebidas y la venta de camisetas, y un concierto lleno se vive mejor. Y si la sala fuese pequeña, de solo 2 000 personas, a 40 € se quedaría gente fuera: lo lógico sería subir el precio hasta que la demanda sea justo 2 000, es decir, 8000·e^(−p/40) = 2000, p = 40·ln 4 ≈ 55,45 €, y se recaudarían unos 110 900 €. Si la entrada se vende muy por debajo de lo que la gente está dispuesta a pagar, aparece la reventa: otros se quedan con esa diferencia. Recuerda que la demanda real no es una fórmula exacta: es una estimación."},
      {"type":"text","v":"Ahora tú: 1) Si la banda es más famosa, la demanda podría ser q(p) = 8000·e^(−p/60). Escribe I(p) = 8p·e^(−p/60) y usa Operaciones ▸ Máximos y mínimos de f(x): ¿sale el precio óptimo igual a 60 €? 2) Prueba una demanda lineal, q(p) = 8000 − 100p (en miles: I(p) = 8p − 0,1p²), deriva con Operaciones ▸ Derivar paso a paso y halla el precio óptimo."},
    ], strokes: [] },
    ],
  },
});
