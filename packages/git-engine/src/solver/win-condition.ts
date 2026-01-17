import type { FileTarget, GitGraph } from "@repo/shared";
import type { GitEngine } from "../engine";

export function isWinState(
  engine: GitEngine,
  fileTargets: FileTarget[],
): boolean {
  const collectedFiles = engine.getCollectedFiles();
  const graph = engine.getGraph();

  if (collectedFiles.length !== fileTargets.length) {
    return false;
  }

  if (graph.head.type !== "attached" || graph.head.ref !== "main") {
    return false;
  }

  const hasMerge = hasMultipleParentCommit(graph);
  const hasRebase = engine.getCommandCounts().rebase > 0;

  return hasMerge || hasRebase;
}

function hasMultipleParentCommit(graph: GitGraph): boolean {
  return Object.values(graph.commits).some(
    (commit) => commit.parents.length > 1,
  );
}
