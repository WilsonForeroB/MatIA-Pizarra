/* Ejemplo del banco (formato en ejemplos/LEEME.md). Bloques generados con el motor de la app. */
MatIA.ejemplo({
  "id": "discreta-camino-minimo",
  "tema": "discreta",
  "titulo": "Camino mínimo en un grafo (Dijkstra)",
  "resumen": "El algoritmo de Dijkstra paso a paso para encontrar la ruta más corta entre dos nodos de un grafo con pesos.",
  "board": {
    "title": "Camino mínimo: algoritmo de Dijkstra",
    "pages": [
      {
        "blocks": [
          {
            "type": "text",
            "v": "Cada arista indica los minutos que se tarda entre dos puntos. ¿Cuál es el camino más rápido de A a F? Prueba a arrastrar los nodos, cambiar un peso con doble clic (por ejemplo B–D = 1) y repetir la tabla."
          },
          {
            "type": "net",
            "nodes": [
              {
                "id": "nA",
                "x": 90,
                "y": 200,
                "label": "A",
                "kind": "in"
              },
              {
                "id": "nB",
                "x": 270,
                "y": 70,
                "label": "B",
                "kind": ""
              },
              {
                "id": "nC",
                "x": 270,
                "y": 330,
                "label": "C",
                "kind": ""
              },
              {
                "id": "nD",
                "x": 450,
                "y": 70,
                "label": "D",
                "kind": ""
              },
              {
                "id": "nE",
                "x": 450,
                "y": 330,
                "label": "E",
                "kind": ""
              },
              {
                "id": "nF",
                "x": 630,
                "y": 200,
                "label": "F",
                "kind": "out"
              }
            ],
            "edges": [
              {
                "a": "nA",
                "b": "nB",
                "w": "4"
              },
              {
                "a": "nA",
                "b": "nC",
                "w": "2"
              },
              {
                "a": "nB",
                "b": "nC",
                "w": "1"
              },
              {
                "a": "nB",
                "b": "nD",
                "w": "5"
              },
              {
                "a": "nC",
                "b": "nD",
                "w": "8"
              },
              {
                "a": "nC",
                "b": "nE",
                "w": "10"
              },
              {
                "a": "nD",
                "b": "nE",
                "w": "2"
              },
              {
                "a": "nD",
                "b": "nF",
                "w": "6"
              },
              {
                "a": "nE",
                "b": "nF",
                "w": "3"
              }
            ],
            "caps": [],
            "directed": false,
            "h": 400,
            "align": "center"
          },
          {
            "type": "text",
            "v": "Dijkstra: en cada paso fijamos el nodo no fijado con menor distancia provisional y actualizamos a sus vecinos. Cada casilla es «distancia (nodo previo)»; la negrita es el nodo que se fija."
          },
          {
            "type": "table",
            "head": [
              "Paso",
              "Se fija",
              "B",
              "C",
              "D",
              "E",
              "F"
            ],
            "rows": [
              [
                "1",
                "A (0)",
                "4 (A)",
                "2 (A)",
                "∞",
                "∞",
                "∞"
              ],
              [
                "2",
                "C (2)",
                "3 (C)",
                "—",
                "10 (C)",
                "12 (C)",
                "∞"
              ],
              [
                "3",
                "B (3)",
                "—",
                "—",
                "8 (B)",
                "12 (C)",
                "∞"
              ],
              [
                "4",
                "D (8)",
                "—",
                "—",
                "—",
                "10 (D)",
                "14 (D)"
              ],
              [
                "5",
                "E (10)",
                "—",
                "—",
                "—",
                "—",
                "13 (E)"
              ],
              [
                "6",
                "F (13)",
                "—",
                "—",
                "—",
                "—",
                "—"
              ]
            ],
            "vbar": 2,
            "caption": "Distancias provisionales desde A en cada paso del algoritmo",
            "kind": ""
          },
          {
            "type": "deriv",
            "rows": [
              {
                "l": "d(A,F)",
                "r": "2+1+5+2+3=13",
                "note": "Reconstruimos el camino hacia atrás: F ← E ← D ← B ← C ← A",
                "boxed": true
              },
              {
                "l": "\\text{Camino}",
                "r": "A\\to C\\to B\\to D\\to E\\to F",
                "note": "Tiene 5 aristas y es más corto que A → B → D → F (15) o que A → C → E → F (15)",
                "boxed": false
              }
            ]
          }
        ],
        "strokes": []
      }
    ]
  }
});
