import type { SolverState } from "../types";

export { cloneGraph } from "../engine/graph-operations";

export function getStateKey(state: SolverState): string {
  const graph = state.graph;

  const branchTips = Object.entries(graph.branches)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, branch]) => `${name}:${branch.tipCommitId}`)
    .join(",");

  const head =
    graph.head.type === "attached"
      ? `a:${graph.head.ref}`
      : `d:${graph.head.ref}`;

  const files = Array.from(state.collectedFiles).sort().join(",");

  return `${branchTips}|${head}|${files}`;
}
