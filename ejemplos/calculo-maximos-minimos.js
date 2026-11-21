/* Banco de ejemplos · calculo (bloques generados con el motor de la app: engine/ops). */
MatIA.ejemplo({
  id: "calculo-maximos-minimos",
  tema: "calculo",
  titulo: "Máximos y mínimos de una función",
  resumen: "Busca los puntos críticos con f′(x) = 0, los clasifica con f″ y marca el máximo, el mínimo y la inflexión en la gráfica.",
  board: {
    title: "Máximos y mínimos de una función",
    pages: [
    { blocks: [
      {"type":"text","v":"Los máximos y mínimos relativos están donde la derivada se anula (tangente horizontal). La segunda derivada nos dice cuál es cuál: f″ < 0 es un máximo (∩) y f″ > 0 es un mínimo (∪). Prueba a cambiar la función, por ejemplo f(x) = x³ − 3x, y aplica Operaciones ▸ «Máximos y mínimos de f(x)»."},
      {"type":"math","v":"f(x)=x^3-3x^2-9x+5"},
      { type: 'deriv', rows: [
        {"l":"f(x)","r":"x^{3}-3x^{2}-9x+5","note":"Función","boxed":false},
        {"l":"f'(x)","r":"3x^{2}-6x-9","note":"Derivamos","boxed":false},
        {"l":"3x^{2}-6x-9","r":"0","note":"Puntos críticos: anulamos la derivada","boxed":false},
        {"l":"x","r":"-1,\\quad 3","note":"2 puntos críticos","boxed":false},
        {"l":"f''(x)","r":"6x-6","note":"Segunda derivada para clasificarlos","boxed":false},
        {"l":"f''\\left(-1\\right)","r":"-12<0","note":"Máximo relativo en (−1, 10)","boxed":false},
        {"l":"f''\\left(3\\right)","r":"12>0","note":"Mínimo relativo en (3, −22)","boxed":false},
        {"l":"f''(x)","r":"0\\Rightarrow x=1","note":"Puntos de inflexión: f″ cambia de signo (cambia la concavidad)","boxed":false},
        {"l":"\\lim_{x\\to\\pm\\infty}f(x)","r":"-\\infty,\\ +\\infty","note":"Comportamiento en ±∞ para decidir los extremos absolutos","boxed":false},
        {"l":"\\text{Absolutos}","r":"\\nexists\\ \\text{máx abs.},\\quad \\nexists\\ \\text{mín abs.}","note":"No tiene máximo absoluto: la función tiende a +∞. No tiene mínimo absoluto: la función tiende a −∞.","boxed":false},
      ] },
      {"type":"table","head":["x","(−∞, −1)","−1","(−1, 3)","3","(3, +∞)"],"rows":[["f′(x)","+","0","−","0","+"],["f(x)","↗ crece","máx","↘ decrece","mín","↗ crece"]],"vbar":1,"kind":"mono","caption":"Crecimiento y decrecimiento de f(x)"},
      {"type":"graph","fns":["f(x)=x^3-3x^2-9x+5"],"xmin":-2.2,"xmax":4.2,"marks":[{"x":-1,"y":10,"kind":"max","label":"máx (−1, 10)"},{"x":3,"y":-22,"kind":"min","label":"mín (3, −22)"},{"x":1,"y":-6,"kind":"infl","label":"infl (1, −6)"}],"align":"center"},
    ], strokes: [] },
    ],
  },
});
