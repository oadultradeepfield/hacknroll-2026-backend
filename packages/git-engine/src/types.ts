import type {
  Command,
  FileTarget,
  GitGraph,
  PuzzleConstraints,
} from "@repo/shared";

export interface RebasedCommitMapping {
  originalBranch: string;
  originalDepth: number;
  newDepth: number;
}

export interface CommandResult {
  success: boolean;
  newGraph?: GitGraph;
  collectedFiles?: string[];
  error?: string;
  isGameComplete?: boolean;
  rebasedCommitMappings?: RebasedCommitMapping[];
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface SolverState {
  graph: GitGraph;
  collectedFiles: Set<string>;
  commands: Command[];
}

export interface SolverResult {
  solved: boolean;
  solution?: Command[];
  totalCommands?: number;
  statesExplored: number;
}

export interface PuzzleGeneratorConfig {
  seed: string;
  difficultyLevel: number;
  minFiles: number;
  maxFiles: number;
  minPar: number;
  maxPar: number;
  requiredCommandTypes: (
    | "branch"
    | "commit"
    | "checkout"
    | "merge"
    | "rebase"
    | "undo"
  )[];
}

export interface GeneratedPuzzle {
  fileTargets: FileTarget[];
  constraints: PuzzleConstraints;
  solution: Command[];
  parScore: number;
}
