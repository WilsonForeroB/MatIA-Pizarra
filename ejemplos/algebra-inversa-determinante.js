/* Banco de ejemplos · algebra (bloques generados con el motor de la app: engine/ops). */
MatIA.ejemplo({
  id: "algebra-inversa-determinante",
  tema: "algebra",
  titulo: "Determinante y matriz inversa",
  resumen: "Calcula un determinante 3×3 con la regla de Sarrus y la inversa de la matriz por Gauss-Jordan sobre (A | I).",
  board: {
    title: "Determinante y matriz inversa",
    pages: [
    { blocks: [
      {"type":"text","v":"Una matriz cuadrada tiene inversa si y solo si su determinante no es cero. Primero calculamos |A| con la regla de Sarrus y después obtenemos A⁻¹ aplicando Gauss-Jordan a (A | I): lo que convierte A en la identidad convierte I en A⁻¹. Prueba a cambiar el 0 de la esquina por otro número y repite las operaciones «Determinante: 2×2 y Sarrus» e «Inversa paso a paso»."},
      {"type":"math","v":"A=\\begin{pmatrix}1 & 2 & 3\\\\ 0 & 1 & 4\\\\ 5 & 6 & 0\\end{pmatrix}"},
      { type: 'deriv', rows: [
        {"l":"\\begin{vmatrix}1 & 2 & 3\\\\ 0 & 1 & 4\\\\ 5 & 6 & 0\\end{vmatrix}","r":"1\\cdot 1\\cdot 0+2\\cdot 4\\cdot 5+3\\cdot 0\\cdot 6-\\left(3\\cdot 1\\cdot 5+1\\cdot 4\\cdot 6+2\\cdot 0\\cdot 0\\right)","note":"Regla de Sarrus: diagonales hacia la derecha menos diagonales hacia la izquierda","boxed":false},
        {"l":"","r":"\\left(0+40+0\\right)-\\left(15+24+0\\right)","note":"Multiplicamos","boxed":false},
        {"l":"","r":"40-39","note":"Sumamos cada paréntesis","boxed":false},
        {"l":"","r":"1","note":"","boxed":true},
      ] },
      {"type":"text","v":"Como |A| = 1 ≠ 0, la matriz es invertible."},
      {"type":"math","v":"(A\\,|\\,I)=\\left(\\begin{matrix}1 & 2 & 3\\\\ 0 & 1 & 4\\\\ 5 & 6 & 0\\end{matrix}\\,\\middle|\\,\\begin{matrix}1 & 0 & 0\\\\ 0 & 1 & 0\\\\ 0 & 0 & 1\\end{matrix}\\right)","result":true},
      {"type":"math","v":"\\xrightarrow{F_{3}-5F_{1}}\\left(\\begin{matrix}1 & 2 & 3\\\\ 0 & 1 & 4\\\\ 0 & -4 & -15\\end{matrix}\\,\\middle|\\,\\begin{matrix}1 & 0 & 0\\\\ 0 & 1 & 0\\\\ -5 & 0 & 1\\end{matrix}\\right)","result":true},
      {"type":"math","v":"\\xrightarrow[F_{3}+4F_{2}]{F_{1}-2F_{2}}\\left(\\begin{matrix}1 & 0 & -5\\\\ 0 & 1 & 4\\\\ 0 & 0 & 1\\end{matrix}\\,\\middle|\\,\\begin{matrix}1 & -2 & 0\\\\ 0 & 1 & 0\\\\ -5 & 4 & 1\\end{matrix}\\right)","result":true},
      {"type":"math","v":"\\xrightarrow[F_{2}-4F_{3}]{F_{1}+5F_{3}}\\left(\\begin{matrix}1 & 0 & 0\\\\ 0 & 1 & 0\\\\ 0 & 0 & 1\\end{matrix}\\,\\middle|\\,\\begin{matrix}-24 & 18 & 5\\\\ 20 & -15 & -4\\\\ -5 & 4 & 1\\end{matrix}\\right)","result":true},
      {"type":"math","v":"A^{-1}=\\begin{pmatrix}-24 & 18 & 5\\\\ 20 & -15 & -4\\\\ -5 & 4 & 1\\end{pmatrix}","result":true},
      {"type":"text","v":"Para comprobarlo, multiplica A·A⁻¹ con Operaciones ▸ «Producto desarrollado»: debe salir la matriz identidad."},
    ], strokes: [] },
    ],
  },
});
