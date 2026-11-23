/* Banco de ejemplos · estadistica (cálculo generado con el motor de la app: engine/ops). */
MatIA.ejemplo({
  "id": "estadistica-test-medico",
  "tema": "estadistica",
  "titulo": "Has dado positivo: ¿estás enfermo?",
  "resumen": "Un test fiable da positivo y, aun así, es muy probable que estés sano: con el teorema de Bayes vemos por qué y por qué se repiten las pruebas.",
  "board": {
    "title": "Bayes: ¿qué significa dar positivo?",
    "pages": [
      {
        "blocks": [
          {
            "type": "text",
            "v": "Imagina un test que detecta una enfermedad con bastante fiabilidad: da positivo en el 90 % de las personas enfermas y solo se equivoca con el 5 % de las sanas (da un falso positivo). Esa enfermedad es poco frecuente: la tiene 1 de cada 100 personas. Te haces el test en una revisión y sale positivo. «Un test que acierta tanto… ¡estoy enfermo!», piensas. Pero ¿cuál es la probabilidad real de que lo estés? La respuesta sorprende a mucha gente, incluidos médicos, y se calcula con el teorema de Bayes. (Es un caso inventado para practicar; las cifras de las pruebas reales dependen de cada enfermedad.)"
          },
          {
            "type": "text",
            "v": "1. Planteamiento: imagina 10 000 personas"
          },
          {
            "type": "table",
            "head": [
              "",
              "Dan positivo (+)",
              "Dan negativo (−)",
              "Total"
            ],
            "rows": [
              [
                "Enfermas (1 %)",
                "90",
                "10",
                "100"
              ],
              [
                "Sanas (99 %)",
                "495",
                "9405",
                "9900"
              ],
              [
                "Total",
                "585",
                "9415",
                "10 000"
              ]
            ],
            "vbar": 1,
            "hline": 1,
            "kind": "",
            "caption": "Enfermas: 90 % de 100 = 90 positivos. Sanas: 5 % de 9900 = 495 falsos positivos"
          },
          {
            "type": "text",
            "v": "De los 585 positivos, solo 90 están enfermos: 90 / 585 ≈ 15 %. Hay tantísimas más personas sanas que incluso un pequeño 5 % de errores produce muchos más falsos positivos (495) que verdaderos positivos (90). Veamos lo mismo con probabilidades."
          },
          {
            "type": "text",
            "v": "2. El árbol y Bayes (Operaciones ▸ Árbol de probabilidad y Bayes…, con evento + y causas E y S)"
          },
          {
            "type": "ptree",
            "ev": "+",
            "causes": [
              {
                "name": "E",
                "p": "0,01",
                "l": "0,9",
                "nl": "0,1",
                "prod": "0,009",
                "nprod": "0,001"
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
                "r": "0{,}01\\cdot 0{,}9+0{,}99\\cdot 0{,}05",
                "note": "Sustituimos las probabilidades del árbol",
                "boxed": false
              },
              {
                "l": "",
                "r": "0{,}009+0{,}0495=0{,}0585",
                "note": "Multiplicamos y sumamos: probabilidad de dar positivo",
                "boxed": true
              },
              {
                "l": "P(E\\mid +)",
                "r": "\\frac{P(E)\\,P(+\\mid E)}{P(+)}=\\frac{0{,}009}{0{,}0585}=0{,}1538",
                "note": "Teorema de Bayes: probabilidad de cada causa sabiendo que ha ocurrido +",
                "boxed": true
              },
              {
                "l": "P(S\\mid +)",
                "r": "\\frac{P(S)\\,P(+\\mid S)}{P(+)}=\\frac{0{,}0495}{0{,}0585}=0{,}8462",
                "note": "Probabilidad de estar sano sabiendo que da positivo",
                "boxed": true
              }
            ]
          },
          {
            "type": "text",
            "v": "3. La respuesta"
          },
          {
            "type": "text",
            "v": "Dar positivo no significa estar enfermo: la probabilidad es solo de un 15 %, no del 90 %. Hay que distinguir P(+ | E) = 0,9 («si estás enfermo, el test da positivo») de P(E | +) ≈ 0,15 («si das positivo, estás enfermo»). Confundirlas es un error muy común. Lo que decide el resultado es la prevalencia: cuanto más rara es la enfermedad, más pesan los falsos positivos."
          },
          {
            "type": "text",
            "v": "4. ¿Y por eso se repite la prueba? Sí"
          },
          {
            "type": "text",
            "v": "Tras el primer positivo ya no partes del 1 %, sino del 15,38 %. Repetimos Bayes con ese nuevo punto de partida (segundo test, también positivo):"
          },
          {
            "type": "math",
            "v": "P(E)=0{,}1538,\\ P(S)=0{,}8462"
          },
          {
            "type": "ptree",
            "ev": "+",
            "causes": [
              {
                "name": "E",
                "p": "0,1538",
                "l": "0,9",
                "nl": "0,1",
                "prod": "0,1384",
                "nprod": "0,0154"
              },
              {
                "name": "S",
                "p": "0,8462",
                "l": "0,05",
                "nl": "0,95",
                "prod": "0,0423",
                "nprod": "0,8039"
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
                "r": "0{,}1538\\cdot 0{,}9+0{,}8462\\cdot 0{,}05",
                "note": "Sustituimos las probabilidades del árbol",
                "boxed": false
              },
              {
                "l": "",
                "r": "0{,}1384+0{,}0423=0{,}1807",
                "note": "Multiplicamos y sumamos: probabilidad de dar positivo",
                "boxed": true
              },
              {
                "l": "P(E\\mid +)",
                "r": "\\frac{P(E)\\,P(+\\mid E)}{P(+)}=\\frac{0{,}1384}{0{,}1807}=0{,}7659",
                "note": "Teorema de Bayes: probabilidad de cada causa sabiendo que ha ocurrido +",
                "boxed": true
              },
              {
                "l": "P(S\\mid +)",
                "r": "\\frac{P(S)\\,P(+\\mid S)}{P(+)}=\\frac{0{,}0423}{0{,}1807}=0{,}2341",
                "note": "Probabilidad de estar sano sabiendo que da positivo",
                "boxed": true
              }
            ]
          },
          {
            "type": "text",
            "v": "Con dos positivos, la probabilidad de estar enfermo sube a un 77 %. Con un tercer positivo (partiendo de 0,7659) pasa del 98 %:"
          },
          {
            "type": "ptree",
            "ev": "+",
            "causes": [
              {
                "name": "E",
                "p": "0,7659",
                "l": "0,9",
                "nl": "0,1",
                "prod": "0,6893",
                "nprod": "0,0766"
              },
              {
                "name": "S",
                "p": "0,2341",
                "l": "0,05",
                "nl": "0,95",
                "prod": "0,0117",
                "nprod": "0,2224"
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
                "r": "0{,}7659\\cdot 0{,}9+0{,}2341\\cdot 0{,}05",
                "note": "Sustituimos las probabilidades del árbol",
                "boxed": false
              },
              {
                "l": "",
                "r": "0{,}6893+0{,}0117=0{,}701",
                "note": "Multiplicamos y sumamos: probabilidad de dar positivo",
                "boxed": true
              },
              {
                "l": "P(E\\mid +)",
                "r": "\\frac{P(E)\\,P(+\\mid E)}{P(+)}=\\frac{0{,}6893}{0{,}701}=0{,}9833",
                "note": "Teorema de Bayes: probabilidad de cada causa sabiendo que ha ocurrido +",
                "boxed": true
              },
              {
                "l": "P(S\\mid +)",
                "r": "\\frac{P(S)\\,P(+\\mid S)}{P(+)}=\\frac{0{,}0117}{0{,}701}=0{,}0167",
                "note": "Probabilidad de estar sano sabiendo que da positivo",
                "boxed": true
              }
            ]
          },
          {
            "type": "text",
            "v": "Por eso, cuando un cribado da positivo, lo normal es repetir la prueba o hacer otra distinta y más precisa: cada resultado actualiza la probabilidad. En la vida real también se pone el test solo a personas con síntomas o con riesgo, porque así la prevalencia de partida es mucho mayor."
          },
          {
            "type": "text",
            "v": "Ahora tú: 1) Cambia la prevalencia: si fuera del 10 % (P(E) = 0,1 y P(S) = 0,9) y repites el árbol, ¿cuánto vale P(E | +)? (Debería salir unos dos tercios.) 2) Prueba con una enfermedad muy rara, 1 de cada 1000 (P(E) = 0,001), y con un test aún mejor (95 % de aciertos en enfermos y solo un 1 % de falsos positivos): ¿sigue siendo bajo?"
          }
        ],
        "strokes": []
      }
    ]
  }
});
