/* Ejemplo del banco (formato en ejemplos/LEEME.md). Bloques generados con el motor de la app. */
MatIA.ejemplo({
  "id": "estadistica-bayes-test",
  "tema": "estadistica",
  "titulo": "Teorema de Bayes: un test médico",
  "resumen": "Árbol de probabilidad, probabilidad total y Bayes: por qué un positivo en un test fiable puede no ser tan preocupante.",
  "board": {
    "title": "Bayes: ¿qué significa dar positivo?",
    "pages": [
      {
        "blocks": [
          {
            "type": "text",
            "v": "Una enfermedad afecta al 1 % de la población (E = enfermo, S = sano). El test da positivo (+) en el 95 % de los enfermos, pero también en el 5 % de los sanos (falsos positivos). Si alguien da positivo, ¿qué probabilidad hay de que esté enfermo? Prueba con «Operaciones ▸ Árbol de probabilidad y Bayes…» cambiando el 1 % por un 10 %."
          },
          {
            "type": "ptree",
            "ev": "+",
            "causes": [
              {
                "name": "E",
                "p": "0,01",
                "l": "0,95",
                "nl": "0,05",
                "prod": "0,0095",
                "nprod": "0,0005"
              },
              {
                "name": "S",
                "p": "0,99",
                "l": "0,05",
                "nl": "0,95",
                "prod": "0,0495",
                "nprod": "0,9405"
              }
            ]
          },
          {
            "type": "deriv",
            "rows": [
              {
                "l": "P(+)",
                "r": "P(E)\\,P(+\\mid E)+P(S)\\,P(+\\mid S)",
                "note": "Teorema de la probabilidad total: sumamos las ramas que llegan a +",
                "boxed": false
              },
              {
                "l": "",
                "r": "0.01\\cdot 0.95+0.99\\cdot 0.05",
                "note": "",
                "boxed": false
              },
              {
                "l": "",
                "r": "0.0095+0.0495=0.059",
                "note": "",
                "boxed": true
              },
              {
                "l": "P(E\\mid +)",
                "r": "\\frac{P(E)\\,P(+\\mid E)}{P(+)}=\\frac{0.0095}{0.059}=0.161",
                "note": "Teorema de Bayes: probabilidad de cada causa sabiendo que ha ocurrido +",
                "boxed": true
              },
              {
                "l": "P(S\\mid +)",
                "r": "\\frac{P(S)\\,P(+\\mid S)}{P(+)}=\\frac{0.0495}{0.059}=0.839",
                "note": "",
                "boxed": true
              }
            ]
          },
          {
            "type": "text",
            "v": "Sorpresa: solo un 16 % de los positivos está realmente enfermo. Como hay muchísimos más sanos que enfermos, los falsos positivos (0,0495) superan a los verdaderos (0,0095)."
          }
        ],
        "strokes": []
      }
    ]
  }
});
