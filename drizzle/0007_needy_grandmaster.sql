CREATE TABLE `prayer_replies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`prayerRequestId` int NOT NULL,
	`leaderId` int NOT NULL,
	`leaderName` varchar(160),
	`message` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prayer_replies_id` PRIMARY KEY(`id`)
);
