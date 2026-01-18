import type { Command, FileTarget, PuzzleConstraints } from "@repo/shared";
import { GitEngine } from "../engine";
import type { GeneratedPuzzle, PuzzleGeneratorConfig } from "../types";
import { getConstraintsForDifficulty } from "./constraints";
import { FILE_NAMES } from "./file-targets";
import { SeededRandom } from "./seeded-random";

interface VisitedState {
  branch: string;
  depth: number;
}

const MINIMUM_BRANCHES = 5;
const MINIMUM_FILES = 10;

const BRANCH_NAMES = [
  "feature",
  "develop",
  "bugfix",
  "hotfix",
  "release",
  "feature-a",
  "feature-b",
  "feature-c",
  "staging",
  "experiment",
  "feature-x",
  "feature-y",
];

export class ConstructiveGenerator {
  private random: SeededRandom;
  private config: PuzzleGeneratorConfig;

  constructor(config: PuzzleGeneratorConfig) {
    this.config = config;
    this.random = new SeededRandom(config.seed);
  }

  generate(): GeneratedPuzzle | null {
    for (let attempt = 0; attempt < 100; attempt++) {
      this.random = new SeededRandom(this.config.seed + attempt);

      const puzzle = this.tryGenerate();
      if (puzzle) {
        // Final verification - run the solution and check all files collected
        if (this.verifySolution(puzzle)) {
          return puzzle;
        }
      }
    }

    return null;
  }

  private verifySolution(puzzle: GeneratedPuzzle): boolean {
    const { fileTargets, constraints, solution } = puzzle;

    // Must have minimum files and branches
    if (fileTargets.length < MINIMUM_FILES) {
      return false;
    }

    const branches = new Set(fileTargets.map((f) => f.branch));
    if (branches.size < MINIMUM_BRANCHES) {
      return false;
    }

    // No files on main
    if (fileTargets.some((f) => f.branch === "main")) {
      return false;
    }

    // All depths must be positive
    if (fileTargets.some((f) => f.depth <= 0)) {
      return false;
    }

    // Run the solution and verify all files are collected
    const engine = new GitEngine(
      GitEngine.createInitialGraph(),
      JSON.parse(JSON.stringify(fileTargets)),
      constraints,
    );

    for (const cmd of solution) {
      const result = engine.executeCommand(cmd);
      if (!result.success) {
        return false;
      }
    }

    const collected = engine.getCollectedFiles();
    return collected.length === fileTargets.length;
  }

  private tryGenerate(): GeneratedPuzzle | null {
    const constraints = this.buildConstraints();

    // Step 1: Build the solution step by step, tracking states
    const result = this.buildSolutionWithStates(constraints);
    if (!result) {
      return null;
    }

    const { solution, visitedStates } = result;

    // Step 2: Filter to valid file placement states
    const validStates = this.filterValidStates(visitedStates);
    if (validStates.length < MINIMUM_FILES) {
      return null;
    }

    // Step 3: Check branch diversity
    const branchSet = new Set(validStates.map((s) => s.branch));
    if (branchSet.size < MINIMUM_BRANCHES) {
      return null;
    }

    // Step 4: Select file targets
    const fileTargets = this.selectFileTargets(validStates, branchSet);
    if (!fileTargets || fileTargets.length < MINIMUM_FILES) {
      return null;
    }

    return {
      fileTargets,
      constraints,
      solution,
      parScore: solution.length,
    };
  }

  private buildConstraints(): PuzzleConstraints {
    const base = getConstraintsForDifficulty(this.config.difficultyLevel);

    return {
      ...base,
      allowedBranches: ["main", ...BRANCH_NAMES],
    };
  }

