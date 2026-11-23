/* Banco de ejemplos · discreta (cálculo generado con el motor de la app: engine/ops). */
MatIA.ejemplo({
  "id": "discreta-anuncio-miente",
  "tema": "discreta",
  "titulo": "¿Miente este anuncio?",
  "resumen": "Traducimos frases de publicidad a lógica y con tablas de verdad vemos qué conclusiones son válidas y cuáles son falacias.",
  "board": {
    "title": "¿Miente este anuncio?",
    "pages": [
      {
        "blocks": [
          {
            "type": "text",
            "v": "«¡Solo hoy! Si no compras hoy, no tendrás descuento.» Lo has visto mil veces en tiendas y redes sociales. Y también has oído al influencer que dice: «Yo uso esta crema y tengo una piel radiante, así que si quieres una piel radiante, usa la crema». La publicidad juega con frases del tipo «si… entonces…» y, si no las analizas con cuidado, te hace sacar conclusiones que no se deducen de lo que dice el anuncio. La lógica proposicional sirve para detectar cuándo un razonamiento es válido y cuándo es una trampa."
          },
          {
            "type": "text",
            "v": "1. Del anuncio a la lógica"
          },
          {
            "type": "text",
            "v": "Llamamos p = «compras hoy» y q = «hay descuento». El anuncio dice: si no compras hoy, no hay descuento, es decir ¬p ⇒ ¬q. Queremos saber qué otras frases dicen exactamente lo mismo y cuáles solo lo parecen."
          },
          {
            "type": "table",
            "head": [
              "Frase",
              "En lógica"
            ],
            "rows": [
              [
                "Si no compras hoy, no tendrás descuento (el anuncio)",
                "¬p ⇒ ¬q"
              ],
              [
                "Si tienes descuento, es que compraste hoy",
                "q ⇒ p"
              ],
              [
                "Si compras hoy, tendrás descuento",
                "p ⇒ q"
              ]
            ],
            "vbar": 1,
            "kind": "",
            "caption": "Tres frases parecidas. ¿Cuáles significan lo mismo?"
          },
          {
            "type": "text",
            "v": "2. ¿Equivale el anuncio a su contrarrecíproco? (Operaciones ▸ Tabla de verdad)"
          },
          {
            "type": "math",
            "v": "(\\neg p\\Rightarrow\\neg q)\\Leftrightarrow(q\\Rightarrow p)"
          },
          {
            "type": "table",
            "head": [
              "p",
              "q",
              "¬p",
              "¬q",
              "¬p → ¬q",
              "q → p",
              "(¬p → ¬q) ↔ (q → p)"
            ],
            "rows": [
              [
                "V",
                "V",
                "F",
                "F",
                "V",
                "V",
                "V"
              ],
              [
                "V",
                "F",
                "F",
                "V",
                "V",
                "V",
                "V"
              ],
              [
                "F",
                "V",
                "V",
                "F",
                "F",
                "F",
                "V"
              ],
              [
                "F",
                "F",
                "V",
                "V",
                "V",
                "V",
                "V"
              ]
            ],
            "vbar": 2,
            "kind": "truth",
            "caption": "Tautología: siempre verdadera. El anuncio equivale a «si tienes descuento, compraste hoy»",
            "lastBold": true
          },
          {
            "type": "text",
            "v": "Las dos frases coinciden en todas las filas: son equivalentes. Fíjate en la fila 3: no compras hoy (p falso) y, sin embargo, hay descuento (q verdadero). Ahí la frase del anuncio ¬p ⇒ ¬q es falsa: el anuncio mentiría si al día siguiente siguiera el descuento. Esa es la única forma de que el anuncio sea falso."
          },
          {
            "type": "text",
            "v": "3. ¿Y «si compras hoy, tendrás descuento»? Aquí cae la gente"
          },
          {
            "type": "math",
            "v": "(\\neg p\\Rightarrow\\neg q)\\Leftrightarrow(p\\Rightarrow q)"
          },
          {
            "type": "table",
            "head": [
              "p",
              "q",
              "¬p",
              "¬q",
              "¬p → ¬q",
              "p → q",
              "(¬p → ¬q) ↔ (p → q)"
            ],
            "rows": [
              [
                "V",
                "V",
                "F",
                "F",
                "V",
                "V",
                "V"
              ],
              [
                "V",
                "F",
                "F",
                "V",
                "V",
                "F",
                "F"
              ],
              [
                "F",
                "V",
                "V",
                "F",
                "F",
                "V",
                "F"
              ],
              [
                "F",
                "F",
                "V",
                "V",
                "V",
                "V",
                "V"
              ]
            ],
            "vbar": 2,
            "kind": "truth",
            "caption": "Contingencia: a veces verdadera y a veces falsa",
            "lastBold": true
          },
          {
            "type": "text",
            "v": "Contingencia: ¬p ⇒ ¬q no equivale a p ⇒ q (las filas 2 y 3 dan resultados distintos). El anuncio dice que sin comprar hoy no hay descuento, pero no promete que comprar hoy te lo dé: en la fila 2 compras hoy, no hay descuento y el anuncio no ha mentido. Pensar «como compro hoy, tendré descuento» es la falacia de negar el antecedente: el antecedente del anuncio es «no compras hoy», y negarlo no garantiza nada."
          },
          {
            "type": "text",
            "v": "4. La falacia de afirmar el consecuente"
          },
          {
            "type": "text",
            "v": "Ahora p = «usas la crema» y q = «tienes una piel radiante». Supongamos incluso que la crema funciona: p ⇒ q. Al ver al influencer con la piel radiante (q), mucha gente concluye que es gracias a la crema (p). Es decir, [(p ⇒ q) ∧ q] ⇒ p. ¿Es válido?"
          },
          {
            "type": "math",
            "v": "((p\\Rightarrow q)\\land q)\\Rightarrow p"
          },
          {
            "type": "table",
            "head": [
              "p",
              "q",
              "p → q",
              "(p → q) ∧ q",
              "((p → q) ∧ q) → p"
            ],
            "rows": [
              [
                "V",
                "V",
                "V",
                "V",
                "V"
              ],
              [
                "V",
                "F",
                "F",
                "F",
                "V"
              ],
              [
                "F",
                "V",
                "V",
                "V",
                "F"
              ],
              [
                "F",
                "F",
                "V",
                "F",
                "V"
              ]
            ],
            "vbar": 2,
            "kind": "truth",
            "caption": "Contingencia: no es válido. Falla en la fila 3: piel radiante sin usar la crema",
            "lastBold": true
          },
          {
            "type": "text",
            "v": "En la fila 3 la piel es radiante (q verdadero) sin usar la crema (p falso): se puede tener buena piel por mil razones (dormir bien, buena genética, un filtro…). Afirmar el consecuente no demuestra el antecedente."
          },
          {
            "type": "text",
            "v": "¿Y qué razonamiento sí es válido? Si el anuncio fuera cierto y tuvieras la piel apagada (¬q), entonces seguro que no has usado la crema (¬p). Es el modus tollens, y se comprueba también con la tabla:"
          },
          {
            "type": "math",
            "v": "((p\\Rightarrow q)\\land\\neg q)\\Rightarrow\\neg p"
          },
          {
            "type": "table",
            "head": [
              "p",
              "q",
              "p → q",
              "¬q",
              "(p → q) ∧ ¬q",
              "¬p",
              "((p → q) ∧ ¬q) → ¬p"
            ],
            "rows": [
              [
                "V",
                "V",
                "V",
                "F",
                "F",
                "F",
                "V"
              ],
              [
                "V",
                "F",
                "F",
                "V",
                "F",
                "F",
                "V"
              ],
              [
                "F",
                "V",
                "V",
                "F",
                "F",
                "V",
                "V"
              ],
              [
                "F",
                "F",
                "V",
                "V",
                "V",
                "V",
                "V"
              ]
            ],
            "vbar": 2,
            "kind": "truth",
            "caption": "Tautología: siempre verdadera. Si p ⇒ q y no se cumple q, entonces no se cumple p",
            "lastBold": true
          },
          {
            "type": "text",
            "v": "5. La respuesta"
          },
          {
            "type": "table",
            "head": [
              "Razonamiento",
              "¿Válido?"
            ],
            "rows": [
              [
                "p ⇒ q y p, luego q (modus ponens)",
                "Sí"
              ],
              [
                "p ⇒ q y ¬q, luego ¬p (modus tollens, contrarrecíproco)",
                "Sí"
              ],
              [
                "p ⇒ q y q, luego p (afirmar el consecuente)",
                "No"
              ],
              [
                "p ⇒ q y ¬p, luego ¬q (negar el antecedente)",
                "No"
              ]
            ],
            "vbar": 1,
            "kind": "",
            "caption": "Los dos primeros se pueden usar; los dos últimos son falacias"
          },
          {
            "type": "text",
            "v": "Un anuncio de la forma «si haces X, consigues Y» no dice que Y solo se consiga haciendo X. Y que alguien tenga Y no demuestra que haya hecho X. Con la lógica puedes distinguir en poco tiempo lo que un anuncio dice de verdad de lo que solo insinúa. Estos anuncios son inventados; en la publicidad real, muchas frases son deliberadamente ambiguas."
          },
          {
            "type": "text",
            "v": "Ahora tú: 1) Traduce a lógica «si no estudias, no apruebas» y escribe su contrarrecíproco. ¿Es una afirmación equivalente a «si apruebas, has estudiado»? Compruébalo con Operaciones ▸ Tabla de verdad. 2) Analiza el titular «Todos los que ganan mucho dinero usan este curso; compra el curso y serás rico»: ¿qué falacia es?"
          }
        ],
        "strokes": []
      }
    ]
  }
});
