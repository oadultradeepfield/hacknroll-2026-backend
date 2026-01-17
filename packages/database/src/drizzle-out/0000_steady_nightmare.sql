-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `users` (
	`id` text PRIMARY KEY,
	`username` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT "games_check_1" CHECK(status IN ('in_progress', 'completed', 'abandoned')
);
--> statement-breakpoint
CREATE UNIQUE INDEX `username_idx` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `puzzles` (
	`id` text PRIMARY KEY,
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
CREATE UNIQUE INDEX `puzzles_date_idx` ON `puzzles` (`date`);--> statement-breakpoint
CREATE TABLE `games` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`puzzle_id` text NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`commands_used` integer DEFAULT 0 NOT NULL,
	`score` integer,
	`started_at` integer DEFAULT (unixepoch()) NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`puzzle_id`) REFERENCES `puzzles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "games_check_1" CHECK(status IN ('in_progress', 'completed', 'abandoned')
);
--> statement-breakpoint
CREATE INDEX `games_status_idx` ON `games` (`status`);--> statement-breakpoint
CREATE INDEX `games_puzzle_id_idx` ON `games` (`puzzle_id`);--> statement-breakpoint
CREATE INDEX `games_user_id_idx` ON `games` (`user_id`);--> statement-breakpoint
CREATE TABLE `leaderboard` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`leaderboard_date` text NOT NULL,
	`user_id` text NOT NULL,
	`rank` integer NOT NULL,
	`score` integer NOT NULL,
	`games_played` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "games_check_1" CHECK(status IN ('in_progress', 'completed', 'abandoned')
);
--> statement-breakpoint
CREATE INDEX `leaderboard_user_date_idx` ON `leaderboard` (`user_id`,`leaderboard_date`);--> statement-breakpoint
CREATE INDEX `leaderboard_date_rank_idx` ON `leaderboard` (`leaderboard_date`,`rank`);--> statement-breakpoint
CREATE TABLE `user_stats` (
	`user_id` text PRIMARY KEY,
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

*/