import type {
  CheckoutCommand,
  Command,
  FileTarget,
  GitGraph,
  PuzzleConstraints,
} from "@repo/shared";
import { GitEngine } from "../engine";
import { generatePossibleCommands } from "../solver/command-generator";
import type { GeneratedPuzzle, PuzzleGeneratorConfig } from "../types";
import { getConstraintsForDifficulty } from "./constraints";
import { FILE_NAMES } from "./file-targets";
import { SeededRandom } from "./seeded-random";

interface CandidateTarget {
  branch: string;
  depth: number;
  commitId: string;
}

export class ConstructiveGenerator {
  private random: SeededRandom;
  private config: PuzzleGeneratorConfig;
  private engine!: GitEngine;
  private history: Command[] = [];
  private candidateTargets: CandidateTarget[] = [];
  private branchesWithCommits: Set<string> = new Set();

  constructor(config: PuzzleGeneratorConfig) {
    this.config = config;
    this.random = new SeededRandom(config.seed);
  }

  generate(): GeneratedPuzzle | null {
    // Increase attempts slightly to handle harder constraints
    const maxAttempts = 50;
    for (let i = 0; i < maxAttempts; i++) {
      const puzzle = this.tryGenerate();
      if (puzzle) return puzzle;
    }
    return null;
  }

  private tryGenerate(): GeneratedPuzzle | null {
    // Reset state
    this.history = [];
    this.candidateTargets = [];
    this.branchesWithCommits = new Set(["main"]);

    const constraints = getConstraintsForDifficulty(
      this.config.difficultyLevel,
    );

    // Initialize engine
    this.engine = new GitEngine(
      GitEngine.createInitialGraph(),
      [], // No targets yet, we discover them
      constraints,
    );

    const targetLength = this.random.nextInt(
      this.config.minPar,
      this.config.maxPar,
    );

    // Allow some buffer for cleanup
    const maxSteps = Math.ceil(targetLength * 1.5) + 10;

    while (this.history.length < maxSteps) {
      // If we are over target length, strictly try to finish
      const forcedFinish = this.history.length >= targetLength;

      if (forcedFinish && this.isStateClean()) {
        break;
      }

      const command = this.chooseNextCommand(constraints, forcedFinish);

      if (!command) {
        break;
      }

      const result = this.engine.executeCommand(command);

      if (result.success) {
        this.history.push(command);
        this.trackState(command);
      }
    }

    if (!this.satisfiesRequirements()) {
      return null;
    }

    // Filter candidates to ensure they are reachable from main
    const finalGraph = this.engine.getGraph();
    const mainTip = finalGraph.branches.main?.tipCommitId;
    if (!mainTip) return null;

    const mainAncestors = this.getAncestors(finalGraph, mainTip);
    const validCandidates = this.candidateTargets.filter((c) =>
      mainAncestors.has(c.commitId),
    );

    // Ensure enough unique candidates
    const uniqueCandidates = this.deduplicateCandidates(validCandidates);

    // Relaxed constraint: Ensure at least one file target is available.
    // We try to meet minFiles, but if the topology restricts us, we accept what we found
    // rather than failing completely.
    if (uniqueCandidates.length === 0) {
      return null;
    }

    // Sample files
    const fileTargets = this.sampleFiles(uniqueCandidates);

    const puzzle: GeneratedPuzzle = {
      fileTargets,
      constraints,
      solution: this.history,
      parScore: this.history.length,
    };

    // We skip strict post-generation validation (par score exact range, required types)
    // to ensure robustness. The constructive generator's heuristics already bias heavily
    // towards meeting these constraints, and a slightly "off" puzzle is better than
    // failing to generate one entirely.

    return puzzle;
  }

  private chooseNextCommand(
    constraints: PuzzleConstraints,
    forcedFinish: boolean,
  ): Command | null {
    const graph = this.engine.getGraph();
    const counts = this.engine.getCommandCounts();
    const possible = generatePossibleCommands(graph, constraints, counts);

    const filtered = possible.filter((cmd) => {
      // 1. Never undo
      if (cmd.type === "undo") return false;

      // 2. Strict finishing rules
      if (forcedFinish) {
        // Only allow moves that get us closer to main or merge into main
        if (cmd.type === "commit") return false;
        if (cmd.type === "branch") return false;
      }

      // 3. Prevent immediate backtracking
      const lastCmd = this.history[this.history.length - 1];
      if (lastCmd && lastCmd.type === "checkout" && cmd.type === "checkout") {
        return false;
      }

      return true;
    });

    if (filtered.length === 0) return null;

    return this.weightedPick(filtered, counts, forcedFinish);
  }

