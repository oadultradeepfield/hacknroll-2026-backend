import { z } from "zod";
import { CommandSchema } from "./command";
import { GameSchema } from "./game";
import { GameStateSchema } from "./git-engine";
import { PuzzleSchema, PuzzleSolutionSchema } from "./puzzle";
import { UserStatsSchema } from "./user";

export const GameRewardsSchema = z.object({
  score: z.number(),
  parScore: z.number(),
  commandsUsed: z.number(),
  optimalSolution: PuzzleSolutionSchema,
  performance: z.enum(["under_par", "at_par", "over_par"]),
  bonusPoints: z.number(),
});

export const StartGameRequestSchema = z.object({
  gameId: z.string(), // "daily" for daily puzzle or specific puzzle ID
});

export const StartGameResponseSchema = z.object({
  success: z.boolean(),
  gameState: GameStateSchema.optional(),
  puzzle: PuzzleSchema.optional(),
  rewards: GameRewardsSchema.optional(),
  error: z.string().optional(),
  isCompleted: z.boolean().optional(),
});

export const CommandRequestSchema = z.object({
  gameId: z.string(),
  command: CommandSchema,
});

export const CommandResponseSchema = z.object({
  success: z.boolean(),
  gameState: GameStateSchema.optional(),
  isCompleted: z.boolean().optional(),
  rewards: GameRewardsSchema.optional(),
  error: z.string().optional(),
});

export const SetNameRequestSchema = z.object({
  username: z.string(),
});

export const SetNameResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

export const StatsResponseSchema = z.object({
  stats: UserStatsSchema,
  recentGames: z.array(GameSchema),
});

export const LeaderboardEntrySchema = z.object({
  rank: z.number(),
  userId: z.string(),
  username: z.string(),
  score: z.number(),
  gamesPlayed: z.number(),
});

export const LeaderboardResponseSchema = z.object({
  entries: z.array(LeaderboardEntrySchema),
  userRank: z.number().optional(),
  userEntry: LeaderboardEntrySchema.optional(),
});

export const LeaderboardUpdateMessageSchema = z.object({
  userId: z.string(),
  puzzleId: z.string(),
  score: z.number(),
  commandsUsed: z.number(),
  completedAt: z.string(),
});

export type GameRewards = z.infer<typeof GameRewardsSchema>;
export type StartGameRequest = z.infer<typeof StartGameRequestSchema>;
export type StartGameResponse = z.infer<typeof StartGameResponseSchema>;
export type CommandRequest = z.infer<typeof CommandRequestSchema>;
export type CommandResponse = z.infer<typeof CommandResponseSchema>;
export type SetNameRequest = z.infer<typeof SetNameRequestSchema>;
export type SetNameResponse = z.infer<typeof SetNameResponseSchema>;
export type StatsResponse = z.infer<typeof StatsResponseSchema>;
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
export type LeaderboardResponse = z.infer<typeof LeaderboardResponseSchema>;
export type LeaderboardUpdateMessage = z.infer<
  typeof LeaderboardUpdateMessageSchema
>;
