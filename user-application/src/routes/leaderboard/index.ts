import { getLeaderboardByDate, getUserRank } from "@repo/database";
import type { LeaderboardEntry, LeaderboardResponse } from "@repo/shared";
import { LEADERBOARD_KEY_PREFIX, LEADERBOARD_SIZE } from "@repo/shared";
import { Hono } from "hono";

export const leaderboardRoutes = new Hono<{
  Bindings: Cloudflare.Env;
  Variables: { userId: string };
}>();

leaderboardRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const date = Math.floor(Date.now() / 1000);

  try {
    const cacheKey = `${LEADERBOARD_KEY_PREFIX}${date}`;
    const cached = await c.env.KV.get(cacheKey, "json");

    if (cached) {
      const entries = cached as LeaderboardEntry[];
      const userEntry = entries.find((e) => e.userId === userId);

      return c.json<LeaderboardResponse>({
        entries: entries.slice(0, LEADERBOARD_SIZE),
        userRank: userEntry?.rank,
        userEntry,
      });
    }

    const leaderboardEntries = await getLeaderboardByDate(date);
    const userRankEntry = await getUserRank(userId, date);

    const entries: LeaderboardEntry[] = leaderboardEntries.map((entry) => ({
      rank: entry.rank,
      userId: entry.userId,
      username: entry.username || "Anonymous",
      score: entry.score,
      gamesPlayed: entry.gamesPlayed,
    }));

    const response: LeaderboardResponse = {
      entries,
      userRank: userRankEntry?.rank,
      userEntry: userRankEntry
        ? {
            rank: userRankEntry.rank,
            userId: userRankEntry.userId,
            username: userRankEntry.username || "Anonymous",
            score: userRankEntry.score,
            gamesPlayed: userRankEntry.gamesPlayed,
          }
        : undefined,
    };

    await c.env.KV.put(cacheKey, JSON.stringify(entries), {
      expirationTtl: 300, // 5 minutes
    });

    return c.json(response);
  } catch (error) {
    console.error("Leaderboard error:", error);
    return c.json({ error: "Failed to get leaderboard" }, 500);
  }
});
