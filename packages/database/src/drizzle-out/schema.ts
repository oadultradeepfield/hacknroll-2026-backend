import {
  sqliteTable,
  AnySQLiteColumn,
  uniqueIndex,
  check,
  text,
  integer,
  foreignKey,
  real,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable(
  "users",
  {
    id: text().primaryKey(),
    username: text(),
    createdAt: integer("created_at")
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("username_idx").on(table.username),
    check("games_check_1", sql`status IN ('in_progress', 'completed'`),
  ],
);

export const puzzles = sqliteTable(
  "puzzles",
  {
    id: text().primaryKey(),
    date: text(),
    difficultyLevel: integer("difficulty_level").notNull(),
    fileTargets: text("file_targets").notNull(),
    constraints: text().notNull(),
    solution: text().notNull(),
    parScore: integer("par_score").notNull(),
    createdAt: integer("created_at")
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("puzzles_date_idx").on(table.date),
    check("games_check_1", sql`status IN ('in_progress', 'completed'`),
  ],
);

export const userStats = sqliteTable(
  "user_stats",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => users.id),
    totalGamesPlayed: integer("total_games_played").default(0).notNull(),
    totalGamesWon: integer("total_games_won").default(0).notNull(),
    totalCommandsUsed: integer("total_commands_used").default(0).notNull(),
    bestScore: integer("best_score"),
    averageScore: real("average_score"),
    currentStreak: integer("current_streak").default(0).notNull(),
    maxStreak: integer("max_streak").default(0).notNull(),
    lastPlayedAt: integer("last_played_at"),
  },
  (table) => [
    check("games_check_1", sql`status IN ('in_progress', 'completed'`),
  ],
);

export const games = sqliteTable(
  "games",
  {
    id: text().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    puzzleId: text("puzzle_id")
      .notNull()
      .references(() => puzzles.id),
    status: text().default("in_progress").notNull(),
    commandsUsed: integer("commands_used").default(0).notNull(),
    score: integer(),
    startedAt: integer("started_at")
      .default(sql`(unixepoch())`)
      .notNull(),
    completedAt: integer("completed_at"),
  },
  (table) => [
    check("games_check_1", sql`status IN ('in_progress', 'completed'`),
  ],
);

export const leaderboard = sqliteTable(
  "leaderboard",
  {
    id: text().primaryKey(),
    leaderboardDate: integer("leaderboard_date")
      .default(sql`(unixepoch())`)
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    rank: integer().notNull(),
    score: integer().notNull(),
    gamesPlayed: integer("games_played").notNull(),
  },
  (table) => [
    check("games_check_1", sql`status IN ('in_progress', 'completed'`),
  ],
);
