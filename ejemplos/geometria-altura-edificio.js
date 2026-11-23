/* Banco de ejemplos · geometria (los cálculos los genera el motor de la app: engine/ops). */
MatIA.ejemplo({
  id: "geometria-altura-edificio",
  tema: "geometria",
  titulo: "¿Cuánto mide ese edificio sin subir?",
  resumen: "Con dos medidas de ángulo desde el móvil y un triángulo resuelto por los teoremas del seno y del coseno calculamos la altura de un edificio sin tocarlo.",
  board: {
    title: "¿Cuánto mide ese edificio sin subir?",
    pages: [
    { blocks: [
      {"type":"text","v":"Quieres saber cuánto mide el edificio de enfrente, o el árbol del parque, pero no puedes subir con una cinta métrica. Los arquitectos antiguos ya lo resolvían con triángulos, y hoy basta el móvil: casi todos tienen una app de «clinómetro» que mide el ángulo con el que miras hacia arriba (el ángulo de elevación). Un solo ángulo no basta, porque no sabes lo lejos que estás de la base; pero con dos medidas desde dos puntos sí. ¿Cuánto mide el edificio?"},
      {"type":"text","v":"1. Planteamiento: dos medidas, un triángulo"},
      {"type":"deriv","rows":[{"l":"\\text{Punto A}","r":"\\text{elevación }30^{\\circ}","note":"Primera medida, desde un punto lejano. Apuntas el móvil a la azotea y lees 30°","boxed":false},{"l":"\\text{Avanzas}","r":"40\\ \\text{m}","note":"Caminas 40 m hacia el edificio, en línea recta (los puedes contar con la app de pasos o medir con una cinta)","boxed":false},{"l":"\\text{Punto B}","r":"\\text{elevación }45^{\\circ}","note":"Segunda medida, más cerca. Ahora lees 45°","boxed":false},{"l":"\\text{Triángulo }ABC","r":"\\hat{A}=30^{\\circ},\\ \\hat{B}=180^{\\circ}-45^{\\circ}=135^{\\circ},\\ c=40","note":"C es la azotea. El ángulo del triángulo en B es el suplementario del de elevación, porque el suelo continúa hacia A","boxed":true}]},
      {"type":"text","v":"2. Resolvemos el triángulo (Operaciones ▸ Resolver triángulo)"},
      {"type":"math","v":"c=40,\\ A=30^{\\circ},\\ B=135^{\\circ}"},
      {"type":"deriv","rows":[{"l":"\\text{Datos}","r":"c=40,\\ \\hat{A}=30^{\\circ},\\ \\hat{B}=135^{\\circ}","note":"Cada lado es opuesto al ángulo de su misma letra","boxed":false},{"l":"\\text{Caso}","r":"\\text{un lado y dos ángulos}","note":"Primero el tercer ángulo y después el teorema del seno","boxed":false},{"l":"\\hat{C}","r":"180^{\\circ}-30^{\\circ}-135^{\\circ}=15^{\\circ}","note":"Los ángulos suman 180°","boxed":false},{"l":"\\frac{c}{\\operatorname{sen}\\hat{C}}","r":"\\frac{40}{\\operatorname{sen}15^{\\circ}}\\approx 154{,}5481","note":"Teorema del seno: esta razón es la misma para los tres lados (= 2R, diámetro de la circunferencia circunscrita)","boxed":false},{"l":"a","r":"\\frac{c\\cdot\\operatorname{sen}\\hat{A}}{\\operatorname{sen}\\hat{C}}\\approx 154{,}5481\\cdot\\operatorname{sen}30^{\\circ}\\approx 77{,}2741","note":"Lado a: distancia de B a la azotea","boxed":false},{"l":"b","r":"\\frac{c\\cdot\\operatorname{sen}\\hat{B}}{\\operatorname{sen}\\hat{C}}\\approx 154{,}5481\\cdot\\operatorname{sen}135^{\\circ}\\approx 109{,}282","note":"Lado b: distancia de A a la azotea","boxed":false},{"l":"\\text{Lados}","r":"a\\approx 77{,}27,\\ b\\approx 109{,}28,\\ c=40","note":"Metros. Los ángulos son 30°, 135° y 15°: el triángulo es obtusángulo","boxed":true}]},
      {"type":"geo","kind":"tri","a":77.27406610312545,"b":109.2820323027551,"c":40,"A":30,"B":135,"C":15,"label":"Triángulo A (punto lejano) – B (punto cercano) – C (azotea)"},
      {"type":"text","v":"El motor nos da el lado b ≈ 109,28 m: es la distancia en línea recta desde A hasta la azotea C. Ahora ya podemos calcular la altura, que es el cateto vertical del triángulo rectángulo que forma la línea de visión desde A con el suelo."},
      {"type":"deriv","rows":[{"l":"h","r":"b\\cdot \\operatorname{sen}30^{\\circ}=109{,}28\\cdot 0{,}5\\approx 54{,}64\\ \\text{m}","note":"Altura de la azotea sobre tus ojos: el cateto opuesto al ángulo de 30°","boxed":false},{"l":"d_{B}","r":"\\frac{h}{\\tan 45^{\\circ}}=\\frac{54{,}64}{1}=54{,}64\\ \\text{m}","note":"Comprobación: desde B, a 54,64 m de la base, ves la azotea a 45° (tan 45° = 1)","boxed":false},{"l":"d_{A}","r":"\\frac{h}{\\tan 30^{\\circ}}=\\frac{54{,}64}{0{,}5774}\\approx 94{,}64\\ \\text{m}","note":"Comprobación: desde A estás 40 m más lejos que desde B: 54,64 + 40 = 94,64","boxed":true}]},
      {"type":"text","v":"3. La respuesta"},
      {"type":"deriv","rows":[{"l":"H","r":"54{,}64+1{,}6\\approx 56{,}2\\ \\text{m}","note":"Hay que sumar la altura de tus ojos (unos 1,6 m), porque los ángulos se miden desde ahí, no desde el suelo","boxed":true}]},
      {"type":"text","v":"El edificio mide unos 56 m, es decir, unas 18 plantas (a unos 3 m por planta). La fórmula resumida es h = c / (1/tan A − 1/tan B′), donde B′ es el ángulo de elevación desde el punto cercano: 40 / (1/tan 30° − 1/tan 45°) = 40 / (√3 − 1) = 20(√3 + 1) ≈ 54,64 m."},
      {"type":"text","v":"4. ¿Y en la vida real?"},
      {"type":"text","v":"Medir ángulos con el móvil no es perfecto: un error de solo 1° en la segunda medida (46° en vez de 45°) cambia la altura a 52,2 m, unos 2,5 m menos. Por eso los topógrafos usan teodolitos de precisión y repiten las medidas. Aun así, para un árbol o un edificio sale una estimación sorprendentemente buena."},
      {"type":"text","v":"Ahora tú: 1) Mide con tu móvil un árbol o un poste: elige dos puntos separados unos 10 m, escribe los ángulos y usa Operaciones ▸ Resolver triángulo con c = 10, A = tu primer ángulo y B = 180° − tu segundo ángulo. 2) Con la sombra: un palo de 1 m proyecta una sombra de 0,8 m, y la sombra de un árbol mide 12 m. Por semejanza de triángulos, su altura es 12 : 0,8 = 15 m. ¿Qué ángulo tienen los rayos del sol? (arctan(1/0,8) ≈ 51,3°)"},
    ], strokes: [] },
    ],
  },
});
