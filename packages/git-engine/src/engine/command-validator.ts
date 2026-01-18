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
      if (!graph.branches[command.target] && !graph.commits[command.target]) {
        return { valid: false, error: `Target "${command.target}" not found` };
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
      if (graph.head.ref === command.branch) {
        return { valid: false, error: "Cannot merge a branch into itself" };
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
        return { valid: false, error: "Cannot rebase in detached HEAD state" };
      }
      if (graph.head.ref === command.onto) {
        return { valid: false, error: "Cannot rebase a branch onto itself" };
      }
      break;
  }
  return { valid: true };
}
