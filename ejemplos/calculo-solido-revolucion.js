/* Banco de ejemplos · calculo (bloques generados con el motor de la app: engine/ops). */
MatIA.ejemplo({
  id: "calculo-solido-revolucion",
  tema: "calculo",
  titulo: "Volumen de un sólido de revolución",
  resumen: "Gira la curva y = √x alrededor del eje X y calcula el volumen del sólido con el método de los discos.",
  board: {
    title: "Volumen de un sólido de revolución",
    pages: [
    { blocks: [
      {"type":"text","v":"Al girar la región bajo y = f(x) entre a y b alrededor del eje X se obtiene un sólido. Lo cortamos en discos de radio f(x) y grosor dx: cada uno tiene volumen π·f(x)²·dx, y sumándolos todos sale V = π ∫ₐᵇ f(x)² dx. Arrastra el sólido para girarlo y prueba a cambiar la función, el intervalo o el eje de giro (por ejemplo, el eje Y)."},
      {"type":"solid","fn":"f(x)=\\sqrt{x}","a":0,"b":4,"axis":"x","k":0,"az":-0.8,"el":0.5,"zoom":1,"align":"center"},
      { type: 'deriv', rows: [
        {"l":"V","r":"\\pi\\int_{0}^{4}\\left(\\sqrt{x}\\right)^{2}dx","note":"Método de los discos: V = π ∫ f(x)² dx","boxed":false},
        {"l":"","r":"\\pi\\int_{0}^{4}x\\,dx","note":"(√x)² = x","boxed":false},
        {"l":"","r":"\\pi\\left[\\frac{x^{2}}{2}\\right]_{0}^{4}","note":"Primitiva de x: x²/2","boxed":false},
        {"l":"","r":"\\pi\\left(\\frac{16}{2}-0\\right)","note":"Regla de Barrow","boxed":false},
        {"l":"","r":"8\\pi\\approx 25{,}13","note":"Volumen en unidades cúbicas","boxed":true},
      ] },
      {"type":"text","v":"Curiosidad: este sólido (un paraboloide) tiene justo la mitad del volumen del cilindro que lo envuelve, π·2²·4 = 16π."},
    ], strokes: [] },
    ],
  },
});
