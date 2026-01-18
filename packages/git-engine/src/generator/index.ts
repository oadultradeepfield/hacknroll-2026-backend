import type { GeneratedPuzzle, PuzzleGeneratorConfig } from "../types";
import { ConstructiveGenerator } from "./constructive";

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
    minFiles: Math.min(6 + Math.floor(difficulty / 2), 12),
    maxFiles: Math.min(10 + difficulty, 20),
    minPar: 6 + difficulty,
    maxPar: 12 + difficulty * 2,
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
    minFiles: Math.min(6 + Math.floor(difficulty / 2), 12),
    maxFiles: Math.min(10 + difficulty, 20),
    minPar: 6 + difficulty,
    maxPar: 12 + difficulty * 2,
    requiredCommandTypes: difficulty >= 4 ? ["merge", "rebase"] : ["merge"],
  };
}

export class PuzzleGenerator {
  private config: PuzzleGeneratorConfig;

  constructor(config: PuzzleGeneratorConfig) {
    this.config = config;
  }

  generate(): GeneratedPuzzle | null {
    const generator = new ConstructiveGenerator(this.config);
    return generator.generate();
  }
}
