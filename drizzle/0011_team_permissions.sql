CREATE TABLE `ministry_access` (
	`id` varchar(36) NOT NULL,
	`scope` varchar(40) NOT NULL,
	`email` varchar(254) NOT NULL,
	`role` varchar(20) NOT NULL,
	`open_id` varchar(64),
	`invitation_hash` varchar(64),
	CONSTRAINT `ministry_access_id` PRIMARY KEY(`id`),
	CONSTRAINT `ministry_scope_email` UNIQUE(`scope`,`email`)
);
--> statement-breakpoint
ALTER TABLE `ministry_reports` ADD `report_status` enum('draft','submitted') DEFAULT 'submitted' NOT NULL;--> statement-breakpoint
CREATE INDEX `ministry_identity` ON `ministry_access` (`open_id`);