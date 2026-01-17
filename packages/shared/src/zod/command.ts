import { z } from "zod";

export const CommitCommandSchema = z.object({
  type: z.literal("commit"),
  message: z.string(),
});

export const BranchCommandSchema = z.object({
  type: z.literal("branch"),
  name: z.string(),
});

export const CheckoutCommandSchema = z.object({
  type: z.literal("checkout"),
  target: z.string(), // branch name or commit id
});

export const MergeCommandSchema = z.object({
  type: z.literal("merge"),
  branch: z.string(),
});

export const RebaseCommandSchema = z.object({
  type: z.literal("rebase"),
  onto: z.string(),
});

export const UndoCommandSchema = z.object({
  type: z.literal("undo"),
});

export const CommandSchema = z.discriminatedUnion("type", [
  CommitCommandSchema,
  BranchCommandSchema,
  CheckoutCommandSchema,
  MergeCommandSchema,
  RebaseCommandSchema,
  UndoCommandSchema,
]);

export type CommitCommand = z.infer<typeof CommitCommandSchema>;
export type BranchCommand = z.infer<typeof BranchCommandSchema>;
export type CheckoutCommand = z.infer<typeof CheckoutCommandSchema>;
export type MergeCommand = z.infer<typeof MergeCommandSchema>;
export type RebaseCommand = z.infer<typeof RebaseCommandSchema>;
export type UndoCommand = z.infer<typeof UndoCommandSchema>;
export type Command = z.infer<typeof CommandSchema>;
