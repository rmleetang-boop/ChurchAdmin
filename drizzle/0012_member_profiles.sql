CREATE TABLE `member_profiles` (
	`user_id` int NOT NULL,
	`full_name` varchar(160) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`birth_date` varchar(10) NOT NULL,
	`address` varchar(350) NOT NULL,
	`household` varchar(32) NOT NULL,
	`household_size` int,
	CONSTRAINT `member_profiles_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
ALTER TABLE `member_profiles` ADD CONSTRAINT `member_profiles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;