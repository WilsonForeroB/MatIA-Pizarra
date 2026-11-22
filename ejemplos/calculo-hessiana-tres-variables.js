/* Banco de ejemplos · calculo (bloques generados con el motor de la app: engine/ops). */
MatIA.ejemplo({
  id: "calculo-hessiana-tres-variables",
  tema: "calculo",
  titulo: "Hessiana con tres variables",
  resumen: "Matriz hessiana de f(x, y, z), comprobación de que P es punto crítico y clasificación con los menores de Sylvester.",
  board: {
    title: "Hessiana con tres variables",
    pages: [
    { blocks: [
      {"type":"text","v":"Con tres variables la hessiana es una matriz 3×3 de segundas derivadas. En un punto crítico, si todos sus menores principales son positivos (criterio de Sylvester) hay un mínimo relativo. Prueba a cambiar el punto P o la función, por ejemplo cambiando z² por −z², y aplica Operaciones ▸ Cálculo vectorial ▸ «Matriz hessiana»."},
      {"type":"math","v":"f(x,y,z)=x^2+y^2+z^2-xy+2z,\\ P=(0,0,-1)"},
      { type: 'deriv', rows: [
        {"l":"f(x,y,z)","r":"x^{2}+y^{2}+z^{2}-xy+2z","note":"Función de 3 variables","boxed":false},
        {"l":"\\nabla f","r":"\\left(2x-y,\\ 2y-x,\\ 2z+2\\right)","note":"Primeras derivadas parciales (∂f/∂x, ∂f/∂y, ∂f/∂z)","boxed":false},
        {"l":"\\frac{\\partial^2 f}{\\partial x^2}","r":"2","note":"Derivamos ∂f/∂x otra vez respecto de x","boxed":false},
        {"l":"\\frac{\\partial^2 f}{\\partial x\\,\\partial y}","r":"-1","note":"Derivada cruzada (por Schwarz da igual el orden)","boxed":false},
        {"l":"\\frac{\\partial^2 f}{\\partial x\\,\\partial z}","r":"0","note":"Derivada cruzada (por Schwarz da igual el orden)","boxed":false},
        {"l":"\\frac{\\partial^2 f}{\\partial y^2}","r":"2","note":"Derivamos ∂f/∂y otra vez respecto de y","boxed":false},
        {"l":"\\frac{\\partial^2 f}{\\partial y\\,\\partial z}","r":"0","note":"Derivada cruzada (por Schwarz da igual el orden)","boxed":false},
        {"l":"\\frac{\\partial^2 f}{\\partial z^2}","r":"2","note":"Derivamos ∂f/∂z otra vez respecto de z","boxed":false},
        {"l":"H_{f}\\left(x,y,z\\right)","r":"\\begin{pmatrix}2 & -1 & 0\\\\ -1 & 2 & 0\\\\ 0 & 0 & 2\\end{pmatrix}","note":"Matriz hessiana: en la fila i, columna j va la derivada respecto de la variable i y de la j. Es simétrica porque las derivadas cruzadas coinciden (teorema de Schwarz)","boxed":false},
        {"l":"\\nabla f\\left(0,0,-1\\right)","r":"\\left(0,\\ 0,\\ 0\\right)","note":"El gradiente se anula: P es un punto crítico","boxed":false},
        {"l":"H_{f}\\left(0,0,-1\\right)","r":"\\begin{pmatrix}2 & -1 & 0\\\\ -1 & 2 & 0\\\\ 0 & 0 & 2\\end{pmatrix}","note":"Sustituimos P en la hessiana","boxed":false},
        {"l":"\\Delta_{1}","r":"2>0","note":"Menores principales: esquinas superiores izquierdas de H(P), de tamaño 1, 2, 3","boxed":false},
        {"l":"\\Delta_{2}","r":"\\begin{vmatrix}2 & -1\\\\ -1 & 2\\end{vmatrix}=3>0","note":"Menor principal de tamaño 2 (determinante 2×2 de la esquina superior izquierda)","boxed":false},
        {"l":"\\Delta_{3}","r":"\\begin{vmatrix}2 & -1 & 0\\\\ -1 & 2 & 0\\\\ 0 & 0 & 2\\end{vmatrix}=6>0","note":"Menor principal de tamaño 3 (determinante 3×3 de la esquina superior izquierda)","boxed":false},
        {"l":"H_{f}\\left(0,0,-1\\right)","r":"\\text{definida positiva}","note":"Todos los menores principales son positivos (criterio de Sylvester)","boxed":true},
        {"l":"P","r":"\\text{mínimo relativo}","note":"Punto crítico con hessiana definida positiva: f tiene un mínimo relativo en P. f(P) = −1","boxed":true},
      ] },

    ], strokes: [] },
    ],
  },
});
