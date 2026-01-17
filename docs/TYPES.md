# TypeScript Types Reference

This document provides the structural definitions for the Gitty API. These types are exported from the `@repo/shared` package.

## Core Models

### GameState

The fundamental representation of the virtual Git environment.

```typescript
interface GameState {
  commits: Commit[];
  /** Mapping of branch names to their target commit IDs */
  branches: Record<string, string>;
  /** The current commit ID pointed to by HEAD */
  head: string;
  /** The currently active branch name, or null if in detached HEAD state */
  currentBranch: string | null;
}

interface Commit {
  id: string;
  message: string;
  parents: string[]; // List of parent commit IDs
  timestamp: number; // Unix timestamp
}
```

### Puzzle

The definition of a game challenge, including the objective and difficulty.

```typescript
interface Puzzle {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  initialState: GameState;
  targetState: GameState;
  parScore: number;
  hints: string[];
  solution: PuzzleSolution;
  createdAt: string; // ISO 8601
}
```

## Command Types

The API uses a **Discriminated Union** for commands. Each command is identified by its `type` property.

```typescript
type Command =
  | CommitCommand
  | BranchCommand
  | CheckoutCommand
  | MergeCommand
  | RebaseCommand
  | UndoCommand;

interface CommitCommand {
  type: "commit";
  message: string;
}
interface BranchCommand {
  type: "branch";
  name: string;
}
interface CheckoutCommand {
  type: "checkout";
  target: string;
}
interface MergeCommand {
  type: "merge";
  branch: string;
}
interface RebaseCommand {
  type: "rebase";
  onto: string;
}
interface UndoCommand {
  type: "undo";
}
```

## API Request & Response Types

### User Management

```typescript
interface UserProfileResponse {
  id: string;
  username: string | null;
  createdAt: string;
}

interface SetNameRequest {
  username: string;
}
```

### Game Sessions

```typescript
interface StartGameResponse {
  success: boolean;
  gameState?: GameState;
  puzzle?: Puzzle;
  isCompleted?: boolean;
  rewards?: GameRewards;
  error?: string;
}

interface GameRewards {
  score: number;
  parScore: number;
  commandsUsed: number;
  performance: "under_par" | "at_par" | "over_par";
  bonusPoints: number;
  optimalSolution: {
    commands: Command[];
    explanation: string;
  };
}
```

### Stats & Leaderboards

```typescript
interface UserStats {
  userId: string;
  totalScore: number;
  gamesPlayed: number;
  gamesCompleted: number;
  perfectScores: number;
  currentStreak: number;
  bestStreak: number;
  averageCommands: number;
  lastPlayedAt: string | null;
}

interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  userRank?: number;
  userEntry?: LeaderboardEntry;
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  gamesPlayed: number;
}
```

## Validation & Formatting

### Date Strings

All date fields (e.g., `createdAt`, `completedAt`) follow the **ISO 8601** standard:
`YYYY-MM-DDTHH:mm:ss.sssZ`

### Common Response Pattern

Most mutation endpoints (POST/PUT) follow a standard success/error pattern:

```typescript
interface BaseResponse {
  success: boolean;
  error?: string; // Brief error identifier
  message?: string; // Human-readable details (primarily for 500 errors)
}
```
