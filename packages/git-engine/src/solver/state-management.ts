import type { SolverState } from "../types";

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

export function cloneGraph<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
