CREATE TABLE `department_feature_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`departmentId` int NOT NULL,
	`title` varchar(120) NOT NULL,
	`description` text NOT NULL,
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`status` enum('submitted','in_review','planned','in_progress','delivered') NOT NULL DEFAULT 'submitted',
	`teamNotes` text,
	`requestedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `department_feature_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `departments` ADD `description` text;--> statement-breakpoint
ALTER TABLE `department_feature_requests` ADD CONSTRAINT `department_feature_requests_departmentId_departments_id_fk` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE cascade ON UPDATE no action;