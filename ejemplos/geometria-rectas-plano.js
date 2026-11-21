/* Ejemplo del banco (formato en ejemplos/LEEME.md). Bloques generados con el motor de la app. */
MatIA.ejemplo({
  "id": "geometria-rectas-plano",
  "tema": "geometria",
  "titulo": "Rectas en el plano",
  "resumen": "Posición relativa, punto de corte y ángulo de dos rectas; distancia de un punto a una recta, paralela y perpendicular.",
  "board": {
    "title": "Rectas en el plano",
    "pages": [
      {
        "blocks": [
          {
            "type": "text",
            "v": "Dos rectas en forma general ax + by + c = 0: ¿se cortan?, ¿dónde?, ¿con qué ángulo? Prueba a cambiar la segunda por 4x+2y-3=0 (¿qué pasa ahora?) y aplica «Operaciones ▸ Rectas: posición, paralelas y distancias»."
          },
          {
            "type": "math",
            "v": "2x+y-8=0,\\ x-y+2=0"
          },
          {
            "type": "deriv",
            "rows": [
              {
                "l": "r",
                "r": "2x+y-8=0",
                "note": "Explícita: y = -2x+8, pendiente m = -2; vector normal (2, 1)",
                "boxed": false
              },
              {
                "l": "s",
                "r": "x-y+2=0",
                "note": "Explícita: y = x+2, pendiente m = 1; vector normal (1, -1)",
                "boxed": false
              },
              {
                "l": "\\frac{a_1}{a_2},\\ \\frac{b_1}{b_2},\\ \\frac{c_1}{c_2}",
                "r": "\\frac{2}{1},\\ \\frac{1}{-1},\\ \\frac{-8}{2}",
                "note": "Comparamos los coeficientes: si a y b no son proporcionales se cortan; si lo son, paralelas o coincidentes según c",
                "boxed": false
              },
              {
                "l": "\\text{Posición}",
                "r": "\\text{secantes}",
                "note": "a₁b₂ − a₂b₁ = -3 ≠ 0: se cortan en un punto",
                "boxed": true
              },
              {
                "l": "\\begin{cases}2x+y-8=0\\\\x-y+2=0\\end{cases}",
                "r": "x=2,\\ y=4",
                "note": "Punto de corte resolviendo el sistema (Cramer: det = -3)",
                "boxed": false
              },
              {
                "l": "\\cos\\varphi",
                "r": "\\frac{\\left|a_1a_2+b_1b_2\\right|}{\\sqrt{a_1^{2}+b_1^{2}}\\,\\sqrt{a_2^{2}+b_2^{2}}}=\\frac{1}{\\sqrt{5}\\,\\sqrt{2}}",
                "note": "Ángulo entre las rectas (el agudo) con sus vectores normales",
                "boxed": false
              },
              {
                "l": "\\varphi",
                "r": "\\arccos\\left(0.3162\\right)\\approx 71.57^{\\circ}",
                "note": "",
                "boxed": true
              }
            ]
          },
          {
            "type": "geo",
            "kind": "lines",
            "lines": [
              {
                "a": 2,
                "b": 1,
                "c": -8,
                "name": "r",
                "dash": false
              },
              {
                "a": 1,
                "b": -1,
                "c": 2,
                "name": "s",
                "dash": false
              }
            ],
            "points": [
              {
                "x": 2,
                "y": 4,
                "name": "P",
                "kind": "cut"
              }
            ]
          }
        ],
        "strokes": []
      },
      {
        "blocks": [
          {
            "type": "text",
            "v": "Una recta y un punto: distancia del punto a la recta, paralela y perpendicular por el punto y pie de la perpendicular H. Prueba con un punto que esté en la recta, como P = (2, 1)."
          },
          {
            "type": "math",
            "v": "3x+4y=10,\\ P=(5,\\ 6)"
          },
          {
            "type": "deriv",
            "rows": [
              {
                "l": "r",
                "r": "3x+4y-10=0",
                "note": "Explícita: y = -3/4x+5/2, pendiente m = -3/4; vector normal (3, 4)",
                "boxed": false
              },
              {
                "l": "d(P,r)",
                "r": "\\frac{\\left|ax_0+by_0+c\\right|}{\\sqrt{a^{2}+b^{2}}}=\\frac{\\left|3\\cdot 5+4\\cdot 6-10\\right|}{\\sqrt{25}}=\\frac{29}{5}",
                "note": "Distancia de un punto a una recta",
                "boxed": true
              },
              {
                "l": "r'\\parallel r",
                "r": "3x+4y-39=0",
                "note": "Paralela por P: mismos a y b; c sale de sustituir P",
                "boxed": false
              },
              {
                "l": "r''\\perp r",
                "r": "4x-3y-2=0",
                "note": "Perpendicular por P: intercambiamos a y b y cambiamos un signo (bx − ay + c = 0)",
                "boxed": false
              },
              {
                "l": "H",
                "r": "\\left(\\frac{38}{25},\\ \\frac{34}{25}\\right)",
                "note": "Pie de la perpendicular (proyección de P sobre r)",
                "boxed": false
              }
            ]
          },
          {
            "type": "geo",
            "kind": "lines",
            "lines": [
              {
                "a": 3,
                "b": 4,
                "c": -10,
                "name": "r",
                "dash": false
              },
              {
                "a": 3,
                "b": 4,
                "c": -39,
                "name": "r′",
                "dash": true
              },
              {
                "a": 4,
                "b": -3,
                "c": -2,
                "name": "r″",
                "dash": true
              }
            ],
            "points": [
              {
                "x": 5,
                "y": 6,
                "name": "P"
              },
              {
                "x": 1.52,
                "y": 1.36,
                "name": "H",
                "kind": "mid"
              }
            ]
          }
        ],
        "strokes": []
      }
    ]
  }
});
