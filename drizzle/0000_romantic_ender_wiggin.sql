CREATE TABLE `monitor_events` (
	`id` text PRIMARY KEY NOT NULL,
	`building_id` text NOT NULL,
	`kind` text NOT NULL,
	`message` text NOT NULL,
	`observed_at` text NOT NULL,
	`reviewed` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_monitor_events_observed_at` ON `monitor_events` (`observed_at`);--> statement-breakpoint
CREATE TABLE `monitor_state` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`checked_at` text NOT NULL,
	`last_attempt` text,
	`warning` text,
	`lease_until` integer DEFAULT 0 NOT NULL,
	`feed_read_at` integer DEFAULT 0 NOT NULL
);
