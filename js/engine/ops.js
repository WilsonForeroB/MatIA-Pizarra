/* Agregador de las operaciones paso a paso (sin red): devuelve el mismo objeto público que antes era `OPS` (pizarra.html, líneas 1736-4541).
   Cada operación devuelve una lista de bloques: {type:'math', v}, {type:'deriv', rows}, {type:'table', ...} o {type:'graph', ...}. */
MatIA.define('engine/ops', ['engine/ops/common', 'engine/ops/poly', 'engine/ops/expr', 'engine/ops/ecuaciones', 'engine/ops/matrices', 'engine/ops/vectores', 'engine/ops/aritmetica', 'engine/ops/polinomios', 'engine/ops/combinatoria-logica', 'engine/ops/conjuntos-venn', 'engine/ops/analisis', 'engine/ops/estadistica-probabilidad', 'engine/ops/geometria'], ($common, $poly, $expr, $ecuaciones, $matrices, $vectores, $aritmetica, $polinomios, $combinatoriaLogica, $conjuntosVenn, $analisis, $estadisticaProbabilidad, $geometria) => {
  'use strict';
  const { statsSummary, freqTable, sampleSpace, contingency, bayes, binomial, normal, Phi } = $estadisticaProbabilidad;
  const { extrema1, extrema2, D, compileFn, derivative, graphOf, valueTable } = $analisis;
  const { vennEval, vennElements, normSetText, setOperate } = $conjuntosVenn;
  const { P, rationalRoots } = $poly;
  const { parseExpr, L, simpAll, evalNum } = $expr;
  const { sqrtSimp } = $common;
  const { splitEquation, solveEquation, nextStep, checkSolution, eqSteps } = $ecuaciones;
  const { inverseSteps, detSarrus, detCofactor, detGauss, cramer, productDeveloped, paramDiscussion, eigen } = $matrices;
  const { vecDot, vecCross, vecNorm, vecAngle, vecProj } = $vectores;
  const { simplifyFraction, fractionOps, gcdLcm, primeFactor } = $aritmetica;
  const { polyOperate, polyDivide, polyRoots } = $polinomios;
  const { combinatorics, pascal, truthTable } = $combinatoriaLogica;
  const { angleConvert, trigRatios, notableTable, solveTriangle, linesRelative, transversal, geoText, parseAngle } = $geometria;

  return {
    statsSummary, freqTable, sampleSpace, contingency, bayes, binomial, normal, Phi, extrema1, extrema2, vennEval, vennElements, normSetText, P, parseExpr, L, simpAll, D, evalNum, compileFn, rationalRoots, sqrtSimp, splitEquation, inverseSteps, detSarrus, detCofactor, detGauss, cramer, productDeveloped, paramDiscussion, eigen, vecDot, vecCross, vecNorm, vecAngle, vecProj, solveEquation, nextStep, checkSolution, eqSteps, simplifyFraction, fractionOps, gcdLcm, primeFactor, polyOperate, polyDivide, polyRoots, combinatorics, pascal, truthTable, setOperate, derivative, graphOf, valueTable, angleConvert, trigRatios, notableTable, solveTriangle, linesRelative, transversal, geoText, parseAngle,
  };
});
