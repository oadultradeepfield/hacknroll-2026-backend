PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_leaderboard` (
	`id` text PRIMARY KEY NOT NULL,
	`leaderboard_date` integer DEFAULT (unixepoch()) NOT NULL,
	`user_id` text NOT NULL,
	`rank` integer NOT NULL,
	`score` integer NOT NULL,
	`games_played` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "games_check_1" CHECK(status IN ('in_progress', 'completed')
);
--> statement-breakpoint
INSERT INTO `__new_leaderboard`("id", "leaderboard_date", "user_id", "rank", "score", "games_played") SELECT "id", "leaderboard_date", "user_id", "rank", "score", "games_played" FROM `leaderboard`;--> statement-breakpoint
DROP TABLE `leaderboard`;--> statement-breakpoint
ALTER TABLE `__new_leaderboard` RENAME TO `leaderboard`;--> statement-breakpoint
PRAGMA foreign_keys=ON;