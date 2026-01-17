import type { FileTarget, PuzzleConstraints } from "@repo/shared";
import { GitEngine } from "../engine";
import { solvePuzzle } from "../solver";
import type { GeneratedPuzzle, PuzzleGeneratorConfig } from "../types";
import {
  getConstraintsForDifficulty,
  getMaxDepthForDifficulty,
} from "./constraints";
import { generateFileTargets } from "./file-targets";
import { SeededRandom } from "./seeded-random";
import {
  hasRequiredCommandTypes,
  isValidParScore,
  validatePuzzle,
} from "./validation";

export function generateDailyPuzzle(date: string): GeneratedPuzzle | null {
  const dayOfWeek = new Date(date).getDay();
  const difficulty = dayOfWeek === 0 ? 7 : dayOfWeek;

  const config = buildDailyPuzzleConfig(date, difficulty);
  const generator = new PuzzleGenerator(config);
  return generator.generate();
}

export function generateArchivePuzzle(
  seed: string,
  difficulty: number,
): GeneratedPuzzle | null {
  const config = buildArchivePuzzleConfig(seed, difficulty);
  const generator = new PuzzleGenerator(config);
  return generator.generate();
}

function buildDailyPuzzleConfig(
  date: string,
  difficulty: number,
): PuzzleGeneratorConfig {
  return {
    seed: date,
    difficultyLevel: difficulty,
    minFiles: Math.min(2 + Math.floor(difficulty / 2), 5),
    maxFiles: Math.min(3 + difficulty, 8),
    minPar: 3 + difficulty,
    maxPar: 8 + difficulty * 2,
    requiredCommandTypes: difficulty >= 4 ? ["merge", "rebase"] : ["merge"],
  };
}

function buildArchivePuzzleConfig(
  seed: string,
  difficulty: number,
): PuzzleGeneratorConfig {
  return {
    seed,
    difficultyLevel: difficulty,
    minFiles: Math.min(2 + Math.floor(difficulty / 2), 5),
    maxFiles: Math.min(3 + difficulty, 8),
    minPar: 3 + difficulty,
    maxPar: 8 + difficulty * 2,
    requiredCommandTypes: difficulty >= 4 ? ["merge", "rebase"] : ["merge"],
  };
}

export class PuzzleGenerator {
  private random: SeededRandom;
  private config: PuzzleGeneratorConfig;

  constructor(config: PuzzleGeneratorConfig) {
    this.config = config;
    this.random = new SeededRandom(config.seed);
  }

  generate(): GeneratedPuzzle | null {
    const maxAttempts = 100;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const puzzle = this.tryGenerate();
      if (puzzle && this.isValidPuzzle(puzzle)) {
        return puzzle;
      }
    }

    return null;
  }

  private tryGenerate(): GeneratedPuzzle | null {
    const numFiles = this.random.nextInt(
      this.config.minFiles,
      this.config.maxFiles,
    );

    const constraints = this.getConstraints();

    const fileTargets = this.generateFileTargets(numFiles, constraints);

    const initialGraph = GitEngine.createInitialGraph();
    const result = solvePuzzle(initialGraph, fileTargets, constraints);

    if (!result.solved || !result.solution) {
      return null;
    }

    // biome-ignore lint/style/noNonNullAssertion: result.solved check guarantees totalCommands is defined
    const parScore = result.totalCommands!;

    if (!isValidParScore(parScore, this.config.minPar, this.config.maxPar)) {
      return null;
    }

    const puzzle: GeneratedPuzzle = {
      fileTargets,
      constraints,
      solution: result.solution,
      parScore,
    };

    if (!hasRequiredCommandTypes(puzzle, this.config.requiredCommandTypes)) {
      return null;
    }

    return puzzle;
  }

  private getConstraints(): PuzzleConstraints {
    return getConstraintsForDifficulty(this.config.difficultyLevel);
  }

  private generateFileTargets(
    numFiles: number,
    constraints: PuzzleConstraints,
  ): FileTarget[] {
    const maxDepth = getMaxDepthForDifficulty(this.config.difficultyLevel);
    return generateFileTargets(numFiles, constraints, maxDepth, this.random);
  }

  private isValidPuzzle(puzzle: GeneratedPuzzle): boolean {
    return validatePuzzle(puzzle, this.config.minFiles);
  }
}
