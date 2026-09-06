CREATE TABLE `member_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`title` varchar(160) NOT NULL,
	`body` text NOT NULL,
	`type` enum('message','event','giving','care','system') NOT NULL DEFAULT 'message',
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `member_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prayer_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`title` varchar(160) NOT NULL,
	`request` text NOT NULL,
	`isPrivate` int NOT NULL DEFAULT 1,
	`status` enum('new','praying','answered','archived') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prayer_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testimonies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`title` varchar(160) NOT NULL,
	`story` text NOT NULL,
	`permissionToShare` int NOT NULL DEFAULT 0,
	`status` enum('submitted','reviewing','published','declined') NOT NULL DEFAULT 'submitted',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `testimonies_id` PRIMARY KEY(`id`)
);
