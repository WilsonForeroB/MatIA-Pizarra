/* Banco de ejemplos · discreta (cálculo generado con el motor de la app: engine/ops). */
MatIA.ejemplo({
  "id": "discreta-redes-sociales",
  "tema": "discreta",
  "titulo": "Encuesta en clase: ¿quién usa cada red social?",
  "resumen": "Con tres conjuntos y el principio de inclusión-exclusión contamos cuántos alumnos usan una, dos o tres redes y cuántos ninguna, con su diagrama de Venn.",
  "board": {
    "title": "Conjuntos: encuesta sobre redes sociales",
    "pages": [
      {
        "blocks": [
          {
            "type": "text",
            "v": "En una clase de 30 alumnos se hace una encuesta anónima sobre qué redes sociales usan. Para no dar nombres de aplicaciones, las llamamos por lo que hacen: A = una red de vídeos cortos, B = una red de fotos, C = una app de mensajería. Cada alumno tiene su número de lista, del 1 al 30 (el conjunto total U), y cada conjunto recoge a quienes usan esa red. Con eso se pueden responder preguntas muy útiles, por ejemplo las que se hace una empresa que quiere anunciarse: ¿a cuánta gente llega usando las tres redes?, ¿cuántos usan solo una?, ¿cuántos no usan ninguna?"
          },
          {
            "type": "text",
            "v": "1. Los datos de la encuesta"
          },
          {
            "type": "math",
            "v": "A=\\left\\lbrace 1,2,3,4,5,6,7,8,9,10,11,12,13,17,18,19\\right\\rbrace"
          },
          {
            "type": "math",
            "v": "B=\\left\\lbrace 1,2,3,4,5,6,14,15,16,20\\right\\rbrace"
          },
          {
            "type": "math",
            "v": "C=\\left\\lbrace 1,2,3,4,7,8,9,10,11,12,13,14,15,16,21,22,23,24,25,26\\right\\rbrace"
          },
          {
            "type": "text",
            "v": "2. Cardinales (Operaciones ▸ Operar conjuntos, escribiendo |A|, |A ∩ B|, etc.)"
          },
          {
            "type": "math",
            "v": "|A|=16",
            "result": true
          },
          {
            "type": "math",
            "v": "|B|=10",
            "result": true
          },
          {
            "type": "math",
            "v": "|C|=20",
            "result": true
          },
          {
            "type": "math",
            "v": "|A\\cap B|=6",
            "result": true
          },
          {
            "type": "math",
            "v": "|A\\cap C|=11",
            "result": true
          },
          {
            "type": "math",
            "v": "|B\\cap C|=7",
            "result": true
          },
          {
            "type": "math",
            "v": "|A\\cap B\\cap C|=4",
            "result": true
          },
          {
            "type": "text",
            "v": "3. Principio de inclusión-exclusión: ¿cuántos usan al menos una red?"
          },
          {
            "type": "text",
            "v": "Si sumamos |A| + |B| + |C| contamos dos veces a quien usa dos redes y tres veces a quien usa las tres. Restamos las intersecciones de dos en dos, pero entonces los que usan las tres quedan restados de más, así que se vuelven a sumar:"
          },
          {
            "type": "deriv",
            "rows": [
              {
                "l": "|A\\cup B\\cup C|",
                "r": "|A|+|B|+|C|",
                "note": "Fórmula de inclusión-exclusión para tres conjuntos: sumamos los tres cardinales",
                "boxed": false
              },
              {
                "l": "",
                "r": "-|A\\cap B|-|A\\cap C|-|B\\cap C|+|A\\cap B\\cap C|",
                "note": "Restamos las intersecciones dobles y sumamos la triple",
                "boxed": false
              },
              {
                "l": "",
                "r": "16+10+20-6-11-7+4=26",
                "note": "Sustituimos los cardinales de la encuesta",
                "boxed": true
              },
              {
                "l": "\\text{Ninguna red}",
                "r": "30-26=4",
                "note": "Los que quedan fuera de la unión: el complementario de A ∪ B ∪ C",
                "boxed": false
              }
            ]
          },
          {
            "type": "math",
            "v": "|A\\cup B\\cup C|=26",
            "result": true
          },
          {
            "type": "text",
            "v": "El motor confirma el 26. Así que 26 de los 30 alumnos usan al menos una red y 4 no usan ninguna."
          },
          {
            "type": "text",
            "v": "4. ¿Cuántos usan solo una? Ir zona por zona"
          },
          {
            "type": "text",
            "v": "Para quedarnos con los que usan una sola red hay que quitar de |A| a los que están también en B o en C, cuidando de no quitar dos veces a los de las tres:"
          },
          {
            "type": "deriv",
            "rows": [
              {
                "l": "\\text{Solo A}",
                "r": "|A|-|A\\cap B|-|A\\cap C|",
                "note": "Vídeos cortos y nada más: quitamos los que están también en B o en C",
                "boxed": false
              },
              {
                "l": "",
                "r": "+|A\\cap B\\cap C|=16-6-11+4=3",
                "note": "Sumamos de nuevo los de las tres, que hemos quitado dos veces",
                "boxed": false
              },
              {
                "l": "\\text{Solo B}",
                "r": "10-6-7+4=1",
                "note": "Solo fotos",
                "boxed": false
              },
              {
                "l": "\\text{Solo C}",
                "r": "20-11-7+4=6",
                "note": "Solo mensajería",
                "boxed": false
              },
              {
                "l": "\\text{Solo una red}",
                "r": "3+1+6=10",
                "note": "Suma de las tres zonas",
                "boxed": true
              },
              {
                "l": "\\text{Exactamente dos}",
                "r": "2+7+3=12",
                "note": "(6−4) + (11−4) + (7−4): a cada intersección doble le quitamos los 4 que usan las tres",
                "boxed": false
              },
              {
                "l": "\\text{Comprobación}",
                "r": "10+12+4+4=30",
                "note": "Una + dos + las tres + ninguna = toda la clase",
                "boxed": true
              }
            ]
          },
          {
            "type": "venn",
            "n": 3,
            "expr": "(A\\setminus(B\\cup C))\\cup(B\\setminus(A\\cup C))\\cup(C\\setminus(A\\cup B))",
            "shade": [],
            "showEls": true,
            "align": "center"
          },
          {
            "type": "text",
            "v": "El diagrama sombrea a los que usan solo una red: en cada círculo, la parte que no se solapa con los demás. Los números son los alumnos de cada zona. Fuera de los círculos están los 4 que no usan ninguna (los números 27 a 30, que no se escriben porque la clase completa no cabe en una línea). Los 10 alumnos que usan una sola red son los números 17 a 26."
          },
          {
            "type": "text",
            "v": "5. La respuesta"
          },
          {
            "type": "text",
            "v": "De los 30 alumnos: 10 usan una sola red, 12 usan exactamente dos, 4 usan las tres y 4 no usan ninguna (10 + 12 + 4 + 4 = 30). La mensajería es la más extendida (20 de 30, un 67 %) y la red de fotos la menos (10 de 30, un tercio). Los números de este ejemplo son inventados; en encuestas reales los porcentajes dependen mucho de la edad y del año."
          },
          {
            "type": "text",
            "v": "Ahora tú: 1) Haz tu propia encuesta en clase con tres redes o apps (o con tres deportes) y escribe los conjuntos con los números de lista; calcula |A ∪ B ∪ C| con Operaciones ▸ Operar conjuntos y comprueba la fórmula de inclusión-exclusión. 2) Escribe en el diagrama de Venn la expresión (A ∩ B) ∖ C: ¿cuántos usan vídeos cortos y fotos pero no mensajería? (Por la fórmula: 6 − 4.)"
          }
        ],
        "strokes": []
      }
    ]
  }
});
