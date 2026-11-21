/* Ejemplo del banco (formato en ejemplos/LEEME.md). Bloques generados con el motor de la app. */
MatIA.ejemplo({
  "id": "estadistica-normal-alturas",
  "tema": "estadistica",
  "titulo": "Distribución normal: área entre dos valores",
  "resumen": "Tipificar y usar la tabla de la normal para calcular P(a ≤ X ≤ b) y una cola, con el área sombreada bajo la campana.",
  "board": {
    "title": "Distribución normal: alturas",
    "pages": [
      {
        "blocks": [
          {
            "type": "text",
            "v": "La altura de los alumnos de un instituto sigue una normal de media 170 cm y desviación típica 8 cm. ¿Qué proporción mide entre 160 y 185 cm? ¿Y más de 185 cm? Prueba a cambiar σ por 4 o por 12 y observa cómo se estrecha o se ensancha la campana."
          },
          {
            "type": "math",
            "v": "X\\sim N(170,8),\\ P(160\\le X\\le 185)"
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
                "l": "P(160\\le X\\le 185)",
                "r": "P\\left(-1.25\\le Z\\le 1.88\\right)",
                "note": "Tipificamos los dos extremos: z = (x − μ)/σ",
                "boxed": false
              },
              {
                "l": "",
                "r": "\\Phi(1.88)-\\Phi(-1.25)=0.9696-0.1056\\approx 0.864",
                "note": "",
                "boxed": true
              },
              {
                "l": "\\text{En porcentaje}",
                "r": "86.4\\%",
                "note": "Aproximadamente",
                "boxed": false
              }
            ]
          },
          {
            "type": "chart",
            "kind": "normal",
            "title": "N(170, 8): área sombreada ≈ 0,864",
            "mu": 170,
            "sigma": 8,
            "a": 160,
            "b": 185
          },
          {
            "type": "math",
            "v": "X\\sim N(170,8),\\ P(X\\ge 185)"
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
                "l": "P(X\\ge 185)",
                "r": "1-P\\left(Z\\le \\frac{185-170}{8}=1.88\\right)",
                "note": "Complementario: 1 menos la cola izquierda",
                "boxed": false
              },
              {
                "l": "",
                "r": "1-\\Phi(1.88)=1-0.9696\\approx 0.0304",
                "note": "",
                "boxed": true
              },
              {
                "l": "\\text{En porcentaje}",
                "r": "3.04\\%",
                "note": "Aproximadamente",
                "boxed": false
              }
            ]
          },
          {
            "type": "chart",
            "kind": "normal",
            "title": "N(170, 8): área sombreada ≈ 0,0304",
            "mu": 170,
            "sigma": 8,
            "a": 185,
            "b": null
          }
        ],
        "strokes": []
      }
    ]
  }
});
