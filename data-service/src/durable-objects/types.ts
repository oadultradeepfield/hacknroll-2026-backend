import type { GameState, Puzzle } from "@repo/shared";

export interface SessionData {
  userId: string;
  puzzleId: string;
  gameId: string;
  gameState: GameState;
  puzzle: Puzzle;
}
