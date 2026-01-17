import type { Game, GameStatus } from "@repo/shared";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db-client";
import { games, userStats } from "@/drizzle-out/schema";
import { getUserStats, updateStreak } from "./user-stats";

export async function createGame(game: Game): Promise<Game> {
  const db = getDb();
  const [created] = await db.insert(games).values(game).returning();
  return created as Game;
}

export async function getGameById(gameId: string): Promise<Game | undefined> {
  const [game] = await getDb()
    .select()
    .from(games)
    .where(eq(games.id, gameId))
    .limit(1);
  return game as Game;
}

export async function getGameByUserAndPuzzle(
  userId: string,
  puzzleId: string,
): Promise<Game | undefined> {
  const [game] = await getDb()
    .select()
    .from(games)
    .where(and(eq(games.userId, userId), eq(games.puzzleId, puzzleId)))
    .limit(1);
  return game as Game;
}

export async function getUserGames(
  userId: string,
  limit: number = 10,
): Promise<Game[]> {
  const result = await getDb()
    .select()
    .from(games)
    .where(eq(games.userId, userId))
    .orderBy(desc(games.startedAt))
    .limit(limit);
  return result as Game[];
}

export async function updateGameStatus(
  gameId: string,
  status: GameStatus,
  score?: number,
  commandsUsed?: number,
): Promise<Game | undefined> {
  const updates: Partial<Game> = { status };

  if (status === "completed") {
    updates.completedAt = Math.floor(Date.now() / 1000);
    if (score !== undefined) updates.score = score;
    if (commandsUsed !== undefined) updates.commandsUsed = commandsUsed;
  }

  const [updated] = await getDb()
    .update(games)
    .set(updates)
    .where(eq(games.id, gameId))
    .returning();

  return updated as Game;
}

export async function updateGameCommands(
  gameId: string,
  commandsUsed: number,
): Promise<void> {
  await getDb().update(games).set({ commandsUsed }).where(eq(games.id, gameId));
}

export async function completeGame(
  gameId: string,
  userId: string,
  score: number,
  commandsUsed: number,
): Promise<Game | undefined> {
  const now = Math.floor(Date.now() / 1000);

  const [game] = await getDb()
    .update(games)
    .set({
      status: "completed",
      score,
      commandsUsed,
      completedAt: now,
    })
    .where(eq(games.id, gameId))
    .returning();

  if (!game) return undefined;

  // Update user stats with game completion
  await getDb()
    .update(userStats)
    .set({
      totalGamesPlayed: sql`${userStats.totalGamesPlayed} + 1`,
      totalGamesWon: sql`${userStats.totalGamesWon} + 1`,
      totalCommandsUsed: sql`${userStats.totalCommandsUsed} + ${commandsUsed}`,
      bestScore: sql`CASE WHEN ${userStats.bestScore} IS NULL OR ${score} > ${userStats.bestScore} THEN ${score} ELSE ${userStats.bestScore} END`,
      averageScore: sql`CASE
        WHEN ${userStats.averageScore} IS NULL THEN ${score}
        ELSE (${userStats.averageScore} * ${userStats.totalGamesWon} + ${score}) / (${userStats.totalGamesWon} + 1)
      END`,
    })
    .where(eq(userStats.userId, userId));

  // Update streak - query database directly for lastPlayedAt
  const [statsRow] = await getDb()
    .select({ lastPlayedAt: userStats.lastPlayedAt })
    .from(userStats)
    .where(eq(userStats.userId, userId))
    .limit(1);

  const isConsecutiveDay = statsRow?.lastPlayedAt
    ? now - statsRow.lastPlayedAt <= 86400 * 2
    : false;

  await updateStreak(userId, isConsecutiveDay);

  return game as Game;
}

export async function getCompletedGamesByDate(date: string): Promise<Game[]> {
  const startOfDay = new Date(`${date}T00:00:00Z`);
  const endOfDay = new Date(`${date}T23:59:59Z`);

  const result = await getDb()
    .select()
    .from(games)
    .where(
      and(
        eq(games.status, "completed"),
        sql`${games.completedAt} >= ${Math.floor(startOfDay.getTime() / 1000)}`,
        sql`${games.completedAt} <= ${Math.floor(endOfDay.getTime() / 1000)}`,
      ),
    );

  return result as Game[];
}

export async function getUserStatsWithRecentGames(
  userId: string,
  limit: number = 10,
): Promise<{
  stats: import("@repo/shared").UserStats | undefined;
  recentGames: Game[];
}> {
  const stats = await getUserStats(userId);
  const recentGames = await getUserGames(userId, limit);
  return { stats, recentGames };
}

export async function resetGame(
  userId: string,
  puzzleId: string,
): Promise<void> {
  const game = await getGameByUserAndPuzzle(userId, puzzleId);
  if (game) {
    await getDb().delete(games).where(eq(games.id, game.id));
  }
}
