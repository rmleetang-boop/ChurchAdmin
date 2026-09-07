CREATE TABLE `departments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`leadName` varchar(160),
	`memberCount` int NOT NULL DEFAULT 0,
	`color` varchar(16) NOT NULL DEFAULT '#6958d9',
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `departments_id` PRIMARY KEY(`id`)
);
