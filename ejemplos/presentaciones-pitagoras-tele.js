/* Banco de ejemplos · presentaciones (cálculo generado con el motor de la app: engine/ops). */
MatIA.ejemplo({
  "id": "presentaciones-pitagoras-tele",
  "tema": "presentaciones",
  "titulo": "¿Cabe la tele de 55 pulgadas en el mueble?",
  "resumen": "Presentación de tres diapositivas: con Pitágoras y la proporción 16:9 pasamos de las pulgadas de la diagonal a los centímetros de ancho y alto.",
  "board": {
    "title": "¿Cabe la tele de 55 pulgadas?",
    "pages": [
      {
        "blocks": [
          {
            "type": "text",
            "v": "¿Cabe la tele de 55 pulgadas en el mueble?",
            "html": "<p class=\"tf-al-center\"><span class=\"tf-sz-title tf-c1\">¿Cabe la tele de 55 pulgadas en el mueble?</span></p>"
          },
          {
            "type": "text",
            "v": "Tienes un mueble con un hueco de 120 cm de ancho y 70 cm de alto. En la tienda hay una tele de 55 pulgadas en oferta. ¿Entra?",
            "html": "<p class=\"tf-al-center\"><span class=\"tf-sz-lg\">Tienes un mueble con un hueco de <b>120 cm de ancho</b> y <b>70 cm de alto</b>. En la tienda hay una tele de <span class=\"tf-c2\"><b>55 pulgadas</b></span> en oferta. ¿Entra?</span></p>"
          },
          {
            "type": "text",
            "v": "Las pulgadas no miden ni el ancho ni el alto: miden la diagonal de la pantalla. 1 pulgada = 2,54 cm. La mayoría de pantallas tiene proporción 16:9 (16 de ancho por cada 9 de alto). Con Pitágoras podemos sacar el ancho y el alto.",
            "html": "<ul><li>Las pulgadas miden la <span class=\"tf-c2\"><b>diagonal</b></span> de la pantalla, no el ancho ni el alto.</li><li>1 pulgada = <b>2,54 cm</b>, así que 55 pulgadas son 139,7 cm de diagonal.</li><li>Proporción <span class=\"tf-c3\"><b>16:9</b></span>: por cada 16 de ancho, 9 de alto.</li><li>¡Con <span class=\"tf-hl1\">Pitágoras</span> sacamos el ancho y el alto!</li></ul>"
          }
        ],
        "strokes": []
      },
      {
        "blocks": [
          {
            "type": "text",
            "v": "Pitágoras con proporción 16:9",
            "html": "<p><span class=\"tf-sz-sub tf-c1\">Pitágoras con proporción 16:9</span></p>"
          },
          {
            "type": "deriv",
            "rows": [
              {
                "l": "(16k)^2+(9k)^2",
                "r": "55^2",
                "note": "Ancho = 16k, alto = 9k: Pitágoras",
                "boxed": false
              },
              {
                "l": "337k^2",
                "r": "3025",
                "note": "256k² + 81k² = 337k²",
                "boxed": false
              },
              {
                "l": "k",
                "r": "\\frac{55}{\\sqrt{337}}\\approx 2{,}996\\ \\text{in}",
                "note": "Despejamos k",
                "boxed": false
              },
              {
                "l": "\\text{Ancho}",
                "r": "16k\\approx 47{,}94\\ \\text{in}\\approx 121{,}76\\ \\text{cm}",
                "note": "47,94 × 2,54 ≈ 121,76",
                "boxed": true
              },
              {
                "l": "\\text{Alto}",
                "r": "9k\\approx 26{,}96\\ \\text{in}\\approx 68{,}49\\ \\text{cm}",
                "note": "26,96 × 2,54 ≈ 68,49",
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
            "v": "Veredicto y reto",
            "html": "<p><span class=\"tf-sz-sub tf-c1\">Veredicto y reto</span></p>"
          },
          {
            "type": "text",
            "v": "La tele de 55 pulgadas mide unos 121,8 cm de ancho y 68,5 cm de alto. El hueco tiene 120 cm de ancho: no cabe, le sobran 1,8 cm, y eso sin contar el marco ni el soporte. En altura sí entra (68,5 cm < 70 cm). La de 50 pulgadas sí cabe.",
            "html": "<p><span class=\"tf-sz-lg\">La de 55\" mide <b>121,8 × 68,5 cm</b>. El hueco tiene 120 cm de ancho: <span class=\"tf-c2\"><b>no cabe</b></span> (sobran 1,8 cm). De alto sí entra. La de <span class=\"tf-c3\"><b>50\"</b></span> sí cabe.</span></p>"
          },
          {
            "type": "table",
            "head": [
              "Diagonal",
              "Ancho (cm)",
              "Alto (cm)",
              "¿Cabe en 120 × 70?"
            ],
            "rows": [
              [
                "50\"",
                "110,7",
                "62,3",
                "Sí"
              ],
              [
                "55\"",
                "121,8",
                "68,5",
                "No"
              ],
              [
                "65\"",
                "143,9",
                "80,9",
                "No"
              ]
            ],
            "vbar": 1,
            "kind": "",
            "caption": "Tamaños en proporción 16:9 (la diagonal es la que anuncia la tienda)"
          },
          {
            "type": "text",
            "v": "Reto: tienes un mueble de 130 cm de ancho. ¿Cabe la de 65 pulgadas? ¿Cuál es la diagonal máxima, en pulgadas, para un hueco de 120 cm de ancho?",
            "html": "<p><b><span class=\"tf-c4\">Reto:</span></b> en un mueble de <b>130 cm</b> de ancho, ¿cabe la de 65 pulgadas? ¿Y cuál es la diagonal máxima, en pulgadas, para un hueco de <b>120 cm</b>?</p>"
          }
        ],
        "strokes": []
      }
    ],
    "paper": "slide"
  }
});
