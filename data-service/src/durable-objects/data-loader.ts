import { getPuzzleById } from "@repo/database";
import type { FileTarget, Puzzle, PuzzleConstraints } from "@repo/shared";
import { DAILY_PUZZLE_KEY_PREFIX } from "@repo/shared";

export async function loadPuzzle(
  kv: KVNamespace,
  puzzleId: string,
): Promise<Puzzle | null> {
  const today = new Date().toISOString().split("T")[0];
  const cached = await kv.get(`${DAILY_PUZZLE_KEY_PREFIX}${today}`, "json");
  if (cached && (cached as Puzzle).id === puzzleId) return cached as Puzzle;

  const backup = await kv.get(`puzzle_backup:${puzzleId}`, "json");
  if (backup) return backup as Puzzle;

  const p = await getPuzzleById(puzzleId);
  return p
    ? {
        id: p.id,
        date: p.date,
        difficultyLevel: p.difficultyLevel,
        fileTargets: p.fileTargets as FileTarget[],
        constraints: p.constraints as PuzzleConstraints,
        solution: p.solution,
        parScore: p.parScore,
      }
    : null;
}
