import { env } from "cloudflare:workers";
import { puzzleExistsForDate, upsertPuzzle } from "@repo/database";
import { generateDailyPuzzle } from "@repo/git-engine";
import { DAILY_PUZZLE_KEY_PREFIX } from "@repo/shared";
import { nanoid } from "nanoid";

export function generateSessionKey(userId: string, puzzleId: string): string {
  return `${userId}:${puzzleId}`;
}

export async function generatePuzzleForDate(
  dateString: string,
  opts?: { force?: boolean },
): Promise<void> {
  console.log(`Generating puzzle for ${dateString}`);

  if (!opts?.force && (await puzzleExistsForDate(dateString))) {
    console.log(`Puzzle for ${dateString} already exists`);
    return;
  }

  let generated = generateDailyPuzzle(dateString);

  if (!generated) {
    console.error(`Failed to generate valid puzzle for ${dateString}`);
    generated = generateDailyPuzzle(`${dateString}-retry`);
    if (!generated) {
      throw new Error(`Failed to generate puzzle for ${dateString}`);
    }
  }

  const puzzleId = `puzzle_${dateString}_${nanoid(8)}`;

  const puzzle = await upsertPuzzle({
    id: puzzleId,
    date: dateString,
    difficultyLevel:
      generated.parScore > 10 ? 7 : Math.min(generated.parScore - 2, 7),
    fileTargets: generated.fileTargets,
    constraints: generated.constraints,
    solution: {
      commands: generated.solution,
      totalCommands: generated.solution.length,
    },
    parScore: generated.parScore,
  });

  await env.KV.put(
    `${DAILY_PUZZLE_KEY_PREFIX}${dateString}`,
    JSON.stringify(puzzle),
    { expirationTtl: 60 * 60 * 24 * 7 }, // 7 days instead of 48 hours
  );

  // Store backup with longer TTL
  await env.KV.put(
    `puzzle_backup:${puzzleId}`,
    JSON.stringify(puzzle),
    { expirationTtl: 60 * 60 * 24 * 30 }, // 30 days backup
  );

  console.log(`Seeded puzzle ${puzzleId} for ${dateString}`);
}
