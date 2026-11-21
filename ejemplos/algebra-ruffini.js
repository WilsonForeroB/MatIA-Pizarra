/* Banco de ejemplos · algebra (bloques generados con el motor de la app: engine/ops). */
MatIA.ejemplo({
  id: "algebra-ruffini",
  tema: "algebra",
  titulo: "Ruffini y teorema del resto",
  resumen: "Divide polinomios entre x − a con la regla de Ruffini, comprueba el teorema del resto y factoriza un polinomio.",
  board: {
    title: "Ruffini y teorema del resto",
    pages: [
    { blocks: [
      {"type":"text","v":"La regla de Ruffini divide un polinomio entre (x − a) usando solo sus coeficientes: bajamos el primero, multiplicamos por a, sumamos y repetimos. Teorema del resto: el resto de P(x) : (x − a) es P(a). Prueba a cambiar el divisor y vuelve a aplicar Operaciones ▸ «Dividir: Ruffini o división larga»."},
      {"type":"math","v":"\\left(2x^3-3x+4\\right):\\left(x+1\\right)"},
      {"type":"table","caption":"Ruffini: (2x^3-3x+4) : (x + 1)","rows":[["","2","0","-3","4"],["-1","","-2","2","1"],["","2","-2","-1","5"]],"vbar":1,"hline":2,"mark":[2,4],"kind":"ruffini"},
      { type: 'deriv', rows: [
        {"l":"C(x)","r":"2x^{2}-2x-1","note":"Cociente","boxed":true},
        {"l":"R(x)","r":"5","note":"Resto","boxed":true},
        {"l":"2x^{3}-3x+4","r":"\\left(x+1\\right)\\left(2x^{2}-2x-1\\right)+5","note":"Comprobación: D = d·C + R","boxed":false},
      ] },
      {"type":"math","v":"P(-1)=2(-1)^3-3(-1)+4=-2+3+4=5","note":"Teorema del resto: coincide con el resto de la división"},
      {"type":"text","v":"Si el resto es 0, (x − a) es un factor y a es una raíz. Así se factoriza un polinomio: probamos con los divisores del término independiente (±1, ±2, ±3, ±6)."},
      {"type":"math","v":"x^3-2x^2-5x+6"},
      {"type":"table","caption":"Ruffini con las raíces enteras/racionales (divisores del término independiente)","rows":[["","1","-2","-5","6"],["-2","","-2","8","-6"],["","1","-4","3","0"],["1","","1","-3"],["","1","-3","0"],["3","","3"],["","1","0"]],"vbar":1,"hlines":[2,4,6],"kind":"ruffini"},
      {"type":"math","v":"x^{3}-2x^{2}-5x+6=\\left(x+2\\right)\\left(x-1\\right)\\left(x-3\\right)","result":true},
      {"type":"math","v":"\\text{Raíces: }x=-2,\\quad x=1,\\quad x=3","result":true},
      {"type":"graph","fns":["f(x)=x^3-2x^2-5x+6"],"xmin":-3.5,"xmax":4.5,"ymin":-12,"ymax":12,"align":"center"},
      {"type":"text","v":"Fíjate: la gráfica corta al eje X justo en las raíces −2, 1 y 3."},
    ], strokes: [] },
    ],
  },
});
