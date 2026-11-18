CREATE TABLE `ministry_reports` (
	`report_key` varchar(36) NOT NULL,
	`team` varchar(40) NOT NULL,
	`report_day` varchar(10) NOT NULL,
	`author` int NOT NULL,
	`activity` varchar(200) NOT NULL,
	`details` text NOT NULL,
	`needs` text NOT NULL,
	`next_action` text NOT NULL,
	`received_cents` int NOT NULL,
	`spent_cents` int NOT NULL,
	CONSTRAINT `ministry_reports_report_key` PRIMARY KEY(`report_key`)
);
--> statement-breakpoint
CREATE INDEX `idx_ministry_reports_month` ON `ministry_reports` (`report_day`,`team`);