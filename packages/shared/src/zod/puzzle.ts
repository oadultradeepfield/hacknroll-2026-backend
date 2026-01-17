import { z } from "zod";
import { CommandSchema } from "./command";

export const FileTargetSchema = z.object({
  branch: z.string(),
  depth: z.number(),
  fileName: z.string(),
  collected: z.boolean(),
});

export const PuzzleConstraintsSchema = z.object({
  maxCommits: z.number(),
  maxCheckouts: z.number(),
  maxBranches: z.number(),
  allowedBranches: z.array(z.string()),
});

export const PuzzleSolutionSchema = z.object({
  commands: z.array(CommandSchema),
  totalCommands: z.number(),
});

export const PuzzleSchema = z.object({
  id: z.string(),
  date: z.string().nullable(),
  difficultyLevel: z.number(),
  fileTargets: z.array(FileTargetSchema),
  constraints: PuzzleConstraintsSchema,
  solution: PuzzleSolutionSchema,
  parScore: z.number(),
});

export type FileTarget = z.infer<typeof FileTargetSchema>;
export type PuzzleConstraints = z.infer<typeof PuzzleConstraintsSchema>;
export type PuzzleSolution = z.infer<typeof PuzzleSolutionSchema>;
export type Puzzle = z.infer<typeof PuzzleSchema>;
