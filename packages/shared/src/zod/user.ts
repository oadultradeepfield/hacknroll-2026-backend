import { z } from "zod";

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 20;
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

export const UserSchema = z.object({
  id: z.string(),
  username: z
    .string()
    .min(
      USERNAME_MIN_LENGTH,
      `Username must be at least ${USERNAME_MIN_LENGTH} characters`,
    )
    .max(
      USERNAME_MAX_LENGTH,
      `Username must be at most ${USERNAME_MAX_LENGTH} characters`,
    )
    .regex(
      USERNAME_PATTERN,
      "Username can only contain letters, numbers, underscores, and hyphens",
    )
    .nullable(),
  createdAt: z.number(),
});

export const UserStatsSchema = z.object({
  id: z.string(),
  userId: z.string(),
  totalGamesPlayed: z.number(),
  totalGamesWon: z.number(),
  totalCommandsUsed: z.number(),
  bestScore: z.number().nullable(),
  averageScore: z.number().nullable(),
  currentStreak: z.number(),
  maxStreak: z.number(),
});

export type User = z.infer<typeof UserSchema>;
export type UserStats = z.infer<typeof UserStatsSchema>;
