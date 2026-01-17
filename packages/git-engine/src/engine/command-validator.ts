import type { Command, GitGraph, PuzzleConstraints } from "@repo/shared";
import type { ValidationResult } from "../types";

export function validateCommand(
  command: Command,
  graph: GitGraph,
  constraints: PuzzleConstraints,
  commandCounts: Record<string, number>,
): ValidationResult {
  switch (command.type) {
    case "commit":
      if (commandCounts.commit >= constraints.maxCommits) {
        return { valid: false, error: "Maximum commits reached" };
      }
      break;
    case "checkout":
      if (commandCounts.checkout >= constraints.maxCheckouts) {
        return { valid: false, error: "Maximum checkouts reached" };
      }
      break;
    case "branch":
      if (!constraints.allowedBranches.includes(command.name)) {
        return {
          valid: false,
          error: `Branch "${command.name}" is not allowed`,
        };
      }
      if (graph.branches[command.name]) {
        return {
          valid: false,
          error: `Branch "${command.name}" already exists`,
        };
      }
      break;
    case "merge":
      if (!graph.branches[command.branch]) {
        return {
          valid: false,
          error: `Branch "${command.branch}" does not exist`,
        };
      }
      if (graph.head.type === "detached") {
        return { valid: false, error: "Cannot merge in detached HEAD state" };
      }
      break;
    case "rebase":
      if (!graph.branches[command.onto]) {
        return {
          valid: false,
          error: `Branch "${command.onto}" does not exist`,
        };
      }
      if (graph.head.type === "detached") {
        return {
          valid: false,
          error: "Cannot rebase in detached HEAD state",
        };
      }
      break;
  }
  return { valid: true };
}
