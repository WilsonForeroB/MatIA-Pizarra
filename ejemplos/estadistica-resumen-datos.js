/* Ejemplo del banco (formato en ejemplos/LEEME.md). Bloques generados con el motor de la app. */
MatIA.ejemplo({
  "id": "estadistica-resumen-datos",
  "tema": "estadistica",
  "titulo": "Resumen de datos y diagrama de caja",
  "resumen": "Media, mediana, moda, desviación típica y cuartiles de unas notas, con su tabla de frecuencias y su diagrama de caja.",
  "board": {
    "title": "Resumen de datos: notas de un examen",
    "pages": [
      {
        "blocks": [
          {
            "type": "text",
            "v": "Las notas de 12 alumnos en un examen. Debajo, lo que calcula «Operaciones ▸ Media, mediana, moda y dispersión» sobre la línea de los datos. Prueba a cambiar el 3 por un 0 y vuelve a aplicarla: ¿qué cambia más, la media o la mediana?"
          },
          {
            "type": "math",
            "v": "x=4,\\ 7,\\ 6,\\ 8,\\ 5,\\ 9,\\ 6,\\ 10,\\ 3,\\ 7,\\ 6,\\ 8"
          },
          {
            "type": "deriv",
            "rows": [
              {
                "l": "\\text{Datos ordenados}",
                "r": "3,\\ 4,\\ 5,\\ 6,\\ 6,\\ 6,\\ 7,\\ 7,\\ 8,\\ 8,\\ 9,\\ 10",
                "note": "n = 12 datos",
                "boxed": false
              },
              {
                "l": "\\bar{x}",
                "r": "\\frac{\\sum x_{i}}{n}=\\frac{79}{12}=\\frac{79}{12}\\approx 6.5833",
                "note": "Media: suma de los datos entre el número de datos",
                "boxed": true
              },
              {
                "l": "Me",
                "r": "\\frac{13}{2}",
                "note": "Mediana: media de los dos centrales (posiciones 6 y 7)",
                "boxed": true
              },
              {
                "l": "Mo",
                "r": "6",
                "note": "El valor más repetido (3 veces)",
                "boxed": true
              },
              {
                "l": "\\text{Rango}",
                "r": "10-3=7",
                "note": "Máximo menos mínimo",
                "boxed": false
              },
              {
                "l": "\\sigma^{2}",
                "r": "\\frac{\\sum\\left(x_{i}-\\bar{x}\\right)^{2}}{12}=\\frac{\\frac{539}{12}}{12}=\\frac{539}{144}\\approx 3.7431",
                "note": "Varianza poblacional: media de los cuadrados de las desviaciones",
                "boxed": false
              },
              {
                "l": "\\sigma",
                "r": "\\sqrt{\\frac{539}{144}}=\\frac{7\\sqrt{11}}{12}\\approx 1.9347",
                "note": "Desviación típica poblacional",
                "boxed": true
              },
              {
                "l": "s^{2}",
                "r": "\\frac{\\frac{539}{12}}{11}=\\frac{49}{12}\\approx 4.0833",
                "note": "Varianza muestral (cuasivarianza): se divide entre n − 1",
                "boxed": false
              },
              {
                "l": "s",
                "r": "\\sqrt{\\frac{49}{12}}=\\frac{7\\sqrt{3}}{6}\\approx 2.0207",
                "note": "Desviación típica muestral",
                "boxed": false
              },
              {
                "l": "Q_{1},\\ Q_{2},\\ Q_{3}",
                "r": "\\frac{11}{2},\\ \\frac{13}{2},\\ 8",
                "note": "Cuartiles: Q₁ y Q₃ son las medianas de la mitad inferior y de la superior",
                "boxed": false
              },
              {
                "l": "\\text{RIC}",
                "r": "Q_{3}-Q_{1}=\\frac{5}{2}",
                "note": "Rango intercuartílico",
                "boxed": false
              },
              {
                "l": "CV",
                "r": "\\frac{\\sigma}{\\bar{x}}\\approx 0.2939\\ (29.39\\%)",
                "note": "Coeficiente de variación: dispersión relativa a la media",
                "boxed": false
              }
            ]
          },
          {
            "type": "chart",
            "kind": "box",
            "title": "Diagrama de caja",
            "data": [
              3,
              4,
              5,
              6,
              6,
              6,
              7,
              7,
              8,
              8,
              9,
              10
            ],
            "min": 3,
            "max": 10,
            "q1": 5.5,
            "med": 6.5,
            "q3": 8,
            "mean": 6.583333333333333
          }
        ],
        "strokes": []
      },
      {
        "blocks": [
          {
            "type": "text",
            "v": "Las mismas notas agrupadas con «Tabla de frecuencias». La barra más alta es la moda (6) y la última fila de Nᵢ cuenta todos los datos. Prueba a añadir más notas a la lista."
          },
          {
            "type": "math",
            "v": "x=4,\\ 7,\\ 6,\\ 8,\\ 5,\\ 9,\\ 6,\\ 10,\\ 3,\\ 7,\\ 6,\\ 8"
          },
          {
            "type": "table",
            "head": [
              "xᵢ",
              "nᵢ",
              "fᵢ",
              "Nᵢ",
              "Fᵢ",
              "%",
              "xᵢ·nᵢ"
            ],
            "rows": [
              [
                "3",
                "1",
                "1/12 ≈ 0,083",
                "1",
                "1/12",
                "8,3 %",
                "3"
              ],
              [
                "4",
                "1",
                "1/12 ≈ 0,083",
                "2",
                "1/6",
                "8,3 %",
                "4"
              ],
              [
                "5",
                "1",
                "1/12 ≈ 0,083",
                "3",
                "1/4",
                "8,3 %",
                "5"
              ],
              [
                "6",
                "3",
                "1/4 ≈ 0,25",
                "6",
                "1/2",
                "25 %",
                "18"
              ],
              [
                "7",
                "2",
                "1/6 ≈ 0,167",
                "8",
                "2/3",
                "16,7 %",
                "14"
              ],
              [
                "8",
                "2",
                "1/6 ≈ 0,167",
                "10",
                "5/6",
                "16,7 %",
                "16"
              ],
              [
                "9",
                "1",
                "1/12 ≈ 0,083",
                "11",
                "11/12",
                "8,3 %",
                "9"
              ],
              [
                "10",
                "1",
                "1/12 ≈ 0,083",
                "12",
                "1",
                "8,3 %",
                "10"
              ],
              [
                "Total",
                "12",
                "1",
                "",
                "",
                "100 %",
                "79"
              ]
            ],
            "vbar": 1,
            "hline": 8,
            "kind": "freq",
            "caption": "Tabla de frecuencias (n = 12): absoluta nᵢ, relativa fᵢ = nᵢ/n, acumuladas Nᵢ y Fᵢ. Media = Σxᵢnᵢ / n = 79/12"
          },
          {
            "type": "chart",
            "kind": "bars",
            "title": "Diagrama de barras",
            "labels": [
              "3",
              "4",
              "5",
              "6",
              "7",
              "8",
              "9",
              "10"
            ],
            "values": [
              1,
              1,
              1,
              3,
              2,
              2,
              1,
              1
            ],
            "ylabel": "nᵢ"
          }
        ],
        "strokes": []
      }
    ]
  }
});
