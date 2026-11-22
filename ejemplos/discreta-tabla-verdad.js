/* Ejemplo del banco (formato en ejemplos/LEEME.md). Bloques generados con el motor de la app. */
MatIA.ejemplo({
  "id": "discreta-tabla-verdad",
  "tema": "discreta",
  "titulo": "Tablas de verdad: contrarrecíproco y recíproco",
  "resumen": "Con dos tablas de verdad se ve que una implicación equivale a su contrarrecíproco, pero no a su recíproco.",
  "board": {
    "title": "Tablas de verdad",
    "pages": [
      {
        "blocks": [
          {
            "type": "text",
            "v": "«Si llueve (p), el suelo se moja (q)». ¿Es lo mismo que «si el suelo no está mojado, no ha llovido»? ¿Y que «si el suelo está mojado, ha llovido»? Lo comprobamos con «Operaciones ▸ Tabla de verdad». Prueba con otras fórmulas, como ¬(p ∧ q) ⇔ (¬p ∨ ¬q) (ley de De Morgan)."
          },
          {
            "type": "math",
            "v": "(p\\Rightarrow q)\\Leftrightarrow(\\neg q\\Rightarrow\\neg p)"
          },
          {
            "type": "table",
            "head": [
              "p",
              "q",
              "p → q",
              "¬q",
              "¬p",
              "¬q → ¬p",
              "(p → q) ↔ (¬q → ¬p)"
            ],
            "rows": [
              [
                "V",
                "V",
                "V",
                "F",
                "F",
                "V",
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
                "V",
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
            "caption": "Tautología: siempre verdadera",
            "lastBold": true
          },
          {
            "type": "text",
            "v": "Tautología: p ⇒ q y su contrarrecíproco ¬q ⇒ ¬p dicen lo mismo. Por eso se puede demostrar un teorema probando su contrarrecíproco."
          },
          {
            "type": "math",
            "v": "(p\\Rightarrow q)\\Leftrightarrow(q\\Rightarrow p)"
          },
          {
            "type": "table",
            "head": [
              "p",
              "q",
              "p → q",
              "q → p",
              "(p → q) ↔ (q → p)"
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
                "V",
                "F"
              ],
              [
                "F",
                "V",
                "V",
                "F",
                "F"
              ],
              [
                "F",
                "F",
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
            "v": "Contingencia: el recíproco q ⇒ p no equivale a p ⇒ q (filas 2 y 3). El suelo puede estar mojado porque alguien lo ha regado."
          }
        ],
        "strokes": []
      }
    ]
  }
});
