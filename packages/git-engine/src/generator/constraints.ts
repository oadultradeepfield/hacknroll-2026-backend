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

/**
 * Calculates minimum depth for file targets based on difficulty
 * Ensures puzzles require building a meaningful commit history
 *
 * @param difficultyLevel - Difficulty level (1-7)
 * @returns Minimum depth for file placement
 */
export function getMinDepthForDifficulty(difficultyLevel: number): number {
  // Difficulty 1-2: Files can be at depth 1 (immediate commits)
  // Difficulty 3-4: Files must be at least depth 2
  // Difficulty 5-7: Files must be at least depth 2-3
  if (difficultyLevel <= 2) {
    return 1;
  } else if (difficultyLevel <= 4) {
    return 2;
  } else {
    return 2;
  }
}

/**
 * Returns the minimum number of different branches that must have file targets
 * based on the difficulty level
 *
 * @param difficultyLevel - Difficulty level (1-7)
 * @returns Minimum number of non-main branches with file targets
 */
export function getMinRequiredBranchesForDifficulty(
  difficultyLevel: number,
): number {
  // Difficulty 1-2: At least 1 non-main branch
  // Difficulty 3-4: At least 2 non-main branches
  // Difficulty 5-7: At least 2 non-main branches (keeps puzzles solvable)
  if (difficultyLevel <= 2) {
    return 1;
  } else if (difficultyLevel <= 4) {
    return 2;
  } else {
    return 2;
  }
}

/**
 * Returns the minimum par score based on difficulty
 * Ensures puzzles are complex enough for their difficulty level
 *
 * @param difficultyLevel - Difficulty level (1-7)
 * @returns Minimum par score
 */
export function getMinParForDifficulty(difficultyLevel: number): number {
  // Base of 3, plus difficulty level
  // This ensures difficulty 1 has at least 4 commands, difficulty 7 has at least 10
  return 3 + difficultyLevel;
}

/**
 * Returns the maximum par score based on difficulty
 *
 * @param difficultyLevel - Difficulty level (1-7)
 * @returns Maximum par score
 */
export function getMaxParForDifficulty(difficultyLevel: number): number {
  return 8 + difficultyLevel * 2;
}

/**
 * Returns difficulty-specific configuration for puzzle generation
 *
 * @param difficultyLevel - Difficulty level (1-7)
 * @returns Object containing all difficulty parameters
 */
export function getDifficultyConfig(difficultyLevel: number): {
  minDepth: number;
  maxDepth: number;
  minBranches: number;
  minPar: number;
  maxPar: number;
  requiresRebase: boolean;
  minFilesPerBranch: number;
} {
  return {
    minDepth: getMinDepthForDifficulty(difficultyLevel),
    maxDepth: getMaxDepthForDifficulty(difficultyLevel),
    minBranches: getMinRequiredBranchesForDifficulty(difficultyLevel),
    minPar: getMinParForDifficulty(difficultyLevel),
    maxPar: getMaxParForDifficulty(difficultyLevel),
    requiresRebase: difficultyLevel >= 4,
    minFilesPerBranch: difficultyLevel >= 5 ? 2 : 1,
  };
}
