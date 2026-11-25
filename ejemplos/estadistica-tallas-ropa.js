/* Banco de ejemplos · estadistica (cálculo generado con el motor de la app: engine/ops). */
MatIA.ejemplo({
  "id": "estadistica-tallas-ropa",
  "tema": "estadistica",
  "titulo": "¿Cuántas camisetas de cada talla debe pedir una tienda?",
  "resumen": "Con una distribución normal de alturas calculamos qué proporción de clientes lleva cada talla y repartimos un pedido de 1000 camisetas.",
  "board": {
    "title": "¿Cuántas camisetas de cada talla debe pedir una tienda?",
    "pages": [
      {
        "blocks": [
          {
            "type": "text",
            "v": "Una tienda de ropa quiere encargar 1000 camisetas para el verano. Cada talla se elige según la altura de la persona y la tienda no puede fabricar todas por igual: si encarga demasiadas XL se quedará con montones sin vender, y si encarga pocas M se quedará sin género a los dos días. La altura de los adultos jóvenes se puede modelar con una distribución normal de media 170 cm y desviación típica 8 cm. ¿Cuántas camisetas de cada talla debe pedir?"
          },
          {
            "type": "text",
            "v": "1. Planteamiento: de las alturas a las tallas"
          },
          {
            "type": "table",
            "head": [
              "Talla",
              "Altura (cm)"
            ],
            "rows": [
              [
                "XS",
                "menos de 160"
              ],
              [
                "S",
                "de 160 a 168"
              ],
              [
                "M",
                "de 168 a 176"
              ],
              [
                "L",
                "de 176 a 184"
              ],
              [
                "XL",
                "más de 184"
              ]
            ],
            "vbar": 1,
            "kind": "",
            "caption": "Reparto de tallas por altura (un modelo sencillo para el ejemplo)"
          },
          {
            "type": "text",
            "v": "Llamamos X a la altura de una persona: X ~ N(170, 8). La proporción de personas de cada talla es la probabilidad de que X caiga en su intervalo. Para calcularla tipificamos, Z = (X − 170)/8, y usamos la tabla de la normal estándar Φ."
          },
          {
            "type": "text",
            "v": "2. Probabilidad de cada talla (Operaciones ▸ Distribución normal, con la línea X ~ N(170, 8), P(160 ≤ X ≤ 168))"
          },
          {
            "type": "math",
            "v": "X\\sim N(170,\\ 8),\\ P(X\\le 160)"
          },
          {
            "type": "deriv",
            "rows": [
              {
                "l": "\\text{Modelo}",
                "r": "X\\sim N(170,\\ 8)",
                "note": "Normal de media μ = 170 y desviación típica σ = 8",
                "boxed": false
              },
              {
                "l": "Z",
                "r": "\\frac{X-\\mu}{\\sigma}\\sim N(0,1)",
                "note": "Tipificamos para usar la normal estándar",
                "boxed": false
              },
              {
                "l": "P(X\\le 160)",
                "r": "P\\left(Z\\le \\frac{160-170}{8}=-1{,}25\\right)",
                "note": "Tipificamos",
                "boxed": false
              },
              {
                "l": "",
                "r": "\\Phi(-1{,}25)\\approx 0{,}1056",
                "note": "Con tablas: Φ(−z) = 1 − Φ(z)",
                "boxed": true
              },
              {
                "l": "\\text{Talla }XS",
                "r": "10{,}56\\%",
                "note": "Aproximadamente",
                "boxed": false
              }
            ]
          },
          {
            "type": "math",
            "v": "X\\sim N(170,\\ 8),\\ P(160\\le X\\le 168)"
          },
          {
            "type": "deriv",
            "rows": [
              {
                "l": "P(160\\le X\\le 168)",
                "r": "P\\left(-1{,}25\\le Z\\le -0{,}25\\right)",
                "note": "Tipificamos los dos extremos: z = (x − μ)/σ",
                "boxed": false
              },
              {
                "l": "",
                "r": "\\Phi(-0{,}25)-\\Phi(-1{,}25)",
                "note": "Valores de Φ en la tabla de la normal estándar",
                "boxed": false
              },
              {
                "l": "",
                "r": "0{,}4013-0{,}1056\\approx 0{,}2956",
                "note": "Restamos las probabilidades acumuladas",
                "boxed": true
              },
              {
                "l": "\\text{Talla }S",
                "r": "29{,}56\\%",
                "note": "Aproximadamente",
                "boxed": false
              }
            ]
          },
          {
            "type": "math",
            "v": "X\\sim N(170,\\ 8),\\ P(168\\le X\\le 176)"
          },
          {
            "type": "deriv",
            "rows": [
              {
                "l": "P(168\\le X\\le 176)",
                "r": "P\\left(-0{,}25\\le Z\\le 0{,}75\\right)",
                "note": "Tipificamos los dos extremos: z = (x − μ)/σ",
                "boxed": false
              },
              {
                "l": "",
                "r": "\\Phi(0{,}75)-\\Phi(-0{,}25)",
                "note": "Valores de Φ en la tabla de la normal estándar",
                "boxed": false
              },
              {
                "l": "",
                "r": "0{,}7734-0{,}4013\\approx 0{,}3721",
                "note": "Restamos las probabilidades acumuladas",
                "boxed": true
              },
              {
                "l": "\\text{Talla }M",
                "r": "37{,}21\\%",
                "note": "Aproximadamente",
                "boxed": false
              }
            ]
          },
          {
            "type": "chart",
            "kind": "normal",
            "title": "N(170, 8): área sombreada ≈ 0,3721",
            "mu": 170,
            "sigma": 8,
            "a": 168,
            "b": 176
          },
          {
            "type": "math",
            "v": "X\\sim N(170,\\ 8),\\ P(176\\le X\\le 184)"
          },
          {
            "type": "deriv",
            "rows": [
              {
                "l": "P(176\\le X\\le 184)",
                "r": "P\\left(0{,}75\\le Z\\le 1{,}75\\right)",
                "note": "Tipificamos los dos extremos: z = (x − μ)/σ",
                "boxed": false
              },
              {
                "l": "",
                "r": "\\Phi(1{,}75)-\\Phi(0{,}75)",
                "note": "Valores de Φ en la tabla de la normal estándar",
                "boxed": false
              },
              {
                "l": "",
                "r": "0{,}9599-0{,}7734\\approx 0{,}1866",
                "note": "Restamos las probabilidades acumuladas",
                "boxed": true
              },
              {
                "l": "\\text{Talla }L",
                "r": "18{,}66\\%",
                "note": "Aproximadamente",
                "boxed": false
              }
            ]
          },
          {
            "type": "math",
            "v": "X\\sim N(170,\\ 8),\\ P(X\\ge 184)"
          },
          {
            "type": "deriv",
            "rows": [
              {
                "l": "P(X\\ge 184)",
                "r": "1-P\\left(Z\\le \\frac{184-170}{8}=1{,}75\\right)",
                "note": "Complementario: 1 menos la cola izquierda",
                "boxed": false
              },
              {
                "l": "",
                "r": "1-\\Phi(1{,}75)",
                "note": "Valores de Φ en la tabla de la normal estándar",
                "boxed": false
              },
              {
                "l": "",
                "r": "1-0{,}9599\\approx 0{,}0401",
                "note": "Restamos las probabilidades acumuladas",
                "boxed": true
              },
              {
                "l": "\\text{Talla }XL",
                "r": "4{,}01\\%",
                "note": "Aproximadamente",
                "boxed": false
              }
            ]
          },
          {
            "type": "text",
            "v": "Fíjate en el gráfico de la talla M: el área sombreada bajo la campana es la proporción de personas que miden entre 168 y 176 cm."
          },
          {
            "type": "text",
            "v": "3. La respuesta: el pedido de 1000 camisetas"
          },
          {
            "type": "table",
            "head": [
              "Talla",
              "Probabilidad",
              "Camisetas"
            ],
            "rows": [
              [
                "XS",
                "0,1056",
                "106"
              ],
              [
                "S",
                "0,2956",
                "296"
              ],
              [
                "M",
                "0,3721",
                "372"
              ],
              [
                "L",
                "0,1866",
                "186"
              ],
              [
                "XL",
                "0,0401",
                "40"
              ],
              [
                "Total",
                "1",
                "1000"
              ]
            ],
            "vbar": 1,
            "hline": 4,
            "kind": "",
            "caption": "1000 × probabilidad, redondeando para que sumen 1000"
          },
          {
            "type": "chart",
            "kind": "bars",
            "title": "Pedido de 1000 camisetas por talla",
            "labels": [
              "XS",
              "S",
              "M",
              "L",
              "XL"
            ],
            "values": [
              106,
              296,
              372,
              186,
              40
            ],
            "ylabel": "camisetas"
          },
          {
            "type": "text",
            "v": "La talla M es la más pedida (unas 372), pero S y L juntas suman más de 480. Las tallas de los extremos, XS y XL, son las menos vendidas: así se ve que las alturas muy bajas o muy altas son raras en una normal. Ten en cuenta que 1000 × 0,0401 ≈ 40 es un valor esperado: en una tienda real pueden venderse 35 o 45, no exactamente 40."
          },
          {
            "type": "text",
            "v": "4. ¿Y en la vida real?"
          },
          {
            "type": "text",
            "v": "Es un modelo muy simplificado. En la realidad, la estatura media de los hombres jóvenes en España ronda los 175 cm y la de las mujeres, los 162-163 cm, así que una sola campana N(170, 8) mezcla dos grupos; y la talla de una camiseta depende del contorno del pecho más que de la altura. Por eso las tiendas usan datos de sus propias ventas para ajustar el pedido. Aun así, la idea de fondo, repartir un pedido según un modelo de probabilidad, sí se usa de verdad."
          },
          {
            "type": "text",
            "v": "Ahora tú: 1) Cambia la desviación típica 8 por 6 (clientes más parecidos entre sí) y repite Operaciones ▸ Distribución normal para la talla M: ¿pide ahora más o menos camisetas M? 2) Si la tienda se dirige a un público más alto, N(176, 8), ¿cuántas XL (más de 184 cm) debería pedir? Calcula P(X ≥ 184) y multiplica por 1000."
          }
        ],
        "strokes": []
      }
    ]
  }
});
