/* Banco de ejemplos · discreta (cálculo generado con el motor de la app: engine/ops). */
MatIA.ejemplo({
  "id": "discreta-ruta-metro",
  "tema": "discreta",
  "titulo": "La ruta más rápida, como hace el GPS",
  "resumen": "Con el algoritmo de Dijkstra buscamos la ruta más rápida en una red de metro y calles, igual que hace un navegador al calcular tu camino.",
  "board": {
    "title": "Dijkstra: la ruta más rápida",
    "pages": [
      {
        "blocks": [
          {
            "type": "text",
            "v": "Sales de casa y quieres llegar al cine lo antes posible. La red de metro y calles de tu barrio tiene siete puntos y entre cada dos puntos conectados el trayecto tarda un número distinto de minutos (incluyendo andar o hacer transbordo). Hay muchas rutas posibles: ¿cuál es la más rápida? Es el problema que resuelve el GPS de tu móvil cada vez que le pides una ruta, y se resuelve con un algoritmo que lleva el nombre de su inventor, Dijkstra."
          },
          {
            "type": "text",
            "v": "1. Planteamiento: la red como un grafo"
          },
          {
            "type": "net",
            "nodes": [
              {
                "id": "n0",
                "x": 70,
                "y": 200,
                "label": "A",
                "kind": "in"
              },
              {
                "id": "n1",
                "x": 220,
                "y": 70,
                "label": "B",
                "kind": ""
              },
              {
                "id": "n2",
                "x": 220,
                "y": 330,
                "label": "C",
                "kind": ""
              },
              {
                "id": "n3",
                "x": 390,
                "y": 70,
                "label": "D",
                "kind": ""
              },
              {
                "id": "n4",
                "x": 390,
                "y": 330,
                "label": "E",
                "kind": ""
              },
              {
                "id": "n5",
                "x": 560,
                "y": 70,
                "label": "F",
                "kind": ""
              },
              {
                "id": "n6",
                "x": 650,
                "y": 230,
                "label": "G",
                "kind": "out"
              }
            ],
            "edges": [
              {
                "a": "n0",
                "b": "n1",
                "w": "7"
              },
              {
                "a": "n0",
                "b": "n2",
                "w": "4"
              },
              {
                "a": "n1",
                "b": "n2",
                "w": "2"
              },
              {
                "a": "n1",
                "b": "n3",
                "w": "5"
              },
              {
                "a": "n2",
                "b": "n3",
                "w": "9"
              },
              {
                "a": "n2",
                "b": "n4",
                "w": "11"
              },
              {
                "a": "n3",
                "b": "n4",
                "w": "3"
              },
              {
                "a": "n3",
                "b": "n5",
                "w": "8"
              },
              {
                "a": "n4",
                "b": "n5",
                "w": "4"
              },
              {
                "a": "n4",
                "b": "n6",
                "w": "6"
              },
              {
                "a": "n5",
                "b": "n6",
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
            "v": "Cada punto es un nodo y cada tramo una arista con su peso: los minutos del trayecto. Los puntos son: A = Casa, B = Plaza, C = Mercado, D = Parque, E = Estadio, F = Museo y G = Cine. Buscamos el camino de A (Casa) a G (Cine) con peso total mínimo. Probar todas las rutas a mano es agotador (aquí hay muchas), así que Dijkstra lo hace con orden."
          },
          {
            "type": "text",
            "v": "2. Dijkstra paso a paso"
          },
          {
            "type": "text",
            "v": "Idea: guardamos para cada nodo la mejor distancia conocida desde A (al principio ∞, salvo A = 0). En cada paso fijamos el nodo aún no fijado con menor distancia, porque ya no se puede llegar a él más rápido, y actualizamos a sus vecinos. Cada casilla es «distancia (nodo previo)»; «—» significa que el nodo ya está fijado."
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
              "F",
              "G"
            ],
            "rows": [
              [
                "1",
                "A (0)",
                "7 (A)",
                "4 (A)",
                "∞",
                "∞",
                "∞",
                "∞"
              ],
              [
                "2",
                "C (4)",
                "6 (C)",
                "—",
                "13 (C)",
                "15 (C)",
                "∞",
                "∞"
              ],
              [
                "3",
                "B (6)",
                "—",
                "—",
                "11 (B)",
                "15 (C)",
                "∞",
                "∞"
              ],
              [
                "4",
                "D (11)",
                "—",
                "—",
                "—",
                "14 (D)",
                "19 (D)",
                "∞"
              ],
              [
                "5",
                "E (14)",
                "—",
                "—",
                "—",
                "—",
                "18 (E)",
                "20 (E)"
              ],
              [
                "6",
                "F (18)",
                "—",
                "—",
                "—",
                "—",
                "—",
                "20 (E)"
              ],
              [
                "7",
                "G (20)",
                "—",
                "—",
                "—",
                "—",
                "—",
                "—"
              ]
            ],
            "vbar": 2,
            "caption": "Distancias provisionales desde A en cada paso del algoritmo (minutos)",
            "kind": ""
          },
          {
            "type": "text",
            "v": "Un ejemplo de cómo se actualiza: en el paso 2 se fija C, Mercado (4). Desde allí, B (Plaza) se alcanza en 4 + 2 = 6 min, que mejora los 7 min directos desde A, así que se actualiza a «6 (C)». En el paso 3, con B fijado, D (Parque) pasa de 13 a 6 + 5 = 11."
          },
          {
            "type": "text",
            "v": "3. La respuesta"
          },
          {
            "type": "deriv",
            "rows": [
              {
                "l": "d(A,G)",
                "r": "4+2+5+3+6=20\\ \\text{min}",
                "note": "Reconstruimos hacia atrás con los nodos previos: G ← E ← D ← B ← C ← A",
                "boxed": true
              },
              {
                "l": "\\text{Ruta}",
                "r": "A\\to C\\to B\\to D\\to E\\to G",
                "note": "Casa, Mercado, Plaza, Parque, Estadio, Cine: cinco tramos. Ir a Plaza directamente (7 min) parece natural, pero no es lo mejor",
                "boxed": false
              },
              {
                "l": "A\\to C\\to E\\to G",
                "r": "4+11+6=21",
                "note": "Una alternativa más larga: Dijkstra garantiza que ninguna ruta baja de 20 minutos",
                "boxed": false
              },
              {
                "l": "A\\to B\\to D\\to F\\to G",
                "r": "7+5+8+3=23",
                "note": "Otra alternativa, todavía más larga",
                "boxed": false
              }
            ]
          },
          {
            "type": "text",
            "v": "Como bonus, la tabla da las distancias mínimas desde Casa a todos los puntos a la vez: C (Mercado) 4, B (Plaza) 6, D (Parque) 11, E (Estadio) 14, F (Museo) 18 y G (Cine) 20 minutos."
          },
          {
            "type": "text",
            "v": "4. ¿Y el GPS de verdad?"
          },
          {
            "type": "text",
            "v": "Los navegadores usan versiones muy mejoradas de esta misma idea. La red de carreteras de un país tiene millones de nodos (cruces) y aristas (tramos), con pesos que no son solo la distancia sino el tiempo estimado según el tráfico, los semáforos o las obras. Para no examinar millones de nodos usan variantes que dirigen la búsqueda hacia el destino (como el algoritmo A*) y atajos precalculados. Y cuando hay un atasco, el grafo cambia sus pesos y la ruta se recalcula al instante."
          },
          {
            "type": "text",
            "v": "Ahora tú: 1) Doble clic sobre un peso para cambiarlo: pon E–G (Estadio–Cine) = 12 y repite el algoritmo por tu cuenta, ¿cambia la ruta? 2) Suprime el tramo B–C (Plaza–Mercado, obras): ¿cuál es ahora la ruta más rápida y cuánto tarda?"
          }
        ],
        "strokes": []
      }
    ]
  }
});