  /**
   * Build solution by actually executing commands and tracking state after each.
   * This ensures solution is valid and we know exactly what states are visited.
   */
  private buildSolutionWithStates(
    constraints: PuzzleConstraints,
  ): { solution: Command[]; visitedStates: VisitedState[] } | null {
    const engine = new GitEngine(
      GitEngine.createInitialGraph(),
      [],
      constraints,
    );

    const solution: Command[] = [];
    const visitedStates: VisitedState[] = [];
    const seenStateKeys = new Set<string>();

    const recordState = () => {
      const graph = engine.getGraph();
      if (graph.head.type !== "attached") return;

      const branchName = graph.head.ref;
      const branch = graph.branches[branchName];
      if (!branch) return;

      const commit = graph.commits[branch.tipCommitId];
      if (!commit) return;

      const key = `${branchName}:${commit.depth}`;
      if (!seenStateKeys.has(key)) {
        seenStateKeys.add(key);
        visitedStates.push({ branch: branchName, depth: commit.depth });
      }
    };

    const execute = (cmd: Command): boolean => {
      const result = engine.executeCommand(cmd);
      if (result.success) {
        solution.push(cmd);
        recordState();
        return true;
      }
      return false;
    };

    // Select branches for this puzzle
    const branchCount = Math.max(
      MINIMUM_BRANCHES,
      this.config.difficultyLevel + 3,
    );
    const shuffledBranches = this.random.shuffle([...BRANCH_NAMES]);
    const selectedBranches = shuffledBranches.slice(0, branchCount);

    // Calculate commits per branch to ensure enough file slots
    const minCommitsPerBranch = Math.max(
      2,
      Math.ceil(MINIMUM_FILES / branchCount) + 1,
    );

    // Build each branch
    for (const branchName of selectedBranches) {
      // 1. Create branch (from main)
      if (!execute({ type: "branch", name: branchName })) {
        return null;
      }

      // 2. Checkout the branch - CRITICAL: must checkout before committing
      if (!execute({ type: "checkout", target: branchName })) {
        return null;
      }

      // 3. Make commits on this branch
      const numCommits = minCommitsPerBranch + this.random.nextInt(0, 2);
      for (let i = 0; i < numCommits; i++) {
        if (!execute({ type: "commit", message: `${branchName}-${i + 1}` })) {
          return null;
        }
      }

      // 4. Return to main
      if (!execute({ type: "checkout", target: "main" })) {
        return null;
      }

      // 5. Merge branch into main
      if (!execute({ type: "merge", branch: branchName })) {
        return null;
      }
    }

    // Add rebase if required
    if (this.config.requiredCommandTypes.includes("rebase")) {
      const rebaseBranch = `rebase-branch`;

      if (!execute({ type: "branch", name: rebaseBranch })) {
        return null;
      }
      if (!execute({ type: "checkout", target: rebaseBranch })) {
        return null;
      }
      if (!execute({ type: "commit", message: "rebase-1" })) {
        return null;
      }
      if (!execute({ type: "commit", message: "rebase-2" })) {
        return null;
      }
      if (!execute({ type: "rebase", onto: "main" })) {
        return null;
      }
      if (!execute({ type: "checkout", target: "main" })) {
        return null;
      }
      if (!execute({ type: "merge", branch: rebaseBranch })) {
        return null;
      }
    }

    return { solution, visitedStates };
  }

  private filterValidStates(states: VisitedState[]): VisitedState[] {
    return states.filter((s) => s.branch !== "main" && s.depth > 0);
  }

  private selectFileTargets(
    states: VisitedState[],
    branchSet: Set<string>,
  ): FileTarget[] | null {
    const fileNames = this.random.shuffle([...FILE_NAMES]);
    let nameIdx = 0;

    const targets: FileTarget[] = [];
    const usedKeys = new Set<string>();

    // Group by branch
    const byBranch = new Map<string, VisitedState[]>();
    for (const state of states) {
      if (state.branch === "main") continue;
      const list = byBranch.get(state.branch) || [];
      list.push(state);
      byBranch.set(state.branch, list);
    }

    // Ensure each branch gets at least 2 files
    for (const branch of branchSet) {
      if (branch === "main") continue;

      const branchStates = byBranch.get(branch) || [];
      if (branchStates.length === 0) continue;

      const shuffled = this.random.shuffle([...branchStates]);
      const count = Math.min(2, shuffled.length);

      for (let i = 0; i < count; i++) {
        const state = shuffled[i];
        const key = `${state.branch}:${state.depth}`;

        if (usedKeys.has(key)) continue;
        if (nameIdx >= fileNames.length) return null;

        usedKeys.add(key);
        targets.push({
          branch: state.branch,
          depth: state.depth,
          fileName: fileNames[nameIdx++],
          collected: false,
        });
      }
    }

    // Fill up to minimum
    const remaining = states.filter(
      (s) => s.branch !== "main" && !usedKeys.has(`${s.branch}:${s.depth}`),
    );
    const shuffledRemaining = this.random.shuffle([...remaining]);

    for (const state of shuffledRemaining) {
      if (targets.length >= MINIMUM_FILES) break;
      if (nameIdx >= fileNames.length) return null;

      const key = `${state.branch}:${state.depth}`;
      if (usedKeys.has(key)) continue;

      usedKeys.add(key);
      targets.push({
        branch: state.branch,
        depth: state.depth,
        fileName: fileNames[nameIdx++],
        collected: false,
      });
    }

    return targets.length >= MINIMUM_FILES ? targets : null;
  }
}
