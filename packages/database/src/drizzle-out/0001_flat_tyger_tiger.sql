PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT "games_check_1" CHECK(status IN ('in_progress', 'completed', 'abandoned')
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "username", "created_at") SELECT "id", "username", "created_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `username_idx` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `__new_puzzles` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text,
	`difficulty_level` integer NOT NULL,
	`file_targets` text NOT NULL,
	`constraints` text NOT NULL,
	`solution` text NOT NULL,
	`par_score` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT "games_check_1" CHECK(status IN ('in_progress', 'completed', 'abandoned')
);
--> statement-breakpoint
INSERT INTO `__new_puzzles`("id", "date", "difficulty_level", "file_targets", "constraints", "solution", "par_score", "created_at") SELECT "id", "date", "difficulty_level", "file_targets", "constraints", "solution", "par_score", "created_at" FROM `puzzles`;--> statement-breakpoint
DROP TABLE `puzzles`;--> statement-breakpoint
ALTER TABLE `__new_puzzles` RENAME TO `puzzles`;--> statement-breakpoint
CREATE UNIQUE INDEX `puzzles_date_idx` ON `puzzles` (`date`);--> statement-breakpoint
CREATE TABLE `__new_games` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`puzzle_id` text NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`commands_used` integer DEFAULT 0 NOT NULL,
	`score` integer,
	`started_at` integer DEFAULT (unixepoch()) NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`puzzle_id`) REFERENCES `puzzles`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "games_check_1" CHECK(status IN ('in_progress', 'completed', 'abandoned')
);
--> statement-breakpoint
INSERT INTO `__new_games`("id", "user_id", "puzzle_id", "status", "commands_used", "score", "started_at", "completed_at") SELECT "id", "user_id", "puzzle_id", "status", "commands_used", "score", "started_at", "completed_at" FROM `games`;--> statement-breakpoint
DROP TABLE `games`;--> statement-breakpoint
ALTER TABLE `__new_games` RENAME TO `games`;--> statement-breakpoint
CREATE INDEX `games_status_idx` ON `games` (`status`);--> statement-breakpoint
CREATE INDEX `games_puzzle_id_idx` ON `games` (`puzzle_id`);--> statement-breakpoint
CREATE INDEX `games_user_id_idx` ON `games` (`user_id`);--> statement-breakpoint
CREATE TABLE `__new_leaderboard` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`leaderboard_date` text NOT NULL,
	`user_id` text NOT NULL,
	`rank` integer NOT NULL,
	`score` integer NOT NULL,
	`games_played` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "games_check_1" CHECK(status IN ('in_progress', 'completed', 'abandoned')
);
--> statement-breakpoint
INSERT INTO `__new_leaderboard`("id", "leaderboard_date", "user_id", "rank", "score", "games_played") SELECT "id", "leaderboard_date", "user_id", "rank", "score", "games_played" FROM `leaderboard`;--> statement-breakpoint
DROP TABLE `leaderboard`;--> statement-breakpoint
ALTER TABLE `__new_leaderboard` RENAME TO `leaderboard`;--> statement-breakpoint
CREATE INDEX `leaderboard_user_date_idx` ON `leaderboard` (`user_id`,`leaderboard_date`);--> statement-breakpoint
CREATE INDEX `leaderboard_date_rank_idx` ON `leaderboard` (`leaderboard_date`,`rank`);--> statement-breakpoint
CREATE TABLE `__new_user_stats` (
	`user_id` text PRIMARY KEY NOT NULL,
	`total_games_played` integer DEFAULT 0 NOT NULL,
	`total_games_won` integer DEFAULT 0 NOT NULL,
	`total_commands_used` integer DEFAULT 0 NOT NULL,
	`best_score` integer,
	`average_score` real,
	`current_streak` integer DEFAULT 0 NOT NULL,
	`max_streak` integer DEFAULT 0 NOT NULL,
	`last_played_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "games_check_1" CHECK(status IN ('in_progress', 'completed', 'abandoned')
);
--> statement-breakpoint
INSERT INTO `__new_user_stats`("user_id", "total_games_played", "total_games_won", "total_commands_used", "best_score", "average_score", "current_streak", "max_streak", "last_played_at") SELECT "user_id", "total_games_played", "total_games_won", "total_commands_used", "best_score", "average_score", "current_streak", "max_streak", "last_played_at" FROM `user_stats`;--> statement-breakpoint
DROP TABLE `user_stats`;--> statement-breakpoint
ALTER TABLE `__new_user_stats` RENAME TO `user_stats`;