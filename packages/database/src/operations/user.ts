import type { User } from "@repo/shared";
import { eq } from "drizzle-orm";
import { getDb } from "@/db-client";
import { userStats, users } from "@/drizzle-out/schema";

export async function createUser(user: User): Promise<User> {
  const db = getDb();
  const [created] = await db.insert(users).values(user).returning();

  await db
    .insert(userStats)
    .values({
      userId: created.id,
      totalGamesPlayed: 0,
      totalGamesWon: 0,
      totalCommandsUsed: 0,
      currentStreak: 0,
      maxStreak: 0,
    })
    .onConflictDoNothing();

  return created;
}

export async function getUserById(userId: string): Promise<User | undefined> {
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user;
}

export async function getUserByUsername(
  username: string,
): Promise<User | undefined> {
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  return user;
}

export async function updateUsername(
  userId: string,
  username: string,
): Promise<User | undefined> {
  const db = getDb();
  const [updated] = await db
    .update(users)
    .set({ username })
    .where(eq(users.id, userId))
    .returning();
  return updated;
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  const user = await getUserByUsername(username);
  return user !== undefined;
}

export async function getOrCreateUser(
  userId: string,
  username: string | null = null,
): Promise<User> {
  const existing = await getUserById(userId);
  if (existing) return existing;

  const db = getDb();
  const [created] = await db
    .insert(users)
    .values({
      id: userId,
      username,
    })
    .returning();

  await db
    .insert(userStats)
    .values({
      userId: created.id,
      totalGamesPlayed: 0,
      totalGamesWon: 0,
      totalCommandsUsed: 0,
      currentStreak: 0,
      maxStreak: 0,
    })
    .onConflictDoNothing();

  return created;
}
