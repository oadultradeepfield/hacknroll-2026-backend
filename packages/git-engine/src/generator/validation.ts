import type { GeneratedPuzzle } from "../types";

export function validatePuzzle(
  puzzle: GeneratedPuzzle,
  minFiles: number,
): boolean {
  if (puzzle.fileTargets.length < minFiles) {
    return false;
  }

  if (!usesMultipleBranches(puzzle)) {
    return false;
  }

  return true;
}

function usesMultipleBranches(puzzle: GeneratedPuzzle): boolean {
  const branches = new Set(puzzle.fileTargets.map((target) => target.branch));
  return branches.size >= 2;
}

export function hasRequiredCommandTypes(
  puzzle: GeneratedPuzzle,
  requiredCommandTypes: (
    | "branch"
    | "commit"
    | "checkout"
    | "merge"
    | "rebase"
    | "undo"
  )[],
): boolean {
  if (!puzzle.solution) {
    return false;
  }

  const usedTypes = new Set(puzzle.solution.map((command) => command.type));

  for (const requiredType of requiredCommandTypes) {
    if (!usedTypes.has(requiredType)) {
      return false;
    }
  }

  return true;
}

export function isValidParScore(
  parScore: number,
  minPar: number,
  maxPar: number,
): boolean {
  return parScore >= minPar && parScore <= maxPar;
}
