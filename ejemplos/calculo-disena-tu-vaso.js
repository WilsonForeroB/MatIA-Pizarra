/* Banco de ejemplos · calculo (los cálculos los genera el motor de la app: engine/ops). */
MatIA.ejemplo({
  id: "calculo-disena-tu-vaso",
  tema: "calculo",
  titulo: "Diseña tu propio vaso (o botella)",
  resumen: "Giramos el perfil de un vaso para obtener su volumen con una integral, comprobamos si cabe un refresco de 250 ml y retocamos el diseño para que quepa justo.",
  board: {
    title: "Diseña tu propio vaso (o botella)",
    pages: [
    { blocks: [
      {"type":"text","v":"Vas a diseñar un vaso para una cafetería: 10 cm de alto, 5 cm de diámetro en el fondo y 7 cm en la boca, un poco abierto para que se apile. El cliente quiere que quepa un refresco de 250 ml con algo de margen. ¿Cuánto cabe en tu diseño? Un vaso es una figura de revolución: sale al girar su perfil alrededor de un eje, y su volumen se calcula con una integral."},
      {"type":"text","v":"1. Planteamiento: del dibujo del vaso a una función"},
      {"type":"deriv","rows":[{"l":"x","r":"\\text{altura desde el fondo (cm)},\\ x\\in[0,10]","note":"Tumbamos el vaso: el eje X es su eje de giro, del fondo (x = 0) a la boca (x = 10)","boxed":false},{"l":"f(x)","r":"\\frac{5}{2}+\\frac{x}{10}","note":"Perfil: el radio pasa de 2,5 cm en el fondo a 3,5 cm en la boca, creciendo en línea recta","boxed":false},{"l":"dV","r":"\\pi\\,f(x)^{2}\\,dx","note":"Cortamos el vaso en discos finísimos de radio f(x) y grosor dx (área del círculo × grosor)","boxed":false},{"l":"V","r":"\\pi\\int_{0}^{10}\\left(\\frac{5}{2}+\\frac{x}{10}\\right)^{2}dx","note":"Sumamos todos los discos: volumen de revolución","boxed":true}]},
      {"type":"solid","fn":"f(x)=2{,}5+0{,}1x","a":0,"b":10,"axis":"x","k":0,"az":-0.8,"el":0.45,"zoom":1,"align":"center"},
      {"type":"text","v":"Este es tu vaso, tumbado: el sólido que sale al girar el perfil f(x) alrededor del eje X entre 0 y 10. Arrástralo para verlo desde otro ángulo."},
      {"type":"text","v":"2. Calculamos el volumen (Operaciones ▸ Integral paso a paso)"},
      {"type":"math","v":"V=\\int_0^{10}\\pi\\left(\\frac{5}{2}+\\frac{x}{10}\\right)^2dx"},
      {"type":"deriv","rows":[{"l":"\\int_{0}^{10} \\pi \\left(\\frac{5}{2}+\\frac{x}{10}\\right)^{2}\\,dx","r":"\\left[\\frac{10}{3}\\pi \\left(\\frac{5}{2}+\\frac{x}{10}\\right)^{3}\\right]_{0}^{10}","note":"Primitiva de una potencia con argumento lineal; después, regla de Barrow: F(10) − F(0)","boxed":false},{"l":"","r":"\\frac{545\\pi}{6}\\approx 285{,}4\\ \\text{cm}^{3}","note":"Lleno hasta el borde: unos 285 ml (1 cm³ = 1 ml)","boxed":true}]},
      {"type":"text","v":"3. La respuesta"},
      {"type":"deriv","rows":[{"l":"V_{\\text{borde}}","r":"\\frac{545\\pi}{6}\\ \\text{cm}^{3}\\approx 285\\ \\text{ml}","note":"Lleno hasta arriba caben unos 285 ml: el refresco de 250 ml entra con margen","boxed":false},{"l":"V_{9\\ \\text{cm}}","r":"\\pi\\int_{0}^{9}\\left(\\frac{5}{2}+\\frac{x}{10}\\right)^{2}dx\\approx 248\\ \\text{ml}","note":"Pero nadie llena un vaso hasta el borde: dejando 1 cm libre caben unos 248 ml, casi justo 250","boxed":true},{"l":"\\frac{285-248}{285}","r":"0{,}13","note":"¡El último centímetro guarda un 13 % del vaso! Arriba es más ancho, y cada centímetro de la boca cuenta más","boxed":false}]},
      {"type":"text","v":"4. ¿Y en la vida real?"},
      {"type":"text","v":"Los fabricantes de envases hacen exactamente esta cuenta: deciden la forma por estética, por agarre o para que los vasos se apilen, y luego ajustan las medidas para que quepa la cantidad justa más un margen (el «espacio de cabeza»). Por eso en las fichas técnicas de botellas y vasos aparecen dos capacidades: la nominal (lo que se llena de verdad) y la de rebose (lleno hasta el borde). Además, cuanto menos material use el envase para un mismo volumen, más barato y ecológico es."},
      {"type":"text","v":"Ahora tú: 1) Reto de diseño: cambia el fondo para que el vaso, lleno hasta el borde, guarde exactamente 250 ml. Prueba f(x) = 2,3 + 0,1x con Operaciones ▸ Integral paso a paso y ajusta el 2,3 hasta acercarte a 250 (pista: anda cerca de 2,31). 2) Diseña una copa con un perfil curvo, por ejemplo f(x) = √(x + 4) entre 0 y 9 (escribe π∫₀⁹ (√(x+4))² dx), y calcula cuántos ml caben. ¿Más o menos que tu vaso?"},
    ], strokes: [] },
    ],
  },
});
