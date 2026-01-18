import type { FileTarget, GitGraph } from "@repo/shared";
import { getCurrentCommitId } from "./graph-operations";

export function checkFileCollection(
  graph: GitGraph,
  fileTargets: FileTarget[],
  collectedFiles: Set<string>,
): void {
  const currentCommitId = getCurrentCommitId(graph);
  const currentCommit = graph.commits[currentCommitId];

  const currentBranch =
    graph.head.type === "attached" ? graph.head.ref : currentCommit.branch;

  for (const target of fileTargets) {
    if (collectedFiles.has(target.fileName)) continue;

    if (
      currentBranch === target.branch &&
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
): boolean {
  if (collectedFiles.size !== fileTargets.length) {
    return false;
  }

  if (graph.head.type !== "attached" || graph.head.ref !== "main") {
    return false;
  }

  return true;
}
