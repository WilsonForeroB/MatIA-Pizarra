/* Banco de ejemplos · graficas (los cálculos los genera el motor de la app: engine/ops). */
MatIA.ejemplo({
  id: "graficas-pringles-silla",
  tema: "graficas",
  titulo: "La forma de una patata de tubo y de una silla de montar",
  resumen: "El paraboloide hiperbólico z = x² − y² tiene un punto de silla: en una dirección es mínimo y en otra máximo, como en una silla de montar o un puerto de montaña.",
  board: {
    title: "La forma de una patata de tubo y de una silla de montar",
    pages: [
    { blocks: [
      {"type":"text","v":"¿Te has fijado en la forma de las famosas patatas de tubo? Todas son iguales, se curvan hacia arriba por los lados y hacia abajo por delante y por detrás, y por eso encajan unas encima de otras dentro del tubo sin romperse. Es la misma forma que una silla de montar y, vista a lo grande, la de un puerto de montaña. Los matemáticos la llaman paraboloide hiperbólico, y su centro es un punto de silla: ni máximo ni mínimo. ¿Cómo puede un punto ser a la vez lo más bajo y lo más alto?"},
      {"type":"text","v":"1. Planteamiento: la función de la patata"},
      {"type":"deriv","rows":[{"l":"z","r":"x^{2}-y^{2}","note":"x e y son las coordenadas sobre el suelo (en cm, por ejemplo) y z la altura de la patata sobre su centro","boxed":false},{"l":"z\\ (y=0)","r":"x^{2}","note":"Si caminamos por el eje x (de lado a lado), la altura es x²: la patata sube hacia los bordes","boxed":false},{"l":"z\\ (x=0)","r":"-y^{2}","note":"Si caminamos por el eje y (de delante a atrás), la altura es −y²: la patata baja hacia los extremos","boxed":true}]},
      {"type":"text","v":"2. Buscamos extremos (Operaciones ▸ Extremos de f(x, y) y puntos de silla)"},
      {"type":"math","v":"z=x^2-y^2"},
      {"type":"deriv","rows":[{"l":"f(x,y)","r":"x^{2}-y^{2}","note":"Función de dos variables","boxed":false},{"l":"f_{x}","r":"2x","note":"Derivada parcial respecto de x","boxed":false},{"l":"f_{y}","r":"-2y","note":"Derivada parcial respecto de y","boxed":false},{"l":"\\nabla f","r":"0\\Rightarrow\\begin{cases}2x=0\\\\ -2y=0\\end{cases}","note":"Puntos críticos: anulamos el gradiente","boxed":false},{"l":"\\text{Puntos críticos}","r":"P_{1}=\\left(0,\\ 0\\right)","note":"Solución del sistema: un único punto crítico, el centro de la patata","boxed":false},{"l":"H(x,y)","r":"\\begin{pmatrix}2 & 0\\\\ 0 & -2\\end{pmatrix}","note":"Matriz hessiana: f_xx, f_xy / f_yx, f_yy","boxed":false},{"l":"|H(P_{1})|","r":"\\begin{vmatrix}2 & 0\\\\ 0 & -2\\end{vmatrix}=-4","note":"|H| < 0: punto de silla. f(P₁) = 0","boxed":true}]},
      {"type":"graph3d","fn":"z=x^2-y^2","xmin":-2,"xmax":2,"ymin":-2,"ymax":2,"az":-0.8,"el":0.55,"zoom":1,"marks":[{"x":0,"y":0,"z":0,"kind":"saddle","label":"centro: punto de silla"}],"fns":["z=x^2-y^2"],"align":"center"},
      {"type":"text","v":"Arrastra la superficie para girarla: verás la forma de la patata. El punto marcado es su centro."},
      {"type":"text","v":"3. La respuesta: mínimo en una dirección, máximo en la otra"},
      {"type":"text","v":"Cortamos la superficie con los planos y = 0 y x = 0. En la gráfica de abajo, la parábola que sube es x² (hacia los lados) y la que baja es −x² (una vista de −y², hacia delante y detrás)."},
      {"type":"graph","fns":["f(x)=x^2","g(x)=-x^2"],"xmin":-2.5,"xmax":2.5,"ymin":-5,"ymax":5,"marks":[{"x":0,"y":0,"kind":"saddle","label":"centro (0, 0)"}],"align":"center"},
      {"type":"deriv","rows":[{"l":"f_{xx}","r":"2>0","note":"Segunda derivada respecto de x: positiva, el centro es un mínimo en esa dirección (como el fondo de un cuenco)","boxed":false},{"l":"f_{yy}","r":"-2<0","note":"Segunda derivada respecto de y: negativa, el centro es un máximo en esa dirección (como la cima de una colina)","boxed":false},{"l":"|H|","r":"f_{xx}f_{yy}-f_{xy}^{2}=2\\cdot(-2)-0=-4<0","note":"Las dos curvaturas tienen signos distintos: punto de silla","boxed":true}]},
      {"type":"text","v":"Por eso una silla de montar se ajusta tan bien a la persona: hacia los lados la silla sube (la pierna descansa en las caídas) y de delante a atrás baja (te quedas en el centro). Y en la patata, el centro es lo más bajo mirando de lado a lado y lo más alto mirando de delante a atrás."},
      {"type":"text","v":"4. El puerto de montaña"},
      {"type":"text","v":"Un puerto de montaña es un punto de silla en el paisaje: a derecha e izquierda se alzan dos picos, y delante y detrás hay valles. Visto en el mapa, el camino que cruza el puerto sube desde un valle hasta el puerto (que es el punto más alto del camino) y baja hacia el otro valle: es un máximo del camino. Pero si te subes a una de las cimas, el puerto es el punto más bajo de la cresta que une los dos picos: un mínimo."},
      {"type":"graph3d","fns":["z=y^2-x^2"],"fn":"z=y^2-x^2","xmin":-2,"xmax":2,"ymin":-2,"ymax":2,"az":-0.8,"el":0.55,"zoom":1,"marks":[{"x":0,"y":0,"z":0,"kind":"saddle","label":"puerto de montaña"}],"align":"center"},
      {"type":"text","v":"Es la misma superficie girada 90°: z = y² − x². Los picos están en el eje y (delante y detrás) y los valles en el eje x. El camino del valle al valle cruza el puerto por el punto más alto del camino; la cresta que une los picos pasa por el punto más bajo de la cresta."},
      {"type":"text","v":"¿Y en la vida real? Esta superficie se puede construir solo con líneas rectas (sobre ella, en la dirección y = x, la altura es 0: es una recta). Por eso arquitectos como Félix Candela la usaron para cubiertas de hormigón muy finas. Y en optimización, cuando un ordenador busca el mínimo de una función de muchas variables, puede quedarse atascado en un punto de silla que parece un mínimo si solo miras una dirección."},
      {"type":"text","v":"Ahora tú: 1) Cambia la función por z = x² − y² con otro escalado, como z = x²/4 − y²/9, y vuelve a aplicar Operaciones ▸ Extremos de f(x, y): ¿sigue siendo un punto de silla? (Sí: |H| = 1/2 · (−2/9) < 0.) 2) Prueba con z = x³ − 3x + y²: aparecen un punto de silla en (−1, 0) y un mínimo en (1, 0): un puerto de montaña y un valle."},
    ], strokes: [] },
    ],
  },
});
