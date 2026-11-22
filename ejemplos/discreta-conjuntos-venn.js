/* Ejemplo del banco (formato en ejemplos/LEEME.md). Bloques generados con el motor de la app. */
MatIA.ejemplo({
  "id": "discreta-conjuntos-venn",
  "tema": "discreta",
  "titulo": "Operaciones con conjuntos y diagrama de Venn",
  "resumen": "Unión, intersección, diferencia, complementario y cardinal, con el diagrama de Venn que sombrea cada operación.",
  "board": {
    "title": "Conjuntos: números del 1 al 10",
    "pages": [
      {
        "blocks": [
          {
            "type": "text",
            "v": "U son los números del 1 al 10, A los pares y B los primos. Cada resultado se ha obtenido con «Operaciones ▸ Operar conjuntos». Prueba a escribir otra expresión en el diagrama, como A ∩ B o (A ∪ B)ᶜ, o a cambiar los elementos de B."
          },
          {
            "type": "math",
            "v": "U=\\left\\lbrace 1,2,3,4,5,6,7,8,9,10\\right\\rbrace"
          },
          {
            "type": "math",
            "v": "A=\\left\\lbrace 2,4,6,8,10\\right\\rbrace"
          },
          {
            "type": "math",
            "v": "B=\\left\\lbrace 2,3,5,7\\right\\rbrace"
          },
          {
            "type": "math",
            "v": "A\\cup B=\\left\\lbrace 2,\\ 3,\\ 4,\\ 5,\\ 6,\\ 7,\\ 8,\\ 10\\right\\rbrace ",
            "result": true
          },
          {
            "type": "math",
            "v": "A\\cap B=\\left\\lbrace 2\\right\\rbrace ",
            "result": true
          },
          {
            "type": "math",
            "v": "A\\setminus B=\\left\\lbrace 4,\\ 6,\\ 8,\\ 10\\right\\rbrace ",
            "result": true
          },
          {
            "type": "math",
            "v": "B\\setminus A=\\left\\lbrace 3,\\ 5,\\ 7\\right\\rbrace ",
            "result": true
          },
          {
            "type": "math",
            "v": "\\left(A\\cup B\\right)^{c}=\\left\\lbrace 1,\\ 9\\right\\rbrace ",
            "result": true
          },
          {
            "type": "math",
            "v": "|A\\cup B|=8",
            "result": true
          },
          {
            "type": "text",
            "v": "Fíjate: |A ∪ B| = |A| + |B| − |A ∩ B| = 5 + 4 − 1 = 8. El diagrama sombrea A ∖ B: los pares que no son primos."
          },
          {
            "type": "venn",
            "n": 2,
            "expr": "A\\setminus B",
            "shade": [],
            "showEls": true,
            "align": "center"
          }
        ],
        "strokes": []
      }
    ]
  }
});
