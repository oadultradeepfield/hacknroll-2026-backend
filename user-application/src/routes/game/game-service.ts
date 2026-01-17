import {
  createGame,
  getGameByUserAndPuzzle,
  getPuzzleByDate,
} from "@repo/database";
import { DAILY_PUZZLE_KEY_PREFIX, type Puzzle } from "@repo/shared";
import { generateGameId } from "../../utils/identifier";

export async function resolvePuzzleId(
  requestedGameId: string,
  kv: KVNamespace,
): Promise<{ puzzleId: string | null; error?: string }> {
  if (requestedGameId !== "daily") {
    return { puzzleId: requestedGameId };
  }

  const today = new Date().toISOString().split("T")[0];

  const cachedPuzzle = (await kv.get(
    `${DAILY_PUZZLE_KEY_PREFIX}${today}`,
    "json",
  )) as Puzzle;

  if (cachedPuzzle) {
    return { puzzleId: cachedPuzzle.id };
  }

  const puzzle = await getPuzzleByDate(today);
  if (!puzzle) {
    return {
      puzzleId: null,
      error: "Daily puzzle not available yet",
    };
  }

  return { puzzleId: puzzle.id };
}

export async function createGameRecord(userId: string, puzzleId: string) {
  const newGameId = generateGameId(userId, puzzleId);
  const now = Date.now();
  await createGame({
    id: newGameId,
    userId: userId,
    puzzleId,
    status: "in_progress",
    commandsUsed: 0,
    score: null,
    startedAt: now,
    completedAt: null,
  });
  return newGameId;
}

export async function getExistingGame(userId: string, puzzleId: string) {
  return await getGameByUserAndPuzzle(userId, puzzleId);
}
