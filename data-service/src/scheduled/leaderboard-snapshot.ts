import { env } from "cloudflare:workers";
import { generateDailyLeaderboard, getLeaderboardByDate } from "@repo/database";
import { LEADERBOARD_KEY_PREFIX } from "@repo/shared";

export async function generateLeaderboardSnapshotTask(): Promise<void> {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const dateUnix = Math.floor(yesterday.getTime() / 1000);

  console.log(`Generating leaderboard snapshot for ${dateUnix}`);
  await generateDailyLeaderboard(dateUnix);
  const leaderboard = await getLeaderboardByDate(dateUnix);

  await env.KV.put(
    `${LEADERBOARD_KEY_PREFIX}${dateUnix}`,
    JSON.stringify(leaderboard),
    { expirationTtl: 60 * 60 * 24 * 30 }, // 30 days
  );

  console.log(
    `Successfully generated leaderboard for ${dateUnix} with ${leaderboard.length} entries`,
  );
}
