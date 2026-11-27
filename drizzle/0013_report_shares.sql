CREATE TABLE `report_shares` (
	`id` varchar(36) NOT NULL,
	`source` varchar(40) NOT NULL,
	`kind` enum('department','email') NOT NULL,
	`recipient` varchar(254) NOT NULL,
	CONSTRAINT `report_shares_id` PRIMARY KEY(`id`),
	CONSTRAINT `report_share_recipient` UNIQUE(`source`,`kind`,`recipient`)
);
