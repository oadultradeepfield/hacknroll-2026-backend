export const DAILY_PUZZLE_KEY_PREFIX = "puzzle:";
export const LEADERBOARD_KEY_PREFIX = "leaderboard:";
export const USER_SESSION_KEY_PREFIX = "session:";

export const MAX_UNDO_STACK_SIZE = 50;
export const MAX_COMMANDS_PER_GAME = 100;
export const STALE_SESSION_HOURS = 24;

export const DIFFICULTY_LEVELS = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 7,
} as const;

export const DEFAULT_CONSTRAINTS: Record<
  number,
  { maxCommits: number; maxCheckouts: number; maxBranches: number }
> = {
  1: { maxCommits: 10, maxCheckouts: 8, maxBranches: 2 },
  2: { maxCommits: 15, maxCheckouts: 10, maxBranches: 3 },
  3: { maxCommits: 18, maxCheckouts: 12, maxBranches: 3 },
  4: { maxCommits: 22, maxCheckouts: 15, maxBranches: 4 },
  5: { maxCommits: 26, maxCheckouts: 18, maxBranches: 4 },
  6: { maxCommits: 32, maxCheckouts: 22, maxBranches: 5 },
  7: { maxCommits: 40, maxCheckouts: 28, maxBranches: 5 },
};

export const ALLOWED_BRANCHES = [
  "main",
  "feature-a",
  "feature-b",
  "feature-c",
  "feature-d",
  "hotfix",
  "develop",
];

export const LEADERBOARD_SIZE = 50;

export const SCORING = {
  BASE_COMPLETION: 100,
  UNDER_PAR_BONUS_PER_COMMAND: 20,
  AT_PAR_BONUS: 50,
  OVER_PAR_PENALTY_PER_COMMAND: 5,
  STREAK_BONUS_PER_DAY: 10,
  MAX_STREAK_BONUS: 100,
} as const;
