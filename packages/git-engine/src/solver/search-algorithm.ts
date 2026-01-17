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

export function searchForSolution(
  initialGraph: GitGraph,
  fileTargets: FileTarget[],
  constraints: PuzzleConstraints,
  maxDepth: number,
): SolverResult {
  const visited = new Set<string>();
  const queue: SolverState[] = [
    {
      graph: cloneGraph(initialGraph),
      collectedFiles: new Set(),
      commands: [],
    },
  ];

  let statesExplored = 0;

  while (queue.length > 0) {
    // biome-ignore lint/style/noNonNullAssertion: queue is guaranteed to have elements due to while condition check
    const state = queue.shift()!;
    statesExplored++;

    if (state.commands.length > maxDepth) {
      continue;
    }

    const stateKey = getStateKey(state);
    if (visited.has(stateKey)) continue;
    visited.add(stateKey);

    const engine = createEngineFromState(state, fileTargets, constraints);

    if (isWinState(engine, fileTargets)) {
      return {
        solved: true,
        solution: state.commands,
        totalCommands: state.commands.length,
        statesExplored,
      };
    }

    const nextStates = exploreNextStates(
      state,
      engine,
      fileTargets,
      constraints,
    );

    queue.push(...nextStates);
  }

  return {
    solved: false,
    statesExplored,
  };
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
    // biome-ignore lint/style/noNonNullAssertion: result.newGraph is guaranteed to exist because result.success is true
    graph: result.newGraph!,
    collectedFiles: new Set(result.collectedFiles),
    commands: [...currentState.commands, command],
  };
}
