import { GitEngine } from "@repo/git-engine";
import type {
  FileTarget,
  GameState,
  GameStateSnapshot,
  Puzzle,
  PuzzleConstraints,
} from "@repo/shared";

// ─── HTTP Response Utilities ─────────────────────────────────────────────────

export const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// ─── GameState Utilities ─────────────────────────────────────────────────────

export const createSnapshot = (gs: GameState): GameStateSnapshot => ({
  graph: JSON.parse(JSON.stringify(gs.graph)),
  collectedFiles: [...gs.collectedFiles],
  commandHistory: [...gs.commandHistory],
});

export const createInitialGameState = (): GameState => ({
  graph: GitEngine.createInitialGraph(),
  collectedFiles: [],
  commandHistory: [],
  undoStack: [],
  status: "in_progress",
  startedAt: Date.now(),
  lastActivityAt: Date.now(),
});

// ─── Engine Utilities ────────────────────────────────────────────────────────

export const createEngine = (
  puzzle: Puzzle,
  graph: GameState["graph"],
): GitEngine =>
  new GitEngine(
    graph,
    puzzle.fileTargets as FileTarget[],
    puzzle.constraints as PuzzleConstraints,
  );
