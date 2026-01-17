import { z } from "zod";

export const GameStatusSchema = z.enum(["in_progress", "completed"]);

export const GameSchema = z.object({
  id: z.string(),
  userId: z.string(),
  puzzleId: z.string(),
  status: GameStatusSchema,
  commandsUsed: z.number(),
  score: z.number().nullable(),
  startedAt: z.number(),
  completedAt: z.number().nullable(),
});

export type GameStatus = z.infer<typeof GameStatusSchema>;
export type Game = z.infer<typeof GameSchema>;
