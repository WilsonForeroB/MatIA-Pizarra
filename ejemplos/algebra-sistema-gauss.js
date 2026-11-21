/* Banco de ejemplos · algebra (bloques generados con el motor de la app: engine/ops). */
MatIA.ejemplo({
  id: "algebra-sistema-gauss",
  tema: "algebra",
  titulo: "Sistema 3×3 por Gauss",
  resumen: "Escalona la matriz ampliada de un sistema 3×3, lo clasifica con el teorema de Rouché-Fröbenius y lo resuelve.",
  board: {
    title: "Sistema 3×3 por Gauss",
    pages: [
    { blocks: [
      {"type":"text","v":"Resolvemos un sistema de tres ecuaciones con tres incógnitas por el método de Gauss: hacemos ceros debajo de la diagonal con operaciones entre filas (Fᵢ) hasta dejar la matriz escalonada, y luego despejamos de abajo arriba. Prueba a cambiar un coeficiente del sistema, coloca el cursor en él y aplica Operaciones ▸ «Gauss paso a paso»."},
      {"type":"math","v":"\\begin{cases}x+y+z=6\\\\ 2x-y+z=3\\\\ x+2y-z=2\\end{cases}"},
      {"type":"math","v":"\\left(\\begin{matrix}1 & 1 & 1\\\\ 2 & -1 & 1\\\\ 1 & 2 & -1\\end{matrix}\\,\\middle|\\,\\begin{matrix}6\\\\ 3\\\\ 2\\end{matrix}\\right)","result":true},
      {"type":"math","v":"\\xrightarrow[F_{3}-F_{1}]{F_{2}-2F_{1}}\\left(\\begin{matrix}1 & 1 & 1\\\\ 0 & -3 & -1\\\\ 0 & 1 & -2\\end{matrix}\\,\\middle|\\,\\begin{matrix}6\\\\ -9\\\\ -4\\end{matrix}\\right)","result":true},
      {"type":"math","v":"\\xrightarrow{F_{2}\\leftrightarrow F_{3}}\\left(\\begin{matrix}1 & 1 & 1\\\\ 0 & 1 & -2\\\\ 0 & -3 & -1\\end{matrix}\\,\\middle|\\,\\begin{matrix}6\\\\ -4\\\\ -9\\end{matrix}\\right)","result":true},
      {"type":"math","v":"\\xrightarrow{F_{3}+3F_{2}}\\left(\\begin{matrix}1 & 1 & 1\\\\ 0 & 1 & -2\\\\ 0 & 0 & -7\\end{matrix}\\,\\middle|\\,\\begin{matrix}6\\\\ -4\\\\ -21\\end{matrix}\\right)","result":true},
      {"type":"math","v":"\\operatorname{rg}(A)=\\operatorname{rg}(A|b)=3=\\text{ n.º de incógnitas}\\Rightarrow\\text{Compatible determinado}","result":true},
      {"type":"math","v":"x=1,\\quad y=2,\\quad z=3","result":true},
      {"type":"text","v":"Comprobación en la primera ecuación: 1 + 2 + 3 = 6 ✔. Reto: cambia la tercera ecuación por la suma de las dos primeras, 3x + 2z = 9, y vuelve a aplicar Gauss. ¿Qué fila se anula? ¿Cuántas soluciones tiene ahora el sistema?"},
    ], strokes: [] },
    ],
  },
});
