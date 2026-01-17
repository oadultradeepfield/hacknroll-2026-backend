import type { Commit, GitGraph } from "@repo/shared";

export function cloneGraph(graph: GitGraph): GitGraph {
  return structuredClone(graph);
}

export function getCurrentCommitId(graph: GitGraph): string {
  if (graph.head.type === "attached") {
    return graph.branches[graph.head.ref].tipCommitId;
  }
  return graph.head.ref;
}

export function isAncestor(
  graph: GitGraph,
  ancestorId: string,
  descendantId: string,
): boolean {
  const visited = new Set<string>();
  const queue = [descendantId];

  while (queue.length > 0) {
    // biome-ignore lint/style/noNonNullAssertion: queue is guaranteed to have elements due to while condition check
    const currentId = queue.shift()!;
    if (currentId === ancestorId) return true;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const commit = graph.commits[currentId];
    if (commit) {
      queue.push(...commit.parents);
    }
  }

  return false;
}

export function findCommonAncestor(
  graph: GitGraph,
  commitId1: string,
  commitId2: string,
): string | null {
  const ancestors1 = getAllAncestors(graph, commitId1);
  const queue = [commitId2];
  const visited = new Set<string>();

  while (queue.length > 0) {
    // biome-ignore lint/style/noNonNullAssertion: queue is guaranteed to have elements due to while condition check
    const currentId = queue.shift()!;
    if (ancestors1.has(currentId)) return currentId;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const commit = graph.commits[currentId];
    if (commit) {
      queue.push(...commit.parents);
    }
  }

  return null;
}

export function getAllAncestors(
  graph: GitGraph,
  commitId: string,
): Set<string> {
  const ancestors = new Set<string>();
  const queue = [commitId];

  while (queue.length > 0) {
    // biome-ignore lint/style/noNonNullAssertion: queue is guaranteed to have elements due to while condition check
    const currentId = queue.shift()!;
    if (ancestors.has(currentId)) continue;
    ancestors.add(currentId);

    const commit = graph.commits[currentId];
    if (commit) {
      queue.push(...commit.parents);
    }
  }

  return ancestors;
}

export function getCommitsBetween(
  graph: GitGraph,
  ancestorId: string,
  descendantId: string,
): Commit[] {
  const commits: Commit[] = [];
  const visited = new Set<string>();

  const collectCommits = (commitId: string): void => {
    if (commitId === ancestorId || visited.has(commitId)) return;
    visited.add(commitId);

    const commit = graph.commits[commitId];
    if (!commit) return;

    for (const parentId of commit.parents) {
      collectCommits(parentId);
    }

    commits.push(commit);
  };

  collectCommits(descendantId);
  return commits;
}
