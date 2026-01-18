import type { LeaderboardEntry } from "@repo/shared";
import { LEADERBOARD_SIZE } from "@repo/shared";
import { and, asc, desc, eq, isNotNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/db-client";
import { leaderboard, userStats, users } from "@/drizzle-out/schema";

export async function createLeaderboardEntries(
  entries: LeaderboardEntry[],
): Promise<void> {
  if (entries.length === 0) return;
  const db = getDb();
  await db.insert(leaderboard).values(
    entries.map((entry) => ({
      ...entry,
      id: nanoid(10),
    })),
  );
}

export async function getLeaderboardByDate(
  date: number,
  limit: number = LEADERBOARD_SIZE,
): Promise<LeaderboardEntry[]> {
  const db = getDb();
  const results = await db
    .select({
      rank: leaderboard.rank,
      userId: leaderboard.userId,
      username: users.username,
      score: leaderboard.score,
      gamesPlayed: leaderboard.gamesPlayed,
    })
    .from(leaderboard)
    .innerJoin(users, eq(leaderboard.userId, users.id))
    .where(eq(leaderboard.leaderboardDate, date))
    .orderBy(asc(leaderboard.rank))
    .limit(limit);

  return results as LeaderboardEntry[];
}

export async function getUserRank(
  userId: string,
  date: number,
): Promise<LeaderboardEntry | undefined> {
  const db = getDb();
  const [result] = await db
    .select({
      rank: leaderboard.rank,
      userId: leaderboard.userId,
      username: users.username,
      score: leaderboard.score,
      gamesPlayed: leaderboard.gamesPlayed,
    })
    .from(leaderboard)
    .innerJoin(users, eq(leaderboard.userId, users.id))
    .where(
      and(
        eq(leaderboard.leaderboardDate, date),
        eq(leaderboard.userId, userId),
      ),
    )
    .limit(1);

  return result as LeaderboardEntry;
}

export async function generateDailyLeaderboard(date: number): Promise<void> {
  const db = getDb();
  const scores = await db
    .select({
      userId: userStats.userId,
      username: users.username,
      totalScore: userStats.bestScore,
      gamesPlayed: userStats.totalGamesPlayed,
    })
    .from(userStats)
    .innerJoin(users, eq(userStats.userId, users.id))
    .where(isNotNull(users.username))
    .orderBy(desc(userStats.bestScore));

  const entries: LeaderboardEntry[] = scores.map((score, index) => ({
    rank: index + 1,
    userId: score.userId,
    username: score.username ?? "",
    score: score.totalScore ?? 0,
    gamesPlayed: score.gamesPlayed,
  }));

  await db.delete(leaderboard).where(eq(leaderboard.leaderboardDate, date));

  if (entries.length > 0) {
    await createLeaderboardEntries(entries);
  }
}

export async function getLeaderboardWithUserRank(
  date: number,
  userId: string,
  limit: number = LEADERBOARD_SIZE,
): Promise<{
  entries: LeaderboardEntry[];
  userRank?: number;
  userEntry?: LeaderboardEntry;
}> {
  const entries = await getLeaderboardByDate(date, limit);
  const userEntry = await getUserRank(userId, date);

  return {
    entries,
    userRank: userEntry?.rank,
    userEntry,
  };
}
