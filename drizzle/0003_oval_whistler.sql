CREATE TABLE `sermons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(180) NOT NULL,
	`preacher` varchar(160) NOT NULL,
	`serviceDate` timestamp NOT NULL,
	`audioUrl` varchar(500),
	`videoUrl` varchar(500),
	`transcript` text,
	`highlights` text,
	`status` enum('recorded','transcribing','ready','distributed') NOT NULL DEFAULT 'recorded',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sermons_id` PRIMARY KEY(`id`)
);
