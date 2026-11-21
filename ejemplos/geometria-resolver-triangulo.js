/* Ejemplo del banco (formato en ejemplos/LEEME.md). Bloques generados con el motor de la app. */
MatIA.ejemplo({
  "id": "geometria-resolver-triangulo",
  "tema": "geometria",
  "titulo": "Resolver un triángulo",
  "resumen": "Teoremas del coseno y del seno para hallar los lados y ángulos que faltan, el área y el perímetro, con el dibujo a escala.",
  "board": {
    "title": "Resolver un triángulo (LAL)",
    "pages": [
      {
        "blocks": [
          {
            "type": "text",
            "v": "Conocemos dos lados y el ángulo que forman. El lado c sale del teorema del coseno y luego los otros dos ángulos. Prueba «Operaciones ▸ Resolver triángulo» con a=5, b=4, c=3 (¿es rectángulo?) o con a=4, b=6, A=30° (caso ambiguo)."
          },
          {
            "type": "math",
            "v": "a=7,\\ b=5,\\ C=60^{\\circ}"
          },
          {
            "type": "deriv",
            "rows": [
              {
                "l": "\\text{Datos}",
                "r": "a=7,\\ b=5,\\ \\hat{C}=60^{\\circ}",
                "note": "Cada lado es opuesto al ángulo de su misma letra",
                "boxed": false
              },
              {
                "l": "\\text{Caso}",
                "r": "\\text{dos lados y el ángulo comprendido (LAL)}",
                "note": "Teorema del coseno para el lado que falta",
                "boxed": false
              },
              {
                "l": "c^{2}",
                "r": "a^{2}+b^{2}-2ab\\cos \\hat{C}=7^{2}+5^{2}-2\\cdot 7\\cdot 5\\cdot\\cos 60^{\\circ}=39",
                "note": "",
                "boxed": false
              },
              {
                "l": "c",
                "r": "\\sqrt{39}\\approx 6.245",
                "note": "",
                "boxed": false
              },
              {
                "l": "\\cos \\hat{A}",
                "r": "\\frac{b^{2}+c^{2}-a^{2}}{2bc}=\\frac{5^{2}+6.245^{2}-7^{2}}{2\\cdot 5\\cdot 6.245}=0.2402",
                "note": "Teorema del coseno despejando el ángulo",
                "boxed": false
              },
              {
                "l": "\\hat{A}",
                "r": "\\arccos\\left(0.2402\\right)\\approx 76.1^{\\circ}",
                "note": "",
                "boxed": false
              },
              {
                "l": "\\hat{B}",
                "r": "180^{\\circ}-60^{\\circ}-76.1^{\\circ}\\approx 43.9^{\\circ}",
                "note": "Los ángulos suman 180°",
                "boxed": false
              },
              {
                "l": "\\text{Solución}",
                "r": "a\\approx 7,\\ b\\approx 5,\\ c\\approx 6.245,\\ \\hat{A}\\approx 76.1^{\\circ},\\ \\hat{B}\\approx 43.9^{\\circ},\\ \\hat{C}\\approx 60^{\\circ}",
                "note": "Triángulo escaleno y acutángulo",
                "boxed": true
              },
              {
                "l": "S",
                "r": "\\frac{1}{2}\\,bc\\,\\operatorname{sen}\\hat{A}=\\frac{1}{2}\\cdot 5\\cdot 6.245\\cdot\\operatorname{sen}76.1^{\\circ}\\approx 15.1554",
                "note": "Área (también con Herón: √(s(s−a)(s−b)(s−c)))",
                "boxed": false
              },
              {
                "l": "P",
                "r": "a+b+c\\approx 18.245",
                "note": "Perímetro",
                "boxed": false
              }
            ]
          },
          {
            "type": "geo",
            "kind": "tri",
            "a": 7,
            "b": 5,
            "c": 6.244997998398397,
            "A": 76.10211375198602,
            "B": 43.897886248013975,
            "C": 60,
            "label": ""
          }
        ],
        "strokes": []
      }
    ]
  }
});
