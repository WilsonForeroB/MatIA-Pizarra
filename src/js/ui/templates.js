/* Plantillas LaTeX, paneles de símbolos y panel de cálculo (pizarra.html 5363-5514). */
MatIA.define('ui/templates', ['core/dom', 'ui/toast'], (dom, toast) => {
  'use strict';
  const { $, $$ } = dom;
  const { body } = dom;
  const R = (n) => MatIA.require(n);
  /* ---------------- Plantillas ---------------- */
  const ph = '#?';
  function matrixLatex(r, c, env) {
    const row = Array(c).fill(ph).join('&');
    const rows = Array(r).fill(row).join('\\\\');
    if (env === 'aug') {
      const a = Math.max(1, c - 1);
      const L = Array(r).fill(Array(a).fill(ph).join('&')).join('\\\\');
      const R = Array(r).fill(Array(Math.max(1, c - a)).fill(ph).join('&')).join('\\\\');
      return '\\left(\\begin{matrix}' + L + '\\end{matrix}\\,\\middle|\\,\\begin{matrix}' + R + '\\end{matrix}\\right)';
    }
    return '\\begin{' + env + '}' + rows + '\\end{' + env + '}';
  }
  const TPL = {
    pow: '#@^{#?}', sub: '#@_{#?}', frac: '\\frac{#@}{#?}', sqrt: '\\sqrt{#@}', nroot: '\\sqrt[#?]{#@}',
    sum: '\\sum_{#?}^{#?}#?', lim: '\\lim_{#?\\to#?}#?', int: '\\int_{#?}^{#?}#?\\,d#?',
    vec: '\\vec{#@}', norm: '\\left\\lVert#@\\right\\rVert', T: '#@^{T}', inv: '#@^{-1}', cdot: '\\cdot ',
    arrow: '\\xrightarrow{#?}', implies: '\\Rightarrow ', iff: '\\Leftrightarrow ', R: '\\mathbb{R}', lambda: '\\lambda ',
    dydx: '\\frac{d#?}{d#?}', prime: "#@'(#?)", in: '\\in ', exists: '\\exists ', forall: '\\forall ',
  };
  // último campo auxiliar con foco (función de una gráfica o de un sólido): los símbolos se insertan ahí
  let lastAux = null;
  document.addEventListener('focusin', (e) => {
    const t = e.target;
    if (t && t.matches && t.matches('math-field[data-aux]')) lastAux = t;
    else if (t && t.closest && t.closest('#blocks') && !(t.closest('.sol, .graph, .g3d'))) lastAux = null;
  });
  function insertLatex(latex) {
    if (body.dataset.mode !== 'write') R('ui/mode-pages').setMode('write');
    const ae = document.activeElement;
    const aux = ae && ae.matches && ae.matches('math-field[data-aux]') ? ae : lastAux && lastAux.isConnected && !lastAux.readOnly ? lastAux : null;
    if (aux) {
      aux.focus();
      aux.insert(latex, { format: 'latex', selectionMode: 'placeholder', focus: true });
      aux.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    const mf = R('blocks/editor').activeField();
    if (!mf || mf.tagName !== 'MATH-FIELD') { toast('El editor de fórmulas aún no está listo.', 'aviso'); return; }
    if (!mf.hasFocus || !mf.hasFocus()) mf.focus();
    mf.insert(latex, { format: 'latex', selectionMode: 'placeholder', focus: true });
    R('blocks/editor').syncBlock(R('blocks/editor').activeBlock());
    R('blocks/editor').hidePio();
  }
  // Paneles de símbolos: [título, ancho, [[etiqueta, LaTeX, nombre (atajo)]…]]
  const SYM_GROUPS = [
    ['Básicos', false, [
      ['x²', '#@^{#?}', 'Potencia (escribe ^)'], ['xₙ', '#@_{#?}', 'Subíndice (escribe _)'], ['a⁄b', '\\frac{#@}{#?}', 'Fracción (escribe /)'], ['√', '\\sqrt{#@}', 'Raíz cuadrada (escribe sqrt)'],
      ['ⁿ√', '\\sqrt[#?]{#@}', 'Raíz n-ésima'], ['( )', '\\left(#@\\right)', 'Paréntesis'], ['·', '\\cdot ', 'Producto (escribe *)'], ['Aᵀ', '#@^{T}', 'Traspuesta'],
      ['A⁻¹', '#@^{-1}', 'Inversa'], ['→ paso', '\\xrightarrow{#?}', 'Flecha con texto encima, para indicar la operación entre pasos'], ['⇒', '\\Rightarrow ', 'Implica (=>)'], ['ℝ', '\\mathbb{R}', 'Reales (RR)'],
      ['∈', '\\in ', 'Pertenece (in)'], ['∃', '\\exists ', 'Existe (EE)'], ['∀', '\\forall ', 'Para todo (AA)'],
    ]],
    ['Lógica', false, [
      ['∀', '\\forall ', 'Para todo (AA)'], ['∃', '\\exists ', 'Existe (EE)'], ['∄', '\\nexists ', 'No existe (!exists)'], ['∃!', '\\exists! ', 'Existe un único'],
      ['¬', '\\neg ', 'Negación'], ['∧', '\\land ', 'Y (conjunción)'], ['∨', '\\lor ', 'O (disyunción)'], ['⊻', '\\veebar ', 'O exclusivo'],
      ['⇒', '\\Rightarrow ', 'Implica (=>)'], ['⇐', '\\Leftarrow ', 'Se deduce de'], ['⇔', '\\Leftrightarrow ', 'Si y solo si (<=>)'], ['∴', '\\therefore ', 'Por tanto'],
      ['∵', '\\because ', 'Porque'], ['⊢', '\\vdash ', 'Deduce'], ['⊨', '\\models ', 'Modela'], ['⊤', '\\top ', 'Verdadero'], ['⊥', '\\bot ', 'Falso / contradicción'],
    ]],
    ['Conjuntos', false, [
      ['∈', '\\in ', 'Pertenece (in)'], ['∉', '\\notin ', 'No pertenece (!in)'], ['∋', '\\ni ', 'Contiene al elemento'], ['⊂', '\\subset ', 'Subconjunto'],
      ['⊆', '\\subseteq ', 'Subconjunto o igual'], ['⊄', '\\not\\subset ', 'No es subconjunto'], ['⊃', '\\supset ', 'Contiene'], ['⊇', '\\supseteq ', 'Contiene o igual'],
      ['∪', '\\cup ', 'Unión'], ['∩', '\\cap ', 'Intersección'], ['∖', '\\setminus ', 'Diferencia'], ['∅', '\\emptyset ', 'Conjunto vacío'],
      ['Aᶜ', '#@^{c}', 'Complementario'], ['A×B', '\\times ', 'Producto cartesiano'], ['𝒫(A)', '\\mathcal{P}(#?)', 'Partes de A'], ['|A|', '\\left|#@\\right|', 'Cardinal / valor absoluto'],
      ['{ | }', '\\left\\lbrace #?\\mid #?\\right\\rbrace', 'Conjunto por comprensión'], ['{ }', '\\left\\lbrace #?\\right\\rbrace', 'Conjunto por extensión'], ['⋃', '\\bigcup_{#?}^{#?}', 'Unión indexada'], ['⋂', '\\bigcap_{#?}^{#?}', 'Intersección indexada'],
    ]],
    ['Números', false, [
      ['ℕ', '\\mathbb{N}', 'Naturales (NN)'], ['ℤ', '\\mathbb{Z}', 'Enteros (ZZ)'], ['ℚ', '\\mathbb{Q}', 'Racionales (QQ)'], ['ℝ', '\\mathbb{R}', 'Reales (RR)'],
      ['ℂ', '\\mathbb{C}', 'Complejos (CC)'], ['ℝⁿ', '\\mathbb{R}^{#?}', 'Espacio ℝⁿ'], ['∞', '\\infty ', 'Infinito (oo)'], ['±', '\\pm ', 'Más menos (+-)'],
      ['∓', '\\mp ', 'Menos más'], ['π', '\\pi ', 'Pi'], ['e', '\\mathrm{e}', 'Número e'], ['i', '\\mathrm{i}', 'Unidad imaginaria'],
    ]],
    ['Relaciones', false, [
      ['≠', '\\neq ', 'Distinto (!=)'], ['≤', '\\leq ', 'Menor o igual (<=)'], ['≥', '\\geq ', 'Mayor o igual (>=)'], ['<', '<', 'Menor'], ['>', '>', 'Mayor'],
      ['≈', '\\approx ', 'Aproximadamente'], ['≡', '\\equiv ', 'Equivalente / congruente'], ['∼', '\\sim ', 'Equivalente (matrices)'], ['≅', '\\cong ', 'Isomorfo'], ['∝', '\\propto ', 'Proporcional'],
      ['≪', '\\ll ', 'Mucho menor'], ['≫', '\\gg ', 'Mucho mayor'], ['∣', '\\mid ', 'Divide'], ['∤', '\\nmid ', 'No divide'], ['⊥', '\\perp ', 'Perpendicular'], ['∥', '\\parallel ', 'Paralelo'],
    ]],
    ['Operaciones', false, [
      ['·', '\\cdot ', 'Producto (*)'], ['×', '\\times ', 'Por / producto vectorial (xx)'], ['÷', '\\div ', 'Dividido'], ['∘', '\\circ ', 'Composición'],
      ['⊗', '\\otimes ', 'Producto tensorial'], ['⊕', '\\oplus ', 'Suma directa'], ['ⁿ√', '\\sqrt[#?]{#@}', 'Raíz n-ésima'], ['|x|', '\\left|#@\\right|', 'Valor absoluto'],
      ['⌊x⌋', '\\left\\lfloor #@\\right\\rfloor', 'Parte entera'], ['⌈x⌉', '\\left\\lceil #@\\right\\rceil', 'Techo'], ['n!', '#@!', 'Factorial'], ['(ⁿₖ)', '\\binom{#?}{#?}', 'Número combinatorio'],
      ['Σ', '\\sum_{#?}^{#?}#?', 'Sumatorio (sum)'], ['∏', '\\prod_{#?}^{#?}#?', 'Productorio (prod)'], ['mod', '\\bmod ', 'Módulo'], ['%', '\\%', 'Porcentaje'],
      ['v⃗', '\\vec{#@}', 'Vector'], ['‖v‖', '\\left\\lVert #@\\right\\rVert', 'Norma'], ['⟨u,v⟩', '\\langle #?,#?\\rangle', 'Producto escalar'], ['x̄', '\\overline{#@}', 'Conjugado / media'],
    ]],
    ['Flechas', false, [
      ['→', '\\to ', 'Tiende a / aplicación (->)'], ['←', '\\leftarrow ', 'Izquierda'], ['↔', '\\leftrightarrow ', 'Doble'], ['↦', '\\mapsto ', 'Se transforma en'],
      ['⟶', '\\longrightarrow ', 'Flecha larga'], ['↑', '\\uparrow ', 'Crece'], ['↓', '\\downarrow ', 'Decrece'], ['⇄', '\\rightleftarrows ', 'Ida y vuelta'],
      ['f:A→B', 'f\\colon #?\\to #?', 'Función de A en B'], ['x↦', '#?\\mapsto #?', 'Regla de la función'],
    ]],
    ['Probabilidad y estadística', false, [
      ['P(A)', 'P\\left(#?\\right)', 'Probabilidad de un suceso'], ['P(A|B)', 'P\\left(#?\\mid #?\\right)', 'Probabilidad condicionada'], ['P(A∩B)', 'P\\left(#?\\cap #?\\right)', 'Probabilidad de la intersección'], ['Ā', '\\overline{#@}', 'Suceso contrario'],
      ['x̄', '\\bar{x}', 'Media muestral'], ['μ', '\\mu ', 'Media poblacional'], ['σ', '\\sigma ', 'Desviación típica'], ['σ²', '\\sigma^{2}', 'Varianza'], ['s²', 's^{2}', 'Varianza muestral'],
      ['Σxᵢ', '\\sum_{i=1}^{n}x_{i}', 'Suma de los datos'], ['x̄ =', '\\bar{x}=\\frac{\\sum_{i=1}^{n}x_{i}}{n}', 'Fórmula de la media'], ['σ² =', '\\sigma^{2}=\\frac{\\sum_{i=1}^{n}\\left(x_{i}-\\bar{x}\\right)^{2}}{n}', 'Fórmula de la varianza'],
      ['E[X]', 'E\\left[#?\\right]', 'Esperanza'], ['Var', '\\operatorname{Var}\\left(#?\\right)', 'Varianza de una variable'], ['X~B', 'X\\sim B\\left(#?,#?\\right)', 'Binomial B(n, p)'], ['X~N', 'X\\sim N\\left(#?,#?\\right)', 'Normal N(μ, σ)'],
      ['Φ(z)', '\\Phi\\left(#?\\right)', 'Función de distribución normal estándar'], ['Ω', '\\Omega ', 'Espacio muestral'], ['|Ω|', '\\left|\\Omega\\right|', 'Número de resultados'],
      ['Laplace', 'P\\left(A\\right)=\\frac{\\text{casos favorables}}{\\text{casos posibles}}', 'Regla de Laplace'], ['P(A|B) =', 'P\\left(A\\mid B\\right)=\\frac{P\\left(A\\cap B\\right)}{P\\left(B\\right)}', 'Definición de probabilidad condicionada'],
      ['Bayes', 'P\\left(A_{i}\\mid B\\right)=\\frac{P\\left(A_{i}\\right)P\\left(B\\mid A_{i}\\right)}{\\sum_{j}P\\left(A_{j}\\right)P\\left(B\\mid A_{j}\\right)}', 'Teorema de Bayes'], ['P(Ā)=1−P(A)', 'P\\left(\\overline{A}\\right)=1-P\\left(A\\right)', 'Suceso contrario'],
    ]],
    ['Trigonometría y geometría', false, [
      ['°', '^{\\circ}', 'Grados'], ['′', '^{\\prime}', 'Minutos'], ['″', '^{\\prime\\prime}', 'Segundos'], ['π', '\\pi ', 'Pi'], ['rad', '\\ \\text{rad}', 'Radianes'],
      ['sen', '\\operatorname{sen}', 'Seno'], ['cos', '\\cos ', 'Coseno'], ['tg', '\\operatorname{tg}', 'Tangente'], ['cosec', '\\operatorname{cosec}', 'Cosecante'], ['sec', '\\sec ', 'Secante'], ['cotg', '\\operatorname{cotg}', 'Cotangente'],
      ['arcsen', '\\operatorname{arcsen}', 'Arco seno'], ['arccos', '\\arccos ', 'Arco coseno'], ['arctg', '\\operatorname{arctg}', 'Arco tangente'],
      ['∠', '\\angle ', 'Ángulo'], ['Â', '\\hat{#@}', 'Ángulo en un vértice'], ['△', '\\triangle ', 'Triángulo'], ['∥', '\\parallel ', 'Paralelas'], ['⊥', '\\perp ', 'Perpendiculares'], ['≅', '\\cong ', 'Congruentes'], ['∼', '\\sim ', 'Semejantes'],
      ['AB̅', '\\overline{#@}', 'Segmento'], ['AB⃗', '\\overrightarrow{#@}', 'Vector fijo'], ['AB⌒', '\\overset{\\frown}{#@}', 'Arco'], ['α', '\\alpha ', 'alfa'], ['β', '\\beta ', 'beta'], ['γ', '\\gamma ', 'gamma'], ['θ', '\\theta ', 'theta'],
      ['Pitágoras', 'a^{2}=b^{2}+c^{2}', 'Teorema de Pitágoras (a es la hipotenusa)'], ['sen²+cos²', '\\operatorname{sen}^{2}\\alpha+\\cos^{2}\\alpha=1', 'Identidad fundamental'],
      ['tg = sen/cos', '\\operatorname{tg}\\alpha=\\frac{\\operatorname{sen}\\alpha}{\\cos\\alpha}', 'Tangente como cociente'], ['° → rad', '\\alpha_{\\text{rad}}=\\alpha^{\\circ}\\cdot\\frac{\\pi}{180^{\\circ}}', 'Pasar de grados a radianes'],
      ['T. seno', '\\frac{a}{\\operatorname{sen}\\hat{A}}=\\frac{b}{\\operatorname{sen}\\hat{B}}=\\frac{c}{\\operatorname{sen}\\hat{C}}', 'Teorema del seno'], ['T. coseno', 'a^{2}=b^{2}+c^{2}-2bc\\cos\\hat{A}', 'Teorema del coseno'],
      ['Área ½ab·sen', 'S=\\frac{1}{2}\\,ab\\,\\operatorname{sen}\\hat{C}', 'Área con dos lados y el ángulo comprendido'], ['Herón', 'S=\\sqrt{s\\left(s-a\\right)\\left(s-b\\right)\\left(s-c\\right)}', 'Fórmula de Herón (s es el semiperímetro)'],
      ['sen(α±β)', '\\operatorname{sen}\\left(\\alpha\\pm\\beta\\right)=\\operatorname{sen}\\alpha\\cos\\beta\\pm\\cos\\alpha\\operatorname{sen}\\beta', 'Seno de la suma o diferencia'], ['cos(α±β)', '\\cos\\left(\\alpha\\pm\\beta\\right)=\\cos\\alpha\\cos\\beta\\mp\\operatorname{sen}\\alpha\\operatorname{sen}\\beta', 'Coseno de la suma o diferencia'],
      ['sen 2α', '\\operatorname{sen}2\\alpha=2\\operatorname{sen}\\alpha\\cos\\alpha', 'Seno del ángulo doble'], ['cos 2α', '\\cos2\\alpha=\\cos^{2}\\alpha-\\operatorname{sen}^{2}\\alpha', 'Coseno del ángulo doble'],
      ['d(P,r)', 'd\\left(P,r\\right)=\\frac{\\left|ax_{0}+by_{0}+c\\right|}{\\sqrt{a^{2}+b^{2}}}', 'Distancia de un punto a una recta'], ['d(A,B)', 'd\\left(A,B\\right)=\\sqrt{\\left(x_{2}-x_{1}\\right)^{2}+\\left(y_{2}-y_{1}\\right)^{2}}', 'Distancia entre dos puntos'],
      ['y = mx + n', 'y=mx+n', 'Ecuación explícita de la recta'], ['ax+by+c=0', 'ax+by+c=0', 'Ecuación general de la recta'],
    ]],
    ['Letras griegas', false, [
      ['α', '\\alpha ', 'alfa'], ['β', '\\beta ', 'beta'], ['γ', '\\gamma ', 'gamma'], ['δ', '\\delta ', 'delta'], ['ε', '\\varepsilon ', 'épsilon'], ['θ', '\\theta ', 'theta'],
      ['λ', '\\lambda ', 'lambda (lam)'], ['μ', '\\mu ', 'mu'], ['ρ', '\\rho ', 'rho'], ['σ', '\\sigma ', 'sigma'], ['τ', '\\tau ', 'tau'], ['φ', '\\varphi ', 'fi'],
      ['ψ', '\\psi ', 'psi'], ['ω', '\\omega ', 'omega'], ['Γ', '\\Gamma ', 'Gamma'], ['Δ', '\\Delta ', 'Delta'], ['Θ', '\\Theta ', 'Theta'], ['Λ', '\\Lambda ', 'Lambda'],
      ['Σ', '\\Sigma ', 'Sigma'], ['Φ', '\\Phi ', 'Fi'], ['Ω', '\\Omega ', 'Omega'],
    ]],
  ];
  const CALC_GROUPS = [
    ['Derivadas', true, [
      ["f′(x)", "#@'(#?)", 'Derivada (escribe la función y luego \u0027)'], ["f″(x)", "#@''(#?)", 'Derivada segunda'], ['f⁽ⁿ⁾(x)', '#@^{(#?)}(#?)', 'Derivada n-ésima'],
      ['dy/dx', '\\frac{d#?}{d#?}', 'Derivada de Leibniz'], ['d/dx (…)', '\\frac{d}{d#?}\\left(#@\\right)', 'Operador derivada'], ['d²y/dx²', '\\frac{d^2#?}{d#?^2}', 'Derivada segunda (Leibniz)'],
      ['∂f/∂x', '\\frac{\\partial #?}{\\partial #?}', 'Derivada parcial'], ['∂²f/∂x∂y', '\\frac{\\partial^2 #?}{\\partial #?\\,\\partial #?}', 'Parcial cruzada'], ['∂²f/∂x²', '\\frac{\\partial^2 #?}{\\partial #?^2}', 'Parcial segunda'],
      ['∇f', '\\nabla #?', 'Gradiente (nabla)'], ['ẋ', '\\dot{#@}', 'Derivada respecto al tiempo'], ['dy/dx|ₐ', '\\left.\\frac{d#?}{d#?}\\right|_{#?}', 'Derivada en un punto'],
      ['Definición', '\\lim_{h\\to 0}\\frac{#?(#?+h)-#?(#?)}{h}', 'Definición de derivada por límite'], ['dx', '\\,d#?', 'Diferencial'], ['∂', '\\partial ', 'Símbolo de parcial (pp)'],
    ]],
    ['Integrales', true, [
      ['∫ f dx', '\\int #?\\,d#?', 'Integral indefinida'], ['∫ₐᵇ f dx', '\\int_{#?}^{#?}#?\\,d#?', 'Integral definida (int)'], ['∬', '\\iint_{#?}#?\\,d#?\\,d#?', 'Integral doble'],
      ['∭', '\\iiint_{#?}#?\\,dV', 'Integral triple'], ['∮', '\\oint_{#?}#?\\,d#?', 'Integral de línea cerrada'], ['[F]ₐᵇ', '\\left[#?\\right]_{#?}^{#?}', 'Regla de Barrow'],
      ['+ C', '+C', 'Constante de integración'],
    ]],
    ['Límites', true, [
      ['lím x→a', '\\lim_{#?\\to #?}#?', 'Límite (lim)'], ['lím x→∞', '\\lim_{#?\\to\\infty}#?', 'Límite en el infinito'], ['lím x→a⁺', '\\lim_{#?\\to #?^{+}}#?', 'Límite por la derecha'],
      ['lím x→a⁻', '\\lim_{#?\\to #?^{-}}#?', 'Límite por la izquierda'], ['lím sup', '\\limsup_{#?\\to #?}#?', 'Límite superior'], ['lím inf', '\\liminf_{#?\\to #?}#?', 'Límite inferior'],
      ['Σ serie', '\\sum_{n=#?}^{\\infty}#?', 'Serie'],
    ]],
  ];
  function buildSymPop(id, groups) {
    const pop = $('#' + id);
    for (const [title, wide, items] of groups) {
      const h = document.createElement('h4');
      h.textContent = title;
      const g = document.createElement('div');
      g.className = 'sym-grid' + (wide ? ' wide' : '');
      g.setAttribute('role', 'group');
      g.setAttribute('aria-label', title);
      for (const [label, latex, name] of items) {
        const bt = document.createElement('button');
        bt.type = 'button';
        bt.className = 'sym';
        bt.textContent = label;
        bt.title = name;
        bt.setAttribute('aria-label', name);
        bt.dataset.ins = latex;
        if (!wide && [...label].length > 4) bt.style.gridColumn = 'span 2';
        g.appendChild(bt);
      }
      pop.append(h, g);
    }
    // No roban el foco a la fórmula y el panel queda abierto para encadenar símbolos
    pop.addEventListener('mousedown', (e) => { if (e.target.closest('.sym')) e.preventDefault(); });
    pop.addEventListener('click', (e) => { const bt = e.target.closest('.sym'); if (bt) insertLatex(bt.dataset.ins); });
  }
  buildSymPop('symPop', SYM_GROUPS);
  buildSymPop('calcPop', CALC_GROUPS);
  const systemLatex = (n) => '\\begin{cases}' + Array(n).fill(ph).join('\\\\') + '\\end{cases}';
  return { ph, matrixLatex, TPL, insertLatex, SYM_GROUPS, CALC_GROUPS, buildSymPop, systemLatex };
});
