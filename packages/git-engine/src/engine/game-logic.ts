import type { FileTarget, GitGraph } from "@repo/shared";
import { getCurrentCommitId } from "./graph-operations";

export function checkFileCollection(
  graph: GitGraph,
  fileTargets: FileTarget[],
  collectedFiles: Set<string>,
): void {
  const currentCommitId = getCurrentCommitId(graph);
  const currentCommit = graph.commits[currentCommitId];

  for (const target of fileTargets) {
    if (collectedFiles.has(target.fileName)) continue;

    if (
      currentCommit.branch === target.branch &&
      currentCommit.depth === target.depth
    ) {
      collectedFiles.add(target.fileName);
    }
  }
}

export function checkWinCondition(
  graph: GitGraph,
  fileTargets: FileTarget[],
  collectedFiles: Set<string>,
  commandCounts: Record<string, number>,
): boolean {
  if (collectedFiles.size !== fileTargets.length) {
    return false;
  }

  if (graph.head.type !== "attached" || graph.head.ref !== "main") {
    return false;
  }

  const hasMultipleParentCommit = Object.values(graph.commits).some(
    (commit) => commit.parents.length > 1,
  );

  return hasMultipleParentCommit || commandCounts.rebase > 0;
}
