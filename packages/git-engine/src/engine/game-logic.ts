import type { FileTarget, GitGraph } from "@repo/shared";
import { getAllAncestors, getCurrentCommitId } from "./graph-operations";

/**
 * Finds the commit ID that matches a file target (branch + depth).
 * Returns null if no matching commit is found.
 */
function findCommitByBranchAndDepth(
  graph: GitGraph,
  branch: string,
  depth: number,
): string | null {
  for (const [commitId, commit] of Object.entries(graph.commits)) {
    if (commit.branch === branch && commit.depth === depth) {
      return commitId;
    }
  }
  return null;
}

/**
 * Checks if a file target is reachable from the current position.
 * A file is collectible if:
 * 1. The target commit (identified by branch + depth) exists in the graph
 * 2. The target commit is an ancestor of (or equal to) the current commit
 *    (meaning we've "passed through" or are at that point in history)
 */
function isFileReachable(
  graph: GitGraph,
  currentCommitId: string,
  target: FileTarget,
): boolean {
  // Find the commit that matches the target's branch and depth
  const targetCommitId = findCommitByBranchAndDepth(
    graph,
    target.branch,
    target.depth,
  );

  if (!targetCommitId) {
    return false;
  }

  // Check if the target commit is reachable from current position
  // (i.e., target is an ancestor of current, or they are the same)
  const ancestors = getAllAncestors(graph, currentCommitId);
  return ancestors.has(targetCommitId);
}

/**
 * Checks and collects files based on current git position.
 * Files are collected when their target commit is reachable from the current position.
 * Once collected, files stay collected (handled by checking collectedFiles set).
 */
export function checkFileCollection(
  graph: GitGraph,
  fileTargets: FileTarget[],
  collectedFiles: Set<string>,
): void {
  const currentCommitId = getCurrentCommitId(graph);

  for (const target of fileTargets) {
    // Skip already collected files
    if (collectedFiles.has(target.fileName)) continue;

    // Collect if the target commit is reachable from current position
    if (isFileReachable(graph, currentCommitId, target)) {
      collectedFiles.add(target.fileName);
    }
  }
}

/**
 * Checks if the win condition is met:
 * 1. All files must be collected
 * 2. HEAD must be attached to main branch
 */
export function checkWinCondition(
  graph: GitGraph,
  fileTargets: FileTarget[],
  collectedFiles: Set<string>,
): boolean {
  if (collectedFiles.size !== fileTargets.length) {
    return false;
  }

  if (graph.head.type !== "attached" || graph.head.ref !== "main") {
    return false;
  }

  return true;
}
