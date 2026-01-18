import type {
  Command,
  FileTarget,
  GitGraph,
  PuzzleConstraints,
} from "@repo/shared";
import { nanoid } from "nanoid";
import type { CommandResult } from "../types";
import {
  executeBranch,
  executeCheckout,
  executeCommit,
  executeMerge,
  executeRebase,
} from "./command-executor";
import { validateCommand } from "./command-validator";
import { checkFileCollection, checkWinCondition } from "./game-logic";
import { cloneGraph } from "./graph-operations";

export class GitEngine {
  private graph: GitGraph;
  private fileTargets: FileTarget[];
  private constraints: PuzzleConstraints;
  private collectedFiles: Set<string>;
  private commandCounts: Record<string, number>;

  constructor(
    initialGraph: GitGraph,
    fileTargets: FileTarget[],
    constraints: PuzzleConstraints,
  ) {
    this.graph = cloneGraph(initialGraph);
    this.fileTargets = JSON.parse(JSON.stringify(fileTargets));
    this.constraints = JSON.parse(JSON.stringify(constraints));
    this.collectedFiles = new Set();
    this.commandCounts = {
      commit: 0,
      checkout: 0,
      branch: 0,
      merge: 0,
      rebase: 0,
    };
    checkFileCollection(this.graph, this.fileTargets, this.collectedFiles);
  }

  static createInitialGraph(): GitGraph {
    const initialCommitId = nanoid(8);
    return {
      commits: {
        [initialCommitId]: {
          id: initialCommitId,
          message: "Initial commit",
          parents: [],
          branch: "main",
          depth: 0,
          timestamp: Date.now(),
        },
      },
      branches: {
        main: {
          name: "main",
          tipCommitId: initialCommitId,
        },
      },
      head: {
        type: "attached",
        ref: "main",
      },
    };
  }

  getGraph(): GitGraph {
    return cloneGraph(this.graph);
  }

  getCollectedFiles(): string[] {
    return Array.from(this.collectedFiles);
  }

  getCommandCounts(): Record<string, number> {
    return { ...this.commandCounts };
  }

  addCollectedFiles(files: Set<string>): void {
    for (const file of files) {
      this.collectedFiles.add(file);
    }
  }

  executeCommand(command: Command): CommandResult {
    const validation = validateCommand(
      command,
      this.graph,
      this.constraints,
      this.commandCounts,
    );
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    let result: CommandResult;

    switch (command.type) {
      case "commit":
        result = executeCommit(this.graph, command);
        break;
      case "branch":
        result = executeBranch(this.graph, command);
        break;
      case "checkout":
        result = executeCheckout(this.graph, command);
        break;
      case "merge":
        result = executeMerge(this.graph, command);
        break;
      case "rebase":
        result = executeRebase(this.graph, command);
        // Update file target depths based on rebased commit mappings
        // This is needed because rebase creates new commits with new depths,
        // and the original commits become orphaned (not reachable from any branch)
        if (result.success && result.rebasedCommitMappings) {
          for (const mapping of result.rebasedCommitMappings) {
            for (const target of this.fileTargets) {
              if (
                target.branch === mapping.originalBranch &&
                target.depth === mapping.originalDepth &&
                !this.collectedFiles.has(target.fileName)
              ) {
                target.depth = mapping.newDepth;
              }
            }
          }
        }
        break;
      default:
        return { success: false, error: "Unknown command type" };
    }

    if (result.success) {
      this.commandCounts[command.type]++;
      checkFileCollection(this.graph, this.fileTargets, this.collectedFiles);
      result.isGameComplete = checkWinCondition(
        this.graph,
        this.fileTargets,
        this.collectedFiles,
      );
    }

    return {
      ...result,
      newGraph: this.getGraph(),
      collectedFiles: this.getCollectedFiles(),
    };
  }
}

export function createGameEngine(
  fileTargets: FileTarget[],
  constraints: PuzzleConstraints,
): GitEngine {
  const initialGraph = GitEngine.createInitialGraph();
  return new GitEngine(initialGraph, fileTargets, constraints);
}
