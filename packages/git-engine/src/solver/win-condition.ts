import type { FileTarget, GitGraph } from "@repo/shared";
import type { GitEngine } from "../engine";

export function isWinState(
  engine: GitEngine,
  fileTargets: FileTarget[],
): boolean {
  const collectedFiles = engine.getCollectedFiles();
  const graph = engine.getGraph();

  // Must have collected all files
  if (collectedFiles.length !== fileTargets.length) {
    return false;
  }

  // HEAD must be attached to main branch
  if (graph.head.type !== "attached" || graph.head.ref !== "main") {
    return false;
  }

  // All file targets must be reachable from main's tip
  // This ensures files from feature branches have been merged/rebased into main
  for (const target of fileTargets) {
    if (!isFileReachableFromMain(graph, target)) {
      return false;
    }
  }

  // Must have performed at least one merge or rebase operation
  // This prevents trivial solutions where files are only on main
  const hasMerge = hasMultipleParentCommit(graph);
  const hasRebase = engine.getCommandCounts().rebase > 0;

  return hasMerge || hasRebase;
}

/**
 * Checks if a file target is reachable from the main branch tip.
 * A file is reachable if its target commit (identified by branch + depth)
 * is an ancestor of main's tip commit.
 */
function isFileReachableFromMain(graph: GitGraph, target: FileTarget): boolean {
  const mainBranch = graph.branches.main;
  if (!mainBranch) {
    return false;
  }

  const mainTipId = mainBranch.tipCommitId;

  // Find the commit that matches the target's branch and depth
  const targetCommitId = findCommitByBranchAndDepth(
    graph,
    target.branch,
    target.depth,
  );

  if (!targetCommitId) {
    return false;
  }

  // Check if target commit is an ancestor of main's tip
  const ancestors = getAllAncestors(graph, mainTipId);
  return ancestors.has(targetCommitId);
}

/**
 * Finds a commit ID by its original branch and depth.
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
 * Gets all ancestor commit IDs (inclusive of the starting commit).
 */
function getAllAncestors(graph: GitGraph, commitId: string): Set<string> {
  const ancestors = new Set<string>();
  const queue = [commitId];

  while (queue.length > 0) {
    const curr = queue.shift();
    if (curr === undefined) continue;
    if (ancestors.has(curr)) continue;
    ancestors.add(curr);

    const commit = graph.commits[curr];
    if (commit) {
      queue.push(...commit.parents);
    }
  }

  return ancestors;
}

/**
 * Checks if the graph contains any merge commits (commits with multiple parents).
 * This indicates a merge operation was performed.
 */
function hasMultipleParentCommit(graph: GitGraph): boolean {
  return Object.values(graph.commits).some(
    (commit) => commit.parents.length > 1,
  );
}
