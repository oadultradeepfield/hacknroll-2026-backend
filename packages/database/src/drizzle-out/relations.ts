import { relations } from "drizzle-orm/relations";
import { games, leaderboard, puzzles, userStats, users } from "./schema";

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, {
    fields: [userStats.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  userStats: many(userStats),
  games: many(games),
  leaderboards: many(leaderboard),
}));

export const gamesRelations = relations(games, ({ one }) => ({
  puzzle: one(puzzles, {
    fields: [games.puzzleId],
    references: [puzzles.id],
  }),
  user: one(users, {
    fields: [games.userId],
    references: [users.id],
  }),
}));

export const puzzlesRelations = relations(puzzles, ({ many }) => ({
  games: many(games),
}));

export const leaderboardRelations = relations(leaderboard, ({ one }) => ({
  user: one(users, {
    fields: [leaderboard.userId],
    references: [users.id],
  }),
}));
