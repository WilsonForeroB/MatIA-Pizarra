/* Ejemplo de muestra (formato en ejemplos/LEEME.md). */
MatIA.ejemplo({
  id: 'calculo-derivada-producto',
  tema: 'calculo',
  titulo: 'Derivada de un producto',
  resumen: 'Regla del producto paso a paso, con la explicación de cada línea.',
  board: {
    title: 'Derivada de un producto',
    pages: [{ blocks: [
      { type: 'text', v: 'Derivamos f(x) = x²·sin(x) con la regla del producto: (u·v)′ = u′·v + u·v′.' },
      { type: 'deriv', rows: [
        { l: "f'(x)", r: "\\left(x^2\\right)'\\sin(x)+x^2\\left(\\sin(x)\\right)'", note: 'Regla del producto con u = x² y v = sin(x)', boxed: false },
        { l: '', r: '2x\\sin(x)+x^2\\cos(x)', note: 'Derivadas de x² y de sin(x)', boxed: true },
      ] },
      { type: 'graph', fns: ['f(x)=x^2\\sin(x)', 'g(x)=2x\\sin(x)+x^2\\cos(x)'], xmin: -4, xmax: 4, align: 'center' },
    ], strokes: [] }],
  },
});
