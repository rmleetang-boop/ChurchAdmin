CREATE TABLE `attendance_declarations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`serviceDate` timestamp NOT NULL,
	`response` enum('attending','online','not_attending','undecided') NOT NULL DEFAULT 'undecided',
	`source` enum('app','email','whatsapp','leader') NOT NULL DEFAULT 'app',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attendance_declarations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `church_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`phone` varchar(32),
	`whatsappOptIn` int NOT NULL DEFAULT 1,
	`emailOptIn` int NOT NULL DEFAULT 1,
	`status` enum('visitor','member','leader','inactive') NOT NULL DEFAULT 'visitor',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `church_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `church_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(160) NOT NULL,
	`description` text,
	`targetAmount` int NOT NULL,
	`raisedAmount` int NOT NULL DEFAULT 0,
	`paymentLink` varchar(500),
	`leaderId` int NOT NULL,
	`status` enum('draft','active','completed','archived') NOT NULL DEFAULT 'active',
	`deadline` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `church_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communication_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(160) NOT NULL,
	`body` text NOT NULL,
	`channel` enum('email','whatsapp','both') NOT NULL DEFAULT 'both',
	`audience` varchar(120) NOT NULL DEFAULT 'active_members',
	`paymentLink` varchar(500),
	`scheduledFor` timestamp,
	`sentAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communication_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_contributions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`memberId` int,
	`contributorName` varchar(160),
	`amount` int NOT NULL,
	`reference` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_contributions_id` PRIMARY KEY(`id`)
);
