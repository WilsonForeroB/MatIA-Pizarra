/* Banco de ejemplos · calculo (bloques generados con el motor de la app: engine/ops). */
MatIA.ejemplo({
  id: "calculo-jacobiano-polares",
  tema: "calculo",
  titulo: "Jacobiano del cambio a polares",
  resumen: "Calcula la matriz jacobiana de x = r cos θ, y = r sen θ y su determinante r: de ahí sale dA = r dr dθ.",
  board: {
    title: "Jacobiano del cambio a polares",
    pages: [
    { blocks: [
      {"type":"text","v":"La matriz jacobiana reúne las derivadas parciales de un cambio de variables y su determinante dice cuánto se estira el área. Aquí pasamos de coordenadas polares (r, θ) a cartesianas (x, y). Prueba a cambiarlo por otro cambio lineal, por ejemplo x = u + v, y = u − v, y aplica Operaciones ▸ Cálculo vectorial ▸ «Matriz jacobiana»."},
      {"type":"math","v":"x=r\\cos\\theta,\\ y=r\\sin\\theta"},
      { type: 'deriv', rows: [
        {"l":"\\left(x,y\\right)","r":"\\left(r\\cos \\theta,\\ r\\sin \\theta\\right)","note":"Cambio de variables: 2 ecuaciones y 2 variables nuevas (r, θ)","boxed":false},
        {"l":"\\frac{\\partial x}{\\partial r}","r":"\\cos \\theta,\\quad \\frac{\\partial x}{\\partial \\theta }=-r\\sin \\theta","note":"Fila 1: derivadas de x respecto de r, θ","boxed":false},
        {"l":"\\frac{\\partial y}{\\partial r}","r":"\\sin \\theta,\\quad \\frac{\\partial y}{\\partial \\theta }=r\\cos \\theta","note":"Fila 2: derivadas de y respecto de r, θ","boxed":false},
        {"l":"\\frac{\\partial(x,y)}{\\partial(r,\\theta)}","r":"\\begin{pmatrix}\\cos \\theta & -r\\sin \\theta\\\\ \\sin \\theta & r\\cos \\theta\\end{pmatrix}","note":"Matriz jacobiana: la fila i contiene las derivadas parciales de la componente i","boxed":false},
        {"l":"\\left|\\frac{\\partial(x,y)}{\\partial(r,\\theta)}\\right|","r":"\\begin{vmatrix}\\cos \\theta & -r\\sin \\theta\\\\ \\sin \\theta & r\\cos \\theta\\end{vmatrix}=\\cos \\theta\\cdot r\\cos \\theta-\\left(-r\\sin \\theta\\right)\\sin \\theta","note":"Determinante 2×2: ad − bc","boxed":false},
        {"l":"","r":"r\\cos^{2} \\theta+r\\sin^{2} \\theta","note":"Simplificamos","boxed":false},
        {"l":"","r":"r","note":"Usando sen²θ + cos²θ = 1 (identidad pitagórica)","boxed":false},
        {"l":"|J|","r":"r","note":"Por eso dA = dx dy = r dr dθ al pasar a polares","boxed":true},
      ] },
      {"type":"text","v":"Como |J| = r, un elemento de área en polares es dA = r dr dθ: por eso aparece esa r extra al integrar en coordenadas polares."},
    ], strokes: [] },
    ],
  },
});
