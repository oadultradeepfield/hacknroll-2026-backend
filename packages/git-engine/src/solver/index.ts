import type { FileTarget, GitGraph, PuzzleConstraints } from "@repo/shared";
import type { SolverResult } from "../types";
import { searchForSolution } from "./search-algorithm";

export class PuzzleSolver {
  private fileTargets: FileTarget[];
  private constraints: PuzzleConstraints;
  private maxDepth: number;

  constructor(
    fileTargets: FileTarget[],
    constraints: PuzzleConstraints,
    maxDepth: number = 50,
  ) {
    this.fileTargets = fileTargets;
    this.constraints = constraints;
    this.maxDepth = maxDepth;
  }

  /**
   * Solves the puzzle using breadth-first search
   *
   * @param initialGraph - The starting git graph state
   * @returns Solution result containing commands or failure state
   */
  solve(initialGraph: GitGraph): SolverResult {
    return searchForSolution(
      initialGraph,
      this.fileTargets,
      this.constraints,
      this.maxDepth,
    );
  }
}

/**
 * Factory function to solve a puzzle
 *
 * @param initialGraph - The starting git graph state
 * @param fileTargets - Files that need to be collected
 * @param constraints - Puzzle constraints
 * @returns Solution result
 */
export function solvePuzzle(
  initialGraph: GitGraph,
  fileTargets: FileTarget[],
  constraints: PuzzleConstraints,
): SolverResult {
  const solver = new PuzzleSolver(fileTargets, constraints);
  return solver.solve(initialGraph);
}
