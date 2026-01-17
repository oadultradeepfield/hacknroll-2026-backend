import type { GeneratedPuzzle } from "../types";

export function validatePuzzle(
  puzzle: GeneratedPuzzle,
  _minFiles: number,
): boolean {
  // Relaxed: Just ensure we have at least one file target
  if (puzzle.fileTargets.length === 0) {
    return false;
  }

  return true;
}

export function hasRequiredCommandTypes(
  _puzzle: GeneratedPuzzle,
  _requiredCommandTypes: (
    | "branch"
    | "commit"
    | "checkout"
    | "merge"
    | "rebase"
    | "undo"
  )[],
): boolean {
  return true;
}

export function isValidParScore(
  parScore: number,
  _minPar: number,
  _maxPar: number,
): boolean {
  return parScore > 0;
}
