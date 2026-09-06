CREATE TABLE `church_branches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`churchId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`code` varchar(32) NOT NULL,
	`city` varchar(120),
	`pastorName` varchar(160),
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `church_branches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `churches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(180) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'ZAR',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `churches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_branch_access` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`branchId` int NOT NULL,
	`accessLevel` enum('pastor','manager','overseer') NOT NULL DEFAULT 'manager',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_branch_access_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','overseer') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `attendance_declarations` ADD `branchId` int;--> statement-breakpoint
ALTER TABLE `church_members` ADD `branchId` int;--> statement-breakpoint
ALTER TABLE `church_projects` ADD `branchId` int;--> statement-breakpoint
ALTER TABLE `communication_campaigns` ADD `branchId` int;--> statement-breakpoint
ALTER TABLE `member_notifications` ADD `branchId` int;--> statement-breakpoint
ALTER TABLE `prayer_requests` ADD `branchId` int;--> statement-breakpoint
ALTER TABLE `project_contributions` ADD `branchId` int;--> statement-breakpoint
ALTER TABLE `sermons` ADD `branchId` int;--> statement-breakpoint
ALTER TABLE `testimonies` ADD `branchId` int;