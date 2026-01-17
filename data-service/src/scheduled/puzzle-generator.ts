import { env } from "cloudflare:workers";
import { puzzleExistsForDate, upsertPuzzle } from "@repo/database";
import { generateDailyPuzzle } from "@repo/git-engine";
import { DAILY_PUZZLE_KEY_PREFIX } from "@repo/shared";
import { nanoid } from "nanoid";

export async function generateDailyPuzzleTask(): Promise<void> {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const dateString = tomorrow.toISOString().split("T")[0];

  console.log(`Generating puzzle for ${dateString}`);

  if (await puzzleExistsForDate(dateString)) {
    console.log(`Puzzle for ${dateString} already exists`);
    return;
  }

  const generated = generateDailyPuzzle(dateString);

  if (!generated) {
    console.error(`Failed to generate valid puzzle for ${dateString}`);
    const retryGenerated = generateDailyPuzzle(`${dateString}-retry`);
    if (!retryGenerated) {
      throw new Error(
        `Failed to generate puzzle for ${dateString} after retry`,
      );
    }
    Object.assign(generated || {}, retryGenerated);
  }

  const puzzleId = `puzzle_${dateString}_${nanoid(8)}`;

  // biome-ignore lint/style/noNonNullAssertion: generated is guaranteed to be non-null due to retry logic above
  const generatedNotNull = generated!;

  const puzzle = await upsertPuzzle({
    id: puzzleId,
    date: dateString,
    difficultyLevel:
      generatedNotNull.parScore > 10
        ? 7
        : Math.min(generatedNotNull.parScore - 2, 7),
    fileTargets: generatedNotNull.fileTargets,
    constraints: generatedNotNull.constraints,
    solution: {
      commands: generatedNotNull.solution,
      totalCommands: generatedNotNull.solution.length,
    },
    parScore: generatedNotNull.parScore,
  });

  await env.KV.put(
    `${DAILY_PUZZLE_KEY_PREFIX}${dateString}`,
    JSON.stringify(puzzle),
    { expirationTtl: 60 * 60 * 48 }, // 48 hours
  );

  console.log(`Successfully generated puzzle ${puzzleId} for ${dateString}`);
}
