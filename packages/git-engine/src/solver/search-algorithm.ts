import type {
  Command,
  FileTarget,
  GitGraph,
  PuzzleConstraints,
} from "@repo/shared";
import { GitEngine } from "../engine";
import type { SolverResult, SolverState } from "../types";
import { generatePossibleCommands } from "./command-generator";
import { cloneGraph, getStateKey } from "./state-management";
import { isWinState } from "./win-condition";

class PriorityQueue<T> {
  private heap: { item: T; priority: number }[] = [];

  push(item: T, priority: number) {
    this.heap.push({ item, priority });
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const bottom = this.heap.pop();
    if (bottom !== undefined && this.heap.length > 0) {
      this.heap[0] = bottom;
      this.sinkDown(0);
    }
    return top?.item;
  }

  get length(): number {
    return this.heap.length;
  }

  private bubbleUp(index: number) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[index].priority >= this.heap[parentIndex].priority) break;
      [this.heap[index], this.heap[parentIndex]] = [
        this.heap[parentIndex],
        this.heap[index],
      ];
      index = parentIndex;
    }
  }

  private sinkDown(index: number) {
    const length = this.heap.length;
    while (true) {
      let swap = -1;
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;

      if (leftChild < length) {
        if (this.heap[leftChild].priority < this.heap[index].priority) {
          swap = leftChild;
        }
      }

      if (rightChild < length) {
        if (
          (swap === -1 &&
            this.heap[rightChild].priority < this.heap[index].priority) ||
          (swap !== -1 &&
            this.heap[rightChild].priority < this.heap[swap].priority)
        ) {
          swap = rightChild;
        }
      }

      if (swap === -1) break;
      [this.heap[index], this.heap[swap]] = [this.heap[swap], this.heap[index]];
      index = swap;
    }
  }
}

export function searchForSolution(
  initialGraph: GitGraph,
  fileTargets: FileTarget[],
  constraints: PuzzleConstraints,
  maxDepth: number,
): SolverResult {
  const bestCosts = new Map<string, number>();

  const queue = new PriorityQueue<SolverState>();

  const initialState: SolverState = {
    graph: cloneGraph(initialGraph),
    collectedFiles: new Set(),
    commands: [],
  };

  queue.push(initialState, 0);

  let statesExplored = 0;
  const MAX_STATES = 20000;

  while (queue.length > 0) {
    const state = queue.pop();
    if (!state) break;
    statesExplored++;

    if (statesExplored > MAX_STATES) {
      break;
    }

    if (state.commands.length > maxDepth) {
      continue;
    }

    const stateKey = getStateKey(state);
    const currentCost = state.commands.length;

    const existingCost = bestCosts.get(stateKey);
    if (existingCost !== undefined && existingCost <= currentCost) {
      continue;
    }
    bestCosts.set(stateKey, currentCost);

    const engine = createEngineFromState(state, fileTargets, constraints);

    if (isWinState(engine, fileTargets)) {
      return {
        solved: true,
        solution: state.commands,
        totalCommands: state.commands.length,
        statesExplored,
      };
    }

    if (state.commands.length >= maxDepth) {
      continue;
    }

    const nextStates = exploreNextStates(
      state,
      engine,
      fileTargets,
      constraints,
    );

    for (const nextState of nextStates) {
      const g = nextState.commands.length;
      const h = calculateHeuristic(nextState, fileTargets);
      const f = g + h;

      const nextKey = getStateKey(nextState);
      const nextCost = bestCosts.get(nextKey);
      if (nextCost === undefined || nextCost > g) {
        queue.push(nextState, f);
      }
    }
  }

  return {
    solved: false,
    statesExplored,
  };
}

function calculateHeuristic(
  state: SolverState,
  fileTargets: FileTarget[],
): number {
  // A* Heuristic: h(n) = estimated cost from n to goal
  // Must be admissible (never overestimate)

  // 1. Uncollected files
  // We need at least 1 command (visit/commit) to collect each remaining file.
  // This is a lower bound.
  const uncollectedCount = fileTargets.length - state.collectedFiles.size;

  // 2. Head position
  // If HEAD is not on 'main' and attached, we need at least 1 command to get there (checkout main or merge to main).
  let notOnMainPenalty = 0;
  const { head } = state.graph;
  if (head.type === "detached" || head.ref !== "main") {
    notOnMainPenalty = 1;
  }

  // 3. Required operations - merge or rebase
  // Check if the graph already has a merge commit or if rebase was used
  const hasMergeCommit = Object.values(state.graph.commits).some(
    (commit) => commit.parents.length > 1,
  );
  const hasRebase = state.commands.some((c) => c.type === "rebase");
  const hasMergeOrRebase = hasMergeCommit || hasRebase;

  // If we haven't done a merge or rebase yet, we need at least:
  // - 1 command to create a branch (if not exists)
  // - 1 command to checkout that branch
  // - 1 command to commit (create content to merge)
  // - 1 command to checkout main
  // - 1 command to merge/rebase
  // But we're being conservative here - just count 1 for the merge/rebase itself
  const requirementPenalty = hasMergeOrRebase ? 0 : 1;

  // 4. Branch creation penalty
  // If file targets require branches that don't exist yet, we need to create them
  const existingBranches = new Set(Object.keys(state.graph.branches));
  const requiredBranches = new Set(
    fileTargets
      .filter((t) => !state.collectedFiles.has(t.fileName))
      .map((t) => t.branch),
  );
  let branchCreationPenalty = 0;
  for (const branch of requiredBranches) {
    if (!existingBranches.has(branch)) {
      // Need at least: branch + checkout + commit = 3 commands minimum
      branchCreationPenalty += 3;
    }
  }

  // 5. If we need to merge content from other branches into main
  // and we're not on main, we'll eventually need to get back to main
  // and perform the merge. This is already partially captured by notOnMainPenalty.

  // Combining penalties (must remain admissible - never overestimate)
  return (
    uncollectedCount +
    notOnMainPenalty +
    requirementPenalty +
    branchCreationPenalty
  );
}

function createEngineFromState(
  state: SolverState,
  fileTargets: FileTarget[],
  constraints: PuzzleConstraints,
): GitEngine {
  const engine = new GitEngine(state.graph, fileTargets, constraints);
  engine.addCollectedFiles(state.collectedFiles);
  return engine;
}

function exploreNextStates(
  currentState: SolverState,
  currentEngine: GitEngine,
  fileTargets: FileTarget[],
  constraints: PuzzleConstraints,
): SolverState[] {
  const nextStates: SolverState[] = [];

  const graph = currentEngine.getGraph();
  const commandCounts = currentEngine.getCommandCounts();
  const possibleCommands = generatePossibleCommands(
    graph,
    constraints,
    commandCounts,
  );

  for (const command of possibleCommands) {
    const nextState = tryExecuteCommand(
      currentState,
      command,
      fileTargets,
      constraints,
    );

    if (nextState) {
      nextStates.push(nextState);
    }
  }

  return nextStates;
}

function tryExecuteCommand(
  currentState: SolverState,
  command: Command,
  fileTargets: FileTarget[],
  constraints: PuzzleConstraints,
): SolverState | null {
  const newEngine = createEngineFromState(
    currentState,
    fileTargets,
    constraints,
  );

  const result = newEngine.executeCommand(command);

  if (!result.success) {
    return null;
  }

  return {
    // biome-ignore lint/style/noNonNullAssertion: result.newGraph guaranteed on success
    graph: result.newGraph!,
    collectedFiles: new Set(result.collectedFiles),
    commands: [...currentState.commands, command],
  };
}
