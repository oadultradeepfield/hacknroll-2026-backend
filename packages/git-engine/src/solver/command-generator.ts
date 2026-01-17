import type {
  BranchCommand,
  CheckoutCommand,
  Command,
  CommitCommand,
  GitGraph,
  MergeCommand,
  PuzzleConstraints,
  RebaseCommand,
} from "@repo/shared";

export function generatePossibleCommands(
  graph: GitGraph,
  constraints: PuzzleConstraints,
  commandCounts: Record<string, number>,
): Command[] {
  const commands: Command[] = [];

  // Generate commit commands
  commands.push(...generateCommitCommands(commandCounts, constraints));

  // Generate branch commands
  commands.push(...generateBranchCommands(graph, constraints));

  // Generate checkout commands
  commands.push(...generateCheckoutCommands(graph, commandCounts, constraints));

  // Generate merge commands (only when HEAD is attached)
  commands.push(...generateMergeCommands(graph));

  // Generate rebase commands (only when HEAD is attached)
  commands.push(...generateRebaseCommands(graph));

  return commands;
}

function generateCommitCommands(
  commandCounts: Record<string, number>,
  constraints: PuzzleConstraints,
): CommitCommand[] {
  const commands: CommitCommand[] = [];

  if (commandCounts.commit < constraints.maxCommits) {
    commands.push({ type: "commit", message: "wip" });
  }

  return commands;
}

function generateBranchCommands(
  graph: GitGraph,
  constraints: PuzzleConstraints,
): BranchCommand[] {
  const commands: BranchCommand[] = [];

  for (const branchName of constraints.allowedBranches) {
    if (!graph.branches[branchName]) {
      commands.push({ type: "branch", name: branchName });
    }
  }

  return commands;
}

function generateCheckoutCommands(
  graph: GitGraph,
  commandCounts: Record<string, number>,
  constraints: PuzzleConstraints,
): CheckoutCommand[] {
  const commands: CheckoutCommand[] = [];

  if (commandCounts.checkout < constraints.maxCheckouts) {
    for (const branchName of Object.keys(graph.branches)) {
      if (graph.head.type !== "attached" || graph.head.ref !== branchName) {
        commands.push({ type: "checkout", target: branchName });
      }
    }
  }

  return commands;
}

function generateMergeCommands(graph: GitGraph): MergeCommand[] {
  const commands: MergeCommand[] = [];

  if (graph.head.type === "attached") {
    const currentBranch = graph.head.ref;

    for (const branchName of Object.keys(graph.branches)) {
      if (branchName !== currentBranch) {
        commands.push({ type: "merge", branch: branchName });
      }
    }
  }

  return commands;
}

function generateRebaseCommands(graph: GitGraph): RebaseCommand[] {
  const commands: RebaseCommand[] = [];

  if (graph.head.type === "attached") {
    const currentBranch = graph.head.ref;

    for (const branchName of Object.keys(graph.branches)) {
      if (branchName !== currentBranch) {
        commands.push({ type: "rebase", onto: branchName });
      }
    }
  }

  return commands;
}