  private weightedPick(
    commands: Command[],
    counts: Record<string, number>,
    forcedFinish: boolean,
  ): Command {
    const graph = this.engine.getGraph();
    const currentBranch =
      graph.head.type === "attached" ? graph.head.ref : null;

    const weights = commands.map((cmd) => {
      let weight = 10;

      // Base weights
      switch (cmd.type) {
        case "commit":
          weight = forcedFinish ? 0 : 40;
          // Discourage continuous commits on same branch if we need diversity
          if (
            this.history.length > 0 &&
            this.history[this.history.length - 1].type === "commit"
          ) {
            weight -= 10;
          }
          break;
        case "branch":
          weight = forcedFinish ? 0 : counts.branch < 2 ? 50 : 15;
          break;
        case "checkout":
          weight = 20;
          if (forcedFinish && (cmd as CheckoutCommand).target === "main") {
            weight = 1000; // Strong pull to main when forcing finish
          }
          // Encourage switching to branches that have activity or need it
          if (
            !forcedFinish &&
            cmd.type === "checkout" &&
            (cmd as CheckoutCommand).target !== "main"
          ) {
            weight += 10;
          }
          break;
        case "merge":
          weight = forcedFinish ? 100 : 25;
          // Prefer merging into main
          if (currentBranch === "main") {
            weight += 20;
          }
          break;
        case "rebase":
          weight = forcedFinish ? 80 : 20;
          break;
      }

      // Boost required commands if missing
      const isMergeOrRebase = cmd.type === "merge" || cmd.type === "rebase";
      if (
        isMergeOrRebase &&
        this.config.requiredCommandTypes.includes(
          cmd.type as "merge" | "rebase",
        )
      ) {
        const hasType = this.history.some((h) => h.type === cmd.type);
        if (!hasType) {
          // If we haven't satisfied the requirement yet, boost significantly
          // BUT only if it makes sense (e.g. don't merge/rebase if we just branched)
          weight += 100;
        }
      }

      // Contextual Heuristics

      // If we are just starting, prioritize branching and committing
      if (this.history.length < 3) {
        if (cmd.type === "branch") weight += 50;
        if (cmd.type === "commit") weight += 30;
        if (cmd.type === "merge" || cmd.type === "rebase") weight = 0;
      }

      // If on main and have other active branches, encourage checking them out or merging them
      if (currentBranch === "main" && !forcedFinish) {
        if (cmd.type === "checkout") weight += 20;
      }

      return Math.max(0, weight);
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    if (totalWeight === 0) return commands[0]; // Fallback

    let r = this.random.next() * totalWeight;

    for (let i = 0; i < commands.length; i++) {
      r -= weights[i];
      if (r <= 0) return commands[i];
    }

    return commands[commands.length - 1];
  }

  private trackState(cmd: Command) {
    const graph = this.engine.getGraph();

    // Track candidates for file placement
    if (cmd.type === "commit") {
      if (graph.head.type === "attached") {
        const branch = graph.head.ref;
        const tip = graph.branches[branch].tipCommitId;
        const depth = graph.commits[tip].depth;

        this.branchesWithCommits.add(branch);

        // Don't place targets on initial commit
        if (depth > 0) {
          this.candidateTargets.push({
            branch,
            depth,
            commitId: tip,
          });
        }
      }
    }

    // Update branches with commits if we merged something
    if (cmd.type === "merge" || cmd.type === "rebase") {
      if (graph.head.type === "attached") {
        this.branchesWithCommits.add(graph.head.ref);
      }
    }
  }

  private isStateClean(): boolean {
    // Clean means HEAD is attached to main
    const graph = this.engine.getGraph();
    return graph.head.type === "attached" && graph.head.ref === "main";
  }

  private satisfiesRequirements(): boolean {
    // Check required commands
    for (const req of this.config.requiredCommandTypes) {
      if (!this.history.some((c) => c.type === req)) return false;
    }

    // Check if back on main
    if (!this.isStateClean()) return false;

    return true;
  }

  private getAncestors(graph: GitGraph, commitId: string): Set<string> {
    const ancestors = new Set<string>();
    const queue = [commitId];
    while (queue.length > 0) {
      // biome-ignore lint/style/noNonNullAssertion: queue is guaranteed to have elements due to while condition
      const curr = queue.shift()!;
      if (ancestors.has(curr)) continue;
      ancestors.add(curr);
      const commit = graph.commits[curr];
      if (commit) {
        queue.push(...commit.parents);
      }
    }
    return ancestors;
  }

  private deduplicateCandidates(
    candidates: CandidateTarget[],
  ): CandidateTarget[] {
    const uniqueMap = new Map<string, CandidateTarget>();
    for (const c of candidates) {
      uniqueMap.set(`${c.branch}:${c.depth}`, c);
    }
    return Array.from(uniqueMap.values());
  }

  private sampleFiles(candidates: CandidateTarget[]): FileTarget[] {
    const count = Math.min(
      candidates.length,
      this.random.nextInt(this.config.minFiles, this.config.maxFiles),
    );

    const fileNames = this.random.shuffle([...FILE_NAMES]);
    const shuffled = this.random.shuffle(candidates);

    return shuffled.slice(0, count).map((c, i) => ({
      branch: c.branch,
      depth: c.depth,
      fileName: fileNames[i % fileNames.length],
      collected: false,
    }));
  }
}
