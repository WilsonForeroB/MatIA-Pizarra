/* Banco de ejemplos · algebra (los cálculos los genera el motor de la app: engine/ops). */
MatIA.ejemplo({
  id: "algebra-mezcla-cafe",
  tema: "algebra",
  titulo: "¿Cómo mezclar tres cafés a buen precio?",
  resumen: "Un sistema 3×3 resuelto por Gauss decide cuántos kilos de tres cafés mezclar para cumplir precio, intensidad y cantidad a la vez.",
  board: {
    title: "¿Cómo mezclar tres cafés a buen precio?",
    pages: [
    { blocks: [
      {"type":"text","v":"Una tostadora artesanal quiere preparar 100 kg de una mezcla de tres cafés (lo que en el oficio llaman un «blend»): uno suave de Colombia, uno de Brasil y un robusta de Vietnam, más fuerte y más barato. Quiere que la mezcla le salga a 6,80 € el kilo de media y que tenga una intensidad media de 6 sobre 10. Hay infinitas formas de mezclar tres cafés; veremos que solo una cumple las tres condiciones a la vez. ¿Cuántos kilos de cada uno hay que poner? Es un sistema de tres ecuaciones con tres incógnitas: Gauss lo resuelve."},
      {"type":"text","v":"1. Planteamiento: tres cafés, tres condiciones"},
      {"type":"table","head":["Café","Precio (€/kg)","Intensidad (0-10)","Kilos"],"rows":[["Colombia (suave)","10","4","x"],["Brasil (equilibrado)","6","6","y"],["Robusta de Vietnam","4","9","z"]],"kind":"mono","caption":"Precios e intensidades inventados pero verosímiles"},
      {"type":"deriv","rows":[{"l":"x+y+z","r":"100","note":"Condición 1: los kilos de los tres cafés suman los 100 kg de mezcla","boxed":false},{"l":"10x+6y+4z","r":"680","note":"Condición 2: coste total = 100 kg × 6,80 €/kg = 680 €. Cada café aporta (precio × kilos)","boxed":false},{"l":"4x+6y+9z","r":"600","note":"Condición 3: suponemos que la intensidad de la mezcla es la media ponderada por los kilos. Media 6 con 100 kg: 100 × 6 = 600 «puntos de intensidad»","boxed":true}]},
      {"type":"text","v":"2. Resolvemos con Gauss (Operaciones ▸ Gauss paso a paso, con el cursor en el sistema)"},
      {"type":"math","v":"\\begin{cases}x+y+z=100\\\\10x+6y+4z=680\\\\4x+6y+9z=600\\end{cases}"},
      {"type":"math","v":"\\left(\\begin{matrix}1 & 1 & 1\\\\ 10 & 6 & 4\\\\ 4 & 6 & 9\\end{matrix}\\,\\middle|\\,\\begin{matrix}100\\\\ 680\\\\ 600\\end{matrix}\\right)","result":true},
      {"type":"math","v":"\\xrightarrow[F_{3}-4F_{1}]{F_{2}-10F_{1}}\\left(\\begin{matrix}1 & 1 & 1\\\\ 0 & -4 & -6\\\\ 0 & 2 & 5\\end{matrix}\\,\\middle|\\,\\begin{matrix}100\\\\ -320\\\\ 200\\end{matrix}\\right)","result":true},
      {"type":"math","v":"\\xrightarrow{2F_{3}+F_{2}}\\left(\\begin{matrix}1 & 1 & 1\\\\ 0 & -4 & -6\\\\ 0 & 0 & 4\\end{matrix}\\,\\middle|\\,\\begin{matrix}100\\\\ -320\\\\ 80\\end{matrix}\\right)","result":true},
      {"type":"math","v":"\\operatorname{rg}(A)=\\operatorname{rg}(A|b)=3=\\text{ n.º de incógnitas}\\Rightarrow\\text{Compatible determinado}","result":true},
      {"type":"math","v":"x=30,\\quad y=50,\\quad z=20","result":true},
      {"type":"text","v":"3. La respuesta, en kilos y en euros"},
      {"type":"deriv","rows":[{"l":"x,\\ y,\\ z","r":"30,\\ 50,\\ 20","note":"Del último paso: 4z = 80, luego z = 20. Subiendo: −4y − 6·20 = −320 da y = 50, y por último x = 100 − 50 − 20 = 30","boxed":false},{"l":"\\text{Coste}","r":"30\\cdot 10+50\\cdot 6+20\\cdot 4=300+300+80=680\\ \\text{€}","note":"Comprobación de la condición 2: 6,80 € el kilo, como queríamos","boxed":false},{"l":"\\text{Intensidad}","r":"\\frac{30\\cdot 4+50\\cdot 6+20\\cdot 9}{100}=\\frac{120+300+180}{100}=6","note":"Comprobación de la condición 3","boxed":true}]},
      {"type":"chart","kind":"bars","title":"Receta de la mezcla (kg de cada 100 kg)","labels":["Colombia","Brasil","Robusta"],"values":[30,50,20],"valueLabels":["30 kg · 300 €","50 kg · 300 €","20 kg · 80 €"],"hi":[],"ylabel":"kg"},
      {"type":"text","v":"Es decir: 30 kg de Colombia, 50 kg de Brasil y 20 kg de robusta. Fíjate: Colombia, el café más caro, pesa solo 30 kg, pero cuesta lo mismo (300 €) que los 50 kg de Brasil; y los 20 kg de robusta apenas suman 80 €."},
      {"type":"text","v":"4. ¿Y en la vida real?"},
      {"type":"text","v":"Los tostadores no solo miran el precio y la intensidad: también la acidez, el cuerpo, el tueste, la disponibilidad de cada lote... Cada propiedad añade una ecuación, y con ellas se usan programas de ordenador que aplican exactamente este método (Gauss) a sistemas enormes. Además, las soluciones tienen que ser positivas: no existen los kilos negativos."},
      {"type":"text","v":"Ahora tú: 1) Cambia 680 por 620 (queremos una mezcla más barata, a 6,20 €/kg) y vuelve a aplicar Gauss: debe salir 7,5 kg, 87,5 kg y 5 kg. 2) Cambia 600 por 800 (intensidad 8) y comprueba qué pasa: sale un valor negativo, así que esa mezcla es imposible con estos tres cafés."},
    ], strokes: [] },
    ],
  },
});
