/* Banco de ejemplos · calculo (los cálculos los genera el motor de la app: engine/ops). */
MatIA.ejemplo({
  id: "calculo-frenada",
  tema: "calculo",
  titulo: "¿Cuántos metros necesita un coche para frenar?",
  resumen: "Integrando la velocidad calculamos cuántos metros recorre un coche mientras frena y descubrimos por qué ir a 120 en vez de a 90 casi duplica la distancia.",
  board: {
    title: "¿Cuántos metros necesita un coche para frenar?",
    pages: [
    { blocks: [
      {"type":"text","v":"Vas en coche a 90 km/h, que son 25 metros por segundo, y de repente un peatón cruza. Aunque pises el freno a fondo, el coche no se para en seco: sigue avanzando mientras pierde velocidad. Si frenando pierde 5 m/s cada segundo (una frenada firme, como en asfalto mojado), ¿cuántos metros recorre hasta pararse? La integral lo calcula."},
      {"type":"text","v":"1. Planteamiento: de la velocidad a la distancia"},
      {"type":"deriv","rows":[{"l":"v_{0}","r":"90\\ \\text{km/h}=\\frac{90\\,000\\ \\text{m}}{3600\\ \\text{s}}=25\\ \\text{m/s}","note":"Pasamos a metros por segundo para trabajar con segundos","boxed":false},{"l":"v(t)","r":"25-5t\\ \\ \\text{(m/s)}","note":"Deceleración constante de 5 m/s²: cada segundo la velocidad baja 5 m/s","boxed":false},{"l":"v(t)","r":"0\\ \\Rightarrow\\ t=5\\ \\text{s}","note":"El coche se para a los 5 segundos","boxed":false},{"l":"d","r":"\\int_{0}^{5}v(t)\\,dt","note":"La distancia es el área bajo la gráfica de la velocidad: sumamos «velocidad × tiempo» en trocitos muy pequeños","boxed":true}]},
      {"type":"text","v":"La recta empieza en 25 m/s (cuando pisas el freno) y llega a 0 en t = 5 s (coche parado). El área del triángulo que queda debajo es la distancia."},
      {"type":"graph","fns":["v(t)=25-5t"],"xmin":-0.5,"xmax":6,"ymin":-2,"ymax":28},
      {"type":"text","v":"2. Calculamos la integral (Operaciones ▸ Integral paso a paso)"},
      {"type":"math","v":"\\int_0^5(25-5t)\\,dt"},
      {"type":"deriv","rows":[{"l":"\\int_{0}^{5}\\left(25-5t\\right)dt","r":"\\left[25t-\\frac{5}{2}t^{2}\\right]_{0}^{5}","note":"Primitiva F(t) = 25t − 5t²/2 (reglas: suma, constante por función, potencia). Regla de Barrow: F(b) − F(a)","boxed":false},{"l":"","r":"\\frac{125}{2}-0","note":"F(5) − F(0) = (125 − 62,5) − 0","boxed":false},{"l":"","r":"\\frac{125}{2}=62{,}5\\ \\text{m}","note":"Resultado: 62,5 metros recorridos mientras frena","boxed":true}]},
      {"type":"text","v":"3. La respuesta: 62,5 metros, más de medio campo de fútbol"},
      {"type":"text","v":"Y eso es solo frenando. Antes de pisar el freno pasa aproximadamente 1 segundo (lo que tardas en ver el peligro y mover el pie): a 25 m/s son otros 25 metros sin frenar. En total, unos 87,5 metros. ¿Y a otras velocidades? Repitiendo la integral con v(t) = v₀ − 5t, que dura v₀/5 segundos, sale siempre d = v₀²/10."},
      {"type":"deriv","rows":[{"l":"d","r":"\\int_{0}^{v_{0}/5}\\left(v_{0}-5t\\right)dt=\\frac{v_{0}^{2}}{2\\cdot 5}=\\frac{v_{0}^{2}}{10}","note":"Fórmula general: la distancia de frenado crece con el CUADRADO de la velocidad","boxed":true},{"l":"d_{50}","r":"\\frac{13{,}89^{2}}{10}\\approx 19{,}3\\ \\text{m}","note":"50 km/h ≈ 13,89 m/s (velocidad en ciudad)","boxed":false},{"l":"d_{120}","r":"\\frac{33{,}33^{2}}{10}\\approx 111{,}1\\ \\text{m}","note":"120 km/h ≈ 33,33 m/s: solo un 33 % más rápido que 90, pero frena en un 78 % más de distancia (1,33² ≈ 1,78)","boxed":false}]},
      {"type":"table","head":["Velocidad","Reacción (1 s)","Frenada","Total"],"rows":[["50 km/h","13,9 m","19,3 m","33,2 m"],["90 km/h","25,0 m","62,5 m","87,5 m"],["120 km/h","33,3 m","111,1 m","144,4 m"]],"kind":"values","lastBold":true,"caption":"Distancia hasta pararse (deceleración de 5 m/s²)"},
      {"type":"chart","kind":"bars","title":"Metros hasta pararse del todo","labels":["50 km/h","90 km/h","120 km/h"],"values":[33.2,87.5,144.4],"valueLabels":["33,2 m","87,5 m","144,4 m"],"hi":[2],"ylabel":"metros"},
      {"type":"text","v":"4. ¿Y en la vida real?"},
      {"type":"text","v":"Con asfalto seco y buenos neumáticos un turismo puede frenar algo más fuerte (cerca de 7-8 m/s²), y con lluvia, ruedas gastadas o un coche cargado, bastante menos. El tiempo de reacción también cambia: mirar el móvil un par de segundos a 90 km/h son unos 50 metros a ciegas. La lección de la integral es clara: si duplicas la velocidad, necesitas cuatro veces más metros para frenar. Por eso los límites de velocidad y la distancia de seguridad salvan vidas."},
      {"type":"text","v":"Ahora tú: 1) Calcula con Operaciones ▸ Integral paso a paso la frenada en asfalto seco desde 90 km/h, con v(t) = 25 − 8t (se para en t = 25/8 = 3,125 s): la integral de 0 a 3,125 de (25 − 8t) dt. ¿Cuántos metros te ahorras? 2) Repite la tabla para 30 km/h (zona escolar): ¿cuántos metros necesitas en total?"},
    ], strokes: [] },
    ],
  },
});
