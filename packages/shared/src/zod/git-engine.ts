import { z } from "zod";
import { CommandSchema } from "./command";
import { GameStatusSchema } from "./game";

export const CommitSchema = z.object({
  id: z.string(),
  message: z.string(),
  parents: z.array(z.string()),
  branch: z.string(),
  depth: z.number(),
  timestamp: z.number(),
});

export const BranchSchema = z.object({
  name: z.string(),
  tipCommitId: z.string(),
});

export const HeadStateSchema = z.object({
  type: z.enum(["attached", "detached"]),
  ref: z.string(),
});

export const GitGraphSchema = z.object({
  commits: z.record(z.string(), CommitSchema),
  branches: z.record(z.string(), BranchSchema),
  head: HeadStateSchema,
});

export const GameStateSnapshotSchema = z.object({
  graph: GitGraphSchema,
  collectedFiles: z.array(z.string()),
  commandHistory: z.array(CommandSchema),
});

export const GameStateSchema = z.object({
  graph: GitGraphSchema,
  collectedFiles: z.array(z.string()),
  commandHistory: z.array(CommandSchema),
  undoStack: z.array(GameStateSnapshotSchema),
  status: GameStatusSchema,
  startedAt: z.number(),
  lastActivityAt: z.number(),
});

export type Commit = z.infer<typeof CommitSchema>;
export type Branch = z.infer<typeof BranchSchema>;
export type HeadState = z.infer<typeof HeadStateSchema>;
export type GitGraph = z.infer<typeof GitGraphSchema>;
export type GameStateSnapshot = z.infer<typeof GameStateSnapshotSchema>;
export type GameState = z.infer<typeof GameStateSchema>;
