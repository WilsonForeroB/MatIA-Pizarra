/* Banco de ejemplos · calculo (los cálculos los genera el motor de la app: engine/ops). */
MatIA.ejemplo({
  id: "calculo-pizza-polares",
  tema: "calculo",
  titulo: "¿Por qué una pizza grande sale más a cuenta?",
  resumen: "Con coordenadas polares y su jacobiano calculamos el área de una pizza y descubrimos que una familiar de 30 cm tiene más que dos medianas de 20 cm.",
  board: {
    title: "¿Por qué una pizza grande sale más a cuenta?",
    pages: [
    { blocks: [
      {"type":"text","v":"En una pizzería, la pizza mediana mide 20 cm de diámetro y cuesta 8 €; la familiar mide 30 cm y cuesta 14 €. Sois dos con hambre: ¿pedís dos medianas (16 €) o una familiar? A ojo, 30 cm parece menos que 20 + 20 = 40 cm, pero lo que se come es el área, no el diámetro. Para calcular el área de algo redondo, lo natural es medir con coordenadas polares: distancia al centro r y ángulo θ."},
      {"type":"text","v":"1. Planteamiento: ¿cuánto mide un trocito de pizza en polares?"},
      {"type":"text","v":"Cortamos la pizza como una diana: en anillos (r) y en porciones (θ). Para saber cuánta área tiene cada trocito usamos la matriz jacobiana del cambio a polares (Operaciones ▸ Cálculo vectorial ▸ Matriz jacobiana)."},
      {"type":"math","v":"x=r\\cos\\theta,\\ y=r\\sin\\theta"},
      {"type":"deriv","rows":[{"l":"\\left(x,y\\right)","r":"\\left(r\\cos \\theta,\\ r\\sin \\theta\\right)","note":"Cambio de variables: 2 ecuaciones y 2 variables nuevas (r, θ)","boxed":false},{"l":"\\frac{\\partial x}{\\partial r}","r":"\\cos \\theta,\\quad \\frac{\\partial x}{\\partial \\theta }=-r\\sin \\theta","note":"Fila 1: derivadas de x respecto de r, θ","boxed":false},{"l":"\\frac{\\partial y}{\\partial r}","r":"\\sin \\theta,\\quad \\frac{\\partial y}{\\partial \\theta }=r\\cos \\theta","note":"Fila 2: derivadas de y respecto de r, θ","boxed":false},{"l":"\\frac{\\partial(x,y)}{\\partial(r,\\theta)}","r":"\\begin{pmatrix}\\cos \\theta & -r\\sin \\theta\\\\ \\sin \\theta & r\\cos \\theta\\end{pmatrix}","note":"Matriz jacobiana: la fila i contiene las derivadas parciales de la componente i","boxed":false},{"l":"\\left|\\frac{\\partial(x,y)}{\\partial(r,\\theta)}\\right|","r":"\\begin{vmatrix}\\cos \\theta & -r\\sin \\theta\\\\ \\sin \\theta & r\\cos \\theta\\end{vmatrix}=\\cos \\theta\\cdot r\\cos \\theta-\\left(-r\\sin \\theta\\right)\\sin \\theta","note":"Determinante 2×2: ad − bc","boxed":false},{"l":"","r":"r\\cos^{2} \\theta+r\\sin^{2} \\theta","note":"Simplificamos","boxed":false},{"l":"","r":"r","note":"Usando sen²θ + cos²θ = 1 (identidad pitagórica)","boxed":false},{"l":"|J|","r":"r","note":"Por eso dA = dx dy = r dr dθ al pasar a polares","boxed":true}]},
      {"type":"text","v":"2. Sumamos todos los trocitos (Operaciones ▸ Integral paso a paso)"},
      {"type":"deriv","rows":[{"l":"A","r":"\\int_{0}^{2\\pi}\\int_{0}^{R}r\\,dr\\,d\\theta","note":"Cada trocito mide dA = r dr dθ: los de fuera (r grande) son más grandes que los del centro","boxed":false},{"l":"A","r":"2\\pi\\int_{0}^{R}r\\,dr","note":"Nada depende de θ: la integral en θ solo multiplica por la vuelta completa, 2π","boxed":false}]},
      {"type":"math","v":"\\int_0^{15}r\\,dr"},
      {"type":"deriv","rows":[{"l":"\\int_{0}^{15} r\\,dr","r":"\\left[\\frac{r^{2}}{2}\\right]_{0}^{15}","note":"Primitiva F(r) = r²/2 (regla de la potencia). Luego, regla de Barrow","boxed":false},{"l":"","r":"\\frac{225}{2}-0","note":"F(15) − F(0)","boxed":false},{"l":"","r":"\\frac{225}{2}","note":"Resultado de la integral de dentro (la de r)","boxed":true}]},
      {"type":"deriv","rows":[{"l":"A_{30}","r":"2\\pi\\cdot \\frac{225}{2}=225\\pi\\approx 706{,}9\\ \\text{cm}^{2}","note":"Pizza familiar: radio R = 15 cm","boxed":false},{"l":"A_{20}","r":"2\\pi\\int_{0}^{10}r\\,dr=2\\pi\\cdot 50=100\\pi\\approx 314{,}2\\ \\text{cm}^{2}","note":"Pizza mediana: radio R = 10 cm","boxed":false},{"l":"A","r":"\\pi R^{2}","note":"En general sale la fórmula de siempre: el área crece con el CUADRADO del radio","boxed":true}]},
      {"type":"text","v":"3. La respuesta"},
      {"type":"table","head":["Pedido","Área","Precio","Céntimos por cm²"],"rows":[["2 medianas (20 cm)","628,3 cm²","16 €","2,55"],["1 familiar (30 cm)","706,9 cm²","14 €","1,98"]],"kind":"values","caption":"Una familiar tiene más pizza que dos medianas y cuesta menos"},
      {"type":"deriv","rows":[{"l":"\\frac{A_{30}}{A_{20}}","r":"\\frac{225\\pi}{100\\pi}=\\left(\\frac{15}{10}\\right)^{2}=2{,}25","note":"Una familiar equivale a dos medianas y cuarto, aunque el diámetro solo sea 1,5 veces mayor","boxed":true}]},
      {"type":"text","v":"Moraleja: con una familiar coméis un 12,5 % más de pizza y pagáis 2 € menos. El cálculo vale para todo lo redondo: un aspersor que riega el doble de lejos cubre cuatro veces más césped, y una tarta de 26 cm tiene un 69 % más que una de 20 cm."},
      {"type":"text","v":"4. ¿Y en la vida real?"},
      {"type":"text","v":"No toda el área es igual de rica: el borde de unos 2 cm casi no lleva ingredientes. En la mediana el borde es un 36 % de la pizza; en la familiar, solo un 25 %. Así que, en cuanto a relleno, la familiar gana todavía más. Eso sí: si sobra media pizza, no has ahorrado nada."},
      {"type":"text","v":"Ahora tú: 1) Calcula el área del borde de la familiar con Operaciones ▸ Integral paso a paso: escribe ∫ de 13 a 15 de r dr y multiplica por 2π. ¿Sale 56π ≈ 176 cm²? 2) Una pizza gigante de 40 cm cuesta 24 €: ¿sale más a cuenta que la familiar? Compara los céntimos por cm²."},
    ], strokes: [] },
    ],
  },
});
