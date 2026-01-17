import { getOrCreateUserStats, getUserGames } from "@repo/database";
import { Hono } from "hono";

export const statsRoutes = new Hono<{
  Bindings: Cloudflare.Env;
  Variables: { userId: string };
}>();

statsRoutes.get("/", async (c) => {
  const userId = c.get("userId");

  try {
    const stats = await getOrCreateUserStats(userId);
    const recentGames = await getUserGames(userId, 10);
    return c.json({ stats, recentGames });
  } catch (error) {
    console.error("Stats error:", error);
    return c.json({ error: "Failed to get stats" }, 500);
  }
});
