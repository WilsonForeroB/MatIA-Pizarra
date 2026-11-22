/* Menú Operaciones paso a paso, inserción de resultados y elección de la línea destino (pizarra.html 6983-7346). */
MatIA.define('ui/ops-menu', ['core/dom', 'model/board', 'model/schema', 'ui/state', 'ui/toast', 'assets/pio'], (dom, S, schema, ST, toast, pio) => {
  'use strict';
  const { $, $$ } = dom;
  const { body } = dom;
  const blocksEl = $('#blocks');
  const { uid, newBlock, newDeriv } = schema;
  const R = (n) => MatIA.require(n);
  /* ---------------- Operaciones paso a paso ---------------- */
  const OPS_MENU = [
    ['Matrices y sistemas', [
      ['gauss', 'Gauss paso a paso', 'Una matriz, una matriz ampliada (A|b) o un sistema (Sistema ▾): escalona paso a paso y, si es un sistema, lo clasifica y lo resuelve.'],
      ['gj', 'Gauss-Jordan paso a paso', 'Igual que Gauss, pero hasta la forma escalonada reducida.'],
      ['inv', 'Inversa paso a paso', 'Escribe la matriz o su nombre (A). Aplica Gauss-Jordan a (A | I).'],
      ['detS', 'Determinante: 2×2 y Sarrus', 'Matriz 2×2 o 3×3 (o su nombre). Con mayor tamaño usa cofactores.'],
      ['detC', 'Determinante por cofactores', 'Desarrolla por la fila o columna con más ceros.'],
      ['detG', 'Determinante por Gauss', 'Triangula la matriz y multiplica la diagonal.'],
      ['cramer', 'Regla de Cramer', 'Un sistema (Sistema ▾) con tantas ecuaciones como incógnitas.'],
      ['param', 'Discutir sistema con parámetro', 'Sistema con un parámetro: una letra como a, k o m (las incógnitas son x, y, z, t).'],
      ['prod', 'Producto desarrollado', 'Escribe A·B con nombres o matrices: muestra cada fila·columna.'],
      ['eigen', 'Autovalores y autovectores', 'Matriz cuadrada o su nombre: polinomio característico, autovalores, subespacios y si es diagonalizable.'],
    ]],
    ['Vectores', [
      ['dot', 'Producto escalar', 'Escribe dos vectores: u, v o (1,2,3)·(4,5,6).'],
      ['cross', 'Producto vectorial', 'Dos vectores de ℝ³: u × v.'],
      ['norm', 'Norma', 'Un vector: u o (1,2,3).'],
      ['angle', 'Ángulo entre vectores', 'Dos vectores: u, v.'],
      ['proj', 'Proyección de u sobre v', 'Dos vectores: u, v (en ese orden).'],
    ]],
    ['Ecuaciones', [
      ['solve', 'Resolver paso a paso', 'Una ecuación de una incógnita (1.º o 2.º grado, o polinómica con raíces racionales). Crea un desarrollo con la explicación de cada paso.'],
      ['next', 'Siguiente paso', 'Dentro de un desarrollo: añade solo el paso siguiente.'],
      ['check', 'Comprobar solución', 'Dentro de un desarrollo resuelto: sustituye la solución en la ecuación inicial.'],
    ]],
    ['Aritmética', [
      ['fracS', 'Simplificar fracción', 'Una fracción de enteros, por ejemplo 84/126.'],
      ['fracO', 'Operar fracciones', 'Sumas y restas (con m.c.m.) o productos y cocientes de fracciones.'],
      ['mcd', 'm.c.d. y m.c.m.', 'Dos o más números separados por comas, por ejemplo 12, 18.'],
      ['primes', 'Factores primos', 'Un número entero, por ejemplo 360.'],
    ]],
    ['Polinomios', [
      ['polyOp', 'Desarrollar y operar', 'Sumas, productos y potencias de polinomios: (x+1)(x−2)+3x².'],
      ['polyDiv', 'Dividir: Ruffini o división larga', 'P(x) : Q(x) o como fracción. Si el divisor es x − a usa Ruffini.'],
      ['polyRoots', 'Raíces y factorización', 'Un polinomio: busca raíces racionales con Ruffini y lo factoriza.'],
    ]],
    ['Combinatoria', [
      ['comb', 'n!, combinaciones, variaciones', 'Escribe 6!, \\binom{5}{2} (o C_{5,2}), V_{5,2}, VR_{3,4} o P_{5}.'],
      ['pascal', 'Triángulo de Pascal', 'Escribe el número de filas (por defecto 6).'],
    ]],
    ['Lógica y conjuntos', [
      ['truth', 'Tabla de verdad', 'Fórmula con ¬ ∧ ∨ ⊻ ⇒ ⇔ y letras p, q, r…: dice si es tautología, contradicción o contingencia.'],
      ['venn', 'Diagrama de Venn', 'Una expresión con A, B, C y U (A ∩ B, (A ∪ B)ᶜ, A ∖ B, A Δ B…): dibuja el diagrama con la zona sombreada y, si has definido los conjuntos, sus elementos.'],
      ['sets', 'Operar conjuntos', 'Define A = {1,2,3}, B = {…} (y U para el complementario) en otras líneas y escribe A ∪ B, A ∩ B, A ∖ B, Aᶜ, 𝒫(A), A × B o |A|.'],
    ]],
    ['Estadística y probabilidad', [
      ['stats', 'Media, mediana, moda y dispersión', 'Una lista de datos: 2, 3, 5, 5, 7 (con ; si usas coma decimal: 1,5; 2; 3,5). Media, mediana, moda, rango, varianza y desviación típica, cuartiles, RIC, CV y diagrama de caja.'],
      ['freq', 'Tabla de frecuencias', 'Una lista de datos: frecuencias absolutas, relativas, acumuladas, % y diagrama de barras.'],
      ['space', 'Espacio muestral', 'Experimentos separados por comas: moneda, dado, moneda^3 o un conjunto {R, V, A}. Ω, |Ω| y regla de Laplace.'],
      ['cont', 'Tabla de contingencia y condicionada', 'Una matriz de frecuencias (filas A₁, A₂… y columnas B₁, B₂…): marginales, conjuntas, condicionadas e independencia.'],
      ['bayes', 'Árbol de probabilidad y Bayes…', 'Asistente: causas, sus probabilidades y P(B | causa). Dibuja el árbol, la probabilidad total y Bayes.'],
      ['binom', 'Distribución binomial', 'X\\sim B(10, 0.3), P(X\\le 3) (también =, <, ≥, > o a ≤ X ≤ b).'],
      ['normal', 'Distribución normal', 'X\\sim N(100, 15), P(X\\le 120) (σ es la desviación típica; también ≥ o a ≤ X ≤ b).'],
    ]],
    ['Trigonometría y geometría', [
      ['ang', 'Convertir ángulos (° ↔ rad)', 'Un ángulo: 150°, 35°20′15″, \\frac{5\\pi}{6} o 2.5 rad (varios separados por comas dan una tabla). Grados ↔ radianes exactos con π, grados-minutos-segundos y ángulo coterminal.'],
      ['trig', 'Razones trigonométricas', 'Un ángulo, con o sin función: \\sin 150°, 210°, \\cos\\frac{5\\pi}{3}. Cuadrante, ángulo de referencia, valores exactos de los notables y circunferencia goniométrica.'],
      ['notable', 'Tabla de ángulos notables', 'No necesita línea: seno, coseno y tangente de 0° a 360° en grados y radianes, con su circunferencia.'],
      ['tri', 'Resolver triángulo (seno y coseno)', 'Tres datos con al menos un lado: a=5, b=7, C=60° (lados a, b, c y ángulos A, B, C opuestos). LLL, LAL, ALA y el caso ambiguo LLA; área, perímetro y dibujo.'],
      ['lines', 'Rectas: posición, paralelas y distancias', 'Dos rectas (2x+3y−6=0, y=2x+1), una recta y un punto (3x+4y=10, P=(1,6)) o dos puntos A=(1,2), B=(4,6). Posición relativa, corte, ángulo, paralela y perpendicular, distancias y dibujo.'],
      ['transv', 'Paralelas cortadas por una secante', 'Un ángulo α: 65°. Los 8 ángulos: opuestos por el vértice, correspondientes, alternos internos y externos, conjugados.'],
    ]],
    ['Cálculo', [
      ['deriv', 'Derivar paso a paso', 'f(x) = … o una expresión: indica las reglas aplicadas y simplifica.'],
      ['integral', 'Integral paso a paso', '∫ f(x) dx o ∫ₐᵇ f(x) dx (desde Cálculo ▾ o escrito a mano): reglas aplicadas, primitiva + C y, si es definida, la regla de Barrow.'],
      ['extr1', 'Máximos y mínimos de f(x)', 'f(x) = … (y si quieres un intervalo: f(x)=x^3-3x, x∈[-3,2]). Puntos críticos, clasificación con f″, inflexión, crecimiento, absolutos y gráfica con los puntos marcados.'],
      ['graph', 'Graficar función', 'f(x) = … Añade más funciones con «+ Añadir función»; acerca, aleja y muévete con los botones de la gráfica o arrastrando.'],
      ['values', 'Tabla de valores', 'f(x) = …: valores para x de −3 a 3.'],
    ]],
    ['Cálculo vectorial', [
      ['partial', 'Derivadas parciales', 'f(x,y) = … o f(x,y,z) = … (y si quieres un punto: , P=(1,2)). Cada parcial tratando las otras variables como constantes, segundas derivadas, Schwarz (f_xy = f_yx) y valores en P.'],
      ['grad', 'Gradiente y derivada direccional', 'f(x,y) = …, P=(1,2), u=(3,4). ∇f, ∇f(P) y su módulo (máxima pendiente), vector unitario, derivada direccional y plano tangente.'],
      ['hess', 'Matriz hessiana', 'f(x,y) o f(x,y,z) (y si quieres , P=(1,1)). Segundas derivadas, matriz hessiana y, en P, menores principales y criterio de Sylvester.'],
      ['jacob', 'Matriz jacobiana', 'F(x,y) = (x^2y,\\ x+\\sin y) o un cambio de variables x=r\\cos\\theta, y=r\\sin\\theta (y si quieres , P=(…)). Jacobiana, su determinante y su significado.'],
      ['divrot', 'Divergencia, rotacional y laplaciano', 'Un campo F = (F₁, F₂, F₃) en x, y, z (o F = (F₁, F₂)), por ejemplo F=(xy, yz, zx): divergencia, rotacional y si es conservativo. Con una función f: laplaciano Δf.'],
      ['extr2', 'Extremos de f(x, y) y puntos de silla', 'z = f(x, y): gradiente, puntos críticos, hessiana y clasificación (mínimo, máximo, punto de silla) con la superficie 3D marcada.'],
    ]],
  ];
  (function buildOpsPop() {
    const pop = $('#opsPop');
    const hint = document.createElement('p');
    hint.className = 'ops-hint';
    hint.textContent = 'Elige la operación, haz clic en la línea (o el paso) para marcarla y pulsa «Aceptar» para aplicarla. Pasa el ratón por encima de cada botón para ver qué escribir.';
    const oh = document.createElement('div');
    oh.className = 'ops-head';
    oh.append(pio.badge('idea', 'pio-sm', 'Pío con una idea'), hint);
    pop.appendChild(oh);
    for (const [title, items] of OPS_MENU) {
      const h = document.createElement('h4');
      h.textContent = title;
      const g = document.createElement('div');
      g.className = 'ops-grid';
      for (const [key, label, help] of items) {
        const bt = document.createElement('button');
        bt.type = 'button';
        bt.className = 'mi-btn mi-btn--sm';
        bt.dataset.op = key;
        bt.textContent = label;
        bt.title = help;
        g.appendChild(bt);
      }
      pop.append(h, g);
    }
    pop.addEventListener('mousedown', (e) => { if (e.target.closest('[data-op]')) e.preventDefault(); });
    pop.addEventListener('click', (e) => { const bt = e.target.closest('[data-op]'); if (bt) { R('ui/popovers').closePop(); startPick(bt.dataset.op, bt.textContent); } });
  })();
  function specToBlock(spec, ref) {
    if (spec.type === 'math') return newBlock('math', spec.v, { align: spec.align || (ref ? ref.align : 'left'), result: true });
    if (spec.type === 'deriv') return newDeriv(spec.rows.map((r) => ({ l: r.l || '', r: r.r || '', note: r.note || '', boxed: !!r.boxed })));
    return Object.assign({ id: uid(), align: 'left', boxed: false }, JSON.parse(JSON.stringify(spec)));
  }
  function insertSpecs(afterId, specs, ref) {
    let last = afterId, lastB = null;
    for (const sp of specs) { lastB = R('blocks/editor').addBlockAfter(last, specToBlock(sp, ref), false); last = lastB.id; }
    if (lastB) { const el = R('blocks/editor').elById(lastB.id); if (el) el.scrollIntoView({ block: 'nearest' }); R('blocks/editor').setActive(lastB.id); }
  }
  /* Elegir la línea a la que se aplica la operación */
  const NO_LINE = new Set(['pascal', 'bayes', 'notable']);
  const pickBar = document.createElement('div');
  pickBar.id = 'pickBar';
  pickBar.className = 'mi-callout mi-callout--pio pick-bar';
  pickBar.setAttribute('role', 'status');
  pickBar.hidden = true;
  pickBar.append(pio.badge('pizarra', 'pio-sm', 'Pío en la pizarra'));
  const pickTxt = document.createElement('div');
  pickTxt.innerHTML = '<span class="mi-label">Elige la línea</span><p></p>';
  pickBar.appendChild(pickTxt);
  const pickActs = document.createElement('div');
  pickActs.className = 'pick-acts';
  const pkUse = document.createElement('button'); pkUse.type = 'button'; pkUse.className = 'mi-btn mi-btn--primary mi-btn--sm'; pkUse.textContent = 'Aplicar';
  const pkCancel = document.createElement('button'); pkCancel.type = 'button'; pkCancel.className = 'mi-btn mi-btn--ghost mi-btn--sm'; pkCancel.textContent = 'Cancelar';
  pickActs.append(pkUse, pkCancel);
  pickBar.appendChild(pickActs);
  document.body.appendChild(pickBar);
  const TEXT_OPS = ['stats', 'freq', 'space'];
  const pickable = (b, key) => !!b && (b.type === 'math' || b.type === 'deriv' || (b.type === 'text' && TEXT_OPS.includes(key)));
  function pickLabel(id, row) {
    const b = R('blocks/editor').blockById(id);
    return 'Línea ' + R('ui/toolbar').lineNo(id) + (b && b.type === 'deriv' && row != null ? ' · paso ' + (row + 1) : '');
  }
  function pickClear(cls) { $$('.' + cls, blocksEl).forEach((x) => x.classList.remove(cls)); }
  function pickDefault() {
    const a = R('blocks/editor').activeBlock();
    if (!a || !pickable(a, ST.picking.key)) return null;
    return { id: a.id, row: a.type === 'deriv' ? (ST.activeCell && ST.activeCell.id === a.id ? ST.activeCell.row : a.rows.length - 1) : null };
  }
  // Muestra en la barra de Pío a qué línea se va a aplicar
  function pickSay(t, hover) {
    const p = pickTxt.querySelector('p');
    const op = '«' + ST.picking.label + '»';
    const tg = ST.picking.target;
    const lab = (x) => pickLabel(x.id, x.row).replace('Línea', 'línea');
    const bold = (txt) => { const s1 = document.createElement('b'); s1.textContent = txt; return s1; };
    p.innerHTML = '';
    if (t && hover && !(tg && tg.id === t.id && tg.row === t.row)) {
      p.append('Haz clic para marcar la ', bold(lab(t)), ' como destino de ' + op + '. No se aplica hasta que pulses «Aceptar».');
    } else if (tg) {
      p.append('¿Aplicar ' + op + ' a la ', bold(lab(tg)), '? Pulsa «Aceptar» (o Intro) para hacerlo, o haz clic en otra línea para cambiarla. Esc cancela.');
    } else {
      p.textContent = op + ': haz clic en la línea o en el paso del desarrollo al que quieres aplicarla (las válidas parpadean) y después pulsa «Aceptar». Esc cancela.';
    }
    pickTxt.querySelector('.mi-label').textContent = tg ? 'Confirma la línea' : 'Elige la línea';
    pkUse.textContent = 'Aceptar';
    pkUse.disabled = !tg;
  }
  function markTarget(t) {
    pickClear('pick-active'); pickClear('pick-arow');
    $$('.blk[data-pl]', blocksEl).forEach((x) => x.removeAttribute('data-pl'));
    if (!t) return;
    const el = R('blocks/editor').elById(t.id);
    if (!el) return;
    el.classList.add('pick-active');
    el.dataset.pl = '↵ ' + pickLabel(t.id, t.row);
    if (t.row != null) $$('[data-row="' + t.row + '"]', el).forEach((c) => { if (c.classList.contains('dcell') || c.classList.contains('dnote')) c.classList.add('pick-arow'); });
  }
  function startPick(key, label) {
    if (body.dataset.mode !== 'write') R('ui/mode-pages').setMode('write');
    if (NO_LINE.has(key)) { runOp(key); return; }
    ST.picking = { key, label: (label || '').trim(), target: null };
    body.classList.add('picking');
    $$('.blk', blocksEl).forEach((el) => { const ok = pickable(R('blocks/editor').blockById(el.dataset.id), key); el.classList.toggle('pick-ok', ok); el.classList.toggle('pick-no', !ok); });
    ST.picking.target = pickDefault();
    markTarget(ST.picking.target);
    pickSay(ST.picking.target, false);
    pickBar.hidden = false;
    if (ST.picking.target) { const el = R('blocks/editor').elById(ST.picking.target.id); if (el) el.scrollIntoView({ block: 'nearest' }); }
  }
  function endPick() {
    ST.picking = null;
    body.classList.remove('picking', 'pick-hovering');
    pickBar.hidden = true;
    for (const c of ['pick-hover', 'pick-rhover', 'pick-ok', 'pick-no', 'pick-active', 'pick-arow']) pickClear(c);
    $$('.blk[data-pl]', blocksEl).forEach((x) => x.removeAttribute('data-pl'));
  }
  function pickAndRun(blockEl, rowIdx) {
    const key = ST.picking.key, label = ST.picking.label;
    endPick();
    const id = blockEl.dataset.id;
    const b = R('blocks/editor').blockById(id);
    if (!b) return;
    R('blocks/editor').setActive(id);
    if (b.type === 'deriv') ST.activeCell = { id, row: rowIdx != null ? rowIdx : b.rows.length - 1, col: 'r' };
    else ST.activeCell = null;
    if (b.type === 'deriv') R('blocks/deriv').markRow(id, ST.activeCell.row);
    const where = pickLabel(id, b.type === 'deriv' ? ST.activeCell.row : null);
    flashBlock(blockEl);
    const before = new Set(S.page().blocks.map((x) => x.id));
    const rowsBefore = b.type === 'deriv' ? b.rows.length : 0;
    runOp(key);
    const fresh = S.page().blocks.find((x) => !before.has(x.id));
    if (fresh) {
      const fe = R('blocks/editor').elById(fresh.id);
      if (fe) setTimeout(() => flashBlock(fe), 250);
      toast('«' + label + '» aplicado a la ' + where.replace('Línea', 'línea') + '. El resultado empieza en la línea ' + R('ui/toolbar').lineNo(fresh.id) + '.');
    } else if (b.type === 'deriv' && b.rows.length > rowsBefore) {
      toast('«' + label + '» aplicado a la ' + where.replace('Línea', 'línea') + '. El resultado es el paso ' + (ST.activeCell && ST.activeCell.id === b.id ? ST.activeCell.row + 1 : b.rows.length) + '.');
    }
  }
  function flashBlock(el) { el.classList.remove('pick-done'); void el.offsetWidth; el.classList.add('pick-done'); setTimeout(() => el.classList.remove('pick-done'), 950); }
  pkUse.addEventListener('click', () => { if (!ST.picking || !ST.picking.target) return; const el = R('blocks/editor').elById(ST.picking.target.id); if (el) pickAndRun(el, ST.picking.target.row); });
  pkCancel.addEventListener('click', endPick);
  function pickTargetOf(e) {
    const el = e.target.closest('.blk');
    if (!el) return null;
    const b = R('blocks/editor').blockById(el.dataset.id);
    const r = e.target.closest('[data-row]');
    return { el, b, row: b && b.type === 'deriv' ? (r ? +r.dataset.row : b.rows.length - 1) : null };
  }
  // clic sobre una línea mientras se elige: con ratón se aplica directamente;
  // con lápiz o dedo, el primer toque la marca y el segundo (o «Aplicar») la confirma
  blocksEl.addEventListener('pointerdown', (e) => {
    if (!ST.picking) return;
    const t = pickTargetOf(e);
    if (!t || e.target.closest('.x-del,.blk-handle')) return;
    e.preventDefault();
    e.stopPropagation();
    if (!pickable(t.b, ST.picking.key)) { toast('Esa línea no sirve para «' + ST.picking.label + '»: elige una fórmula o un paso de un desarrollo (las líneas que parpadean).'); return; }
    // solo marca la línea: la operación se lanza únicamente con «Aceptar» (o Intro)
    ST.picking.target = { id: t.b.id, row: t.row };
    markTarget(ST.picking.target);
    pickSay(ST.picking.target, false);
    pkUse.classList.remove('pk-nudge'); void pkUse.offsetWidth; pkUse.classList.add('pk-nudge');
    setTimeout(() => { try { pkUse.focus({ preventScroll: true }); } catch (x) { /* */ } }, 0);
  }, true);
  blocksEl.addEventListener('pointerover', (e) => {
    if (!ST.picking || e.pointerType !== 'mouse') return;
    pickClear('pick-hover'); pickClear('pick-rhover');
    const t = pickTargetOf(e);
    if (!t || !pickable(t.b, ST.picking.key)) { body.classList.remove('pick-hovering'); pickSay(ST.picking.target, false); return; }
    t.el.classList.add('pick-hover');
    t.el.dataset.pl = pickLabel(t.b.id, t.row);
    body.classList.add('pick-hovering');
    if (t.row != null) $$('[data-row="' + t.row + '"]', t.el).forEach((c) => { if (c.classList.contains('dcell') || c.classList.contains('dnote')) c.classList.add('pick-rhover'); });
    pickSay({ id: t.b.id, row: t.row }, true);
  });
  blocksEl.addEventListener('pointerleave', () => {
    if (!ST.picking) return;
    pickClear('pick-hover'); pickClear('pick-rhover');
    body.classList.remove('pick-hovering');
    markTarget(ST.picking.target);
    pickSay(ST.picking.target, false);
  });
  window.addEventListener('keydown', (e) => {
    if (!ST.picking) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); endPick(); }
    else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); pkUse.click(); }
  }, true);
  function runOp(key) {
    if (body.dataset.mode !== 'write') R('ui/mode-pages').setMode('write');
    if (key === 'bayes') { R('ui/bayes-dialog').runBayes(); return; }
    if (key === 'notable') { const a = R('blocks/editor').activeBlock(); const pb = S.page().blocks; insertSpecs(a ? a.id : pb.length ? pb[pb.length - 1].id : null, R('engine/ops').notableTable(), a); return; }
    const b = R('ui/calc').syncActive();
    if (!b || (b.type !== 'math' && b.type !== 'deriv' && !(b.type === 'text' && ['stats', 'freq', 'space'].includes(key)))) { toast('Coloca el cursor en una línea con los datos y vuelve a elegir la operación.'); return; }
    const isD = b.type === 'deriv';
    const ri = isD ? R('ui/calc').derivRowIndex(b) : -1;
    const row = isD ? b.rows[ri] : null;
    const src = isD ? (row.r || row.l) : b.v;
    const full = isD ? (row.l && row.r ? row.l + '=' + row.r : row.r || row.l) : b.v;
    const env = isD ? R('ui/calc').otherDefs(b.id, ri) : R('ui/calc').otherDefs(b.id);
    const lines = [];
    for (const x of S.page().blocks) { if (x.type === 'math' && x.id !== b.id) lines.push(x.v); if (x.type === 'deriv') x.rows.forEach((r) => { if (r.l && r.r) lines.push(r.l + '=' + r.r); }); }
    try {
      if (!['next', 'check', 'pascal', 'gauss', 'gj'].includes(key) && !String(src || '').trim()) throw new R('engine/core').MErr('La línea está vacía: escribe primero los datos.');
      let specs = null;
      switch (key) {
        case 'gauss': R('ui/calc').runGauss(false); return;
        case 'gj': R('ui/calc').runGauss(true); return;
        case 'inv': specs = R('engine/ops').inverseSteps(src, env); break;
        case 'detS': specs = R('engine/ops').detSarrus(src, env); break;
        case 'detC': specs = R('engine/ops').detCofactor(src, env); break;
        case 'detG': specs = R('engine/ops').detGauss(src, env); break;
        case 'cramer': specs = R('engine/ops').cramer(src); break;
        case 'param': specs = R('engine/ops').paramDiscussion(src); break;
        case 'prod': specs = R('engine/ops').productDeveloped(src, env); break;
        case 'eigen': specs = R('engine/ops').eigen(src, env); break;
        case 'dot': specs = R('engine/ops').vecDot(src, env); break;
        case 'cross': specs = R('engine/ops').vecCross(src, env); break;
        case 'norm': specs = R('engine/ops').vecNorm(src, env); break;
        case 'angle': specs = R('engine/ops').vecAngle(src, env); break;
        case 'proj': specs = R('engine/ops').vecProj(src, env); break;
        case 'fracS': specs = R('engine/ops').simplifyFraction(src); break;
        case 'fracO': specs = R('engine/ops').fractionOps(src); break;
        case 'mcd': specs = R('engine/ops').gcdLcm(src); break;
        case 'primes': specs = R('engine/ops').primeFactor(src); break;
        case 'polyOp': specs = R('engine/ops').polyOperate(full); break;
        case 'polyDiv': specs = R('engine/ops').polyDivide(full); break;
        case 'polyRoots': specs = R('engine/ops').polyRoots(full); break;
        case 'comb': specs = R('engine/ops').combinatorics(full); break;
        case 'pascal': specs = R('engine/ops').pascal(src || ''); break;
        case 'truth': specs = R('engine/ops').truthTable(full); break;
        case 'sets': specs = R('engine/ops').setOperate(full, lines); break;
        case 'stats': specs = R('engine/ops').statsSummary(full); break;
        case 'freq': specs = R('engine/ops').freqTable(full); break;
        case 'space': specs = R('engine/ops').sampleSpace(full); break;
        case 'cont': specs = R('engine/ops').contingency(src, env); break;
        case 'binom': specs = R('engine/ops').binomial(full); break;
        case 'normal': specs = R('engine/ops').normal(full); break;
        case 'venn': { const ex = R('blocks/venn').vennExprFrom(full); const r0 = R('engine/ops').vennEval(ex, R('blocks/venn').VENN_NAMES); specs = [{ type: 'venn', n: r0.n, expr: ex, shade: [], showEls: true }]; break; }
        case 'deriv': specs = R('engine/ops').derivative(full); break;
        case 'integral': specs = R('engine/ops').integralSteps(full); break;
        case 'ang': specs = R('engine/ops').angleConvert(full); break;
        case 'trig': specs = R('engine/ops').trigRatios(full); break;
        case 'notable': specs = R('engine/ops').notableTable(); break;
        case 'tri': specs = R('engine/ops').solveTriangle(full); break;
        case 'lines': specs = R('engine/ops').linesRelative(full); break;
        case 'transv': specs = R('engine/ops').transversal(full); break;
        case 'extr1': specs = R('engine/ops').extrema1(full); break;
        case 'extr2': specs = R('engine/ops').extrema2(full); break;
        case 'partial': specs = R('engine/ops').partials(full); break;
        case 'grad': specs = R('engine/ops').gradient(full); break;
        case 'hess': specs = R('engine/ops').hessian(full); break;
        case 'jacob': specs = R('engine/ops').jacobian(full); break;
        case 'divrot': specs = R('engine/ops').divRot(full); break;
        case 'graph': specs = R('engine/ops').graphOf(full); break;
        case 'values': specs = R('engine/ops').valueTable(full); break;
        case 'solve': {
          if (isD) {
            const added = [];
            for (let k = 0; k < 20; k++) { const st = R('engine/ops').nextStep(b.rows.concat(added)); if (!st) break; added.push(Object.assign({ boxed: false }, st)); }
            if (!added.length) { toast('Este desarrollo ya está resuelto.'); return; }
            b.rows.push(...added.map((r) => ({ l: r.l || '', r: r.r || '', note: r.note || '', boxed: !!r.boxed })));
            R('blocks/deriv').rebuildDeriv(b); S.save(); R('blocks/deriv').focusCell(b.id, b.rows.length - 1, 'r', 'end');
            return;
          }
          const res = R('engine/ops').solveEquation(b.v);
          // la línea se convierte en el desarrollo resuelto
          const blk = specToBlock(res[0]);
          b.type = 'deriv'; b.rows = blk.rows; delete b.v; delete b.result; b.boxed = false;
          R('blocks/editor').elById(b.id).replaceWith(R('blocks/editor').makeBlockEl(b));
          S.save();
          R('blocks/deriv').focusCell(b.id, b.rows.length - 1, 'r', 'end');
          return;
        }
        case 'next': {
          if (!isD) throw new R('engine/core').MErr('«Siguiente paso» funciona dentro de un desarrollo. Usa «Resolver paso a paso» o crea un desarrollo con Alt+L.');
          const st = R('engine/ops').nextStep(b.rows.slice(0, ri + 1));
          if (!st) { toast('No hay más pasos: la ecuación ya está resuelta.'); return; }
          R('blocks/deriv').addRow(b, ri, { l: st.l || '', r: st.r || '', note: st.note || '', boxed: !!st.boxed });
          return;
        }
        case 'check': {
          if (!isD) throw new R('engine/core').MErr('«Comprobar solución» funciona dentro de un desarrollo resuelto.');
          const rows = R('engine/ops').checkSolution(b.rows);
          b.rows.push(...rows.map((r) => ({ l: r.l, r: r.r, note: r.note, boxed: false })));
          R('blocks/deriv').rebuildDeriv(b); S.save(); R('blocks/deriv').focusCell(b.id, b.rows.length - 1, 'note', 'end');
          return;
        }
        default: return;
      }
      if (specs && specs.length) insertSpecs(b.id, specs, b);
    } catch (e) {
      if (!(e instanceof R('engine/core').MErr)) console.error(e);
      toast(e instanceof R('engine/core').MErr ? e.message : 'No he podido hacer esta operación con lo que hay en la línea.', 'aviso');
    }
  }
  return { OPS_MENU, specToBlock, insertSpecs, NO_LINE, pickBar, pickTxt, pickActs, pkUse, pkCancel, TEXT_OPS, pickable, pickLabel, pickClear, pickDefault, pickSay, markTarget, startPick, endPick, pickAndRun, flashBlock, pickTargetOf, runOp };
});
