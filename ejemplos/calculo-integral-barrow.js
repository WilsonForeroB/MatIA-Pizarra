/* Banco de ejemplos · calculo (bloques generados con el motor de la app: engine/ops). */
MatIA.ejemplo({
  id: "calculo-integral-barrow",
  tema: "calculo",
  titulo: "Integral definida con Barrow",
  resumen: "Calcula integrales definidas con la regla de Barrow: primitiva, F(b) − F(a) y su significado como área.",
  board: {
    title: "Integral definida con Barrow",
    pages: [
    { blocks: [
      {"type":"text","v":"Regla de Barrow: si F es una primitiva de f, entonces ∫ₐᵇ f(x) dx = F(b) − F(a). La constante C no hace falta porque se cancela al restar. Si f ≥ 0 en [a, b], el resultado es el área entre la gráfica y el eje X. Prueba a cambiar los límites de integración y aplica Operaciones ▸ «Integral paso a paso»."},
      { type: 'deriv', rows: [
        {"l":"\\int_{0}^{2}\\left(3x^2-2x+1\\right)dx","r":"\\left[x^{3}-x^{2}+x\\right]_{0}^{2}","note":"Primitiva: F(x) = x³ − x² + x (regla de la potencia)","boxed":false},
        {"l":"","r":"\\left(2^{3}-2^{2}+2\\right)-\\left(0^{3}-0^{2}+0\\right)","note":"Regla de Barrow: F(2) − F(0)","boxed":false},
        {"l":"","r":"6-0","note":"Operamos","boxed":false},
        {"l":"","r":"6","note":"Resultado","boxed":true},
      ] },
      {"type":"graph","fns":["f(x)=3x^2-2x+1"],"xmin":-0.5,"xmax":2.5,"ymin":-1,"ymax":10,"align":"center"},
      {"type":"text","v":"Ahora una función trigonométrica: el área bajo un arco de la función seno."},
      { type: 'deriv', rows: [
        {"l":"\\int_{0}^{\\pi}\\sin x\\,dx","r":"\\left[-\\cos x\\right]_{0}^{\\pi}","note":"Primitiva: F(x) = −cos x","boxed":false},
        {"l":"","r":"\\left(-\\cos\\pi\\right)-\\left(-\\cos 0\\right)","note":"Regla de Barrow: F(π) − F(0)","boxed":false},
        {"l":"","r":"1-(-1)","note":"cos π = −1 y cos 0 = 1","boxed":false},
        {"l":"","r":"2","note":"Resultado: el arco encierra un área de 2 u²","boxed":true},
      ] },
      {"type":"graph","fns":["f(x)=\\sin(x)"],"xmin":-0.5,"xmax":3.7,"ymin":-0.5,"ymax":1.5,"align":"center"},
      {"type":"text","v":"¿Qué crees que saldrá si integras sin x entre 0 y 2π? Calcúlalo y piensa por qué ese número no es el área encerrada."},
    ], strokes: [] },
    ],
  },
});
