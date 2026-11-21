/* Agregador del motor de cálculo exacto: devuelve el mismo objeto público que antes era `ME` (pizarra.html, líneas 960-1737).
   Lee el LaTeX que produce MathLive; no depende del DOM. */
MatIA.define('engine/core', ['engine/core/fraction-matrix', 'engine/core/tokenizer', 'engine/core/parser', 'engine/core/latex-definitions', 'engine/core/gauss-systems'], ($fractionMatrix, $tokenizer, $parser, $latexDefinitions, $gaussSystems) => {
  'use strict';
  const { MErr, F, fLatex, det, inv, rref, add, sub, mul, div, neg, isZ, isInt, gcd, abs, fromDec, ZERO, ONE, M, S } = $fractionMatrix;
  const { tokenize, splitEq, readName, isPureName, afterArrows } = $tokenizer;
  const { evaluate } = $parser;
  const { definitions, compute, toLatex, matLatex } = $latexDefinitions;
  const { gauss, gaussLines, parseSystem, solve } = $gaussSystems;

  return { MErr, F, fLatex, tokenize, splitEq, evaluate, definitions, compute, gauss, gaussLines, parseSystem, solve, toLatex, matLatex, det, inv, rref, readName, isPureName, afterArrows, fr: { add, sub, mul, div, neg, isZ, isInt, gcd, abs, fromDec, ZERO, ONE }, M, S };
});
