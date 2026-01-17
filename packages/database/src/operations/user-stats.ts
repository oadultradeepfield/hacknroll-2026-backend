import type { UserStats } from "@repo/shared";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db-client";
import { userStats } from "@/drizzle-out/schema";

function normalizeStats(stats: Omit<UserStats, "id">): UserStats {
  return {
    ...stats,
    id: stats.userId,
  };
}

export async function getUserStats(
  userId: string,
): Promise<UserStats | undefined> {
  const db = getDb();
  const [stats] = await db
    .select()
    .from(userStats)
    .where(eq(userStats.userId, userId))
    .limit(1);
  return normalizeStats(stats);
}

export async function createUserStats(userId: string): Promise<UserStats> {
  const db = getDb();
  const [created] = await db
    .insert(userStats)
    .values({
      userId,
      totalGamesPlayed: 0,
      totalGamesWon: 0,
      totalCommandsUsed: 0,
      currentStreak: 0,
      maxStreak: 0,
    })
    .returning();
  return normalizeStats(created);
}

export async function updateStreak(
  userId: string,
  isConsecutiveDay: boolean,
): Promise<void> {
  const db = getDb();
  if (isConsecutiveDay) {
    await db
      .update(userStats)
      .set({
        currentStreak: sql`${userStats.currentStreak} + 1`,
        maxStreak: sql`MAX(${userStats.maxStreak}, ${userStats.currentStreak} + 1)`,
        lastPlayedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(userStats.userId, userId));
  } else {
    await db
      .update(userStats)
      .set({
        currentStreak: 1,
        lastPlayedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(userStats.userId, userId));
  }
}

export async function incrementStats(
  userId: string,
  commandsUsed: number,
  score: number,
  won: boolean,
): Promise<void> {
  const db = getDb();
  await db
    .update(userStats)
    .set({
      totalGamesPlayed: sql`${userStats.totalGamesPlayed} + 1`,
      totalGamesWon: won
        ? sql`${userStats.totalGamesWon} + 1`
        : userStats.totalGamesWon,
      totalCommandsUsed: sql`${userStats.totalCommandsUsed} + ${commandsUsed}`,
      bestScore: sql`CASE WHEN ${userStats.bestScore} IS NULL OR ${score} > ${userStats.bestScore} THEN ${score} ELSE ${userStats.bestScore} END`,
      averageScore: sql`CASE
        WHEN ${userStats.averageScore} IS NULL THEN ${score}
        ELSE (${userStats.averageScore} * (${userStats.totalGamesPlayed}) + ${score}) / (${userStats.totalGamesPlayed} + 1)
      END`,
    })
    .where(eq(userStats.userId, userId));
}

export async function getOrCreateUserStats(userId: string): Promise<UserStats> {
  const existing = await getUserStats(userId);
  if (existing) return existing;

  return createUserStats(userId);
}
