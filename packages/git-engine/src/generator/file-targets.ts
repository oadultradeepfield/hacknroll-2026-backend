import type { FileTarget, PuzzleConstraints } from "@repo/shared";
import type { SeededRandom } from "./seeded-random";

export const FILE_NAMES = [
  "README.md",
  "index.ts",
  "config.json",
  "utils.ts",
  "api.ts",
  "types.ts",
  "database.ts",
  "auth.ts",
  "routes.ts",
  "middleware.ts",
];

export function generateFileTargets(
  numFiles: number,
  constraints: PuzzleConstraints,
  maxDepth: number,
  random: SeededRandom,
): FileTarget[] {
  const targets: FileTarget[] = [];
  const usedPositions = new Set<string>();
  const shuffledFileNames = random.shuffle([...FILE_NAMES]);
  const branches = constraints.allowedBranches;

  for (let i = 0; i < numFiles && i < shuffledFileNames.length; i++) {
    const target = tryGenerateFileTarget(
      shuffledFileNames[i],
      branches,
      maxDepth,
      random,
      usedPositions,
    );

    if (target) {
      targets.push(target);
    }
  }

  return targets;
}

function tryGenerateFileTarget(
  fileName: string,
  branches: string[],
  maxDepth: number,
  random: SeededRandom,
  usedPositions: Set<string>,
): FileTarget | null {
  const maxAttempts = 50;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const branch = random.pick(branches);
    const depth = random.nextInt(1, maxDepth);
    const positionKey = `${branch}:${depth}`;

    if (!usedPositions.has(positionKey)) {
      usedPositions.add(positionKey);
      return {
        branch,
        depth,
        fileName,
        collected: false,
      };
    }
  }

  return null;
}
