import type { PuzzleConstraints } from "@repo/shared";
import { ALLOWED_BRANCHES, DEFAULT_CONSTRAINTS } from "@repo/shared";

export function getConstraintsForDifficulty(
  difficultyLevel: number,
): PuzzleConstraints {
  const defaults =
    DEFAULT_CONSTRAINTS[difficultyLevel] || DEFAULT_CONSTRAINTS[1];

  const numBranches = Math.min(
    defaults.maxBranches + 1,
    ALLOWED_BRANCHES.length,
  );

  return {
    ...defaults,
    allowedBranches: ALLOWED_BRANCHES.slice(0, numBranches),
  };
}

/**
 * Calculates maximum depth for file targets based on difficulty
 * Higher difficulty = deeper git graph structure
 *
 * @param difficultyLevel - Difficulty level (1-7)
 * @returns Maximum depth for file placement
 */
export function getMaxDepthForDifficulty(difficultyLevel: number): number {
  return 2 + difficultyLevel;
}
