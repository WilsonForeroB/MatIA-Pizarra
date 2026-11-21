/* Ejemplo del banco (formato en ejemplos/LEEME.md). Bloques generados con el motor de la app. */
MatIA.ejemplo({
  "id": "presentaciones-teorema-pitagoras",
  "tema": "presentaciones",
  "titulo": "Presentación: el teorema de Pitágoras",
  "resumen": "Tres diapositivas con título, listas, colores, fórmulas en el texto y un dibujo, listas para «Guardar como PDF».",
  "board": {
    "title": "El teorema de Pitágoras",
    "paper": "slide",
    "pages": [
      {
        "blocks": [
          {
            "type": "text",
            "v": "El teorema de Pitágoras",
            "html": "<p class=\"tf-al-center\"><span class=\"tf-sz-title tf-c1\">El teorema de Pitágoras</span></p>"
          },
          {
            "type": "text",
            "v": "En todo triángulo rectángulo, el cuadrado de la hipotenusa es igual a la suma de los cuadrados de los catetos: $a^2=b^2+c^2$",
            "html": "<p class=\"tf-al-center\"><span class=\"tf-sz-lg\">En todo triángulo <b>rectángulo</b>, el cuadrado de la <span class=\"tf-c2\">hipotenusa</span> es igual a la suma de los cuadrados de los <span class=\"tf-c3\">catetos</span>:</span></p><p class=\"tf-al-center\"><span class=\"tf-sz-sub\"><span class=\"math-inline\" data-latex=\"a^2=b^2+c^2\"></span></span></p>"
          },
          {
            "type": "text",
            "v": "La hipotenusa a es el lado opuesto al ángulo recto (el más largo). Los catetos b y c son los lados que forman el ángulo recto. Funciona también al revés: si se cumple, el triángulo es rectángulo.",
            "html": "<ul><li>La <span class=\"tf-c2\"><b>hipotenusa</b></span> <span class=\"math-inline\" data-latex=\"a\"></span> es el lado opuesto al ángulo recto (el más largo).</li><li>Los <span class=\"tf-c3\"><b>catetos</b></span> <span class=\"math-inline\" data-latex=\"b\"></span> y <span class=\"math-inline\" data-latex=\"c\"></span> son los lados que forman el ángulo recto.</li><li>Funciona también <span class=\"tf-hl1\">al revés</span>: si se cumple, el triángulo es rectángulo.</li></ul>"
          },
          {
            "type": "text",
            "v": "Prueba: cambia los colores o el tamaño del título con la barra de formato y pulsa «Guardar como PDF».",
            "html": "<p class=\"tf-al-center\"><i><span class=\"tf-c0\">Prueba: cambia el color o el tamaño del título con la barra de formato y guarda la presentación como PDF.</span></i></p>"
          }
        ],
        "strokes": []
      },
      {
        "blocks": [
          {
            "type": "text",
            "v": "Un ejemplo: el triángulo 3, 4, 5",
            "html": "<p><span class=\"tf-sz-sub tf-c1\">Un ejemplo: el triángulo 3 – 4 – 5</span></p>"
          },
          {
            "type": "geo",
            "kind": "tri",
            "a": 5,
            "b": 4,
            "c": 3,
            "A": 90,
            "B": 53.13010235415598,
            "C": 36.86989764584402,
            "label": "",
            "align": "center"
          },
          {
            "type": "deriv",
            "rows": [
              {
                "l": "b^2+c^2",
                "r": "4^2+3^2=16+9=25",
                "note": "Suma de los cuadrados de los catetos",
                "boxed": false
              },
              {
                "l": "a^2",
                "r": "5^2=25",
                "note": "Coincide: el ángulo A mide 90°",
                "boxed": true
              }
            ]
          }
        ],
        "strokes": []
      },
      {
        "blocks": [
          {
            "type": "text",
            "v": "Para qué sirve",
            "html": "<p><span class=\"tf-sz-sub tf-c1\">¿Para qué sirve?</span></p>"
          },
          {
            "type": "text",
            "v": "Distancia entre dos puntos del plano: d(P,Q)=√((x₂−x₁)²+(y₂−y₁)²). Diagonal de un rectángulo o de una pantalla. Ternas pitagóricas: 3, 4, 5; 5, 12, 13; 8, 15, 17.",
            "html": "<ol><li><b>Distancia entre dos puntos</b> del plano: <span class=\"math-inline\" data-latex=\"d(P,Q)=\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}\"></span></li><li><b>Diagonales</b>: una pantalla de 16 × 9 tiene diagonal <span class=\"math-inline\" data-latex=\"\\sqrt{16^2+9^2}=\\sqrt{337}\\approx 18{,}36\"></span></li><li><b>Ternas pitagóricas</b>: <span class=\"tf-c4\">3, 4, 5</span>; <span class=\"tf-c4\">5, 12, 13</span>; <span class=\"tf-c4\">8, 15, 17</span>.</li></ol>"
          },
          {
            "type": "table",
            "head": [
              "b",
              "c",
              "b² + c²",
              "a"
            ],
            "rows": [
              [
                "3",
                "4",
                "25",
                "5"
              ],
              [
                "5",
                "12",
                "169",
                "13"
              ],
              [
                "8",
                "15",
                "289",
                "17"
              ],
              [
                "7",
                "24",
                "625",
                "25"
              ]
            ],
            "vbar": 2,
            "lastBold": true,
            "caption": "Ternas pitagóricas: lados enteros que cumplen a² = b² + c²",
            "kind": ""
          }
        ],
        "strokes": []
      }
    ]
  }
});
