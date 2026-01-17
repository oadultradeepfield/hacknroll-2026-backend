import type {
  BranchCommand,
  CheckoutCommand,
  Commit,
  CommitCommand,
  GitGraph,
  MergeCommand,
  RebaseCommand,
} from "@repo/shared";
import { nanoid } from "nanoid";
import type { CommandResult } from "../types";
import {
  findCommonAncestor,
  getCommitsBetween,
  getCurrentCommitId,
  isAncestor,
} from "./graph-operations";

export function executeCommit(
  graph: GitGraph,
  command: CommitCommand,
): CommandResult {
  const currentCommitId = getCurrentCommitId(graph);
  const currentCommit = graph.commits[currentCommitId];

  const newCommitId = nanoid(8);
  const newDepth = currentCommit.depth + 1;
  const currentBranch =
    graph.head.type === "attached" ? graph.head.ref : currentCommit.branch;

  const newCommit: Commit = {
    id: newCommitId,
    message: command.message,
    parents: [currentCommitId],
    branch: currentBranch,
    depth: newDepth,
    timestamp: Date.now(),
  };

  graph.commits[newCommitId] = newCommit;

  if (graph.head.type === "attached") {
    graph.branches[graph.head.ref].tipCommitId = newCommitId;
  } else {
    graph.head.ref = newCommitId;
  }

  return { success: true };
}

export function executeBranch(
  graph: GitGraph,
  command: BranchCommand,
): CommandResult {
  const currentCommitId = getCurrentCommitId(graph);

  graph.branches[command.name] = {
    name: command.name,
    tipCommitId: currentCommitId,
  };

  return { success: true };
}

export function executeCheckout(
  graph: GitGraph,
  command: CheckoutCommand,
): CommandResult {
  const target = command.target;

  if (graph.branches[target]) {
    graph.head = {
      type: "attached",
      ref: target,
    };
  } else if (graph.commits[target]) {
    graph.head = {
      type: "detached",
      ref: target,
    };
  } else {
    return { success: false, error: `Target "${target}" not found` };
  }

  return { success: true };
}

export function executeMerge(
  graph: GitGraph,
  command: MergeCommand,
): CommandResult {
  const currentBranch = graph.head.ref;
  const currentCommitId = graph.branches[currentBranch].tipCommitId;
  const targetCommitId = graph.branches[command.branch].tipCommitId;

  // Check for fast-forward
  if (isAncestor(graph, currentCommitId, targetCommitId)) {
    graph.branches[currentBranch].tipCommitId = targetCommitId;
    return { success: true };
  }

  // Create merge commit
  const mergeCommitId = nanoid(8);
  const currentCommit = graph.commits[currentCommitId];

  const mergeCommit: Commit = {
    id: mergeCommitId,
    message: `Merge ${command.branch} into ${currentBranch}`,
    parents: [currentCommitId, targetCommitId],
    branch: currentBranch,
    depth: currentCommit.depth + 1,
    timestamp: Date.now(),
  };

  graph.commits[mergeCommitId] = mergeCommit;
  graph.branches[currentBranch].tipCommitId = mergeCommitId;

  return { success: true };
}

export function executeRebase(
  graph: GitGraph,
  command: RebaseCommand,
): CommandResult {
  const currentBranch = graph.head.ref;
  const currentCommitId = graph.branches[currentBranch].tipCommitId;
  const ontoCommitId = graph.branches[command.onto].tipCommitId;

  // Find common ancestor
  const commonAncestor = findCommonAncestor(
    graph,
    currentCommitId,
    ontoCommitId,
  );
  if (!commonAncestor) {
    return { success: false, error: "No common ancestor found" };
  }

  // Collect commits to rebase
  const commitsToRebase = getCommitsBetween(
    graph,
    commonAncestor,
    currentCommitId,
  );

  if (commitsToRebase.length === 0) {
    // Already up to date
    return { success: true };
  }

  // Replay commits onto target
  let parentId = ontoCommitId;
  const ontoCommit = graph.commits[ontoCommitId];
  let depth = ontoCommit.depth;

  for (const commit of commitsToRebase) {
    depth++;
    const newCommitId = nanoid(8);
    const newCommit: Commit = {
      id: newCommitId,
      message: commit.message,
      parents: [parentId],
      branch: currentBranch,
      depth: depth,
      timestamp: Date.now(),
    };
    graph.commits[newCommitId] = newCommit;
    parentId = newCommitId;
  }

  graph.branches[currentBranch].tipCommitId = parentId;

  return { success: true };
}
