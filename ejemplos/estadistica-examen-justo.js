/* Banco de ejemplos · estadistica (cálculo generado con el motor de la app: engine/ops). */
MatIA.ejemplo({
  "id": "estadistica-examen-justo",
  "tema": "estadistica",
  "titulo": "¿Fue justo el examen? Dos grupos, mismas preguntas",
  "resumen": "Dos clases con la misma nota media, pero muy distintas: con mediana, desviación típica y diagramas de caja descubrimos lo que la media esconde.",
  "board": {
    "title": "¿Fue justo el examen?",
    "pages": [
      {
        "blocks": [
          {
            "type": "text",
            "v": "Dos clases de 18 alumnos hacen el mismo examen de mates, con las mismas preguntas. Al corregirlo, el profesor se da cuenta de que las dos clases tienen la misma nota media: un 6. «Entonces el examen ha salido igual de bien en las dos», piensa. Pero una alumna de la clase B protesta: «En mi clase hubo muchos suspensos y bastantes dieces; el examen no fue igual para todos». ¿Quién tiene razón? Para saberlo hace falta mirar algo más que la media."
          },
          {
            "type": "text",
            "v": "1. Los datos (notas sobre 10 de cada alumno)"
          },
          {
            "type": "math",
            "v": "A=4,\\ 4,\\ 5,\\ 5,\\ 5,\\ 6,\\ 6,\\ 6,\\ 6,\\ 6,\\ 6,\\ 6,\\ 7,\\ 7,\\ 7,\\ 7,\\ 7,\\ 8"
          },
          {
            "type": "math",
            "v": "B=1,\\ 2,\\ 3,\\ 3,\\ 4,\\ 4,\\ 4,\\ 5,\\ 5,\\ 5,\\ 6,\\ 6,\\ 10,\\ 10,\\ 10,\\ 10,\\ 10,\\ 10"
          },
          {
            "type": "text",
            "v": "2. Resumen de la clase A (Operaciones ▸ Media, mediana, moda y dispersión, sobre la línea de datos)"
          },
          {
            "type": "math",
            "v": "x=4,\\ 4,\\ 5,\\ 5,\\ 5,\\ 6,\\ 6,\\ 6,\\ 6,\\ 6,\\ 6,\\ 6,\\ 7,\\ 7,\\ 7,\\ 7,\\ 7,\\ 8"
          },
          {
            "type": "deriv",
            "rows": [
              {
                "l": "\\bar{x}",
                "r": "\\frac{\\sum x_{i}}{n}=\\frac{108}{18}=6",
                "note": "Media: suma de los datos entre el número de datos",
                "boxed": true
              },
              {
                "l": "Me",
                "r": "6",
                "note": "Mediana: media de los dos centrales (posiciones 9 y 10)",
                "boxed": true
              },
              {
                "l": "Mo",
                "r": "6",
                "note": "El valor más repetido (7 veces)",
                "boxed": true
              },
              {
                "l": "\\text{Rango}",
                "r": "8-4=4",
                "note": "Máximo menos mínimo",
                "boxed": false
              },
              {
                "l": "\\sigma^{2}",
                "r": "\\frac{\\sum\\left(x_{i}-\\bar{x}\\right)^{2}}{18}=\\frac{20}{18}=\\frac{10}{9}\\approx 1{,}1111",
                "note": "Varianza poblacional: media de los cuadrados de las desviaciones",
                "boxed": false
              },
              {
                "l": "\\sigma",
                "r": "\\sqrt{\\frac{10}{9}}=\\frac{\\sqrt{10}}{3}\\approx 1{,}0541",
                "note": "Desviación típica poblacional",
                "boxed": true
              },
              {
                "l": "s^{2}",
                "r": "\\frac{20}{17}=\\frac{20}{17}\\approx 1{,}1765",
                "note": "Varianza muestral (cuasivarianza): se divide entre n − 1",
                "boxed": false
              },
              {
                "l": "s",
                "r": "\\sqrt{\\frac{20}{17}}=\\frac{2\\sqrt{85}}{17}\\approx 1{,}0847",
                "note": "Desviación típica muestral",
                "boxed": false
              },
              {
                "l": "Q_{1},\\ Q_{2},\\ Q_{3}",
                "r": "5,\\ 6,\\ 7",
                "note": "Cuartiles: Q₁ y Q₃ son las medianas de la mitad inferior y de la superior",
                "boxed": false
              },
              {
                "l": "\\text{RIC}",
                "r": "Q_{3}-Q_{1}=2",
                "note": "Rango intercuartílico",
                "boxed": false
              },
              {
                "l": "CV",
                "r": "\\frac{\\sigma}{\\bar{x}}\\approx 0{,}1757\\ (17{,}57\\%)",
                "note": "Coeficiente de variación: dispersión relativa a la media",
                "boxed": false
              }
            ]
          },
          {
            "type": "chart",
            "kind": "box",
            "title": "Clase A: diagrama de caja",
            "data": [
              4,
              4,
              5,
              5,
              5,
              6,
              6,
              6,
              6,
              6,
              6,
              6,
              7,
              7,
              7,
              7,
              7,
              8
            ],
            "min": 4,
            "max": 8,
            "q1": 5,
            "med": 6,
            "q3": 7,
            "mean": 6
          },
          {
            "type": "text",
            "v": "3. Resumen de la clase B (la misma operación sobre sus 18 notas)"
          },
          {
            "type": "math",
            "v": "x=1,\\ 2,\\ 3,\\ 3,\\ 4,\\ 4,\\ 4,\\ 5,\\ 5,\\ 5,\\ 6,\\ 6,\\ 10,\\ 10,\\ 10,\\ 10,\\ 10,\\ 10"
          },
          {
            "type": "deriv",
            "rows": [
              {
                "l": "\\bar{x}",
                "r": "\\frac{\\sum x_{i}}{n}=\\frac{108}{18}=6",
                "note": "Media: suma de los datos entre el número de datos",
                "boxed": true
              },
              {
                "l": "Me",
                "r": "5",
                "note": "Mediana: media de los dos centrales (posiciones 9 y 10)",
                "boxed": true
              },
              {
                "l": "Mo",
                "r": "10",
                "note": "El valor más repetido (6 veces)",
                "boxed": true
              },
              {
                "l": "\\text{Rango}",
                "r": "10-1=9",
                "note": "Máximo menos mínimo",
                "boxed": false
              },
              {
                "l": "\\sigma^{2}",
                "r": "\\frac{\\sum\\left(x_{i}-\\bar{x}\\right)^{2}}{18}=\\frac{170}{18}=\\frac{85}{9}\\approx 9{,}4444",
                "note": "Varianza poblacional: media de los cuadrados de las desviaciones",
                "boxed": false
              },
              {
                "l": "\\sigma",
                "r": "\\sqrt{\\frac{85}{9}}=\\frac{\\sqrt{85}}{3}\\approx 3{,}0732",
                "note": "Desviación típica poblacional",
                "boxed": true
              },
              {
                "l": "s^{2}",
                "r": "\\frac{170}{17}=10",
                "note": "Varianza muestral (cuasivarianza): se divide entre n − 1",
                "boxed": false
              },
              {
                "l": "s",
                "r": "\\sqrt{10}=\\sqrt{10}\\approx 3{,}1623",
                "note": "Desviación típica muestral",
                "boxed": false
              },
              {
                "l": "Q_{1},\\ Q_{2},\\ Q_{3}",
                "r": "4,\\ 5,\\ 10",
                "note": "Cuartiles: Q₁ y Q₃ son las medianas de la mitad inferior y de la superior",
                "boxed": false
              },
              {
                "l": "\\text{RIC}",
                "r": "Q_{3}-Q_{1}=6",
                "note": "Rango intercuartílico",
                "boxed": false
              },
              {
                "l": "CV",
                "r": "\\frac{\\sigma}{\\bar{x}}\\approx 0{,}5122\\ (51{,}22\\%)",
                "note": "Coeficiente de variación: dispersión relativa a la media",
                "boxed": false
              }
            ]
          },
          {
            "type": "chart",
            "kind": "box",
            "title": "Clase B: diagrama de caja",
            "data": [
              1,
              2,
              3,
              3,
              4,
              4,
              4,
              5,
              5,
              5,
              6,
              6,
              10,
              10,
              10,
              10,
              10,
              10
            ],
            "min": 1,
            "max": 10,
            "q1": 4,
            "med": 5,
            "q3": 10,
            "mean": 6
          },
          {
            "type": "text",
            "v": "4. La respuesta: comparamos las dos clases"
          },
          {
            "type": "table",
            "head": [
              "",
              "Clase A",
              "Clase B"
            ],
            "rows": [
              [
                "Media",
                "6",
                "6"
              ],
              [
                "Mediana",
                "6",
                "5"
              ],
              [
                "Desviación típica σ",
                "≈ 1,05",
                "≈ 3,07"
              ],
              [
                "Cuartiles Q₁ · Q₂ · Q₃",
                "5 · 6 · 7",
                "4 · 5 · 10"
              ],
              [
                "Rango (máx − mín)",
                "4",
                "9"
              ]
            ],
            "vbar": 1,
            "kind": "",
            "caption": "Mismas medias, clases muy distintas"
          },
          {
            "type": "text",
            "v": "La alumna tiene razón. La media de las dos clases es 6, pero en la clase A casi todos están cerca del 6 (la desviación típica es de solo un punto y la caja del diagrama es estrecha), mientras que en la B las notas están muy dispersas: la desviación típica es tres veces mayor y la caja va del 4 al 10. Además, la mediana de B es 5: la mitad de esa clase no llegó al 6 que sugiere la media. Seis alumnos sacaron un 10 y «subieron» la media, tapando que doce estaban por debajo de 7. La media es muy sensible a los valores extremos; la mediana no."
          },
          {
            "type": "text",
            "v": "Moraleja para la vida real: cuando oigas «la nota media es…», «el sueldo medio es…» o «el precio medio de un piso es…», pregunta siempre por la dispersión (o por la mediana). Un sueldo medio de 2000 € puede esconder muchos sueldos de 1200 € y unos pocos de 10 000 €."
          },
          {
            "type": "text",
            "v": "Ahora tú: 1) En la clase A cambia el último 8 por un 0 y repite la operación: ¿qué cambia más, la media o la mediana? 2) Escribe las notas de tu propia clase en una línea y aplica Operaciones ▸ Media, mediana, moda y dispersión: ¿se parece tu clase más a la A o a la B?"
          }
        ],
        "strokes": []
      }
    ]
  }
});
